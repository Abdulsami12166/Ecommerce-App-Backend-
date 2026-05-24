import React, { useState } from 'react'
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

import CustomButton from '../../components/CustomButton'
import CustomInput from '../../components/CustomInput'
import { authApi } from '../../services/api'
import colors from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const Register = ({ navigation }) => {
  const [nm, setNm] = useState('')
  const [mail, setMail] = useState('')
  const [phone, setPhone] = useState('')
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!nm.trim() || !mail.trim() || !pass.trim()) {
      Alert.alert('Missing details', 'Please enter name, email, and password.')
      return
    }

    try {
      setLoading(true)
      const response = await authApi.register({
        name: nm.trim(),
        email: mail.trim(),
        phone: phone.trim(),
        password: pass,
      })

      navigation.navigate('OTP', {
        email: response.data?.data?.user?.email || mail.trim(),
        source: 'register',
      })
    } catch (error) {
      Alert.alert(
        'Registration failed',
        error?.response?.data?.message || 'Unable to create account right now.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
   <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topCopy}>
          <Text style={styles.eyebrow}>Create profile</Text>
            <Text style={styles.title}>Set up ur account for smooth shopping journey</Text>
          <Text style={styles.subtitle}>
            Add basic details now so checkout n order tracking feel easy later.
          </Text>
        </View>

        <View style={styles.card}>
            {/* small steps just show signup side */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepLine, styles.stepLineActive]} />
            {/* <view>setInterval(() => {
              
            }, interval);</view> */}
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={styles.stepLine} />
            <View style={styles.stepDot} />
          </View>

          <CustomInput
            label="Full Name"
            placeholder="Olivia Carter"
            value={nm}
            onChangeText={setNm}
          />

          {/* navigation.replace('OTP') */}
          <CustomInput
            label="Email"
            placeholder="olivia@mail.com"
            value={mail}
            onChangeText={setMail}
          />

                    {/* navigation.replace('products) */}
                    <CustomInput
                    label="Phone"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChangeText={setPhone}
                  />

          <CustomInput
            label="Password"
            placeholder="Create password"
            secureTextEntry
            value={pass}
            onChangeText={setPass}
          />

         

          <CustomButton
            title="Continue"
            onPress={handleRegister}
            loading={loading}
            style={styles.button}
          />

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>already hv account? sign in</Text>
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
    // justifyContent: 'center',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  topCopy: {
    marginTop: spacing.md,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 30,
    // fontWeight: '800',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    fontWeight: '800',
    lineHeight: 36,
  },
  subtitle: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    // backgroundColor: 'red',
    // padding: spacing.sm,
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
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#D9CDBF',
  },
  stepDotActive: {
    backgroundColor: colors.primary,
  },
  stepLine: {
    width: 34,
    height: 3,
    marginHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: '#D9CDBF',
  },
  stepLineActive: {
    backgroundColor: colors.primary,
  },
  button: {
    marginTop: spacing.sm,
  },
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
  },
})

export default Register
