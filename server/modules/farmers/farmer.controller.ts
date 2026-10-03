// ─────────────────────────────────────────────────────────────────────────────
// server/modules/farmers/farmer.controller.ts
// Farmer Profile Module Controller
// ─────────────────────────────────────────────────────────────────────────────

import { Response, NextFunction } from 'express';
import { farmerService } from './farmer.service';
import { sendResponse } from '../../core/middleware';
import { AuthRequest } from '../../core/auth';

function resolveUid(req: AuthRequest): string {
  const param = req.params.uid;
  if (Array.isArray(param)) return param[0] || req.user?.uid || 'guest';
  return param || req.user?.uid || (req.headers['x-user-uid'] as string) || 'guest';
}

export class FarmerController {
  public async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const uid = resolveUid(req);
      const profile = await farmerService.getProfile(uid);
      const stats = await farmerService.getStats(uid);
      sendResponse(res, { ...profile, stats });
    } catch (err) {
      next(err);
    }
  }

  public async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const uid = resolveUid(req);
      const updated = await farmerService.upsertProfile(uid, req.body);
      sendResponse(res, updated);
    } catch (err) {
      next(err);
    }
  }

  public async verifySeller(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const uid = resolveUid(req);
      const verified = await farmerService.verifySeller(uid, req.body);
      sendResponse(res, verified, 200);
    } catch (err) {
      next(err);
    }
  }

  public async getVerifications(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const verifications = await farmerService.getPendingVerifications();
      sendResponse(res, verifications);
    } catch (err) {
      next(err);
    }
  }

  public async reviewVerification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUid = (req.params.uid as string) || req.body.userId;
      const { decision, reason, reviewer } = req.body;
      const result = await farmerService.reviewVerification(targetUid, decision, reason, reviewer);
      sendResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const uid = resolveUid(req);
      const stats = await farmerService.getStats(uid);
      sendResponse(res, stats);
    } catch (err) {
      next(err);
    }
  }
}

export const farmerController = new FarmerController();
