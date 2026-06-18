const StoreSetting = require('../models/StoreSetting');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/responseHandler');

const getSettingValue = async (key, defaultValue) => {
  const setting = await StoreSetting.findOne({ key });
  return setting ? setting.value : defaultValue;
};

const updateSettingValue = async (key, value, userId) => {
  let setting = await StoreSetting.findOne({ key });
  if (setting) {
    setting.value = value;
    setting.updatedBy = userId;
    await setting.save();
  } else {
    await StoreSetting.create({
      key,
      value,
      updatedBy: userId
    });
  }
};

const storeSettingsController = {
  getGeneralSettings: async (req, res) => {
    try {
      const store_name = await getSettingValue('store.name', 'My Ecommerce Store');
      const store_logo = await getSettingValue('store.logo', 'https://example.com/logo.png');
      const currency = await getSettingValue('store.currency', 'INR');
      const timezone = await getSettingValue('store.timezone', 'UTC');
      const tax_rate = await getSettingValue('tax.gst_rate', 18);
      const shipping_charge = await getSettingValue('shipping.default_fee', 49);
      const support_email = await getSettingValue('store.email', 'support@store.com');
      const support_phone = await getSettingValue('store.phone', '+91-9999999999');

      return sendSuccessResponse(res, {
        store_name,
        store_logo,
        currency,
        timezone,
        tax_rate,
        shipping_charge,
        support_email,
        support_phone,
        updated_at: new Date()
      });
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  updateGeneralSettings: async (req, res) => {
    try {
      const { store_name, store_logo, currency, timezone, tax_rate, shipping_charge, support_email, support_phone } = req.body;
      const userId = req.user?._id || req.adminUser?._id;

      if (store_name !== undefined) await updateSettingValue('store.name', store_name, userId);
      if (store_logo !== undefined) await updateSettingValue('store.logo', store_logo, userId);
      if (currency !== undefined) await updateSettingValue('store.currency', currency, userId);
      if (timezone !== undefined) await updateSettingValue('store.timezone', timezone, userId);
      if (tax_rate !== undefined) await updateSettingValue('tax.gst_rate', Number(tax_rate), userId);
      if (shipping_charge !== undefined) await updateSettingValue('shipping.default_fee', Number(shipping_charge), userId);
      if (support_email !== undefined) await updateSettingValue('store.email', support_email, userId);
      if (support_phone !== undefined) await updateSettingValue('store.phone', support_phone, userId);

      return sendSuccessResponse(res, null, 'Store settings updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getPaymentSettings: async (req, res) => {
    try {
      const cod_enabled = await getSettingValue('payment.cod_enabled', true);
      const razorpay_enabled = await getSettingValue('payment.razorpay_enabled', true);
      const min_order_amount = await getSettingValue('payment.min_order_amount', 100);
      const refund_policy = await getSettingValue('payment.refund_policy', '30-day return policy');

      return sendSuccessResponse(res, {
        cod_enabled,
        razorpay_enabled,
        min_order_amount,
        refund_policy
      });
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  updatePaymentSettings: async (req, res) => {
    try {
      const { cod_enabled, razorpay_enabled, min_order_amount, refund_policy } = req.body;
      const userId = req.user?._id || req.adminUser?._id;

      if (cod_enabled !== undefined) await updateSettingValue('payment.cod_enabled', Boolean(cod_enabled), userId);
      if (razorpay_enabled !== undefined) await updateSettingValue('payment.razorpay_enabled', Boolean(razorpay_enabled), userId);
      if (min_order_amount !== undefined) await updateSettingValue('payment.min_order_amount', Number(min_order_amount), userId);
      if (refund_policy !== undefined) await updateSettingValue('payment.refund_policy', refund_policy, userId);

      return sendSuccessResponse(res, null, 'Payment settings updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  getShippingSettings: async (req, res) => {
    try {
      const shipping_charge = await getSettingValue('shipping.default_fee', 49);
      const free_shipping_threshold = await getSettingValue('shipping.free_threshold', 500);
      const estimated_delivery_time = await getSettingValue('shipping.estimated_days', 5);

      return sendSuccessResponse(res, {
        shipping_charge,
        free_shipping_threshold,
        estimated_delivery_time
      });
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  },

  updateShippingSettings: async (req, res) => {
    try {
      const { shipping_charge, free_shipping_threshold, estimated_delivery_time } = req.body;
      const userId = req.user?._id || req.adminUser?._id;

      if (shipping_charge !== undefined) await updateSettingValue('shipping.default_fee', Number(shipping_charge), userId);
      if (free_shipping_threshold !== undefined) await updateSettingValue('shipping.free_threshold', Number(free_shipping_threshold), userId);
      if (estimated_delivery_time !== undefined) await updateSettingValue('shipping.estimated_days', Number(estimated_delivery_time), userId);

      return sendSuccessResponse(res, null, 'Shipping settings updated successfully');
    } catch (error) {
      return sendErrorResponse(res, error.message, 500);
    }
  }
};

module.exports = storeSettingsController;
