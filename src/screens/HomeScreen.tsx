// ─────────────────────────────────────────────────────────────────────────────
// src/screens/HomeScreen.tsx
// Main Landing Screen for FasalDost (Professional White Edition)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState, useEffect } from 'react';
import {
  Store,
  History,
  User,
  Settings,
  Sprout,
  Camera,
  Image as ImageIcon,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { Language, t } from '../utils/i18n';
import { setImage, getFarmerProfile, isProfileComplete } from '../utils/store';

interface HomeScreenProps {
  lang: Language;
  onNavigate: (screen: string, params?: any) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  lang,
  onNavigate,
}) => {
  const [farmerName, setFarmerName] = useState('');
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const complete = await isProfileComplete();
      if (!complete) {
        onNavigate('FarmerProfile', { onboarding: true });
        return;
      }
      const profile = await getFarmerProfile();
      if (profile?.name) {
        setFarmerName(profile.name);
      }
    })();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      setImage(dataUrl, base64);
      onNavigate('Scan');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Top Bar: Clean Action Icons */}
      <div className="flex items-center justify-between py-2 mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            FD
          </div>
          <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
            {t('agritechAi', lang)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Recent Scans / History Icon */}
          <button
            onClick={() => onNavigate('History')}
            title="Recent Scans"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>

          {/* Marketplace Icon */}
          <button
            onClick={() => onNavigate('Marketplace')}
            title="Marketplace"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <Store className="w-4 h-4" />
          </button>

          {/* Settings Icon (Houses Farmer Profile & Preferences) */}
          <button
            onClick={() => onNavigate('Settings')}
            title="Settings & Farmer Profile"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="flex flex-col items-center text-center my-3">
        <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 shadow-xs text-slate-900">
          <Sprout className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {t('appName', lang)}
        </h1>

        {farmerName && (
          <p className="text-sm font-semibold text-slate-700 mb-1">
            {t('welcomeBack', lang)}, {farmerName}
          </p>
        )}

        <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
          {t('subtitle', lang)}
        </p>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-col gap-3 my-4">
        {/* Take Photo Button - Solid Professional Dark CTA */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base shadow-sm transition active:scale-[0.98] cursor-pointer"
        >
          <Camera className="w-5 h-5 shrink-0" />
          <span>{t('takePhoto', lang)}</span>
        </button>

        {/* Upload from Gallery Button - Professional Crisp White */}
        <button
          onClick={() => galleryInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl border border-slate-200 bg-white text-slate-800 font-bold text-sm hover:bg-slate-50 transition active:scale-[0.98] shadow-2xs cursor-pointer"
        >
          <ImageIcon className="w-5 h-5 text-slate-700 shrink-0" />
          <span>{t('uploadPhoto', lang)}</span>
        </button>

        {/* Marketplace Promo Banner - Clean Crisp Card */}
        <button
          onClick={() => onNavigate('Marketplace')}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 transition active:scale-[0.98] shadow-2xs text-start cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                {t('marketplace', lang)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {t('marketplaceSubtitle', lang)}
              </p>
            </div>
          </div>
          <div className="text-slate-400">
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </div>
        </button>
      </div>

      {/* How It Works Section */}
      <div className="mt-2 p-4 rounded-2xl border border-slate-200 bg-slate-50/80">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
          {t('howItWorks', lang)}
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs text-slate-700">
              <Camera className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-0.5">{t('step1Title', lang)}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{t('step1Desc', lang)}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs text-slate-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-0.5">{t('step2Title', lang)}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{t('step2Desc', lang)}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs text-slate-700">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-800 mb-0.5">{t('step3Title', lang)}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{t('step3Desc', lang)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
