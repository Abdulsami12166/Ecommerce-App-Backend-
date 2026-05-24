import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const aliasMap = {
  'trash-outline': 'trash',
  'cash-outline': 'cash',
  'wallet-outline': 'wallet',
  'card-outline': 'card',
  'logo-paypal': 'paypal',
  'logo-apple': 'apple',
  'logo-google': 'google',
  'chevron-back': 'back',
  'chevron-forward': 'forward',
  refresh: 'refresh',
  'radio-button-on': 'radioOn',
  'radio-button-off': 'radioOff',
  checkmark: 'check',
  eye: 'eye',
  'eye-outline': 'eye',
  'eye-off': 'eyeOff',
  'eye-off-outline': 'eyeOff',
};

const textGlyphs = {
  back: '<',
  forward: '>',
  more: '...',
  refresh: 'R',
  check: 'OK',
  eye: 'SHOW',
  eyeOff: 'HIDE',
  trash: 'DEL',
  cash: '$',
  wallet: 'W',
  card: 'CARD',
  paypal: 'P',
  apple: 'A',
  google: 'G',
  qr: 'QR',
  bicycle: 'BIKE',
  home: 'HOME',
};

const resolveIconKey = icon => aliasMap[icon] || icon || 'card';

const AppIcon = ({ icon, size = 20, color = '#1F140F', style }) => {
  const resolvedKey = resolveIconKey(icon);

  if (resolvedKey === 'radioOn' || resolvedKey === 'radioOff') {
    const outerSize = Math.max(size, 18);
    const innerSize = Math.max(Math.round(outerSize * 0.48), 8);

    return (
      <View
        style={[
          styles.radioOuter,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderColor: color,
          },
          style,
        ]}
      >
        {resolvedKey === 'radioOn' ? (
          <View
            style={{
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: color,
            }}
          />
        ) : null}
      </View>
    );
  }

  if (resolvedKey === 'chip') {
    const chipWidth = Math.max(Math.round(size * 1.25), 24);
    const chipHeight = Math.max(Math.round(size * 0.9), 18);

    return (
      <View
        style={[
          styles.chip,
          {
            width: chipWidth,
            height: chipHeight,
            borderColor: color,
          },
          style,
        ]}
      >
        <View style={[styles.chipLine, { backgroundColor: color }]} />
        <View style={[styles.chipLine, { backgroundColor: color }]} />
      </View>
    );
  }

  const glyph = textGlyphs[resolvedKey] || textGlyphs.card;

  return (
    <Text
      numberOfLines={1}
      adjustsFontSizeToFit
      style={[
        styles.glyph,
        {
          color,
          fontSize: getFontSize(resolvedKey, size),
          minWidth: getMinWidth(resolvedKey, size),
        },
        style,
      ]}
    >
      {glyph}
    </Text>
  );
};

const getFontSize = (icon, size) => {
  if (icon === 'more') {
    return Math.max(size - 4, 12);
  }

  if (['check', 'eye', 'eyeOff', 'trash', 'card', 'qr', 'home', 'bicycle'].includes(icon)) {
    return Math.max(Math.round(size * 0.55), 10);
  }

  if (['paypal', 'apple', 'google', 'cash', 'wallet'].includes(icon)) {
    return Math.max(Math.round(size * 0.75), 12);
  }

  return size;
};

const getMinWidth = (icon, size) => {
  if (['eye', 'eyeOff', 'card', 'trash', 'check', 'qr', 'home', 'bicycle'].includes(icon)) {
    return Math.max(size * 1.6, 24);
  }

  if (icon === 'more') {
    return Math.max(size * 1.2, 18);
  }

  return size;
};

const styles = StyleSheet.create({
  glyph: {
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  radioOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  chip: {
    borderWidth: 1.5,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingVertical: 2,
  },
  chipLine: {
    width: '58%',
    height: 2,
    borderRadius: 999,
  },
});

export default AppIcon;
