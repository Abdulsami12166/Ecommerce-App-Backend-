const express = require('express');
const router = express.Router();
const returnsController = require('./returns.controller');
const { authenticateUser } = require('../../middleware/auth');

// User routes
router.post('/', authenticateUser, returnsController.createReturnRequest);
router.get('/', authenticateUser, returnsController.getUserReturns);
router.get('/:returnId', authenticateUser, returnsController.getReturnDetail);

// Admin routes
router.get('/admin/all', authenticateUser, returnsController.getAllReturns);
router.patch('/:returnId/status', authenticateUser, returnsController.updateReturnStatus);

module.exports = router;
