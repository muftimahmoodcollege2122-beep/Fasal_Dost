// ─────────────────────────────────────────────────────────────────────────────
// server/modules/advisory/advisory.interface.ts
// Advisory & Mandi Intelligence Defined Interface & Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface MandiRateDto {
  id?: number;
  crop: string;
  mandi: string;
  province: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  updatedAt: string;
}

export interface WeatherAdvisoryDto {
  id?: number;
  alertCode: string;
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  affectedCrops: string[];
  recommendedAction: string;
  issuedAt: string;
}

export interface IAdvisoryModule {
  getMandiRates(crop?: string, province?: string): Promise<MandiRateDto[]>;
  getWeatherAlerts(crop?: string): Promise<WeatherAdvisoryDto[]>;
}
