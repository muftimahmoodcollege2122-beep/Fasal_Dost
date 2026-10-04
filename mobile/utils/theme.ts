// ─────────────────────────────────────────────────────────────────────────────
// src/utils/theme.ts
// Central design tokens for FasalDost
// ─────────────────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  background:    '#F8FAFC',
  cardBg:        '#FFFFFF',
  surfaceSubtle: '#F1F5F9',

  // Primary Action & Accent
  primary:       '#0F172A', // Slate 900
  primaryHover:  '#1E293B', // Slate 800
  accent:        '#2563EB', // Professional blue
  accentSubtle:  'rgba(37, 99, 235, 0.08)',

  // Text
  textPrimary:   '#0F172A',
  textSecondary: '#475569',
  textMuted:     '#94A3B8',

  // Surfaces
  surfaceLight:  '#FFFFFF',
  surfaceMid:    '#F8FAFC',

  // Borders
  border:        '#E2E8F0',
  borderBright:  '#CBD5E1',

  // Severity & Status
  success:       '#0F172A', // Slate 900
  warning:       '#D97706', // Amber 600
  danger:        '#DC2626', // Red 600
  white:         '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  full: 9999,
};
