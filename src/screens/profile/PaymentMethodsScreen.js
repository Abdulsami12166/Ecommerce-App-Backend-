import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../components/AppIcon';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const getMethodTint = type => {
  if (type === 'wallet') {
    return '#8A5A3B';
  }

  if (type === 'digital') {
    return '#C89A67';
  }

  return '#5A2B12';
};

const renderSectionBody = (items, renderOptionRow, styles, label) => {
  if (items.length) {
    return <View style={styles.sectionCard}>{items.map(method => renderOptionRow(method))}</View>;
  }

  return (
    <View style={styles.emptyStateCard}>
      <Text style={styles.emptyStateTitle}>No {label.toLowerCase()} available</Text>
      <Text style={styles.emptyStateText}>Add one from this screen to keep checkout clean.</Text>
    </View>
  );
};

const PaymentMethodsScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { paymentMethods, selectPaymentMethod } = useAppStore();

  const cashMethods = paymentMethods.filter(method => (method.type || 'card') === 'cash');
  const walletMethods = paymentMethods.filter(method => method.type === 'wallet');
  const cardMethods = paymentMethods.filter(method => (method.type || 'card') === 'card');
  const digitalMethods = paymentMethods.filter(method => method.type === 'digital');

  const renderOptionRow = (method, { editable = false } = {}) => {
    const active = Boolean(method.selected);

    return (
      <TouchableOpacity
        key={method.id}
        style={[styles.optionRow, active && styles.optionRowActive]}
        activeOpacity={0.9}
        onPress={() => selectPaymentMethod(method.id)}
      >
        <View style={styles.optionMain}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: `${getMethodTint(method.type)}14` },
            ]}
          >
            <AppIcon icon={method.icon || 'card'} size={20} color={getMethodTint(method.type)} />
          </View>
          <View style={styles.optionCopy}>
            <Text style={styles.optionTitle}>{method.title}</Text>
            <Text style={styles.optionValue}>{method.value}</Text>
          </View>
        </View>

        <View style={styles.optionSide}>
          <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
            {active ? <View style={styles.radioInner} /> : null}
          </View>
          {editable ? (
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('PaymentMethodForm', { methodId: method.id })}
            >
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Payment Methods" onBack={() => navigation.goBack()} />

        <Text style={styles.sectionTitle}>Cash</Text>
        {renderSectionBody(cashMethods, renderOptionRow, styles, 'Cash methods')}

        <Text style={styles.sectionTitle}>Wallet</Text>
        {renderSectionBody(walletMethods, renderOptionRow, styles, 'Wallet methods')}

        <Text style={styles.sectionTitle}>Credit & Debit Card</Text>
        <TouchableOpacity
          style={styles.addCardRow}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('PaymentMethodForm')}
        >
          <View style={styles.iconWrap}>
            <AppIcon icon="card" size={20} color={colors.primary} />
          </View>
          <Text style={styles.addCardLabel}>Add Card</Text>
          <AppIcon icon="forward" size={22} color={colors.primary} />
        </TouchableOpacity>

        {cardMethods.length ? (
          <View style={[styles.sectionCard, styles.cardsList]}>
            {cardMethods.map(method => renderOptionRow(method, { editable: true }))}
          </View>
        ) : (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No cards added yet</Text>
            <Text style={styles.emptyStateText}>Add a card to keep payment options ready.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>More Payment Options</Text>
        {renderSectionBody(digitalMethods, renderOptionRow, styles, 'Digital payment options')}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    sectionTitle: {
      marginTop: spacing.xl,
      marginBottom: spacing.md,
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    sectionCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    cardsList: {
      marginTop: spacing.md,
    },
    addCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceMuted,
    },
    addCardLabel: {
      flex: 1,
      marginLeft: spacing.md,
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    optionRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionRowActive: {
      backgroundColor: colors.surfaceMuted,
    },
    optionMain: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: spacing.md,
    },
    optionCopy: {
      marginLeft: spacing.md,
      flex: 1,
    },
    optionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    optionValue: {
      marginTop: 4,
      color: colors.textMuted,
      fontSize: 13,
    },
    optionSide: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    radioOuterActive: {
      borderColor: colors.primary,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    editButton: {
      marginTop: spacing.sm,
    },
    editText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 12,
    },
    emptyStateCard: {
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.lg,
    },
    emptyStateTitle: {
      color: colors.text,
      fontWeight: '800',
    },
    emptyStateText: {
      marginTop: spacing.xs,
      color: colors.textMuted,
      lineHeight: 20,
    },
  });

export default PaymentMethodsScreen;
