// ─────────────────────────────────────────────────────────────────────────────
// server/modules/marketplace/marketplace.service.ts
// Kisan Marketplace Service with PostgreSQL Drizzle ORM Storage
// ─────────────────────────────────────────────────────────────────────────────

import { eq, desc, ilike, and } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import { marketplaceListings, users } from '../../../src/db/schema.ts';
import { AppError } from '../../core/types';
import {
  IMarketplaceModule,
  MarketplaceProduceListingDto,
  CreateProduceListingDto,
  MarketplaceFilterDto,
} from './marketplace.interface';

export class MarketplaceService implements IMarketplaceModule {
  public async getListings(filters?: MarketplaceFilterDto): Promise<MarketplaceProduceListingDto[]> {
    try {
      const conditions: any[] = [];

      if (filters?.crop) {
        conditions.push(ilike(marketplaceListings.cropName, `%${filters.crop}%`));
      }
      if (filters?.province) {
        conditions.push(eq(marketplaceListings.province, filters.province));
      }
      if (filters?.district) {
        conditions.push(ilike(marketplaceListings.district, `%${filters.district}%`));
      }
      if (filters?.quality) {
        conditions.push(eq(marketplaceListings.qualityGrade, filters.quality));
      }
      if (filters?.sellerId) {
        conditions.push(eq(marketplaceListings.sellerId, filters.sellerId));
      }
      if (filters?.status) {
        conditions.push(eq(marketplaceListings.status, filters.status));
      }

      const rows = await db
        .select()
        .from(marketplaceListings)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(marketplaceListings.createdAt));

      let mapped: MarketplaceProduceListingDto[] = rows.map((r) => ({
        id: r.listingCode,
        dbId: r.id,
        sellerId: r.sellerId,
        farmerName: r.farmerName,
        farmerPhone: r.farmerPhone,
        province: r.province,
        district: r.district,
        tehsil: r.tehsil,
        village: r.village,
        cropName: r.cropName,
        variety: r.variety,
        quantity: r.quantity,
        unit: r.unit,
        price: r.pricePkr,
        quality: r.qualityGrade as any,
        harvestDate: r.harvestDate,
        description: r.description,
        images: Array.isArray(r.images) ? r.images : [],
        videos: Array.isArray(r.videos) ? r.videos : [],
        status: r.status as any,
        viewsCount: r.viewsCount,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
      }));

      if (filters?.search) {
        const q = filters.search.toLowerCase();
        mapped = mapped.filter(
          (l) =>
            l.cropName.toLowerCase().includes(q) ||
            l.district.toLowerCase().includes(q) ||
            l.farmerName.toLowerCase().includes(q) ||
            (l.description && l.description.toLowerCase().includes(q))
        );
      }

      return mapped;
    } catch (error) {
      console.error('[MarketplaceService] Error fetching listings:', error);
      throw new AppError('Failed to retrieve produce listings', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async getListingByCode(listingCode: string): Promise<MarketplaceProduceListingDto> {
    try {
      const [item] = await db
        .select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.listingCode, listingCode))
        .limit(1);

      if (!item) {
        throw new AppError(`Produce listing with code ${listingCode} not found`, 404, 'NOT_FOUND');
      }

      return {
        id: item.listingCode,
        dbId: item.id,
        sellerId: item.sellerId,
        farmerName: item.farmerName,
        farmerPhone: item.farmerPhone,
        province: item.province,
        district: item.district,
        tehsil: item.tehsil,
        village: item.village,
        cropName: item.cropName,
        variety: item.variety,
        quantity: item.quantity,
        unit: item.unit,
        price: item.pricePkr,
        quality: item.qualityGrade as any,
        harvestDate: item.harvestDate,
        description: item.description,
        images: Array.isArray(item.images) ? item.images : [],
        videos: Array.isArray(item.videos) ? item.videos : [],
        status: item.status as any,
        viewsCount: item.viewsCount,
        createdAt: item.createdAt ? item.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: item.updatedAt ? item.updatedAt.toISOString() : undefined,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch listing detail', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async createListing(dto: CreateProduceListingDto): Promise<MarketplaceProduceListingDto> {
    if (!dto.cropName || !dto.quantity || !dto.price || !dto.farmerName || !dto.sellerId) {
      throw new AppError('Crop name, quantity, price, farmer name and seller ID are required', 400, 'VALIDATION_ERROR');
    }

    try {
      // Ensure user exists
      await db.insert(users).values({ uid: dto.sellerId, role: 'farmer' }).onConflictDoNothing();

      const listingCode = `LIST-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const [created] = await db
        .insert(marketplaceListings)
        .values({
          listingCode,
          sellerId: dto.sellerId,
          farmerName: dto.farmerName,
          farmerPhone: dto.farmerPhone,
          province: dto.province || 'Punjab',
          district: dto.district || 'General',
          tehsil: dto.tehsil || null,
          village: dto.village || null,
          cropName: dto.cropName,
          variety: dto.variety || null,
          quantity: dto.quantity,
          unit: dto.unit || 'Kg',
          pricePkr: dto.price.toString(),
          qualityGrade: dto.quality || 'Grade A',
          harvestDate: dto.harvestDate || null,
          description: dto.description || '',
          images: Array.isArray(dto.images) ? dto.images : [],
          videos: Array.isArray(dto.videos) ? dto.videos : [],
          status: 'available',
        })
        .returning();

      return {
        id: created.listingCode,
        dbId: created.id,
        sellerId: created.sellerId,
        farmerName: created.farmerName,
        farmerPhone: created.farmerPhone,
        province: created.province,
        district: created.district,
        tehsil: created.tehsil,
        village: created.village,
        cropName: created.cropName,
        variety: created.variety,
        quantity: created.quantity,
        unit: created.unit,
        price: created.pricePkr,
        quality: created.qualityGrade as any,
        harvestDate: created.harvestDate,
        description: created.description,
        images: Array.isArray(created.images) ? created.images : [],
        videos: Array.isArray(created.videos) ? created.videos : [],
        status: created.status as any,
        viewsCount: created.viewsCount,
        createdAt: created.createdAt ? created.createdAt.toISOString() : new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('[MarketplaceService] Error creating listing:', error);
      throw new AppError('Failed to create produce listing', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async updateListingStatus(
    listingCode: string,
    sellerId: string,
    status: 'available' | 'reserved' | 'sold'
  ): Promise<MarketplaceProduceListingDto> {
    try {
      const [existing] = await db
        .select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.listingCode, listingCode))
        .limit(1);

      if (!existing) {
        throw new AppError(`Listing ${listingCode} not found`, 404, 'NOT_FOUND');
      }

      if (sellerId && existing.sellerId !== sellerId) {
        throw new AppError('You do not have permission to modify this listing', 403, 'FORBIDDEN');
      }

      const [updated] = await db
        .update(marketplaceListings)
        .set({ status, updatedAt: new Date() })
        .where(eq(marketplaceListings.listingCode, listingCode))
        .returning();

      return {
        id: updated.listingCode,
        dbId: updated.id,
        sellerId: updated.sellerId,
        farmerName: updated.farmerName,
        farmerPhone: updated.farmerPhone,
        province: updated.province,
        district: updated.district,
        tehsil: updated.tehsil,
        village: updated.village,
        cropName: updated.cropName,
        variety: updated.variety,
        quantity: updated.quantity,
        unit: updated.unit,
        price: updated.pricePkr,
        quality: updated.qualityGrade as any,
        harvestDate: updated.harvestDate,
        description: updated.description,
        images: Array.isArray(updated.images) ? updated.images : [],
        videos: Array.isArray(updated.videos) ? updated.videos : [],
        status: updated.status as any,
        viewsCount: updated.viewsCount,
        createdAt: updated.createdAt ? updated.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: updated.updatedAt?.toISOString(),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update listing status', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async deleteListing(listingCode: string, sellerId: string): Promise<boolean> {
    try {
      const [existing] = await db
        .select()
        .from(marketplaceListings)
        .where(eq(marketplaceListings.listingCode, listingCode))
        .limit(1);

      if (!existing) {
        throw new AppError(`Listing ${listingCode} not found`, 404, 'NOT_FOUND');
      }

      if (sellerId && existing.sellerId !== sellerId) {
        throw new AppError('You do not have permission to delete this listing', 403, 'FORBIDDEN');
      }

      await db.delete(marketplaceListings).where(eq(marketplaceListings.listingCode, listingCode));
      return true;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete listing', 500, 'DATABASE_ERROR', { cause: error });
    }
  }
}

export const marketplaceService = new MarketplaceService();
