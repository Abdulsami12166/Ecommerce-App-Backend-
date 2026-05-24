import React, { useCallback, useEffect, useMemo, useState } from 'react'
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
import BottomNav from '../../components/BottomNav'
import CustomButton from '../../components/CustomButton'
import ScreenHeader from '../../components/ScreenHeader'
import { notifications } from '../../constants/mockData'
import {
  requestNotificationPermission,
  getNotificationPermissionStatus,
} from '../../services/notificationService'
import { useThemeColors } from '../../theme/colors'
import spacing, { radius } from '../../theme/spacing'

const NotificationScreen = ({ navigation }) => {
  const colors = useThemeColors()
  // const temp = setInterval(() => {
  //   console.log('hello')
  // }, 1000);
  const styles = createStyles(colors)
  const [notificationEnabled, setNotificationEnabled] = useState(false)
  const [markedRead,setMarkedRead] = useState(false)

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
//  //if(enabled){
// enable +1 
// }else {
//   map(() => {
//     flag+1
//   }
// }
    if (alreadyEnabled) {
      Alert.alert(
        'Already enabled',
        'Notifications are already allowed for this app. You can manage them in app settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      )
      return
    }

    const granted = alreadyEnabled||(await requestNotificationPermission())

    if (!granted) {
      Alert.alert(
        'Permission needed',
        'Notification access is off. Open app settings and allow notifications.',
        [
          // {text retry the,method cancel}
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      )
      await syncPermission()
      return
    }

    await syncPermission()
    Alert.alert(
      'Notifications enabled',
      'Notification permission is enabled for this app.',
    )
  }

  const grouped = useMemo(() => {
    const today = notifications.slice(0,3)
    const older = notifications.slice(3).length ? notifications.slice(3) : notifications.slice(0,2)
    return { today, older }
  }, [])

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
            <Text style={styles.iconTxt}>{markedRead ? '*' : 'o'}</Text>
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
          title="Notification"
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

        {renderGroup('TODAY',grouped.today)}
        {renderGroup('YESTERDAY',grouped.older)}

        <CustomButton
          title={notificationEnabled ? 'Manage Notification Settings' : 'Enable Notifications'}
          onPress={handleEnableNotifications}
          style={styles.button}
        />

        <BottomNav active="Notifications" navigation={navigation} />
      </ScrollView>
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
})

export default NotificationScreen
