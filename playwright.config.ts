import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 390, height: 844 }, // iPhone 14 / Mobile Viewport
  },
});
