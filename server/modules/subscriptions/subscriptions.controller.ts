// ─────────────────────────────────────────────────────────────────────────────
// server/modules/subscriptions/subscriptions.controller.ts
// Express REST Controller for Subscription Plans, Activation & Bank Webhooks
// ─────────────────────────────────────────────────────────────────────────────

import { Request, Response } from 'express';
import { subscriptionsService, PLAN_CONFIGS, SubscriptionPlan, BillingCycle } from './subscriptions.service.ts';

export class SubscriptionsController {
  public async getPlans(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      plans: PLAN_CONFIGS,
      yearlyDiscountPercent: 29,
    });
  }

  public async getCurrentSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.headers['x-user-uid'] as string) || (req.query.userId as string);
      const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const subscription = await subscriptionsService.getActiveSubscription(userId, clientIp);
      res.json({
        success: true,
        subscription,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || 'Failed to fetch subscription' });
    }
  }

  public async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req.headers['x-user-uid'] as string) || req.body.userId;
      const clientIp = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;

      const { plan, billingCycle, paymentMethod, paymentReference } = req.body;

      if (!plan || !PLAN_CONFIGS[plan as SubscriptionPlan]) {
        res.status(400).json({ success: false, message: 'Invalid subscription plan selected' });
        return;
      }

      const result = await subscriptionsService.activateSubscription({
        userId,
        clientIp,
        plan: plan as SubscriptionPlan,
        billingCycle: (billingCycle || 'monthly') as BillingCycle,
        paymentMethod: paymentMethod || 'easypaisa',
        paymentReference,
      });

      res.json({
        success: true,
        message: 'Subscription payment reference submitted successfully.',
        subscription: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Subscription activation failed',
      });
    }
  }

  public async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { paymentReference, status, signature } = req.body;
      const result = await subscriptionsService.handleWebhookReconciliation({
        paymentReference,
        status,
        signature,
      });
      res.json(result);
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Webhook processing failed',
      });
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
