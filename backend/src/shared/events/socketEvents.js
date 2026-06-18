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
    PRODUCT_CREATED: 'product.created',
    PRODUCT_UPDATED: 'product.updated',
    ADMIN_ACTIVITY_CREATED: 'admin.activity.created',
    ADMIN_FORCE_LOGOUT: 'admin.user.force_logout',
    FEATURE_TOGGLE_UPDATED: 'admin.feature_toggle.updated',
    TICKET_CREATED: 'support.ticket.created',
    TICKET_UPDATED: 'support.ticket.updated',
    TICKET_MESSAGE_ADDED: 'support.ticket.message_added',
    RETURN_CREATED: 'support.return.created',
    RETURN_UPDATED: 'support.return.updated',
    REFUND_CREATED: 'support.refund.created',
    REFUND_UPDATED: 'support.refund.updated',
    REPLACEMENT_CREATED: 'support.replacement.created',
    REPLACEMENT_UPDATED: 'support.replacement.updated',
  },
  LEGACY: {
    USER_LOGIN: 'user-login',
    NEW_ORDER: 'new-order',
    ORDER_STATUS_CHANGED: 'order-status-changed',
    USER_FORCE_LOGOUT: 'user-force-logout',
  },
};

module.exports = { socketEvents };
