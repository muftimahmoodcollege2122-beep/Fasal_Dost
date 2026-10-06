// ─────────────────────────────────────────────────────────────────────────────
// server/modules/advisory/advisory.types.ts
// Agronomic advisory, market rates, and weather alerts
// ─────────────────────────────────────────────────────────────────────────────

export interface MandiRate {
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

export interface WeatherAdvisory {
  id: string;
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  affectedCrops: string[];
  recommendedAction: string;
  issuedAt: string;
}
