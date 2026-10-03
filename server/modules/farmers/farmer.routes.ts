// ─────────────────────────────────────────────────────────────────────────────
// server/modules/farmers/farmer.routes.ts
// Farmer module routing with cross-platform auth & fallback UID handling
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { farmerController } from './farmer.controller';
import { optionalAuth } from '../../core/auth';

const router = Router();

router.get('/profile', optionalAuth, (req, res, next) => farmerController.getProfile(req, res, next));
router.get('/profile/:uid', optionalAuth, (req, res, next) => farmerController.getProfile(req, res, next));
router.get('/stats', optionalAuth, (req, res, next) => farmerController.getStats(req, res, next));
router.put('/profile', optionalAuth, (req, res, next) => farmerController.updateProfile(req, res, next));
router.put('/profile/:uid', optionalAuth, (req, res, next) => farmerController.updateProfile(req, res, next));
router.post('/verify-seller', optionalAuth, (req, res, next) => farmerController.verifySeller(req, res, next));
router.post('/verify-seller/:uid', optionalAuth, (req, res, next) => farmerController.verifySeller(req, res, next));
router.get('/admin/verifications', optionalAuth, (req, res, next) => farmerController.getVerifications(req, res, next));
router.post('/admin/verifications/:uid/decision', optionalAuth, (req, res, next) => farmerController.reviewVerification(req, res, next));

export const farmerRouter = router;
