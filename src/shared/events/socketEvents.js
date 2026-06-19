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
    // Inventory real-time events
    INVENTORY_UPDATED: 'inventory.updated',
    LOW_STOCK_ALERT: 'inventory.low_stock',
    // Shipment real-time events
    SHIPMENT_CREATED: 'shipment.created',
    SHIPMENT_UPDATED: 'shipment.updated',
    // Notification real-time events
    NOTIFICATION_SENT: 'notification.sent',
    // Audit log events
    AUDIT_LOG_CREATED: 'audit.log.created',
    // Support events
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
