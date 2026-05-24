import React, { useState } from 'react'
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import CustomButton from '../../components/CustomButton'
import CustomInput from '../../components/CustomInput'
import { useAppStore } from '../../context/AppContext'
import { authApi } from '../../services/api'
import colors from '../../theme/colors'
import spacing from '../../theme/spacing'

const Login = ({ navigation }) => {
  const { pushActivity } = useAppStore()
  const [mail, setMail] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!mail.trim() || !pass.trim()) {
      Alert.alert('Missing details', 'Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      const response = await authApi.login({
        email: mail.trim(),
        password: pass,
      })

      pushActivity('Signed in successfully')
      navigation.navigate('OTP', {
        email: response.data?.data?.email || mail.trim(),
        source: 'login',
      })
    } catch (error) {
      Alert.alert(
        'Login failed',
        error?.response?.data?.message || 'Unable to sign in right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
           <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
            <View style={styles.heroCopy}>
           <Text style={styles.heroEyebrow}>Fashion Store</Text>
              <Text style={styles.heroTitle}>Welcome back to your personal boutique</Text>
            <Text style={styles.heroText}>
              Sign in and pick up where u left off with orders, cart and saved stuff.
            </Text>
          </View>

               <Image
            source={{
              uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
            }}
            style={styles.heroImage}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>use ur account details here</Text>

               <CustomInput
              label="Email"
            placeholder="example@mail.com"
            value={mail}
            onChangeText={setMail}
          />

                  <CustomInput
                  label="Password"
                  placeholder="Enter password"
                  secureTextEntry
                  value={pass}
                  onChangeText={setPass}
                />

                    {/* add forgot pass later */}
          <TouchableOpacity
            style={styles.inlineAction}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.inlineText}>Forgot password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Create Account</Text>
                  </TouchableOpacity>
        </View>
      </ScrollView>
  </SafeAreaView>
  )
}

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
    borderRadius: 34,
    backgroundColor: colors.primary,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  heroEyebrow: {
    color: '#DCC6B2',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  heroText: {
    marginTop: spacing.sm,
    color: '#F0E1D5',
    lineHeight: 22,
  },
  heroImage: {
    width: 108,
    height: 152,
    borderRadius: 28,
  },
  card: {
    marginTop: -26,
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    color: colors.textMuted,
  },
  inlineAction: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  inlineText: {
    color: colors.primarySoft,
    fontWeight: '700',
  },
  button: {
    marginBottom: spacing.md,
  },
  link: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
  },
})

export default Login
