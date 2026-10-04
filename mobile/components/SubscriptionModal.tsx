// ─────────────────────────────────────────────────────────────────────────────
// src/components/SubscriptionModal.tsx
// Subscription & Quota Upgrade Modal Component for FasalDost
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Box, Btn, Inp, T } from '../ui/web';
import {
  X,
  Zap,
  Check,
  Crown,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building2,
  Lock,
} from '../ui/icons';
import { Language, t } from '../utils/i18n';
import { apiClient } from '../shared/apiClient';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  onSubscribed?: (plan: string) => void;
  reasonMsg?: string;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  lang,
  onSubscribed,
  reasonMsg,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly'); // Default to 29% OFF
  const [selectedPlan, setSelectedPlan] = useState<'gold' | 'diamond' | 'unlimited'>('gold');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'card'>('easypaisa');
  const [phoneNum, setPhoneNum] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isUrdu = lang === 'ur';

  // Calculate pricing
  const plans = {
    gold: {
      name: isUrdu ? 'گولڈ پیکج' : 'Gold Plan',
      scans: isUrdu ? '250 اسکینز / ماہانہ' : '250 scans / month',
      monthlyPrice: 299,
      yearlyPrice: 2547, // 299 * 12 * 0.71 = 2547
      savings: 1041,
      popular: true,
      badge: isUrdu ? 'سب سے مقبول' : 'Most Popular',
      features: isUrdu
        ? ['ماہانہ 250 کروپ اسکینز', 'ترجیحی پروسیسنگ', 'ایچ ڈی آڈیو وائس نیریشن', 'مکمل تشخیص کی ہسٹری']
        : ['250 crop scans per month', 'Priority AI processing', 'HD studio voice reader', 'Permanent scan history'],
    },
    diamond: {
      name: isUrdu ? 'ڈائمنڈ پیکج' : 'Diamond Plan',
      scans: isUrdu ? '500 اسکینز / ماہانہ' : '500 scans / month',
      monthlyPrice: 599,
      yearlyPrice: 5103, // 599 * 12 * 0.71 = 5103
      savings: 2085,
      popular: false,
      badge: '',
      features: isUrdu
        ? ['ماہانہ 500 کروپ اسکینز', 'وی آئی پی فلیش پروسیسنگ', 'تصدیق شدہ کسان منڈی بیج', 'فصلوں کی ترجیحی لسٹنگ']
        : ['500 crop scans per month', 'VIP fast-track processing', 'Verified Farmer badge', 'Priority marketplace listings'],
    },
    unlimited: {
      name: isUrdu ? 'لامحدود پریمیم' : 'Unlimited Enterprise',
      scans: isUrdu ? 'لامحدود اسکینز' : 'Unlimited scans',
      monthlyPrice: 2500,
      yearlyPrice: 21300, // 2500 * 12 * 0.71 = 21300
      savings: 8700,
      popular: false,
      badge: '',
      features: isUrdu
        ? ['لامحدود کروپ اسکینز', 'زرعی ماہرین کی برائے راست سپورٹ', 'ملٹی فارم مینجمنٹ', '24/7 ہیلپ لائن']
        : ['Unlimited crop scans', 'Direct agronomist support', 'Multi-farm management', '24/7 priority hotline'],
    },
  };

  const handleSubscribe = async () => {
    if (!phoneNum || phoneNum.trim().length < 6) {
      alert(
        isUrdu
          ? 'براہ کرم ادائیگی کی تصدیق کے لیے درست ٹرانزیکشن حوالہ ID یا موبائل اکاؤنٹ نمبر (کم از کم 6 ہندسے) درج کریں۔'
          : 'Please enter a valid Transaction Reference ID or Mobile Account Number (minimum 6 characters) to authenticate payment.'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.subscriptions.subscribe({
        plan: selectedPlan,
        billingCycle,
        paymentMethod,
        paymentReference: phoneNum.trim(),
      });

      if (res && res.success) {
        setSuccess(true);
        if (onSubscribed) onSubscribed(selectedPlan);
        setTimeout(() => {
          onClose();
        }, 1800);
      }
    } catch (err: any) {
      alert(err.message || 'Payment authentication failed. Please check your transaction ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <Box className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col p-5 sm:p-6 shadow-2xl relative my-auto">
        {/* Close Button */}
        <Btn
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </Btn>

        {/* Modal Header */}
        <Box className="text-center mb-5 pr-6">
          <Box className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-900 font-extrabold text-xs mb-2">
            <Crown className="w-4 h-4 text-slate-900" />
            <T>{isUrdu ? 'فضل دوست پریمیم پیکجز' : 'FasalDost Premium Packages'}</T>
          </Box>

          <T className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {reasonMsg || (isUrdu ? 'روزانہ اسکین کی حد مکمل ہو گئی ہے' : 'Upgrade for Unlimited Crop Protection')}
          </T>

          <T className="text-xs text-slate-500 mt-1">
            {isUrdu
              ? 'مفت پیکج میں روزانہ 7 اسکینز ملتے ہیں۔ مزید اسکینز کے لیے گولڈ یا ڈائمنڈ منتخب کریں۔'
              : 'Free plan offers 7 daily scans. Choose Gold or Diamond for higher scan limits.'}
          </T>
        </Box>

        {/* Billing Cycle Toggle */}
        <Box className="flex items-center justify-center gap-2 p-1 bg-slate-100 rounded-2xl mb-5 max-w-xs mx-auto border border-slate-200/80">
          <Btn
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition ${
              billingCycle === 'monthly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {isUrdu ? 'ماہانہ بلنگ' : 'Monthly'}
          </Btn>
          <Btn
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              billingCycle === 'yearly'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <T>{isUrdu ? 'سالانہ' : 'Yearly'}</T>
            <T className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
              29% OFF
            </T>
          </Btn>
        </Box>

        {/* Plans Selector */}
        <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 overflow-y-auto max-h-[38vh] p-1">
          {(Object.keys(plans) as Array<keyof typeof plans>).map((planKey) => {
            const p = plans[planKey];
            const isSelected = selectedPlan === planKey;
            const price = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;

            return (
              <Box
                key={planKey}
                onClick={() => setSelectedPlan(planKey)}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white shadow-md scale-[1.02]'
                    : 'border-slate-200 bg-slate-50/80 hover:border-slate-300 hover:bg-white text-slate-800'
                }`}
              >
                {p.popular && (
                  <T className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] shadow-2xs border border-slate-700">
                    {p.badge}
                  </T>
                )}

                <Box>
                  <Box className="flex items-center justify-between mb-2">
                    <T className={`font-black text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {p.name}
                    </T>
                    <Box
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </Box>
                  </Box>

                  <Box className="mb-3">
                    <T className={`text-xl font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      PKR {price.toLocaleString()}
                    </T>
                    <T className={`text-[11px] font-medium block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      /{billingCycle === 'yearly' ? (isUrdu ? 'سال' : 'year') : (isUrdu ? 'ماہ' : 'month')}
                    </T>

                    {billingCycle === 'yearly' && (
                      <T className={`text-[10px] font-bold block mt-0.5 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        {isUrdu ? `بچت: PKR ${p.savings}` : `Save PKR ${p.savings}`}
                      </T>
                    )}
                  </Box>

                  <Box className={`text-xs font-bold mb-3 pb-2 border-b ${isSelected ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                    {p.scans}
                  </Box>

                  <Box className="space-y-1.5 text-[11px]">
                    {p.features.map((feat, idx) => (
                      <Box key={idx} className="flex items-start gap-1.5">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        <T className={isSelected ? 'text-slate-200' : 'text-slate-600'}>{feat}</T>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* Payment Gateways (Pakistan) */}
        <Box className="p-3 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
          <T className="block text-xs font-bold text-slate-700 mb-2">
            {isUrdu ? 'ادائیگی کا طریقہ منتخب کریں' : 'Select Payment Method'}
          </T>
          <Box className="grid grid-cols-4 gap-2 mb-3">
            {[
              { id: 'easypaisa', name: 'EasyPaisa', icon: Smartphone },
              { id: 'jazzcash', name: 'JazzCash', icon: Smartphone },
              { id: 'bank', name: 'Bank Transfer', icon: Building2 },
              { id: 'card', name: 'Debit Card', icon: CreditCard },
            ].map((m) => {
              const Icon = m.icon;
              const active = paymentMethod === m.id;
              return (
                <Btn
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    active
                      ? 'border-slate-900 bg-white text-slate-900 shadow-2xs font-extrabold'
                      : 'border-slate-200 bg-slate-100/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <T className="text-[10px]">{m.name}</T>
                </Btn>
              );
            })}
          </Box>

          <Inp
            type="text"
            value={phoneNum}
            onChange={(e) => setPhoneNum(e.target.value)}
            placeholder={
              paymentMethod === 'bank'
                ? (isUrdu ? 'بینک ٹرانزیکشن حوالہ ID' : 'Bank Reference ID / Account')
                : (isUrdu ? 'موبائل نمبر (مثلا 03001234567)' : 'Mobile Account Number (03XX-XXXXXXX)')
            }
            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
          />
        </Box>

        {/* Action Button */}
        {success ? (
          <Box className="p-3.5 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm flex items-center justify-center gap-2">
            <Check className="w-5 h-5" />
            <T>{isUrdu ? 'سبسکرپشن کامیابی سے فعال ہو گئی!' : 'Subscription Activated Successfully!'}</T>
          </Box>
        ) : (
          <Btn
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <T>{isUrdu ? 'پروسیسنگ...' : 'Processing Payment...'}</T>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <T>
                  {isUrdu
                    ? `PKR ${plans[selectedPlan][billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice'].toLocaleString()} ادا کریں اور پلان فعال کریں`
                    : `Subscribe Now for PKR ${plans[selectedPlan][billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice'].toLocaleString()}`}
                </T>
              </>
            )}
          </Btn>
        )}

        <Box className="mt-2 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <Lock className="w-3 h-3" />
          <T>{isUrdu ? '256-بٹ محفوظ انکرپٹڈ ادائیگی' : '256-bit Secure Encrypted Payment'}</T>
        </Box>
      </Box>
    </Box>
  );
};
