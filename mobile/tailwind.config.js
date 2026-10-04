/** Mirrors the web app's Tailwind usage (v4 names that v3.4 lacks are added here). */
module.exports = {
  content: ['./App.tsx', './screens/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './ui/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      spacing: { 13: '3.25rem', 15: '3.75rem', 17: '4.25rem', 18: '4.5rem', 22: '5.5rem' },
      boxShadow: { xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)', '2xs': '0 1px 1px 0 rgb(0 0 0 / 0.05)' },
      aspectRatio: { '16/9': '16 / 9', '4/3': '4 / 3' },
    },
  },
  safelist: [{ pattern: /^gap-(\d+|\d+\.5)$/ }, 'flex-row'],
  plugins: [],
};
