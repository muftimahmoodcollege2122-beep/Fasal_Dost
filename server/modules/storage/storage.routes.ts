// ─────────────────────────────────────────────────────────────────────────────
// server/modules/storage/storage.routes.ts
// API routes for uploading seller verification documents and listing media
// ─────────────────────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { storageService } from './storage.service';
import { sendResponse } from '../../core/middleware';
import { AppError } from '../../core/types';

export const storageRouter = Router();

storageRouter.post('/upload', async (req: Request, res: Response) => {
  const { folder = 'general', fileData, originalName } = req.body;

  if (!fileData) {
    throw new AppError('File data (base64 string) is required for upload', 400, 'VALIDATION_ERROR');
  }

  // Sanitize folder path
  const sanitizedFolder = folder.replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\.\./g, '');
  const result = await storageService.uploadMedia(sanitizedFolder, fileData, originalName);

  sendResponse(res, result, 201);
});
