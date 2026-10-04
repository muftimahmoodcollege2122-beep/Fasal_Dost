// ─────────────────────────────────────────────────────────────────────────────
// src/utils/store.ts
// Central state and Database-backed Data Layer for FasalDost (Web edition)
// ─────────────────────────────────────────────────────────────────────────────

import { Language } from './i18n';
import { apiClient } from '../shared/apiClient';
import { apiUrl } from '../lib/config';
import { localStorage } from '../lib/kv';
import { auth } from './firebase';

// ── In-Memory Image Store ────────────────────────────────────────────────────
interface ImageStore {
  uri: string | null;
  base64: string | null;
}

const _image: ImageStore = { uri: null, base64: null };

export const setImage = (uri: string | null, base64: string | null) => {
  _image.uri = uri || null;
  _image.base64 = base64 || null;
};

export const getImage = () => ({
  uri: _image.uri,
  base64: _image.base64,
});

export const clearImage = () => {
  _image.uri = null;
  _image.base64 = null;
};

// ── Language ─────────────────────────────────────────────────────────────────
let _lang: Language = 'en';
export const setLang = (lang: Language) => {
  _lang = lang;
  try {
    localStorage.setItem('fd_lang', lang);
  } catch {}
};
export const getLang = (): Language => {
  try {
    const saved = localStorage.getItem('fd_lang') as Language;
    if (saved && ['en', 'ur', 'zh', 'hi', 'es', 'ar'].includes(saved)) {
      return saved;
    }
  } catch {}
  return 'en';
};

// ── Farmer Unique ID ─────────────────────────────────────────────────────────
const FARMER_ID_KEY = 'fd_farmer_id_v1';

