// ─────────────────────────────────────────────────────────────────────────────
// server/modules/diagnostics/diagnostics.interface.ts
// Diagnostics Module Defined Interface & Data Transfer Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface DiseaseDetailDto {
  disease_name_en: string;
  disease_name_ur?: string;
  disease_name_localized?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description_en: string;
  description_ur?: string;
  description_localized?: string;
  symptoms_en: string[];
  symptoms_ur?: string[];
  symptoms_localized?: string[];
  treatment_en: string[];
  treatment_ur?: string[];
  treatment_localized?: string[];
  urgency_en: string;
  urgency_ur?: string;
  urgency_localized?: string;
}

export interface DiagnosticResultDto {
  scanCode?: string;
  is_valid_plant: boolean;
  is_image_clear: boolean;
  rejection_code?: 'UNCLEAR_IMAGE' | 'NON_PLANT_IMAGE' | 'NONE';
  rejection_reason_en?: string;
  rejection_reason_ur?: string;
  rejection_reason_localized?: string;
  image_quality: 'good' | 'medium' | 'blurry' | 'unclear';
  crop_detected_en: string;
  crop_detected_ur?: string;
  crop_detected_localized?: string;
  overall_confidence: number;
  is_healthy: boolean;
  diseases: DiseaseDetailDto[];
  prevention_en: string;
  prevention_ur?: string;
  prevention_localized?: string;
  ai_provider?: 'openrouter' | 'gemini' | 'botanical_expert';
  ai_model?: string;
  language?: string;
  createdAt?: string;
  scans_today?: number;
  scans_remaining?: number;
  daily_limit?: number;
}

export interface ScanCropRequestDto {
  imageBase64: string;
  cropName?: string;
  language?: string;
  userId?: string;
  clientIp?: string;
  province?: string;
  district?: string;
  apiKey?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

export interface IDiagnosticsModule {
  analyzeAndRecordCrop(dto: ScanCropRequestDto): Promise<DiagnosticResultDto>;
  getDailyScanStatus(userId?: string, clientIp?: string): Promise<{ scansToday: number; scansRemaining: number; dailyLimit: number }>;
  getScanHistory(userId: string, limit?: number): Promise<DiagnosticResultDto[]>;
  getScanByCode(scanCode: string, userId?: string): Promise<DiagnosticResultDto | null>;
  deleteScan(scanCode: string, userId?: string): Promise<boolean>;
  clearHistory(userId: string): Promise<boolean>;
  getSupportedCrops(): Promise<string[]>;
}
