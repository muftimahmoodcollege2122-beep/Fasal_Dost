// ─────────────────────────────────────────────────────────────────────────────
// server/modules/auth/auth.controller.ts
// Shared Cross-Platform Auth Request Controller
// ─────────────────────────────────────────────────────────────────────────────

import { Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendResponse } from '../../core/middleware';
import { AuthRequest } from '../../core/auth';

export class AuthController {
  public async getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.uid) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not signed in' } });
        return;
      }
      const user = await authService.getUserByUid(req.user.uid);
      sendResponse(res, user || req.user);
    } catch (err) {
      next(err);
    }
  }

  public async sync(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { uid, email, phone, displayName, photoUrl, platform } = req.body;
      const effectiveUid = uid || req.user?.uid;
      const synced = await authService.syncUser({
        uid: effectiveUid,
        email,
        phone,
        displayName,
        photoUrl,
        platform,
      });
      sendResponse(res, synced);
    } catch (err) {
      next(err);
    }
  }

  public async sendEmailOtp(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, farmerName } = req.body;
      const result = await authService.sendEmailOtp(email, farmerName);
      sendResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async verifyEmailOtp(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyEmailOtp(email, otp);
      sendResponse(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async registerFarmer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { firstName, middleName, lastName, email, phone, password, otp } = req.body;

      const user = await authService.registerFarmer({
        firstName,
        middleName,
        lastName,
        email,
        phone,
        password,
        otp,
      });
      sendResponse(res, user);
    } catch (err) {
      next(err);
    }
  }

  public async loginFarmer(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await authService.loginFarmer({ email, password });
      sendResponse(res, user);
    } catch (err) {
      next(err);
    }
  }

  public async verify(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body;
      const user = await authService.verifyToken(token);
      sendResponse(res, user);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
