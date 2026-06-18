import React from 'react';
import { NavigationContainer, DefaultTheme, createNavigationContainerRef } from '@react-navigation/native';
import { AppState, StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OperationBanner from './src/components/OperationBanner';
import { AppProvider, useAppStore } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import FCMService from './src/services/fcmService';
import { useThemeColors } from './src/theme/colors';

type NotificationData = {
  type?: string;
  screen?: string;
  orderId?: string;
  chatId?: string;
  productId?: string;
};

const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

const routeFromNotification = (data?: NotificationData | null) => {
  if (!data) {
    return null;
  }

  // Handle chat message notification - open specific product chat
  if (data.type === 'chat_message' && data.chatId) {
    return { name: 'SupportChat', params: { chatId: data.chatId, productId: data.productId } };
  }

  if (data.screen === 'SupportChat' && data.chatId) {
    return { name: 'SupportChat', params: { chatId: data.chatId, productId: data.productId } };
  }

  // Handle order tracking
  if (data.type?.includes('order') && data.orderId) {
    return { name: 'TrackOrder', params: { orderId: data.orderId } };
  }

  if (data.screen === 'TrackOrder' && data.orderId) {
    return { name: 'TrackOrder', params: { orderId: data.orderId } };
  }

  // Handle product details
  if (data.type === 'product_message' && data.productId) {
    return { name: 'ProductDetails', params: { productId: data.productId } };
  }

  if (data.screen === 'ProductDetails' && data.productId) {
    return { name: 'ProductDetails', params: { productId: data.productId } };
  }

  // Handle generic screen navigation
  if (data.screen) {
    return { name: data.screen, params: data };
  }

  return { name: 'Notifications', params: data };
};

const AppShell = () => {
  const colors = useThemeColors() as any;
  const { authRestoring } = useAppStore();

  const navigationTheme = React.useMemo(
    () => ({
      ...DefaultTheme,
      dark: false,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
        notification: colors.accent,
      },
    }),
    [colors],
  );

  // Initialize FCM on app start and handle notifications
  React.useEffect(() => {
    const initializeFCM = async () => {
      FCMService.initialize(
        // Handle foreground notification (app is running)
        (notification) => {
          console.log('Foreground notification:', notification);
          // Can show a banner or in-app popup here
        },
        // Handle notification tap (from status bar or notification shade)
        async (notification) => {
          console.log('Notification tapped:', notification);
          const data = notification.data || notification.notification || {};
          const route = routeFromNotification(data);

          if (route && navigationRef.isReady()) {
            navigationRef.navigate(route.name, route.params);
          }
        }
      );
    };

    initializeFCM().catch(console.error);
  }, []);

  // Handle notification when app comes to foreground
  const handleAppStateChange = React.useCallback(async (state) => {
    if (state === 'active') {
      // Check if there's a pending notification (when app launched from terminated state)
      const initialNotification = await FCMService.getInitialNotification();
      if (initialNotification && navigationRef.isReady()) {
        const data = initialNotification.data || initialNotification.notification || {};
        const route = routeFromNotification(data);
        if (route) {
          navigationRef.navigate(route.name, route.params);
        }
      }
    }
  }, []);

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [handleAppStateChange]);

  // Handle initial notification on mount (app launched from notification tap)
  React.useEffect(() => {
    if (authRestoring || !navigationRef.isReady()) {
      return;
    }

    const handleInitialNotification = async () => {
      try {
        const initialNotification = await FCMService.getInitialNotification();
        if (initialNotification) {
          const data = initialNotification.data || initialNotification.notification || {};
          const route = routeFromNotification(data);

          if (route) {
            navigationRef.navigate(route.name, route.params);
          }
        }
      } catch (error) {
        console.error('Handle initial notification error:', error);
      }
    };

    handleInitialNotification();
  }, [authRestoring]);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.statusBar} />
      <NavigationContainer ref={navigationRef} theme={navigationTheme}>
        <RootNavigator />
        <OperationBanner />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const App = () => {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
};

export default App;










