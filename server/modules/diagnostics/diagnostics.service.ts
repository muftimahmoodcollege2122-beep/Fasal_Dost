// ─────────────────────────────────────────────────────────────────────────────
// server/modules/diagnostics/diagnostics.service.ts
// AI Crop Disease Diagnostic Service with Gemini 3.8 Flash & PostgreSQL Storage
// ─────────────────────────────────────────────────────────────────────────────

import { eq, desc, and, gte, sql, or } from 'drizzle-orm';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../../../src/db/index.ts';
import { diagnosticScans, diagnosticDiseases, users } from '../../../src/db/schema.ts';
import { config } from '../../core/config';
import { AppError } from '../../core/types';
import { subscriptionsService } from '../subscriptions/subscriptions.service.ts';
import {
  IDiagnosticsModule,
  DiagnosticResultDto,
  ScanCropRequestDto,
  DiseaseDetailDto,
} from './diagnostics.interface';

const DAILY_SCAN_LIMIT = 7;
const dailyScanMemoryStore = new Map<string, number>();

function getTodayQuotaKey(identifier: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `${identifier}_${today}`;
}

const SUPPORTED_CROPS = [
  'Wheat', 'Cotton', 'Rice', 'Sugarcane', 'Maize', 'Mango',
  'Tomato', 'Potato', 'Onion', 'Chili', 'Mustard', 'Sunflower',
  'Chickpea', 'Lentil', 'Banana', 'Citrus', 'Guava', 'Okra'
];

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ur: 'Urdu (اردو)',
  zh: 'Mandarin Chinese (中文)',
  hi: 'Hindi (हिन्दी)',
  es: 'Spanish (Español)',
  ar: 'Arabic (العربية)',
};

