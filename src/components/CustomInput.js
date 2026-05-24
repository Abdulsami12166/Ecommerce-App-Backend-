import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AppIcon from './AppIcon';
import { useThemeColors } from '../theme/colors';
import spacing, { radius } from '../theme/spacing';

const CustomInput = ({
  label,
  placeholder,
  secureTextEntry,
  value,
  onChangeText,
  editable = true,
  ...rest
}) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const [isSecureHidden, setIsSecureHidden] = useState(Boolean(secureTextEntry));
  const resolvedSecureTextEntry = useMemo(
    () => (secureTextEntry ? isSecureHidden : false),
    [isSecureHidden, secureTextEntry],
  );

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={resolvedSecureTextEntry}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          style={[styles.input, secureTextEntry && styles.inputWithAction]}
          {...rest}
        />
        {secureTextEntry ? (
          <Pressable
            onPress={() => setIsSecureHidden(current => !current)}
            style={styles.eyeButton}
            hitSlop={8}
          >
            <AppIcon
              icon={isSecureHidden ? 'eye' : 'eyeOff'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const createStyles = colors => StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    marginBottom: spacing.xs,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    minHeight: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    color: colors.text,
  },
  inputWithAction: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    height: 54,
    justifyContent: 'center',
  },
});

export default CustomInput;
