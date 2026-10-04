// ─────────────────────────────────────────────────────────────────────────────
// server.ts
// Root entry point for FasalDost Modular Monolith
// Full-stack Express server with Vite middleware in development
// ─────────────────────────────────────────────────────────────────────────────

import dotenv from 'dotenv';
dotenv.config({ override: true });
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import qrcode from 'qrcode-terminal';
import { createApp } from './server/app';
import { config } from './server/core/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = createApp();

  if (config.isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          // Update-detection files must never be cached, or clients can't see new deploys.
          if (/(sw\.js|version\.json|manifest\.webmanifest|index\.html)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'no-store, must-revalidate');
          } else if (filePath.includes(`${path.sep}assets${path.sep}`)) {
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          }
        },
      })
    );
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(config.port, '0.0.0.0', () => {
    const rawHost = 'ais-dev-hexsq6a75nx3v7mukdbtq4-171051146732.asia-southeast1.run.app';
    const expoUrl = `exp://${rawHost}`;
    const webUrl = `https://${rawHost}`;

    console.log(`[FasalDost Monolith] Operational on port ${config.port} (${config.nodeEnv})`);
    console.log(`\n======================================================`);
    console.log(` EXPO GO MOBILE APP QR CODE:`);
    console.log(` Scan this inside your Expo Go mobile app:`);
    console.log(` Protocol URL: ${expoUrl}`);
    console.log(` Web URL:     ${webUrl}`);
    console.log(` Manifest:    ${webUrl}/manifest`);
    console.log(`======================================================\n`);
    qrcode.generate(expoUrl, { small: true }, (qr) => {
      console.log(qr);
      console.log(`\n[Scan with Expo Go mobile app camera to load FasalDost]\n`);
    });
  });
}

startServer().catch((err) => {
  console.error('[FasalDost Monolith] Failed to bootstrap server:', err);
  process.exit(1);
});
