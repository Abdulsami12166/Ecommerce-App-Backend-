import React, { useMemo } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CustomButton from '../../components/CustomButton';
import { useAppStore } from '../../context/AppContext';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';
import { formatCurrency } from '../../utils/helpers';

const statCards = (overview, colors) => [
  {
    id: 'total',
    label: 'Total Orders',
    value: String(overview.totalOrders),
    tint: colors.primary,
  },
  {
    id: 'live',
    label: 'Live Orders',
    value: String(overview.liveOrders),
    tint: colors.success,
  },
  {
    id: 'done',
    label: 'Delivered',
    value: String(overview.completedOrders),
    tint: colors.accent,
  },
  {
    id: 'revenue',
    label: 'Revenue',
    value: formatCurrency(overview.revenue),
    tint: colors.primarySoft,
  },
];

const formatUserMeta = event => {
  const parts = [event.userName, event.userEmail, event.userPhone].filter(Boolean);
  return parts.join(' | ');
};

const AdminDashboardScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const {
    adminProfile,
    adminOverview,
    adminFeed,
    orders,
    ordersLoading,
    fetchOrders,
    simulateIncomingOrder,
    adminSignOut,
  } = useAppStore();

  const liveOrders = useMemo(
    () => orders.filter(order => order.statusGroup === 'current').slice(0, 6),
    [orders],
  );

  const cards = useMemo(() => statCards(adminOverview, colors), [adminOverview, colors]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={ordersLoading} onRefresh={fetchOrders} tintColor={colors.primary} />
        }
      >
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.eyebrow}>Realtime Admin</Text>
              <Text style={styles.title}>Purchase and delivery activity is live now</Text>
            </View>
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>

          <Text style={styles.subtitle}>
            Signed in as {adminProfile?.name || 'Admin'}. New purchases appear instantly and active
            orders auto-progress while this dashboard is open.
          </Text>

          <View style={styles.heroActions}>
            <CustomButton title="Simulate Purchase" onPress={simulateIncomingOrder} style={styles.heroButton} />
            <CustomButton title="Log Out" variant="secondary" onPress={() => {
              adminSignOut();
              navigation.replace('AdminLogin');
            }} style={styles.heroButton} />
          </View>
        </View>

        <View style={styles.grid}>
          {cards.map(card => (
            <View key={card.id} style={styles.statCard}>
              <Text style={[styles.statValue, { color: card.tint }]}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Realtime User Logins</Text>
          <Text style={styles.sectionSubtitle}>
            Every verified customer login shows here immediately with the user identity attached.
          </Text>

          {adminOverview.recentLogins.length ? (
            adminOverview.recentLogins.map(event => (
              <View key={event.id} style={styles.feedCard}>
                <Text style={styles.feedTitle}>{event.title}</Text>
                <Text style={styles.feedDetail}>{event.detail}</Text>
                <Text style={styles.userMeta}>{formatUserMeta(event)}</Text>
                <Text style={styles.feedTime}>{new Date(event.timestamp).toLocaleTimeString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No customer logins yet</Text>
              <Text style={styles.emptyText}>Once a user verifies OTP, their login will appear here live.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Purchases</Text>
          <Text style={styles.sectionSubtitle}>
            These update immediately whenever a new order enters the store flow.
          </Text>

          {adminOverview.recentPurchases.length ? (
            adminOverview.recentPurchases.map(event => (
              <View key={event.id} style={styles.feedCard}>
                <Text style={styles.feedTitle}>{event.title}</Text>
                <Text style={styles.feedDetail}>{event.detail}</Text>
                <Text style={styles.userMeta}>{formatUserMeta(event)}</Text>
                <Text style={styles.feedTime}>{new Date(event.timestamp).toLocaleTimeString()}</Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No purchases yet</Text>
              <Text style={styles.emptyText}>Use Simulate Purchase or place an order from the app.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders In Motion</Text>
          <Text style={styles.sectionSubtitle}>
            Current orders refresh in place so the admin can watch what is moving right now.
          </Text>

          {liveOrders.length ? (
            liveOrders.map(order => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('OrderDetails', { orderId: order.id })}
              >
                <View style={styles.orderTopRow}>
                  <Text style={styles.orderCode}>{order.code}</Text>
                  <Text style={styles.orderStatus}>{order.status}</Text>
                </View>
                <Text style={styles.orderTrack}>{order.trackingTitle}</Text>
                <View style={styles.orderBottomRow}>
                  <Text style={styles.orderMeta}>{order.items} item(s)</Text>
                  <Text style={styles.orderMeta}>{formatCurrency(Number(order.total || 0))}</Text>
                </View>
                {order.customerName ? (
                  <Text style={styles.orderBuyer}>
                    Buyer: {[order.customerName, order.customerEmail, order.customerPhone].filter(Boolean).join(' | ')}
                  </Text>
                ) : null}
                <Text style={styles.orderEta}>{order.eta}</Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No live orders</Text>
              <Text style={styles.emptyText}>All current purchases have either finished or been cleared.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Realtime Event Stream</Text>
          <Text style={styles.sectionSubtitle}>
            Purchase creation, sync events, and status movement all show up here immediately.
          </Text>

          {adminFeed.slice(0, 12).map(event => (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.feedTitle}>{event.title}</Text>
                <Text style={styles.feedDetail}>{event.detail}</Text>
                {event.userName || event.userEmail || event.userPhone ? (
                  <Text style={styles.userMeta}>{formatUserMeta(event)}</Text>
                ) : null}
                <Text style={styles.feedTime}>{new Date(event.timestamp).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    hero: {
      padding: spacing.xl,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    heroHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    eyebrow: {
      color: colors.primary,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      fontSize: 12,
    },
    title: {
      marginTop: spacing.sm,
      color: colors.text,
      fontSize: 28,
      lineHeight: 35,
      fontWeight: '800',
      maxWidth: '85%',
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    liveDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.success,
      marginRight: spacing.xs,
    },
    liveText: {
      color: colors.success,
      fontWeight: '800',
      fontSize: 12,
    },
    subtitle: {
      marginTop: spacing.md,
      color: colors.textMuted,
      lineHeight: 22,
    },
    heroActions: {
      marginTop: spacing.lg,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    heroButton: {
      flex: 1,
    },
    grid: {
      marginTop: spacing.xl,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
    },
    statCard: {
      width: '47%',
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '800',
    },
    statLabel: {
      marginTop: spacing.xs,
      color: colors.textMuted,
      fontWeight: '600',
    },
    section: {
      marginTop: spacing.xl,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 22,
      fontWeight: '800',
    },
    sectionSubtitle: {
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      color: colors.textMuted,
      lineHeight: 20,
    },
    feedCard: {
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    feedTitle: {
      color: colors.text,
      fontWeight: '800',
    },
    feedDetail: {
      marginTop: 4,
      color: colors.textMuted,
      lineHeight: 20,
    },
    feedTime: {
      marginTop: spacing.xs,
      color: colors.primary,
      fontSize: 12,
      fontWeight: '700',
    },
    userMeta: {
      marginTop: spacing.xs,
      color: colors.text,
      fontSize: 12,
      fontWeight: '700',
      lineHeight: 18,
    },
    emptyCard: {
      borderRadius: radius.md,
      backgroundColor: colors.surfaceMuted,
      padding: spacing.lg,
    },
    emptyTitle: {
      color: colors.text,
      fontWeight: '800',
    },
    emptyText: {
      marginTop: spacing.xs,
      color: colors.textMuted,
      lineHeight: 20,
    },
    orderCard: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: spacing.md,
    },
    orderTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    orderCode: {
      color: colors.text,
      fontWeight: '800',
    },
    orderStatus: {
      color: colors.success,
      fontWeight: '800',
    },
    orderTrack: {
      marginTop: spacing.xs,
      color: colors.textMuted,
      lineHeight: 20,
    },
    orderBottomRow: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    orderMeta: {
      color: colors.primary,
      fontWeight: '700',
    },
    orderEta: {
      marginTop: spacing.xs,
      color: colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    orderBuyer: {
      marginTop: spacing.xs,
      color: colors.textMuted,
      lineHeight: 19,
      fontWeight: '600',
    },
    timelineRow: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: spacing.md,
    },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.accent,
      marginTop: 6,
      marginRight: spacing.md,
    },
    timelineContent: {
      flex: 1,
    },
  });

export default AdminDashboardScreen;
