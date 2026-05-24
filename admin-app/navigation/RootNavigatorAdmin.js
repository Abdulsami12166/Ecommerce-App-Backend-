import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminLoginScreen from '../../src/screens/admin/AdminLoginScreen';
import AdminDashboardScreen from '../../src/screens/admin/AdminDashboardScreen';

const Stack = createNativeStackNavigator();

const RootNavigatorAdmin = () => {
  return (
    <Stack.Navigator
      initialRouteName="AdminLogin"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="AdminLogin" component={AdminLoginScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigatorAdmin;

