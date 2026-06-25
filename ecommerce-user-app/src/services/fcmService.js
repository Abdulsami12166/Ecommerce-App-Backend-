import { Platform, NativeModules, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';

const FCM_TOKEN_KEY = '@ecommerce/fcm_token';
const NOTIFICATION_HISTORY_KEY = '@ecommerce/notification_history';

/**
 * Comprehensive Firebase Cloud Messaging Service
 * Handles: Foreground, Background, and Terminated state notifications
 */

export class FCMService {
  static initialized = false;
  static notificationHandlers = {
    onMessage: null,
    onNotificationTapped: null,
  };

  /**
   * Initialize FCM service
   * Call once during app startup
   */
  static async initialize(onMessageCallback, onNotificationTappedCallback) {
    if (this.initialized) {
      return;
    }

    try {
      this.notificationHandlers.onMessage = onMessageCallback;
      this.notificationHandlers.onNotificationTapped = onNotificationTappedCallback;

      // Request notification permissions (Android 13+)
      await this.requestNotificationPermission();

      // Get or create FCM token
      const fcmToken = await this.getFCMToken();
      console.log('FCM Token obtained:', fcmToken?.substring(0, 20) + '...');

      // Setup handlers
      this.setupForegroundNotificationHandler();
      this.setupBackgroundNotificationHandler();

      this.initialized = true;
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  /**
   * Request notification permission (Android 13+)
   */
  static async requestNotificationPermission() {
    if (Platform.OS === 'ios') {
      return true;
    }

    if (Platform.Version < 33) {
      return true;
    }

    try {
      const alreadyGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      if (alreadyGranted) {
        return true;
      }

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );

      return result === PermissionsAndroid.RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Get or create FCM token
   */
  static async getFCMToken() {
    try {
      // Try to get cached token first
      let cachedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);

      if (cachedToken && !cachedToken.startsWith('fcm_mock_')) {
        return cachedToken;
      }

      // Try to get real FCM token
      let token = null;
      try {
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (enabled) {
          token = await messaging().getToken();
        }
      } catch (fcmError) {
        console.warn('[FCM] Failed to get real FCM token, falling back to mock:', fcmError.message);
      }

      if (token) {
        await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
        return token;
      }

      // Generate new mock token as fallback
      const newToken = this.generateFCMToken();
      await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);

      return newToken;
    } catch (error) {
      console.error('Get FCM token error:', error);
      return null;
    }
  }

  /**
   * Generate mock FCM token (replace with Firebase token in production)
   */
  static generateFCMToken() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `fcm_mock_${timestamp}_${random}`.substring(0, 152);
  }

  /**
   * Setup foreground notification handler
   * Called when notification arrives while app is running
   */
  static setupForegroundNotificationHandler() {
    try {
      messaging().onMessage(async remoteMessage => {
        console.log('[FCM] Foreground notification received:', remoteMessage);
        this.handleForegroundNotification({
          messageId: remoteMessage.messageId,
          notification: {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
          },
          data: remoteMessage.data || {},
        });
      });
    } catch (err) {
      console.warn('[FCM] Failed to setup foreground message handler:', err.message);
    }
  }

  /**
   * Setup background notification handler
   * Called when notification is tapped from status bar
   */
  static setupBackgroundNotificationHandler() {
    try {
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('[FCM] Notification caused app to open from background:', remoteMessage);
        this.handleNotificationTap({
          messageId: remoteMessage.messageId,
          notification: {
            title: remoteMessage.notification?.title || '',
            body: remoteMessage.notification?.body || '',
          },
          data: remoteMessage.data || {},
        });
      });
    } catch (err) {
      console.warn('[FCM] Failed to setup background tap handler:', err.message);
    }
  }

  /**
   * Handle foreground notification display
   */
  static handleForegroundNotification(notification) {
    // Save to history
    this.saveNotificationToHistory(notification);

    // Trigger callback
    if (this.notificationHandlers.onMessage) {
      this.notificationHandlers.onMessage(notification);
    }

    // Show native notification (so it appears in status bar even in foreground)
    this.showNativeNotification(notification);
  }

  /**
   * Handle notification tap (from status bar or notification shade)
   */
  static handleNotificationTap(notification) {
    // Save to history
    this.saveNotificationToHistory(notification);

    // Trigger callback
    if (this.notificationHandlers.onNotificationTapped) {
      this.notificationHandlers.onNotificationTapped(notification);
    }
  }

  /**
   * Show native Android notification
   */
  static showNativeNotification(notification) {
    if (Platform.OS === 'android' && NativeModules.StoreNotification) {
      NativeModules.StoreNotification.show(
        notification.notification?.title || 'Notification',
        notification.notification?.body || '',
        notification.data || {}
      );
    }
  }

  /**
   * Save notification to local history
   */
  static async saveNotificationToHistory(notification) {
    try {
      const history = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      const notifications = history ? JSON.parse(history) : [];

      const entry = {
        id: notification.messageId || `${Date.now()}`,
        title: notification.notification?.title || '',
        body: notification.notification?.body || '',
        data: notification.data || {},
        timestamp: Date.now(),
        read: false,
      };

      notifications.unshift(entry);

      // Keep only last 50 notifications
      const trimmed = notifications.slice(0, 50);
      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Save notification error:', error);
    }
  }

  /**
   * Get initial notification (when app launched from notification tap)
   */
  static async getInitialNotification() {
    try {
      try {
        const remoteMessage = await messaging().getInitialNotification();
        if (remoteMessage) {
          console.log('[FCM] Initial notification received:', remoteMessage);
          return {
            messageId: remoteMessage.messageId,
            notification: {
              title: remoteMessage.notification?.title || '',
              body: remoteMessage.notification?.body || '',
            },
            data: remoteMessage.data || {},
          };
        }
      } catch (fcmErr) {
        console.warn('[FCM] getInitialNotification error:', fcmErr.message);
      }

      if (Platform.OS === 'android' && NativeModules.StoreNotification?.getInitialNotification) {
        const nativeData = await NativeModules.StoreNotification.getInitialNotification();
        if (nativeData) {
          return {
            messageId: nativeData.id || `${Date.now()}`,
            notification: {
              title: nativeData.title || '',
              body: nativeData.body || '',
            },
            data: nativeData,
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Get initial notification error:', error);
      return null;
    }
  }

  /**
   * Get notification history
   */
  static async getNotificationHistory() {
    try {
      const history = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Get notification history error:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const history = await AsyncStorage.getItem(NOTIFICATION_HISTORY_KEY);
      const notifications = history ? JSON.parse(history) : [];

      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );

      await AsyncStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }

  /**
   * Clear notification history
   */
  static async clearHistory() {
    try {
      await AsyncStorage.removeItem(NOTIFICATION_HISTORY_KEY);
    } catch (error) {
      console.error('Clear history error:', error);
    }
  }

  /**
   * Send local notification for testing
   */
  static sendTestNotification(title = 'Test', body = 'Test notification', data = {}) {
    if (Platform.OS === 'android' && NativeModules.StoreNotification) {
      NativeModules.StoreNotification.show(title, body, data);
    }
  }
}

/**
 * Notification type definitions for consistent handling
 */
export const NotificationTypes = {
  NEW_ORDER: 'new_order',
  ORDER_UPDATE: 'order_update',
  ORDER_DELIVERED: 'order_delivered',
  CHAT_MESSAGE: 'chat_message',
  PRODUCT_MESSAGE: 'product_message',
  PRODUCT_PUBLISHED: 'product_published',
  ADMIN_BROADCAST: 'admin_broadcast',
  SYSTEM: 'system',
};

/**
 * Build notification data for consistent format
 */
export const buildNotificationData = (type, payload = {}) => {
  switch (type) {
    case NotificationTypes.NEW_ORDER:
      return {
        type,
        screen: 'Orders',
        orderId: payload.orderId,
        title: 'New Order',
        body: `Order #${payload.orderCode} has been placed`,
      };

    case NotificationTypes.ORDER_UPDATE:
      return {
        type,
        screen: 'TrackOrder',
        orderId: payload.orderId,
        title: 'Order Update',
        body: payload.status || 'Your order has been updated',
      };

    case NotificationTypes.CHAT_MESSAGE:
      return {
        type,
        screen: 'SupportChat',
        chatId: payload.chatId,
        productId: payload.productId,
        title: payload.productName || 'Chat Message',
        body: payload.message || 'You have a new message',
      };

    case NotificationTypes.PRODUCT_MESSAGE:
      return {
        type,
        screen: 'ProductDetails',
        productId: payload.productId,
        title: payload.productName || 'Product Update',
        body: payload.message || 'New update about your product',
      };

    default:
      return {
        type,
        title: payload.title || 'Notification',
        body: payload.body || 'You have a new notification',
      };
  }
};

export default FCMService;
