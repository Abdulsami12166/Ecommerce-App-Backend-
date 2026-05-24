import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../theme/colors';
import spacing, { radius } from '../theme/spacing';

const items = [
  { key: 'Home', label: 'H' },
  { key: 'Wishlist', label: 'W' },
  { key: 'Notifications', label: 'N' },
  { key: 'Profile', label: 'P' },
];

const BottomNav = ({ active, navigation }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);

  return (
    <View style={styles.wrapper}>
      {items.map(item => {
        const isActive = item.key === active;

        return (
          <Pressable
            key={item.key}
            onPress={() => navigation.navigate(item.key)}
            style={[styles.item, isActive && styles.itemActive]}
          >
            <Text style={[styles.icon, isActive && styles.iconActive]}>
              {item.label}
            </Text>
            <Text style={[styles.text, isActive && styles.textActive]}>
              {item.key}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const createStyles = colors => StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  icon: {
    fontSize: 18,
    color: colors.textMuted,
    fontWeight: '800',
  },
  iconActive: {
    color: colors.surface,
  },
  text: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  textActive: {
    color: colors.surface,
  },
});

export default memo(BottomNav);
