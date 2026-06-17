const { ticketsRepository, returnsRepository, refundsRepository } = require('./support.repository');
const { sendErrorResponse, sendSuccessResponse } = require('../../utils/responseHandler');
const { emitToAdmins, emitToUser } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');

const supportController = {
  // Create support ticket
  createTicket: async (req, res) => {
    try {
      const { category, subject, description, email, priority } = req.body;
      const userId = req.user.id;

      if (!category || !subject || !description || !priority) {
        return sendErrorResponse(res, 'All fields are required', 400);
      }

      const ticketPayload = {
        user: userId,
        category,
        subject,
        description,
        email,
        priority,
        status: 'open',
      };

      const ticket = await ticketsRepository.createTicket(ticketPayload);

      // Emit socket event for admin notification
      emitToAdmins(req.app, socketEvents.DOMAIN.TICKET_CREATED, {
        ticketId: ticket._id,
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
      const userId = req.user.id;
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
      const userId = req.user.id;

      const ticket = await ticketsRepository.getTicketById(ticketId);

      if (!ticket) {
        return sendErrorResponse(res, 'Ticket not found', 404);
      }

      // Verify ticket belongs to user
      if (ticket.user.toString() !== userId) {
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
      const userId = req.user.id;

      if (!orderId || !itemIds || !reason || !comments) {
        return sendErrorResponse(res, 'All fields are required', 400);
      }

      const refundPayload = {
        user: userId,
        order: orderId,
        items: itemIds,
        reason,
        comments,
        status: 'pending',
      };

      const refund = await refundsRepository.createRefundRequest(refundPayload);

      // Emit socket event for admin notification
      emitToAdmins(req.app, socketEvents.DOMAIN.REFUND_CREATED, {
        refundId: refund._id,
        orderId: refund.order,
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
      const userId = req.user.id;
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
      const userId = req.user.id;

      const refund = await refundsRepository.getRefundRequestById(refundId);

      if (!refund) {
        return sendErrorResponse(res, 'Refund request not found', 404);
      }

      // Verify refund belongs to user
      if (refund.user.toString() !== userId) {
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
      const tickets = await ticketsRepository.getTickets();
      return sendSuccessResponse(res, { tickets }, 'All tickets fetched successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  // Get all refunds (admin)
  getAllRefunds: async (req, res) => {
    try {
      const refunds = await refundsRepository.getRefundRequests();
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
      const userId = req.user.id;

      if (!message || !message.trim()) {
        return sendErrorResponse(res, 'Message is required', 400);
      }

      const ticket = await ticketsRepository.getTicketById(ticketId);
      if (!ticket) {
        return sendErrorResponse(res, 'Ticket not found', 404);
      }

      // Verify ticket belongs to user
      if (ticket.user.toString() !== userId) {
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
      const userId = req.user.id;

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
      if (ticket.user.toString() !== userId) {
        return sendErrorResponse(res, 'Unauthorized', 403);
      }

      const updatedTicket = await ticketsRepository.updateTicketStatus(ticketId, status);

      // Emit socket event for real-time sync
      emitToUser(req.app, userId, socketEvents.DOMAIN.TICKET_UPDATED, {
        ticketId: updatedTicket._id,
        status: updatedTicket.status,
      });

      return sendSuccessResponse(res, { ticket: updatedTicket }, 'Ticket status updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },
};

module.exports = supportController;
