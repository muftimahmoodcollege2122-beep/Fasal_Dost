// ─────────────────────────────────────────────────────────────────────────────
// server/modules/subscriptions/subscriptions.service.ts
// Secure Enterprise Payment & Webhook Reconciliation Service
// ─────────────────────────────────────────────────────────────────────────────

import { and, desc, eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../../../src/db/index.ts';
import { users, subscriptions } from '../../../src/db/schema.ts';
import { AppError } from '../../core/types.ts';

export type SubscriptionPlan = 'free' | 'gold' | 'diamond' | 'unlimited';
export type BillingCycle = 'monthly' | 'yearly';

export interface PlanDetails {
  id: SubscriptionPlan;
  nameEn: string;
  nameUr: string;
  scansQuotaDisplay: string;
  monthlyPricePkr: number;
  yearlyPricePkr: number;
  monthlySavingsPkr: number;
  featuresEn: string[];
  featuresUr: string[];
  popular?: boolean;
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    id: 'free',
    nameEn: 'Free Starter',
    nameUr: 'مفت پیکج',
    scansQuotaDisplay: '7 free scans / day',
    monthlyPricePkr: 0,
    yearlyPricePkr: 0,
    monthlySavingsPkr: 0,
    featuresEn: [
      '7 AI crop disease scans every 24 hours',
      'AI botanical pathology analysis',
      'Urdu & multi-lingual support',
    ],
    featuresUr: [
      'روزانہ 7 مفت کروپ اسکینز',
      'اے آئی سے بیماریوں کی تشخیص',
      'اردو اور 6 زبانوں میں معاونت',
    ],
  },
  gold: {
    id: 'gold',
    nameEn: 'Gold Plan',
    nameUr: 'گولڈ پیکج',
    scansQuotaDisplay: '250 scans / month',
    monthlyPricePkr: 299,
    yearlyPricePkr: 2547,
    monthlySavingsPkr: 1041,
    featuresEn: [
      '250 crop scans every month',
      'Priority AI vision processing',
      'Studio human-like voice narration',
      'Save scan history permanently',
    ],
    featuresUr: [
      'ماہانہ 250 کروپ اسکینز',
      'ترجیحی اے آئی پروسیسنگ',
      'انسانی آواز میں علاج کا آڈیو',
      'تشخیص کی تمام ہسٹری محفوظ',
    ],
    popular: true,
  },
  diamond: {
    id: 'diamond',
    nameEn: 'Diamond Plan',
    nameUr: 'ڈائمنڈ پیکج',
    scansQuotaDisplay: '500 scans / month',
    monthlyPricePkr: 599,
    yearlyPricePkr: 5103,
    monthlySavingsPkr: 2085,
    featuresEn: [
      '500 crop scans every month',
      'VIP fast-track AI analysis',
      'Verified Farmer marketplace badge',
      'Priority produce listings in marketplace',
    ],
    featuresUr: [
      'ماہانہ 500 کروپ اسکینز',
      'وی آئی پی فلیش اے آئی انالیسس',
      'تصدیق شدہ کسان منڈی بیج',
      'منڈی میں فصل کی ترجیحی نمائش',
    ],
  },
  unlimited: {
    id: 'unlimited',
    nameEn: 'Unlimited Enterprise',
    nameUr: 'لامحدود پریمیم',
    scansQuotaDisplay: 'Unlimited scans',
    monthlyPricePkr: 2500,
    yearlyPricePkr: 21300,
    monthlySavingsPkr: 8700,
    featuresEn: [
      'Unlimited daily & monthly crop scans',
      'Dedicated agricultural expert support',
      'Multi-farm management & team access',
      '24/7 direct agronomist hotline',
    ],
    featuresUr: [
      'لامحدود روزانہ و ماہانہ کروپ اسکینز',
      'زرعی ماہرین کی برائے راست معاونت',
      'ایک سے زائد فارمز کا انتظام',
      '24/7 ہیلپ لائن سپورٹ',
    ],
  },
};


export const ALLOWED_PAYMENT_METHODS = ['easypaisa', 'jazzcash', 'bank'] as const;

