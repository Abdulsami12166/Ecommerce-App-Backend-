const { ordersRepository } = require('./orders.repository');
const { authRepository } = require('../auth/auth.repository');
const { AppError } = require('../../shared/utils/appError');
const { emitToAdmins, emitToUser } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const getRazorpayClient = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Razorpay is not configured on the server', 500);
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const verifyRazorpaySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new AppError('Razorpay is not configured on the server', 500);
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new AppError('Razorpay payment verification details are required', 400);
  }

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw new AppError('Payment verification failed', 400);
  }
};

const createOrderPayload = (currentUser, payload) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new AppError('At least one order item is required', 400);

  const normalizedItems = items.map(item => ({
    product: item.productId,
    title: item.title,
    quantity: item.quantity,
    selectedSize: item.size || item.selectedSize || 'M',
    price: item.price,
    image: item.image || '',
  }));

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const shippingFee = Number(payload.shippingFee || 0);
  const taxAmount = Number(payload.taxAmount || 0);

  const initialStatus = payload.orderStatus || 'processing';
  return {
    user: currentUser._id,
    items: normalizedItems,
    address: payload.addressId,
    subtotal,
    shippingFee,
    taxAmount,
    totalAmount: subtotal + shippingFee + taxAmount,
    orderStatus: initialStatus,
    statusHistory: [
      {
        status: initialStatus,
        label: String(initialStatus)
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' '),
        timestamp: new Date(),
      },
    ],
    paymentStatus: payload.paymentStatus || 'pending',
    paymentMethod: payload.paymentMethod || 'card',
    paymentReference: payload.paymentReference || '',
    razorpayOrderId: payload.razorpayOrderId || '',
    razorpayPaymentId: payload.razorpayPaymentId || '',
    razorpaySignature: payload.razorpaySignature || '',
    transactionStatus: payload.transactionStatus || (payload.paymentStatus === 'paid' ? 'paid' : 'pending'),
    transactionVerifiedAt: payload.transactionVerifiedAt || (payload.paymentStatus === 'paid' ? new Date() : null),
  };
};

const getOrdersForUser = async userId => ({ orders: await ordersRepository.findOrdersByUserId(userId) });

const getOrderForUser = async (userId, orderId) => {
  const order = await ordersRepository.findOrderById(orderId);
  if (!order || String(order.user?._id || order.user) !== String(userId)) {
    throw new AppError('Order not found', 404);
  }
  return { order };
};

const createOrderForUser = async (userId, payload, app) => {
  const currentUser = await authRepository.findUserById(userId);
  if (!currentUser) throw new AppError('User not found', 404);

  if (payload.paymentStatus === 'paid') {
    verifyRazorpaySignature(payload);
  }

  const order = await ordersRepository.createOrder(createOrderPayload(currentUser, payload));

  // Auto-generate invoice for the new order
  try {
    const { generateInvoiceForOrder } = require('../../shared/services/invoiceService');
    await generateInvoiceForOrder(order._id);
  } catch (invErr) {
    console.error('[Invoice] Auto-generation failed on order creation:', invErr.message);
  }

  await authRepository.createActivity({
    user: currentUser._id,
    action: 'order',
    details: `${currentUser.name} placed order ${String(order._id).slice(-6).toUpperCase()}`,
  });

  const eventPayload = {
    orderId: String(order._id),
    userId: String(currentUser._id),
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    createdAt: order.createdAt,
  };

  emitToAdmins(app, socketEvents.LEGACY.NEW_ORDER, eventPayload);
  emitToAdmins(app, socketEvents.DOMAIN.ORDER_CREATED, eventPayload);
  emitToUser(app, currentUser._id, socketEvents.DOMAIN.ORDER_CREATED, eventPayload);

  const populatedOrder = await ordersRepository.findOrderById(order._id);
  return { order: populatedOrder };
};

const createPaymentOrderForUser = async (userId, payload) => {
  const currentUser = await authRepository.findUserById(userId);
  if (!currentUser) throw new AppError('User not found', 404);

  const orderPayload = createOrderPayload(currentUser, payload);
  const amountInPaise = Math.round(orderPayload.totalAmount * 100);
  if (amountInPaise <= 0) {
    throw new AppError('Payment amount must be greater than zero', 400);
  }

  const razorpayOrder = await getRazorpayClient().orders.create({
    amount: amountInPaise,
    currency: 'INR',
    receipt: `cart_${Date.now()}`,
    notes: {
      userId: String(currentUser._id),
      email: currentUser.email,
    },
  });

  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    razorpayOrder,
    amount: orderPayload.totalAmount,
    currency: 'INR',
  };
};

const verifyPaymentForUser = async (userId, payload) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = payload || {};

  verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature });

  const existingOrder = await ordersRepository.findOrderByRazorpayOrderId(razorpayOrderId);
  if (existingOrder && String(existingOrder.user?._id || existingOrder.user) !== String(userId)) {
    throw new AppError('Payment reference already belongs to another user', 403);
  }

  return {
    verified: true,
    payment: {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      paymentReference: razorpayPaymentId,
      paymentStatus: 'paid',
      transactionStatus: 'paid',
      transactionVerifiedAt: new Date(),
    },
  };
};

module.exports = {
  getOrdersForUser,
  getOrderForUser,
  createOrderForUser,
  createPaymentOrderForUser,
  verifyPaymentForUser,
};
