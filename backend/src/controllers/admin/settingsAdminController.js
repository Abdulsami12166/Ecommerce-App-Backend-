const StoreSetting = require('../../models/StoreSetting');
const AuditLog = require('../../models/AuditLog');

const DEFAULT_SETTINGS = [
  // General
  { key: 'store.name', label: 'Store Name', value: 'My Ecommerce Store', type: 'string', category: 'general', section: 'brand', description: 'The public name of your store' },
  { key: 'store.tagline', label: 'Store Tagline', value: 'Shop the best products online', type: 'string', category: 'general', section: 'brand', description: 'Short description shown on the homepage' },
  { key: 'store.email', label: 'Support Email', value: 'support@store.com', type: 'string', category: 'general', section: 'contact', description: 'Customer support email address' },
  { key: 'store.phone', label: 'Support Phone', value: '+91-9999999999', type: 'string', category: 'general', section: 'contact', description: 'Customer support phone number' },
  { key: 'store.currency', label: 'Currency', value: 'INR', type: 'string', category: 'general', section: 'locale', description: 'Store currency code' },
  { key: 'store.language', label: 'Language', value: 'en', type: 'string', category: 'general', section: 'locale', description: 'Default store language' },
  // Shipping
  { key: 'shipping.free_threshold', label: 'Free Shipping Threshold (₹)', value: 500, type: 'number', category: 'shipping', section: 'fees', description: 'Orders above this amount get free shipping' },
  { key: 'shipping.default_fee', label: 'Default Shipping Fee (₹)', value: 49, type: 'number', category: 'shipping', section: 'fees', description: 'Flat rate shipping fee' },
  { key: 'shipping.express_fee', label: 'Express Shipping Fee (₹)', value: 99, type: 'number', category: 'shipping', section: 'fees', description: 'Express delivery surcharge' },
  { key: 'shipping.estimated_days', label: 'Estimated Delivery (days)', value: 5, type: 'number', category: 'shipping', section: 'delivery', description: 'Standard delivery time in business days' },
  // Payment
  { key: 'payment.cod_enabled', label: 'Cash On Delivery', value: true, type: 'boolean', category: 'payment', section: 'methods', description: 'Enable COD payment option' },
  { key: 'payment.razorpay_enabled', label: 'Razorpay Payments', value: true, type: 'boolean', category: 'payment', section: 'methods', description: 'Enable Razorpay payment gateway' },
  { key: 'payment.min_order_amount', label: 'Minimum Order Amount (₹)', value: 100, type: 'number', category: 'payment', section: 'limits', description: 'Minimum cart value to place an order' },
  // Tax
  { key: 'tax.gst_enabled', label: 'GST Enabled', value: true, type: 'boolean', category: 'tax', section: 'gst', description: 'Apply GST to orders' },
  { key: 'tax.gst_rate', label: 'Default GST Rate (%)', value: 18, type: 'number', category: 'tax', section: 'gst', description: 'GST percentage applied to taxable products' },
  { key: 'tax.tax_inclusive', label: 'Prices Include Tax', value: false, type: 'boolean', category: 'tax', section: 'gst', description: 'Whether product prices already include GST' },
  // Notifications
  { key: 'notifications.order_placed', label: 'Order Placed Email', value: true, type: 'boolean', category: 'notifications', section: 'email', description: 'Send confirmation email when order is placed' },
  { key: 'notifications.order_shipped', label: 'Order Shipped Email', value: true, type: 'boolean', category: 'notifications', section: 'email', description: 'Notify customer when order ships' },
  { key: 'notifications.low_stock_alert', label: 'Low Stock Alert', value: true, type: 'boolean', category: 'notifications', section: 'admin', description: 'Alert admin when stock falls below reorder level' },
  // Security
  { key: 'security.max_login_attempts', label: 'Max Login Attempts', value: 5, type: 'number', category: 'security', section: 'auth', description: 'Account locked after this many failed logins' },
  { key: 'security.session_timeout', label: 'Session Timeout (hours)', value: 24, type: 'number', category: 'security', section: 'auth', description: 'Admin session expires after this many hours' },
  { key: 'security.otp_expiry', label: 'OTP Expiry (minutes)', value: 10, type: 'number', category: 'security', section: 'auth', description: 'Time window for OTP validity' },
  // Performance
  { key: 'performance.cache_ttl', label: 'Cache TTL (seconds)', value: 300, type: 'number', category: 'performance', section: 'cache', description: 'Time-to-live for cached API responses' },
  { key: 'performance.products_per_page', label: 'Products Per Page', value: 20, type: 'number', category: 'performance', section: 'pagination', description: 'Number of products shown per page' },
];

