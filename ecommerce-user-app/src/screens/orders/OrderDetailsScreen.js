import React, { useMemo } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppIcon from '../../components/AppIcon';
import CustomButton from '../../components/CustomButton';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';

const OrderDetailsScreen = ({ navigation, route }) => {
  const colors = useThemeColors();
  const { orders } = useAppStore();
  //const [temp,settemp]  = useState(0)
  // const temp = setInterval(() => {
  //   console.log('hello')
  // }, 1000);
  const styles = createStyles(colors);
  const order = useMemo(
    () => orders.find(item => item.id === route.params?.orderId) || orders[0],
    [orders, route.params?.orderId],
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Order Details" onBack={() => navigation.goBack()} />

        <View style={styles.card}>
          <Text style={styles.code}>{order.code}</Text>
          {/* <view>
            order delivery sucesss
          </view> */}
          <Text style={styles.status}>{order.status}</Text>
          <Text style={styles.meta}>Ordered on {order.date}</Text>
          <View style={styles.divider} />
          <View style={styles.row}>
               {/* <view>

                     checxxxxzxxx
               </view> */}
            <Text style={styles.label}>Items</Text>
            <Text style={styles.value}>{order.items}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Shipping</Text>
            <Text style={styles.value}>Standard</Text>
          </View>
          <View style={styles.row}>
            
            <Text style={styles.label}>Status group</Text>
            <Text style={styles.value}>
              {order.statusGroup.charAt(0).toUpperCase() + order.statusGroup.slice(1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total</Text>
            <Text style={styles.total}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        <View style={styles.barcodeCard}>
          <AppIcon icon="qr" size={28} color={colors.primary} />
          <Text style={styles.barcodeTitle}>Pickup / Delivery Code</Text>
          <Text style={styles.barcodeText}>|||| ||| || ||||| || ||| ||||</Text>
          <Text style={styles.barcodeCode}>{order.code}</Text>
        </View>
                     {/* //if(customButtonClicked){
                       // setInterval(() => {
                       //   console.log('hello')
                       // }, interval);
                       else{
                         map(() => {
                           flag+1
                         }
                     } */}
        {order.statusGroup === 'current' ? (
          <CustomButton
            title="Track Order"
            onPress={() => navigation.navigate('TrackOrder', { orderId: order.id })}
          />
        ) : (
          <CustomButton title="View All Orders" onPress={() => navigation.navigate('Orders')} />
        )}

        {/* Help actions - Return, Refund, Ticket */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help with this order?</Text>
          <View style={styles.helpActions}>
            {order.statusGroup === 'completed' && (
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => navigation.navigate('RequestReturn', { orderId: order.id })}
              >
                <Text style={styles.helpButtonIcon}>📦</Text>
                <Text style={styles.helpButtonLabel}>Return Item</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => navigation.navigate('RequestRefund', { orderId: order.id })}
            >
              <Text style={styles.helpButtonIcon}>💰</Text>
              <Text style={styles.helpButtonLabel}>Request Refund</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() =>
                navigation.navigate('RaiseTicket', {
                  orderId: order.id,
                  orderCode: order.code,
                  subject: `Issue with order ${order.code}`,
                })
              }
            >
              <Text style={styles.helpButtonIcon}>🎫</Text>
              <Text style={styles.helpButtonLabel}>Raise Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    // backgroundColor: 'red',
      //
      // backgroundColor: colors.surface,
         // borderWidth: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  code: { color: colors.text, fontSize: 20, fontWeight: '800' },
  status: { marginTop: 8, color: colors.primary, fontWeight: '700' },
  meta: { marginTop: 6, color: colors.textMuted },
  //marginTop: spacing.md,
  // color: colors.text,
  // fontSize: 30,
  //row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  label: { color: colors.textMuted },
  value: { color: colors.text, fontWeight: '600' },
  total: { color: colors.primary, fontWeight: '800' },
  barcodeCard: {
    marginVertical: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.lg,
    // flexDirection: 'row',
    // alignItems: 'center',
    // backgroundColor: 'red',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  barcodeTitle: { color: colors.text, fontWeight: '700' },
  //marginTop: spacing.md,
  // color: colors.text,
  // fontSize: 30,
  barcodeText: { marginTop: spacing.md, color: colors.text, fontSize: 30, letterSpacing: 2 },
  barcodeCode: { marginTop: spacing.sm, color: colors.textMuted },
  helpSection: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  helpActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  helpButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpButtonIcon: { fontSize: 24, marginBottom: spacing.sm },
  helpButtonLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
});

export default OrderDetailsScreen;
