// ─────────────────────────────────────────────────────────────────────────────
// server/core/config.ts
// Environment and core application configuration
// ─────────────────────────────────────────────────────────────────────────────

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  isDev: boolean;
  geminiApiKey: string;
  openRouterApiKey: string;
  openRouterModel: string;
  maxUploadSize: string;
}

export const config: ServerConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') !== 'production',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '',
  openRouterApiKey: process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '',
  openRouterModel: process.env.OPENROUTER_MODEL || 'google/gemini-2.5-pro',
  maxUploadSize: '50mb',
};
