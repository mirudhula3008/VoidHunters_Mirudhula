const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const { buildEarningsSummary } = require('./earningsController');
const { detectIntent, INTENT_IDS } = require('../utils/assistantIntents');
const { asyncHandler, httpError } = require('../utils/http');

const MAX_MESSAGE = 500;
const ACTIVE = ['requested', 'accepted', 'in_progress'];

// A reply is a list of lines and links. Each line is a translation key plus its values,
// so the browser shows it in the person's own language.
const line = (key, vars) => ({ key: `assistant.replies.${key}`, vars });
const link = (to, label) => ({ to, label: `assistant.links.${label}` });

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

// The soonest upcoming active booking, or else the latest overdue one, so an active booking is always mentioned.
async function nextBooking(partyField, userId) {
  const otherParty = partyField === 'customerId' ? 'workerId' : 'customerId';
  const active = { [partyField]: userId, status: { $in: ACTIVE } };
  const upcoming = await Booking.findOne({ ...active, scheduledDate: { $gte: startOfToday() } })
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .populate(otherParty, 'name')
    .lean();
  if (upcoming) return upcoming;
  return Booking.findOne(active).sort({ scheduledDate: -1, scheduledTime: -1 }).populate(otherParty, 'name').lean();
}

const bookingVars = (booking, other) => ({
  service: booking.serviceName,
  name: other?.name || '—',
  scheduleDate: booking.scheduledDate,
  time: booking.scheduledTime,
  status: booking.status,
});

// ---------- customers ----------

async function customerBookings(user) {
  const [active, completed, next] = await Promise.all([
    Booking.countDocuments({ customerId: user._id, status: { $in: ACTIVE } }),
    Booking.countDocuments({ customerId: user._id, status: 'completed' }),
    nextBooking('customerId', user._id),
  ]);
  const lines = [line('customerBookings', { active, completed })];
  if (next) lines.push(line('customerNextBooking', bookingVars(next, next.workerId)));
  return { lines, links: [link('/bookings', 'myBookings')] };
}

