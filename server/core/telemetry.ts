// ─────────────────────────────────────────────────────────────────────────────
// server/core/telemetry.ts
// OpenTelemetry Tracing & Metrics Middleware
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';

export interface RouteMetrics {
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
}

const metricBuffer: RouteMetrics[] = [];

export function openTelemetryMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = process.hrtime();
  const traceId = `trace_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  res.setHeader('x-trace-id', traceId);

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationMs = (diff[0] * 1e3 + diff[1] * 1e-6);

    const metric: RouteMetrics = {
      path: req.route?.path || req.path,
      method: req.method,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      timestamp: new Date().toISOString(),
    };

    metricBuffer.push(metric);
    if (metricBuffer.length > 500) {
      metricBuffer.shift();
    }
  });

  next();
}

export function getTelemetryMetrics(): RouteMetrics[] {
  return [...metricBuffer];
}
