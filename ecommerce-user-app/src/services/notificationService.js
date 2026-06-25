import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import FCMService, { NotificationTypes, buildNotificationData } from './fcmService';

const compactNotificationData = data =>
  Object.entries(data || {}).reduce((next, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      next[key] = String(value);
    }

    return next;
  }, {});

export const requestNotificationPermission = async () => {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Platform.Version < 33) {
    return true;
  }

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
};

export const getNotificationPermissionStatus = async () => {
  if (Platform.OS === 'ios') {
    return true;
  }

  if (Platform.Version < 33) {
    return true;
  }

  return await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
};

/**
 * Show in-app notification (with status bar notification on Android)
 * CRITICAL: This shows notification in both foreground and status bar
 */
export const showLocalNotification = async ({
  title = 'Notification',
  body = '',
  data = {},
} = {}) => {
  const granted = await requestNotificationPermission();

  if (granted) {
    if (Platform.OS === 'android' && NativeModules.StoreNotification) {
      NativeModules.StoreNotification.show(title, body, compactNotificationData(data));
    }
  }

  return granted;
};

/**
 * Show notification for order events
 */
export const showOrderNotification = async (type, payload = {}) => {
  const notificationData = buildNotificationData(type, payload);

  return showLocalNotification({
    title: notificationData.title,
    body: notificationData.body,
    data: notificationData,
  });
};

/**
 * Show notification for chat messages
 * CRITICAL: Deep link to correct product chat
 */
export const showChatNotification = async ({
  productName = 'Product',
  message = 'New message',
  chatId,
  productId,
} = {}) => {
  const notificationData = buildNotificationData(NotificationTypes.CHAT_MESSAGE, {
    message,
    chatId,
    productId,
    productName,
  });

  return showLocalNotification({
    title: notificationData.title,
    body: notificationData.body,
    data: notificationData,
  });
};

/**
 * Get initial notification (for deep linking)
 * CRITICAL: Works for app launched from notification
 */
export const getInitialNotification = async () => {
  try {
    // Try FCM first
    const fcmNotification = await FCMService.getInitialNotification();
    if (fcmNotification) {
      return fcmNotification;
    }

    // Fallback to legacy approach
    if (Platform.OS === 'android' && NativeModules.StoreNotification?.getInitialNotification) {
      return NativeModules.StoreNotification.getInitialNotification();
    }

    return null;
  } catch (error) {
    console.error('Get initial notification error:', error);
    return null;
  }
};

/**
 * Get notification history
 */
export const getNotificationHistory = async () => {
  return FCMService.getNotificationHistory();
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  return FCMService.markAsRead(notificationId);
};

/**
 * Clear all notifications
 */
export const clearNotificationHistory = async () => {
  return FCMService.clearHistory();
};

/**
 * Get FCM token (for sending notifications via backend)
 */
export const getFCMToken = async () => {
  return FCMService.getFCMToken();
};

/**
 * Initialize notification service
 * Call once during app startup
 */
export const initializeNotificationService = async (onMessageCallback, onNotificationTappedCallback) => {
  return FCMService.initialize(onMessageCallback, onNotificationTappedCallback);
};

