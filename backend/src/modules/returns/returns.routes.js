const express = require('express');
const router = express.Router();
const returnsController = require('./returns.controller');
const { requireUserAuth } = require('../../shared/middleware/auth');

// User routes
router.post('/', requireUserAuth, returnsController.createReturnRequest);
router.get('/', requireUserAuth, returnsController.getUserReturns);
router.get('/:returnId', requireUserAuth, returnsController.getReturnDetail);

// Admin routes
router.get('/admin/all', requireUserAuth, returnsController.getAllReturns);
router.patch('/:returnId/status', requireUserAuth, returnsController.updateReturnStatus);

module.exports = router;
