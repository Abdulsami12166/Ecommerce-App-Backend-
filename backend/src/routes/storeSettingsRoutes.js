const express = require('express');
const storeSettingsController = require('../controllers/storeSettingsController');
const { requireAdminAuth, requireAdminRole } = require('../shared/middleware/auth');

const router = express.Router();

router.get('/', storeSettingsController.getGeneralSettings);
router.put('/', requireAdminAuth, requireAdminRole('admin', 'super-admin'), storeSettingsController.updateGeneralSettings);

router.get('/payment', storeSettingsController.getPaymentSettings);
router.put('/payment', requireAdminAuth, requireAdminRole('admin', 'super-admin'), storeSettingsController.updatePaymentSettings);

router.get('/shipping', storeSettingsController.getShippingSettings);
router.put('/shipping', requireAdminAuth, requireAdminRole('admin', 'super-admin'), storeSettingsController.updateShippingSettings);

module.exports = router;
