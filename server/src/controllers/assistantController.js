const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { categoryIds } = require('../data/categories');
const { buildEarningsInsights, buildEarningsSummary } = require('./earningsController');
const { findNearbyWorkers, VISIBLE_WORKER } = require('./workerController');
const { detectCategory, detectIntent, INTENT_IDS } = require('../utils/assistantIntents');
const { summarizeReviews } = require('../utils/reviewSummary');
const { asyncHandler, httpError } = require('../utils/http');

const MAX_MESSAGE = 500;
const ACTIVE = ['requested', 'accepted', 'in_progress'];
const MAX_CARD_ITEMS = 3;
const SUGGEST_RADIUS_KM = 25;
const ANYWHERE_KM = 21000; // Half the Earth's circumference, so nobody is out of range.
const DEFAULT_POINT = { lat: 13.0827, lng: 80.2707 }; // Chennai

// A reply is lines of text, cards, links and follow-up options. Text is sent as translation keys
// plus values, so the browser shows it in the person's own language.
const line = (key, vars) => ({ key: `assistant.replies.${key}`, vars });
const link = (to, label, vars) => ({ to, label: `assistant.links.${label}`, vars });
const follow = (...intents) => intents.map((intent) => ({ intent }));

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

// Most recent bookings for a card, active ones first, with the actions each one allows.
async function bookingCard(partyField, userId) {
  const otherParty = partyField === 'customerId' ? 'workerId' : 'customerId';
  const [active, recent] = await Promise.all([
    Booking.find({ [partyField]: userId, status: { $in: ACTIVE } }).sort({ scheduledDate: 1 }).limit(MAX_CARD_ITEMS).populate(otherParty, 'name').lean(),
    Booking.find({ [partyField]: userId, status: { $nin: ACTIVE } }).sort({ scheduledDate: -1 }).limit(MAX_CARD_ITEMS).populate(otherParty, 'name').lean(),
  ]);
  const bookings = [...active, ...recent].slice(0, MAX_CARD_ITEMS);
  const reviewed = new Set(
    (await Review.find({ bookingId: { $in: bookings.map((b) => b._id) } }).select('bookingId').lean()).map((r) => String(r.bookingId))
  );
  return {
    type: 'bookings',
    items: bookings.map((b) => ({
      ...bookingVars(b, b[otherParty]),
      id: b._id,
      price: b.agreedPrice,
      paymentStatus: b.paymentStatus,
      canPay: partyField === 'customerId' && ACTIVE.includes(b.status) && b.paymentStatus === 'unpaid',
      canReview: partyField === 'customerId' && b.status === 'completed' && !reviewed.has(String(b._id)),
    })),
  };
}

