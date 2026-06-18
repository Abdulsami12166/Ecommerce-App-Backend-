import React, { useEffect, useState } from 'react'
import {
  Alert,
  AppState,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AppIcon from '../../components/AppIcon'
import CustomButton from '../../components/CustomButton'
import ScreenHeader from '../../components/ScreenHeader'
import { useAppStore } from '../../context/AppContext'
import { getCurrentLocation, getLocationPermissionStatus } from '../../services/locationService'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'
import { refundApi, returnApi, replacementApi } from '../../services/api'

const TrackOrderScreen = ({ navigation, route }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const { openSupportChatForProduct, orders, authToken } = useAppStore()
  const activeOrder = orders.find(order => order.id === route.params?.orderId) || orders[0] || null

  const [activeReturn, setActiveReturn] = useState(null)
  const [activeRefund, setActiveRefund] = useState(null)
  const [activeReplacement, setActiveReplacement] = useState(null)

  useEffect(() => {
    if (!authToken || !activeOrder) return

    const fetchOrderSupportStatus = async () => {
      try {
        const [returnsRes, refundsRes, replacementsRes] = await Promise.all([
          returnApi.getReturns(authToken).catch(() => ({ data: { returns: [] } })),
          refundApi.getRefunds(authToken).catch(() => ({ data: { refunds: [] } })),
          replacementApi.getReplacements(authToken).catch(() => ({ data: { replacements: [] } })),
        ])

        const orderId = String(activeOrder.id || activeOrder._id)

        const foundReturn = (returnsRes.data?.returns || []).find(
          r => String(r.order?._id || r.order || r.orderId) === orderId
        )
        const foundRefund = (refundsRes.data?.refunds || []).find(
          r => String(r.order?._id || r.order || r.orderId) === orderId
        )
        const foundReplacement = (replacementsRes.data?.replacements || []).find(
          r => String(r.order?._id || r.order || r.orderId) === orderId
        )

        setActiveReturn(foundReturn || null)
        setActiveRefund(foundRefund || null)
        setActiveReplacement(foundReplacement || null)
      } catch (error) {
        console.error('Error fetching support status:', error)
      }
    }

    fetchOrderSupportStatus()
  }, [activeOrder, authToken])
  const orderTimeline = React.useMemo(() => {
    if (!activeOrder) {
      return []
    }

    const status = activeOrder?.orderStatus || activeOrder?.status?.toLowerCase().replace(/\s+/g, '-') || 'processing'
    const order = ['order-confirmed', 'packed', 'shipped', 'out-for-delivery', 'delivered']
    const aliases = {
      pending: 'order-confirmed',
      paid: 'order-confirmed',
      processing: 'order-confirmed',
      shipping: 'shipped',
      'near-delivery': 'out-for-delivery',
    }
    const currentIndex = order.indexOf(aliases[status] || status)
    const history = activeOrder.statusHistory || []
    const labels = {
      'order-confirmed': 'Order Confirmed',
      packed: 'Packed',
      shipped: 'Shipped',
      'out-for-delivery': 'Out For Delivery',
      delivered: 'Delivered',
    }

    return order.map((stepStatus, index) => {
      const historyItem = history.find(item => (aliases[item.status] || item.status) === stepStatus)
      return {
        id: stepStatus,
        icon: stepStatus === 'delivered' ? 'home' : stepStatus === 'shipped' || stepStatus === 'out-for-delivery' ? 'route' : 'package',
        title: labels[stepStatus],
        time: historyItem?.timestamp ? new Date(historyItem.timestamp).toLocaleString() : index <= currentIndex ? 'Completed' : 'Pending',
        done: index <= currentIndex,
      }
    })
  }, [activeOrder])
  const shippingRoute = React.useMemo(() => {
    const status = activeOrder?.orderStatus || activeOrder?.status?.toLowerCase().replace(/\s+/g, '-') || 'processing'
    const isShipped = ['shipping', 'shipped', 'near-delivery', 'out-for-delivery', 'delivered'].includes(status)
    const isOutForDelivery = ['near-delivery', 'out-for-delivery', 'delivered'].includes(status)
    const isDelivered = status === 'delivered'

    return [
      {
        id: 'warehouse',
        icon: 'package',
        title: 'Warehouse',
        subtitle: 'Packed, verified and ready for dispatch',
        state: 'Completed',
        done: true,
      },
      {
        id: 'hub',
        icon: 'route',
        title: 'City shipping hub',
        subtitle: isOutForDelivery ? 'Courier is heading to your address' : isShipped ? 'Courier is moving through your city' : 'Waiting for courier pickup',
        state: isOutForDelivery ? 'Out for delivery' : isShipped ? 'Active' : 'Next',
        done: isShipped,
        active: !isDelivered,
      },
      {
        id: 'address',
        icon: 'home',
        title: 'Your address',
        subtitle: isDelivered ? 'Order delivered successfully' : 'Final doorstep delivery',
        state: isDelivered ? 'Done' : 'Pending',
        done: isDelivered,
      },
    ]
  }, [activeOrder])
  const [locationLabel, setLocationLabel] = useState('Enable location to view the courier map')
  const [locationGranted, setLocationGranted] = useState(false)
  const [trackingCoords, setTrackingCoords] = useState(null)
  const [refreshingLocation, setRefreshingLocation] = useState(false)
  const [showMapPreview, setShowMapPreview] = useState(false)

  const syncLocation = React.useCallback(async () => {
    const granted = await getLocationPermissionStatus()
    setLocationGranted(granted)

    if (!granted) {
      setTrackingCoords(null)
      setLocationLabel('Enable location to view the courier map')
      return
    }
//try{
//   const position = await getCurrentLocation();
//   const nextCoords = {
//     latitude: position.coords.latitude,
//     longitude: position.coords.longitude,
//   };
//   setTrackingCoords(nextCoords);
//   setLocationLabel(
//     `${nextCoords.latitude.toFixed(4)},${nextCoords.longitude.toFixed(4)}`,
//   );
// } catch (error) {
//   setTrackingCoords(null);
//   setLocationLabel(error?.message || 'Unable to fetch current coordinates right now');
// }
    try {
      const position = await getCurrentLocation()
      const nextCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
      setTrackingCoords(nextCoords)
      setLocationLabel(
        `${nextCoords.latitude.toFixed(4)}, ${nextCoords.longitude.toFixed(4)}`,
      )
    } catch (error) {
      setTrackingCoords(null)
      setLocationLabel(error?.message || 'Unable to fetch current coordinates right now')
    }
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      syncLocation()
    }, [syncLocation]),
  )
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     console.log('hello');
  //   }, 1000);

  //   return () => clearInterval(intervalId);
  // }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState==='active') {
        syncLocation()
      }
    })

    return()=>subscription.remove()
  }, [syncLocation])

  const handleRefreshTracking=async () => {
    try {
      setRefreshingLocation(true)
      const position=await getCurrentLocation()
      const nextCoords={
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      }
// setLocationGranted(null);
// setLocationLabel('Refreshing location...');
      setLocationGranted(true)
      setTrackingCoords(nextCoords)
      setLocationLabel(
        `${nextCoords.latitude.toFixed(4)}, ${nextCoords.longitude.toFixed(4)}`,
      )
      return nextCoords
    } catch (error) {
      const granted=await getLocationPermissionStatus()
      setLocationGranted(granted)
      Alert.alert(
        'Location unavailable',
        error?.message || 'Unable to fetch current coordinates right now.',
        [
          { text: 'Cancel',style:'cancel' },
          { text: 'Open Settings',onPress:()=>Linking.openSettings()},
        ],
      )
      return null
    } finally{
      setRefreshingLocation(false)
    }
  }

  const handleOpenNativeMap =async() =>{
    const nextCoords = !locationGranted || !trackingCoords
      ? await handleRefreshTracking()
      : trackingCoords
          // if (!locationGranted || !trackingCoords) {
          //   nextCoords = await handleRefreshTracking();
          // } else {
          //   nextCoords = trackingCoords;
          // }
    if (!nextCoords) {
      return
    }

    const query = `${nextCoords.latitude},${nextCoords.longitude}`
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`)
  }
// if (message.text) {
//   setInterval(() => {
//     flag=flag+1;
//   }, 1000);
// }
  const handleToggleMapPreview = async () => {
    if (!showMapPreview && (!locationGranted || !trackingCoords)) {
      await handleRefreshTracking()
    }
                // if (!showMapPreview) {
                //   if (!locationGranted || !trackingCoords) {
                //     await handleRefreshTracking();
                //   }
                // }
    setShowMapPreview(current => !current)
  }

  if (!activeOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No live order found</Text>
          <Text style={styles.emptyText}>Place an order first to track it here.</Text>
          <CustomButton title="View Orders" onPress={() => navigation.replace('Orders')} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Track Order" onBack={() => navigation.goBack()} />

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Estimated arrival</Text>
              <Text style={styles.heroTitle}>{activeOrder.eta || '08:15 PM today'}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{activeOrder.status}</Text>
            </View>
          </View>

          <Text style={styles.orderCode}>{activeOrder.code}</Text>
          <Text style={styles.orderSummary}>{activeOrder.trackingTitle}</Text>

          <View style={styles.mapCard}>
            <View style={styles.mapCardHeader}>
              <View style={styles.routeHeaderIcon}>
                <AppIcon icon="route" size={16} color={colors.surface} />
              </View>
              <View>
                <Text style={styles.mapMiniLabel}>Warehouse shipping</Text>
                <Text style={styles.mapMiniSubtitle}>Live package movement</Text>
              </View>
            </View>

            <View style={styles.routeStops}>
              {shippingRoute.map((stop, index) => {
                const isLast = index === shippingRoute.length - 1

                return (
                  <View key={stop.id} style={styles.routeStopRow}>
                    <View style={styles.routeRail}>
                      <View
                        style={[
                          styles.routeDot,
                          stop.done && styles.routeDotDone,
                          stop.active && styles.routeDotActive,
                        ]}
                      >
                        <AppIcon
                          icon={stop.icon}
                          size={11}
                          color={stop.done || stop.active ? colors.surface : colors.primary}
                        />
                      </View>
                      {!isLast ? (
                        <View
                          style={[
                            styles.routeLine,
                            stop.done && styles.routeLineDone,
                          ]}
                        />
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.routeStopCard,
                        stop.active && styles.routeStopCardActive,
                      ]}
                    >
                      <View style={styles.routeStopCopy}>
                        <Text style={styles.routeStopTitle}>{stop.title}</Text>
                        <Text style={styles.routeStopSubtitle}>{stop.subtitle}</Text>
                      </View>
                      <View
                        style={[
                          styles.routeState,
                          stop.done && styles.routeStateDone,
                          stop.active && styles.routeStateActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.routeStateText,
                            (stop.done || stop.active) && styles.routeStateTextActive,
                          ]}
                        >
                          {stop.state}
                        </Text>
                      </View>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          <View style={styles.coordsCard}>
            <View style={styles.coordsTitleRow}>
              <AppIcon icon="pin" size={16} color={colors.primary} />
              <Text style={styles.coordsTitle}>Live courier location</Text>
            </View>
            <Text style={styles.coordsValue}>{locationLabel}</Text>
            <Text style={styles.coordsStatus}>
              {locationGranted ? 'Location permission active' : 'Location permission needed'}
            </Text>
          </View>

          <View style={styles.mapActionRow}>
            <TouchableOpacity style={styles.mapAction} onPress={handleToggleMapPreview}>
              <AppIcon icon="map" size={18} color={colors.primary} />
              <Text style={styles.mapActionTitle}>Map</Text>
              <Text style={styles.mapActionSubtitle}>
                {showMapPreview ? 'Hide preview' : 'Show preview'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapAction}
              onPress={() => Linking.openURL('tel:+9118002109988')}
            >
              <AppIcon icon="call" size={18} color={colors.primary} />
              <Text style={styles.mapActionTitle}>Call</Text>
              <Text style={styles.mapActionSubtitle}>Courier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapAction}
              onPress={() => {
                const leadItem = activeOrder?.items?.[0] || {}
                const chatId = openSupportChatForProduct({
                  id: leadItem.productId || leadItem._id || activeOrder?.id,
                  name: leadItem.title || activeOrder?.trackingTitle || 'Order support',
                  image: leadItem.image || activeOrder?.hero,
                  category: 'Order',
                })
                navigation.navigate('SupportChat', { chatId })
              }}
            >
              <AppIcon icon="message" size={18} color={colors.primary} />
              <Text style={styles.mapActionTitle}>Message</Text>
              <Text style={styles.mapActionSubtitle}>Open owner chat</Text>
            </TouchableOpacity>
          </View>
                 {/* show map box below */}
          {showMapPreview ? (
            <View style={styles.previewSheet}>
              <View style={styles.previewSheetHeader}>
                <View>
                  <Text style={styles.previewTitle}>Route Preview</Text>
                  <Text style={styles.previewSubtitle}>
                    Sample map showing where the courier is and where you are.
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setShowMapPreview(false)}>
                  <Text style={styles.previewClose}>Close</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.previewMap}>
                <View style={styles.previewRoadHorizontal} />
                <View style={styles.previewRoadVertical} />
                <View style={styles.previewRouteLine} />

                <View style={[styles.previewPin, styles.previewCourierPin]}>
                  <AppIcon icon="bicycle" size={14} color={colors.surface} />
                </View>
                <Text style={styles.previewCourierLabel}>Courier</Text>

                <View style={[styles.previewPin, styles.previewUserPin]}>
                  <AppIcon icon="home" size={14} color={colors.surface} />
                </View>
                <Text style={styles.previewUserLabel}>You</Text>

                <View style={styles.previewLegend}>
                  <View style={styles.previewLegendRow}>
                    <View style={[styles.previewLegendDot, styles.previewLegendCourier]} />
                    <Text style={styles.previewLegendText}>Person delivering your order</Text>
                  </View>
                  <View style={styles.previewLegendRow}>
                    <View style={[styles.previewLegendDot, styles.previewLegendUser]} />
                    <Text style={styles.previewLegendText}>Your address location</Text>
                  </View>
                </View>
              </View>

              <CustomButton
                title="Open In Real Map"
                onPress={handleOpenNativeMap}
                variant="secondary"
                style={styles.previewButton}
              />
            </View>
          ) : null}

          {/*
            // onPress={() => {
            //   setInterval(() => {
            //     flag=flag+1;
            //   }, 1000);
            // }}
          */}
          <CustomButton
            title={refreshingLocation ? 'Refreshing...' : 'Refresh Tracking'}
            onPress={handleRefreshTracking}
            variant="secondary"
            loading={refreshingLocation}
            style={styles.refreshButton}
          />
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Delivery progress</Text>
          {orderTimeline.map(step => (
            <View key={step.id} style={styles.stepRow}>
              <View style={[styles.stepDot, step.done && styles.stepDotDone]}>
                <AppIcon
                  icon={step.icon}
                  size={12}
                  color={step.done ? colors.surface : colors.primary}
                />
              </View>
              <View style={styles.stepBody}>
                {/* // <TouchableOpacity onPress={() => {
                //   if (step.done) {
                //     Alert.alert(step.title, `Completed at ${step.time}`);
                //   }
                // }}> */}
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepTime}>
                  {step.time}
                </Text>
              </View>
              <View style={[styles.stepState, step.done && styles.stepStateDone]}>
                <Text style={[styles.stepStateText, step.done && styles.stepStateTextDone]}>
                  {step.done ? 'Done' : 'Next'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Help actions - Return, Refund, Replacement, Ticket */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Need help with this order?</Text>

          {/* Display active status if any requests already exist */}
          {(activeReturn || activeRefund || activeReplacement) && (
            <View style={styles.statusDisplaySection}>
              {activeReturn && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Return Request:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.statusBadge, { color: colors.primary }]}>{activeReturn.status}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ReturnTracking', { returnId: activeReturn._id })}>
                      <Text style={styles.trackLink}>Track</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {activeRefund && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Refund Request:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.statusBadge, { color: colors.primary }]}>{activeRefund.status}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('RefundTracking', { refundId: activeRefund._id })}>
                      <Text style={styles.trackLink}>Track</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              {activeReplacement && (
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Replacement Request:</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={[styles.statusBadge, { color: colors.primary }]}>{activeReplacement.status}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('ReplacementTracking', { replacementId: activeReplacement._id })}>
                      <Text style={styles.trackLink}>Track</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              <View style={styles.divider} />
            </View>
          )}

          <View style={styles.helpActions}>
            {/* Show return/replacement options only if order is delivered/completed */}
            {(activeOrder.statusGroup === 'completed' || activeOrder.status === 'delivered') ? (
              <>
                {!activeReturn && (
                  <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => navigation.navigate('RequestReturn', { orderId: activeOrder.id })}
                  >
                    <Text style={styles.helpButtonIcon}>📦</Text>
                    <Text style={styles.helpButtonLabel}>Return Item</Text>
                  </TouchableOpacity>
                )}
                {!activeReplacement && (
                  <TouchableOpacity
                    style={styles.helpButton}
                    onPress={() => navigation.navigate('RequestReplacement', { orderId: activeOrder.id })}
                  >
                    <Text style={styles.helpButtonIcon}>🔄</Text>
                    <Text style={styles.helpButtonLabel}>Replace Item</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : null}
            {!activeRefund && (
              <TouchableOpacity
                style={styles.helpButton}
                onPress={() => navigation.navigate('RequestRefund', { orderId: activeOrder.id })}
              >
                <Text style={styles.helpButtonIcon}>💰</Text>
                <Text style={styles.helpButtonLabel}>Request Refund</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() =>
                navigation.navigate('RaiseTicket', {
                  orderId: activeOrder.id,
                  orderCode: activeOrder.code,
                  subject: `Issue with order ${activeOrder.code}`,
                })
              }
            >
              <Text style={styles.helpButtonIcon}>🎫</Text>
              <Text style={styles.helpButtonLabel}>Raise Ticket</Text>
            </TouchableOpacity>
          </View>
        </View>

        <CustomButton title="View Orders" onPress={() => navigation.replace('Orders')} />
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: colors.textMuted,
    textAlign: 'center',
  },
  heroCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    //flex:1
    //flex-wrap:'row'
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    // alignItems: 'center',
    alignItems: 'flex-start',
  },
  heroLabel: {
    color: colors.primary,
    fontSize: 12,
    //posistion:'absoloute'
    //top:30
    //bottom:70
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: {
    marginTop: 6,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  heroBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    // paddingHorizontal: spacing.md,
    // paddingVertical: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 12,
  },
  orderCode: {
    marginTop: spacing.md,
    color: colors.text,
    fontWeight: '800',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    fontSize: 16,
  },
  orderSummary: {
    marginTop: 6,
    color: colors.textMuted,
    lineHeight: 20,
  },
  mapCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapMiniLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  mapMiniSubtitle: {
    marginTop: 2,
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  routeStops: {
    gap: spacing.sm,
  },
  routeStopRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  routeRail: {
    width: 34,
    alignItems: 'center',
  },
  routeDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  routeDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  routeDotActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  routeLine: {
    flex: 1,
    width: 3,
    marginTop: 4,
    marginBottom: -spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  routeLineDone: {
    backgroundColor: colors.primary,
  },
  routeStopCard: {
    flex: 1,
    minHeight: 68,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeStopCardActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primarySoft,
  },
  routeStopCopy: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  routeStopTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  routeStopSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  routeState: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  routeStateDone: {
    backgroundColor: colors.surfaceMuted,
  },
  routeStateActive: {
    backgroundColor: colors.primary,
  },
  routeStateText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  routeStateTextActive: {
    color: colors.surface,
  },
  coordsCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coordsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coordsTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  coordsValue: {
    marginTop: 8,
    color: colors.primary,
    fontWeight: '700',
  },
  coordsStatus: {
    marginTop: 6,
    color: colors.textMuted,
  },
  mapActionRow: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mapAction: {
    width: '31%',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    // borderWidth: 1,
    // borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    gap: 4,
  },
  mapActionTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  mapActionSubtitle: {
    marginTop: 6,
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  previewSheet: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    //padding: spacing.md,
    // backgroundColor: 'red',
    // backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewTitle: {
    color: colors.text,
    fontWeight: '800',
    fontSize: 18,
  },
  previewSubtitle: {
    marginTop: 6,
    color: colors.textMuted,
    lineHeight: 20,
    maxWidth: 220,
  },
  previewClose: {
    color: colors.primary,
    fontWeight: '700',
  },
  previewMap: {
    marginTop: spacing.md,
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceMuted,
    overflow: 'hidden',
    position: 'relative',
  },
  previewRoadHorizontal: {
    position: 'absolute',
    top: 92,
    left: -20,
    right: -20,
    height: 24,
    backgroundColor: colors.surface,
    transform: [{ rotate: '-10deg' }],
  },
  previewRoadVertical: {
    position: 'absolute',
    top: -10,
    bottom: -10,
    left: 154,
    width: 24,
    //padding: spacing.sm,
    //position: 'absolute',
    backgroundColor: colors.surface,
    transform: [{ rotate: '14deg' }],
  },
  previewRouteLine: {
    position: 'absolute',
    top: 70,
    left: 86,
    width: 126,
    height: 4,
    backgroundColor: colors.primarySoft,
    //position: 'absolute',
    //left: 86,
    //top: 70,
    borderRadius: radius.pill,
    transform: [{ rotate: '36deg' }],
  },
  previewPin: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    //padding: spacing.sm,
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.surface,
  },
  previewCourierPin: {
    top: 48,
    left: 78,
    backgroundColor: colors.primary,
  },
  previewUserPin: {
    bottom: 42,
    right: 74,
    backgroundColor: colors.success,
  },
  previewPinText: {
    color: colors.surface,
    fontWeight: '800',
    fontSize: 12,
  },
  previewCourierLabel: {
    position: 'absolute',
    top: 28,
    left: 118,
    color: colors.text,
    fontWeight: '700',
  },
  previewUserLabel: {
    position: 'absolute',
    bottom: 22,
    right: 118,
    color: colors.text,
    fontWeight: '700',
  },
  previewLegend: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    //bottom:radius.md
    //padding:spacing.sm
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  previewLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  previewLegendCourier: {
    backgroundColor: colors.primary,
  },
  previewLegendUser: {
    backgroundColor: colors.success,
  },
  previewLegendText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  previewButton: {
    marginTop: spacing.md,
  },
  refreshButton: {
    marginTop: spacing.lg,
  },
  timelineCard: {
    marginVertical: spacing.xl,
    padding: spacing.lg,
    //color:'blue'
    //flex-wrap:'row'
    //flex:1
    //margin-right:50
    borderRadius: 30,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timelineTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: spacing.md,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: colors.primary },
  stepBody: { flex: 1 },
  stepTitle: { color: colors.text, fontWeight: '700' },
  stepTime: { marginTop: 4, color: colors.textMuted },
  stepState: {
    borderRadius: radius.pill,
    //paddingVertical:26
    //posistion:'absolute'
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  stepStateDone: {
    backgroundColor: colors.surfaceMuted,
  },
  stepStateText: {
    color: colors.textMuted,
    //tempColors:colors.textMuted
    //padding:90
    fontSize: 12,
    fontWeight: '700',
  },
  stepStateTextDone: {
    color: colors.primary,
  },
  helpSection: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  helpActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  helpButton: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpButtonIcon: { fontSize: 24, marginBottom: spacing.sm },
  helpButtonLabel: { fontSize: 11, fontWeight: '600', color: colors.text, textAlign: 'center' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  statusDisplaySection: { marginBottom: spacing.md },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  statusLabel: { color: colors.text, fontSize: 13, fontWeight: '600' },
  statusBadge: { fontSize: 13, fontWeight: '800', textTransform: 'capitalize' },
  trackLink: { color: colors.primary, fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
})

export default TrackOrderScreen
