import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const Placeholder = ({ title }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{title}</Text>
  </View>
);

const TabNavigator = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home">{() => <Placeholder title="Home Screen" />}</Tab.Screen>
      <Tab.Screen name="Cart">{() => <Placeholder title="Cart Screen" />}</Tab.Screen>
      <Tab.Screen name="Wishlist">{() => <Placeholder title="Wishlist Screen" />}</Tab.Screen>
      <Tab.Screen name="Orders">{() => <Placeholder title="Orders Screen" />}</Tab.Screen>
      <Tab.Screen name="Profile">{() => <Placeholder title="Profile Screen" />}</Tab.Screen>
    </Tab.Navigator>
  );
};

export default TabNavigator;
