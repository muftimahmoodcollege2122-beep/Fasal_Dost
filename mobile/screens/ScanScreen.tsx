// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ScanScreen.tsx
// Crop selector & AI disease detection trigger screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { pickMedia, chooseSource } from '../utils/media';
import { Box, Btn, Img, Inp, T } from '../ui/web';
import {
  ArrowLeft,
  Sparkles,
  Camera,
  RefreshCw,
  Sprout,
  ChevronDown,
  AlertCircle,
  X,
  Loader2,
} from '../ui/icons';
import { Language, t, CROPS } from '../utils/i18n';
import {
  getImage,
  checkDailyLimit,
  incrementDailyCount,
  setImage,
} from '../utils/store';
import { detectDisease } from '../utils/api';
import { SubscriptionModal } from '../components/SubscriptionModal';

interface ScanScreenProps {
  lang: Language;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({
  lang,
  onNavigate,
  onBack,
}) => {
  const { uri: imageUri, base64: imageBase64 } = getImage();
  const [cropInput, setCropInput] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState<'unclear' | 'non_plant' | 'limit' | 'general' | null>(null);
  const [scansRemaining, setScansRemaining] = useState(7);
  const [, setImgTick] = useState(0);

  useEffect(() => {
    checkDailyLimit().then((status) => setScansRemaining(status.remaining));
  }, []);

  const handleRetakeImage = async () => {
    const source = await chooseSource();
    if (!source) return;
    const [img] = await pickMedia({ source });
    if (!img) return;
    setErrorMsg('');
    setErrorType(null);
    setImage(img.dataUrl, img.base64);
    setImgTick((n) => n + 1);
  };

  const handleDetect = async () => {
    if (!imageUri || !imageBase64) {
      setErrorMsg(t('noImage', lang));
      setErrorType('general');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setErrorType(null);

    try {
      const limitStatus = await checkDailyLimit();
      if (!limitStatus.allowed) {
        setErrorMsg(t('dailyLimitError', lang));
        setErrorType('limit');
        setSubModalOpen(true);
        setLoading(false);
        return;
      }

      const result = await detectDisease(imageBase64, cropInput, lang);
      await incrementDailyCount();

      onNavigate('Result', { result, cropName: cropInput });
    } catch (err: any) {
      console.warn('[ScanScreen] Disease detection response/error:', err);

      if (
        err.code === 'DAILY_SCAN_LIMIT_EXCEEDED' ||
        err.status === 429 ||
        err.message?.includes('7')
      ) {
        setErrorType('limit');
        setErrorMsg(err.message || t('dailyLimitError', lang));
        setSubModalOpen(true);
      } else if (
        err.code === 'UNCLEAR_IMAGE' ||
        err.message === 'UNCLEAR_IMAGE' ||
        err.message?.toLowerCase().includes('clear') ||
        err.message?.toLowerCase().includes('blurry')
      ) {
        setErrorType('unclear');
        setErrorMsg(err.message || t('imageBlurry', lang));
      } else if (
        err.code === 'NON_PLANT_IMAGE' ||
        err.message === 'NON_PLANT_IMAGE' ||
        err.message?.toLowerCase().includes('plant')
      ) {
        setErrorType('non_plant');
        setErrorMsg(err.message || t('imageNotPlant', lang));
      } else {
        setErrorType('general');
        setErrorMsg(err.message || t('networkError', lang));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="flex flex-col min-h-full pb-10">

      {/* Header */}
      <Box className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        <Btn
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </Btn>

        <T className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <T>{t('analyzeBtn', lang)}</T>
        </T>

        {/* Daily scan counter badge */}
        <Box className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
          {scansRemaining}/7
        </Box>
      </Box>

      {/* Crop Image Preview */}
      {imageUri ? (
        <Box className="relative rounded-2xl overflow-hidden mb-4 border border-slate-200 shadow-sm bg-slate-100 aspect-video max-h-64">
          <Img
            src={imageUri}
            alt="Crop sample"
            className="w-full h-full object-cover"
          />
          <Btn
            onClick={() => handleRetakeImage()}
            className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs py-2 inline-flex items-center justify-center gap-1.5 text-center text-xs text-white font-medium hover:bg-slate-900/90 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <T>{t('tapToChange', lang)}</T>
          </Btn>
        </Box>
      ) : (
        <Box
          onClick={() => handleRetakeImage()}
          className="h-44 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 mb-4 cursor-pointer hover:bg-slate-100/70 transition"
        >
          <Camera className="w-8 h-8 text-slate-400" />
          <T className="text-xs text-slate-500">{t('noImage', lang)}</T>
        </Box>
      )}

      {/* Prominent Image Rejection & Error Warning Banner */}
      {errorMsg && (
        <Box
          className={`p-4 rounded-2xl border mb-4 shadow-sm ${
            errorType === 'unclear' || errorType === 'non_plant'
              ? 'border-rose-300 bg-rose-50/95 text-rose-950'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <Box className="flex items-start gap-3">
            <Box className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </Box>
            <Box className="flex-1">
              <T className="text-xs font-black uppercase tracking-wider text-rose-700 mb-1">
                {errorType === 'unclear'
                  ? (lang === 'ur' ? 'تصویر واضح نہیں ہے' : 'Image Not Clear')
                  : errorType === 'non_plant'
                  ? (lang === 'ur' ? 'ناقص تصویر — پودے کی نہیں' : 'Non-Plant Image Detected')
                  : (lang === 'ur' ? 'انتباہ' : 'Notice')}
              </T>
              <T className="text-xs font-semibold leading-relaxed mb-3">
                {errorMsg}
              </T>
              <Btn
                type="button"
                onClick={() => handleRetakeImage()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <T>
                  {errorType === 'non_plant'
                    ? (lang === 'ur' ? 'پودے کی درست تصویر منتخب کریں' : 'Choose Correct Plant Photo')
                    : (lang === 'ur' ? 'نئی صاف تصویر لیں' : 'Take New Clear Photo')}
                </T>
              </Btn>
            </Box>
          </Box>
        </Box>
      )}

      {/* Crop Selector Card */}
      <Box className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs mb-4">
        <T className="block text-xs font-bold text-slate-900 mb-2 inline-flex items-center gap-1.5">
          <Sprout className="w-4 h-4 text-slate-800" />
          <T>{t('selectCrop', lang)}</T>
        </T>

        {/* Dropdown opener */}
        <Btn
          onClick={() => setCropModalOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 hover:border-slate-300 hover:bg-white transition mb-3"
        >
          <T className={cropInput ? 'text-slate-900 font-medium' : 'text-slate-400'}>
            {cropInput || t('cropHint', lang)}
          </T>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </Btn>

        <T className="text-xs text-slate-500 mb-1.5">{t('typeManually', lang)}</T>

        {/* Manual text input */}
        <Inp
          type="text"
          value={cropInput}
          onChange={(e) => setCropInput(e.target.value)}
          placeholder={t('cropHint', lang)}
          className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition"
        />
      </Box>

      {/* Detect Button */}
      <Btn
        onClick={handleDetect}
        disabled={loading}
        className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white p-4 font-extrabold text-base shadow-sm transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 text-white" />
            <T>{t('analyzing', lang)}...</T>
          </>
        ) : (
          <Box className="inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <T>{t('analyzeBtn', lang)}</T>
          </Box>
        )}
      </Btn>

      {/* Crop Selection Modal */}
      {cropModalOpen && (
        <Box className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <Box className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[75vh] flex flex-col p-4 shadow-2xl">
            <Box className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <T className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
                <Sprout className="w-4 h-4 text-slate-800" />
                <T>{t('selectCrop', lang)}</T>
              </T>
              <Btn
                onClick={() => setCropModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </Btn>
            </Box>

            <Box className="overflow-y-auto divide-y divide-slate-100">
              {CROPS.map((crop) => (
                <Btn
                  key={crop.en}
                  onClick={() => {
                    setCropInput(crop.name || crop.en);
                    setCropModalOpen(false);
                  }}
                  className="w-full py-3 px-3 text-left text-sm text-slate-800 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <T className="font-semibold text-slate-900">
                    {crop.name || crop.en}
                  </T>
                  <T className="text-xs text-slate-400">
                    Select
                  </T>
                </Btn>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* Subscription Modal Popup */}
      <SubscriptionModal
        isOpen={subModalOpen}
        onClose={() => setSubModalOpen(false)}
        lang={lang}
        reasonMsg={errorMsg}
        onSubscribed={() => {
          checkDailyLimit().then((status) => setScansRemaining(status.remaining));
        }}
      />
    </Box>
  );
};
