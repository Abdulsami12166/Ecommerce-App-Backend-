import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AppState,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import BottomNav from '../../components/BottomNav'
import CustomButton from '../../components/CustomButton'
import ScreenHeader from '../../components/ScreenHeader'
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from '../../services/notificationService'
import { useAppStore } from '../../context/AppContext'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const NotificationScreen = ({ navigation }) => {
  const colors = useThemeColors()
  const styles = createStyles(colors)
  const { activityFeed, orders } = useAppStore()
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [markedRead,setMarkedRead] = useState(false)
  const [settingsPrompt, setSettingsPrompt] = useState(null)

  const syncPermission = useCallback(async () => {
    const enabled = await getNotificationPermissionStatus()
    setNotificationEnabled(enabled)
  }, [])

  useFocusEffect(
    useCallback(() => {
      syncPermission()
    }, [syncPermission]),
  )

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        syncPermission()
      }
    })

    return () => subscription.remove()
  }, [syncPermission])

  const handleEnableNotifications = async () => {
    const alreadyEnabled = await getNotificationPermissionStatus()
    if (alreadyEnabled) {
      setSettingsPrompt({
        title: 'Already enabled',
        body: 'Notifications are already allowed for this app. You can manage them in app settings.',
        primaryLabel: 'Open Settings',
        showSettings: true,
      })
      return
    }

    const granted = alreadyEnabled||(await requestNotificationPermission())

    if (!granted) {
      setSettingsPrompt({
        title: 'Permission needed',
        body: 'Notification access is off. Open app settings and allow notifications.',
        primaryLabel: 'Open Settings',
        showSettings: true,
      })
      await syncPermission()
      return
    }

    await syncPermission()
    setSettingsPrompt({
      title: 'Notifications enabled',
      body: 'Notification permission is enabled for this app.',
      primaryLabel: 'Done',
      showSettings: false,
    })
  }

  const closeSettingsPrompt = () => setSettingsPrompt(null)

  const openAppSettings = () => {
    closeSettingsPrompt()
    Linking.openSettings()
  }

  const grouped = useMemo(() => {
    const orderNotifications = orders.map(order => ({
      id: `order-${order.id}`,
      title: order.statusGroup === 'completed' ? 'Order delivered' : 'Order update',
      body: `${order.trackingTitle || order.code || 'Order'} • ${order.eta || order.status || 'Updated'}`,
      timestamp: order.createdAt ? new Date(order.createdAt).getTime() : Date.now(),
    }))

    const activityNotifications = activityFeed.map(item => ({
      id: `activity-${item.id}`,
      title: 'Store activity',
      body: item.message,
      timestamp: item.timestamp || Date.now(),
    }))

    const items = [...orderNotifications, ...activityNotifications]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(item => ({
        ...item,
        time: new Date(item.timestamp).toLocaleString(),
      }))

    return {
      today: items.slice(0, 5),
      older: items.slice(5),
    }
  }, [activityFeed, orders])

  const renderGroup = (label,items) => (
    <View style={styles.groupWrap}>
      <View style={styles.groupHead}>
        <Text style={styles.groupTitle}>{label}</Text>
        <TouchableOpacity onPress={() => setMarkedRead(true)}>
          <Text style={styles.groupAction}>Mark all as read</Text>
        </TouchableOpacity>
      </View>

      {items.map(item => (
        <View key={`${label}-${item.id}`} style={styles.card}>
            <View style={styles.iconWrap}>
              <Text style={styles.iconTxt}>{markedRead ? '✓' : '🔵'}</Text>
            </View>

          <View style={styles.body}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardTime}>{item.time}</Text>
            </View>
            <Text style={styles.cardText}>{item.body}</Text>
          </View>
        </View>
      ))}
    </View>
  )

  return (
   <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Notifications"
          onBack={() => navigation.goBack()}
          rightLabel={notificationEnabled ? 'ON' : 'OFF'}
          onRightPress={handleEnableNotifications}
        />

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Notification Permission</Text>
          <Text
            style={[
              styles.statusValue,
              notificationEnabled ? styles.statusOn : styles.statusOff,
            ]}
          >
            {notificationEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>

        {grouped.today.length ? renderGroup('TODAY',grouped.today) : null}
        {grouped.older.length ? renderGroup('EARLIER',grouped.older) : null}
        {!grouped.today.length && !grouped.older.length ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No live notifications yet</Text>
            <Text style={styles.emptyBody}>Your order updates and store activity will appear here.</Text>
          </View>
        ) : null}

        <CustomButton
          title={notificationEnabled ? 'Manage Notification Settings' : 'Enable Notifications'}
          onPress={handleEnableNotifications}
          style={styles.button}
        />

        <BottomNav active="Notifications" navigation={navigation} />
      </ScrollView>
      <Modal
        transparent
        visible={!!settingsPrompt}
        animationType="fade"
        onRequestClose={closeSettingsPrompt}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>{notificationEnabled ? 'ON' : '!'}</Text>
            </View>
            <Text style={styles.modalTitle}>{settingsPrompt?.title}</Text>
            <Text style={styles.modalBody}>{settingsPrompt?.body}</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalSecondary} onPress={closeSettingsPrompt}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimary}
                onPress={settingsPrompt?.showSettings ? openAppSettings : closeSettingsPrompt}
              >
                <Text style={styles.modalPrimaryText}>{settingsPrompt?.primaryLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  statusCard: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  statusValue: {
    fontWeight: '800',
  },
  statusOn: {
    color: '#2E7D32',
  },
  statusOff: {
    color: colors.danger,
  },
  groupWrap: {
    marginTop: spacing.xl,
  },
  groupHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  groupTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  groupAction: {
    color: colors.accent,
    fontWeight: '700',
  },
  card: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconTxt: {
    color: colors.primary,
    fontWeight: '900',
  },
  body: {
    flex: 1,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    maxWidth: '76%',
  },
  cardText: {
    marginTop: 6,
    color: colors.textMuted,
    lineHeight: 20,
  },
  cardTime: {
    color: colors.textMuted,
    fontWeight: '600',
  },
  button: {
    marginTop: spacing.xl,
  },
  emptyWrap: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  emptyBody: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    padding: spacing.lg,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalIconText: {
    color: colors.primary,
    fontWeight: '900',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  modalBody: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    lineHeight: 21,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalSecondary: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalPrimary: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  modalSecondaryText: {
    color: colors.text,
    fontWeight: '800',
  },
  modalPrimaryText: {
    color: colors.surface,
    fontWeight: '800',
  },
})

export default NotificationScreen
