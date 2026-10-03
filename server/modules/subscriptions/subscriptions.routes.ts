// ─────────────────────────────────────────────────────────────────────────────
// server/modules/subscriptions/subscriptions.routes.ts
// Express Router for Subscriptions Domain
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';
import { subscriptionsController } from './subscriptions.controller.ts';

export const subscriptionsRouter = Router();

subscriptionsRouter.get('/plans', (req, res) => subscriptionsController.getPlans(req, res));
subscriptionsRouter.get('/current', (req, res) => subscriptionsController.getCurrentSubscription(req, res));
subscriptionsRouter.post('/subscribe', (req, res) => subscriptionsController.subscribe(req, res));
subscriptionsRouter.post('/webhook', (req, res) => subscriptionsController.handleWebhook(req, res));
