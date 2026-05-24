import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppIcon from '../../components/AppIcon';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';

const walletOptions = [
  {
    id: 'wallet-google-play',
    label: 'Google Play',
    image: require('../../assets/payment/google-play.webp'),
  },
  {
    id: 'wallet-google-pay',
    label: 'Google Pay',
    image: require('../../assets/payment/google-pay.png'),
  },
  {
    id: 'wallet-paytm',
    label: 'Paytm',
    image: require('../../assets/payment/paytm.png'),
  },
];

const sampleCoupons = [
  {
    id: 'coupon-50',
    code: 'SAVE50',
    title: '50% OFF',
    description: 'Apply this sample coupon and get 50% off on subtotal.',
    discountPercent: 50,
  },
];

const getMethodTint = type => {
  if (type === 'wallet') {
    return '#8A5A3B';
  }

  if (type === 'digital') {
    return '#C89A67';
  }

  return '#5A2B12';
};

const getWalletFallbackIcon = walletId => {
  if (walletId.includes('google')) {
    return 'google';
  }

  if (walletId.includes('paytm')) {
    return 'wallet';
  }

  return 'card';
};

const PaymentScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const { cartItems, cartTotal, paymentMethods, selectPaymentMethod, placeOrder, savedAddresses, authToken } =
    useAppStore();
  const [selectedWallet, setSelectedWallet] = useState(walletOptions[0].id);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    paymentMethods.find(method => method.selected)?.id || paymentMethods[0]?.id,
  );
  const [availableCoupons, setAvailableCoupons] = useState(sampleCoupons);
  const [selectedCouponId, setSelectedCouponId] = useState(sampleCoupons[0]?.id || null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [walletImageErrors, setWalletImageErrors] = useState({});

  const shipping = 12;
  const cashMethods = paymentMethods.filter(method => (method.type || 'card') === 'cash');
  const walletMethods = paymentMethods.filter(method => method.type === 'wallet');
  const cardMethods = paymentMethods.filter(method => (method.type || 'card') === 'card');
  const digitalMethods = paymentMethods.filter(method => method.type === 'digital');

  const selectedCoupon = useMemo(
    () => availableCoupons.find(coupon => coupon.id === selectedCouponId) || null,
    [availableCoupons, selectedCouponId],
  );

  const discountAmount = selectedCoupon ? (cartTotal * selectedCoupon.discountPercent) / 100 : 0;
  const finalAmount = Math.max(cartTotal + shipping - discountAmount, 0);

  useEffect(() => {
    setSelectedPaymentMethod(
      paymentMethods.find(method => method.selected)?.id || paymentMethods[0]?.id,
    );
  }, [paymentMethods]);

  const handlePlaceOrder = async () => {
    if (!authToken) {
      Alert.alert('Sign in required', 'Please log in before placing an order.');
      navigation.navigate('Login');
      return;
    }

    if (!cartItems.length) {
      Alert.alert('Cart empty', 'Add at least one product before trying to pay.');
      navigation.navigate('Home');
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert('Select payment method', 'Choose one payment method to continue.');
      return;
    }

    const selectedAddress = savedAddresses.find(address => address.selected);
    if (!selectedAddress) {
      Alert.alert('Address required', 'Select a delivery address before placing the order.');
      navigation.navigate('Addresses');
      return;
    }

    try {
      setPlacingOrder(true);
      selectPaymentMethod(selectedPaymentMethod);
      const addressId =
        selectedAddress?.id && /^[a-f\d]{24}$/i.test(selectedAddress.id)
          ? selectedAddress.id
          : undefined;
      const nextOrder = await placeOrder({
        addressId,
        shippingFee: shipping,
        taxAmount: 0,
        paymentMethod:
          paymentMethods.find(method => method.id === selectedPaymentMethod)?.title || 'card',
        paymentStatus: 'paid',
        orderStatus: 'processing',
      });
      navigation.replace('OrderSuccess', { orderId: nextOrder.id });
    } catch (error) {
      Alert.alert(
        'Order failed',
        error?.response?.data?.message || error.message || 'Unable to place order right now.',
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleSmsSupport = () => {
    navigation.navigate('Support', { fromOrder: true });
  };

  const handleCouponPress = couponId => {
    setSelectedCouponId(current => (current === couponId ? null : couponId));
  };

  const handleShowEmptyCoupons = () => {
    setAvailableCoupons([]);
    setSelectedCouponId(null);
  };

  const renderEmptyMethods = label => (
    <View style={styles.emptyStateCard}>
      <Text style={styles.emptyStateTitle}>No {label.toLowerCase()} available</Text>
      <Text style={styles.emptyStateText}>Add or enable one so customers can continue smoothly.</Text>
    </View>
  );

  const renderMethodRow = method => {
    const active = method.id === selectedPaymentMethod;

    return (
      <TouchableOpacity
        key={method.id}
        activeOpacity={0.88}
        style={[styles.methodRow, active && styles.methodRowActive]}
        onPress={() => {
          setSelectedPaymentMethod(method.id);
          selectPaymentMethod(method.id);
        }}
      >
        <View style={styles.methodMain}>
          <View
            style={[
              styles.methodIconWrap,
              { backgroundColor: `${getMethodTint(method.type)}14` },
            ]}
          >
            <AppIcon icon={method.icon || 'card'} size={20} color={getMethodTint(method.type)} />
          </View>
          <View style={styles.methodCopy}>
            <Text style={styles.methodTitle}>{method.title}</Text>
            <Text style={styles.methodValue}>{method.value}</Text>
          </View>
        </View>
        <AppIcon icon={active ? 'radioOn' : 'radioOff'} size={22} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Payment"
          onBack={() => navigation.goBack()}
          rightLabel="Manage"
          onRightPress={() => navigation.navigate('PaymentMethods')}
        />

        <Text style={styles.sectionTitle}>Cash</Text>
        {cashMethods.length ? (
          <View style={styles.groupCard}>
            {cashMethods.map(renderMethodRow)}
          </View>
        ) : renderEmptyMethods('Cash methods')}

        <Text style={styles.sectionTitle}>Wallet</Text>
        {walletMethods.length ? (
          <View style={styles.groupCard}>
            {walletMethods.map(renderMethodRow)}
          </View>
        ) : renderEmptyMethods('Wallet methods')}

        <Text style={styles.sectionTitle}>Credit & Debit Card</Text>
        <TouchableOpacity
          style={styles.addCardRow}
          onPress={() => navigation.navigate('PaymentMethodForm')}
          activeOpacity={0.88}
        >
          <View style={styles.methodIconWrap}>
            <AppIcon icon="card" size={20} color={colors.primary} />
          </View>
          <Text style={styles.addCardLabel}>Add Card</Text>
          <AppIcon icon="forward" size={20} color={colors.primary} />
        </TouchableOpacity>

        {cardMethods.length ? (
          <View style={styles.groupCard}>{cardMethods.map(renderMethodRow)}</View>
        ) : (
          renderEmptyMethods('Cards')
        )}

        <Text style={styles.sectionTitle}>Quick Pay</Text>
        <View style={styles.walletRow}>
          {walletOptions.map(wallet => {
            const active = wallet.id === selectedWallet;

            return (
              <TouchableOpacity
                key={wallet.id}
                activeOpacity={0.85}
                style={[styles.walletCard, active && styles.walletCardActive]}
                onPress={() => setSelectedWallet(wallet.id)}
              >
                <View style={styles.walletImageWrap}>
                  {walletImageErrors[wallet.id] ? (
                    <View style={styles.walletFallback}>
                      <AppIcon
                        icon={getWalletFallbackIcon(wallet.id)}
                        size={24}
                        color={colors.primary}
                      />
                      <Text style={styles.walletFallbackText}>{wallet.label}</Text>
                    </View>
                  ) : (
                    <Image
                      source={wallet.image}
                      resizeMode="contain"
                      style={styles.walletImage}
                      onError={() =>
                        setWalletImageErrors(current => ({ ...current, [wallet.id]: true }))
                      }
                    />
                  )}
                </View>
                <Text style={styles.walletLabel}>{wallet.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>More Payment Options</Text>
        {digitalMethods.length ? (
          <View style={styles.groupCard}>
            {digitalMethods.map(renderMethodRow)}
          </View>
        ) : renderEmptyMethods('Digital payment options')}

        <View style={styles.couponHeaderRow}>
          <Text style={styles.sectionTitle}>Apply Coupon</Text>
          <TouchableOpacity onPress={handleShowEmptyCoupons}>
            <Text style={styles.emptyAction}>Show Empty</Text>
          </TouchableOpacity>
        </View>

        {availableCoupons.length ? (
          availableCoupons.map(coupon => {
            const active = coupon.id === selectedCouponId;

            return (
              <TouchableOpacity
                key={coupon.id}
                activeOpacity={0.88}
                style={[styles.couponCard, active && styles.couponCardActive]}
                onPress={() => handleCouponPress(coupon.id)}
              >
                <View style={styles.couponBadge}>
                  <Text style={styles.couponBadgeText}>{coupon.title}</Text>
                </View>
                <View style={styles.couponCopy}>
                  <Text style={styles.couponTitle}>{coupon.code}</Text>
                  <Text style={styles.couponBody}>{coupon.description}</Text>
                </View>
                <Text style={styles.couponApplyText}>{active ? 'Applied' : 'Apply'}</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCouponCard}>
            <Text style={styles.emptyCouponTitle}>Coupons Empty</Text>
            <Text style={styles.emptyCouponBody}>No coupons are available right now.</Text>
          </View>
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Final Amount</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatCurrency(cartTotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>{formatCurrency(shipping)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.discountValue}>- {formatCurrency(discountAmount)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.finalLabel}>Payable Total</Text>
            <Text style={styles.finalValue}>{formatCurrency(finalAmount)}</Text>
          </View>
        </View>

        <CustomButton title="Place Order" onPress={handlePlaceOrder} loading={placingOrder} />
        <CustomButton
          title="Need SMS Support?"
          onPress={handleSmsSupport}
          variant="secondary"
          style={styles.supportButton}
        />
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
      fontSize: 20,
      fontWeight: '800',
    },
    groupCard: {
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
    },
    methodRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    methodRowActive: {
      backgroundColor: colors.surfaceMuted,
    },
    methodMain: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: spacing.md,
    },
    methodIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    methodCopy: {
      marginLeft: spacing.md,
      flex: 1,
    },
    methodTitle: {
      color: colors.text,
      fontWeight: '700',
    },
    methodValue: {
      marginTop: 4,
      color: colors.textMuted,
    },
    addCardRow: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    addCardLabel: {
      flex: 1,
      marginLeft: spacing.md,
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    walletRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    walletCard: {
      width: '31%',
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: 'center',
    },
    walletCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceMuted,
    },
    walletImageWrap: {
      width: '100%',
      height: 64,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletImage: {
      width: '88%',
      height: '88%',
    },
    walletFallback: {
      width: '100%',
      height: '100%',
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    walletFallbackText: {
      marginTop: 6,
      color: colors.primary,
      fontSize: 11,
      fontWeight: '700',
      textAlign: 'center',
    },
    walletLabel: {
      marginTop: spacing.sm,
      color: colors.text,
      fontSize: 12,
      fontWeight: '700',
      textAlign: 'center',
    },
    emptyStateCard: {
      borderRadius: radius.lg,
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
    couponHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    emptyAction: {
      marginTop: spacing.lg,
      color: colors.primary,
      fontWeight: '700',
    },
    couponCard: {
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
    },
    couponCardActive: {
      backgroundColor: colors.primarySoft,
    },
    couponBadge: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      backgroundColor: 'rgba(255,255,255,0.14)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.sm,
    },
    couponBadgeText: {
      color: colors.surface,
      fontWeight: '800',
      textAlign: 'center',
    },
    couponCopy: {
      flex: 1,
      paddingHorizontal: spacing.md,
    },
    couponTitle: {
      color: colors.surface,
      fontSize: 18,
      fontWeight: '800',
    },
    couponBody: {
      marginTop: spacing.xs,
      color: '#EEDFD0',
      lineHeight: 20,
    },
    couponApplyText: {
      color: colors.surface,
      fontWeight: '800',
    },
    emptyCouponCard: {
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyCouponTitle: {
      color: colors.text,
      fontWeight: '800',
    },
    emptyCouponBody: {
      marginTop: spacing.sm,
      color: colors.textMuted,
    },
    summaryCard: {
      marginVertical: spacing.xl,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    summaryLabel: {
      color: colors.textMuted,
    },
    summaryValue: {
      color: colors.text,
      fontWeight: '700',
    },
    discountValue: {
      color: '#2E7D32',
      fontWeight: '800',
    },
    summaryDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    finalLabel: {
      color: colors.text,
      fontWeight: '800',
    },
    finalValue: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: '800',
    },
    supportButton: {
      marginTop: spacing.md,
    },
  });

export default PaymentScreen;
