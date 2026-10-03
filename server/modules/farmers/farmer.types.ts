// ─────────────────────────────────────────────────────────────────────────────
// server/modules/farmers/farmer.types.ts
// Farmer domain contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface FarmerProfile {
  uid: string;
  name: string;
  phone: string;
  email?: string;
  province: string;
  division?: string;
  district?: string;
  tehsil?: string;
  landSize?: string;
  crops?: string[];
  totalScans?: number;
  totalListings?: number;
  verified?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateFarmerDto {
  name?: string;
  phone?: string;
  province?: string;
  division?: string;
  district?: string;
  tehsil?: string;
  landSize?: string;
  crops?: string[];
}
