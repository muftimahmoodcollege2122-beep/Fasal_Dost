// ─────────────────────────────────────────────────────────────────────────────
// server/modules/advisory/advisory.routes.ts
// Advisory & Mandi rates routes
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { advisoryController } from './advisory.controller';

const router = Router();

router.get('/mandi-rates', (req, res, next) => advisoryController.getMandiRates(req, res, next));
router.get('/weather-alerts', (req, res, next) => advisoryController.getAdvisories(req, res, next));

export const advisoryRouter = router;