const paidTotal = async (user) => {
  const [totals = {}] = await Payment.aggregate([{ $match: { customerId: user._id, status: 'completed' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
  return totals.total || 0;
};

// ---------- review summaries ----------

const reviewCard = async (worker) => ({
  type: 'reviewSummary',
  worker: { id: worker._id, name: worker.name, profilePhoto: worker.profilePhoto, gender: worker.gender },
  ...(await summarizeReviews(worker._id)),
});

// Workers named in a message. `exact` needs every word of the name, for messages that may not be about a worker at all.
async function workersNamedIn(message, exact) {
  const words = new Set(String(message).toLowerCase().match(/[a-z]{3,}/g) || []);
  if (!words.size) return [];
  const workers = await User.find(VISIBLE_WORKER).select('name profilePhoto gender').lean();
  const scored = workers
    .map((w) => {
      const parts = w.name.toLowerCase().split(/\s+/);
      return { worker: w, hits: parts.filter((p) => words.has(p)).length, size: parts.length };
    })
    .filter((s) => (exact ? s.hits === s.size : s.hits > 0));
  const top = Math.max(0, ...scored.map((s) => s.hits));
  return scored.filter((s) => s.hits === top).map((s) => s.worker);
}

const pickWorkerOptions = (workers) => workers.slice(0, 5).map((w) => ({ intent: 'reviews', text: w.name, params: { workerId: w._id } }));

// Handles "reviews of <worker>". Returns null when no worker is meant.
async function namedWorkerReviews(message, params, exact = false) {
  if (params.workerId) {
    if (!mongoose.isValidObjectId(params.workerId)) return null;
    const worker = await User.findOne({ ...VISIBLE_WORKER, _id: params.workerId }).select('name profilePhoto gender').lean();
    if (!worker) return { lines: [line('workerNotFound')], options: follow('reviews', 'menu') };
    return { lines: [line('reviewSummaryIntro', { name: worker.name })], cards: [await reviewCard(worker)], options: follow('suggestWorker', 'menu') };
  }
  const matches = await workersNamedIn(message, exact);
  if (matches.length === 1) {
    return { lines: [line('reviewSummaryIntro', { name: matches[0].name })], cards: [await reviewCard(matches[0])], options: follow('suggestWorker', 'menu') };
  }
  if (matches.length > 1) return { lines: [line('whichWorker')], options: pickWorkerOptions(matches) };
  return null;
}

// ---------- customers ----------

async function customerBookings(user) {
  const [active, completed, next, card] = await Promise.all([
    Booking.countDocuments({ customerId: user._id, status: { $in: ACTIVE } }),
    Booking.countDocuments({ customerId: user._id, status: 'completed' }),
    nextBooking('customerId', user._id),
    bookingCard('customerId', user._id),
  ]);
  const lines = [line('customerBookings', { active, completed })];
  if (next) lines.push(line('customerNextBooking', bookingVars(next, next.workerId)));
  return { lines, cards: [card], links: [link('/bookings', 'myBookings')], options: follow('payments', 'raiseTicket', 'menu') };
}

async function customerPayments(user) {
  const [unpaid, total, last, refunded] = await Promise.all([
    Booking.find({ customerId: user._id, status: { $in: ACTIVE }, paymentStatus: 'unpaid' }).select('agreedPrice').lean(),
    paidTotal(user),
    Payment.findOne({ customerId: user._id, status: 'completed' }).sort({ completedAt: -1, createdAt: -1 }).lean(),
    Payment.countDocuments({ customerId: user._id, status: 'refunded' }),
  ]);

  const lines = [
    unpaid.length
      ? line('customerUnpaid', { count: unpaid.length, amount: unpaid.reduce((sum, b) => sum + b.agreedPrice, 0) })
      : line('customerNothingUnpaid'),
    line('customerTotalPaid', { amount: total }),
  ];
  if (last) {
    lines.push(line('customerLastPayment', { amount: last.amount, method: last.method, date: last.completedAt || last.createdAt }));
  }
  if (refunded) lines.push(line('customerRefundCount', { count: refunded }));
  return { lines, links: [link('/bookings', 'myBookings')], options: follow('refund', 'raiseTicket', 'menu') };
}

async function customerRefunds(user) {
  const [refunds = {}] = await Payment.aggregate([
    { $match: { customerId: user._id, status: 'refunded' } },
    { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
  ]);
  return {
    lines: [
      refunds.count ? line('customerRefunds', { count: refunds.count, amount: refunds.total }) : line('customerNoRefunds'),
      line('refundRule'),
    ],
    links: [link('/bookings', 'myBookings')],
    options: follow('raiseTicket', 'menu'),
  };
}

async function recentWorkers(user) {
  const ids = await Booking.find({ customerId: user._id }).sort({ scheduledDate: -1 }).limit(30).distinct('workerId');
  return User.find({ ...VISIBLE_WORKER, _id: { $in: ids } }).select('name').limit(5).lean();
}

async function customerReviews(user, { message, params }) {
  const named = await namedWorkerReviews(message, params);
  if (named) return named;

  const [written, reviewedIds, completed, workers] = await Promise.all([
    Review.countDocuments({ customerId: user._id }),
    Review.find({ customerId: user._id }).distinct('bookingId'),
    Booking.countDocuments({ customerId: user._id, status: 'completed' }),
    recentWorkers(user),
  ]);
  const waiting = await Booking.countDocuments({ customerId: user._id, status: 'completed', _id: { $nin: reviewedIds } });
  return {
    lines: [line('customerReviews', { written, waiting, completed }), line('askWorkerName')],
    links: [link('/bookings', 'myBookings')],
    options: [...pickWorkerOptions(workers), ...follow('menu')],
  };
}

const customerEarnings = async (user) => ({
  lines: [line('customerNoEarnings', { amount: await paidTotal(user) })],
  links: [link('/bookings', 'myBookings')],
  options: follow('payments', 'menu'),
});

async function customerDashboard(user) {
  const [bookings, payments, reviews] = await Promise.all([customerBookings(user), customerPayments(user), customerReviews(user, { message: '', params: {} })]);
  return {
    lines: [bookings.lines[0], payments.lines[0], payments.lines[1], reviews.lines[0]],
    cards: bookings.cards,
    links: [link('/bookings', 'myBookings')],
    options: follow('suggestWorker', 'raiseTicket', 'menu'),
  };
}

const CATEGORY_OPTIONS = categoryIds.map((category) => ({ intent: 'suggestWorker', service: category, params: { category } }));

async function customerSuggest(user, { message, params }) {
  const category = categoryIds.includes(params.category) ? params.category : detectCategory(message);
  if (!category) return { lines: [line('askCategory')], options: CATEGORY_OPTIONS };

  const [lng, lat] = user.location?.coordinates?.length === 2 ? user.location.coordinates : [DEFAULT_POINT.lng, DEFAULT_POINT.lat];
  const search = { lat, lng, match: { ...VISIBLE_WORKER, serviceCategory: category, availability: true } };
  // Nearby workers first. With none nearby, still suggest the best-rated ones and say they're further away.
  const nearby = await findNearbyWorkers({ ...search, radiusKm: SUGGEST_RADIUS_KM });
  const workers = nearby.length ? nearby : await findNearbyWorkers({ ...search, radiusKm: ANYWHERE_KM });
  if (!workers.length) return { lines: [line('noWorkersNearby', { category })], options: follow('suggestWorker', 'menu') };

  const best = [...workers].sort((a, b) => Number(b.fixitChoice) - Number(a.fixitChoice) || b.recommendationScore - a.recommendationScore).slice(0, MAX_CARD_ITEMS);
  return {
    lines: [line(nearby.length ? 'suggestedWorkers' : 'suggestedWorkersFar', { category, km: SUGGEST_RADIUS_KM })],
    cards: [
      {
        type: 'workers',
        items: best.map((w) => ({
          id: w._id,
          name: w.name,
          profilePhoto: w.profilePhoto,
          gender: w.gender,
          rating: w.averageRating,
          reviews: w.totalReviews,
          distance: w.distance,
          minPrice: w.minPrice,
          maxPrice: w.maxPrice,
          fixitChoice: w.fixitChoice,
        })),
      },
    ],
    links: [link(`/services/${category}`, 'seeAllWorkers')],
    options: [...best.map((w) => ({ intent: 'reviews', text: w.name, reviewOf: true, params: { workerId: w._id } })), ...follow('menu')],
  };
}

// Personal prompts shown when the chat opens.
async function customerWelcome(user) {
  const [unpaid, reviewedIds, favourite] = await Promise.all([
    Booking.countDocuments({ customerId: user._id, status: { $in: ACTIVE }, paymentStatus: 'unpaid' }),
    Review.find({ customerId: user._id }).distinct('bookingId'),
    Booking.aggregate([
      { $match: { customerId: user._id, status: 'completed' } },
      { $group: { _id: '$workerId', jobs: { $sum: 1 } } },
      { $sort: { jobs: -1 } },
      { $limit: 1 },
    ]),
  ]);
  const toReview = await Booking.countDocuments({ customerId: user._id, status: 'completed', _id: { $nin: reviewedIds } });
  const links = [];
  if (unpaid) links.push(link('/bookings', 'unpaidPrompt', { count: unpaid }));
  if (toReview) links.push(link('/bookings', 'reviewPrompt', { count: toReview }));
  if (favourite[0]) {
    const worker = await User.findOne({ ...VISIBLE_WORKER, _id: favourite[0]._id, availability: true }).select('name').lean();
    if (worker) links.push(link(`/workers/${worker._id}`, 'bookAgain', { name: worker.name }));
  }
  return { lines: [], links };
}

// ---------- workers ----------

async function workerBookings(user) {
  const [requested, inHand, next, card] = await Promise.all([
    Booking.countDocuments({ workerId: user._id, status: 'requested' }),
    Booking.countDocuments({ workerId: user._id, status: { $in: ['accepted', 'in_progress'] } }),
    nextBooking('workerId', user._id),
    bookingCard('workerId', user._id),
  ]);
  const lines = [line('workerBookings', { requested, inHand })];
  if (next) lines.push(line('workerNextJob', bookingVars(next, next.customerId)));
  return { lines, cards: [card], links: [link('/worker/dashboard', 'requests'), link('/worker/jobs', 'jobs')], options: follow('earnings', 'raiseTicket', 'menu') };
}

async function workerEarnings(user) {
  const [summary, insights] = await Promise.all([buildEarningsSummary(user), buildEarningsInsights(user)]);
  const { netEarnings: net, pendingPayouts, commissionRate, totalLifetime, thisMonth } = summary;
  const lines = [line('workerEarningsIntro', { monthAmount: net.thisMonth, jobs: thisMonth.jobs })];
  if (insights.changePercent !== null) {
    lines.push(line(insights.changePercent >= 0 ? 'workerEarningsUp' : 'workerEarningsDown', { percent: Math.abs(insights.changePercent), lastMonthAmount: insights.lastMonthNet }));
  }
  if (insights.topService) {
    lines.push(line('workerTopService', { service: insights.topService.name, amount: insights.topService.net, jobs: insights.topService.jobs }));
  }
  lines.push(line('workerPayout', { amount: pendingPayouts, percent: Math.round(commissionRate * 100) }));
  return {
    lines,
    cards: [{ type: 'earnings', today: net.today, week: net.thisWeek, month: net.thisMonth, lifetime: net.lifetime, jobs: totalLifetime.jobs, pending: pendingPayouts }],
    links: [link('/worker/earnings', 'earnings')],
    options: follow('bookings', 'reviews', 'raiseTicket', 'menu'),
  };
}

async function workerPayments(user) {
  const [earnings, { awaitingCompletion }] = await Promise.all([workerEarnings(user), buildEarningsSummary(user)]);
  if (awaitingCompletion.jobs) {
    earnings.lines.push(line('workerAwaiting', { amount: awaitingCompletion.amount, jobs: awaitingCompletion.jobs }));
  }
  return earnings;
}

async function workerReviews(user, { message, params }) {
  const named = await namedWorkerReviews(message, params);
  if (named) return named;
  return {
    lines: user.totalReviews ? [line('reviewSummaryIntro', { name: user.name })] : [line('workerNoReviews')],
    cards: user.totalReviews ? [await reviewCard(user)] : [],
    links: [link('/worker/reviews', 'reviews')],
    options: follow('earnings', 'menu'),
  };
}

async function workerDashboard(user) {
  const [bookings, earnings, reviews] = await Promise.all([workerBookings(user), workerEarnings(user), workerReviews(user, { message: '', params: {} })]);
  return {
    lines: [bookings.lines[0], earnings.lines[0], ...(reviews.lines || [])].slice(0, 2),
    cards: [...earnings.cards, ...bookings.cards],
    links: [link('/worker/dashboard', 'requests'), link('/worker/earnings', 'earnings')],
    options: follow('reviews', 'raiseTicket', 'menu'),
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
  options: follow('raiseTicket', 'menu'),
});

const workerSuggest = async () => ({ lines: [line('workerSuggest')], links: [link('/profile', 'profile')], options: follow('reviews', 'menu') });

async function workerWelcome(user) {
  const requested = await Booking.countDocuments({ workerId: user._id, status: 'requested' });
  const links = [];
  if (requested) links.push(link('/worker/dashboard', 'requestsPrompt', { count: requested }));
  if (!user.availability) links.push(link('/profile', 'availabilityPrompt'));
  if (!user.isVerified) links.push(link('/profile', 'verifyPrompt'));
  return { lines: [], links };
}

// ---------- tickets and replies with no personal data ----------

async function myTickets(user) {
  const tickets = await Ticket.find({ raisedBy: user._id }).sort({ createdAt: -1 }).limit(MAX_CARD_ITEMS).select('subject severity status createdAt').lean();
  return {
    lines: [tickets.length ? line('ticketsIntro') : line('noTicketsYet')],
    cards: tickets.length ? [{ type: 'tickets', items: tickets }] : [],
    links: [link('/support/tickets', 'allTickets')],
    options: follow('raiseTicket', 'menu'),
  };
}

// Bookings to choose from while raising a ticket. Newest first, the person's own only.
async function ticketBookings(user) {
  const field = user.role === 'worker' ? 'workerId' : 'customerId';
  const bookings = await Booking.find({ [field]: user._id }).sort({ scheduledDate: -1 }).limit(4).select('serviceName scheduledDate').lean();
  return { bookings: bookings.map((b) => ({ id: b._id, service: b.serviceName, scheduleDate: b.scheduledDate })) };
}

const fixed = (key, links = [], options = follow('menu')) => async () => ({ lines: [line(key)], links, options });

const SHARED = {
  greeting: async (user) => ({ lines: [line('greeting', { name: user.name.split(' ')[0] })], options: follow('menu') }),
  thanks: fixed('thanks'),
  help: fixed('help'),
  settings: fixed('settings'),
  complaint: async () => ({ lines: [line('complaint')], startTicket: true }),
  raiseTicket: async () => ({ lines: [], startTicket: true }),
  myTickets,
  ticketBookings,
  outOfScope: fixed('outOfScope'),
};

const CUSTOMER = {
  ...SHARED,
  welcome: customerWelcome,
  bookings: customerBookings,
  payments: customerPayments,
  refund: customerRefunds,
  reviews: customerReviews,
  earnings: customerEarnings,
  dashboard: customerDashboard,
  suggestWorker: customerSuggest,
  account: fixed('customerAccount', [link('/profile', 'profile')]),
  howCancel: fixed('customerHowCancel', [link('/bookings', 'myBookings')]),
  howPay: fixed('customerHowPay', [link('/bookings', 'myBookings')]),
  howReview: fixed('customerHowReview', [link('/bookings', 'myBookings')]),
  howBook: fixed('customerHowBook', [link('/dashboard', 'services')]),
};

const WORKER = {
  ...SHARED,
  welcome: workerWelcome,
  bookings: workerBookings,
  payments: workerPayments,
  refund: fixed('workerRefund', [link('/worker/earnings', 'earnings')]),
  reviews: workerReviews,
  earnings: workerEarnings,
  dashboard: workerDashboard,
  suggestWorker: workerSuggest,
  account: workerAccount,
  howCancel: fixed('workerHowCancel', [link('/worker/dashboard', 'requests')]),
  howPay: fixed('workerHowPay', [link('/worker/earnings', 'earnings')]),
  howReview: fixed('workerHowReview', [link('/worker/reviews', 'reviews')]),
  howBook: fixed('workerHowBook', [link('/worker/dashboard', 'requests')]),
};

// POST /api/assistant   (customer or worker)  { message?, intent?, params? }
// `intent` comes from the menu and buttons; typed messages are worked out from their words.
// Personal figures are limited to the logged-in user's own records.
const askAssistant = asyncHandler(async (req, res) => {
  const message = String(req.body.message || '').trim();
  const given = INTENT_IDS.includes(req.body.intent) ? req.body.intent : null;
  const params = req.body.params && typeof req.body.params === 'object' ? req.body.params : {};
  if (!message && !given) throw httpError(400, 'Please type a message');
  if (message.length > MAX_MESSAGE) throw httpError(400, 'Please keep your message under 500 characters');

  const intent = given || detectIntent(message);

  // Just a worker's full name counts as asking about them.
  if (intent === 'outOfScope') {
    const named = await namedWorkerReviews(message, {}, true);
    if (named) return res.json({ intent: 'reviews', ...named });
  }

  const answers = req.user.role === 'worker' ? WORKER : CUSTOMER;
  const reply = await answers[intent](req.user, { message, params });
  res.json({ intent, ...reply });
});

module.exports = { askAssistant };
