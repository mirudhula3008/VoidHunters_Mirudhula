const mongoose = require('mongoose');

// Support ticket raised by a customer or worker. createdAt is when it was raised.

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const TICKET_STATUSES = ['open', 'in_progress', 'resolved'];

const ticketSchema = new mongoose.Schema(
  {
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    raisedByRole: { type: String, enum: ['customer', 'worker'], required: true },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    severity: { type: String, enum: SEVERITIES, required: true },
    // The booking this is about, if any.
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
    status: { type: String, enum: TICKET_STATUSES, default: 'open' },
  },
  { timestamps: true }
);

ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);
module.exports.SEVERITIES = SEVERITIES;
module.exports.TICKET_STATUSES = TICKET_STATUSES;
