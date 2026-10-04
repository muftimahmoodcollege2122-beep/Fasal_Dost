// ─────────────────────────────────────────────────────────────────────────────
// src/screens/ResultScreen.tsx
// Displays AI disease diagnosis result with English audio reader and share (Professional White)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import { NativeAudio, copyText, shareText, nativeSpeak, nativeSpeakStop } from '../utils/native';
import { Box, Btn, Img, T } from '../ui/web';
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
  Loader2,
} from '../ui/icons';
import { Language, t } from '../utils/i18n';
import { getImage, saveToHistory, DetectionResult, DiseaseInfo } from '../utils/store';
import { apiClient } from '../shared/apiClient';

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
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const savedRef = useRef(false);
  const audioPlayerRef = useRef<NativeAudio | null>(null);
  const audioCacheRef = useRef<Map<string, string>>(new Map());

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

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      nativeSpeakStop();
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
    if (!d) {
      return lang === 'ur'
        ? `فصل دوست: فصل مکمل صحت مند اور بیماریوں سے پاک ہے۔`
        : `FasalDost: Crop is healthy and free of disease.`;
    }

    const diseaseName = (lang !== 'en' && d.disease_name_localized) || (lang === 'ur' && d.disease_name_ur) || d.disease_name_en;
    const treatments = (lang !== 'en' && d.treatment_localized && d.treatment_localized.length > 0) ? d.treatment_localized : (d.treatment_en || []);
    const prevention = (lang !== 'en' && result.prevention_localized) || (lang === 'ur' && result.prevention_ur) || result.prevention_en;

    const lines = [
      `FasalDost — ${t('diagnosis', lang)}`,
      '',
      `${t('disease', lang)}: ${diseaseName}`,
      `${t('severity', lang)}: ${t(d.severity || 'low', lang)}`,
      '',
      `${t('treatment', lang)}:`,
      ...treatments.map((s) => `• ${s}`),
      '',
      `${t('prevention', lang)}: ${prevention || 'Follow crop rotation and hygiene.'}`,
      '',
      '— Generated via FasalDost Agritech',
    ];
    return lines.join('\n');
  };

  const handleShare = async () => {
    const text = buildShareText();
    if (await shareText('FasalDost Diagnosis', text)) return;
    if (await copyText(text)) {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    } else {
      alert(text);
    }
  };

  const buildSpokenText = (targetLang: Language): string => {
    // Rejection / Non-Plant / Blurry
    if (result.rejection_code && result.rejection_code !== 'NONE') {
      const reason =
        (targetLang !== 'en' && result.rejection_reason_localized) ||
        (targetLang === 'ur' && result.rejection_reason_ur) ||
        result.rejection_reason_en ||
        '';
      switch (targetLang) {
        case 'ur':
          return `تصویر واضح نہیں ہے یا پودے کی نہیں ہے۔ ${reason}۔ براہ کرم فصل یا پتے کی نئی صاف تصویر لیں۔`;
        case 'zh':
          return `检测未通过：${reason}。请重新拍摄或上传清晰的农作物叶片照片。`;
        case 'hi':
          return `छवि स्पष्ट नहीं है या पौधे की नहीं है। ${reason}। कृपया स्पष्ट नई तस्वीर लें।`;
        case 'es':
          return `Imagen no válida: ${reason}. Por favor tome una foto clara del cultivo.`;
        case 'ar':
          return `الصورة غير واضحة أو غير نباتية. ${reason}. يرجى التقاط صورة واضحة لورقة النبات.`;
        case 'en':
        default:
          return `Image rejected: ${reason}. Please capture a sharp and clear photograph of a crop leaf.`;
      }
    }

    // Healthy crop
    if (result.is_healthy) {
      const crop =
        (targetLang !== 'en' && result.crop_detected_localized) ||
        (targetLang === 'ur' && result.crop_detected_ur) ||
        result.crop_detected_en ||
        cropName ||
        '';
      const prev =
        (targetLang !== 'en' && result.prevention_localized) ||
        (targetLang === 'ur' && result.prevention_ur) ||
        result.prevention_en ||
        '';

      switch (targetLang) {
        case 'ur':
          return `آپ کی فصل ${crop ? `(${crop}) ` : ''}مکمل تندرست اور صحت مند ہے۔ کسی قسم کی بیماری یا کیڑوں کے مضر اثرات نہیں پائے گئے۔ ${prev ? `حفاظتی تدابیر: ${prev}۔` : ''}`;
        case 'zh':
          return `您的作物${crop ? `（${crop}）` : ''}非常健康，未检测到任何病虫害。${prev ? `预防建议：${prev}。` : ''}`;
        case 'hi':
          return `आपकी फसल ${crop ? `(${crop}) ` : ''}पूरी तरह स्वस्थ है। कोई रोग या कीट नहीं पाया गया। ${prev ? `रोकथाम सलाह: ${prev}।` : ''}`;
        case 'es':
          return `Su cultivo ${crop ? `(${crop}) ` : ''}está completamente sano. No se detectó ninguna plaga ni enfermedad. ${prev ? `Prevención: ${prev}.` : ''}`;
        case 'ar':
          return `محصولك ${crop ? `(${crop}) ` : ''}سليم تمامًا وصحي. لم يتم اكتشاف أي أمراض أو آفات. ${prev ? `الإرشادات الوقائية: ${prev}.` : ''}`;
        case 'en':
        default:
          return `Your crop ${crop ? `(${crop}) ` : ''}is completely healthy. No disease or pest damage detected. ${prev ? `Prevention: ${prev}.` : ''}`;
      }
    }

    const d = currentDisease;
    if (!d) return '';

    const severityText = t(d.severity || 'low', targetLang);

    if (targetLang === 'ur') {
      const crop = (result.crop_detected_ur && result.crop_detected_ur.trim()) || (result.crop_detected_localized && result.crop_detected_localized.trim()) || result.crop_detected_en || cropName || '';
      const diseaseName = (d.disease_name_ur && d.disease_name_ur.trim()) || (d.disease_name_localized && d.disease_name_localized.trim()) || d.disease_name_en;
      const desc = (d.description_ur && d.description_ur.trim()) || (d.description_localized && d.description_localized.trim()) || d.description_en || '';
      const symptoms = (d.symptoms_ur && d.symptoms_ur.length > 0) ? d.symptoms_ur : (d.symptoms_localized && d.symptoms_localized.length > 0) ? d.symptoms_localized : (d.symptoms_en || []);
      const treatments = (d.treatment_ur && d.treatment_ur.length > 0) ? d.treatment_ur : (d.treatment_localized && d.treatment_localized.length > 0) ? d.treatment_localized : (d.treatment_en || []);
      const urgency = (d.urgency_ur && d.urgency_ur.trim()) || (d.urgency_localized && d.urgency_localized.trim()) || d.urgency_en || '';
      const prevention = (result.prevention_ur && result.prevention_ur.trim()) || (result.prevention_localized && result.prevention_localized.trim()) || result.prevention_en || '';

      const parts = [
        `فصل: ${crop || 'پودا'}۔`,
        `تشخیص شدہ بیماری: ${diseaseName}۔`,
        `خطرے کی شدت: ${severityText}۔`,
      ];
      if (desc) parts.push(`طبی معائنہ: ${desc}۔`);
      if (symptoms.length > 0) parts.push(`علامات: ${symptoms.join('، ')}۔`);
      if (treatments.length > 0) parts.push(`تجویز کردہ علاج: ${treatments.join('۔ ')}۔`);
      if (urgency) parts.push(`کارروائی کا وقت: ${urgency}۔`);
      if (prevention) parts.push(`حفاظتی تدابیر: ${prevention}۔`);
      return parts.join(' ');
    }

    if (targetLang === 'zh') {
      const crop = result.crop_detected_localized || result.crop_detected_en || cropName || '';
      const diseaseName = d.disease_name_localized || d.disease_name_en;
      const desc = d.description_localized || d.description_en || '';
      const symptoms = (d.symptoms_localized && d.symptoms_localized.length > 0) ? d.symptoms_localized : (d.symptoms_en || []);
      const treatments = (d.treatment_localized && d.treatment_localized.length > 0) ? d.treatment_localized : (d.treatment_en || []);
      const urgency = d.urgency_localized || d.urgency_en || '';
      const prevention = result.prevention_localized || result.prevention_en || '';

      const parts = [
        `作物：${crop}。`,
        `诊断结果：${diseaseName}。`,
        `严重程度：${severityText}。`,
      ];
      if (desc) parts.push(`病情评估：${desc}。`);
      if (symptoms.length > 0) parts.push(`观察症状：${symptoms.join('，')}。`);
      if (treatments.length > 0) parts.push(`推荐防治方案：${treatments.join('；')}。`);
      if (urgency) parts.push(`处理时效：${urgency}。`);
      if (prevention) parts.push(`预防措施：${prevention}。`);
      return parts.join(' ');
    }

    if (targetLang === 'hi') {
      const crop = result.crop_detected_localized || result.crop_detected_en || cropName || '';
      const diseaseName = d.disease_name_localized || d.disease_name_en;
      const desc = d.description_localized || d.description_en || '';
      const symptoms = (d.symptoms_localized && d.symptoms_localized.length > 0) ? d.symptoms_localized : (d.symptoms_en || []);
      const treatments = (d.treatment_localized && d.treatment_localized.length > 0) ? d.treatment_localized : (d.treatment_en || []);
      const urgency = d.urgency_localized || d.urgency_en || '';
      const prevention = result.prevention_localized || result.prevention_en || '';

      const parts = [
        `फसल: ${crop}।`,
        `रोग निदान: ${diseaseName}।`,
        `गंभीरता: ${severityText}।`,
      ];
      if (desc) parts.push(`मूल्यांकन: ${desc}।`);
      if (symptoms.length > 0) parts.push(`लक्षण: ${symptoms.join('। ')}।`);
      if (treatments.length > 0) parts.push(`अनुशंसित उपचार: ${treatments.join('। ')}।`);
      if (urgency) parts.push(`समय सीमा: ${urgency}।`);
      if (prevention) parts.push(`रोकथाम सलाह: ${prevention}।`);
      return parts.join(' ');
    }

    if (targetLang === 'es') {
      const crop = result.crop_detected_localized || result.crop_detected_en || cropName || '';
      const diseaseName = d.disease_name_localized || d.disease_name_en;
      const desc = d.description_localized || d.description_en || '';
      const symptoms = (d.symptoms_localized && d.symptoms_localized.length > 0) ? d.symptoms_localized : (d.symptoms_en || []);
      const treatments = (d.treatment_localized && d.treatment_localized.length > 0) ? d.treatment_localized : (d.treatment_en || []);
      const urgency = d.urgency_localized || d.urgency_en || '';
      const prevention = result.prevention_localized || result.prevention_en || '';

      const parts = [
        `Cultivo: ${crop}.`,
        `Diagnóstico: ${diseaseName}.`,
        `Nivel de riesgo: ${severityText}.`,
      ];
      if (desc) parts.push(`Evaluación: ${desc}`);
      if (symptoms.length > 0) parts.push(`Síntomas: ${symptoms.join(', ')}.`);
      if (treatments.length > 0) parts.push(`Tratamiento recomendado: ${treatments.join('. ')}.`);
      if (urgency) parts.push(`Plazo de acción: ${urgency}.`);
      if (prevention) parts.push(`Prevención: ${prevention}.`);
      return parts.join(' ');
    }

    if (targetLang === 'ar') {
      const crop = result.crop_detected_localized || result.crop_detected_en || cropName || '';
      const diseaseName = d.disease_name_localized || d.disease_name_en;
      const desc = d.description_localized || d.description_en || '';
      const symptoms = (d.symptoms_localized && d.symptoms_localized.length > 0) ? d.symptoms_localized : (d.symptoms_en || []);
      const treatments = (d.treatment_localized && d.treatment_localized.length > 0) ? d.treatment_localized : (d.treatment_en || []);
      const urgency = d.urgency_localized || d.urgency_en || '';
      const prevention = result.prevention_localized || result.prevention_en || '';

      const parts = [
        `المحصول: ${crop}.`,
        `التشخيص: ${diseaseName}.`,
        `مستوى الخطورة: ${severityText}.`,
      ];
      if (desc) parts.push(`التقييم: ${desc}`);
      if (symptoms.length > 0) parts.push(`الأعراض: ${symptoms.join('، ')}.`);
      if (treatments.length > 0) parts.push(`خطة العلاج: ${treatments.join('، ')}.`);
      if (urgency) parts.push(`الجدول الزمني: ${urgency}.`);
      if (prevention) parts.push(`الوقاية: ${prevention}.`);
      return parts.join(' ');
    }

    // Default English
    const crop = result.crop_detected_en || cropName || 'Plant';
    const diseaseName = d.disease_name_en;
    const desc = d.description_en || '';
    const symptoms = d.symptoms_en || [];
    const treatments = d.treatment_en || [];
    const urgency = d.urgency_en || '';
    const prevention = result.prevention_en || '';

    const parts = [
      `Crop: ${crop}.`,
      `Diagnosis: ${diseaseName}.`,
      `Risk level: ${severityText}.`,
    ];
    if (desc) parts.push(`Pathological assessment: ${desc}`);
    if (symptoms.length > 0) parts.push(`Symptoms observed: ${symptoms.join(', ')}.`);
    if (treatments.length > 0) parts.push(`Recommended treatments: ${treatments.join('. ')}.`);
    if (urgency) parts.push(`Action timeline: ${urgency}.`);
    if (prevention) parts.push(`Prevention advice: ${prevention}.`);
    return parts.join(' ');
  };

  const handleSpeak = async () => {
    // If currently playing, stop immediately
    if (isSpeaking) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      nativeSpeakStop();
      setIsSpeaking(false);
      return;
    }

    if (isLoadingAudio) return;

    const text = buildSpokenText(lang);
    if (!text || !text.trim()) return;

    const cacheKey = `${lang}_${result.scanCode || result.crop_detected_en || cropName}_${activeIndex}`;
    const cachedAudio = audioCacheRef.current.get(cacheKey);

    if (cachedAudio) {
      try {
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        const audio = new NativeAudio(`data:audio/wav;base64,${cachedAudio}`);
        audioPlayerRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        await audio.play();
        return;
      } catch (err) {
        console.warn('[ResultScreen] Cached audio play error, regenerating:', err);
      }
    }

    // Primary Choice: Google Studio High-Definition Human-Like Audio Synthesis
    setIsLoadingAudio(true);
    try {
      const audioRes = await apiClient.diagnostics.synthesizeSpeech(text, lang);
      if (audioRes && audioRes.audioBase64) {
        audioCacheRef.current.set(cacheKey, audioRes.audioBase64);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
        }
        const audio = new NativeAudio(`data:${audioRes.mimeType || 'audio/wav'};base64,${audioRes.audioBase64}`);
        audioPlayerRef.current = audio;
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => setIsSpeaking(false);
        setIsSpeaking(true);
        await audio.play();
        setIsLoadingAudio(false);
        return;
      }
    } catch (apiErr) {
      console.warn('[ResultScreen] Google Studio TTS error, falling back to Web Speech:', apiErr);
    } finally {
      setIsLoadingAudio(false);
    }

    // Secondary Choice: on-device speech engine
    setIsSpeaking(true);
    nativeSpeak(text, lang, () => setIsSpeaking(false));
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

        <T className="text-base font-bold text-slate-900 inline-flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-slate-800" />
          <T>{t('diagnosis', lang)}</T>
        </T>

        {/* Action icons: Audio reader + Share */}
        <Box className="flex items-center gap-2">
          {/* Audio Reader button */}
          <Btn
            onClick={handleSpeak}
            disabled={isLoadingAudio}
            title={
              isLoadingAudio
                ? (lang === 'ur' ? 'آواز تیار ہو رہی ہے...' : 'Generating audio narration...')
                : isSpeaking
                ? (lang === 'ur' ? 'آواز بند کریں' : 'Stop voice reading')
                : lang === 'ur'
                ? 'اردو آواز میں سنیں'
                : lang === 'zh'
                ? '语音播报'
                : lang === 'hi'
                ? 'बोलकर सुनें'
                : lang === 'es'
                ? 'Escuchar en voz alta'
                : lang === 'ar'
                ? 'استمع صوتياً'
                : 'Listen to Diagnosis'
            }
            className={`w-10 h-10 rounded-full border flex items-center justify-center transition active:scale-95 shadow-2xs cursor-pointer ${
              isLoadingAudio
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : isSpeaking
                ? 'bg-slate-900 text-white border-slate-900 animate-pulse ring-2 ring-emerald-500/30'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : isSpeaking ? (
              <Square className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Btn>

          {/* Share button */}
          <Btn
            onClick={handleShare}
            title="Share Result"
            className="w-10 h-10 rounded-full border border-slate-200 bg-white text-slate-700 flex items-center justify-center hover:bg-slate-50 transition active:scale-95 shadow-2xs"
          >
            <Share2 className="w-4 h-4" />
          </Btn>
        </Box>
      </Box>

      {/* Share Toast */}
      {shareToast && (
        <Box className="mb-3 p-2.5 rounded-xl bg-slate-900 text-white text-center text-xs font-bold shadow-xs inline-flex items-center justify-center gap-1.5 w-full">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <T>Diagnosis copied to clipboard</T>
        </Box>
      )}

      {/* Crop Thumbnail */}
      {imageUri ? (
        <Box className="rounded-2xl overflow-hidden mb-3 border border-slate-200 shadow-xs max-h-56 bg-slate-100">
          <Img
            src={imageUri}
            alt="Scanned Crop"
            className="w-full h-full object-cover"
          />
        </Box>
      ) : (
        <Box className="h-24 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
          <Leaf className="w-8 h-8" />
        </Box>
      )}

      {/* Rejection / Non-Plant / Unclear Image Card */}
      {result.rejection_code && result.rejection_code !== 'NONE' ? (
        <Box className="p-6 rounded-3xl border border-rose-300 bg-rose-50 text-center mb-4 shadow-sm space-y-4">
          <Box className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
            <AlertTriangle className="w-7 h-7" />
          </Box>
          <Box>
            <T className="text-lg font-black text-rose-900 mb-1">
              {result.rejection_code === 'NON_PLANT_IMAGE'
                ? (lang === 'ur' ? 'تصویر پودے یا فصل کی نہیں ہے' : lang === 'zh' ? '检测到非植物图片' : lang === 'hi' ? 'गैर-पौधे की छवि पाई गई' : lang === 'es' ? 'Imagen no vegetal detectada' : lang === 'ar' ? 'تم اكتشاف صورة غير نباتية' : 'Non-Plant Image Detected')
                : (lang === 'ur' ? 'تصویر واضح نہیں ہے' : lang === 'zh' ? '图片不清晰' : lang === 'hi' ? 'छवि स्पष्ट नहीं है' : lang === 'es' ? 'La imagen no es clara' : lang === 'ar' ? 'الصورة غير واضحة' : 'Image Is Not Clear')}
            </T>
            <T className="text-xs font-semibold text-rose-800 leading-relaxed max-w-sm mx-auto">
              {(lang !== 'en' && result.rejection_reason_localized) ||
               (lang === 'ur' && result.rejection_reason_ur) ||
               result.rejection_reason_en ||
               'Please choose a correct image of the crop leaf.'}
            </T>
          </Box>
          <Btn
            onClick={() => onNavigate('Scan')}
            className="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-xs transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <T>{lang === 'ur' ? 'نئی صاف تصویر اسکین کریں' : lang === 'zh' ? '重新拍摄清晰照片' : lang === 'hi' ? 'नई स्पष्ट तस्वीर लें' : lang === 'es' ? 'Tomar nueva foto clara' : lang === 'ar' ? 'التقاط صورة واضحة جديدة' : 'Take or Select New Photo'}</T>
          </Btn>
        </Box>
      ) : result.is_healthy ? (
        <Box className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50 text-center mb-4 shadow-2xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
          <Box>
            <Box className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 mb-1.5">
              {(lang !== 'en' && result.crop_detected_localized) || (lang === 'ur' && result.crop_detected_ur) || result.crop_detected_en || cropName || 'Crop Specimen'}
            </Box>
            <T className="text-xl font-extrabold text-emerald-950">
              {t('healthy', lang)}
            </T>
            <T className="text-xs text-emerald-800 mt-1 max-w-md mx-auto leading-relaxed">
              {lang === 'ur'
                ? 'اس پتے پر فنگس، بیکٹیریا، وائرس یا کیڑوں کے کوئی مضر اثرات نہیں پائے گئے۔ پودے کے خلیات اور رنگت مکمل صحت مند ہے۔'
                : lang === 'zh'
                ? '该作物叶片组织完好，叶绿素分布均匀，未检测到真菌、细菌、病毒或害虫侵害。'
                : lang === 'hi'
                ? 'इस फसल की पत्ती पर कोई फंगल, बैक्टीरियल, वायरल या कीट क्षति नहीं पाई गई है। पत्ती के ऊतक पूरी तरह स्वस्थ हैं।'
                : lang === 'es'
                ? 'No se detectaron daños por hongos, bacterias, virus o plagas en este follaje. El espécimen muestra tejido foliar sano.'
                : lang === 'ar'
                ? 'لم يتم اكتشاف أي أضرار فطرية أو بكتيرية أو فيروسية أو حشرية على هذه الأوراق. العينة تُظهر أنسجة نباتية سليمة تمامًا.'
                : 'No active fungal, bacterial, viral, or insect damage identified on this foliage. The specimen exhibits intact leaf tissue and active pigmentation.'}
            </T>
          </Box>

          {((lang !== 'en' && result.prevention_localized) || (lang === 'ur' && result.prevention_ur) || result.prevention_en) && (
            <Box className="mt-3 text-left rtl:text-right border-t border-emerald-200/60 pt-3">
              <T className="text-xs font-bold text-emerald-950 mb-1 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <T>{t('prevention', lang)}</T>
              </T>
              <T className="text-xs text-emerald-900 leading-relaxed">
                {(lang !== 'en' && result.prevention_localized) || (lang === 'ur' && result.prevention_ur) || result.prevention_en}
              </T>
            </Box>
          )}
        </Box>
      ) : (
        <>
          {/* Multiple disease tabs if multiple co-occurring pathogens identified */}
          {diseases.length > 1 && (
            <Box className="mb-3">
              <T className="text-[11px] text-slate-500 block mb-1 font-semibold">
                {t('multipleDetected', lang)} ({diseases.length} {lang === 'ur' ? 'امراض' : lang === 'zh' ? '种病害' : lang === 'hi' ? 'रोग' : lang === 'es' ? 'patógenos' : lang === 'ar' ? 'أمراض' : 'pathogens'})
              </T>
              <Box className="flex gap-2 overflow-x-auto pb-1">
                {diseases.map((d, i) => {
                  const tabName = (lang !== 'en' && d.disease_name_localized) || (lang === 'ur' && d.disease_name_ur) || d.disease_name_en.split('(')[0].trim() || `Pathogen ${i + 1}`;
                  return (
                    <Btn
                      key={i}
                      onClick={() => setActiveIndex(i)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border flex items-center gap-1.5 ${
                        activeIndex === i
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <T>{tabName}</T>
                      {typeof d.confidence === 'number' && d.confidence > 0 && (
                        <T className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                          activeIndex === i ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {d.confidence}%
                        </T>
                      )}
                    </Btn>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Disease Detail Card - Authentic Clinical Pathology */}
          {currentDisease ? (
            <Box className="p-4 rounded-2xl border border-slate-200 bg-white shadow-2xs mb-4 space-y-4">
              {/* Specimen and Disease Title Header */}
              <Box>
                <Box className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {((lang !== 'en' && result.crop_detected_localized) || (lang === 'ur' && result.crop_detected_ur) || result.crop_detected_en) && (
                    <T className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                      {(lang !== 'en' && result.crop_detected_localized) || (lang === 'ur' && result.crop_detected_ur) || result.crop_detected_en}
                    </T>
                  )}
                  {typeof currentDisease.confidence === 'number' && currentDisease.confidence > 0 && (
                    <T className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {currentDisease.confidence}% {lang === 'ur' ? 'درستگی کا تناسب' : lang === 'zh' ? '诊断置信度' : lang === 'hi' ? 'विश्वसनीयता' : lang === 'es' ? 'Certeza Diagnóstica' : lang === 'ar' ? 'دقة التشخيص' : 'Diagnostic Confidence'}
                    </T>
                  )}
                </Box>

                <Box className="flex items-start justify-between gap-2">
                  <Box className="flex-1">
                    <T className="text-base font-extrabold text-slate-900 inline-flex items-center gap-2">
                      <Bug className="w-4 h-4 text-slate-800 shrink-0" />
                      <T>
                        {(lang !== 'en' && currentDisease.disease_name_localized) ||
                         (lang === 'ur' && currentDisease.disease_name_ur) ||
                         currentDisease.disease_name_en}
                      </T>
                    </T>
                    {((lang !== 'en' && currentDisease.disease_name_localized) || currentDisease.disease_name_ur) && (
                      <Box className="text-xs font-semibold text-slate-500 mt-0.5">
                        {currentDisease.disease_name_en}
                      </Box>
                    )}
                  </Box>

                  <T
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 ${severityBadgeClass(
                      currentDisease.severity
                    )}`}
                  >
                    ● {t(currentDisease.severity || 'low', lang)}
                  </T>
                </Box>
              </Box>

              {/* Clinical Pathology Description */}
              {((lang !== 'en' && currentDisease.description_localized) || currentDisease.description_en) && (
                <Box className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <Box className="font-bold text-slate-900 mb-1 text-[11px] uppercase tracking-wide">
                    {lang === 'ur' ? 'طبی معائنہ' : lang === 'zh' ? '病理评估' : lang === 'hi' ? 'रोग मूल्यांकन' : lang === 'es' ? 'Evaluación Patológica' : lang === 'ar' ? 'التقييم المرضي' : 'Pathological Assessment'}
                  </Box>
                  <T>{(lang !== 'en' && currentDisease.description_localized) || currentDisease.description_en}</T>
                </Box>
              )}

              {/* Observed Foliar Symptoms */}
              {(((lang !== 'en' && currentDisease.symptoms_localized && currentDisease.symptoms_localized.length > 0) ? currentDisease.symptoms_localized : currentDisease.symptoms_en) || []).length > 0 && (
                <Box className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                  <T className="text-xs font-bold text-slate-900 mb-2 inline-flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-slate-800" />
                    <T>{t('symptoms', lang)}</T>
                  </T>
                  <Box className="space-y-1.5 text-xs text-slate-700">
                    {(((lang !== 'en' && currentDisease.symptoms_localized && currentDisease.symptoms_localized.length > 0) ? currentDisease.symptoms_localized : currentDisease.symptoms_en) || []).map((s, idx) => (
                      <Box key={idx} className="flex items-start gap-2">
                        <T className="text-rose-500 font-bold shrink-0 mt-0.5">•</T>
                        <T>{s}</T>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Prescribed Treatments & Dosages */}
              {(((lang !== 'en' && currentDisease.treatment_localized && currentDisease.treatment_localized.length > 0) ? currentDisease.treatment_localized : currentDisease.treatment_en) || []).length > 0 && (
                <Box>
                  <T className="text-xs font-bold text-slate-900 mb-2 inline-flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-slate-800" />
                    <T>{t('treatment', lang)}</T>
                  </T>
                  <Box className="space-y-2">
                    {(((lang !== 'en' && currentDisease.treatment_localized && currentDisease.treatment_localized.length > 0) ? currentDisease.treatment_localized : currentDisease.treatment_en) || []).map((step, idx) => (
                      <Box key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <T className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </T>
                        <T className="text-xs text-slate-800 leading-relaxed font-medium">
                          {step}
                        </T>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Urgent Action Timeline */}
              {((lang !== 'en' && currentDisease.urgency_localized) || currentDisease.urgency_en) && (
                <Box className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-xs text-amber-900 font-semibold leading-relaxed flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <T>{(lang !== 'en' && currentDisease.urgency_localized) || currentDisease.urgency_en}</T>
                </Box>
              )}
            </Box>
          ) : (
            <Box className="p-6 text-center text-xs text-slate-500">
              {t('error', lang)}
            </Box>
          )}

          {/* Prevention & Cultural Management Advice */}
          {((lang !== 'en' && result.prevention_localized) || (lang === 'ur' && result.prevention_ur) || result.prevention_en) && (
            <Box className="p-4 rounded-2xl border border-slate-200 bg-white mb-4 shadow-2xs">
              <T className="text-xs font-bold text-slate-900 mb-1.5 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-800" />
                <T>{t('prevention', lang)}</T>
              </T>
              <T className="text-xs text-slate-600 leading-relaxed">
                {(lang !== 'en' && result.prevention_localized) || (lang === 'ur' && result.prevention_ur) || result.prevention_en}
              </T>
            </Box>
          )}
        </>
      )}

      {/* Authentic Model Provenance Footer */}
      {(result.ai_model || result.ai_provider) && result.rejection_code === 'NONE' && (
        <Box className="text-center text-[10px] text-slate-400 font-mono mb-2">
          Diagnostic Evaluation Engine: {result.ai_provider === 'openrouter' ? `OpenRouter (${result.ai_model})` : (result.ai_model || 'Google Gemini Vision')}
        </Box>
      )}

      {/* Scan Again Button */}
      <Btn
        onClick={() => onNavigate('Home')}
        className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800 text-white p-4 font-extrabold text-base shadow-sm transition active:scale-[0.98] mt-2 inline-flex items-center justify-center gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        <T>{t('scanAgain', lang)}</T>
      </Btn>
    </Box>
  );
};
