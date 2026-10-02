// ─────────────────────────────────────────────────────────────────────────────
// server/core/middleware.ts
// Request logging, error handling, and response helpers
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AppError } from './types';

// Standard response helper
export const sendResponse = <T>(res: Response, data: T, statusCode = 200, meta?: any): void => {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  res.status(statusCode).json(payload);
};

// Global error handling middleware
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const errorCode = err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred';

  console.error(`[ModularServer Error] [${errorCode}]`, err);

  const payload: ApiResponse = {
    success: false,
    error: {
      code: errorCode,
      message,
      details: err.details || undefined,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  res.status(statusCode).json(payload);
};
