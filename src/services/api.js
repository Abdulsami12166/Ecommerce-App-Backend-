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
});

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

  return {
    ...order,
    id: order._id || order.id,
    code: order.code || formatOrderCode(order._id || order.id),
    status: rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1),
    statusGroup,
    total: order.totalAmount || order.total || 0,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : order.date,
    items: Array.isArray(order.items)
      ? order.items.reduce((sum, item) => sum + (item.quantity || item.qty || 0), 0)
      : order.items,
    hero: order.items?.[0]?.image || order.hero || '',
    eta:
      rawStatus === 'delivered'
        ? 'Delivered successfully'
        : rawStatus === 'cancelled'
          ? 'Order cancelled'
          : 'Processing your delivery',
    trackingTitle:
      order.items?.[0]?.title
        ? `Track your ${order.items[0].title}`
        : order.trackingTitle || 'Track your order',
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
  getMe: token => get('/auth/me', token),
};

export const userApi = {
  getProfile: token => get('/users/profile', token),
  updateProfile: (payload, token) => put('/users/profile', payload, token),
  uploadProfileAvatar: (formData, token) => postMultipart('/users/profile/avatar', formData, token),
  toggleWishlist: (payload, token) => patch('/users/wishlist', payload, token),
};

export const productApi = {
  getProducts: () => get('/products'),
  getProductById: productId => get(`/products/${productId}`),
};

export const orderApi = {
  getOrders: token => get('/orders', token),
  getOrderById: (orderId, token) => get(`/orders/${orderId}`, token),
  createOrder: (payload, token) => post('/orders', payload, token),
};

const api = {
  get,
  post,
  put,
  patch,
  postMultipart,
};

export default api;
