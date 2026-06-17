const express = require('express');
const { authenticateUser, authorizeAdmin } = require('../../middleware/auth');
const supportController = require('./support.controller');

const router = express.Router();

// User routes - create and retrieve own tickets
router.post('/tickets', authenticateUser, supportController.createTicket);
router.get('/tickets', authenticateUser, supportController.getUserTickets);
router.get('/tickets/:ticketId', authenticateUser, supportController.getTicketDetail);
router.post('/tickets/:ticketId/messages', authenticateUser, supportController.addMessage);
router.patch('/tickets/:ticketId/status', authenticateUser, supportController.updateTicketStatus);

// Refund request routes
router.post('/refunds', authenticateUser, supportController.createRefundRequest);
router.get('/refunds', authenticateUser, supportController.getUserRefunds);
router.get('/refunds/:refundId', authenticateUser, supportController.getRefundDetail);

// Admin routes
router.get('/admin/tickets', authorizeAdmin, supportController.getAllTickets);
router.get('/admin/refunds', authorizeAdmin, supportController.getAllRefunds);

module.exports = router;
