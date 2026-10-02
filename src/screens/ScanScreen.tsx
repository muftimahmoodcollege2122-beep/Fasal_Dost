// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ScanScreen.tsx
// Crop selector & AI disease detection trigger screen
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Camera,
  RefreshCw,
  Sprout,
  ChevronDown,
  AlertCircle,
  X,
} from 'lucide-react';
import { Language, t, CROPS } from '../utils/i18n';
import {
  getImage,
  checkDailyLimit,
  incrementDailyCount,
  setImage,
} from '../utils/store';
import { detectDisease } from '../utils/api';

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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState<'unclear' | 'non_plant' | 'limit' | 'general' | null>(null);
  const [scansRemaining, setScansRemaining] = useState(10);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkDailyLimit().then((status) => setScansRemaining(status.remaining));
  }, []);

  const handleRetakeImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg('');
    setErrorType(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      setImage(dataUrl, base64);
    };
    reader.readAsDataURL(file);
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
        setErrorMsg(`Daily scan limit reached (${limitStatus.limit} scans/day). Please try again tomorrow.`);
        setErrorType('limit');
        setLoading(false);
        return;
      }

      const result = await detectDisease(imageBase64, cropInput);
      await incrementDailyCount();

      onNavigate('Result', { result, cropName: cropInput });
    } catch (err: any) {
      console.warn('[ScanScreen] Disease detection response/error:', err);

      if (
        err.code === 'UNCLEAR_IMAGE' ||
        err.message === 'UNCLEAR_IMAGE' ||
        err.message?.toLowerCase().includes('not clear') ||
        err.message?.toLowerCase().includes('blurry')
      ) {
        setErrorType('unclear');
        setErrorMsg(
          lang === 'ur'
            ? (err.ur || 'تصویر واضح یا صاف نہیں ہے۔ براہ کرم نئی صاف تصویر لیں۔')
            : (err.message || 'The image is not clear. Please take a new clear image.')
        );
      } else if (
        err.code === 'NON_PLANT_IMAGE' ||
        err.message === 'NON_PLANT_IMAGE' ||
        err.message?.toLowerCase().includes('not related to plants')
      ) {
        setErrorType('non_plant');
        setErrorMsg(
          lang === 'ur'
            ? (err.ur || 'براہ کرم پودوں یا فصل سے متعلق درست تصویر منتخب کریں۔ اپ لوڈ کردہ تصویر کسی فصل یا پودے کی نہیں ہے۔')
            : (err.message || 'Please choose a correct image. The uploaded photo is not related to plants or crops.')
        );
      } else if (err.message === 'LOW_CONFIDENCE') {
        setErrorType('unclear');
        setErrorMsg(t('unclearImage', lang));
      } else if (err.message === 'NETWORK_ERROR') {
        setErrorType('general');
        setErrorMsg(t('networkError', lang));
      } else {
        setErrorType('general');
        setErrorMsg(err.message || `${t('error', lang)}: Detection failed`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Hidden file input for retaking photo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleRetakeImage}
      />

      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>

        <h2 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>{t('analyzeBtn', lang)}</span>
        </h2>

        {/* Daily scan counter badge */}
        <div className="px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700">
          {scansRemaining}/10
        </div>
      </div>

      {/* Crop Image Preview */}
      {imageUri ? (
        <div className="relative rounded-2xl overflow-hidden mb-4 border border-slate-200 shadow-sm bg-slate-100 aspect-video max-h-64">
          <img
            src={imageUri}
            alt="Crop sample"
            className="w-full h-full object-cover"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 inset-x-0 bg-slate-900/80 backdrop-blur-xs py-2 inline-flex items-center justify-center gap-1.5 text-center text-xs text-white font-medium hover:bg-slate-900/90 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t('tapToChange', lang)}</span>
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="h-44 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center gap-2 mb-4 cursor-pointer hover:bg-slate-100/70 transition"
        >
          <Camera className="w-8 h-8 text-slate-400" />
          <span className="text-xs text-slate-500">{t('noImage', lang)}</span>
        </div>
      )}

      {/* Prominent Image Rejection & Error Warning Banner */}
      {errorMsg && (
        <div
          className={`p-4 rounded-2xl border mb-4 shadow-sm ${
            errorType === 'unclear' || errorType === 'non_plant'
              ? 'border-rose-300 bg-rose-50/95 text-rose-950'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-rose-700 mb-1">
                {errorType === 'unclear'
                  ? (lang === 'ur' ? 'تصویر واضح نہیں ہے' : 'Image Not Clear')
                  : errorType === 'non_plant'
                  ? (lang === 'ur' ? 'ناقص تصویر — پودے کی نہیں' : 'Non-Plant Image Detected')
                  : (lang === 'ur' ? 'انتباہ' : 'Notice')}
              </h4>
              <p className="text-xs font-semibold leading-relaxed mb-3">
                {errorMsg}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {errorType === 'non_plant'
                    ? (lang === 'ur' ? 'پودے کی درست تصویر منتخب کریں' : 'Choose Correct Plant Photo')
                    : (lang === 'ur' ? 'نئی صاف تصویر لیں' : 'Take New Clear Photo')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Crop Selector Card */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs mb-4">
        <label className="block text-xs font-bold text-slate-900 mb-2 inline-flex items-center gap-1.5">
          <Sprout className="w-4 h-4 text-slate-800" />
          <span>{t('selectCrop', lang)}</span>
        </label>

        {/* Dropdown opener */}
        <button
          onClick={() => setCropModalOpen(true)}
          className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-800 hover:border-slate-300 hover:bg-white transition mb-3"
        >
          <span className={cropInput ? 'text-slate-900 font-medium' : 'text-slate-400'}>
            {cropInput || t('cropHint', lang)}
          </span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>

        <p className="text-xs text-slate-500 mb-1.5">{t('typeManually', lang)}</p>

        {/* Manual text input */}
        <input
          type="text"
          value={cropInput}
          onChange={(e) => setCropInput(e.target.value)}
          placeholder={t('cropHint', lang)}
          className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-slate-900 transition"
        />
      </div>

      {/* Detect Button */}
      <button
        onClick={handleDetect}
        disabled={loading}
        className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white p-4 font-extrabold text-base shadow-sm transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <span>{t('analyzing', lang)}...</span>
          </>
        ) : (
          <div className="inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span>{t('analyzeBtn', lang)}</span>
          </div>
        )}
      </button>

      {/* Crop Selection Modal */}
      {cropModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex flex-col justify-end sm:items-center sm:justify-center p-0 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[75vh] flex flex-col p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
              <h3 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
                <Sprout className="w-4 h-4 text-slate-800" />
                <span>{t('selectCrop', lang)}</span>
              </h3>
              <button
                onClick={() => setCropModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100">
              {CROPS.map((crop) => (
                <button
                  key={crop.en}
                  onClick={() => {
                    setCropInput(crop.name || crop.en);
                    setCropModalOpen(false);
                  }}
                  className="w-full py-3 px-3 text-left text-sm text-slate-800 hover:bg-slate-50 transition flex items-center justify-between"
                >
                  <span className="font-semibold text-slate-900">
                    {crop.name || crop.en}
                  </span>
                  <span className="text-xs text-slate-400">
                    Select
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
