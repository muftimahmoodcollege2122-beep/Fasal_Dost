// ─────────────────────────────────────────────────────────────────────────────
// server/modules/subscriptions/subscriptions.controller.ts
// Plans, payment submission, admin verification, signed gateway webhook
// ─────────────────────────────────────────────────────────────────────────────

import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AuthRequest } from '../../core/auth';
import {
  subscriptionsService,
  PLAN_CONFIGS,
  SubscriptionPlan,
  BillingCycle,
  getPaymentAccounts,
} from './subscriptions.service.ts';

const fail = (res: Response, error: any, fallback: string) =>
  res.status(error?.statusCode || 500).json({
    success: false,
    code: error?.code,
    message: error?.message || fallback,
  });

/** Admin endpoints are guarded by the ADMIN_API_KEY env var (x-admin-key header). */
export function requireAdminKey(req: AuthRequest, res: Response, next: NextFunction): void {
  const key = process.env.ADMIN_API_KEY;
  if (!key) {
    res.status(503).json({ success: false, message: 'Admin API not configured (set ADMIN_API_KEY).' });
    return;
  }
  const given = Buffer.from(String(req.headers['x-admin-key'] || ''));
  const want = Buffer.from(key);
  if (given.length !== want.length || !crypto.timingSafeEqual(given, want)) {
    res.status(403).json({ success: false, message: 'Forbidden' });
    return;
  }
  next();
}

export class SubscriptionsController {
  public async getPlans(_req: AuthRequest, res: Response): Promise<void> {
    res.json({
      success: true,
      plans: PLAN_CONFIGS,
      yearlyDiscountPercent: 29,
      paymentAccounts: getPaymentAccounts(),
    });
  }

  public async getCurrentSubscription(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.uid;
      const subscription = await subscriptionsService.getActiveSubscription(userId, req.ip);
      res.json({ success: true, subscription });
    } catch (error: any) {
      fail(res, error, 'Failed to fetch subscription');
    }
  }

  public async subscribe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { plan, billingCycle, paymentMethod, paymentReference } = req.body || {};
      if (!plan || plan === 'free' || !PLAN_CONFIGS[plan as SubscriptionPlan]) {
        res.status(400).json({ success: false, message: 'Invalid subscription plan selected' });
        return;
      }
      const result = await subscriptionsService.activateSubscription({
        userId: req.user?.uid,
        clientIp: req.ip,
        plan: plan as SubscriptionPlan,
        billingCycle: (billingCycle || 'monthly') as BillingCycle,
        paymentMethod,
        paymentReference,
      });
      res.json({ success: true, message: result.message, subscription: result });
    } catch (error: any) {
      fail(res, error, 'Subscription request failed');
    }
  }

  public async handleWebhook(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await subscriptionsService.handleWebhookReconciliation(req.body || {}));
    } catch (error: any) {
      fail(res, error, 'Webhook processing failed');
    }
  }

  public async adminListPending(_req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json({ success: true, pending: await subscriptionsService.listPending() });
    } catch (error: any) {
      fail(res, error, 'Failed to list pending payments');
    }
  }

  public async adminApprove(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await subscriptionsService.approveSubscription(Number(req.params.id)));
    } catch (error: any) {
      fail(res, error, 'Approval failed');
    }
  }

  public async adminReject(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json(await subscriptionsService.rejectSubscription(Number(req.params.id)));
    } catch (error: any) {
      fail(res, error, 'Rejection failed');
    }
  }
}

export const subscriptionsController = new SubscriptionsController();
