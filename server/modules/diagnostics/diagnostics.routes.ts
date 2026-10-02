// ─────────────────────────────────────────────────────────────────────────────
// server/modules/diagnostics/diagnostics.routes.ts
// Diagnostics routing with optional/required cross-platform auth
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { diagnosticsController } from './diagnostics.controller';
import { optionalAuth } from '../../core/auth';

const router = Router();

router.post('/scan', optionalAuth, (req, res, next) => diagnosticsController.scan(req, res, next));
router.get('/history', optionalAuth, (req, res, next) => diagnosticsController.getHistory(req, res, next));
router.get('/history/:scanCode', optionalAuth, (req, res, next) => diagnosticsController.getScanByCode(req, res, next));
router.delete('/history/:scanCode', optionalAuth, (req, res, next) => diagnosticsController.deleteScan(req, res, next));
router.delete('/history', optionalAuth, (req, res, next) => diagnosticsController.clearHistory(req, res, next));
router.get('/crops', (req, res, next) => diagnosticsController.getSupportedCrops(req, res, next));

export const diagnosticsRouter = router;
