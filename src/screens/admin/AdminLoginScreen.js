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
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const AdminLoginScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { adminSignIn, isAdminAuthenticated } = useAppStore();
  const [email, setEmail] = useState('admin@fashionstore.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Enter the admin email and password.');
      return;
    }

    try {
      setLoading(true);
      await adminSignIn({ email, password });
      navigation.replace('AdminDashboard');
    } catch (error) {
      Alert.alert('Admin login failed', error.message || 'Unable to open admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Live Ops Console</Text>
          <Text style={styles.title}>Admin login for realtime purchase tracking</Text>
          <Text style={styles.subtitle}>
            Watch new purchases, order flow, and delivery movement update immediately after login.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Admin Access</Text>
          <Text style={styles.helperText}>
            Demo credentials are prefilled so you can open the dashboard quickly.
          </Text>

          <CustomInput
            label="Admin Email"
            placeholder="admin@fashionstore.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <CustomInput
            label="Password"
            placeholder="Enter admin password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <View style={styles.credentialBox}>
            <Text style={styles.credentialLabel}>Demo Email</Text>
            <Text style={styles.credentialValue}>admin@fashionstore.com</Text>
            <Text style={styles.credentialLabel}>Demo Password</Text>
            <Text style={styles.credentialValue}>admin123</Text>
          </View>

          <CustomButton
            title={loading ? 'Opening Dashboard...' : 'Open Admin Dashboard'}
            onPress={handleLogin}
            loading={loading}
            style={styles.primaryButton}
          />

          {isAdminAuthenticated ? (
            <CustomButton
              title="Go To Live Dashboard"
              variant="secondary"
              onPress={() => navigation.replace('AdminDashboard')}
            />
          ) : null}

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
            <Text style={styles.backText}>Back to app</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    hero: {
      borderRadius: radius.lg,
      padding: spacing.xl,
      backgroundColor: colors.primary,
    },
    eyebrow: {
      color: '#EAD7C6',
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontSize: 12,
    },
    title: {
      marginTop: spacing.sm,
      color: colors.surface,
      fontSize: 28,
      lineHeight: 35,
      fontWeight: '800',
    },
    subtitle: {
      marginTop: spacing.md,
      color: '#F4E7DB',
      lineHeight: 22,
    },
    card: {
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '800',
    },
    helperText: {
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      color: colors.textMuted,
      lineHeight: 20,
    },
    credentialBox: {
      marginBottom: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      padding: spacing.md,
    },
    credentialLabel: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginTop: spacing.xs,
    },
    credentialValue: {
      marginTop: 2,
      color: colors.primary,
      fontWeight: '800',
    },
    primaryButton: {
      marginBottom: spacing.md,
    },
    backLink: {
      marginTop: spacing.md,
      alignSelf: 'center',
    },
    backText: {
      color: colors.primary,
      fontWeight: '800',
    },
  });

export default AdminLoginScreen;
