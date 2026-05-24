import React, { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiBaseUrl } from '../../config/apiConfig';

const ADMIN_JWT_KEY = 'admin_jwt';

type LoginResponse = {
  success?: boolean;
  token?: string;
  message?: string;
};

const AdminLoginScreen = ({ navigation }: any) => {
  const baseUrl = getApiBaseUrl();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const [errorText, setErrorText] = useState('');

  const handleLogin = async () => {
    try {
      setLoading(true);

      setErrorText('');

      await AsyncStorage.clear();

      const response = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      if (!data?.token) {
        throw new Error('JWT token missing from backend');
      }

      await AsyncStorage.setItem(ADMIN_JWT_KEY, data.token);

      Alert.alert('Success', 'Admin login successful');

      navigation.replace('AdminDashboard');
    } catch (error: any) {
      console.log('ADMIN LOGIN ERROR', error);

      setErrorText(error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>

      <TextInput
        style={styles.input}
        placeholder="Admin Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {!!errorText && (
        <Text style={styles.errorText}>
          {errorText}
        </Text>
      )}

      <TouchableOpacity
        style={styles.button}
        disabled={loading}
        onPress={handleLogin}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            Login
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 30,
    textAlign: 'center',
  },

  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },

  button: {
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 14,
  },
});

export default AdminLoginScreen;