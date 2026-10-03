// ─────────────────────────────────────────────────────────────────────────────
// server/modules/auth/auth.routes.ts
// Cross-Platform Auth Routing
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { authController } from './auth.controller';
import { optionalAuth } from '../../core/auth';

const router = Router();

router.get('/me', optionalAuth, (req, res, next) => authController.getMe(req, res, next));
router.post('/sync', optionalAuth, (req, res, next) => authController.sync(req, res, next));
router.post('/send-email-otp', optionalAuth, (req, res, next) => authController.sendEmailOtp(req, res, next));
router.post('/verify-email-otp', optionalAuth, (req, res, next) => authController.verifyEmailOtp(req, res, next));
router.post('/register', optionalAuth, (req, res, next) => authController.registerFarmer(req, res, next));
router.post('/login', optionalAuth, (req, res, next) => authController.loginFarmer(req, res, next));
router.post('/verify', (req, res, next) => authController.verify(req, res, next));

export const authRouter = router;
