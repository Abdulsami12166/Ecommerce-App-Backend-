import React, { useMemo, useState } from 'react'
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import AppIcon from '../../components/AppIcon'
import BottomNav from '../../components/BottomNav'
import CustomButton from '../../components/CustomButton'
import OptimizedImage from '../../components/OptimizedImage'
import { useAppStore } from '../../context/AppContext'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'
import { formatCurrency } from '../../utils/helpers'

const CartScreen = ({ navigation }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const {
    cartItems,
    cartTotal,
    activityFeed,
    increaseCartItem,
    decreaseCartItem,
    removeCartItem,
  } = useAppStore()
  const [promo,setPromo] = useState('')

  const delivery = 20
  const tax = 0
  const discount = cartTotal>200 ? 20 : 0
  const total = cartTotal+delivery+tax-discount
  const recentOperations = useMemo(() => activityFeed.slice(0,2), [activityFeed])

  const handleRemoveItem = item => {
    removeCartItem(item.id)
  }

  return (
   <SafeAreaView style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        ListHeaderComponent={
          <>
            <View style={styles.headerRow}>
              <TouchableOpacity style={styles.roundButton} onPress={() => navigation.goBack()}>
                <AppIcon icon="back" size={22} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.title}>My Cart</Text>
              <View style={styles.roundButtonPlaceholder} />
            </View>

            {!!recentOperations.length && (
              <View style={styles.operationCard}>
                <Text style={styles.operationTitle}>recent ops</Text>
                {recentOperations.map(item => (
                  <Text key={item.id} style={styles.operationText}>
                    {item.message}
                  </Text>
                ))}
              </View>
            )}
          </>
        }
        renderItem={({ item }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemCard}>
              <OptimizedImage source={{ uri: item.image }} style={styles.itemImage} width={260} />

              <View style={styles.itemBody}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>{item.size}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.itemPrice}>{formatCurrency(item.price)}</Text>
                  <Text style={styles.oldPrice}>{formatCurrency(item.price*1.4)}</Text>
                </View>
              </View>

              <View style={styles.qtyWrap}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => decreaseCartItem(item.id)}>
                  <Text style={styles.qtyBtnText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{item.qty}</Text>
                <TouchableOpacity style={[styles.qtyBtn,styles.qtyBtnDark]} onPress={() => increaseCartItem(item.id)}>
                  <Text style={styles.qtyBtnTextLight}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.deleteStrip} onPress={() => handleRemoveItem(item)}>
              <AppIcon icon="trash" size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <>
            <View style={styles.promoCard}>
              <View style={styles.promoRow}>
                <TextInput
                  value={promo}
                  onChangeText={setPromo}
                  placeholder="Promo Code"
                  placeholderTextColor={colors.textMuted}
                  style={styles.promoInput}
                />
                <TouchableOpacity style={styles.applyBtn}>
                  <Text style={styles.applyTxt}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Payment Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sub-Total</Text>
                <Text style={styles.summaryValue}>{formatCurrency(cartTotal)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Charge</Text>
                <Text style={styles.summaryValue}>{formatCurrency(delivery)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>{formatCurrency(tax)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={styles.discountValue}>- {formatCurrency(discount)}</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotalLabel}>Total Cost</Text>
                <Text style={styles.summaryTotalValue}>{formatCurrency(total)}</Text>
              </View>
            </View>

            {/* go chckout side */}
            <CustomButton title="Proceed to Checkout" onPress={() => navigation.navigate('Checkout')} />

            <BottomNav active="Home" navigation={navigation} />
          </>
        }
      />
   </SafeAreaView>
  )
}

const createStyles = colors => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roundButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  roundButtonPlaceholder: {
    width: 42,
    height: 42,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  operationCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  operationTitle: {
    color: colors.primary,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  operationText: {
    color: colors.text,
    marginBottom: 6,
  },
  itemRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  itemCard: {
    flexDirection: 'row',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
  },
  itemImage: {
    width: 82,
    height: 92,
    borderRadius: radius.md,
  },
  itemBody: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  itemName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  itemMeta: {
    marginTop: 6,
    color: colors.textMuted,
  },
  priceRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemPrice: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
  },
  oldPrice: {
    marginLeft: spacing.sm,
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  qtyWrap: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDark: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  qtyBtnText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '700',
  },
  qtyBtnTextLight: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '700',
  },
  quantityValue: {
    color: colors.text,
    fontWeight: '700',
    marginHorizontal: 10,
  },
  deleteStrip: {
    width: 50,
    marginLeft: -8,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: '#F25555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  promoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  applyBtn: {
    marginLeft: spacing.sm,
    minWidth: 92,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  applyTxt: {
    color: colors.surface,
    fontWeight: '800',
  },
  summaryCard: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 18,
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
    fontWeight: '600',
  },
  discountValue: {
    color: colors.primary,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  summaryTotalLabel: {
    color: colors.text,
    fontWeight: '800',
  },
  summaryTotalValue: {
    color: colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
})

export default CartScreen
