// ─────────────────────────────────────────────────────────────────────────────
// server/modules/diagnostics/diagnostics.types.ts
// Diagnostic engine domain models
// ─────────────────────────────────────────────────────────────────────────────

export interface DiseaseInfo {
  disease_name_en: string;
  disease_name_ur?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description_en: string;
  symptoms_en: string[];
  treatment_en: string[];
  urgency_en: string;
}

export interface DetectionResult {
  is_valid_plant: boolean;
  is_image_clear: boolean;
  rejection_code?: 'UNCLEAR_IMAGE' | 'NON_PLANT_IMAGE' | 'NONE';
  rejection_reason_en?: string;
  rejection_reason_ur?: string;
  image_quality: 'good' | 'medium' | 'blurry' | 'unclear';
  crop_detected_en: string;
  crop_detected_ur?: string;
  overall_confidence: number;
  is_healthy: boolean;
  diseases: DiseaseInfo[];
  prevention_en: string;
  prevention_ur?: string;
  ai_provider?: 'openrouter' | 'gemini' | 'botanical_expert';
  ai_model?: string;
}

export interface ScanRequestDto {
  imageBase64: string;
  cropName?: string;
  farmerId?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
  apiKey?: string;
  location?: {
    province?: string;
    district?: string;
    tehsil?: string;
  };
}
