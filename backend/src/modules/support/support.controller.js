const { ticketsRepository, returnsRepository, refundsRepository, ordersRepository } = require('./support.repository');
const { sendErrorResponse, sendSuccessResponse } = require('../../utils/responseHandler');
const { emitToAdmins, emitToUser } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');

const supportController = {
  // Create support ticket
  createTicket: async (req, res) => {
    try {
      const { category, subject, description, email, priority, orderId, attachments } = req.body;
      const userId = String(req.user._id || req.user.id);

      if (!category || !subject || !description || !priority) {
        return sendErrorResponse(res, 'All fields are required', 400);
      }

      if (orderId) {
        const order = await ordersRepository.getOrderById(orderId);
        if (!order || String(order.user) !== userId) {
          return sendErrorResponse(res, 'Order not found for this customer', 404);
        }
      }

      const ticketPayload = {
        user: userId,
        order: orderId || undefined,
        category,
        subject,
        description,
        email,
        priority: normalizePriority(priority),
        status: 'open',
        messages: [
          {
            senderType: 'user',
            sender: userId,
            message: description,
            attachments: Array.isArray(attachments) ? attachments : [],
          },
        ],
      };

      const ticket = await ticketsRepository.createTicket(ticketPayload);

      // Emit socket event for admin notification
      emitToAdmins(req.app, socketEvents.DOMAIN.TICKET_CREATED, {
        ticketId: ticket._id,
        orderId: ticket.order,
        userId,
        category: ticket.category,
        priority: ticket.priority,
        subject: ticket.subject,
      });

      return sendSuccessResponse(res, { ticket }, 'Ticket created successfully', 201);
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get user's tickets
  getUserTickets: async (req, res) => {
    try {
      const userId = String(req.user._id || req.user.id);
      const tickets = await ticketsRepository.getTicketsByUserId(userId);
      return sendSuccessResponse(res, { tickets }, 'Tickets fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get single ticket detail
  getTicketDetail: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const userId = String(req.user._id || req.user.id);

      const ticket = await ticketsRepository.getTicketById(ticketId);

      if (!ticket) {
        return sendErrorResponse(res, 'Ticket not found', 404);
      }

      // Verify ticket belongs to user
      if (String(ticket.user?._id || ticket.user) !== userId) {
        return sendErrorResponse(res, 'Unauthorized', 403);
      }

      return sendSuccessResponse(res, { ticket }, 'Ticket fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Create refund request
  createRefundRequest: async (req, res) => {
    try {
      const { orderId, itemIds, reason, comments } = req.body;
      const userId = String(req.user._id || req.user.id);

      if (!orderId || !itemIds || !reason || !comments) {
        return sendErrorResponse(res, 'All fields are required', 400);
      }

      const order = await ordersRepository.getOrderById(orderId);
      if (!order || String(order.user) !== userId) {
        return sendErrorResponse(res, 'Order not found for this customer', 404);
      }

      const selectedItems = Array.isArray(itemIds) && itemIds.length
        ? order.items.filter(item => itemIds.includes(String(item.product)) || itemIds.includes(String(item._id)))
        : order.items;
      const productAmount = selectedItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0);

      const refundPayload = {
        user: userId,
        order: orderId,
        reason: normalizeRefundReason(reason),
        refundType: selectedItems.length === order.items.length ? 'full' : 'partial',
        refundAmount: productAmount,
        refundBreakdown: { productAmount },
        notes: comments,
        status: 'initiated',
      };

      const refund = await refundsRepository.createRefundRequest(refundPayload);

      // Emit socket event for admin notification
      emitToAdmins(req.app, socketEvents.DOMAIN.REFUND_CREATED, {
        refundId: refund._id,
        orderId: refund.order,
        userId,
        reason: refund.reason,
        status: refund.status,
      });

      return sendSuccessResponse(res, { refund }, 'Refund request created successfully', 201);
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get user's refunds
  getUserRefunds: async (req, res) => {
    try {
      const userId = String(req.user._id || req.user.id);
      const refunds = await refundsRepository.getRefundRequests({ user: userId });
      return sendSuccessResponse(res, { refunds }, 'Refunds fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get single refund detail
  getRefundDetail: async (req, res) => {
    try {
      const { refundId } = req.params;
      const userId = String(req.user._id || req.user.id);

      const refund = await refundsRepository.getRefundRequestById(refundId);

      if (!refund) {
        return sendErrorResponse(res, 'Refund request not found', 404);
      }

      // Verify refund belongs to user
      if (String(refund.user?._id || refund.user) !== userId) {
        return sendErrorResponse(res, 'Unauthorized', 403);
      }

      return sendSuccessResponse(res, { refund }, 'Refund fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get all tickets (admin)
  getAllTickets: async (req, res) => {
    try {
      const { status, priority, category, orderId } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (category) filter.category = category;
      if (orderId) filter.order = orderId;
      const tickets = await ticketsRepository.getTickets(filter);
      return sendSuccessResponse(res, { tickets }, 'All tickets fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get all refunds (admin)
  getAllRefunds: async (req, res) => {
    try {
      const { status, orderId } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (orderId) filter.order = orderId;
      const refunds = await refundsRepository.getRefundRequests(filter);
      return sendSuccessResponse(res, { refunds }, 'All refunds fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Add message to ticket
  addMessage: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { message } = req.body;
      const userId = String(req.user._id || req.user.id);

      if (!message || !message.trim()) {
        return sendErrorResponse(res, 'Message is required', 400);
      }

      const ticket = await ticketsRepository.getTicketById(ticketId);
      if (!ticket) {
        return sendErrorResponse(res, 'Ticket not found', 404);
      }

      // Verify ticket belongs to user
      if (String(ticket.user?._id || ticket.user) !== userId) {
        return sendErrorResponse(res, 'Unauthorized', 403);
      }

      const messagePayload = {
        senderType: 'user',
        sender: userId,
        message: message.trim(),
      };

      const updatedTicket = await ticketsRepository.addMessageToTicket(ticketId, messagePayload);

      // Emit socket event for admin notification
      emitToAdmins(req.app, socketEvents.DOMAIN.TICKET_MESSAGE_ADDED, {
        ticketId: updatedTicket._id,
        orderId: updatedTicket.order,
        userId,
        message: messagePayload,
      });

      return sendSuccessResponse(res, { ticket: updatedTicket }, 'Message added successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Update ticket status
  updateTicketStatus: async (req, res) => {
    try {
      const { ticketId } = req.params;
      const { status } = req.body;
      const userId = String(req.user._id || req.user.id);

      if (!status) {
        return sendErrorResponse(res, 'Status is required', 400);
      }

      const validStatuses = ['open', 'closed'];
      if (!validStatuses.includes(status)) {
        return sendErrorResponse(res, 'Invalid status', 400);
      }

      const ticket = await ticketsRepository.getTicketById(ticketId);
      if (!ticket) {
        return sendErrorResponse(res, 'Ticket not found', 404);
      }

      // Verify ticket belongs to user
      if (String(ticket.user?._id || ticket.user) !== userId) {
        return sendErrorResponse(res, 'Unauthorized', 403);
      }

      const updatedTicket = await ticketsRepository.updateTicketStatus(ticketId, status);

      // Emit socket event for real-time sync
      emitToUser(req.app, userId, socketEvents.DOMAIN.TICKET_UPDATED, {
        ticketId: updatedTicket._id,
        orderId: updatedTicket.order,
        status: updatedTicket.status,
      });

      return sendSuccessResponse(res, { ticket: updatedTicket }, 'Ticket status updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  createReturnRequest: async (req, res) => {
    try {
      const { orderId, returnItems, reason, comments, pickupAddress, images } = req.body;
      const userId = String(req.user._id || req.user.id);

      if (!orderId || !Array.isArray(returnItems) || !returnItems.length || !pickupAddress) {
        return sendErrorResponse(res, 'Order, items, and pickup address are required', 400);
      }

      const order = await ordersRepository.getOrderById(orderId);
      if (!order || String(order.user) !== userId) {
        return sendErrorResponse(res, 'Order not found for this customer', 404);
      }

      const normalizedItems = returnItems.map(item => ({
        product: item.product || item.productId,
        quantity: item.quantity || 1,
        reason: item.reason || reason || 'Not specified',
        condition: item.condition || 'Good',
      })).filter(item => item.product);

      if (!normalizedItems.length) {
        return sendErrorResponse(res, 'At least one return item is required', 400);
      }

      const returnRequest = await returnsRepository.createReturnRequest({
        user: userId,
        order: orderId,
        returnItems: normalizedItems,
        pickupAddress,
        images: Array.isArray(images) ? images : [],
        adminNotes: comments || undefined,
        status: 'initiated',
      });

      emitToAdmins(req.app, socketEvents.DOMAIN.RETURN_CREATED, {
        returnId: returnRequest._id,
        orderId: returnRequest.order,
        userId,
        reason,
        status: returnRequest.status,
      });

      return sendSuccessResponse(res, { returnRequest }, 'Return request created successfully', 201);
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getUserReturns: async (req, res) => {
    try {
      const userId = String(req.user._id || req.user.id);
      const returns = await returnsRepository.getReturnRequests({ user: userId });
      return sendSuccessResponse(res, { returns }, 'Return requests fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getReturnDetail: async (req, res) => {
    try {
      const userId = String(req.user._id || req.user.id);
      const returnRequest = await returnsRepository.getReturnRequestById(req.params.returnId);
      if (!returnRequest) return sendErrorResponse(res, 'Return request not found', 404);
      if (String(returnRequest.user?._id || returnRequest.user) !== userId) return sendErrorResponse(res, 'Unauthorized', 403);
      return sendSuccessResponse(res, { returnRequest }, 'Return request fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getAllReturns: async (req, res) => {
    try {
      const { status, orderId } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (orderId) filter.order = orderId;
      const returns = await returnsRepository.getReturnRequests(filter);
      return sendSuccessResponse(res, { returns }, 'All return requests fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getAdminTicketDetail: async (req, res) => {
    try {
      const ticket = await ticketsRepository.getTicketById(req.params.ticketId);
      if (!ticket) return sendErrorResponse(res, 'Ticket not found', 404);
      return sendSuccessResponse(res, { ticket }, 'Ticket fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  addAdminMessage: async (req, res) => {
    try {
      const { message, attachments } = req.body;
      if (!message || !message.trim()) return sendErrorResponse(res, 'Message is required', 400);
      const ticket = await ticketsRepository.getTicketById(req.params.ticketId);
      if (!ticket) return sendErrorResponse(res, 'Ticket not found', 404);

      const messagePayload = {
        senderType: 'admin',
        sender: req.user._id,
        message: message.trim(),
        attachments: Array.isArray(attachments) ? attachments : [],
      };
      const updatedTicket = await ticketsRepository.addMessageToTicket(req.params.ticketId, messagePayload);
      updatedTicket.status = 'waiting_customer';
      await ticketsRepository.saveTicket(updatedTicket);

      const payload = { ticketId: updatedTicket._id, orderId: updatedTicket.order, message: messagePayload };
      emitToAdmins(req.app, socketEvents.DOMAIN.TICKET_MESSAGE_ADDED, payload);
      emitToUser(req.app, updatedTicket.user, socketEvents.DOMAIN.TICKET_MESSAGE_ADDED, payload);
      return sendSuccessResponse(res, { ticket: updatedTicket }, 'Message added successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  updateAdminTicketStatus: async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return sendErrorResponse(res, 'Status is required', 400);
      const updatedTicket = await ticketsRepository.updateTicketStatus(req.params.ticketId, status);
      const payload = { ticketId: updatedTicket._id, orderId: updatedTicket.order, status: updatedTicket.status };
      emitToAdmins(req.app, socketEvents.DOMAIN.TICKET_UPDATED, payload);
      emitToUser(req.app, updatedTicket.user, socketEvents.DOMAIN.TICKET_UPDATED, payload);
      return sendSuccessResponse(res, { ticket: updatedTicket }, 'Ticket status updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  assignTicket: async (req, res) => {
    try {
      const ticket = await ticketsRepository.assignTicket(req.params.ticketId, req.body.adminId || req.user._id);
      emitToAdmins(req.app, socketEvents.DOMAIN.TICKET_UPDATED, { ticketId: ticket._id, orderId: ticket.order, assignedTo: ticket.assignedTo });
      return sendSuccessResponse(res, { ticket }, 'Ticket assigned successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getAdminReturnDetail: async (req, res) => {
    try {
      const returnRequest = await returnsRepository.getReturnRequestById(req.params.returnId);
      if (!returnRequest) return sendErrorResponse(res, 'Return request not found', 404);
      return sendSuccessResponse(res, { returnRequest }, 'Return request fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  updateAdminReturnStatus: async (req, res) => {
    try {
      const { status, notes, reason } = req.body;
      if (!status) return sendErrorResponse(res, 'Status is required', 400);
      const returnRequest = await returnsRepository.updateReturnStatus(req.params.returnId, status, notes, reason);
      const payload = { returnId: returnRequest._id, orderId: returnRequest.order, status: returnRequest.status };
      emitToAdmins(req.app, socketEvents.DOMAIN.RETURN_UPDATED, payload);
      emitToUser(req.app, returnRequest.user, socketEvents.DOMAIN.RETURN_UPDATED, payload);
      return sendSuccessResponse(res, { returnRequest }, 'Return status updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getAdminRefundDetail: async (req, res) => {
    try {
      const refund = await refundsRepository.getRefundRequestById(req.params.refundId);
      if (!refund) return sendErrorResponse(res, 'Refund request not found', 404);
      return sendSuccessResponse(res, { refund }, 'Refund fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  updateAdminRefundStatus: async (req, res) => {
    try {
      const { status, notes, paymentDetails } = req.body;
      if (!status) return sendErrorResponse(res, 'Status is required', 400);
      const refund = await refundsRepository.updateRefundStatus(req.params.refundId, status, notes, paymentDetails);
      const payload = { refundId: refund._id, orderId: refund.order, status: refund.status };
      emitToAdmins(req.app, socketEvents.DOMAIN.REFUND_UPDATED, payload);
      emitToUser(req.app, refund.user, socketEvents.DOMAIN.REFUND_UPDATED, payload);
      return sendSuccessResponse(res, { refund }, 'Refund status updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },
};

const normalizePriority = priority => {
  const normalized = String(priority || '').toLowerCase();
  if (normalized === 'normal') return 'medium';
  if (normalized === 'urgent') return 'critical';
  return ['low', 'medium', 'high', 'critical'].includes(normalized) ? normalized : 'medium';
};

const normalizeRefundReason = reason => (
  ['return', 'cancellation', 'complaint', 'duplicate_charge', 'other'].includes(reason) ? reason : 'other'
);

module.exports = supportController;
