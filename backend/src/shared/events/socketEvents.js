const socketEvents = {
  ADMIN_SUBSCRIBE: 'subscribe-admin',
  ROOMS: {
    ADMINS: 'admin-room',
    user: userId => `user:${userId}`,
  },
  DOMAIN: {
    USER_LOGGED_IN: 'auth.user.logged_in',
    USER_LOGGED_OUT: 'auth.user.logged_out',
    ORDER_CREATED: 'order.created',
    ORDER_UPDATED: 'order.updated',
    ADMIN_ACTIVITY_CREATED: 'admin.activity.created',
    ADMIN_FORCE_LOGOUT: 'admin.user.force_logout',
  },
  LEGACY: {
    USER_LOGIN: 'user-login',
    NEW_ORDER: 'new-order',
    ORDER_STATUS_CHANGED: 'order-status-changed',
    USER_FORCE_LOGOUT: 'user-force-logout',
  },
};

module.exports = { socketEvents };
