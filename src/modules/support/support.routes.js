const express = require('express');
const { requireUserAuth, requireAdminAuth, requireAdminRole } = require('../../../shared/middleware/auth');
const supportController = require('./support.controller');

const router = express.Router();

// User routes - create and retrieve own tickets
router.post('/tickets', requireUserAuth, supportController.createTicket);
router.get('/tickets', requireUserAuth, supportController.getUserTickets);
router.get('/tickets/:ticketId', requireUserAuth, supportController.getTicketDetail);
router.post('/tickets/:ticketId/messages', requireUserAuth, supportController.addMessage);
router.patch('/tickets/:ticketId/status', requireUserAuth, supportController.updateTicketStatus);

// Refund request routes
router.post('/refunds', requireUserAuth, supportController.createRefundRequest);
router.get('/refunds', requireUserAuth, supportController.getUserRefunds);
router.get('/refunds/:refundId', requireUserAuth, supportController.getRefundDetail);

// Return request routes
router.post('/returns', requireUserAuth, supportController.createReturnRequest);
router.get('/returns', requireUserAuth, supportController.getUserReturns);
router.get('/returns/:returnId', requireUserAuth, supportController.getReturnDetail);

// Admin routes
router.get(
  '/admin/tickets',
  requireAdminAuth,
  requireAdminRole('admin', 'super-admin', 'support'),
  supportController.getAllTickets,
);
router.get(
  '/admin/refunds',
  requireAdminAuth,
  requireAdminRole('admin', 'super-admin', 'support'),
  supportController.getAllRefunds,
);

module.exports = router;

