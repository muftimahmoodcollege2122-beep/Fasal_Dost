// ─────────────────────────────────────────────────────────────────────────────
// server/modules/diagnostics/diagnostics.service.ts
// AI Crop Disease Diagnostic Service with Gemini 3.8 Flash & PostgreSQL Storage
// ─────────────────────────────────────────────────────────────────────────────

import { eq, desc, and } from 'drizzle-orm';
import { GoogleGenAI, Type } from '@google/genai';
import { db } from '../../../src/db/index.ts';
import { diagnosticScans, diagnosticDiseases, users } from '../../../src/db/schema.ts';
import { config } from '../../core/config';
import { AppError } from '../../core/types';
import {
  IDiagnosticsModule,
  DiagnosticResultDto,
  ScanCropRequestDto,
  DiseaseDetailDto,
} from './diagnostics.interface';

const SUPPORTED_CROPS = [
  'Wheat', 'Cotton', 'Rice', 'Sugarcane', 'Maize', 'Mango',
  'Tomato', 'Potato', 'Onion', 'Chili', 'Mustard', 'Sunflower',
  'Chickpea', 'Lentil', 'Banana', 'Citrus', 'Guava', 'Okra'
];

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
  "crop_detected_ur": "فصل کا نام اردو میں",
  "is_healthy": boolean,
  "overall_confidence": number,
  "rejection_code": "NONE" | "UNCLEAR_IMAGE" | "NON_PLANT_IMAGE",
  "diseases": [
    {
      "disease_name_en": "Disease / Pathogen Name",
      "disease_name_ur": "بیماری کا نام اردو میں",
      "severity": "low" | "medium" | "high" | "critical",
      "confidence": number,
      "description_en": "Clinical pathology assessment",
      "symptoms_en": ["Symptom 1", "Symptom 2"],
      "treatment_en": ["Chemical Treatment 1 with active ingredient & dosage", "Organic / Biological Control"],
      "urgency_en": "Urgency timeline"
    }
  ],
  "prevention_en": "Preventive agronomic practices and hygiene",
  "prevention_ur": "حفاظتی تدابیر اور دیکھ بھال"
}`;

function cleanJson(rawText: string, cropHint = ''): DiagnosticResultDto | null {
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
      image_quality: 'unclear',
      crop_detected_en: parsed.crop_detected_en || 'Non-Plant Object',
      crop_detected_ur: parsed.crop_detected_ur || 'غیر نباتاتی چیز',
      overall_confidence: 0,
      is_healthy: false,
      diseases: [],
      prevention_en: 'Please capture a clear photo of an affected crop leaf or plant stem.',
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
      image_quality: 'blurry',
      crop_detected_en: parsed.crop_detected_en || cropHint || 'Unclear Specimen',
      crop_detected_ur: parsed.crop_detected_ur || 'غیر واضح نمونہ',
      overall_confidence: 0,
      is_healthy: false,
      diseases: [],
      prevention_en: 'Please take a well-focused close-up photograph under good daylight.',
    };
  }

  const cropDetected = parsed.crop_detected_en || parsed.crop || parsed.plant || cropHint || 'Plant Specimen';
  const isHealthy = !hasDiseases && (parsed.is_healthy === true || parsed.health_status === 'healthy' || (Array.isArray(parsed.diseases) && parsed.diseases.length === 0));

  let diseases: DiseaseDetailDto[] = [];
  if (Array.isArray(parsed.diseases) && parsed.diseases.length > 0) {
    diseases = parsed.diseases.map((d: any) => ({
      disease_name_en: d.disease_name_en || d.disease_name || d.name || 'Foliar Pathology',
      disease_name_ur: d.disease_name_ur || '',
      severity: ['low', 'medium', 'high', 'critical'].includes(d.severity?.toLowerCase()) ? d.severity.toLowerCase() : 'medium',
      confidence: typeof d.confidence === 'number' && d.confidence > 0 ? Math.min(100, Math.max(10, Math.round(d.confidence))) : (parsed.overall_confidence || 88),
      description_en: d.description_en || d.description || 'Pathological lesions and tissue necrosis identified on specimen foliage.',
      symptoms_en: Array.isArray(d.symptoms_en) ? d.symptoms_en : (Array.isArray(d.symptoms) ? d.symptoms : ['Foliar chlorosis and lesion development']),
      treatment_en: Array.isArray(d.treatment_en) ? d.treatment_en : (Array.isArray(d.treatment) ? d.treatment : ['Apply targeted fungicide or bactericide foliar treatment']),
      urgency_en: d.urgency_en || d.urgency || 'Treat within 48-72 hours to prevent spread',
    }));
  } else if (!isHealthy && (parsed.disease_name_en || parsed.disease_name || parsed.disease)) {
    diseases = [{
      disease_name_en: parsed.disease_name_en || parsed.disease_name || parsed.disease,
      disease_name_ur: parsed.disease_name_ur || '',
      severity: ['low', 'medium', 'high', 'critical'].includes(parsed.severity?.toLowerCase()) ? parsed.severity.toLowerCase() : 'medium',
      confidence: typeof parsed.confidence === 'number' && parsed.confidence > 0 ? Math.round(parsed.confidence) : (parsed.overall_confidence || 88),
      description_en: parsed.description_en || parsed.description || 'Pathological condition identified on specimen tissue.',
      symptoms_en: Array.isArray(parsed.symptoms_en) ? parsed.symptoms_en : (Array.isArray(parsed.symptoms) ? parsed.symptoms : ['Foliar symptoms visible on leaf surface']),
      treatment_en: Array.isArray(parsed.treatment_en) ? parsed.treatment_en : (Array.isArray(parsed.treatment) ? parsed.treatment : ['Apply targeted crop protection treatment']),
      urgency_en: parsed.urgency_en || parsed.urgency || 'Apply timely treatment within 48 hours',
    }];
  }

  return {
    is_valid_plant: true,
    is_image_clear: true,
    rejection_code: 'NONE',
    image_quality: 'good',
    crop_detected_en: cropDetected,
    crop_detected_ur: parsed.crop_detected_ur || '',
    overall_confidence: typeof parsed.overall_confidence === 'number' && parsed.overall_confidence > 0
      ? Math.min(100, Math.max(10, Math.round(parsed.overall_confidence)))
      : (isHealthy ? 95 : (diseases[0]?.confidence || 88)),
    is_healthy: isHealthy,
    diseases: isHealthy ? [] : diseases,
    prevention_en: parsed.prevention_en || parsed.prevention || 'Maintain optimal soil drainage, balanced fertilization, and monitor for vectors.',
    prevention_ur: parsed.prevention_ur || '',
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
    cropHint = ''
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
        const parsed = cleanJson(content, cropHint);
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
    cropHint = ''
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
          const parsed = cleanJson(text, cropHint);
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

  public async analyzeAndRecordCrop(dto: ScanCropRequestDto): Promise<DiagnosticResultDto> {
    if (!dto.imageBase64) {
      throw new AppError('Leaf or crop image is required', 400, 'INVALID_IMAGE');
    }

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
        image_quality: 'unclear',
        crop_detected_en: 'Unclear Specimen',
        crop_detected_ur: 'غیر واضح نمونہ',
        overall_confidence: 0,
        is_healthy: false,
        diseases: [],
        prevention_en: 'Please take a clear, well-focused close-up photograph of the crop leaf under daylight.',
        prevention_ur: 'براہ کرم دن کی روشنی میں متاثرہ پتے یا تنے کی صاف تصویر لیں۔',
        createdAt: new Date().toISOString(),
      };
    }

    const cropHint = dto.cropName?.trim() || '';
    const userPrompt = cropHint
      ? `The crop is reported as: ${cropHint}. Perform an authentic botanical pathology examination.`
      : `Examine the specimen, identify the crop species, and perform an authentic botanical pathology examination.`;

    const fullPrompt = `${STRICT_DIAGNOSTIC_PROMPT}\n\n${userPrompt}\nDiagnose this crop specimen now.`;

    let result: DiagnosticResultDto | null = null;

    // 1. Try OpenRouter if API key is provided via request or environment
    const openRouterKey =
      dto.openRouterApiKey ||
      config.openRouterApiKey ||
      process.env.OPENROUTER_API_KEY ||
      '';

    if (openRouterKey) {
      const openRouterModel = dto.openRouterModel || config.openRouterModel;
      result = await this.callOpenRouter(cleanBase64, mimeType, fullPrompt, openRouterKey, openRouterModel, cropHint);
    }

    // 2. If OpenRouter was not used or failed, try Gemini Vision models
    if (!result) {
      result = await this.callGemini(cleanBase64, mimeType, fullPrompt, dto.apiKey, cropHint);
    }

    if (!result) {
      throw new AppError(
        'AI vision models were unable to process this image right now. Please verify your connection or try with a clearer photo.',
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
}

export const diagnosticsService = new DiagnosticsService();
