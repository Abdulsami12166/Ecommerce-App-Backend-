const express = require('express');
const router = express.Router();
const replacementsController = require('./replacements.controller');
const { authenticateUser } = require('../../middleware/auth');

// User routes
router.post('/', authenticateUser, replacementsController.createReplacementRequest);
router.get('/', authenticateUser, replacementsController.getUserReplacements);
router.get('/:replacementId', authenticateUser, replacementsController.getReplacementDetail);

// Admin routes
router.get('/admin/all', authenticateUser, replacementsController.getAllReplacements);
router.patch('/:replacementId/status', authenticateUser, replacementsController.updateReplacementStatus);

module.exports = router;
