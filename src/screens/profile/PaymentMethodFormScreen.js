import React, { useMemo, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppIcon from '../../components/AppIcon';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const PaymentMethodFormScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { paymentMethods, savePaymentMethod } = useAppStore();
  const editingMethod = useMemo(
    () =>
      paymentMethods.find(
        item => item.id === route.params?.methodId && (item.type || 'card') === 'card',
      ) || null,
    [paymentMethods, route.params?.methodId],
  );
  const [holder, setHolder] = useState(editingMethod?.holder || 'Jennifer Aaker');
  const [number, setNumber] = useState(editingMethod?.number || '4716962716358047');
  const [expiry, setExpiry] = useState(editingMethod?.expiry || '02/30');
  const [cvv, setCvv] = useState(editingMethod?.cvv || '');
  const [saveCard, setSaveCard] = useState(editingMethod?.selected ?? true);

  const detectBrand = value => {
    if (value.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(value)) return 'mastercard';
    if (/^3[47]/.test(value)) return 'amex';
    return 'card';
  };

  const detectTitle = brand => {
    if (brand === 'visa') return 'VISA';
    if (brand === 'mastercard') return 'MASTERCARD';
    if (brand === 'amex') return 'AMEX';
    return 'CARD';
  };

  const formatCard = value =>
    value
      .replace(/\D/g, '')
      .slice(0, 16)
      .replace(/(\d{4})(?=\d)/g, '$1 ')
      .trim();

  const formatExpiry = value => {
    const cleanValue = value.replace(/\D/g, '').slice(0, 4);

    if (cleanValue.length <= 2) {
      return cleanValue;
    }

    return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2)}`;
  };

  const cleanNumber = number.replace(/\D/g, '');
  const brand = detectBrand(cleanNumber);
  const cardTitle = detectTitle(brand);
  const previewNumber = formatCard(number) || '4716 9627 1635 8047';

  const handleCardNumberChange = value => {
    setNumber(value.replace(/\D/g, '').slice(0, 16));
  };

  const handleExpiryChange = value => {
    setExpiry(formatExpiry(value));
  };

  const handleCvvChange = value => {
    setCvv(value.replace(/\D/g, '').slice(0, 4));
  };

  const handleSave = () => {
    if (!holder.trim() || cleanNumber.length < 12 || expiry.length !== 5 || cvv.length < 3) {
      Alert.alert('Complete card', 'Please enter card holder, card number, expiry, and CVV.');
      return;
    }

    savePaymentMethod({
      id: editingMethod?.id,
      type: 'card',
      brand,
      title: cardTitle,
      holder: holder.trim(),
      number: cleanNumber,
      expiry,
      cvv,
      value: `**** ${cleanNumber.slice(-4)}`,
      icon: 'card',
      selected: saveCard,
    });

    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={editingMethod ? 'Update Card' : 'Add Card'}
          onBack={() => navigation.goBack()}
        />

        <View style={styles.previewCard}>
          <View style={styles.previewGlowLeft} />
          <View style={styles.previewGlowRight} />
          <Text style={styles.previewBrand}>{cardTitle}</Text>
          <Text style={styles.previewNo}>{previewNumber}</Text>

          <View style={styles.previewMetaRow}>
            <View style={styles.previewMetaCol}>
              <Text style={styles.previewLabel}>Card holder name</Text>
              <Text style={styles.previewValue}>{holder || 'Jennifer Aaker'}</Text>
            </View>

            <View style={styles.previewMetaCol}>
              <Text style={styles.previewLabel}>Expiry date</Text>
              <Text style={styles.previewValue}>{expiry || '02/30'}</Text>
            </View>

            <View style={styles.chipBox}>
              <AppIcon icon="chip" size={24} color="rgba(255,255,255,0.85)" />
            </View>
          </View>
        </View>

        <View style={styles.formCard}>
          <CustomInput
            label="Card Holder Name"
            placeholder="Jennifer Aaker"
            value={holder}
            onChangeText={setHolder}
            autoCapitalize="words"
          />

          <CustomInput
            label="Card Number"
            placeholder="4716 9627 1635 8047"
            value={formatCard(number)}
            onChangeText={handleCardNumberChange}
            keyboardType="number-pad"
            maxLength={19}
          />

          <View style={styles.inlineRow}>
            <View style={styles.inlineCol}>
              <CustomInput
                label="Expiry Date"
                placeholder="02/30"
                value={expiry}
                onChangeText={handleExpiryChange}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={styles.inlineCol}>
              <CustomInput
                label="CVV"
                placeholder="000"
                value={cvv}
                onChangeText={handleCvvChange}
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.saveCardRow}
            onPress={() => setSaveCard(current => !current)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, saveCard && styles.checkboxActive]}>
              {saveCard ? <AppIcon icon="check" size={14} color={colors.surface} /> : null}
            </View>
            <Text style={styles.saveCardLabel}>Save Card</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomDock}>
        <CustomButton title={editingMethod ? 'Update Card' : 'Add Card'} onPress={handleSave} />
      </View>
    </SafeAreaView>
  );
};

const createStyles = colors =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: 120 },
    previewCard: {
      minHeight: 224,
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderRadius: 28,
      backgroundColor: colors.primary,
      overflow: 'hidden',
    },
    previewGlowLeft: {
      position: 'absolute',
      left: -22,
      bottom: -30,
      width: 118,
      height: 118,
      borderRadius: 59,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    previewGlowRight: {
      position: 'absolute',
      right: -12,
      top: -12,
      width: 82,
      height: 82,
      borderRadius: 41,
      backgroundColor: 'rgba(255,255,255,0.12)',
    },
    previewBrand: {
      alignSelf: 'flex-end',
      color: colors.surface,
      fontSize: 24,
      fontWeight: '900',
    },
    previewNo: {
      marginTop: 76,
      color: colors.surface,
      fontSize: 30,
      fontWeight: '800',
      letterSpacing: 1.2,
    },
    previewMetaRow: {
      marginTop: spacing.lg,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    previewMetaCol: {
      flex: 1,
    },
    previewLabel: {
      color: 'rgba(255,255,255,0.74)',
      fontSize: 12,
    },
    previewValue: {
      marginTop: 2,
      color: colors.surface,
      fontWeight: '700',
    },
    chipBox: {
      width: 44,
      height: 36,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.sm,
    },
    formCard: {
      marginTop: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inlineRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    inlineCol: {
      width: '47%',
    },
    saveCardRow: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    checkboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    saveCardLabel: {
      marginLeft: spacing.sm,
      color: colors.text,
      fontWeight: '600',
    },
    bottomDock: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      borderTopWidth: 1,
      borderColor: colors.border,
    },
  });

export default PaymentMethodFormScreen;
