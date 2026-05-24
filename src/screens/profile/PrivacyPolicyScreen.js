import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const sections = [
  {
    title: 'Information We Use',
    body:
      'We use profile details, delivery addresses, saved payment labels, wishlist items, and order activity to help you shop, track deliveries, and contact support faster.',
  },
  {
    title: 'Why We Use It',
    body:
      'Your details are used to complete purchases, improve support conversations, send order updates, and personalize the shopping experience inside the app.',
  },
  {
    title: 'Privacy Choices',
    body:
      'You can update profile information, manage notification access, and control location permission from your device settings at any time.',
  },
  {
    title: 'Regulation Notes',
    body:
      'This app experience is designed around common privacy expectations such as consent for permissions, limited use of personal data, and the ability to review or update account details.',
  },
  {
    title: 'Support And Escalation',
    body:
      'If you have privacy questions, data concerns, or account-related complaints, use Customer Care from the Profile page so our team can help you quickly.',
  },
];

const PrivacyPolicyScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Privacy Policy" onBack={() => navigation.goBack()} />

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Policy Overview</Text>
          <Text style={styles.heroTitle}>Your data, permissions, and regulation notes in one place</Text>
          <Text style={styles.heroText}>
            This screen gives a simple summary of how profile, order, and support information is handled in the app.
          </Text>
        </View>

        {sections.map(section => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: 28,
    backgroundColor: colors.primary,
  },
  heroLabel: {
    color: '#E4CDB9',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    marginTop: spacing.sm,
    color: colors.surface,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
  },
  heroText: {
    marginTop: spacing.sm,
    color: '#F2E4D8',
    lineHeight: 22,
  },
  sectionCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionBody: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    lineHeight: 22,
  },
});

export default PrivacyPolicyScreen;
