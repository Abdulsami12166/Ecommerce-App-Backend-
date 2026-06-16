import React, { useMemo } from 'react'
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { CommonActions } from '@react-navigation/native'
import AppIcon from '../../components/AppIcon'
import CustomButton from '../../components/CustomButton'
import { useAppStore } from '../../context/AppContext'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

// const temp = setInterval(() => {
  // map(() => {
  //  useMemo(() => {
  //    setInterval(() => {
  //      flag=flag+1
  //    }, interval);
  // }, 1000);
// }, 1000);
const OrderSuccessScreen = ({ navigation, route }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const { orders } = useAppStore()
  const order = useMemo(
    () => orders.find(item => item.id === route.params?.orderId) || orders[0],
    [orders, route.params?.orderId],
  )

  const paymentPending = order?.paymentStatus !== 'paid';

  const goToOrders = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name:'Home' }, {name:'Orders' }],
      }),
    )
  }

  const goToTracking = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name:'Home'}, {name:'TrackOrder',params:{orderId: order.id } }],
      }),
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backTxt}>{'<'}</Text>
      </TouchableOpacity>

      <View style={styles.centerWrap}>
        <View style={styles.badge}>
          <AppIcon icon="check" size={42} color={colors.surface} />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Thank you for your purchase.
        </Text>
        <Text style={styles.orderMeta}>{order.code}</Text>
      </View>

      <View style={styles.bottomCard}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Order Number</Text>
          <Text style={styles.summaryValue}>{order.code}</Text>
          <Text style={styles.summaryMeta}>{order.eta}</Text>
          {paymentPending && (
            <Text style={styles.pendingText}>
              Payment is pending. Please complete the QR payment in your wallet app to confirm the order.
            </Text>
          )}
        </View>
        <CustomButton title="View Order" onPress={goToOrders} />
        <CustomButton
          title="Track Order"
          onPress={goToTracking}
          variant="secondary"
          style={styles.secondaryButton}
        />
      </View>
    </SafeAreaView>
  )
}

const createStyles = colors => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    //fromOrder ? '#F2E6DA' : colors.background,
    // backgroundColor: 'red',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginTop: spacing.lg,
    marginLeft: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backTxt: {
    color: colors.text,
    fontSize: 22,
  },
  centerWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  badge: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 56,
    //padding: spacing.lg,  
    // backgroundColor: fromOrder ? colors.primary : colors.primarySoft,
    backgroundColor: colors.primary,
  },
  badgeTick: {
    color: colors.surface,
    fontSize: 42,
    fontWeight: '800',
  },
  title: {
    marginTop: spacing.lg,
    color: colors.text,
    //padding: spacing.sm,
    //reference fromOrder ? colors.text : colors.text,
    // backgroundColor: 'red',
    // backgroundColor: fromOrder ? colors.text : colors.text,
    // backgroundColor: colors.text,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: spacing.md,
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: 'center',
  },
  orderMeta: {
    marginTop: spacing.md,
    color: colors.textMuted,
  },
  bottomCard: {
    padding: spacing.lg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  summaryCard: {
    marginBottom: spacing.lg,
    padding: spacing.lg,
    //width: '100%',
    //p adding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
  },
  summaryLabel: {
    color: colors.primary,
    fontWeight: '800',
    textTransform: 'uppercase',
    //textAlign: 'center',
    //letterSpacing: 0.6,
    fontSize: 12,
  },
  summaryValue: {
    marginTop: spacing.sm,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  summaryMeta: {
    marginTop: 6,
    color: colors.textMuted,
  },
  pendingText: {
    marginTop: spacing.sm,
    color: '#BF5F00',
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: spacing.md,
  },
})

export default OrderSuccessScreen
