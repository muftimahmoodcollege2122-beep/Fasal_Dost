// ─────────────────────────────────────────────────────────────────────────────
// src/screens/SubscriptionScreen.tsx
// Subscription & Packages Screen for FasalDost
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Box, Btn, Inp, T } from '../ui/web';
import {
  ArrowLeft,
  Crown,
  Zap,
  Check,
  Smartphone,
  Building2,
  CreditCard,
  Sparkles,
} from '../ui/icons';
import { Language } from '../utils/i18n';
import { apiClient } from '../shared/apiClient';

interface SubscriptionScreenProps {
  lang: Language;
  onBack: () => void;
}

export const SubscriptionScreen: React.FC<SubscriptionScreenProps> = ({
  lang,
  onBack,
}) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly'); // Default to 29% OFF
  const [selectedPlan, setSelectedPlan] = useState<'gold' | 'diamond' | 'unlimited'>('gold');
  const [paymentMethod, setPaymentMethod] = useState<'easypaisa' | 'jazzcash' | 'bank' | 'card'>('easypaisa');
  const [phoneNum, setPhoneNum] = useState('');
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const isUrdu = lang === 'ur';

  useEffect(() => {
    apiClient.subscriptions.getCurrent().then((res) => {
      if (res && res.subscription) {
        setCurrentSub(res.subscription);
      }
    });
  }, []);

  const plans = {
    gold: {
      name: isUrdu ? 'گولڈ پیکج' : 'Gold Plan',
      scans: isUrdu ? '250 اسکینز / ماہانہ' : '250 scans / month',
      monthlyPrice: 299,
      yearlyPrice: 2547,
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
      yearlyPrice: 5103,
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
      yearlyPrice: 21300,
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
        setCurrentSub(res.subscription);
      }
    } catch (err: any) {
      alert(err.message || 'Payment authentication failed. Please check your transaction ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <Box className="flex items-center justify-between py-2 mb-4 border-b border-slate-100 pb-3">
        <Btn
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </Btn>

        <T className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
          <Crown className="w-5 h-5 text-slate-900" />
          <T>{isUrdu ? 'فضل دوست پیکجز' : 'Subscription Plans'}</T>
        </T>

        <Box className="w-10" />
      </Box>

      {/* Active Subscription Banner */}
      {currentSub && currentSub.isPaid && (
        <Box className="p-4 rounded-2xl bg-slate-900 text-white mb-5 shadow-sm border border-slate-800">
          <Box className="flex items-center justify-between mb-2">
            <Box className="inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <T className="text-xs font-extrabold uppercase text-emerald-400">
                {isUrdu ? 'فعال پیکج' : 'Active Subscription'}
              </T>
            </Box>
            <T className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase">
              {currentSub.plan}
            </T>
          </Box>

          <Box className="text-sm font-bold text-white mb-1">
            {isUrdu ? 'اسکینز کوٹا:' : 'Scan Quota:'} {currentSub.monthlyUsed} / {currentSub.monthlyQuota}
          </Box>

          {currentSub.expiresAt && (
            <T className="text-[11px] text-slate-400">
              {isUrdu ? 'تجدید کی تاریخ:' : 'Expires On:'} {new Date(currentSub.expiresAt).toLocaleDateString()}
            </T>
          )}
        </Box>
      )}

      {/* Billing Cycle Toggle */}
      <Box className="flex items-center justify-center gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5 border border-slate-200">
        <Btn
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition ${
            billingCycle === 'monthly'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {isUrdu ? 'ماہانہ بلنگ' : 'Monthly Billing'}
        </Btn>
        <Btn
          type="button"
          onClick={() => setBillingCycle('yearly')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            billingCycle === 'yearly'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <T>{isUrdu ? 'سالانہ پلان' : 'Yearly Plan'}</T>
          <T className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-black uppercase">
            29% OFF
          </T>
        </Btn>
      </Box>

      {/* Plans Grid */}
      <Box className="space-y-4 mb-6">
        {(Object.keys(plans) as Array<keyof typeof plans>).map((planKey) => {
          const p = plans[planKey];
          const isSelected = selectedPlan === planKey;
          const price = billingCycle === 'yearly' ? p.yearlyPrice : p.monthlyPrice;

          return (
            <Box
              key={planKey}
              onClick={() => setSelectedPlan(planKey)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer relative ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
              }`}
            >
              {p.popular && (
                <T className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-slate-900 text-white font-extrabold text-[10px] border border-slate-700">
                  {p.badge}
                </T>
              )}

              <Box className="flex items-center justify-between mb-2">
                <T className={`font-extrabold text-base ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {p.name}
                </T>
              </Box>

              <Box className="mb-3">
                <T className={`text-2xl font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  PKR {price.toLocaleString()}
                </T>
                <T className={`text-xs ml-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  /{billingCycle === 'yearly' ? (isUrdu ? 'سال' : 'year') : (isUrdu ? 'ماہ' : 'month')}
                </T>

                {billingCycle === 'yearly' && (
                  <T className={`text-xs font-bold block mt-1 ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                    {isUrdu ? `سالانہ بچت: PKR ${p.savings}` : `Yearly Savings: PKR ${p.savings}`}
                  </T>
                )}
              </Box>

              <Box className={`text-xs font-bold mb-3 pb-2 border-b ${isSelected ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'}`}>
                {p.scans}
              </Box>

              <Box className="space-y-2 text-xs">
                {p.features.map((feat, idx) => (
                  <Box key={idx} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <T className={isSelected ? 'text-slate-200' : 'text-slate-600'}>{feat}</T>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Local Payment Selection */}
      <Box className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mb-6">
        <T className="block text-xs font-bold text-slate-700 mb-2">
          {isUrdu ? 'پاکستان مقامی ادائیگی کے طریقے' : 'Pakistan Payment Options'}
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
                className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  active
                    ? 'border-slate-900 bg-white text-slate-900 shadow-2xs font-extrabold'
                    : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
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
              ? (isUrdu ? 'بینک ٹرانزیکشن ریفرنس ID' : 'Bank Transfer Reference ID')
              : (isUrdu ? 'موبائل والٹ نمبر (03XXXXXXXXX)' : 'Mobile Wallet Number (03XX-XXXXXXX)')
          }
          className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
        />
      </Box>

      {/* Subscribe CTA */}
      {success ? (
        <Box className="p-4 rounded-2xl bg-emerald-600 text-white text-center font-extrabold text-sm flex items-center justify-center gap-2">
          <Check className="w-5 h-5" />
          <T>{isUrdu ? 'پیکج کامیابی سے فعال ہو گیا!' : 'Subscription Activated Successfully!'}</T>
        </Box>
      ) : (
        <Btn
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base shadow-sm transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <T>{isUrdu ? 'پروسیسنگ...' : 'Processing Payment...'}</T>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <T>
                {isUrdu
                  ? `PKR ${plans[selectedPlan][billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice'].toLocaleString()} ادا کریں`
                  : `Subscribe for PKR ${plans[selectedPlan][billingCycle === 'yearly' ? 'yearlyPrice' : 'monthlyPrice'].toLocaleString()}`}
              </T>
            </>
          )}
        </Btn>
      )}
    </Box>
  );
};
