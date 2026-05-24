import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OperationBanner from './src/components/OperationBanner';
import { AppProvider, useAppStore } from './src/context/AppContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useThemeColors } from './src/theme/colors';

const AppShell = () => {
  const colors = useThemeColors();
  const { themeMode } = useAppStore();

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
