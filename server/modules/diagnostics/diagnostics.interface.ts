// ─────────────────────────────────────────────────────────────────────────────
// server/modules/diagnostics/diagnostics.interface.ts
// Diagnostics Module Defined Interface & Data Transfer Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface DiseaseDetailDto {
  disease_name_en: string;
  disease_name_ur?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description_en: string;
  symptoms_en: string[];
  treatment_en: string[];
  urgency_en: string;
}

export interface DiagnosticResultDto {
  scanCode?: string;
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
  diseases: DiseaseDetailDto[];
  prevention_en: string;
  prevention_ur?: string;
  ai_provider?: 'openrouter' | 'gemini' | 'botanical_expert';
  ai_model?: string;
  createdAt?: string;
}

export interface ScanCropRequestDto {
  imageBase64: string;
  cropName?: string;
  userId?: string;
  province?: string;
  district?: string;
  apiKey?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

export interface IDiagnosticsModule {
  analyzeAndRecordCrop(dto: ScanCropRequestDto): Promise<DiagnosticResultDto>;
  getScanHistory(userId: string, limit?: number): Promise<DiagnosticResultDto[]>;
  getScanByCode(scanCode: string, userId?: string): Promise<DiagnosticResultDto | null>;
  deleteScan(scanCode: string, userId?: string): Promise<boolean>;
  clearHistory(userId: string): Promise<boolean>;
  getSupportedCrops(): Promise<string[]>;
}
