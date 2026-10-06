// ─────────────────────────────────────────────────────────────────────────────
// server/app.ts
// Express Modular Monolith application bootstrap with PostgreSQL & Shared Auth
// ─────────────────────────────────────────────────────────────────────────────

import express, { Express } from 'express';
import cors from 'cors';
import path from 'path';
import { errorHandler } from './core/middleware';
import { authRouter } from './modules/auth';
import { diagnosticsRouter } from './modules/diagnostics';
import { marketplaceRouter } from './modules/marketplace';
import { farmerRouter } from './modules/farmers';
import { advisoryRouter } from './modules/advisory';
import { storageRouter } from './modules/storage/storage.routes';
import { searchRouter } from './modules/search/search.routes';
import { subscriptionsRouter } from './modules/subscriptions/subscriptions.routes';
import { openTelemetryMiddleware, getTelemetryMetrics } from './core/telemetry';
import { sentry } from './core/sentry';
import { openApiSpecification } from './core/openapi';
import { sendResponse } from './core/middleware';

export function createApp(): Express {
  const app = express();

  // Core Global Middlewares
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(openTelemetryMiddleware);

  // Static serving for S3-compatible media uploads & Expo assets
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));
  app.use('/assets', express.static(path.join(process.cwd(), 'assets')));

  // Expo Go Mobile Manifest Handler
  const serveExpoManifest = (req: express.Request, res: express.Response) => {
    const publicHost = 'ais-dev-hexsq6a75nx3v7mukdbtq4-171051146732.asia-southeast1.run.app';
    const baseUrl = `https://${publicHost}`;
    const rawSdk =
      (req.headers['exponent-sdk-version'] as string) ||
      (req.headers['expo-sdk-version'] as string) ||
      '52.0.0';
    const sdkVersion = rawSdk.trim();

    const manifest = {
      name: 'FasalDost',
      description: 'FasalDost Agricultural Intelligence',
      slug: 'fasaldost',
      version: '2.0.0',
      orientation: 'portrait',
      primaryColor: '#0f172a',
      iconUrl: `${baseUrl}/assets/icon.png`,
      hostUri: publicHost,
      splash: {
        image: `${baseUrl}/assets/splash.png`,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
      android: {
        package: 'pk.fasaldost.app',
        adaptiveIcon: {
          foregroundImage: `${baseUrl}/assets/adaptive-icon.png`,
          backgroundColor: '#ffffff',
        },
      },
      ios: {
        bundleIdentifier: 'pk.fasaldost.app',
        supportsTablet: true,
      },
      sdkVersion: sdkVersion,
      bundleUrl: `${baseUrl}/mobile/index.bundle`,
      debuggerHost: publicHost,
      mainModuleName: 'App',
      extra: {
        expoClient: {
          name: 'FasalDost',
          slug: 'fasaldost',
          version: '2.0.0',
          orientation: 'portrait',
          icon: './assets/icon.png',
        },
      },
    };

    res.setHeader('expo-protocol-version', '0');
    res.setHeader('expo-sfv-version', '0');
    res.setHeader('content-type', 'application/expo+json');
    res.json(manifest);
  };

  // Explicit Expo endpoints
  app.get(['/manifest', '/.expo/manifest', '/api/expo/manifest'], serveExpoManifest);

  // Serve compiled Expo React Native bundle
  app.get(['/mobile/index.bundle', '/mobile-bundle.js'], (_req, res) => {
    const bundlePath = path.join(process.cwd(), 'public', 'mobile-bundle.js');
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(bundlePath);
  });

  // Intercept root if requested by Expo Go mobile app
  app.use((req, res, next) => {
    const isExpo =
      req.path === '/' &&
      (req.headers['expo-platform'] ||
        req.headers['exponent-sdk-version'] ||
        req.headers['expo-sdk-version'] ||
        (req.headers['accept'] && req.headers['accept'].includes('application/expo+json')));

    if (isExpo) {
      return serveExpoManifest(req, res);
    }
    next();
  });

  // API Health Check & Monolith Service Directory
  app.get('/api/health', (_req, res) => {
    sendResponse(res, {
      status: 'healthy',
      service: 'FasalDost Modular Monolith',
      version: '2.0.0',
      database: 'PostgreSQL (Cloud SQL / Prisma / Drizzle)',
      cache: 'Redis + BullMQ',
      search: 'Dedicated Inverted Index Full-Text Engine',
      telemetry: 'OpenTelemetry + Sentry',
      contract: 'REST + OpenAPI 3.1.0',
      modules: ['auth', 'diagnostics', 'marketplace', 'farmers', 'advisory', 'storage', 'search'],
      timestamp: new Date().toISOString(),
    });
  });

  // OpenAPI 3.1 Specification Endpoints
  app.get('/api/docs/openapi.json', (_req, res) => {
    res.json(openApiSpecification);
  });

  app.get('/api/docs', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
  <title>FasalDost API Docs (OpenAPI 3.1)</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <style>body { margin: 0; background: #fafafa; font-family: sans-serif; }</style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/docs/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [SwaggerUIBundle.presets.apis]
    });
  </script>
</body>
</html>`);
  });

  // Telemetry & Tracing Metrics
  app.get('/api/telemetry/metrics', (_req, res) => {
    sendResponse(res, { metrics: getTelemetryMetrics() });
  });

  app.get('/api/telemetry/errors', (_req, res) => {
    sendResponse(res, { errors: sentry.getEvents() });
  });

  // Mount Modular Domain Routers with Defined Contracts
  app.use('/api/auth', authRouter);
  app.use('/api/diagnostics', diagnosticsRouter);
  app.use('/api/marketplace', marketplaceRouter);
  app.use('/api/farmers', farmerRouter);
  app.use('/api/advisory', advisoryRouter);
  app.use('/api/storage', storageRouter);
  app.use('/api/search', searchRouter);
  app.use('/api/subscriptions', subscriptionsRouter);

  // Global Error Handler Middleware
  app.use(errorHandler);

  return app;
}
