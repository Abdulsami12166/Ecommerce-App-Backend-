import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import AppIcon from '../../components/AppIcon';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const walletGroups = [
  {
    id: 'wallet-group-1',
    label: 'Today',
    items: [
      {
        id: 'wallet-1',
        title: 'Money Added to Wallet',
        meta: '11 March | 11:30 AM',
        amount: '+ $250.00',
        balance: 'Balance $2400.00',
        positive: true,
      },
    ],
  },
  {
    id: 'wallet-group-2',
    label: 'Yesterday',
    items: [
      {
        id: 'wallet-2',
        title: 'Order ID #FN845661',
        meta: '10 March | 10:30 AM',
        amount: '- $50.00',
        balance: 'Balance $2100.00',
        positive: false,
      },
    ],
  },
  {
    id: 'wallet-group-3',
    label: '09 March 2026',
    items: [
      {
        id: 'wallet-3',
        title: 'Money Added to Wallet',
        meta: '09 March | 8:30 AM',
        amount: '+ $500.00',
        balance: 'Balance $2150.00',
        positive: true,
      },
      {
        id: 'wallet-4',
        title: 'Order ID #FN854539',
        meta: '09 March | 7:48 AM',
        amount: '- $50.00',
        balance: 'Balance $1,650.00',
        positive: false,
      },
      {
        id: 'wallet-5',
        title: 'Order ID #FN854538',
        meta: '09 March | 7:36 AM',
        amount: '- $50.00',
        balance: 'Balance $1700.00',
        positive: false,
      },
    ],
  },
];

const WalletScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="My Wallet" onBack={() => navigation.goBack()} />

        <View style={styles.balanceCard}>
          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceValue}>$2400.00</Text>
            </View>
            <View style={styles.balanceIconWrap}>
              <AppIcon icon="wallet" size={22} color={colors.primary} />
            </View>
          </View>

          <CustomButton
            title="Add Money"
            onPress={() => navigation.navigate('AddMoney')}
            style={styles.addMoneyButton}
          />
        </View>

        {walletGroups.map(group => (
          <View key={group.id} style={styles.groupWrap}>
            <Text style={styles.groupTitle}>{group.label}</Text>

            {group.items.map(item => (
              <View key={item.id} style={styles.transactionCard}>
                <View style={styles.transactionTopRow}>
                  <Text style={styles.transactionTitle}>{item.title}</Text>
                  <Text
                    style={[
                      styles.transactionAmount,
                      item.positive ? styles.amountPositive : styles.amountNegative,
                    ]}
                  >
                    {item.amount}
                  </Text>
                </View>

                <View style={styles.transactionBottomRow}>
                  <Text style={styles.transactionMeta}>{item.meta}</Text>
                  <Text style={styles.transactionBalance}>{item.balance}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  balanceCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balanceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  balanceLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  balanceValue: {
    marginTop: 4,
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
  },
  balanceIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMoneyButton: {
    marginTop: spacing.md,
  },
  groupWrap: {
    marginTop: spacing.xl,
  },
  groupTitle: {
    marginBottom: spacing.sm,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  transactionCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  transactionAmount: {
    fontWeight: '800',
  },
  amountPositive: {
    color: '#27AE60',
  },
  amountNegative: {
    color: '#FF4D4F',
  },
  transactionBottomRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionMeta: {
    color: colors.textMuted,
    fontSize: 12,
  },
  transactionBalance: {
    color: colors.textMuted,
    fontSize: 12,
  },
});

export default WalletScreen;
