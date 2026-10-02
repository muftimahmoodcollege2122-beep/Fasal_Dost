// ─────────────────────────────────────────────────────────────────────────────
// src/shared/services/apiClient.ts
// Typed client for backend modular monolith with shared cross-platform auth
// ─────────────────────────────────────────────────────────────────────────────

import { auth } from '../../utils/firebase';
import { DiagnosticResultDto } from '../../../server/modules/diagnostics/diagnostics.interface';
import { MarketplaceProduceListingDto } from '../../../server/modules/marketplace/marketplace.interface';
import { FarmerProfileDto, FarmerOverviewStats } from '../../../server/modules/farmers/farmer.interface';
import { UserAccountDto, RegisterFarmerDto } from '../../../server/modules/auth/auth.interface';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: any;
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        return await currentUser.getIdToken();
      }
    } catch (e) {
      console.warn('[ApiClient] Failed to get auth token:', e);
    }
    return null;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.getAuthToken();
    const currentUser = auth.currentUser;
    const fallbackUid = typeof window !== 'undefined' ? localStorage.getItem('fd_farmer_id_v1') : null;
    const uid = currentUser?.uid || fallbackUid || 'guest_farmer';
    const openRouterKey = typeof window !== 'undefined' ? localStorage.getItem('fd_openrouter_api_key') : null;
    const openRouterModel = typeof window !== 'undefined' ? localStorage.getItem('fd_openrouter_model') : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-client-platform': 'web',
      'x-user-uid': uid,
      ...(openRouterKey ? { 'x-openrouter-api-key': openRouterKey } : {}),
      ...(openRouterModel ? { 'x-openrouter-model': openRouterModel } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    const body: ApiResponse<T> = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || `Request failed with status ${res.status}`);
    }

    return body.data as T;
  }

  public auth = {
    getMe: async (): Promise<UserAccountDto> => {
      return this.request<UserAccountDto>('/api/auth/me');
    },
    syncUser: async (data: { uid: string; email?: string; phone?: string; displayName?: string; photoUrl?: string }): Promise<UserAccountDto> => {
      return this.request<UserAccountDto>('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({ ...data, platform: 'web' }),
      });
    },
    sendEmailOtp: async (email: string, farmerName?: string): Promise<{ success: boolean; message: string; otp?: string; previewUrl?: string | false; isCustomSmtp?: boolean }> => {
      return this.request<{ success: boolean; message: string; otp?: string; previewUrl?: string | false; isCustomSmtp?: boolean }>('/api/auth/send-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email, farmerName }),
      });
    },
    verifyEmailOtp: async (email: string, otp: string): Promise<{ success: boolean }> => {
      return this.request<{ success: boolean }>('/api/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
    },
    register: async (data: RegisterFarmerDto): Promise<UserAccountDto> => {
      return this.request<UserAccountDto>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    login: async (email: string, password?: string): Promise<UserAccountDto> => {
      return this.request<UserAccountDto>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    },
  };

  public diagnostics = {
    scan: async (
      imageBase64: string,
      cropName = '',
      province?: string,
      district?: string,
      openRouterApiKey?: string,
      openRouterModel?: string
    ): Promise<DiagnosticResultDto> => {
      return this.request<DiagnosticResultDto>('/api/diagnostics/scan', {
        method: 'POST',
        body: JSON.stringify({
          imageBase64,
          cropName,
          province,
          district,
          openRouterApiKey,
          openRouterModel,
        }),
      });
    },
    getHistory: async (limit = 20): Promise<DiagnosticResultDto[]> => {
      return this.request<DiagnosticResultDto[]>(`/api/diagnostics/history?limit=${limit}`);
    },
    deleteScan: async (scanCode: string): Promise<boolean> => {
      await this.request(`/api/diagnostics/history/${scanCode}`, { method: 'DELETE' });
      return true;
    },
    clearHistory: async (): Promise<boolean> => {
      await this.request('/api/diagnostics/history', { method: 'DELETE' });
      return true;
    },
    getSupportedCrops: async (): Promise<string[]> => {
      const res = await this.request<{ crops: string[] }>('/api/diagnostics/crops');
      return res.crops;
    },
  };

  public marketplace = {
    getListings: async (params?: Record<string, string>): Promise<MarketplaceProduceListingDto[]> => {
      const searchParams = new URLSearchParams(params);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request<MarketplaceProduceListingDto[]>(`/api/marketplace/listings${query}`);
    },
    getListingById: async (id: string): Promise<MarketplaceProduceListingDto> => {
      return this.request<MarketplaceProduceListingDto>(`/api/marketplace/listings/${id}`);
    },
    createListing: async (listing: any): Promise<MarketplaceProduceListingDto> => {
      return this.request<MarketplaceProduceListingDto>('/api/marketplace/listings', {
        method: 'POST',
        body: JSON.stringify(listing),
      });
    },
    deleteListing: async (id: string): Promise<boolean> => {
      await this.request(`/api/marketplace/listings/${id}`, { method: 'DELETE' });
      return true;
    },
  };

  public storage = {
    upload: async (folder: string, fileData: string, originalName?: string): Promise<{ url: string; key: string }> => {
      return this.request<{ url: string; key: string }>('/api/storage/upload', {
        method: 'POST',
        body: JSON.stringify({ folder, fileData, originalName }),
      });
    },
  };

  public farmers = {
    getProfile: async (uid: string): Promise<FarmerProfileDto & { stats?: FarmerOverviewStats }> => {
      return this.request<FarmerProfileDto & { stats?: FarmerOverviewStats }>(`/api/farmers/profile/${uid}`);
    },
    updateProfile: async (uid: string, data: any): Promise<FarmerProfileDto> => {
      return this.request<FarmerProfileDto>(`/api/farmers/profile/${uid}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    verifySeller: async (uid: string, data: any): Promise<FarmerProfileDto> => {
      return this.request<FarmerProfileDto>(`/api/farmers/verify-seller/${uid}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    getVerifications: async (): Promise<any[]> => {
      return this.request<any[]>('/api/farmers/admin/verifications');
    },
    reviewVerification: async (uid: string, decision: 'approved' | 'rejected', reason?: string): Promise<any> => {
      return this.request<any>(`/api/farmers/admin/verifications/${uid}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision, reason }),
      });
    },
    getStats: async (uid: string): Promise<FarmerOverviewStats> => {
      return this.request<FarmerOverviewStats>(`/api/farmers/stats?uid=${uid}`);
    },
  };
}

export const apiClient = new ApiClient();
