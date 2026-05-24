import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OperationBanner from '../src/components/OperationBanner';
import { AppProvider, useAppStore } from '../src/context/AppContext';
import RootNavigatorAdmin from './navigation/RootNavigatorAdmin';

import { useThemeColors } from '../src/theme/colors';

// AppAdmin uses the same theme/colors + AppContext already used by the ecommerce app.


const AppShellAdmin = () => {
  const colors: any = useThemeColors();
  const store: any = useAppStore();
  const themeMode = store?.themeMode;

  const navigationTheme = React.useMemo(
    () => ({
      ...DefaultTheme,
      dark: themeMode === 'dark',
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
    [colors, themeMode],
  );

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.statusBar} />
      <NavigationContainer theme={navigationTheme}>
        <RootNavigatorAdmin />
        <OperationBanner />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const AppAdmin = () => {
  return (
    <AppProvider>
      <AppShellAdmin />
    </AppProvider>
  );
};

export default AppAdmin;