export const getFarmerUniqueId = async (): Promise<string> => {
  const currentAuth = auth.currentUser;
  if (currentAuth?.uid) {
    return currentAuth.uid;
  }

  try {
    let id = localStorage.getItem(FARMER_ID_KEY);
    if (!id) {
      id = `farmer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(FARMER_ID_KEY, id);
    }
    return id;
  } catch {
    return `farmer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
};

// ── Farmer Profile (PostgreSQL Database Backed with Local Cache) ─────────────
const FARMER_PROFILE_CACHE_KEY = 'fd_farmer_profile_cache_v1';

export interface FarmerProfile {
  name: string;
  phone: string;
  email?: string;
  profilePhotoUrl?: string;
  cnicNumber?: string;
  cnicFrontUrl?: string;
  cnicBackUrl?: string;
  province: string;
  division?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  landSize?: string;
  crops?: string[];
  isSellerVerified?: boolean;
  sellerVerificationStatus?: string;
  antiBotVerificationScore?: string;
  verifiedSellerBadge?: string;
  verifiedAt?: string;
  savedAt?: string;
}

export const saveFarmerProfile = async (profile: FarmerProfile): Promise<boolean> => {
  try {
    localStorage.setItem(FARMER_PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {}

  try {
    const uid = await getFarmerUniqueId();
    await apiClient.farmers.updateProfile(uid, {
      fullName: profile.name,
      phoneNumber: profile.phone,
      email: profile.email,
      profilePhotoUrl: profile.profilePhotoUrl,
      cnicNumber: profile.cnicNumber,
      cnicFrontUrl: profile.cnicFrontUrl,
      cnicBackUrl: profile.cnicBackUrl,
      province: profile.province,
      division: profile.division,
      district: profile.district,
      tehsil: profile.tehsil,
      village: profile.village,
      landSizeAcres: profile.landSize,
      primaryCrops: profile.crops,
      isSellerVerified: profile.isSellerVerified,
    });
    return true;
  } catch (e) {
    console.warn('[Store] saveFarmerProfile remote sync warning:', e);
    return true;
  }
};

export const getFarmerProfile = async (): Promise<FarmerProfile | null> => {
  let cached: FarmerProfile | null = null;
  try {
    const stored = localStorage.getItem(FARMER_PROFILE_CACHE_KEY);
    if (stored) {
      cached = JSON.parse(stored);
    }
  } catch {}

  try {
    const uid = await getFarmerUniqueId();
    const res = await apiClient.farmers.getProfile(uid);
    if (!res || !res.fullName) return cached;
    const profile: FarmerProfile = {
      name: res.fullName,
      phone: res.phoneNumber || '',
      email: res.email || '',
      profilePhotoUrl: res.profilePhotoUrl || '',
      cnicNumber: res.cnicNumber || '',
      cnicFrontUrl: res.cnicFrontUrl || '',
      cnicBackUrl: res.cnicBackUrl || '',
      province: res.province || '',
      division: res.division || '',
      district: res.district || '',
      tehsil: res.tehsil || '',
      village: res.village || '',
      landSize: res.landSizeAcres || '',
      crops: res.primaryCrops || [],
      isSellerVerified: !!res.isSellerVerified,
      sellerVerificationStatus: res.sellerVerificationStatus || 'unverified',
      antiBotVerificationScore: res.antiBotVerificationScore || '0',
      verifiedSellerBadge: res.verifiedSellerBadge || 'Verified Genuine Farmer',
      verifiedAt: res.verifiedAt ? new Date(res.verifiedAt).toISOString() : undefined,
      savedAt: res.updatedAt ? new Date(res.updatedAt).toISOString() : undefined,
    };
    try {
      localStorage.setItem(FARMER_PROFILE_CACHE_KEY, JSON.stringify(profile));
    } catch {}
    return profile;
  } catch (e) {
    return cached;
  }
};

export const isProfileComplete = async (): Promise<boolean> => {
  const p = await getFarmerProfile();
  return !!(p && p.name && p.name.trim() && p.province && p.province.trim());
};

export const isSellerVerified = async (): Promise<boolean> => {
  const p = await getFarmerProfile();
  return !!(p && p.isSellerVerified);
};

export const verifyFarmerSeller = async (data: {
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
}): Promise<boolean> => {
  try {
    const uid = await getFarmerUniqueId();
    await apiClient.farmers.verifySeller(uid, data);
    return true;
  } catch (e) {
    console.warn('[Store] verifyFarmerSeller database warning:', e);
    return false;
  }
};

// ── Scan History (PostgreSQL Database Backed) ────────────────────────────────
export interface DiseaseInfo {
  disease_name_en: string;
  disease_name_ur?: string;
  disease_name_localized?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence?: number;
  description_en?: string;
  description_ur?: string;
  description_localized?: string;
  symptoms_en?: string[];
  symptoms_ur?: string[];
  symptoms_localized?: string[];
  treatment_en?: string[];
  treatment_ur?: string[];
  treatment_localized?: string[];
  urgency_en?: string;
  urgency_ur?: string;
  urgency_localized?: string;
}

export interface DetectionResult {
  scanCode?: string;
  is_valid_plant?: boolean;
  is_image_clear?: boolean;
  rejection_code?: 'UNCLEAR_IMAGE' | 'NON_PLANT_IMAGE' | 'NONE';
  rejection_reason_en?: string;
  rejection_reason_ur?: string;
  rejection_reason_localized?: string;
  image_quality?: string;
  crop_detected_en?: string;
  crop_detected_ur?: string;
  crop_detected_localized?: string;
  overall_confidence?: number;
  is_healthy?: boolean;
  diseases?: DiseaseInfo[];
  prevention_en?: string;
  prevention_ur?: string;
  prevention_localized?: string;
  ai_provider?: string;
  ai_model?: string;
  language?: string;
}

// ── OpenRouter Key & Model Settings ─────────────────────────────────────────
export const getOpenRouterApiKey = (): string => {
  try {
    return localStorage.getItem('fd_openrouter_api_key') || '';
  } catch {
    return '';
  }
};

export const setOpenRouterApiKey = (key: string) => {
  try {
    if (key && key.trim()) {
      localStorage.setItem('fd_openrouter_api_key', key.trim());
    } else {
      localStorage.removeItem('fd_openrouter_api_key');
    }
  } catch {}
};

export const getOpenRouterModel = (): string => {
  try {
    return localStorage.getItem('fd_openrouter_model') || 'google/gemini-2.5-pro';
  } catch {
    return 'google/gemini-2.5-pro';
  }
};

export const setOpenRouterModel = (model: string) => {
  try {
    localStorage.setItem('fd_openrouter_model', model);
  } catch {}
};

export interface HistoryItem {
  id: string;
  date: string;
  imageUri: string | null;
  cropName: string;
  result: DetectionResult;
}

export const saveToHistory = async ({
  imageUri: _imageUri,
  cropName: _cropName,
  result: _result,
}: {
  imageUri: string | null;
  cropName: string;
  result: DetectionResult;
}): Promise<boolean> => {
  // Scans are automatically saved into the PostgreSQL diagnostic_scans table during /api/diagnostics/scan
  return true;
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const raw = await apiClient.diagnostics.getHistory(50);
    return raw.map((item) => ({
      id: item.scanCode || `scan_${Math.random()}`,
      date: item.createdAt || new Date().toISOString(),
      imageUri: null,
      cropName: item.crop_detected_en || '',
      result: {
        image_quality: item.image_quality,
        crop_detected_en: item.crop_detected_en,
        overall_confidence: item.overall_confidence,
        is_healthy: item.is_healthy,
        prevention_en: item.prevention_en,
        diseases: (item.diseases || []).map((d) => ({
          disease_name_en: d.disease_name_en,
          severity: d.severity,
          confidence: d.confidence,
          description_en: d.description_en,
          symptoms_en: d.symptoms_en,
          treatment_en: d.treatment_en,
          urgency_en: d.urgency_en,
        })),
      },
    }));
  } catch (e) {
    console.warn('[Store] getHistory database warning:', e);
    return [];
  }
};

export const clearHistory = async (): Promise<boolean> => {
  try {
    return await apiClient.diagnostics.clearHistory();
  } catch (e) {
    console.warn('[Store] clearHistory database warning:', e);
    return false;
  }
};

export const deleteHistoryItem = async (id: string): Promise<boolean> => {
  try {
    return await apiClient.diagnostics.deleteScan(id);
  } catch (e) {
    console.warn('[Store] deleteHistoryItem database warning:', e);
    return false;
  }
};

// ── Daily Free Scan Counter (Strict 7 Scans / Day) ───────────────────────────
const DAILY_LIMIT_KEY = 'fd_daily_scans_v1';
const MAX_FREE_SCANS = 7;

interface DailyScanData {
  date: string;
  count: number;
}

export const checkDailyLimit = async (): Promise<{
  allowed: boolean;
  remaining: number;
  count: number;
  limit: number;
}> => {
  try {
    const response = await fetch(apiUrl('/api/diagnostics/quota'), {
      headers: {
        'x-user-uid': await getFarmerUniqueId(),
      },
    });
    if (response.ok) {
      const res = await response.json();
      if (res.success && res.data) {
        return {
          allowed: res.data.scansToday < res.data.dailyLimit,
          remaining: res.data.scansRemaining,
          count: res.data.scansToday,
          limit: res.data.dailyLimit,
        };
      }
    }
  } catch (e) {
    console.warn('[Store] Could not fetch server quota, using local check:', e);
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(DAILY_LIMIT_KEY);
    const data: DailyScanData = raw ? JSON.parse(raw) : { date: today, count: 0 };

    if (data.date !== today) {
      return { allowed: true, remaining: MAX_FREE_SCANS, count: 0, limit: MAX_FREE_SCANS };
    }

    const count = data.count || 0;
    const remaining = Math.max(0, MAX_FREE_SCANS - count);
    return {
      allowed: count < MAX_FREE_SCANS,
      remaining,
      count,
      limit: MAX_FREE_SCANS,
    };
  } catch {
    return { allowed: true, remaining: MAX_FREE_SCANS, count: 0, limit: MAX_FREE_SCANS };
  }
};

export const incrementDailyCount = async (): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(DAILY_LIMIT_KEY);
    const data: DailyScanData = raw ? JSON.parse(raw) : { date: today, count: 0 };

    if (data.date !== today) {
      localStorage.setItem(DAILY_LIMIT_KEY, JSON.stringify({ date: today, count: 1 }));
    } else {
      localStorage.setItem(
        DAILY_LIMIT_KEY,
        JSON.stringify({ date: today, count: (data.count || 0) + 1 })
      );
    }
  } catch (e) {
    console.warn('incrementDailyCount error:', e);
  }
};

// ── Marketplace Listings (PostgreSQL Database Backed) ────────────────────────
export interface ProduceListing {
  id: string; // listing_code
  dbId?: number;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  province: string;
  district?: string;
  tehsil?: string;
  village?: string;
  cropName: string;
  variety?: string;
  quantity: string;
  unit: string;
  price: string;
  quality: 'premium' | 'medium' | 'fresh' | 'Grade A' | 'Grade B' | 'Standard' | 'Premium';
  harvestDate?: string;
  description?: string;
  images: string[];
  videos: string[];
  imageBase64?: string | null;
  status: 'available' | 'reserved' | 'sold' | 'active' | 'deleted';
  sellerVerified?: boolean;
  verifiedBadge?: string;
  createdAt?: string;
}

export const createListing = async (
  listing: Partial<ProduceListing> & {
    cropName: string;
    quantity: string;
    unit: string;
    price: string;
    quality: any;
  }
): Promise<string | null> => {
  try {
    const profile = await getFarmerProfile();
    const farmerId = await getFarmerUniqueId();

    const farmerName = listing.farmerName?.trim() || profile?.name?.trim() || 'Farmer';
    const farmerPhone = listing.farmerPhone?.trim() || profile?.phone?.trim() || '';
    const province = listing.province?.trim() || profile?.province?.trim() || 'Punjab';
    const district = listing.district?.trim() || profile?.district?.trim() || 'General';
    const tehsil = listing.tehsil?.trim() || profile?.tehsil?.trim() || '';
    const village = listing.village?.trim() || profile?.village?.trim() || '';

    const result = await apiClient.marketplace.createListing({
      sellerId: farmerId,
      farmerName,
      farmerPhone,
      province,
      district,
      tehsil,
      village,
      cropName: listing.cropName || '',
      variety: listing.variety || '',
      quantity: listing.quantity || '',
      unit: listing.unit || 'Kg',
      price: listing.price || '',
      quality: (listing.quality === 'premium' ? 'Premium' : listing.quality === 'fresh' ? 'Premium' : 'Grade A') as any,
      harvestDate: listing.harvestDate || '',
      description: listing.description || '',
      images: listing.images || (listing.imageBase64 ? [listing.imageBase64] : []),
      videos: listing.videos || [],
    });

    return result.id;
  } catch (e) {
    console.warn('[Store] createListing database warning:', e);
    return null;
  }
};

export const getListings = async (_includeAllStatus = false): Promise<ProduceListing[]> => {
  try {
    const listings = await apiClient.marketplace.getListings();
    return listings.map((l) => ({
      id: l.id,
      dbId: l.dbId,
      farmerId: l.sellerId,
      farmerName: l.farmerName,
      farmerPhone: l.farmerPhone,
      province: l.province,
      district: l.district,
      tehsil: l.tehsil || '',
      village: l.village || '',
      cropName: l.cropName,
      variety: l.variety || '',
      quantity: l.quantity,
      unit: l.unit,
      price: l.price,
      quality: l.quality,
      harvestDate: l.harvestDate || '',
      description: l.description || '',
      images: Array.isArray(l.images) ? l.images : [],
      videos: Array.isArray(l.videos) ? l.videos : [],
      imageBase64: Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null,
      status: l.status,
      createdAt: l.createdAt,
    }));
  } catch (e) {
    console.warn('[Store] getListings database warning:', e);
    return [];
  }
};

export const getMyListings = async (): Promise<ProduceListing[]> => {
  try {
    const farmerId = await getFarmerUniqueId();
    const listings = await apiClient.marketplace.getListings({ sellerId: farmerId });
    return listings.map((l) => ({
      id: l.id,
      dbId: l.dbId,
      farmerId: l.sellerId,
      farmerName: l.farmerName,
      farmerPhone: l.farmerPhone,
      province: l.province,
      district: l.district,
      tehsil: l.tehsil || '',
      village: l.village || '',
      cropName: l.cropName,
      variety: l.variety || '',
      quantity: l.quantity,
      unit: l.unit,
      price: l.price,
      quality: l.quality,
      harvestDate: l.harvestDate || '',
      description: l.description || '',
      images: Array.isArray(l.images) ? l.images : [],
      videos: Array.isArray(l.videos) ? l.videos : [],
      imageBase64: Array.isArray(l.images) && l.images.length > 0 ? l.images[0] : null,
      status: l.status,
      createdAt: l.createdAt,
    }));
  } catch (e) {
    console.warn('[Store] getMyListings database warning:', e);
    return [];
  }
};

export const markListingSold = async (id: string): Promise<boolean> => {
  try {
    const farmerId = await getFarmerUniqueId();
    const res = await fetch(apiUrl(`/api/marketplace/listings/${id}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-uid': farmerId,
      },
      body: JSON.stringify({ status: 'sold' }),
    });
    return res.ok;
  } catch (e) {
    console.warn('[Store] markListingSold database warning:', e);
    return false;
  }
};

export const deleteListing = async (id: string): Promise<boolean> => {
  try {
    return await apiClient.marketplace.deleteListing(id);
  } catch (e) {
    console.warn('[Store] deleteListing database warning:', e);
    return false;
  }
};
