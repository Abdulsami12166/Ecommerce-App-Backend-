import { getApiBaseUrl } from '../config/apiConfig';

const BASE_URL = getApiBaseUrl();

export const normalizeProduct = product => ({
  ...product,
  id: product._id || product.id,
  name: product.title || product.name,
  image: product.images?.[0] || product.image || '',
  price: product.discountedPrice || product.price,
  originalPrice: product.price,
  rating: product.averageRating || product.rating || 0,
  sizes: normalizeSizes(product.sizes || product.attributes?.size || product.size),
});

const normalizeSizes = value => {
  if (Array.isArray(value)) {
    return value.map(item => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value.split(',').map(item => item.trim()).filter(Boolean);
  }

  return [];
};

const formatOrderCode = value =>
  value ? `#${String(value).slice(-6).toUpperCase()}` : '#ORDER';

export const normalizeOrder = order => {
  const rawStatus = order.orderStatus || order.status || 'pending';
  let statusGroup = 'current';

  if (rawStatus === 'delivered') {
    statusGroup = 'completed';
  } else if (rawStatus === 'cancelled') {
    statusGroup = 'cancelled';
  }

  const rawItems = Array.isArray(order.items) ? order.items : [];

  return {
    ...order,
    id: order._id || order.id,
    code: order.code || formatOrderCode(order._id || order.id),
    status: rawStatus.split('-').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
    statusGroup,
    total: order.totalAmount || order.total || 0,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date,
    items: rawItems.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0),
    cartItems: rawItems.map(item => {
      // item.product may be a populated object OR a plain string/ObjectId
      const productRef = item.product;
      const rawProductId =
        (productRef && typeof productRef === 'object'
          ? String(productRef._id || productRef.id || productRef)
          : String(productRef || '')) ||
        String(item.productId || item.id || item._id || Math.random());

      const productName =
        (productRef && typeof productRef === 'object'
          ? productRef.title || productRef.name
          : null) ||
        item.title || item.name || '';

      return {
        ...item,
        id: rawProductId,
        productId: rawProductId,
        name: productName,
        quantity: item.quantity || item.qty || 1,
        price: item.price || 0,
        image: item.image || (productRef && typeof productRef === 'object' ? productRef.images?.[0] : '') || '',
      };
    }),
    hero: rawItems[0]?.image || order.hero || '',
    eta:
      rawStatus === 'delivered'
        ? 'Delivered successfully'
        : rawStatus === 'cancelled'
          ? 'Order cancelled'
          : 'Processing your delivery',
    trackingTitle:
      rawItems[0]?.title
        ? `Track your ${rawItems[0].title}`
        : order.trackingTitle || 'Track your order',
    statusHistory: Array.isArray(order.statusHistory) ? order.statusHistory : [],
  };
};

const buildHeaders = (token, includeJsonContentType = true) => {
  const headers = {};

  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
};

const parseJsonResponse = async response => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.message || 'Request failed');
    error.response = { data, status: response.status };
    throw error;
  }

  return { data, status: response.status };
};

const request = async (path, { method = 'GET', payload, token, isMultipart = false } = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: buildHeaders(token, !isMultipart),
    body: payload ? (isMultipart ? payload : JSON.stringify(payload)) : undefined,
  });

  return parseJsonResponse(response);
};

const post = async (path, payload, token) => request(path, { method: 'POST', payload, token });
const put = async (path, payload, token) => request(path, { method: 'PUT', payload, token });
const patch = async (path, payload, token) => request(path, { method: 'PATCH', payload, token });
const get = async (path, token) => {
  return request(path, { method: 'GET', token });
};
const postMultipart = async (path, formData, token) =>
  request(path, { method: 'POST', payload: formData, token, isMultipart: true });

export const authApi = {
  register: payload => post('/auth/register', payload),
  login: payload => post('/auth/login', payload),
  verifyOtp: payload => post('/auth/verify-otp', payload),
  resendOtp: payload => post('/auth/resend-otp', payload),
  forgotPassword: payload => post('/auth/forgot-password', payload),
  resetPassword: payload => post('/auth/reset-password', payload),
  logout: token => post('/auth/logout', {}, token),
  getMe: token => get('/auth/me', token),
};

export const userApi = {
  getProfile: token => get('/users/profile', token),
  updateProfile: (payload, token) => put('/users/profile', payload, token),
  uploadProfileAvatar: (formData, token) => postMultipart('/users/profile/avatar', formData, token),
  toggleWishlist: (payload, token) => patch('/users/wishlist', payload, token),
  updateFcmToken: (fcmToken, token) => patch('/users/fcm-token', { fcmToken }, token),
};

export const productApi = {
  getProducts: () => get('/products'),
  getProductById: productId => get(`/products/${productId}`),
};

export const orderApi = {
  getOrders: token => get('/orders', token),
  getOrderById: (orderId, token) => get(`/orders/${orderId}`, token),
  createRazorpayOrder: (payload, token) => post('/orders/payments/razorpay/order', payload, token),
  verifyRazorpayPayment: (payload, token) => post('/orders/payments/razorpay/verify', payload, token),
  createOrder: (payload, token) => post('/orders', payload, token),
};

export const ticketApi = {
  createTicket: (payload, token) => post('/support/tickets', payload, token),
  getTickets: token => get('/support/tickets', token),
  getTicketById: (ticketId, token) => get(`/support/tickets/${ticketId}`, token),
  addMessage: (ticketId, payload, token) => post(`/support/tickets/${ticketId}/messages`, payload, token),
  updateTicketStatus: (ticketId, payload, token) => patch(`/support/tickets/${ticketId}/status`, payload, token),
};

export const refundApi = {
  requestRefund: (payload, token) => post('/support/refunds', payload, token),
  getRefunds: token => get('/support/refunds', token),
  getRefundById: (refundId, token) => get(`/support/refunds/${refundId}`, token),
};

export const returnApi = {
  createReturnRequest: (payload, token) => post('/support/returns', payload, token),
  getReturns: token => get('/support/returns', token),
  getReturnById: (returnId, token) => get(`/support/returns/${returnId}`, token),
};

export const replacementApi = {
  createReplacementRequest: (payload, token) => post('/support/replacements', payload, token),
  getReplacements: token => get('/support/replacements', token),
  getReplacementById: (replacementId, token) => get(`/support/replacements/${replacementId}`, token),
};

const api = {
  get,
  post,
  put,
  patch,
  postMultipart,
};

export default api;
