// ─────────────────────────────────────────────────────────────────────────────
// server/modules/diagnostics/diagnostics.controller.ts
// Request handlers for crop disease diagnostics
// ─────────────────────────────────────────────────────────────────────────────

import { Response, NextFunction } from 'express';
import { diagnosticsService } from './diagnostics.service';
import { sendResponse } from '../../core/middleware';
import { AuthRequest } from '../../core/auth';

function getParam(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] || '';
  return param || '';
}

export class DiagnosticsController {
  public async scan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageBase64, cropName, province, district, apiKey, openRouterApiKey, openRouterModel } = req.body;
      const customApiKey = (req.headers['x-gemini-api-key'] as string) || apiKey || undefined;
      const customOpenRouterKey =
        (req.headers['x-openrouter-api-key'] as string) || openRouterApiKey || undefined;
      const customOpenRouterModel =
        (req.headers['x-openrouter-model'] as string) || openRouterModel || undefined;
      const userId = req.user?.uid || (req.headers['x-user-uid'] as string) || undefined;

      const result = await diagnosticsService.analyzeAndRecordCrop({
        imageBase64,
        cropName,
        userId,
        province,
        district,
        apiKey: customApiKey,
        openRouterApiKey: customOpenRouterKey,
        openRouterModel: customOpenRouterModel,
      });

      sendResponse(res, result, 200, {
        crop: result.crop_detected_en,
        scanCode: result.scanCode,
        rejectionCode: result.rejection_code,
        provider: result.ai_provider,
        model: result.ai_model,
      });
    } catch (error) {
      next(error);
    }
  }

  public async getScanByCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const scanCode = getParam(req.params.scanCode);
      const userId = req.user?.uid || (req.headers['x-user-uid'] as string) || undefined;
      const scan = await diagnosticsService.getScanByCode(scanCode, userId);
      if (!scan) {
        res.status(404).json({ success: false, error: { message: 'Scan not found', code: 'NOT_FOUND' } });
        return;
      }
      sendResponse(res, scan, 200);
    } catch (error) {
      next(error);
    }
  }

  public async getHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid || (req.headers['x-user-uid'] as string) || 'guest';
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const history = await diagnosticsService.getScanHistory(userId, limit);
      sendResponse(res, history, 200, { count: history.length });
    } catch (error) {
      next(error);
    }
  }

  public async deleteScan(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const scanCode = getParam(req.params.scanCode);
      const userId = req.user?.uid || (req.headers['x-user-uid'] as string) || undefined;
      await diagnosticsService.deleteScan(scanCode, userId);
      sendResponse(res, { deleted: true, scanCode });
    } catch (error) {
      next(error);
    }
  }

  public async clearHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.uid || (req.headers['x-user-uid'] as string) || 'guest';
      await diagnosticsService.clearHistory(userId);
      sendResponse(res, { cleared: true });
    } catch (error) {
      next(error);
    }
  }

  public async getSupportedCrops(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const crops = await diagnosticsService.getSupportedCrops();
      sendResponse(res, { crops, count: crops.length });
    } catch (error) {
      next(error);
    }
  }
}

export const diagnosticsController = new DiagnosticsController();
