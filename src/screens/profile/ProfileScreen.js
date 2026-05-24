import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppState,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { launchImageLibrary } from 'react-native-image-picker';
import BottomNav from '../../components/BottomNav';
import CustomButton from '../../components/CustomButton';
import CustomInput from '../../components/CustomInput';
import LogoMark from '../../components/LogoMark';
import { profileMenu } from '../../constants/mockData';
import { useAppStore } from '../../context/AppContext';
import {
  getCurrentLocation,
  getLocationPermissionStatus,
} from '../../services/locationService';
import {
  getNotificationPermissionStatus,
  requestNotificationPermission,
} from '../../services/notificationService';
import { userApi } from '../../services/api';
import { useThemeColors } from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const profileRouteMap = {
  'My Orders': 'Orders',
  'Saved Address': 'Addresses',
  'Payment Methods': 'PaymentMethods',
  'My Wallet': 'Wallet',
  'Invite Friends': 'InviteFriends',
  Support: 'Support',
  'Customer Care': 'CustomerCare',
  'Privacy Policy': 'PrivacyPolicy',
};

const ProfileScreen = ({ navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const {
    themeMode,
    toggleTheme,
    signOut,
    authToken,
    currentUser,
    refreshProfile,
    setCurrentUser,
    wishlistIds,
  } = useAppStore();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
  });
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isProfileComplete = useMemo(() => {
    return Boolean(form.fullName.trim() && form.email.trim() && form.phone.trim());
  }, [form]);

  const syncPermissions = useCallback(async () => {
    const notificationsGranted = await getNotificationPermissionStatus();
    const locationGranted = await getLocationPermissionStatus();
    setNotificationEnabled(notificationsGranted);
    setLocationEnabled(locationGranted);
  }, []);

  const updateField = (key, value) => {
    setForm(current => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    setForm(current => ({
      ...current,
      fullName: currentUser?.name || '',
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
    }));
  }, [currentUser]);

  useFocusEffect(
    React.useCallback(() => {
      syncPermissions();

      if (authToken) {
        refreshProfile().catch(() => {
          // Profile fetch errors are surfaced when the user tries to save/upload.
        });
      }
    }, [authToken, refreshProfile, syncPermissions]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') {
        syncPermissions();
      }
    });

    return () => subscription.remove();
  }, [syncPermissions]);

  const handleLocationAccess = async () => {
    try {
      setLoadingLocation(true);
      const position = await getCurrentLocation();
      const { latitude, longitude } = position.coords;
      setLocationEnabled(true);
      updateField('location', `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
    } catch (error) {
      await syncPermissions();
      Alert.alert(
        'Location unavailable',
        error?.message || 'Unable to fetch current location right now.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleToggleNotifications = async value => {
    if (!value) {
      const alreadyEnabled = await getNotificationPermissionStatus();

      if (alreadyEnabled) {
        Alert.alert(
          'Manage in settings',
          'Notification permission is controlled by your device settings. Open settings to turn it off.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        setNotificationEnabled(true);
        return;
      }

      setNotificationEnabled(false);
      return;
    }

    const alreadyEnabled = await getNotificationPermissionStatus();
    const granted = alreadyEnabled || (await requestNotificationPermission());

    if (!granted) {
      Alert.alert(
        'Permission needed',
        'Notification permission is off. Open app settings and allow notifications.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ],
      );
      await syncPermissions();
      return;
    }

    setNotificationEnabled(true);
  };

  const handleSave = async () => {
    if (!isProfileComplete) {
      Alert.alert('Complete your profile', 'Please fill in your name, email, and phone.');
      return;
    }

    if (!authToken) {
      Alert.alert('Session required', 'Please sign in again to update your profile.');
      return;
    }

    try {
      setSaving(true);
      const response = await userApi.updateProfile(
        {
          name: form.fullName.trim(),
          phone: form.phone.trim(),
        },
        authToken,
      );
      const user = response.data?.data?.user || null;
      setCurrentUser(user);
      setSaving(false);
      Alert.alert('Profile saved', 'Your profile details were updated successfully.');
    } catch (error) {
      setSaving(false);
      Alert.alert(
        'Save failed',
        error?.response?.data?.message || 'Unable to update your profile right now.',
      );
    }
  };

  const handleAvatarUpload = async () => {
    if (!authToken) {
      Alert.alert('Session required', 'Please sign in again to upload your photo.');
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      });

      if (result.didCancel || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('avatar', {
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `avatar-${Date.now()}.jpg`,
      });

      setUploadingAvatar(true);
      const response = await userApi.uploadProfileAvatar(formData, authToken);
      const user = response.data?.data?.user || null;
      setCurrentUser(user);
      Alert.alert('Profile photo updated', 'Your new profile picture is live now.');
    } catch (error) {
      Alert.alert(
        'Upload failed',
        error?.response?.data?.message || 'Unable to upload your profile picture right now.',
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleMenuPress = title => {
    const routeName = profileRouteMap[title];

    if (!routeName) {
      return;
    }

    navigation.navigate(routeName);
  };

  const handleLogout = () => {
    Alert.alert(
      'Log out',
      'You will be redirected to the sign in screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            signOut();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              }),
            );
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          {currentUser?.avatar ? (
            <Image source={{ uri: currentUser.avatar }} style={styles.avatar} />
          ) : (
            <LogoMark size={96} dark={false} />
          )}
          <Text style={styles.name}>{form.fullName}</Text>
          <Text style={styles.email}>{form.email}</Text>

          <CustomButton
            title={uploadingAvatar ? 'Uploading Photo...' : 'Upload Profile Photo'}
            onPress={handleAvatarUpload}
            style={styles.avatarButton}
          />

          <View style={styles.statsRow}>
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{wishlistIds.length}</Text>
              <Text style={styles.statLabel}>Wishlist</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{currentUser?.isVerified ? 'Yes' : 'No'}</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBlock}>
              <Text style={styles.statValue}>{currentUser?.role || 'user'}</Text>
              <Text style={styles.statLabel}>Role</Text>
            </View>
          </View>
        </View>

        <View style={styles.menuCard}>
          <Text style={styles.sectionTitle}>Complete Your Profile</Text>
          <CustomInput
            label="Full Name"
            placeholder="Enter your full name"
            value={form.fullName}
            onChangeText={value => updateField('fullName', value)}
          />
          <CustomInput
            label="Email"
            placeholder="Enter your email"
            value={form.email}
            onChangeText={value => updateField('email', value)}
            editable={false}
          />
          <CustomInput
            label="Phone"
            placeholder="Enter your phone number"
            value={form.phone}
            onChangeText={value => updateField('phone', value)}
          />
          <CustomInput
            label="Current Location"
            placeholder="Tap button below to fetch current location"
            value={form.location}
            onChangeText={value => updateField('location', value)}
          />

          <CustomButton
            title={loadingLocation ? 'Fetching Location...' : 'Use Current Location'}
            onPress={handleLocationAccess}
            variant="secondary"
            style={styles.locationButton}
          />

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Location Access</Text>
            <Text
              style={[
                styles.permissionValue,
                locationEnabled ? styles.permissionOn : styles.permissionOff,
              ]}
            >
              {locationEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Notifications</Text>
              <Text style={styles.toggleSubtitle}>
                Allow order, offer, and wishlist alerts
              </Text>
            </View>
            <Switch
              value={notificationEnabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#D8CCC1', true: '#C8B19B' }}
              thumbColor={notificationEnabled ? colors.primary : colors.surface}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleTextWrap}>
              <Text style={styles.toggleTitle}>Dark Mode</Text>
              <Text style={styles.toggleSubtitle}>
                Switch between light and dark theme for the full app
              </Text>
            </View>
            <Switch
              value={themeMode === 'dark'}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D8CCC1', true: '#6E5748' }}
              thumbColor={themeMode === 'dark' ? colors.primary : colors.surface}
            />
          </View>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Notification Access</Text>
            <Text
              style={[
                styles.permissionValue,
                notificationEnabled ? styles.permissionOn : styles.permissionOff,
              ]}
            >
              {notificationEnabled ? 'Enabled' : 'Disabled'}
            </Text>
          </View>

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Theme Mode</Text>
            <Text style={styles.permissionValue}>
              {themeMode === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </View>

          <View style={styles.completionBadge}>
            <Text style={styles.completionText}>
              {isProfileComplete ? 'Profile synced with backend' : 'Profile incomplete'}
            </Text>
          </View>

          <CustomButton title="Save Profile" onPress={handleSave} loading={saving} />

          {profileMenu.map(item => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuRow}
              onPress={() => handleMenuPress(item.title)}
            >
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuValue}>{item.value}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
            <Text style={styles.logoutTitle}>Log Out</Text>
            <Text style={styles.logoutValue}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <CustomButton
          title="Continue Shopping"
          onPress={() => navigation.navigate('Home')}
          style={styles.shoppingButton}
        />

        <BottomNav active="Profile" navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = colors => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surfaceMuted,
  },
  name: {
    marginTop: spacing.md,
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  email: {
    marginTop: 4,
    color: colors.textMuted,
  },
  avatarButton: {
    marginTop: spacing.md,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    width: '100%',
    justifyContent: 'space-between',
  },
  statBlock: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 4,
    color: colors.textMuted,
  },
  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
  },
  menuCard: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    marginBottom: spacing.lg,
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  locationButton: {
    marginBottom: spacing.md,
  },
  toggleRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleTextWrap: {
    flex: 1,
    paddingRight: spacing.md,
  },
  toggleTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  toggleSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    lineHeight: 20,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  permissionLabel: {
    color: colors.text,
    fontWeight: '700',
  },
  permissionValue: {
    fontWeight: '800',
  },
  permissionOn: {
    color: '#2E7D32',
  },
  permissionOff: {
    color: colors.danger,
  },
  completionBadge: {
    marginBottom: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignSelf: 'flex-start',
  },
  completionText: {
    color: colors.primary,
    fontWeight: '700',
  },
  menuRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuTitle: {
    color: colors.text,
    fontWeight: '600',
  },
  menuValue: {
    color: colors.primary,
    fontWeight: '700',
  },
  logoutRow: {
    marginTop: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E9C7BE',
    backgroundColor: '#FFF3F0',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutTitle: {
    color: colors.danger,
    fontWeight: '800',
  },
  logoutValue: {
    color: colors.danger,
    fontWeight: '700',
  },
  shoppingButton: {
    marginTop: spacing.xl,
  },
});

export default ProfileScreen;
