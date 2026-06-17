const SupportTicket = require('../../../models/SupportTicket');
const ReturnRequest = require('../../../models/ReturnRequest');
const RefundRequest = require('../../../models/RefundRequest');
const Order = require('../../../models/Order');

const ticketsRepository = {
  createTicket: payload => SupportTicket.create(payload),
  getTickets: filter =>
    SupportTicket.find(filter || {})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('order', 'orderStatus totalAmount createdAt')
      .populate('assignedTo', 'name email'),
  getTicketById: ticketId =>
    SupportTicket.findById(ticketId)
      .populate('user', 'name email')
      .populate('order', 'orderStatus totalAmount createdAt')
      .populate('assignedTo', 'name email'),
  getTicketsByUserId: userId =>
    SupportTicket.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('order', 'orderStatus totalAmount createdAt')
      .populate('assignedTo', 'name email'),
  saveTicket: ticket => ticket.save(),
  countTickets: filter => SupportTicket.countDocuments(filter || {}),
  aggregateTicketStats: () =>
    SupportTicket.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  addMessageToTicket: async (ticketId, messagePayload) => {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    ticket.messages.push(messagePayload);
    if (messagePayload.senderType === 'user' && ticket.status === 'closed') {
      ticket.status = 'open';
    }
    return await ticket.save();
  },
  updateTicketStatus: async (ticketId, status) => {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    ticket.status = status;
    return await ticket.save();
  },
  assignTicket: async (ticketId, adminId) => {
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) throw new Error('Ticket not found');
    ticket.assignedTo = adminId;
    return await ticket.save();
  },
};

const returnsRepository = {
  createReturnRequest: payload => ReturnRequest.create(payload),
  getReturnRequests: filter =>
    ReturnRequest.find(filter || {})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('order', 'orderStatus totalAmount createdAt')
      .populate('returnItems.product', 'title name price images'),
  getReturnRequestById: returnId =>
    ReturnRequest.findById(returnId)
      .populate('user', 'name email')
      .populate('order', 'orderStatus totalAmount createdAt')
      .populate('returnItems.product', 'title name price images'),
  saveReturnRequest: returnRequest => returnRequest.save(),
  updateReturnStatus: async (returnId, status, adminNotes, rejectionReason) => {
    const returnRequest = await ReturnRequest.findById(returnId);
    if (!returnRequest) throw new Error('Return request not found');
    returnRequest.status = status;
    if (adminNotes !== undefined) returnRequest.adminNotes = adminNotes;
    if (rejectionReason !== undefined) returnRequest.rejectionReason = rejectionReason;
    return await returnRequest.save();
  },
  countReturnRequests: filter => ReturnRequest.countDocuments(filter || {}),
  aggregateReturnStats: () =>
    ReturnRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
};

const refundsRepository = {
  createRefundRequest: payload => RefundRequest.create(payload),
  getRefundRequests: filter =>
    RefundRequest.find(filter || {})
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('order', 'orderStatus totalAmount createdAt'),
  getRefundRequestById: refundId =>
    RefundRequest.findById(refundId)
      .populate('user', 'name email')
      .populate('order', 'orderStatus totalAmount createdAt'),
  saveRefundRequest: refundRequest => refundRequest.save(),
  updateRefundStatus: async (refundId, status, notes, paymentDetails) => {
    const refund = await RefundRequest.findById(refundId);
    if (!refund) throw new Error('Refund request not found');
    refund.status = status;
    if (notes !== undefined) refund.notes = notes;
    if (paymentDetails) {
      refund.paymentDetails = { ...(refund.paymentDetails?.toObject?.() || {}), ...paymentDetails };
    }
    return await refund.save();
  },
  countRefundRequests: filter => RefundRequest.countDocuments(filter || {}),
  aggregateRefundStats: () =>
    RefundRequest.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
};

module.exports = {
  ticketsRepository,
  returnsRepository,
  refundsRepository,
  ordersRepository: {
    getOrderById: orderId => Order.findById(orderId),
  },
};

