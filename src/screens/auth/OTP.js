import React from 'react'
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

import CustomButton from '../../components/CustomButton'
import { useAppStore } from '../../context/AppContext'
import { authApi } from '../../services/api'
import colors from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const OTP = ({ navigation, route }) => {
  const { pushActivity, setAuthSession } = useAppStore()
  const [otp, setOtp] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [resending, setResending] = React.useState(false)
  const routeEmail = route.params?.email || ''
  const source = route.params?.source || 'auth'

  const handleVerifyOtp = async () => {
    if (!routeEmail) {
      Alert.alert('Missing email', 'Please go back and sign in again.')
      return
    }

    if (!otp.trim()) {
      Alert.alert('Enter OTP', 'Please enter the OTP sent for verification.')
      return
    }

    try {
      setLoading(true)
      const response = await authApi.verifyOtp({
        email: routeEmail,
        otpCode: otp.trim(),
      });

      setAuthSession({
        token: response.data?.data?.token || '',
        user: response.data?.data?.user || null,
        source,
      })

      pushActivity(source === 'login' ? 'Login verified successfully' : 'Account setup completed')
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      })
    } catch (error) {
      Alert.alert(
        'Verification failed',
        error?.response?.data?.message || 'Unable to verify OTP right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    if (!routeEmail) {
      Alert.alert('Missing email', 'Please go back and sign in again.')
      return
    }

    try {
      setResending(true)
      const response = await authApi.resendOtp({ email: routeEmail })

      Alert.alert(
        'OTP sent',
        response.data?.data?.emailDelivered
          ? `A new OTP was sent to ${routeEmail}.`
          : 'OTP could not be delivered by email. Please check the backend Gmail configuration.',
      )
    } catch (error) {
      Alert.alert(
        'Resend failed',
        error?.response?.data?.message || 'Unable to resend OTP right now.',
      )
    } finally {
      setResending(false)
    }
  }

  return (
   <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>S</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>Security Verification</Text>
        <Text style={styles.subtitle}>
          Enter the OTP sent to your account to continue securely.
        </Text>

        <TextInput
          placeholder="Enter OTP"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
          style={styles.input}
        />

        <Text style={styles.helperText}>Verification email: {routeEmail || 'Not available'}</Text>

        <CustomButton
          title="Verify OTP"
          onPress={handleVerifyOtp}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
            <Text style={styles.link}>{resending ? 'sending...' : 'resend code'}</Text>
        </TouchableOpacity>
      </View>
   </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  hero: {
    alignSelf: 'center',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  heroIcon: {
    color: colors.surface,
    fontSize: 34,
    fontWeight: '800',
  },
  card: {
    padding: spacing.xl,
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.sm,
      textAlign: 'center',
      color: colors.textMuted,
          lineHeight: 22,
  },
  input: {
    marginTop: spacing.xl,
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#F7F0E8',
    paddingHorizontal: spacing.md,
    color: colors.text,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
  },
  helperText: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.textMuted,
  },
  button: {
    marginTop: spacing.xl,
  },
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primarySoft,
    fontWeight: '700',
  },
})

export default OTP
