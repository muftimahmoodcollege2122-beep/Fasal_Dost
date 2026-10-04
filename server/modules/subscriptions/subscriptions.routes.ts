// ─────────────────────────────────────────────────────────────────────────────
// server/modules/subscriptions/subscriptions.routes.ts
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { optionalAuth } from '../../core/auth';
import { subscriptionsController as c, requireAdminKey } from './subscriptions.controller.ts';

export const subscriptionsRouter = Router();

subscriptionsRouter.get('/plans', (req, res) => c.getPlans(req, res));
subscriptionsRouter.get('/current', optionalAuth, (req, res) => c.getCurrentSubscription(req, res));
subscriptionsRouter.post('/subscribe', optionalAuth, (req, res) => c.subscribe(req, res));
subscriptionsRouter.post('/webhook', (req, res) => c.handleWebhook(req, res));

// Admin: verify payments against your EasyPaisa/JazzCash/bank statement
subscriptionsRouter.get('/admin/pending', requireAdminKey, (req, res) => c.adminListPending(req, res));
subscriptionsRouter.post('/admin/:id/approve', requireAdminKey, (req, res) => c.adminApprove(req, res));
subscriptionsRouter.post('/admin/:id/reject', requireAdminKey, (req, res) => c.adminReject(req, res));
