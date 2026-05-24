import React from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const contactCards = [
  {
    id: 'care-call',
    title: 'Call Support',
    value: '+91 1800 210 9988',
    note: 'Daily, 8:00 AM to 10:00 PM',
    onPress: () => Linking.openURL('tel:+9118002109988'),
  },
  {
    id: 'care-email',
    title: 'Email Care Team',
    value: 'care@fashionstore.app',
    note: 'Replies usually within 24 hours',
    onPress: () => Linking.openURL('mailto:care@fashionstore.app'),
  },
];

const CustomerCareScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Customer Care" onBack={() => navigation.goBack()} />

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Need Help</Text>
          <Text style={styles.heroTitle}>Talk to customer care for orders, refunds, delivery, and account support</Text>
          <Text style={styles.heroText}>
            Choose a quick contact option below or open support chat for product-owner help.
          </Text>
        </View>

        {contactCards.map(card => (
          <TouchableOpacity key={card.id} style={styles.contactCard} onPress={card.onPress} activeOpacity={0.9}>
            <Text style={styles.contactTitle}>{card.title}</Text>
            <Text style={styles.contactValue}>{card.value}</Text>
            <Text style={styles.contactNote}>{card.note}</Text>
          </TouchableOpacity>
        ))}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>What We Can Help With</Text>
          <Text style={styles.sectionBody}>Order tracking updates, delayed deliveries, refund follow-up, payment trouble, account help, and privacy-related questions.</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Fastest Route</Text>
          <Text style={styles.sectionBody}>For item-specific help, open Support to message the product owner directly. For account-wide issues, use call or email from this page.</Text>
        </View>

        <CustomButton
          title="Open Support Chat"
          onPress={() => navigation.navigate('Support')}
          style={styles.primaryButton}
        />
        <CustomButton
          title="View Privacy Policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
          variant="secondary"
        />
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
  contactCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contactTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  contactValue: {
    marginTop: spacing.sm,
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  contactNote: {
    marginTop: 6,
    color: colors.textMuted,
    lineHeight: 20,
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
    fontWeight: '800',
    fontSize: 18,
  },
  sectionBody: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    lineHeight: 22,
  },
  primaryButton: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
});

export default CustomerCareScreen;
