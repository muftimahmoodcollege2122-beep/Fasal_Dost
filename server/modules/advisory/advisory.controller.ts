// ─────────────────────────────────────────────────────────────────────────────
// server/modules/advisory/advisory.controller.ts
// Request handlers for agronomic intelligence
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response, NextFunction } from 'express';
import { advisoryService } from './advisory.service';
import { sendResponse } from '../../core/middleware';

export class AdvisoryController {
  public async getMandiRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const crop = req.query.crop as string;
      const province = req.query.province as string;
      const rates = await advisoryService.getMandiRates(crop, province);
      sendResponse(res, rates, 200, { count: rates.length });
    } catch (err) {
      next(err);
    }
  }

  public async getAdvisories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const crop = req.query.crop as string;
      const advisories = await advisoryService.getWeatherAlerts(crop);
      sendResponse(res, advisories, 200, { count: advisories.length });
    } catch (err) {
      next(err);
    }
  }
}

export const advisoryController = new AdvisoryController();