const seedDefaultSettings = async () => {
  const count = await StoreSetting.countDocuments();
  if (count > 0) return;
  await StoreSetting.insertMany(DEFAULT_SETTINGS.map(s => ({ ...s, isEditable: true })));
};

/**
 * Get all store settings grouped by category
 */
exports.getAllSettings = async (req, res) => {
  try {
    await seedDefaultSettings();

    const { category, section } = req.query;

    let query = {};
    if (category) query.category = category;
    if (section) query.section = section;

    const settings = await StoreSetting.find(query).sort('category section key');

    // Group by category and section
    const grouped = {};
    settings.forEach(setting => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = {};
      }
      if (!grouped[setting.category][setting.section]) {
        grouped[setting.category][setting.section] = [];
      }
      grouped[setting.category][setting.section].push(setting);
    });

    res.json({
      success: true,
      data: grouped,
      ungrouped: settings
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get a specific setting
 */
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await StoreSetting.findOne({ key });
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a setting
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    let setting = await StoreSetting.findOne({ key });
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    if (!setting.isEditable) {
      return res.status(403).json({ success: false, message: 'This setting cannot be edited' });
    }

    const oldValue = setting.value;
    setting.value = value;
    setting.updatedBy = req.adminUser._id;
    await setting.save();

    // Log audit
    await AuditLog.create({
      actor: req.adminUser._id,
      action: 'update_setting',
      entityType: 'setting',
      entityId: setting._id,
      changes: {
        before: { value: oldValue },
        after: { value }
      },
      ipAddress: req.ip,
      resourcePath: `/api/admin/settings/${key}`
    });

    res.json({ success: true, data: setting, message: 'Setting updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update multiple settings
 */
exports.updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of { key, value }

    const updated = [];
    const errors = [];

    for (const item of settings) {
      try {
        let setting = await StoreSetting.findOne({ key: item.key });
        if (!setting) {
          errors.push({ key: item.key, error: 'Not found' });
          continue;
        }

        if (!setting.isEditable) {
          errors.push({ key: item.key, error: 'Not editable' });
          continue;
        }

        setting.value = item.value;
        setting.updatedBy = req.adminUser._id;
        await setting.save();
        updated.push(setting);
      } catch (err) {
        errors.push({ key: item.key, error: err.message });
      }
    }

    res.json({
      success: errors.length === 0,
      data: { updated, errors },
      message: `Updated ${updated.length} settings`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new setting
 */
exports.createSetting = async (req, res) => {
  try {
    const { key, value, label, category, type, section, isEditable, validation } = req.body;

    const existingSetting = await StoreSetting.findOne({ key });
    if (existingSetting) {
      return res.status(400).json({ success: false, message: 'Setting already exists' });
    }

    const setting = new StoreSetting({
      key,
      value,
      label,
      category,
      type: type || 'string',
      section: section || '',
      isEditable: isEditable !== false,
      validation: validation || {},
      defaultValue: value
    });

    await setting.save();

    res.status(201).json({ success: true, data: setting, message: 'Setting created' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get settings by category
 */
exports.getSettingsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const settings = await StoreSetting.find({ category }).sort('section key');

    // Group by section
    const grouped = {};
    settings.forEach(setting => {
      const section = setting.section || 'General';
      if (!grouped[section]) {
        grouped[section] = [];
      }
      grouped[section].push(setting);
    });

    res.json({
      success: true,
      category,
      data: grouped,
      count: settings.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Reset setting to default
 */
exports.resetSetting = async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await StoreSetting.findOne({ key });
    if (!setting) {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    const oldValue = setting.value;
    setting.value = setting.defaultValue;
    setting.updatedBy = req.adminUser._id;
    await setting.save();

    res.json({ success: true, data: setting, message: 'Setting reset to default' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export settings
 */
exports.exportSettings = async (req, res) => {
  try {
    const settings = await StoreSetting.find({ isPublic: false });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=store-settings.json');
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Import settings
 */
exports.importSettings = async (req, res) => {
  try {
    const { settings } = req.body;

    const imported = [];
    const errors = [];

    for (const settingData of settings) {
      try {
        let setting = await StoreSetting.findOne({ key: settingData.key });
        if (setting) {
          setting.value = settingData.value;
          setting.label = settingData.label || setting.label;
        } else {
          setting = new StoreSetting(settingData);
        }
        setting.updatedBy = req.adminUser._id;
        await setting.save();
        imported.push(setting);
      } catch (err) {
        errors.push({ key: settingData.key, error: err.message });
      }
    }

    res.json({
      success: errors.length === 0,
      data: { imported, errors },
      message: `Imported ${imported.length} settings`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