/** Merchant accounts the farmer pays into. Configure via env; unset methods are hidden. */
export function getPaymentAccounts() {
  const acc: Record<string, { title: string; account: string }> = {};
  const add = (id: string, title: string, env?: string) => {
    if (env && env.trim()) acc[id] = { title, account: env.trim() };
  };
  add('easypaisa', process.env.PAYMENT_ACCOUNT_TITLE || 'FasalDost', process.env.EASYPAISA_ACCOUNT);
  add('jazzcash', process.env.PAYMENT_ACCOUNT_TITLE || 'FasalDost', process.env.JAZZCASH_ACCOUNT);
  add('bank', process.env.PAYMENT_ACCOUNT_TITLE || 'FasalDost', process.env.BANK_ACCOUNT);
  return acc;
}

function planQuota(plan: SubscriptionPlan): number {
  if (plan === 'diamond') return 500;
  if (plan === 'unlimited') return 999999;
  return 250;
}

export class SubscriptionsService {
  public async getActiveSubscription(userId?: string, _clientIp?: string) {
    if (userId) {
      const [userRecord] = await db
        .select()
        .from(users)
        .where(eq(users.uid, userId));

      if (userRecord && userRecord.plan && userRecord.plan !== 'free') {
        const expiresAt = userRecord.subscriptionExpiresAt;
        if (expiresAt && new Date() < new Date(expiresAt)) {
          return {
            plan: userRecord.plan as SubscriptionPlan,
            billingCycle: (userRecord.billingCycle || 'monthly') as BillingCycle,
            expiresAt: expiresAt.toISOString(),
            monthlyQuota: userRecord.monthlyScanQuota || 0,
            monthlyUsed: userRecord.monthlyScansUsed || 0,
            isPaid: true,
            pending: null,
          };
        }
      }
    }

    let pending: any = null;
    if (userId) {
      const [p] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'pending_verification')))
        .orderBy(desc(subscriptions.id))
        .limit(1);
      if (p) {
        pending = {
          id: p.id,
          plan: p.plan,
          billingCycle: p.billingCycle,
          amountPkr: p.amountPkr,
          paymentMethod: p.paymentMethod,
          paymentReference: p.paymentReference,
          submittedAt: p.createdAt,
        };
      }
    }

    return {
      plan: 'free' as SubscriptionPlan,
      billingCycle: 'monthly' as BillingCycle,
      expiresAt: null,
      monthlyQuota: 0,
      monthlyUsed: 0,
      isPaid: false,
      pending,
    };
  }

  /**
   * Step 1 — farmer pays to the merchant account and submits the transaction ID.
   * Nothing is unlocked here: the record stays 'pending_verification' until an admin
   * (or a signed gateway webhook) confirms the payment.
   */
  public async activateSubscription(params: {
    userId?: string;
    clientIp?: string;
    plan: SubscriptionPlan;
    billingCycle: BillingCycle;
    paymentMethod: string;
    paymentReference?: string;
  }) {
    const { userId, clientIp, plan, billingCycle, paymentMethod, paymentReference } = params;

    if (!userId || userId === 'guest_farmer') {
      throw new AppError('Please complete farmer setup / sign in before subscribing.', 401, 'AUTH_REQUIRED');
    }
    if (plan === 'free') throw new AppError('Free plan is default', 400);

    const config = PLAN_CONFIGS[plan];
    if (!config) throw new AppError('Invalid subscription plan', 400);
    if (billingCycle !== 'monthly' && billingCycle !== 'yearly') {
      throw new AppError('Invalid billing cycle', 400);
    }
    if (!(ALLOWED_PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
      throw new AppError('Unsupported payment method', 400, 'INVALID_PAYMENT_METHOD');
    }

    const ref = (paymentReference || '').trim();
    if (!/^[A-Za-z0-9-]{8,40}$/.test(ref)) {
      throw new AppError(
        'Enter the transaction ID from your payment receipt (8-40 letters/numbers).',
        400,
        'PAYMENT_REFERENCE_REQUIRED'
      );
    }

    const [dup] = await db.select().from(subscriptions).where(eq(subscriptions.paymentReference, ref));
    if (dup) {
      throw new AppError('This transaction ID has already been submitted.', 409, 'DUPLICATE_PAYMENT_REFERENCE');
    }

    const [open] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'pending_verification')));
    if (open) {
      throw new AppError('You already have a payment waiting for verification.', 409, 'PENDING_EXISTS');
    }

    const amountPkr = billingCycle === 'yearly' ? config.yearlyPricePkr : config.monthlyPricePkr;
    const now = new Date();

    // Real start/expiry are set when the payment is approved.
    const [rec] = await db
      .insert(subscriptions)
      .values({
        userId,
        clientIp: clientIp || null,
        plan,
        billingCycle,
        amountPkr,
        scansQuota: planQuota(plan),
        paymentMethod,
        paymentReference: ref,
        status: 'pending_verification',
        startsAt: now,
        expiresAt: now,
      })
      .returning();

    return {
      status: 'pending_verification',
      subscriptionId: rec.id,
      plan,
      billingCycle,
      amountPkr,
      message: 'Payment submitted. Your plan activates once the payment is verified.',
    };
  }

  /** Step 2 — verified payment: activate plan, set real dates, grant quota. Idempotent. */
  public async approveSubscription(subscriptionId: number) {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));
    if (!sub) throw new AppError('Subscription not found.', 404, 'SUBSCRIPTION_NOT_FOUND');
    if (sub.status === 'active') return { success: true, message: 'Already active.' };
    if (sub.status !== 'pending_verification') {
      throw new AppError(`Cannot approve a ${sub.status} subscription.`, 409, 'INVALID_STATE');
    }

    const startsAt = new Date();
    const expiresAt = new Date(startsAt);
    expiresAt.setDate(expiresAt.getDate() + (sub.billingCycle === 'yearly' ? 365 : 30));

    await db.update(subscriptions).set({ status: 'active', startsAt, expiresAt }).where(eq(subscriptions.id, sub.id));

    if (sub.userId) {
      await db
        .update(users)
        .set({
          plan: sub.plan,
          billingCycle: sub.billingCycle,
          subscriptionStartedAt: startsAt,
          subscriptionExpiresAt: expiresAt,
          monthlyScanQuota: sub.scansQuota,
          monthlyScansUsed: 0,
          updatedAt: new Date(),
        })
        .where(eq(users.uid, sub.userId));
    }
    return { success: true, message: 'Payment verified. Subscription activated.' };
  }

  public async rejectSubscription(subscriptionId: number) {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId));
    if (!sub) throw new AppError('Subscription not found.', 404, 'SUBSCRIPTION_NOT_FOUND');
    if (sub.status !== 'pending_verification') {
      throw new AppError(`Cannot reject a ${sub.status} subscription.`, 409, 'INVALID_STATE');
    }
    await db.update(subscriptions).set({ status: 'failed' }).where(eq(subscriptions.id, sub.id));
    return { success: true, message: 'Payment rejected.' };
  }

  public async listPending() {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'pending_verification'))
      .orderBy(desc(subscriptions.id));
  }

  /** Signed gateway callback. Requires PAYMENT_WEBHOOK_SECRET — there is no default or bypass. */
  public async handleWebhookReconciliation(payload: {
    paymentReference: string;
    status: 'success' | 'failed';
    signature: string;
  }) {
    const secret = process.env.PAYMENT_WEBHOOK_SECRET;
    if (!secret) throw new AppError('Webhook not configured.', 503, 'WEBHOOK_DISABLED');

    const { paymentReference, status, signature } = payload;
    if (!paymentReference || !signature || (status !== 'success' && status !== 'failed')) {
      throw new AppError('Invalid webhook payload.', 400);
    }

    const expected = crypto.createHmac('sha256', secret).update(`${paymentReference}:${status}`).digest();
    let given: Buffer;
    try {
      given = Buffer.from(String(signature), 'hex');
    } catch {
      given = Buffer.alloc(0);
    }
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      throw new AppError('Invalid webhook signature.', 403, 'INVALID_WEBHOOK_SIGNATURE');
    }

    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.paymentReference, paymentReference.trim()));
    if (!sub) throw new AppError('Subscription transaction reference not found.', 404, 'SUBSCRIPTION_NOT_FOUND');

    return status === 'success' ? this.approveSubscription(sub.id) : this.rejectSubscription(sub.id);
  }
}

export const subscriptionsService = new SubscriptionsService();
