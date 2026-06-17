const { sendSuccess } = require('../../shared/utils/apiResponse');
const adminService = require('./admin.service');
const authController = require('../auth/auth.controller');

const wrap = (fn, successMessage, successCode = 200) => async (req, res, next) => {
  try {
    const data = await fn(req);
    return sendSuccess(res, successCode, successMessage, data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  loginAdmin: authController.loginAdmin,
  getDashboardMetrics: wrap(() => adminService.getDashboardMetrics(), 'Dashboard metrics fetched successfully'),
  getActivities: wrap(req => adminService.getActivities(req.query), 'Activities fetched successfully'),
  getUsers: wrap(() => adminService.getUsers(), 'Admin users fetched successfully'),
  getUserOrders: wrap(req => adminService.getUserOrders(req.params.id), 'User orders fetched successfully'),
  deleteUser: wrap(req => adminService.deleteUser(req.params.id), 'User deleted successfully'),
  blockUser: wrap(req => adminService.blockUser(req.params.id, req.app), 'User blocked successfully'),
  unblockUser: wrap(req => adminService.unblockUser(req.params.id, req.app), 'User unblocked successfully'),
  forceLogoutUser: wrap(req => adminService.forceLogoutUser(req.params.id, req.app), 'User has been forcefully logged out'),
  getCustomers: wrap(req => adminService.getCustomers(req.query), 'Customers fetched successfully'),
  getCustomerDetail: wrap(req => adminService.getCustomerDetail(req.params.id), 'Customer details fetched successfully'),
  getCustomerActivityLogs: wrap(req => adminService.getCustomerActivityLogs(req.params.id, req.query), 'Customer activity logs fetched successfully'),
  getCustomerNotificationPreferences: wrap(req => adminService.getCustomerNotificationPreferences(req.params.id), 'Customer notification preferences fetched successfully'),
  getProducts: wrap(() => adminService.getProducts(), 'Admin products fetched successfully'),
  createProduct: wrap(req => adminService.createProduct(req.body, req.userId, req.app), 'Product created successfully', 201),
  updateProduct: wrap(req => adminService.updateProduct(req.params.id, req.body, req.app), 'Product updated successfully'),


  deleteProduct: wrap(req => adminService.deleteProduct(req.params.id), 'Product deleted successfully'),
  getOrders: wrap(() => adminService.getOrders(), 'Admin orders fetched successfully'),
  getTransactions: wrap(() => adminService.getTransactions(), 'Admin transactions fetched successfully'),
  createOrder: wrap(req => adminService.createAdminOrder(req.body, req.app), 'Order created successfully', 201),
  updateOrderStatus: wrap(req => adminService.updateOrderStatus(req.params.id, req.body, req.app), 'Order status updated successfully'),
  deleteOrder: wrap(req => adminService.deleteOrder(req.params.id), 'Order deleted successfully'),

  // Order timeline
  getOrderTimeline: wrap(req => adminService.getOrderTimeline(req.params.orderId), 'Order timeline fetched successfully'),
  addOrderTimelineEvent: wrap(req => adminService.addOrderTimelineEvent(req.params.orderId, req.body, req.userId, req.app), 'Order timeline event added successfully', 201),
};
