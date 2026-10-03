// ─────────────────────────────────────────────────────────────────────────────
// mobile/utils/i18n.ts
// React Native Internationalization for FasalDost
// ─────────────────────────────────────────────────────────────────────────────

export type Language = 'en' | 'ur' | 'zh' | 'hi' | 'es' | 'ar';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'zh', name: 'Mandarin Chinese', native: '中文' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
];

export const isRTL = (lang: Language): boolean => {
  return lang === 'ur' || lang === 'ar';
};
