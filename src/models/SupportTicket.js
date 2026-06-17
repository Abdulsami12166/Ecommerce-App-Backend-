const mongoose = require('mongoose');

const ticketMessageSchema = new mongoose.Schema(
  {
    senderType: {
      type: String,
      enum: ['user', 'admin', 'system'],
      default: 'user',
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true, trim: true },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const supportTicketSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, default: 'general', trim: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'waiting_customer', 'waiting_admin', 'escalated', 'resolved', 'closed'],
      default: 'open',
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    messages: [ticketMessageSchema],
    satisfaction: {
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String, trim: true },
    },
  },
  { timestamps: true },
);

supportTicketSchema.pre('validate', function generateTicketNumber(next) {
  if (!this.ticketNumber) {
    this.ticketNumber = TKT--;
  }
  next();
});

module.exports = mongoose.model('SupportTicket', supportTicketSchema);

