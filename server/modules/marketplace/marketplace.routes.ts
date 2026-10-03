// ─────────────────────────────────────────────────────────────────────────────
// server/modules/marketplace/marketplace.routes.ts
// Kisan Marketplace routing with cross-platform auth
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { marketplaceController } from './marketplace.controller';
import { optionalAuth, requireAuth } from '../../core/auth';

const router = Router();

router.get('/listings', optionalAuth, (req, res, next) => marketplaceController.getAll(req, res, next));
router.get('/listings/:id', optionalAuth, (req, res, next) => marketplaceController.getOne(req, res, next));
router.post('/listings', requireAuth, (req, res, next) => marketplaceController.create(req, res, next));
router.patch('/listings/:id/status', requireAuth, (req, res, next) => marketplaceController.updateStatus(req, res, next));
router.delete('/listings/:id', requireAuth, (req, res, next) => marketplaceController.remove(req, res, next));

export const marketplaceRouter = router;
