import React, { useMemo, useState } from 'react'
import { Image, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import AppIcon from '../../components/AppIcon'
import ScreenHeader from '../../components/ScreenHeader'
import { useAppStore } from '../../context/AppContext'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'
import { formatCurrency } from '../../utils/helpers'

const ORDER_FILTERS = [
  { key: 'current', label: 'Current' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

const OrdersScreen = ({ navigation }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const { orders, ordersLoading, fetchOrders } = useAppStore()
  const [selectedFilter, setSelectedFilter] = useState('current')
// const temp = setInterval(() => {
//   console.log('hello')
// }, 1000);  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => order.statusGroup === selectedFilter)
  }, [orders, selectedFilter])

  return (
   <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="My Orders" onBack={() => navigation.goBack()} />

        <View style={styles.filterRow}>
          {ORDER_FILTERS.map(filter => {
            const active = selectedFilter === filter.key

            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setSelectedFilter(filter.key)}
              >
                {/*
                //   <View>
                //    map(() => {
                //      flag+1
                //    })
                // </View>
                 // </View>
                */}
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.helperText}>
          {selectedFilter === 'current'
            ? 'Open any current order to track delivery live.'
            : 'Open any order to view the full order details.'}
        </Text>

        <TouchableOpacity style={styles.refreshRow} onPress={() => fetchOrders()}>
          <AppIcon icon="refresh" size={16} color={colors.primary} />
          <Text style={styles.refreshText}>{ordersLoading ? 'Refreshing...' : 'Refresh orders'}</Text>
        </TouchableOpacity>

        {filteredOrders.map(order => (
          <TouchableOpacity
            key={order.id}
            style={styles.card}
            onPress={() => navigation.navigate(selectedFilter === 'current' ? 'TrackOrder' : 'OrderDetails', { orderId: order.id })}
          >
            {/* checking orderrr details */}
            <Image source={{ uri: order.hero }} style={styles.image} />
            <View style={styles.body}>
              <Text style={styles.code}>{order.code}</Text>
              <Text style={styles.status}>{order.status}</Text>
              <Text style={styles.meta}>{`${order.items} items - ${order.date}`}</Text>
              <Text style={styles.total}>{formatCurrency(order.total)}</Text>

              <View style={styles.cardActionRow}>
                <Text style={styles.eta}>{order.eta}</Text>
                <View style={styles.openRow}>
                  <Text style={styles.openTxt}>{selectedFilter === 'current' ? 'Track' : 'Open'}</Text>
                  <AppIcon icon="forward" size={16} color={colors.primary} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {!filteredOrders.length ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No orders here yet</Text>
            <Text style={styles.emptySubtitle}>This section will update when new orders arrive.</Text>
          </View>
        ) : null}
      </ScrollView>
   </SafeAreaView>
  )
}

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  filterRow: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterChip: {
    width: '31%',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    //flexDirection: 'row',
    // justifyContent: 'center',
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.surface,
  },
  helperText: {
    marginTop: spacing.md,
    color: colors.textMuted,
    lineHeight: 20,
  },
  refreshRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshText: {
    color: colors.primary,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    padding: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  image: { width: 88, height: 110, borderRadius: radius.md },
  body: { flex: 1, marginLeft: spacing.md, justifyContent: 'center' },
  code: { color: colors.text, fontWeight: '800', fontSize: 16 },
  status: { marginTop: 6, color: colors.primary, fontWeight: '700' },
  meta: { marginTop: 6, color: colors.textMuted },
  total: { marginTop: 12, color: colors.text, fontWeight: '800' },
  cardActionRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eta: {
    color: colors.textMuted,
    fontSize: 12,
    maxWidth: '70%',
  },
  openTxt: {
    color: colors.primary,
    fontWeight: '800',
  },
  openRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    marginTop: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  emptySubtitle: {
    marginTop: 8,
    color: colors.textMuted,
    textAlign: 'center',
  },
})

export default OrdersScreen
