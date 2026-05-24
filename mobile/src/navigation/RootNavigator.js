import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

const PlaceholderScreen = ({ title }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
    <Text>{title}</Text>
  </View>
);

const RootNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Login">
        {() => <PlaceholderScreen title="Login Screen" />}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {() => <PlaceholderScreen title="Register Screen" />}
      </Stack.Screen>
      <Stack.Screen name="OTP">
        {() => <PlaceholderScreen title="OTP Screen" />}
      </Stack.Screen>
      <Stack.Screen name="ProductDetails">
        {() => <PlaceholderScreen title="Product Details Screen" />}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RootNavigator;
