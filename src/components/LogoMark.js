import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../theme/colors';

const LogoMark = ({ size = 78, dark = true, subtitle }) => {
  const colors = useThemeColors();
  const styles = createStyles(colors);
  const borderRadius = size / 2;
  const textColor = dark ? colors.surface : colors.primary;
  const borderColor = dark ? '#9D7650' : colors.accent;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.mark, { width: size, height: size, borderRadius, borderColor }]}>
        <Text style={[styles.symbol, { color: textColor, fontSize: size * 0.5 }]}>F</Text>
      </View>
      {subtitle ? <Text style={[styles.subtitle, { color: textColor }]}>{subtitle}</Text> : null}
    </View>
  );
};

const createStyles = colors => StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  mark: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  symbol: {
    fontStyle: 'italic',
    fontWeight: '400',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    letterSpacing: 0.6,
  },
});

export default LogoMark;