async function customerPayments(user) {
  const [unpaid, [totals = {}], last, refunded] = await Promise.all([
    Booking.find({ customerId: user._id, status: { $in: ACTIVE }, paymentStatus: 'unpaid' }).select('agreedPrice').lean(),
    Payment.aggregate([{ $match: { customerId: user._id, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    Payment.findOne({ customerId: user._id, status: 'completed' }).sort({ completedAt: -1, createdAt: -1 }).lean(),
    Payment.countDocuments({ customerId: user._id, status: 'refunded' }),
  ]);

  const lines = [
    unpaid.length
      ? line('customerUnpaid', { count: unpaid.length, amount: unpaid.reduce((sum, b) => sum + b.agreedPrice, 0) })
      : line('customerNothingUnpaid'),
    line('customerTotalPaid', { amount: totals.total || 0 }),
  ];
  if (last) {
    lines.push(line('customerLastPayment', { amount: last.amount, method: last.method, date: last.completedAt || last.createdAt }));
  }
  if (refunded) lines.push(line('customerRefundCount', { count: refunded }));
  return { lines, links: [link('/bookings', 'myBookings')] };
}

async function customerRefunds(user) {
  const [[refunds = {}]] = await Promise.all([
    Payment.aggregate([
      { $match: { customerId: user._id, status: 'refunded' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
  ]);
  return {
    lines: [
      refunds.count ? line('customerRefunds', { count: refunds.count, amount: refunds.total }) : line('customerNoRefunds'),
      line('refundRule'),
    ],
    links: [link('/bookings', 'myBookings')],
  };
}

async function customerReviews(user) {
  const [written, reviewedIds, completed] = await Promise.all([
    Review.countDocuments({ customerId: user._id }),
    Review.find({ customerId: user._id }).distinct('bookingId'),
    Booking.countDocuments({ customerId: user._id, status: 'completed' }),
  ]);
  const waiting = await Booking.countDocuments({ customerId: user._id, status: 'completed', _id: { $nin: reviewedIds } });
  return {
    lines: [line('customerReviews', { written, waiting, completed })],
    links: [link('/bookings', 'myBookings')],
  };
}

const customerEarnings = async (user) => {
  const [[totals = {}]] = await Promise.all([
    Payment.aggregate([{ $match: { customerId: user._id, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
  ]);
  return { lines: [line('customerNoEarnings', { amount: totals.total || 0 })], links: [link('/bookings', 'myBookings')] };
};

async function customerDashboard(user) {
  const [bookings, payments, reviews] = await Promise.all([customerBookings(user), customerPayments(user), customerReviews(user)]);
  return {
    lines: [bookings.lines[0], payments.lines[0], reviews.lines[0]],
    links: [link('/dashboard', 'services'), link('/bookings', 'myBookings')],
  };
}

// ---------- workers ----------

async function workerBookings(user) {
  const [requested, inHand, next] = await Promise.all([
    Booking.countDocuments({ workerId: user._id, status: 'requested' }),
    Booking.countDocuments({ workerId: user._id, status: { $in: ['accepted', 'in_progress'] } }),
    nextBooking('workerId', user._id),
  ]);
  const lines = [line('workerBookings', { requested, inHand })];
  if (next) lines.push(line('workerNextJob', bookingVars(next, next.customerId)));
  return { lines, links: [link('/worker/dashboard', 'requests'), link('/worker/jobs', 'jobs')] };
}

async function workerEarnings(user) {
  const summary = await buildEarningsSummary(user);
  const { netEarnings: net, pendingPayouts, commissionRate, totalLifetime } = summary;
  return {
    lines: [
      line('workerEarnings', {
        todayAmount: net.today,
        weekAmount: net.thisWeek,
        monthAmount: net.thisMonth,
        lifetimeAmount: net.lifetime,
        jobs: totalLifetime.jobs,
      }),
      line('workerPayout', { amount: pendingPayouts, percent: Math.round(commissionRate * 100) }),
    ],
    links: [link('/worker/earnings', 'earnings')],
  };
}

async function workerPayments(user) {
  const earnings = await workerEarnings(user);
  const { awaitingCompletion } = await buildEarningsSummary(user);
  const lines = [...earnings.lines];
  if (awaitingCompletion.jobs) {
    lines.push(line('workerAwaiting', { amount: awaitingCompletion.amount, jobs: awaitingCompletion.jobs }));
  }
  return { lines, links: earnings.links };
}

async function workerReviews(user) {
  const latest = await Review.findOne({ workerId: user._id }).sort({ createdAt: -1 }).lean();
  const lines = user.totalReviews
    ? [line('workerReviews', { rating: (user.averageRating || 0).toFixed(1), count: user.totalReviews })]
    : [line('workerNoReviews')];
  if (latest?.comment) lines.push(line('workerLatestReview', { rating: latest.rating, comment: latest.comment }));
  return { lines, links: [link('/worker/reviews', 'reviews')] };
}

async function workerDashboard(user) {
  const [bookings, earnings, reviews] = await Promise.all([workerBookings(user), workerEarnings(user), workerReviews(user)]);
  return {
    lines: [bookings.lines[0], earnings.lines[0], reviews.lines[0]],
    links: [link('/worker/dashboard', 'requests'), link('/worker/earnings', 'earnings')],
  };
}

const workerAccount = async (user) => ({
  lines: [
    line('workerAccount', {
      accountStatus: user.accountStatus || 'active',
      verified: user.isVerified ? 'yes' : 'no',
      availability: user.availability ? 'yes' : 'no',
    }),
  ],
  links: [link('/profile', 'profile')],
});

// ---------- replies with no personal data ----------

const fixed = (key, links = []) => async () => ({ lines: [line(key)], links });

const SHARED = {
  greeting: async (user) => ({ lines: [line('greeting', { name: user.name.split(' ')[0] })], links: [] }),
  thanks: fixed('thanks'),
  help: fixed('help'),
  settings: fixed('settings'),
  complaint: fixed('complaint'),
  outOfScope: fixed('outOfScope'),
};

const CUSTOMER = {
  ...SHARED,
  bookings: customerBookings,
  payments: customerPayments,
  refund: customerRefunds,
  reviews: customerReviews,
  earnings: customerEarnings,
  dashboard: customerDashboard,
  account: fixed('customerAccount', [link('/profile', 'profile')]),
  howCancel: fixed('customerHowCancel', [link('/bookings', 'myBookings')]),
  howPay: fixed('customerHowPay', [link('/bookings', 'myBookings')]),
  howReview: fixed('customerHowReview', [link('/bookings', 'myBookings')]),
  howBook: fixed('customerHowBook', [link('/dashboard', 'services')]),
};

const WORKER = {
  ...SHARED,
  bookings: workerBookings,
  payments: workerPayments,
  refund: fixed('workerRefund', [link('/worker/earnings', 'earnings')]),
  reviews: workerReviews,
  earnings: workerEarnings,
  dashboard: workerDashboard,
  account: workerAccount,
  howCancel: fixed('workerHowCancel', [link('/worker/dashboard', 'requests')]),
  howPay: fixed('workerHowPay', [link('/worker/earnings', 'earnings')]),
  howReview: fixed('workerHowReview', [link('/worker/reviews', 'reviews')]),
  howBook: fixed('workerHowBook', [link('/worker/dashboard', 'requests')]),
};

// POST /api/assistant   (customer or worker)  { message, intent? }
// `intent` comes from the suggestion buttons; typed messages are worked out from their words.
// Every lookup is limited to the logged-in user's own records.
const askAssistant = asyncHandler(async (req, res) => {
  const message = String(req.body.message || '').trim();
  if (!message) throw httpError(400, 'Please type a message');
  if (message.length > MAX_MESSAGE) throw httpError(400, 'Please keep your message under 500 characters');

  const intent = INTENT_IDS.includes(req.body.intent) ? req.body.intent : detectIntent(message);
  const answers = req.user.role === 'worker' ? WORKER : CUSTOMER;
  const reply = await answers[intent](req.user);
  res.json({ intent, ...reply });
});

module.exports = { askAssistant };
