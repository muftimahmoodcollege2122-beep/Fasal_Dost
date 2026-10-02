// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ResultScreen.tsx
// Displays AI disease diagnosis result with English audio reader and share (Professional White)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Activity,
  Volume2,
  Square,
  Share2,
  CheckCircle2,
  Leaf,
  Sparkles,
  ShieldCheck,
  Bug,
  Search,
  Pill,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Language, t } from '../utils/i18n';
import { getImage, saveToHistory, DetectionResult, DiseaseInfo } from '../utils/store';

interface ResultScreenProps {
  lang: Language;
  result: DetectionResult;
  cropName: string;
  fromHistory?: boolean;
  onNavigate: (screen: string, params?: any) => void;
  onBack: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  lang,
  result = {},
  cropName = '',
  fromHistory = false,
  onNavigate,
  onBack,
}) => {
  const { uri: imageUri } = getImage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const savedRef = useRef(false);

  // Auto-save to history on mount
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    if (fromHistory) return;

    if (result && Object.keys(result).length > 0) {
      saveToHistory({ imageUri, cropName, result }).catch((e) =>
        console.warn('ResultScreen auto-save error:', e)
      );
    }
  }, []);

  // Stop speech if unmounting
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const diseases: DiseaseInfo[] = Array.isArray(result?.diseases) ? result.diseases : [];
  const currentDisease: DiseaseInfo | null =
    diseases.length > 0 ? diseases[Math.min(activeIndex, diseases.length - 1)] : null;

  const severityBadgeClass = (sev?: string) => {
    const s = sev?.toLowerCase();
    if (s === 'high') return 'bg-rose-50 text-rose-700 border-rose-200';
    if (s === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const buildShareText = () => {
    const d = currentDisease;
    if (!d) return `FasalDost: Crop is healthy and free of disease.`;

    const lines = [
      `FasalDost — Crop Disease Diagnosis`,
      '',
      `Diagnosis: ${d.disease_name_en}`,
      `Severity: ${t(d.severity || 'low', lang)}`,
      '',
      `Treatment:`,
      ...(d.treatment_en || []).map((s) => `• ${s}`),
      '',
      `Prevention: ${result.prevention_en || 'Follow crop rotation and hygiene.'}`,
      '',
      '— Generated via FasalDost Agritech',
    ];
    return lines.join('\n');
  };

  const handleShare = async () => {
    const text = buildShareText();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'FasalDost Diagnosis', text });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } catch {
      alert(text);
    }
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    const d = currentDisease;
    let text = '';
    if (result.is_healthy) {
      text = 'Your crop is completely healthy. No disease or pest damage detected.';
    } else if (d) {
      const parts = [];
      parts.push(`Diagnosis: ${d.disease_name_en}`);
      parts.push(`Risk level: ${d.severity || 'moderate'}`);
      if (d.description_en) parts.push(d.description_en);
      if (d.treatment_en?.length) {
        parts.push(`Recommended treatment: ${d.treatment_en.join('. ')}`);
      }
      if (d.urgency_en) parts.push(`Action timeline: ${d.urgency_en}`);
      if (result.prevention_en) parts.push(`Prevention advice: ${result.prevention_en}`);
      text = parts.join('. ');
    }

    if (!text) return;
    setIsSpeaking(true);

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      const speechLangMap: Record<Language, string> = {
        en: 'en-US',
        ur: 'ur-PK',
        zh: 'zh-CN',
        hi: 'hi-IN',
        es: 'es-ES',
        ar: 'ar-SA',
      };
      utterance.lang = speechLangMap[lang] || 'en-US';
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-10">
      {/* Header */}
      <div className="flex items-center justify-between py-2 mb-3 border-b border-slate-100 pb-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:bg-slate-50 transition active:scale-95 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
        </button>

        <h2 className="text-base font-bold text-slate-900 inline-flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-slate-800" />
          <span>{t('diagnosis', lang)}</span>
        </h2>

        {/* Action icons: Audio reader + Share */}
        <div className="flex items-center gap-2">
          {/* Audio Reader button */}
          <button
            onClick={handleSpeak}
            title="Read Aloud in English"
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition active:scale-95 shadow-2xs ${
              isSpeaking
                ? 'bg-slate-900 text-white border-slate-900 animate-pulse'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isSpeaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Share button */}
          <button
            onClick={handleShare}
            title="Share Result"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="mb-3 p-2.5 rounded-xl bg-slate-900 text-white text-center text-xs font-bold shadow-xs inline-flex items-center justify-center gap-1.5 w-full">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Diagnosis copied to clipboard</span>
        </div>
      )}

      {/* Crop Thumbnail */}
      {imageUri ? (
        <div className="rounded-2xl overflow-hidden mb-3 border border-slate-200 shadow-xs max-h-56 bg-slate-100">
          <img
            src={imageUri}
            alt="Scanned Crop"
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <Leaf className="w-8 h-8" />
        </div>
      )}

      {/* Rejection / Non-Plant / Unclear Image Card */}
      {result.rejection_code && result.rejection_code !== 'NONE' ? (
        <div className="p-6 rounded-3xl border border-rose-300 bg-rose-50 text-center mb-4 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-black text-rose-900 mb-1">
              {result.rejection_code === 'NON_PLANT_IMAGE'
                ? (lang === 'ur' ? 'تصویر پودے یا فصل کی نہیں ہے' : 'Non-Plant Image Detected')
                : (lang === 'ur' ? 'تصویر واضح نہیں ہے' : 'Image Is Not Clear')}
            </h3>
            <p className="text-xs font-semibold text-rose-800 leading-relaxed max-w-sm mx-auto">
              {lang === 'ur'
                ? (result.rejection_reason_ur || 'براہ کرم پودوں یا فصل سے متعلق درست تصویر منتخب کریں۔')
                : (result.rejection_reason_en || 'Please choose a correct image. The uploaded photo is not related to plants or crops.')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('Scan')}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>{lang === 'ur' ? 'نئی صاف تصویر اسکین کریں' : 'Take or Select New Photo'}</span>
          </button>
        </div>
      ) : result.is_healthy ? (
        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50 text-center mb-4 shadow-2xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1.5">
              {result.crop_detected_en ? `Specimen: ${result.crop_detected_en}` : 'Plant Specimen'}
            </div>
            <h3 className="text-xl font-extrabold text-emerald-950">
              {t('healthy', lang)}
            </h3>
            <p className="text-xs text-emerald-800 mt-1 max-w-md mx-auto leading-relaxed">
              No active fungal, bacterial, viral, or insect damage identified on this foliage. The specimen exhibits intact leaf tissue and active pigmentation.
            </p>
          </div>

          {result.prevention_en && (
            <div className="mt-3 text-left border-t border-emerald-200/60 pt-3">
              <h4 className="text-xs font-bold text-emerald-950 mb-1 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>{t('prevention', lang)}</span>
              </h4>
              <p className="text-xs text-emerald-900 leading-relaxed">
                {result.prevention_en}
              </p>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Multiple disease tabs if multiple co-occurring pathogens identified */}
          {diseases.length > 1 && (
            <div className="mb-3">
              <span className="text-[11px] text-slate-500 block mb-1 font-semibold">
                {t('multipleDetected', lang)} ({diseases.length} pathogens identified)
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {diseases.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border flex items-center gap-1.5 ${
                      activeIndex === i
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span>{d.disease_name_en.split('(')[0].trim() || `Pathogen ${i + 1}`}</span>
                    {typeof d.confidence === 'number' && d.confidence > 0 && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                        activeIndex === i ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {d.confidence}%
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Disease Detail Card - Authentic Clinical Pathology */}
          {currentDisease ? (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs mb-4 space-y-4">
              {/* Specimen and Disease Title Header */}
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {result.crop_detected_en && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {result.crop_detected_en}
                    </span>
                  )}
                  {typeof currentDisease.confidence === 'number' && currentDisease.confidence > 0 && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {currentDisease.confidence}% AI Diagnostic Confidence
                    </span>
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-base font-extrabold text-slate-900 inline-flex items-center gap-2">
                      <Bug className="w-4 h-4 text-slate-800 shrink-0" />
                      <span>{currentDisease.disease_name_en}</span>
                    </h3>
                    {currentDisease.disease_name_ur && (
                      <div className="text-xs font-semibold text-slate-600 mt-0.5">
                        {currentDisease.disease_name_ur}
                      </div>
                    )}
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 ${severityBadgeClass(
                      currentDisease.severity
                    )}`}
                  >
                    ● {t(currentDisease.severity || 'low', lang)}
                  </span>
                </div>
              </div>

              {/* Clinical Pathology Description */}
              {currentDisease.description_en && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <div className="font-bold text-slate-900 mb-1 text-[11px] uppercase tracking-wide">
                    Pathological Assessment
                  </div>
                  <p>{currentDisease.description_en}</p>
                </div>
              )}

              {/* Observed Foliar Symptoms */}
              {(currentDisease.symptoms_en || []).length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 mb-2 inline-flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-slate-800" />
                    <span>{t('symptoms', lang)}</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-700">
                    {currentDisease.symptoms_en?.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Prescribed Treatments & Dosages */}
              {(currentDisease.treatment_en || []).length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-2 inline-flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-slate-800" />
                    <span>{t('treatment', lang)}</span>
                  </h4>
                  <div className="space-y-2">
                    {currentDisease.treatment_en?.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-800 leading-relaxed font-medium">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Urgent Action Timeline */}
              {currentDisease.urgency_en && (
                <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-900 font-semibold leading-relaxed flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>{currentDisease.urgency_en}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500">
              {t('error', lang)}
            </div>
          )}

          {/* Prevention & Cultural Management Advice */}
          {result.prevention_en && (
            <div className="p-4 rounded-2xl border border-slate-200 bg-white mb-4 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 mb-1.5 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-800" />
                <span>{t('prevention', lang)}</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {result.prevention_en}
              </p>
            </div>
          )}
        </>
      )}

      {/* Authentic Model Provenance Footer */}
      {(result.ai_model || result.ai_provider) && result.rejection_code === 'NONE' && (
        <div className="text-center text-[10px] text-slate-400 font-mono mb-2">
          Diagnostic Evaluation Engine: {result.ai_provider === 'openrouter' ? `OpenRouter (${result.ai_model})` : (result.ai_model || 'Gemini 3.8 Flash Vision')}
        </div>
      )}

      {/* Scan Again Button */}
      <button
        onClick={() => onNavigate('Home')}
        className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white p-4 font-extrabold text-base shadow-sm transition active:scale-[0.98] mt-2 inline-flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        <span>{t('scanAgain', lang)}</span>
      </button>
    </div>
  );
};