const LOCALIZED_MESSAGES: Record<string, {
  dailyLimitExceeded: string;
  imageRequired: string;
  unclearImage: string;
  nonPlantImage: string;
  aiFailed: string;
  unclearPrevention: string;
  nonPlantPrevention: string;
}> = {
  en: {
    dailyLimitExceeded: 'Daily scan limit reached! You have used all 7 free crop scans for today. Please wait until tomorrow or upgrade to FasalDost Premium for unlimited daily scans.',
    imageRequired: 'Leaf or crop image is required.',
    unclearImage: 'The image is not clear or is too blurry. Please take a new clear close-up photograph under daylight.',
    nonPlantImage: 'Please choose a correct image. The uploaded photo does not appear to contain a plant or crop leaf.',
    aiFailed: 'AI vision models were unable to process this image right now. Please verify your connection or try with a clearer photo.',
    unclearPrevention: 'Please take a well-focused close-up photograph of the crop leaf under good daylight.',
    nonPlantPrevention: 'Please capture a clear photo of an affected crop leaf or plant stem.',
  },
  ur: {
    dailyLimitExceeded: 'روزانہ اسکین کی حد مکمل ہو گئی ہے! آپ نے آج کے تمام 7 مفت کروپ اسکینز استعمال کر لیے ہیں۔ براہ کرم کل تک انتظار کریں یا لامحدود اسکینز کے لیے فضل دوست پریمیم منتخب کریں۔',
    imageRequired: 'پودے یا فصل کی تصویر کا ہونا ضروری ہے۔',
    unclearImage: 'تصویر واضح یا صاف نہیں ہے۔ براہ کرم دن کی روشنی میں فصل کے پتے کی صاف، واضح تصویر لیں۔',
    nonPlantImage: 'براہ کرم فصل یا پودے کی درست تصویر منتخب کریں۔ اپ لوڈ کردہ تصویر کسی پودے کی نہیں ہے۔',
    aiFailed: 'اے آئی وژن ماڈل اس وقت اس تصویر کا تجزیہ نہیں کر سکا۔ براہ کرم انٹرنیٹ کنیکشن چیک کریں یا مزید واضح تصویر لیں۔',
    unclearPrevention: 'براہ کرم دن کی روشنی میں متاثرہ پتے کی قریب سے صاف تصویر بنائیں۔',
    nonPlantPrevention: 'براہ کرم فصل کے متاثرہ حصے یا تنے کی تصویر لیں تاکہ درست تشخیص ہو سکے۔',
  },
  zh: {
    dailyLimitExceeded: '已达到每日扫描上限！您今天已使用完所有 7 次免费农作物扫描。请明天再试或升级到 FasalDost 高级版享受无限扫描。',
    imageRequired: '必须提供植物或农作物叶片照片。',
    unclearImage: '图像不清晰或模糊。请在充足日光下重新拍摄一张清晰的农作物近照。',
    nonPlantImage: '请选择正确的图片。上传的照片似乎不包含植物或农作物叶片。',
    aiFailed: '人工智能视觉模型目前无法处理此图像。请检查网络连接或更换更清晰的照片。',
    unclearPrevention: '请在日光下拍摄农作物叶片清晰对焦的近距离照片。',
    nonPlantPrevention: '请拍摄受影响的农作物叶片或植物茎部的清晰照片。',
  },
  hi: {
    dailyLimitExceeded: 'दैनिक स्कैन सीमा समाप्त हो गई है! आपने आज के सभी 7 मुफ़्त फसल स्कैन का उपयोग कर लिया है। कृपया कल तक प्रतीक्षा करें या असीमित स्कैन के लिए FasalDost प्रीमियम में अपग्रेड करें।',
    imageRequired: 'पौधे या फसल की तस्वीर आवश्यक है।',
    unclearImage: 'छवि स्पष्ट या धुंधली नहीं है। कृपया दिन के उजाले में फसल की पत्ती की एक नई स्पष्ट तस्वीर लें।',
    nonPlantImage: 'कृपया सही छवि चुनें। अपलोड की गई तस्वीर में कोई पौधा या फसल की पत्ती दिखाई नहीं दे रही है।',
    aiFailed: 'एआई विज़न मॉडल अभी इस छवि को प्रोसेस करने में असमर्थ है। कृपया अपना कनेक्शन जांचें या अधिक स्पष्ट फोटो के साथ प्रयास करें।',
    unclearPrevention: 'कृपया दिन के उजाले में फसल की पत्ती की स्पष्ट फोकस वाली क्लोज़-अप तस्वीर लें।',
    nonPlantPrevention: 'कृपया प्रभावित फसल की पत्ती या तने की स्पष्ट तस्वीर लें।',
  },
  es: {
    dailyLimitExceeded: '¡Límite diario de escaneos alcanzado! Ha utilizado los 7 escaneos de cultivos gratuitos de hoy. Por favor, espere hasta mañana o actualice a FasalDost Premium para escaneos ilimitados.',
    imageRequired: 'Se requiere una imagen de la hoja o cultivo.',
    unclearImage: 'La imagen no es clara o está borrosa. Por favor, tome una nueva fotografía clara en primer plano bajo luz diurna.',
    nonPlantImage: 'Por favor, elija una imagen correcta. La foto cargada no parece contener una planta o hoja de cultivo.',
    aiFailed: 'Los modelos de visión por IA no pudieron procesar esta imagen en este momento. Verifique su conexión o intente con una foto más clara.',
    unclearPrevention: 'Tome una fotografía enfocada y en primer plano de la hoja del cultivo bajo luz natural.',
    nonPlantPrevention: 'Capture una foto clara de una hoja o tallo de cultivo afectado.',
  },
  ar: {
    dailyLimitExceeded: 'تم الوصول إلى الحد اليومي للمسح! لقد استخدمت جميع المسوحات المجانية السبعة للمحاصيل لهذا اليوم. يرجى الانتظار حتى الغد أو الترقية إلى FasalDost Premium للحصول على مسح غير محدود.',
    imageRequired: 'صورة النبات أو المحصول مطلوبة.',
    unclearImage: 'الصورة غير واضحة أو ضبابية. يرجى التقاط صورة مكبرة واضحة جديدة في ضوء النهار.',
    nonPlantImage: 'يرجى اختيار صورة صحيحة. لا يبدو أن الصورة المرفوعة تحتوي على نبات أو ورقة محصول.',
    aiFailed: 'تعذر على نماذج الرؤية بالذكاء الاصطناعي معالجة هذه الصورة حاليًا. يرجى التحقق من الاتصال أو المحاولة بصورة أوسع وضوحًا.',
    unclearPrevention: 'يرجى التقاط صورة مقربة واضحة ومحددة لورقة المحصول في ضوء النهار.',
    nonPlantPrevention: 'يرجى التقاط صورة واضحة لورقة المحصول أو الساق المصابة.',
  },
};

function getMsg(lang: string = 'en', key: keyof typeof LOCALIZED_MESSAGES['en']): string {
  const langKey = LOCALIZED_MESSAGES[lang] ? lang : 'en';
  return LOCALIZED_MESSAGES[langKey][key] || LOCALIZED_MESSAGES['en'][key];
}

