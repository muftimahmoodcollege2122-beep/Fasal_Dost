// ─────────────────────────────────────────────────────────────────────────────
// src/utils/api.ts
// Crop disease detection AI engine: routes to modular backend with database storage
// ─────────────────────────────────────────────────────────────────────────────

import { DetectionResult } from './store';
import { apiClient } from '../shared/apiClient';

export async function detectDisease(imageBase64: string, cropName = '', language = 'en'): Promise<DetectionResult> {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('No crop image provided for diagnostic scan');
  }

  // Route through modular monolith backend with PostgreSQL diagnostic scan record
  const result = await apiClient.diagnostics.scan(imageBase64, cropName, language);
  if (!result) {
    throw new Error('Could not analyze leaf image. Please ensure good lighting and clear focus.');
  }

  return {
    is_valid_plant: result.is_valid_plant ?? true,
    is_image_clear: result.is_image_clear ?? true,
    rejection_code: result.rejection_code || 'NONE',
    rejection_reason_en: result.rejection_reason_en,
    rejection_reason_ur: result.rejection_reason_ur,
    rejection_reason_localized: result.rejection_reason_localized,
    image_quality: result.image_quality || 'good',
    crop_detected_en: result.crop_detected_en,
    crop_detected_ur: result.crop_detected_ur,
    crop_detected_localized: result.crop_detected_localized,
    overall_confidence: result.overall_confidence,
    is_healthy: result.is_healthy,
    prevention_en: result.prevention_en,
    prevention_ur: result.prevention_ur,
    prevention_localized: result.prevention_localized,
    ai_provider: result.ai_provider,
    ai_model: result.ai_model,
    language: result.language || language,
    diseases: (result.diseases || []).map((d) => ({
      disease_name_en: d.disease_name_en,
      disease_name_ur: d.disease_name_ur,
      disease_name_localized: d.disease_name_localized,
      severity: d.severity,
      confidence: d.confidence,
      description_en: d.description_en,
      description_localized: d.description_localized,
      symptoms_en: d.symptoms_en,
      symptoms_localized: d.symptoms_localized,
      treatment_en: d.treatment_en,
      treatment_localized: d.treatment_localized,
      urgency_en: d.urgency_en,
      urgency_localized: d.urgency_localized,
    })),
  };
}
