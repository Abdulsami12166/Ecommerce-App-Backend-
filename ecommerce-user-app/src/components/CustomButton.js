import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useThemeColors } from '../theme/colors';
import spacing, { radius } from '../theme/spacing';

const CustomButton = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  style,
}) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const isSecondary = variant === 'secondary';

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.button,
        isSecondary ? styles.secondaryButton : styles.primaryButton,
        style,
      ]}
    >
      {/* loading state of button */}
      {loading ? (
        <ActivityIndicator color={isSecondary ? colors.primary : colors.surface} />
      ) : (
        <Text
          style={[
            styles.text,
            isSecondary ? styles.secondaryText : styles.primaryText,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
};

const createStyles = colors => StyleSheet.create({
  button: {
    minHeight: 56,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.surface,
  },
  secondaryText: {
    color: colors.primary,
  },
});

export default CustomButton;