const STRICT_DIAGNOSTIC_PROMPT = `You are Dr. Fasal, Chief Plant Pathologist and Senior Agronomist at the Agricultural Research Council.
Examine the provided photograph of a plant or crop specimen and perform an authentic botanical disease and pathology diagnosis.

BOTANICAL DIAGNOSTIC DIRECTIVES:
1. SPECIMEN ACCEPTANCE:
- Damaged, necrotic, diseased, fungal-infected, yellowed, pest-infested, wilted, curling, chlorotic, or spotty leaves and stems ARE VALID CROP SPECIMENS and MUST BE EXAMINED AND DIAGNOSED.
- Accept any plant foliage, leaf, branch, stem, fruit, vegetable, or seedling (including leaves held by human hands/fingers or growing in fields/pots).
- Set rejection_code: "NON_PLANT_IMAGE" ONLY if the photo contains ZERO plant or agricultural material whatsoever (such as human face selfie, animal, car, electronics, furniture, building).
- Set rejection_code: "UNCLEAR_IMAGE" ONLY if the photo is pitch black, 100% blank, or completely corrupted.

2. PATHOLOGY & DISEASE DIAGNOSIS:
- If the foliage is clean and healthy: "is_healthy": true, "rejection_code": "NONE", "diseases": [].
- If diseased, infected, chlorotic, or pest-damaged: "is_healthy": false, "rejection_code": "NONE".
  Identify the specific disease name (including pathogen like fungus/bacteria/virus/pest/nutrient deficiency), severity ('low' | 'medium' | 'high' | 'critical'), realistic AI diagnostic confidence score (65 to 99), clinical pathology description, foliar symptoms observed, actionable chemical and organic treatments with exact active ingredients & dosages, and urgency timeline.

Return ONLY a valid JSON object matching:
{
  "crop_detected_en": "Crop/Plant Name in English",
  "crop_detected_localized": "Crop/Plant Name in user active language",
  "crop_detected_ur": "فصل کا نام اردو میں",
  "is_healthy": boolean,
  "overall_confidence": number,
  "rejection_code": "NONE" | "UNCLEAR_IMAGE" | "NON_PLANT_IMAGE",
  "rejection_reason_en": "Rejection reason if any in English",
  "rejection_reason_localized": "Rejection reason in user active language",
  "diseases": [
    {
      "disease_name_en": "Disease / Pathogen Name in English",
      "disease_name_localized": "Disease / Pathogen Name in user active language",
      "disease_name_ur": "بیماری کا نام اردو میں",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": number,
      "description_en": "Clinical pathology assessment in English",
      "description_localized": "Clinical pathology assessment in user active language",
      "symptoms_en": ["Symptom 1 in English", "Symptom 2 in English"],
      "symptoms_localized": ["Symptom 1 in user active language", "Symptom 2 in user active language"],
      "treatment_en": ["Chemical Treatment 1 with active ingredient & dosage in English", "Organic / Biological Control in English"],
      "treatment_localized": ["Chemical Treatment 1 in user active language", "Organic Control in user active language"],
      "urgency_en": "Urgency timeline in English",
      "urgency_localized": "Urgency timeline in user active language"
    }
  ],
  "prevention_en": "Preventive agronomic practices in English",
  "prevention_localized": "Preventive agronomic practices in user active language",
  "prevention_ur": "حفاظتی تدابیر اور دیکھ بھال"
}`;

