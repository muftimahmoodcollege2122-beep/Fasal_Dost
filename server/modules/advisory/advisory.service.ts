// ─────────────────────────────────────────────────────────────────────────────
// server/modules/advisory/advisory.service.ts
// Mandi Market Rates & Agronomic Advisory Service using PostgreSQL
// ─────────────────────────────────────────────────────────────────────────────

import { ilike, and, eq, desc } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import { advisoryMandiRates, advisoryWeatherAlerts } from '../../../src/db/schema.ts';
import { IAdvisoryModule, MandiRateDto, WeatherAdvisoryDto } from './advisory.interface';
import { AppError } from '../../core/types';

export class AdvisoryService implements IAdvisoryModule {
  public async getMandiRates(crop?: string, province?: string): Promise<MandiRateDto[]> {
    try {
      const conditions: any[] = [];
      if (crop) {
        conditions.push(ilike(advisoryMandiRates.crop, `%${crop}%`));
      }
      if (province) {
        conditions.push(eq(advisoryMandiRates.province, province));
      }

      const rows = await db
        .select()
        .from(advisoryMandiRates)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(advisoryMandiRates.updatedAt));

      return rows.map((r) => ({
        id: r.id,
        crop: r.crop,
        mandi: r.mandi,
        province: r.province,
        minPrice: parseFloat(r.minPrice) || 0,
        maxPrice: parseFloat(r.maxPrice) || 0,
        modalPrice: parseFloat(r.modalPrice) || 0,
        unit: r.unit,
        trend: (r.priceTrend as any) || 'stable',
        changePercent: parseFloat(r.changePercent || '0') || 0,
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : new Date().toISOString(),
      }));
    } catch (error) {
      console.error('[AdvisoryService] PostgreSQL rates query failed:', error);
      throw new AppError('Failed to fetch Mandi rates from database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async getWeatherAlerts(crop?: string): Promise<WeatherAdvisoryDto[]> {
    try {
      const rows = await db
        .select()
        .from(advisoryWeatherAlerts)
        .orderBy(desc(advisoryWeatherAlerts.issuedAt));

      let result = rows.map((r) => ({
        id: r.id,
        alertCode: r.alertCode,
        severity: (r.severity as any) || 'info',
        title: r.title,
        description: r.description,
        affectedCrops: (r.affectedCrops as string[]) || [],
        recommendedAction: r.recommendedAction,
        issuedAt: r.issuedAt ? r.issuedAt.toISOString() : new Date().toISOString(),
      }));

      if (crop) {
        const cropLower = crop.toLowerCase();
        result = result.filter((a) =>
          a.affectedCrops.some((c) => c.toLowerCase().includes(cropLower))
        );
      }

      return result;
    } catch (error) {
      console.error('[AdvisoryService] PostgreSQL alerts query failed:', error);
      throw new AppError('Failed to fetch weather advisories from database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }
}

export const advisoryService = new AdvisoryService();
