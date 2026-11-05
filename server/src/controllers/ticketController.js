const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Ticket = require('../models/Ticket');
const { SEVERITIES, TICKET_STATUSES } = require('../models/Ticket');
const { asyncHandler, httpError } = require('../utils/http');

const MIN_MESSAGE = 10;

const pageParams = (q) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

// Open, in progress and resolved counts for the summary cards.
async function statusCounts(match) {
  const rows = await Ticket.aggregate([{ $match: match }, { $group: { _id: '$status', n: { $sum: 1 } } }]);
  const counts = { total: 0, open: 0, in_progress: 0, resolved: 0 };
  rows.forEach((row) => {
    counts[row._id] = row.n;
    counts.total += row.n;
  });
  return counts;
}

// POST /api/tickets   (customer or worker)  { subject, message, severity, bookingId? }
const createTicket = asyncHandler(async (req, res) => {
  const subject = String(req.body.subject || '').trim();
  const message = String(req.body.message || '').trim();
  const { severity } = req.body;

  if (!subject) throw httpError(400, 'Please enter a subject');
  if (subject.length > 120) throw httpError(400, 'Subject must be 120 characters or fewer');
  if (message.length < MIN_MESSAGE) throw httpError(400, 'Please describe the problem in at least 10 characters');
  if (message.length > 2000) throw httpError(400, 'Description must be 2000 characters or fewer');
  if (!SEVERITIES.includes(severity)) throw httpError(400, 'Please choose a severity');

  // A ticket can only point at one of the person's own bookings.
  let bookingId;
  if (req.body.bookingId) {
    const mine =
      mongoose.isValidObjectId(req.body.bookingId) &&
      (await Booking.exists({ _id: req.body.bookingId, $or: [{ customerId: req.user._id }, { workerId: req.user._id }] }));
    if (!mine) throw httpError(400, 'Please choose one of your own bookings');
    bookingId = req.body.bookingId;
  }

  const ticket = await Ticket.create({
    raisedBy: req.user._id,
    raisedByRole: req.user.role,
    subject,
    message,
    severity,
    bookingId,
  });
  res.status(201).json(ticket);
});

// GET /api/tickets/mine?page=&limit=   Only the logged-in user's tickets, newest first.
const getMyTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const filter = { raisedBy: req.user._id };

  const [tickets, total, counts] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('bookingId', 'serviceName scheduledDate').lean(),
    Ticket.countDocuments(filter),
    statusCounts({ raisedBy: req.user._id }),
  ]);
  res.json({ tickets, total, page, pages: Math.ceil(total / limit), counts });
});

// GET /api/admin/tickets?severity=&status=&role=&page=&limit=   Newest first.
const listTickets = asyncHandler(async (req, res) => {
  const { page, limit, skip } = pageParams(req.query);
  const { severity, status, role } = req.query;

  const filter = {};
  if (SEVERITIES.includes(severity)) filter.severity = severity;
  if (TICKET_STATUSES.includes(status)) filter.status = status;
  if (role === 'customer' || role === 'worker') filter.raisedByRole = role;

  const [tickets, total, counts] = await Promise.all([
    Ticket.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('raisedBy', 'name email phone').populate('bookingId', 'serviceName scheduledDate').lean(),
    Ticket.countDocuments(filter),
    statusCounts({}),
  ]);
  res.json({ tickets, total, page, pages: Math.ceil(total / limit), counts });
});

// PATCH /api/admin/tickets/:id/status   { status }
const setTicketStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid ticket id');
  if (!TICKET_STATUSES.includes(status)) throw httpError(400, 'Please choose a valid status');

  const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
  if (!ticket) throw httpError(404, 'Ticket not found');
  res.json(ticket);
});

module.exports = { createTicket, getMyTickets, listTickets, setTicketStatus };
