/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Brand & Primary
    primary: '#2563EB',          // Modern cobalt / royal blue
    primaryDark: '#1D4ED8',      // Deeper blue for pressed states
    primaryLight: '#EFF6FF',     // Subtle blue background tint
    primaryBorder: '#BFDBFE',    // Light blue border

    // Text
    text: '#0F172A',             // Dark navy / charcoal (accessible contrast)
    textSecondary: '#64748B',    // Readable secondary grey
    textMuted: '#94A3B8',        // Placeholder / helper text

    // Surfaces & Backgrounds
    background: '#F8FAFC',       // Clean cool neutral page background
    surface: '#FFFFFF',          // Clean white surface
    card: '#FFFFFF',             // Card surface
    backgroundElement: '#F1F5F9',// Subtle element background (inputs, chips)
    backgroundSelected: '#E2E8F0',

    // Borders & Dividers
    border: '#E2E8F0',           // Subtle clean border
    borderLight: '#F1F5F9',

    // Semantic Status Colors
    success: '#16A34A',          // Accessible green
    successDark: '#15803D',
    successLight: '#DCFCE7',     // Soft green badge background
    error: '#DC2626',            // Accessible red
    errorDark: '#B91C1C',
    errorLight: '#FEE2E2',       // Soft red badge background
    warning: '#D97706',          // Accessible amber
    warningDark: '#B45309',
    warningLight: '#FEF3C7',     // Soft amber badge background
  },
  dark: {
    // Brand & Primary
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    primaryLight: '#1E293B',
    primaryBorder: '#334155',

    // Text
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',

    // Surfaces & Backgrounds
    background: '#0F172A',
    surface: '#1E293B',
    card: '#1E293B',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',

    // Borders & Dividers
    border: '#334155',
    borderLight: '#1E293B',

    // Semantic Status Colors
    success: '#22C55E',
    successDark: '#16A34A',
    successLight: '#14532D',
    error: '#EF4444',
    errorDark: '#DC2626',
    errorLight: '#7F1D1D',
    warning: '#F59E0B',
    warningDark: '#D97706',
    warningLight: '#78350F',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  // Backwards compatibility with existing code
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;

export const Shadows = {
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  tabBar: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