function cleanJson(rawText: string, cropHint = '', userLang = 'en'): DiagnosticResultDto | null {
  if (!rawText || !rawText.trim()) return null;
  const clean = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed: any = null;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { parsed = JSON.parse(jsonMatch[0]); } catch {}
    }
  }

  if (!parsed || typeof parsed !== 'object') return null;

  // If the model wrapped the response in an array, unwrap it
  if (Array.isArray(parsed)) {
    parsed = parsed[0] || {};
  }

  const hasDiseases = (Array.isArray(parsed.diseases) && parsed.diseases.length > 0) || !!parsed.disease_name_en || !!parsed.disease_name || !!parsed.disease;
  const isExplicitlyHealthy = parsed.is_healthy === true || parsed.health_status === 'healthy';

  // Only reject as non-plant if the model explicitly returned NON_PLANT_IMAGE AND detected no diseases or health status
  if (!hasDiseases && !isExplicitlyHealthy && (parsed.rejection_code === 'NON_PLANT_IMAGE' || (parsed.is_plant === false && parsed.is_valid_plant === false))) {
    return {
      is_valid_plant: false,
      is_image_clear: true,
      rejection_code: 'NON_PLANT_IMAGE',
      rejection_reason_en: parsed.rejection_reason_en || 'Please choose a correct image. The uploaded photo does not appear to contain a plant or crop leaf.',
      rejection_reason_ur: parsed.rejection_reason_ur || 'براہ کرم پودوں یا فصل سے متعلق درست تصویر منتخب کریں۔ اپ لوڈ کردہ تصویر کسی فصل یا پودے کی نہیں ہے۔',
      rejection_reason_localized: parsed.rejection_reason_localized || parsed.rejection_reason_en || 'Please choose a correct image. The uploaded photo does not appear to contain a plant or crop leaf.',
      image_quality: 'unclear',
      crop_detected_en: parsed.crop_detected_en || 'Non-Plant Object',
      crop_detected_ur: parsed.crop_detected_ur || 'غیر نباتاتی چیز',
      crop_detected_localized: parsed.crop_detected_localized || parsed.crop_detected_en || 'Non-Plant Object',
      overall_confidence: 0,
      is_healthy: false,
      diseases: [],
      prevention_en: 'Please capture a clear photo of an affected crop leaf or plant stem.',
      prevention_localized: parsed.prevention_localized || 'Please capture a clear photo of an affected crop leaf or plant stem.',
      language: userLang,
    };
  }

  // Only reject as unclear if explicitly flagged AND no diseases were identified
  if (!hasDiseases && !isExplicitlyHealthy && (parsed.rejection_code === 'UNCLEAR_IMAGE' || (parsed.is_clear === false && parsed.is_valid_plant === false))) {
    return {
      is_valid_plant: true,
      is_image_clear: false,
      rejection_code: 'UNCLEAR_IMAGE',
      rejection_reason_en: parsed.rejection_reason_en || 'The image is not clear. Please take a new clear, well-focused image.',
      rejection_reason_ur: parsed.rejection_reason_ur || 'تصویر واضح یا صاف نہیں ہے۔ براہ کرم نئی صاف تصویر لیں۔',
      rejection_reason_localized: parsed.rejection_reason_localized || parsed.rejection_reason_en || 'The image is not clear. Please take a new clear, well-focused image.',
      image_quality: 'blurry',
      crop_detected_en: parsed.crop_detected_en || cropHint || 'Unclear Specimen',
      crop_detected_ur: parsed.crop_detected_ur || 'غیر واضح نمونہ',
      crop_detected_localized: parsed.crop_detected_localized || parsed.crop_detected_en || cropHint || 'Unclear Specimen',
      overall_confidence: 0,
      is_healthy: false,
      diseases: [],
      prevention_en: 'Please take a well-focused close-up photograph under good daylight.',
      prevention_localized: parsed.prevention_localized || 'Please take a well-focused close-up photograph under good daylight.',
      language: userLang,
    };
  }

  const cropDetected = parsed.crop_detected_en || parsed.crop || parsed.plant || cropHint || 'Plant Specimen';
  const isHealthy = !hasDiseases && (parsed.is_healthy === true || parsed.health_status === 'healthy' || (Array.isArray(parsed.diseases) && parsed.diseases.length === 0));

  let diseases: DiseaseDetailDto[] = [];
  if (Array.isArray(parsed.diseases) && parsed.diseases.length > 0) {
    diseases = parsed.diseases.map((d: any) => ({
      disease_name_en: d.disease_name_en || d.disease_name || d.name || 'Foliar Pathology',
      disease_name_ur: d.disease_name_ur || (userLang === 'ur' ? d.disease_name_localized : '') || '',
      disease_name_localized: d.disease_name_localized || d.disease_name_ur || d.disease_name_en || d.disease_name || 'Foliar Pathology',
      severity: ['low', 'medium', 'high', 'critical'].includes(d.severity?.toLowerCase()) ? d.severity.toLowerCase() : 'medium',
      confidence: typeof d.confidence === 'number' && d.confidence > 0 ? Math.min(100, Math.max(10, Math.round(d.confidence))) : (parsed.overall_confidence || 88),
      description_en: d.description_en || d.description || 'Pathological lesions and tissue necrosis identified on specimen foliage.',
      description_ur: d.description_ur || (userLang === 'ur' ? (d.description_localized || d.description) : '') || '',
      description_localized: d.description_localized || d.description_ur || d.description_en || d.description || 'Pathological lesions and tissue necrosis identified on specimen foliage.',
      symptoms_en: Array.isArray(d.symptoms_en) ? d.symptoms_en : (Array.isArray(d.symptoms) ? d.symptoms : ['Foliar chlorosis and lesion development']),
      symptoms_ur: Array.isArray(d.symptoms_ur) ? d.symptoms_ur : (userLang === 'ur' && Array.isArray(d.symptoms_localized) ? d.symptoms_localized : []),
      symptoms_localized: Array.isArray(d.symptoms_localized) ? d.symptoms_localized : (Array.isArray(d.symptoms_ur) ? d.symptoms_ur : (Array.isArray(d.symptoms_en) ? d.symptoms_en : (Array.isArray(d.symptoms) ? d.symptoms : ['Foliar chlorosis and lesion development']))),
      treatment_en: Array.isArray(d.treatment_en) ? d.treatment_en : (Array.isArray(d.treatment) ? d.treatment : ['Apply targeted fungicide or bactericide foliar treatment']),
      treatment_ur: Array.isArray(d.treatment_ur) ? d.treatment_ur : (userLang === 'ur' && Array.isArray(d.treatment_localized) ? d.treatment_localized : []),
      treatment_localized: Array.isArray(d.treatment_localized) ? d.treatment_localized : (Array.isArray(d.treatment_ur) ? d.treatment_ur : (Array.isArray(d.treatment_en) ? d.treatment_en : (Array.isArray(d.treatment) ? d.treatment : ['Apply targeted fungicide or bactericide foliar treatment']))),
      urgency_en: d.urgency_en || d.urgency || 'Treat within 48-72 hours to prevent spread',
      urgency_ur: d.urgency_ur || (userLang === 'ur' ? (d.urgency_localized || d.urgency) : '') || '',
      urgency_localized: d.urgency_localized || d.urgency_ur || d.urgency_en || d.urgency || 'Treat within 48-72 hours to prevent spread',
    }));
  } else if (!isHealthy && (parsed.disease_name_en || parsed.disease_name || parsed.disease)) {
    const dNameEn = parsed.disease_name_en || parsed.disease_name || parsed.disease;
    diseases = [{
      disease_name_en: dNameEn,
      disease_name_ur: parsed.disease_name_ur || (userLang === 'ur' ? parsed.disease_name_localized : '') || '',
      disease_name_localized: parsed.disease_name_localized || parsed.disease_name_ur || dNameEn,
      severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity?.toLowerCase()) ? parsed.severity.toLowerCase() : 'medium',
      confidence: typeof parsed.confidence === 'number' && parsed.confidence > 0 ? Math.round(parsed.confidence) : (parsed.overall_confidence || 88),
      description_en: parsed.description_en || parsed.description || 'Pathological condition identified on specimen tissue.',
      description_ur: parsed.description_ur || (userLang === 'ur' ? (parsed.description_localized || parsed.description) : '') || '',
      description_localized: parsed.description_localized || parsed.description_ur || parsed.description_en || parsed.description || 'Pathological condition identified on specimen tissue.',
      symptoms_en: Array.isArray(parsed.symptoms_en) ? parsed.symptoms_en : (Array.isArray(parsed.symptoms) ? parsed.symptoms : ['Foliar symptoms visible on leaf surface']),
      symptoms_ur: Array.isArray(parsed.symptoms_ur) ? parsed.symptoms_ur : (userLang === 'ur' && Array.isArray(parsed.symptoms_localized) ? parsed.symptoms_localized : []),
      symptoms_localized: Array.isArray(parsed.symptoms_localized) ? parsed.symptoms_localized : (Array.isArray(parsed.symptoms_ur) ? parsed.symptoms_ur : (Array.isArray(parsed.symptoms_en) ? parsed.symptoms_en : ['Foliar symptoms visible on leaf surface'])),
      treatment_en: Array.isArray(parsed.treatment_en) ? parsed.treatment_en : (Array.isArray(parsed.treatment) ? parsed.treatment : ['Apply targeted crop protection treatment']),
      treatment_ur: Array.isArray(parsed.treatment_ur) ? parsed.treatment_ur : (userLang === 'ur' && Array.isArray(parsed.treatment_localized) ? parsed.treatment_localized : []),
      treatment_localized: Array.isArray(parsed.treatment_localized) ? parsed.treatment_localized : (Array.isArray(parsed.treatment_ur) ? parsed.treatment_ur : (Array.isArray(parsed.treatment_en) ? parsed.treatment_en : ['Apply targeted crop protection treatment'])),
      urgency_en: parsed.urgency_en || parsed.urgency || 'Apply timely treatment within 48 hours',
      urgency_ur: parsed.urgency_ur || (userLang === 'ur' ? (parsed.urgency_localized || parsed.urgency) : '') || '',
      urgency_localized: parsed.urgency_localized || parsed.urgency_ur || parsed.urgency_en || parsed.urgency || 'Apply timely treatment within 48 hours',
    }];
  }

  return {
    is_valid_plant: true,
    is_image_clear: true,
    rejection_code: 'NONE',
    image_quality: 'good',
    crop_detected_en: cropDetected,
    crop_detected_ur: parsed.crop_detected_ur || (userLang === 'ur' ? parsed.crop_detected_localized : '') || '',
    crop_detected_localized: parsed.crop_detected_localized || parsed.crop_detected_ur || cropDetected,
    overall_confidence: typeof parsed.overall_confidence === 'number' && parsed.overall_confidence > 0
      ? Math.min(100, Math.max(10, Math.round(parsed.overall_confidence)))
      : (isHealthy ? 95 : (diseases[0]?.confidence || 88)),
    is_healthy: isHealthy,
    diseases: isHealthy ? [] : diseases,
    prevention_en: parsed.prevention_en || parsed.prevention || 'Maintain optimal soil drainage, balanced fertilization, and monitor for vectors.',
    prevention_ur: parsed.prevention_ur || (userLang === 'ur' ? parsed.prevention_localized : '') || '',
    prevention_localized: parsed.prevention_localized || parsed.prevention_ur || parsed.prevention_en || 'Maintain optimal soil drainage, balanced fertilization, and monitor for vectors.',
    language: userLang,
  };
}

