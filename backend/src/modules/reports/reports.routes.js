const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticateAdmin } = require('../../middleware/auth');

// All report routes require admin authentication
router.use(authenticateAdmin);

// Get reports
router.get('/sales', reportsController.getSalesReport);
router.get('/users', reportsController.getUserReport);
router.get('/products', reportsController.getProductReport);
router.get('/inventory', reportsController.getInventoryReport);
router.get('/tickets', reportsController.getTicketReport);

// Export reports
router.get('/:type/export', reportsController.exportReport);

module.exports = router;
