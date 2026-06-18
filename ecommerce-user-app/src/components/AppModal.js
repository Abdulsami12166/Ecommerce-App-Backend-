import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeColors } from '../theme/colors';
import spacing, { radius } from '../theme/spacing';

/**
 * AppModal — a themed, animated replacement for Alert.alert()
 *
 * Props:
 *   visible       boolean
 *   type          'success' | 'error' | 'warning' | 'info'  (default 'info')
 *   title         string
 *   message       string
 *   buttons       Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>
 *   onDismiss     () => void  — called when backdrop is tapped (optional)
 */
export default function AppModal({
  visible = false,
  type = 'info',
  title = '',
  message = '',
  buttons = [],
  onDismiss,
}) {
  const colors = useThemeColors();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 110,
          friction: 8,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const iconMap = {
    success: { emoji: '✅', color: colors.success },
    error:   { emoji: '❌', color: colors.danger  },
    warning: { emoji: '⚠️', color: colors.star   },
    info:    { emoji: 'ℹ️', color: colors.primary },
  };

  const { emoji, color } = iconMap[type] || iconMap.info;

  const defaultButtons = buttons.length
    ? buttons
    : [{ text: 'OK', onPress: onDismiss }];

  const styles = createStyles(colors);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Animated.View
          style={[
            styles.card,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Top accent bar */}
          <View style={[styles.accentBar, { backgroundColor: color }]} />

          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
            <Text style={styles.iconEmoji}>{emoji}</Text>
          </View>

          {/* Title */}
          {!!title && <Text style={styles.title}>{title}</Text>}

          {/* Message */}
          {!!message && <Text style={styles.message}>{message}</Text>}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Buttons */}
          <View style={[styles.buttonRow, defaultButtons.length > 2 && styles.buttonColumn]}>
            {defaultButtons.map((btn, index) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';
              const isLast = index === defaultButtons.length - 1;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    isLast && !isCancel && styles.buttonPrimary,
                    isDestructive && styles.buttonDestructive,
                    isCancel && styles.buttonCancel,
                    !isLast && defaultButtons.length <= 2 && styles.buttonBorderRight,
                  ]}
                  onPress={() => {
                    btn.onPress?.();
                    if (!btn.onPress) onDismiss?.();
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      isLast && !isCancel && styles.buttonTextPrimary,
                      isDestructive && styles.buttonTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ─── Convenience hook ──────────────────────────────────────────────────────────
// Usage:
//   const { alert, modalProps } = useAppAlert();
//   alert({ type: 'success', title: 'Done!', message: 'Your request was submitted.' });
//   ...
//   <AppModal {...modalProps} />

export function useAppAlert() {
  const [state, setState] = React.useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const dismiss = React.useCallback(() => {
    setState(s => ({ ...s, visible: false }));
  }, []);

  const alert = React.useCallback(({ type = 'info', title = '', message = '', buttons = [] }) => {
    setState({ visible: true, type, title, message, buttons });
  }, []);

  const modalProps = {
    ...state,
    onDismiss: dismiss,
    buttons: state.buttons.map(btn => ({
      ...btn,
      onPress: () => { btn.onPress?.(); dismiss(); },
    })),
  };

  return { alert, modalProps };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const createStyles = colors => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  iconEmoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
  },
  buttonColumn: {
    flexDirection: 'column',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBorderRight: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  buttonPrimary: {
    backgroundColor: colors.primary + '10',
  },
  buttonDestructive: {
    backgroundColor: colors.danger + '10',
  },
  buttonCancel: {
    backgroundColor: 'transparent',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  buttonTextPrimary: {
    color: colors.primary,
    fontWeight: '700',
  },
  buttonTextDestructive: {
    color: colors.danger,
    fontWeight: '700',
  },
});
