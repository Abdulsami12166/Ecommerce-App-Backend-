const { ordersRepository } = require('./orders.repository');
const { authRepository } = require('../auth/auth.repository');
const { AppError } = require('../../shared/utils/appError');
const { emitToAdmins, emitToUser } = require('../../shared/events/eventBus');
const { socketEvents } = require('../../shared/events/socketEvents');

const createOrderPayload = (currentUser, payload) => {
  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) throw new AppError('At least one order item is required', 400);

  const normalizedItems = items.map(item => ({
    product: item.productId,
    title: item.title,
    quantity: item.quantity,
    selectedSize: item.size || item.selectedSize || 'M',
    selectedVariant: item.variant || item.selectedVariant || item.size || '',
    variantId: item.variantId || '',
    sku: item.sku || '',
    price: item.price,
    image: item.image || '',
  }));

  const subtotal = normalizedItems.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  );
  const shippingFee = Number(payload.shippingFee || 0);
  const taxAmount = Number(payload.taxAmount || 0);

  return {
    user: currentUser._id,
    items: normalizedItems,
    address: payload.addressId,
    subtotal,
    shippingFee,
    taxAmount,
    totalAmount: subtotal + shippingFee + taxAmount,
    orderStatus: payload.orderStatus || 'processing',
    paymentStatus: payload.paymentStatus || 'pending',
    paymentMethod: payload.paymentMethod || 'card',
    paymentReference: payload.paymentReference || '',
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

  const order = await ordersRepository.createOrder(createOrderPayload(currentUser, payload));

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

module.exports = {
  getOrdersForUser,
  getOrderForUser,
  createOrderForUser,
};
