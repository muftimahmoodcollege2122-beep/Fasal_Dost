// ─────────────────────────────────────────────────────────────────────────────
// src/utils/api.ts
// Crop disease detection AI engine: routes to modular backend with database storage
// ─────────────────────────────────────────────────────────────────────────────

import { DetectionResult } from './store';
import { apiClient } from '../shared/services/apiClient';

export async function detectDisease(imageBase64: string, cropName = ''): Promise<DetectionResult> {
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    throw new Error('No crop image provided for diagnostic scan');
  }

  // Route through modular monolith backend with PostgreSQL diagnostic scan record
  const result = await apiClient.diagnostics.scan(imageBase64, cropName);
  if (!result) {
    throw new Error('Could not analyze leaf image. Please ensure good lighting and clear focus.');
  }

  return {
    is_valid_plant: result.is_valid_plant ?? true,
    is_image_clear: result.is_image_clear ?? true,
    rejection_code: result.rejection_code || 'NONE',
    rejection_reason_en: result.rejection_reason_en,
    rejection_reason_ur: result.rejection_reason_ur,
    image_quality: result.image_quality || 'good',
    crop_detected_en: result.crop_detected_en,
    crop_detected_ur: result.crop_detected_ur,
    overall_confidence: result.overall_confidence,
    is_healthy: result.is_healthy,
    prevention_en: result.prevention_en,
    prevention_ur: result.prevention_ur,
    ai_provider: result.ai_provider,
    ai_model: result.ai_model,
    diseases: (result.diseases || []).map((d) => ({
      disease_name_en: d.disease_name_en,
      disease_name_ur: d.disease_name_ur,
      severity: d.severity,
      confidence: d.confidence,
      description_en: d.description_en,
      symptoms_en: d.symptoms_en,
      treatment_en: d.treatment_en,
      urgency_en: d.urgency_en,
    })),
  };
}
