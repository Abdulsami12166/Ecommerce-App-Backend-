const express = require('express');
const router = express.Router();
const replacementsController = require('./replacements.controller');
const { requireUserAuth } = require('../../shared/middleware/auth');

// User routes
router.post('/', requireUserAuth, replacementsController.createReplacementRequest);
router.get('/', requireUserAuth, replacementsController.getUserReplacements);
router.get('/:replacementId', requireUserAuth, replacementsController.getReplacementDetail);

// Admin routes
router.get('/admin/all', requireUserAuth, replacementsController.getAllReplacements);
router.patch('/:replacementId/status', requireUserAuth, replacementsController.updateReplacementStatus);

module.exports = router;
