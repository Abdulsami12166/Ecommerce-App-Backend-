import { useMemo } from 'react';
import { useAppStore } from '../context/AppContext';

export const lightColors = {
  background: '#F8F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#F2EAE1',
  //flashy colors
  primary: '#5A2B12',
  primarySoft: '#8A5A3B',
  accent: '#C89A67',
  text: '#1F140F',
  textMuted: '#8E7C70',
  border: '#E8DDD2',
  //textMuted: '#8E7C70',
  //flashy colors
  // success: '#8D6B3F',
  // danger: '#D26656',
  // star: '#E2A748',
  success: '#8D6B3F',
  danger: '#D26656',
  star: '#E2A748',
  overlay: 'rgba(31, 20, 15, 0.08)',
  statusBar: '#FFFFFF',
  statusBarStyle: 'dark-content',
  cardShadow: '#000000',
  bannerShadow: '#000000',
};

export const darkColors = {
  background: '#130E0B',
  surface: '#211813',
  surfaceMuted: '#32251E',
  primary: '#E1B07C',
  primarySoft: '#C39265',
  accent: '#F0C79B',
  text: '#F8EFE7',
  //flashy colors
  // primary: '#E1B07C',
  textMuted: '#C4AFA0',
  border: '#433129',
  // textMuted: '#C4AFA0',
  success: '#8BCF9A',
  danger: '#FF9E8E',
  star: '#F4C45A',
  overlay: 'rgba(248, 239, 231, 0.08)',
  statusBar: '#130E0B',
  // statusBarStyle: 'light-content',
  statusBarStyle: 'light-content',
  cardShadow: '#000000',
  bannerShadow: '#000000',
};

export const themePalettes = {
  light: lightColors,
  dark: darkColors,
};

export const useThemeColors = () => {
  const { themeMode } = useAppStore();

  return useMemo(() => themePalettes[themeMode] || lightColors, [themeMode]);
};

export default lightColors;
