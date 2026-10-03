// ─────────────────────────────────────────────────────────────────────────────
// server/modules/farmers/farmer.interface.ts
// Farmer Module Defined Interface & Data Transfer Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface FarmerProfileDto {
  userId: string;
  fullName: string;
  phoneNumber: string;
  email?: string | null;
  profilePhotoUrl?: string | null;
  cnicNumber?: string | null;
  cnicFrontUrl?: string | null;
  cnicBackUrl?: string | null;
  province: string;
  division?: string | null;
  district?: string | null;
  tehsil?: string | null;
  village?: string | null;
  landSizeAcres?: string | null;
  preferredLanguage?: string | null;
  primaryCrops?: string[] | null;
  verifiedStatus?: boolean | null;
  isSellerVerified?: boolean | null;
  sellerVerificationStatus?: string | null;
  antiBotVerificationScore?: string | null;
  verifiedSellerBadge?: string | null;
  verifiedAt?: Date | null;
  createdAt?: Date | null;
  updatedAt?: Date | null;
}

export interface UpdateFarmerProfileDto {
  fullName?: string;
  phoneNumber?: string;
  email?: string;
  profilePhotoUrl?: string;
  cnicNumber?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  province?: string;
  division?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  landSizeAcres?: string;
  preferredLanguage?: string;
  primaryCrops?: string[];
  isSellerVerified?: boolean;
}

export interface VerifySellerDto {
  fullName: string;
  phoneNumber: string;
  email: string;
  profilePhotoDataUrl: string;
  cnicNumber: string;
  cnicFrontDataUrl: string;
  cnicBackDataUrl: string;
  province: string;
  district: string;
  tehsil?: string;
  village?: string;
  landSizeAcres?: string;
  declarationAccepted: boolean;
}

export interface FarmerOverviewStats {
  totalScans: number;
  totalListings: number;
  activeListings: number;
  verified: boolean;
}

export interface IFarmerModule {
  getProfile(userId: string): Promise<FarmerProfileDto>;
  upsertProfile(userId: string, data: UpdateFarmerProfileDto): Promise<FarmerProfileDto>;
  verifySeller(userId: string, data: VerifySellerDto): Promise<FarmerProfileDto>;
  getStats(userId: string): Promise<FarmerOverviewStats>;
}
