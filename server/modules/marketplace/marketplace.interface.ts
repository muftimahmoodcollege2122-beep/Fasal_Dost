// ─────────────────────────────────────────────────────────────────────────────
// server/modules/marketplace/marketplace.interface.ts
// Kisan Marketplace Defined Interface & Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface MarketplaceProduceListingDto {
  id: string; // listing_code
  dbId?: number;
  sellerId: string;
  farmerName: string;
  farmerPhone: string;
  province: string;
  district: string;
  tehsil?: string | null;
  village?: string | null;
  cropName: string;
  variety?: string | null;
  quantity: string;
  unit: string;
  price: string;
  quality: 'Premium' | 'Grade A' | 'Grade B' | 'Standard';
  harvestDate?: string | null;
  description?: string | null;
  images: string[];
  videos: string[];
  status: 'available' | 'sold' | 'reserved';
  viewsCount?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProduceListingDto {
  sellerId: string;
  farmerName: string;
  farmerPhone: string;
  province: string;
  district: string;
  tehsil?: string;
  village?: string;
  cropName: string;
  variety?: string;
  quantity: string;
  unit?: string;
  price: string;
  quality?: 'Premium' | 'Grade A' | 'Grade B' | 'Standard';
  harvestDate?: string;
  description?: string;
  images?: string[];
  videos?: string[];
}

export interface MarketplaceFilterDto {
  crop?: string;
  province?: string;
  district?: string;
  quality?: string;
  search?: string;
  sellerId?: string;
  status?: string;
}

export interface IMarketplaceModule {
  getListings(filters?: MarketplaceFilterDto): Promise<MarketplaceProduceListingDto[]>;
  getListingByCode(listingCode: string): Promise<MarketplaceProduceListingDto>;
  createListing(dto: CreateProduceListingDto): Promise<MarketplaceProduceListingDto>;
  updateListingStatus(listingCode: string, sellerId: string, status: 'available' | 'reserved' | 'sold'): Promise<MarketplaceProduceListingDto>;
  deleteListing(listingCode: string, sellerId: string): Promise<boolean>;
}
