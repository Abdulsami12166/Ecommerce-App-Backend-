import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '../context/AppContext';
import { useThemeColors } from '../theme/colors';
import spacing, { radius } from '../theme/spacing';

const OperationBanner = () => {
  const { latestActivity } = useAppStore();
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!latestActivity) {
      return undefined;
    }

    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2200);

    return () => clearTimeout(timer);
  }, [latestActivity]);

  if (!visible || !latestActivity) {
    return null;
  }

  return (
    <View pointerEvents="none" style={styles.container}>
      <Text style={styles.text}>{latestActivity.message}</Text>
    </View>
  );
};

const createStyles = colors => StyleSheet.create({
  container: {
    position: 'absolute',
    top: 58,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    shadowColor: colors.bannerShadow,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  text: {
    color: colors.surface,
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default OperationBanner;