export class DiagnosticsService implements IDiagnosticsModule {
  private getAiClient(customApiKey?: string): GoogleGenAI | null {
    const serverKey =
      process.env.GEMINI_API_KEY ||
      config.geminiApiKey ||
      process.env.VITE_GEMINI_API_KEY ||
      '';

    // Prioritize the trusted environment API key; only fallback to custom key if server key is absent
    const key = serverKey || (customApiKey && customApiKey.trim().length > 10 ? customApiKey.trim() : '');

    if (!key) return null;

    try {
      return new GoogleGenAI({ apiKey: key });
    } catch (e) {
      console.warn('[DiagnosticsService] Failed to initialize GoogleGenAI client:', e);
      return null;
    }
  }

  /**
   * Calls OpenRouter vision API with the top world-class AI models
   */
  private async callOpenRouter(
    cleanBase64: string,
    mimeType: string,
    prompt: string,
    apiKey: string,
    modelName?: string,
    cropHint = '',
    userLang = 'en'
  ): Promise<DiagnosticResultDto | null> {
    const model = modelName || config.openRouterModel || 'google/gemini-2.5-pro';
    const dataUri = `data:${mimeType};base64,${cleanBase64}`;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://fasaldost.pk',
          'X-Title': 'FasalDost AI Agronomist',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUri,
                  },
                },
              ],
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[DiagnosticsService] OpenRouter API error (${response.status}):`, errText);
        return null;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = cleanJson(content, cropHint, userLang);
        if (parsed) {
          parsed.ai_provider = 'openrouter';
          parsed.ai_model = model;
          return parsed;
        }
      }
    } catch (e) {
      console.error('[DiagnosticsService] OpenRouter call exception:', e);
    }
    return null;
  }

  /**
   * Calls Google GenAI across reliable Gemini vision models
   */
  private async callGemini(
    cleanBase64: string,
    mimeType: string,
    prompt: string,
    apiKey?: string,
    cropHint = '',
    userLang = 'en'
  ): Promise<DiagnosticResultDto | null> {
    const ai = this.getAiClient(apiKey);
    if (!ai) return null;

    const GEMINI_MODELS = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash',
      'gemini-3.1-pro-preview',
    ];

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: [
            {
              inlineData: {
                mimeType,
                data: cleanBase64,
              },
            },
            {
              text: prompt,
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text;
        if (text) {
          const parsed = cleanJson(text, cropHint, userLang);
          if (parsed) {
            parsed.ai_provider = 'gemini';
            parsed.ai_model = modelName;
            return parsed;
          }
        }
      } catch (err) {
        console.warn(`[DiagnosticsService] Gemini ${modelName} call error:`, err);
      }
    }
    return null;
  }

  public async getDailyScanStatus(userId?: string, clientIp?: string): Promise<{ scansToday: number; scansRemaining: number; dailyLimit: number; plan: string }> {
    const sub = await subscriptionsService.getActiveSubscription(userId, clientIp);
    let planLimit = DAILY_SCAN_LIMIT;

    if (sub.isPaid) {
      if (sub.plan === 'gold') planLimit = 250;
      else if (sub.plan === 'diamond') planLimit = 500;
      else if (sub.plan === 'unlimited') planLimit = 999999;
    }

    const identifier = userId || clientIp || 'guest';
    const key = getTodayQuotaKey(identifier);
    const memoryCount = dailyScanMemoryStore.get(key) || 0;
    let dbCount = 0;

    try {
      const startDate = new Date();
      if (sub.isPaid) {
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      } else {
        startDate.setHours(0, 0, 0, 0);
      }

      const conditions = [];
      if (userId) conditions.push(eq(diagnosticScans.userId, userId));
      if (clientIp) conditions.push(eq(diagnosticScans.clientIp, clientIp));

      if (conditions.length > 0) {
        const [queryRes] = await db
          .select({ count: sql<number>`count(*)` })
          .from(diagnosticScans)
          .where(
            and(
              or(...conditions),
              gte(diagnosticScans.createdAt, startDate)
            )
          );
        if (queryRes) {
          dbCount = Number(queryRes.count) || 0;
        }
      }
    } catch (e) {
      console.warn('[DiagnosticsService] DB scan quota query warning:', e);
    }

    const count = Math.max(memoryCount, dbCount);
    dailyScanMemoryStore.set(key, count);

    return {
      scansToday: count,
      scansRemaining: Math.max(0, planLimit - count),
      dailyLimit: planLimit,
      plan: sub.plan,
    };
  }

  private async enforceDailyQuota(dto: ScanCropRequestDto): Promise<void> {
    const status = await this.getDailyScanStatus(dto.userId, dto.clientIp);
    if (status.scansToday >= status.dailyLimit) {
      const msg = getMsg(dto.language, 'dailyLimitExceeded');
      throw new AppError(msg, 429, 'DAILY_SCAN_LIMIT_EXCEEDED');
    }
  }

  private incrementQuota(dto: ScanCropRequestDto): { scansToday: number; scansRemaining: number; dailyLimit: number } {
    const identifier = dto.userId || dto.clientIp || 'guest';
    const key = getTodayQuotaKey(identifier);
    const current = dailyScanMemoryStore.get(key) || 0;
    const newCount = current + 1;
    dailyScanMemoryStore.set(key, newCount);
    return {
      scansToday: newCount,
      scansRemaining: Math.max(0, DAILY_SCAN_LIMIT - newCount),
      dailyLimit: DAILY_SCAN_LIMIT,
    };
  }

  public async analyzeAndRecordCrop(dto: ScanCropRequestDto): Promise<DiagnosticResultDto> {
    if (!dto.imageBase64) {
      throw new AppError(getMsg(dto.language, 'imageRequired'), 400, 'INVALID_IMAGE');
    }

    // Enforce strict limit of 7 scans per day
    await this.enforceDailyQuota(dto);

    const userLang = dto.language || 'en';
    const langName = LANGUAGE_NAMES[userLang] || 'English';

    // Auto-detect MIME type from data URL or default to image/jpeg
    let mimeType = 'image/jpeg';
    const match = dto.imageBase64.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    if (match && match[1]) {
      mimeType = match[1];
    }
    const cleanBase64 = dto.imageBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');

    // Immediate triage: detect blank or corrupted images
    if (cleanBase64.length < 300) {
      return {
        scanCode: `SCAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        is_valid_plant: false,
        is_image_clear: false,
        rejection_code: 'UNCLEAR_IMAGE',
        rejection_reason_en: 'The image is not clear or is too small. Please take a new clear photo.',
        rejection_reason_ur: 'تصویر واضح یا صاف نہیں ہے۔ براہ کرم نئی صاف تصویر لیں۔',
        rejection_reason_localized: getMsg(userLang, 'unclearImage'),
        image_quality: 'unclear',
        crop_detected_en: 'Unclear Specimen',
        crop_detected_ur: 'غیر واضح نمونہ',
        crop_detected_localized: 'Unclear Specimen',
        overall_confidence: 0,
        is_healthy: false,
        diseases: [],
        prevention_en: 'Please take a clear, well-focused close-up photograph of the crop leaf under daylight.',
        prevention_ur: 'براہ کرم دن کی روشنی میں متاثرہ پتے یا تنے کی صاف تصویر لیں۔',
        prevention_localized: getMsg(userLang, 'unclearPrevention'),
        language: userLang,
        createdAt: new Date().toISOString(),
      };
    }

    const cropHint = dto.cropName?.trim() || '';
    const userPrompt = cropHint
      ? `The crop is reported as: ${cropHint}. Perform an authentic botanical pathology examination.`
      : `Examine the specimen, identify the crop species, and perform an authentic botanical pathology examination.`;

    const langDirective = `ACTIVE USER LANGUAGE: "${langName}" (${userLang}).
IMPORTANT: You MUST write the localized fields (crop_detected_localized, disease_name_localized, description_localized, symptoms_localized, treatment_localized, urgency_localized, prevention_localized) in fluent, natural ${langName}.`;

    const fullPrompt = `${STRICT_DIAGNOSTIC_PROMPT}\n\n${userPrompt}\n${langDirective}\nDiagnose this crop specimen now.`;

    let result: DiagnosticResultDto | null = null;

    // 1. Try OpenRouter if API key is provided via request or environment
    const openRouterKey =
      dto.openRouterApiKey ||
      config.openRouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      '';

    if (openRouterKey) {
      const openRouterModel = dto.openRouterModel || config.openRouterModel;
      result = await this.callOpenRouter(cleanBase64, mimeType, fullPrompt, openRouterKey, openRouterModel, cropHint, userLang);
    }

    // 2. If OpenRouter was not used or failed, try Gemini Vision models
    if (!result) {
      result = await this.callGemini(cleanBase64, mimeType, fullPrompt, dto.apiKey, cropHint, userLang);
    }

    if (!result) {
      throw new AppError(
        getMsg(dto.language, 'aiFailed'),
        503,
        'AI_ANALYSIS_FAILED'
      );
    }

    // Generate scan code
    const scanCode = `SCAN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    result.scanCode = scanCode;
    result.createdAt = new Date().toISOString();

    // Only persist valid botanical diagnoses into the database
    if (result.rejection_code === 'NONE') {
      try {
        if (dto.userId) {
          await db.insert(users).values({ uid: dto.userId, role: 'farmer' }).onConflictDoNothing();
        }

        const [scanRecord] = await db
          .insert(diagnosticScans)
          .values({
            scanCode,
            userId: dto.userId || null,
            clientIp: dto.clientIp || null,
            cropDetected: result.crop_detected_en,
            isHealthy: result.is_healthy,
            overallConfidence: result.overall_confidence,
            imageQuality: result.image_quality,
            preventionAdvice: result.prevention_en,
            locationProvince: dto.province || 'Punjab',
            locationDistrict: dto.district || null,
          })
          .returning();

        if (scanRecord && result.diseases && result.diseases.length > 0) {
          for (const d of result.diseases) {
            await db.insert(diagnosticDiseases).values({
              scanId: scanRecord.id,
              diseaseName: d.disease_name_en,
              severity: d.severity,
              confidence: d.confidence,
              description: d.description_en,
              symptoms: d.symptoms_en,
              treatment: d.treatment_en,
              urgency: d.urgency_en,
            });
          }
        }
      } catch (dbError) {
        console.error('[DiagnosticsService] PostgreSQL diagnostic persistence error:', dbError);
      }
    }

    // Increment daily quota count
    const quota = this.incrementQuota(dto);
    result.scans_today = quota.scansToday;
    result.scans_remaining = quota.scansRemaining;
    result.daily_limit = quota.dailyLimit;

    return result;
  }

  public async getScanHistory(userId: string, limit = 20): Promise<DiagnosticResultDto[]> {
    try {
      const scans = await db
        .select()
        .from(diagnosticScans)
        .where(eq(diagnosticScans.userId, userId))
        .orderBy(desc(diagnosticScans.createdAt))
        .limit(limit);

      const history: DiagnosticResultDto[] = [];

      for (const s of scans) {
        const diseases = await db
          .select()
          .from(diagnosticDiseases)
          .where(eq(diagnosticDiseases.scanId, s.id));

        history.push({
          scanCode: s.scanCode,
          is_valid_plant: true,
          is_image_clear: true,
          rejection_code: 'NONE',
          image_quality: s.imageQuality as any,
          crop_detected_en: s.cropDetected,
          overall_confidence: s.overallConfidence,
          is_healthy: s.isHealthy,
          prevention_en: s.preventionAdvice || '',
          createdAt: s.createdAt?.toISOString(),
          diseases: diseases.map((d) => ({
            disease_name_en: d.diseaseName,
            severity: d.severity as any,
            confidence: d.confidence,
            description_en: d.description || '',
            symptoms_en: (d.symptoms as string[]) || [],
            treatment_en: (d.treatment as string[]) || [],
            urgency_en: d.urgency || '',
          })),
        });
      }

      return history;
    } catch (error) {
      console.error('[DiagnosticsService] Error getting scan history from PostgreSQL:', error);
      throw new AppError('Failed to fetch scan history from database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async getScanByCode(scanCode: string, userId?: string): Promise<DiagnosticResultDto | null> {
    try {
      const condition = userId
        ? and(eq(diagnosticScans.scanCode, scanCode), eq(diagnosticScans.userId, userId))
        : eq(diagnosticScans.scanCode, scanCode);

      const [scan] = await db.select().from(diagnosticScans).where(condition);
      if (!scan) return null;

      const diseases = await db
        .select()
        .from(diagnosticDiseases)
        .where(eq(diagnosticDiseases.scanId, scan.id));

      return {
        scanCode: scan.scanCode,
        is_valid_plant: true,
        is_image_clear: true,
        rejection_code: 'NONE',
        image_quality: scan.imageQuality as any,
        crop_detected_en: scan.cropDetected,
        overall_confidence: scan.overallConfidence,
        is_healthy: scan.isHealthy,
        prevention_en: scan.preventionAdvice || '',
        createdAt: scan.createdAt?.toISOString(),
        diseases: diseases.map((d) => ({
          disease_name_en: d.diseaseName,
          severity: d.severity as any,
          confidence: d.confidence,
          description_en: d.description || '',
          symptoms_en: (d.symptoms as string[]) || [],
          treatment_en: (d.treatment as string[]) || [],
          urgency_en: d.urgency || '',
        })),
      };
    } catch (error) {
      console.error('[DiagnosticsService] Error getting scan by code from PostgreSQL:', error);
      throw new AppError('Failed to fetch scan from database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async deleteScan(scanCode: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        await db
          .delete(diagnosticScans)
          .where(and(eq(diagnosticScans.scanCode, scanCode), eq(diagnosticScans.userId, userId)));
      } else {
        await db.delete(diagnosticScans).where(eq(diagnosticScans.scanCode, scanCode));
      }
      return true;
    } catch (error) {
      console.error('[DiagnosticsService] Error deleting scan from database:', error);
      throw new AppError('Failed to delete scan from database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async clearHistory(userId: string): Promise<boolean> {
    try {
      await db.delete(diagnosticScans).where(eq(diagnosticScans.userId, userId));
      return true;
    } catch (error) {
      console.error('[DiagnosticsService] Error clearing scan history from database:', error);
      throw new AppError('Failed to clear scan history from database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async getSupportedCrops(): Promise<string[]> {
    return SUPPORTED_CROPS;
  }

  /**
   * Generates crystal-clear, authentic spoken audio in Urdu, Hindi, Mandarin, Spanish, Arabic, or English
   * using Gemini 3.8 Flash Lite TTS.
   */
  public async generateSpeech(
    text: string,
    language = 'ur',
    voiceName?: string
  ): Promise<{ audioBase64: string; mimeType: string }> {
    if (!text || !text.trim()) {
      throw new AppError('Text is required for audio narration', 400);
    }

    const ai = this.getAiClient();
    if (!ai) {
      throw new AppError('AI Speech engine is not initialized', 500);
    }

    const ttsModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
    const chosenVoice = voiceName || (language === 'ur' || language === 'hi' ? 'Kore' : 'Aoede');

    for (const model of ttsModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [{ text: text.trim() }],
            },
          ],
          config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: chosenVoice as any },
              },
            },
          },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        const audioBase64 = part?.inlineData?.data;
        const mimeType = part?.inlineData?.mimeType || 'audio/wav';

        if (audioBase64) {
          return { audioBase64, mimeType };
        }
      } catch (err) {
        console.warn(`[DiagnosticsService] Gemini Studio TTS model ${model} error:`, err);
      }
    }

    throw new AppError('Failed to generate studio human voice audio from Google Gemini', 502);
  }
}

export const diagnosticsService = new DiagnosticsService();
