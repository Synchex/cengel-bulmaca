export const colors = {
  // ── Primary palette ──
  primary: '#5856D6',        // iOS indigo
  primaryLight: '#7A79E0',
  primaryDark: '#3634A3',

  // ── Secondary ──
  secondary: '#5856D6',

  // ── Accent ──
  accent: '#3B82F6',         // System blue accent
  accentDark: '#2563EB',

  // ── Success / Danger / Warning ──
  success: '#34C759',
  successLight: '#E8FAE8',
  successDark: '#248A3D',

  danger: '#DC2626',
  dangerLight: '#FFEDEB',
  dangerDark: '#991B1B',

  warning: '#FF9500',
  warningLight: '#FFF4E5',

  // ── Surfaces ──
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#F7F7F7',
  cardAlt: '#F0F0F0',
  glass: 'rgba(255,255,255,0.95)',

  // ── Text ──
  text: '#000000',
  textSecondary: '#555555',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // ── Borders ──
  border: '#E5E5E5',
  borderLight: '#F0F0F0',

  // ── Misc ──
  overlay: 'rgba(0, 0, 0, 0.4)',
  shimmer: 'rgba(0,0,0,0.02)',
  fill: 'rgba(0,0,0,0.03)',

  // ── Gradients ──
  gradientPrimary: ['#3B82F6', '#2563EB'] as const,
  gradientWarm: ['#FF9500', '#FBBF24'] as const,
  gradientSuccess: ['#30D158', '#34C759'] as const,
  gradientDark: ['#0B1020', '#131A2E'] as const,
  gradientHero: ['#FFFFFF', '#F9FAFB', '#FFFFFF'] as const,
};

export type Colors = typeof colors;
