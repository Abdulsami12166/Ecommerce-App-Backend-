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
import { orders as initialOrders } from '../../constants/mockData'
import { useAppStore } from '../../context/AppContext'
import { getCurrentLocation, getLocationPermissionStatus } from '../../services/locationService'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const TrackOrderScreen = ({ navigation, route }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const { orders } = useAppStore()
  //useslcae sharedValue(0)
  const currentOwnerChatId = 'support-sophia'
  const activeOrder = orders.find(order => order.id === route.params?.orderId) || initialOrders[0]
  const orderTimeline = React.useMemo(() => {
    const status = activeOrder?.orderStatus || activeOrder?.status?.toLowerCase() || 'processing'

    return [
      { id: 'step-1', title: 'Order placed', time: 'Created', done: true },
      { id: 'step-2', title: 'Payment confirmed', time: activeOrder?.paymentStatus || 'Paid', done: ['paid', 'processing', 'shipped', 'delivered'].includes(status) },
      { id: 'step-3', title: 'Preparing shipment', time: status, done: ['processing', 'shipped', 'delivered'].includes(status) },
      { id: 'step-4', title: 'Delivered', time: activeOrder?.updatedAt ? 'Updated' : 'Pending', done: status === 'delivered' },
    ]
  }, [activeOrder])
  const [locationLabel, setLocationLabel] = useState('Enable location to view the courier map')
  const [locationGranted, setLocationGranted] = useState(false)
  const [trackingCoords, setTrackingCoords] = useState(null)
  const [refreshingLocation, setRefreshingLocation] = useState(false)
  const [showMapPreview, setShowMapPreview] = useState(false)
  // const temp = setInterval(() => {
  //   console.log('hello')
  // }, 1000);
  //const [temp , settemp] = useState(0)

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
            <Text style={styles.mapMiniLabel}>live route</Text>
            <View style={styles.mapRouteLine} />
            <View style={[styles.mapPoint, styles.mapPointTop]} />
            <View style={[styles.mapPoint, styles.mapPointMiddle]} />
            {/* //map(() => {
              // flag+1
            //}) */}
            <View style={[styles.mapPoint, styles.mapPointBottom]} />
            <Text style={styles.mapPointLabelTop}>Warehouse</Text>

            <Text style={styles.mapPointLabelMiddle}>City hub</Text>
            <Text style={styles.mapPointLabelBottom}>Your address</Text>
          </View>

          <View style={styles.coordsCard}>
            <Text style={styles.coordsTitle}>Live courier location</Text>
            <Text style={styles.coordsValue}>{locationLabel}</Text>
            <Text style={styles.coordsStatus}>
              {locationGranted ? 'Location permission active' : 'Location permission needed'}
            </Text>
          </View>

          <View style={styles.mapActionRow}>
            <TouchableOpacity style={styles.mapAction} onPress={handleToggleMapPreview}>
              <Text style={styles.mapActionTitle}>Map</Text>
              <Text style={styles.mapActionSubtitle}>
                {showMapPreview ? 'Hide preview' : 'Show preview'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapAction}
              onPress={() => Linking.openURL('tel:+9118002109988')}
            >
              <Text style={styles.mapActionTitle}>Call</Text>
              <Text style={styles.mapActionSubtitle}>Courier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mapAction}
              onPress={() => navigation.navigate('SupportChat', { chatId: currentOwnerChatId })}
            >
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
              <View style={[styles.stepDot, step.done && styles.stepDotDone]} />
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

        <CustomButton title="View Orders" onPress={() => navigation.replace('Orders')} />
      </ScrollView>
    </SafeAreaView>
  )
}

const createStyles = colors => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
    backgroundColor: '#F2E6DA',
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
    height: 180,
    borderRadius: radius.lg,
    //marginHorizontal: spacing.lg,
    // backgroundColor: 'red',
    backgroundColor: '#F5EEE6',
    position: 'relative',
  },
  mapMiniLabel: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    color: colors.primary,
    fontWeight: '700',
  },
  mapRouteLine: {
    position: 'absolute',
    left: 34,
    top: 30,
    bottom: 30,
    width: 4,
    borderRadius: radius.pill,
    backgroundColor: '#D1B69C',
  },
  mapPoint: {
    position: 'absolute',
    left: 26,
    width: 20,
    height: 20,
    borderRadius: 10,
    /// backgroundColor: 'red',
    // backgroundColor: colors.primary,
    //flexDirection: 'row',
    //alignItems: 'center',
    backgroundColor: colors.primary,
    borderWidth: 4,
    borderColor: colors.surface,
  },
  mapPointTop: {
    top: 26,
  },
  mapPointMiddle: {
    top: 80,
  },
  mapPointBottom: {
    top: 134,
  },
  mapPointLabelTop: {
    position: 'absolute',
    left: 64,
    top: 28,
    color: colors.text,
    fontWeight: '700',
  },
  mapPointLabelMiddle: {
    position: 'absolute',
    left: 64,
    top: 82,
    color: colors.text,
    fontWeight: '700',
  },
  mapPointLabelBottom: {
    position: 'absolute',
    left: 64,
    top: 136,
    color: colors.text,
    fontWeight: '700',
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
    backgroundColor: '#F7F1EB',
    alignItems: 'center',
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
    backgroundColor: '#EEE3D8',
    overflow: 'hidden',
    position: 'relative',
  },
  previewRoadHorizontal: {
    position: 'absolute',
    top: 92,
    left: -20,
    right: -20,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.45)',
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
    backgroundColor: 'rgba(255,255,255,0.45)',
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
    backgroundColor: 'rgba(255,255,255,0.86)',
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
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing.md,
    backgroundColor: '#D8CCC1',
  },
  stepDotDone: { backgroundColor: colors.primary },
  stepBody: { flex: 1 },
  stepTitle: { color: colors.text, fontWeight: '700' },
  stepTime: { marginTop: 4, color: colors.textMuted },
  stepState: {
    borderRadius: radius.pill,
    //paddingVertical:26
    //posistion:'absolute'
    backgroundColor: '#ECE2D9',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  stepStateDone: {
    backgroundColor: '#F0E5D9',
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
})

export default TrackOrderScreen
