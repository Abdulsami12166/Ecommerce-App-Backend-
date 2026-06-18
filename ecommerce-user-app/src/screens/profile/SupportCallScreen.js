import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import ScreenHeader from '../../components/ScreenHeader';
import { useAppStore } from '../../context/AppContext';
import colors from '../../theme/colors';
import spacing, { radius } from '../../theme/spacing';

const SupportCallScreen = ({ navigation, route }) => {
  const { supportChats } = useAppStore();
  const { hasPermission, requestPermission } = useCameraPermission();
  const [muted, setMuted] = useState(false);
  //const [temp , settemp] = useState(0)

  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(route.params?.mode === 'video');
  const [cameraPosition, setCameraPosition] = useState('front');
  const [requestingCamera, setRequestingCamera] = useState(false);
  const chat = useMemo(
    () => supportChats.find(item => item.id === route.params?.chatId) || supportChats[0] || null,
    [route.params?.chatId, supportChats],
  );
  const mode = route.params?.mode === 'video' ? 'video' : 'voice';
  const device = useCameraDevice(cameraPosition);

  useEffect(() => {
    const ensureCameraPermission = async () => {
      if (mode !== 'video' || hasPermission) {
        return;
      }
      setRequestingCamera(true);
      await requestPermission();
      setRequestingCamera(false);
    };
    ensureCameraPermission();
  }, [hasPermission, mode, requestPermission]);

  if (!chat) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cameraStateCard}>
          <Text style={styles.cameraStateText}>No support contact is available for this product yet.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleToggleCamera = async () => {
    if (!hasPermission) {
      setRequestingCamera(true);
      const granted = await requestPermission();
      setRequestingCamera(false);

      if (!granted) {
        return;
      }
    }

    setCameraOn(current => !current);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScreenHeader title={mode === 'video' ? 'Video Call' : 'Voice Call'} onBack={() => navigation.goBack()} />

        <View style={styles.topInfo}>
          <View style={styles.contactInfo}>
            <Text style={styles.name}>{chat.name}</Text>
            <Text style={styles.role}>{chat.role}</Text>
            <Text style={styles.callState}>
              {mode === 'video'
                ? hasPermission
                  ? 'Live camera preview ready'
                  : 'Camera permission needed'
                : 'Voice call in progress'}
            </Text>
          </View>

          <View style={[styles.avatar, { backgroundColor: chat.accent }]}>
            <Text style={styles.avatarText}>{chat.name.charAt(0)}</Text>
          </View>
        </View>

        <View style={styles.previewArea}>
          {mode === 'video' ? (
            <>
              {requestingCamera ? (
                <View style={styles.cameraStateCard}>
                  <ActivityIndicator color={colors.surface} />
                  <Text style={styles.cameraStateText}>Starting camera...</Text>
                </View>
              ) : hasPermission && device && cameraOn ? (
                <>
                  <Camera
                    style={styles.cameraView}
                    device={device}
                    isActive={cameraOn}
                    photo={false}
                    video={false}
                    audio={false}
                  />
                  <View style={styles.mainVideoOverlay} />
                </>
              ) : (
                <View style={styles.cameraStateCard}>
                  <Text style={styles.cameraOffIcon}>C</Text>
                  <Text style={styles.cameraStateText}>
                    {hasPermission ? 'Camera Off' : 'Allow camera access'}
                  </Text>
                </View>
              )}

              <View style={styles.remoteInfo}>
                <Text style={styles.remoteName}>You</Text>
                <Text style={styles.remoteStatus}>
                  {cameraOn && hasPermission && device ? 'Live device camera preview' : 'Video preview paused'}
                </Text>
              </View>

              <View style={styles.selfPreview}>
                <Image
                  source={{
                    uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
                  }}
                  style={styles.selfPreviewImage}
                />
                <View style={styles.selfPreviewOverlay} />
                <View style={styles.selfBadge}>
                  <Text style={styles.selfBadgeText}>{chat.name}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.voiceHero}>
              <View style={[styles.voiceAvatar, { backgroundColor: chat.accent }]}>
                <Text style={styles.voiceAvatarText}>{chat.name.charAt(0)}</Text>
              </View>
              <Text style={styles.voiceTitle}>Voice call in progress</Text>
            </View>
          )}
        </View>



        <View style={styles.secondaryActions}>
          {mode === 'video' ? (
            <TouchableOpacity
              style={styles.secondaryAction}
              onPress={() =>
                setCameraPosition(current => (current === 'front' ? 'back' : 'front'))
              }
            >
              <Text style={styles.secondaryActionIcon}>F</Text>
              <Text style={styles.secondaryActionLabel}>Flip</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            style={styles.secondaryAction}
            onPress={() => navigation.navigate('Support')}
          >
            <Text style={styles.secondaryActionIcon}>L</Text>
            <Text style={styles.secondaryActionLabel}>Chats</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton} onPress={() => setMuted(current => !current)}>
            <Text style={styles.controlIcon}>{muted ? 'U' : 'M'}</Text>
            <Text style={styles.controlLabel}>{muted ? 'Unmute' : 'Mute'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => {
              if (mode === 'video') {
                handleToggleCamera();
                return;
              }

              setSpeakerOn(current => !current);
            }}
          >
            <Text style={styles.controlIcon}>
              {mode === 'video' ? (cameraOn ? 'C' : 'O') : (speakerOn ? 'S' : 'E')}
            </Text>
            <Text style={styles.controlLabel}>
              {mode === 'video'
                ? cameraOn
                  ? 'Camera On'
                  : 'Camera Off'
                : speakerOn
                  ? 'Speaker'
                  : 'Earpiece'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.controlIcon, styles.endCallText]}>X</Text>
            <Text style={[styles.controlLabel, styles.endCallText]}>End</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#110C09',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  topInfo: {
    marginTop: spacing.xl,
    flexDirection: 'row',
    // backgroundColor: 'red',` 
    // padding: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    flex: 1,
    paddingRight: spacing.md,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    // backgroundColor: 'red',
    // backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.surface,
    fontSize: 28,
    fontWeight: '800',
  },
  name: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '800',
  },
  role: {
    marginTop: 6,
    color: '#DCC7B5',
    fontWeight: '700',
  },
  callState: {
    marginTop: spacing.sm,
    color: '#F1E2D5',
  },
  previewArea: {
    flex: 1,
    marginTop: spacing.xl,
    borderRadius: 34,
    overflow: 'hidden',
    //flexDirection: 'row',
    // backgroundColor: 'red',
    backgroundColor: '#2B1D15',
    justifyContent: 'center',
  },
  mainVideoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17, 12, 9, 0.18)',
  },
  remoteInfo: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.lg,
  },
  remoteName: {
    color: colors.surface,
    fontSize: 26,
    //fontWeight: '800',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    fontWeight: '800',
  },
  remoteStatus: {
    marginTop: 6,
    color: '#F1E2D5',
    fontWeight: '700',
  },
  selfPreview: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.lg,
    width: 128,
    height: 176,
    borderRadius: 26,
    // backgroundColor: 'red',
    // backgroundColor: colors.primary,
    overflow: 'hidden',
    backgroundColor: '#201611',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  cameraView: {
    width: '100%',
    height: '100%',
  },
  selfPreviewImage: {
    width: '100%',
    height: '100%',
  },
  selfPreviewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,12,9,0.16)',
  },
  selfBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    borderRadius: radius.pill,
    //textAlign: 'center',
    // backgroundColor: 'red',
    // backgroundColor: colors.primary,
    backgroundColor: 'rgba(17,12,9,0.72)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  selfBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: '800',
  },
  cameraStateCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'red',
    // padding: spacing.sm,
    padding: spacing.md,
    backgroundColor: '#201611',
  },
  cameraOffIcon: {
    color: colors.surface,
    fontSize: 24,
    fontWeight: '800',
  },
  cameraStateText: {
    marginTop: spacing.sm,
    color: '#F1E2D5',
    fontWeight: '700',
    textAlign: 'center',
  },
  voiceHero: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceAvatarText: {
    color: colors.surface,
    // backgroundColor: 'red',
    // backgroundColor: colors.primary,
    fontSize: 40,
    fontWeight: '800',
  },
  voiceTitle: {
    marginTop: spacing.lg,
    color: colors.surface,
    fontSize: 24,
    fontWeight: '800',
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.lg,
  },
  secondaryAction: {
    minWidth: 82,
    marginLeft: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    // backgroundColor: 'red',
    // backgroundColor: colors.primary,
    // backgroundColor: '#201611',
    //flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  secondaryActionIcon: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryActionLabel: {
    marginTop: 6,
    color: '#F1E2D5',
    fontWeight: '700',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  controlButton: {
    width: '31%',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFF8F2',
    alignItems: 'center',
  },
  controlIcon: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  controlLabel: {
    marginTop: 8,
    color: colors.text,
    fontWeight: '700',
    //flexDirection: 'row',
    // backgroundColor: 'red',
    //marginTop: spacing.sm,
    textAlign: 'center',
  },
  endCallButton: {
    backgroundColor: colors.danger,
  },
  endCallText: {
    color: colors.surface,
  },
});

export default SupportCallScreen;
