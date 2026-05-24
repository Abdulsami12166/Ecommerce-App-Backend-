import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import { authApi } from '../../services/api';
import colors from '../../theme/colors';
import spacing from '../../theme/spacing';

const ForgotPassword = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [resetting, setResetting] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter your account email to receive a reset code.');
      return;
    }

    try {
      setRequesting(true);
      await authApi.forgotPassword({ email: email.trim() });
      Alert.alert('Reset code sent', `Check ${email.trim()} for your password reset code.`);
    } catch (error) {
      Alert.alert(
        'Request failed',
        error?.response?.data?.message || 'Unable to send a reset code right now.',
      );
    } finally {
      setRequesting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim() || !resetCode.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Missing details', 'Fill in every field before resetting your password.');
      return;
    }

    try {
      setResetting(true);
      await authApi.resetPassword({
        email: email.trim(),
        resetCode: resetCode.trim(),
        newPassword,
        confirmPassword,
      });
      Alert.alert('Password reset', 'Your app password has been updated. Please sign in again.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (error) {
      Alert.alert(
        'Reset failed',
        error?.response?.data?.message || 'Unable to reset your password right now.',
      );
    } finally {
      setResetting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Recover account</Text>
          <Text style={styles.title}>Reset your app password with an email code</Text>
          <Text style={styles.subtitle}>
            We will email a short reset code to your account, then you can set a fresh app password.
          </Text>
        </View>

        <View style={styles.card}>
          <CustomInput
            label="Account Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
          />
          <CustomButton
            title={requesting ? 'Sending Code...' : 'Send Reset Code'}
            onPress={handleRequestCode}
            loading={requesting}
            style={styles.button}
          />

          <CustomInput
            label="Reset Code"
            placeholder="Enter the code from your email"
            value={resetCode}
            onChangeText={setResetCode}
          />
          <CustomInput
            label="New Password"
            placeholder="Create a new app password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <CustomInput
            label="Confirm Password"
            placeholder="Re-enter your new app password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <CustomButton
            title={resetting ? 'Resetting...' : 'Reset Password'}
            onPress={handleResetPassword}
            loading={resetting}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  hero: {
    marginTop: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    lineHeight: 22,
  },
  card: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    marginBottom: spacing.md,
  },
  link: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
  },
});

export default ForgotPassword;
