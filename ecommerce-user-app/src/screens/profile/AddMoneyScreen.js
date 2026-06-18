import React, { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const quickAmounts = ['$100', '$200', '$500', '$1000', '$2000', '$3000', '$4000', '$5000'];

const AddMoneyScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [amount, setAmount] = useState('');
  const { walletBalance, addWalletMoney } = useAppStore();

  const handleSelectAmount = value => {
    setAmount(value.replace('$', ''));
  };

  const handleAddMoney = () => {
    if (!amount.trim()) {
      Alert.alert('Enter amount', 'Please choose or enter an amount to add.');
      return;
    }

    addWalletMoney(amount.trim());
    Alert.alert('Money added', `$${amount} has been added to your wallet.`);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScreenHeader title="Add Money" onBack={() => navigation.goBack()} />

        <View style={styles.card}>
          <View style={styles.balanceTopRow}>
            <View>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceValue}>$ {walletBalance.toFixed(2)}</Text>
            </View>
            <View style={styles.balanceIconWrap}>
              <Text style={styles.balanceIcon}>o</Text>
            </View>
          </View>

          <View style={styles.amountGrid}>
            {quickAmounts.map(item => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.amountChip,
                  amount === item.replace('$', '') && styles.amountChipActive,
                ]}
                onPress={() => handleSelectAmount(item)}
              >
                <Text
                  style={[
                    styles.amountChipText,
                    amount === item.replace('$', '') && styles.amountChipTextActive,
                  ]}
                >
                  + {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.currencyText}>$</Text>
            <TextInput
              value={amount}
              onChangeText={value => setAmount(value.replace(/[^\d]/g, ''))}
              placeholder="Enter Amount"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              style={styles.input}
            />
          </View>

          <CustomButton title="Add Money" onPress={handleAddMoney} style={styles.submitButton} />
        </View>
      </View>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  card: {
    marginTop: spacing.xl,
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
    fontSize: 28,
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
  balanceIcon: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  amountGrid: {
    marginTop: spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  amountChip: {
    width: '23%',
    minHeight: 38,
    marginBottom: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  amountChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  amountChipTextActive: {
    color: colors.surface,
  },
  inputRow: {
    marginTop: spacing.sm,
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  currencyText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  submitButton: {
    marginTop: spacing.md,
  },
});

export default AddMoneyScreen;
