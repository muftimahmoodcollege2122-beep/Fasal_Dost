// ─────────────────────────────────────────────────────────────────────────────
// server/modules/marketplace/marketplace.types.ts
// Kisan Market produce and trading domain contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface ProduceListing {
  id: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  province: string;
  district: string;
  tehsil: string;
  cropName: string;
  variety?: string;
  quantity: string;
  unit: string;
  price: string;
  pricePerUnit?: string;
  quality: 'Premium' | 'Grade A' | 'Grade B' | 'Standard';
  harvestDate?: string;
  availableFrom?: string;
  description: string;
  imageBase64?: string;
  status: 'available' | 'sold' | 'reserved';
  createdAt: string;
  updatedAt?: string;
}

export interface CreateListingDto {
  farmerId?: string;
  farmerName: string;
  farmerPhone: string;
  province: string;
  district: string;
  tehsil?: string;
  cropName: string;
  variety?: string;
  quantity: string;
  unit: string;
  price: string;
  quality: 'Premium' | 'Grade A' | 'Grade B' | 'Standard';
  description?: string;
  imageBase64?: string;
}

export interface ListingFilterDto {
  crop?: string;
  province?: string;
  district?: string;
  quality?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}
