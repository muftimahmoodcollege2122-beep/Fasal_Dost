// ─────────────────────────────────────────────────────────────────────────────
// src/utils/theme.js
//
// PURPOSE:
//   Central design system for FasalDost.
//   All colors, spacing, border radius, and shadow values live here.
//   Import from this file instead of hardcoding values in screen files.
//   Changing a value here updates it across the entire app.
//
// DESIGN LANGUAGE:
//   Pakistani earth palette — deep forest green, saffron gold, wheat cream.
//   Inspired by Pakistan's agricultural landscape.
// ─────────────────────────────────────────────────────────────────────────────

/** App color palette */
export const colors = {
  // ── Backgrounds (dark to light) ──────────────────────────────────────────
  forestDeep:    '#061206', // Darkest — main app background
  forestDark:    '#0D2E0D', // Slightly lighter — gradient middle
  forestMid:     '#1A4A1A', // Lighter green — gradient end, card backgrounds

  // ── Accent ───────────────────────────────────────────────────────────────
  gold:          '#F4B942', // Primary accent — buttons, highlights, active states
  goldDark:      '#C8931A', // Darker gold — button gradients, pressed states

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   '#F5EDD6', // Warm off-white — main text
  textSecondary: 'rgba(245,237,214,0.65)', // Dimmed — labels, descriptions
  textMuted:     'rgba(245,237,214,0.35)', // Very dim — placeholders, hints

  // ── Surfaces (semi-transparent overlays) ─────────────────────────────────
  surfaceLight:  'rgba(245,237,214,0.06)', // Cards and input backgrounds
  surfaceMid:    'rgba(245,237,214,0.1)',  // Slightly more visible surfaces

  // ── Borders ──────────────────────────────────────────────────────────────
  border:        'rgba(244,185,66,0.2)',   // Standard border — subtle gold tint
  borderBright:  'rgba(244,185,66,0.4)',   // Highlighted border — active inputs

  // ── Severity colors (for disease risk levels) ─────────────────────────────
  success:       '#4ADE80', // Green — healthy crop or low risk
  warning:       '#FBBF24', // Yellow — medium risk
  danger:        '#F87171', // Red — high risk, urgent action needed
};

/**
 * Spacing scale (in pixels).
 * Use these instead of hardcoded numbers for consistent padding and margins.
 */
export const spacing = {
  xs: 4,   // Tiny gaps between inline elements
  sm: 8,   // Small padding inside compact components
  md: 16,  // Standard padding — most cards and sections use this
  lg: 24,  // Large spacing between sections
  xl: 32,  // Extra large — hero sections, onboarding
};

/**
 * Border radius scale.
 * Controls the roundness of cards, buttons, and inputs.
 */
export const radius = {
  sm:   8,    // Small elements — chips, small badges
  md:   12,   // Inputs, small cards
  lg:   16,   // Standard cards and modals
  xl:   24,   // Hero cards, large containers
  full: 9999, // Fully rounded — pills, circles
};

/**
 * Shadow presets for elevation effects.
 * Use `glow` for primary action buttons and `card` for content cards.
 */
export const shadows = {
  // Gold glow — used on primary CTA buttons
  glow: {
    shadowColor:   '#F4B942',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius:  16,
    elevation:     8,
  },
  // Standard card shadow — used on content cards
  card: {
    shadowColor:   '#000',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius:  20,
    elevation:     12,
  },
};
