// ─────────────────────────────────────────────────────────────────────────────
// src/screens/HomeScreen.tsx
// Main Landing Screen for FasalDost (Professional White Edition)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { pickMedia } from '../utils/media';
import { Box, Btn, Inp, T } from '../ui/web';
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
} from '../ui/icons';
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

  const pickAndScan = async (source: 'camera' | 'gallery') => {
    const [img] = await pickMedia({ source });
    if (!img) return;
    setImage(img.dataUrl, img.base64);
    onNavigate('Scan');
  };

  return (
    <Box className="flex flex-col min-h-full pb-10">

      {/* Top Bar: Clean Action Icons */}
      <Box className="flex items-center justify-between py-2 mb-4 border-b border-slate-100 pb-3">
        <Box className="flex items-center gap-2">
          <Box className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
            FD
          </Box>
          <T className="text-xs font-bold text-slate-700 tracking-wide uppercase">
            {t('agritechAi', lang)}
          </T>
        </Box>

        <Box className="flex items-center gap-2">
          {/* Recent Scans / History Icon */}
          <Btn
            onClick={() => onNavigate('History')}
            title="Recent Scans"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <History className="w-4 h-4" />
          </Btn>

          {/* Marketplace Icon */}
          <Btn
            onClick={() => onNavigate('Marketplace')}
            title="Marketplace"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <Store className="w-4 h-4" />
          </Btn>

          {/* Settings Icon (Houses Farmer Profile & Preferences) */}
          <Btn
            onClick={() => onNavigate('Settings')}
            title="Settings & Farmer Profile"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </Btn>
        </Box>
      </Box>

      {/* Hero Section */}
      <Box className="flex flex-col items-center text-center my-3">
        <Box className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 shadow-xs text-slate-900">
          <Sprout className="w-8 h-8" />
        </Box>
        <T className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
          {t('appName', lang)}
        </T>

        {farmerName && (
          <T className="text-sm font-semibold text-slate-700 mb-1">
            {t('welcomeBack', lang)}, {farmerName}
          </T>
        )}

        <T className="text-xs text-slate-500 max-w-xs leading-relaxed">
          {t('subtitle', lang)}
        </T>
      </Box>

      {/* Primary Actions */}
      <Box className="flex flex-col gap-3 my-4">
        {/* Take Photo Button - Solid Professional Dark CTA */}
        <Btn
          onClick={() => pickAndScan('camera')}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-base shadow-sm transition active:scale-[0.98] cursor-pointer"
        >
          <Camera className="w-5 h-5 shrink-0" />
          <T>{t('takePhoto', lang)}</T>
        </Btn>

        {/* Upload from Gallery Button - Professional Crisp White */}
        <Btn
          onClick={() => pickAndScan('gallery')}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl border border-slate-200 bg-white text-slate-800 font-bold text-sm hover:bg-slate-50 transition active:scale-[0.98] shadow-2xs cursor-pointer"
        >
          <ImageIcon className="w-5 h-5 text-slate-700 shrink-0" />
          <T>{t('uploadPhoto', lang)}</T>
        </Btn>

        {/* Marketplace Promo Banner - Clean Crisp Card */}
        <Btn
          onClick={() => onNavigate('Marketplace')}
          className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50/80 transition active:scale-[0.98] shadow-2xs text-start cursor-pointer"
        >
          <Box className="flex items-center gap-3">
            <Box className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 shrink-0">
              <Store className="w-5 h-5" />
            </Box>
            <Box>
              <T className="font-extrabold text-slate-900 text-sm">
                {t('marketplace', lang)}
              </T>
              <T className="text-xs text-slate-500 mt-0.5">
                {t('marketplaceSubtitle', lang)}
              </T>
            </Box>
          </Box>
          <Box className="text-slate-400">
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </Box>
        </Btn>
      </Box>

      {/* How It Works Section */}
      <Box className="mt-2 p-4 rounded-2xl border border-slate-200 bg-slate-50/80">
        <T className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
          {t('howItWorks', lang)}
        </T>
        <Box className="grid grid-cols-3 gap-2 text-center">
          <Box className="flex flex-col items-center">
            <Box className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs text-slate-700">
              <Camera className="w-4 h-4" />
            </Box>
            <T className="text-xs font-bold text-slate-800 mb-0.5">{t('step1Title', lang)}</T>
            <T className="text-[11px] text-slate-500 leading-tight">{t('step1Desc', lang)}</T>
          </Box>
          <Box className="flex flex-col items-center">
            <Box className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs text-slate-700">
              <Sparkles className="w-4 h-4" />
            </Box>
            <T className="text-xs font-bold text-slate-800 mb-0.5">{t('step2Title', lang)}</T>
            <T className="text-[11px] text-slate-500 leading-tight">{t('step2Desc', lang)}</T>
          </Box>
          <Box className="flex flex-col items-center">
            <Box className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs text-slate-700">
              <ShieldCheck className="w-4 h-4" />
            </Box>
            <T className="text-xs font-bold text-slate-800 mb-0.5">{t('step3Title', lang)}</T>
            <T className="text-[11px] text-slate-500 leading-tight">{t('step3Desc', lang)}</T>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
