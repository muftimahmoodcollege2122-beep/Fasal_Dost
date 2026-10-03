// ─────────────────────────────────────────────────────────────────────────────
// mobile/utils/api.ts
// Typed API Client for FasalDost Mobile Application
// ─────────────────────────────────────────────────────────────────────────────

export const API_BASE_URL = 'https://ais-dev-hexsq6a75nx3v7mukdbtq4-171051146732.asia-southeast1.run.app';

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

class MobileApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-client-platform': 'mobile-expo',
      ...(options?.headers as Record<string, string>),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    const body: ApiResponse<T> = await res.json();
    if (!res.ok || !body.success) {
      throw new Error(body.error?.message || `Request failed with status ${res.status}`);
    }

    return body.data as T;
  }

  public diagnostics = {
    scan: async (
      imageBase64: string,
      cropName = '',
      language = 'en'
    ): Promise<any> => {
      return this.request('/api/diagnostics/scan', {
        method: 'POST',
        headers: { 'x-app-language': language },
        body: JSON.stringify({ imageBase64, cropName, language }),
      });
    },
    synthesizeSpeech: async (
      text: string,
      language = 'ur',
      voiceName?: string
    ): Promise<{ audioBase64: string; mimeType: string }> => {
      return this.request('/api/diagnostics/tts', {
        method: 'POST',
        headers: { 'x-app-language': language },
        body: JSON.stringify({ text, language, voiceName }),
      });
    },
    getHistory: async (limit = 30): Promise<any[]> => {
      return this.request(`/api/diagnostics/history?limit=${limit}`);
    },
    deleteScan: async (scanCode: string): Promise<boolean> => {
      await this.request(`/api/diagnostics/history/${scanCode}`, { method: 'DELETE' });
      return true;
    },
    clearHistory: async (): Promise<boolean> => {
      await this.request('/api/diagnostics/history', { method: 'DELETE' });
      return true;
    },
    getCrops: async (): Promise<string[]> => {
      const res = await this.request<{ crops: string[] }>('/api/diagnostics/crops');
      return res.crops;
    },
  };

  public marketplace = {
    getListings: async (params?: Record<string, string>): Promise<any[]> => {
      const searchParams = new URLSearchParams(params);
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return this.request(`/api/marketplace/listings${query}`);
    },
    getListingById: async (id: string): Promise<any> => {
      return this.request(`/api/marketplace/listings/${id}`);
    },
    createListing: async (listing: any): Promise<any> => {
      return this.request('/api/marketplace/listings', {
        method: 'POST',
        body: JSON.stringify(listing),
      });
    },
    deleteListing: async (id: string): Promise<boolean> => {
      await this.request(`/api/marketplace/listings/${id}`, { method: 'DELETE' });
      return true;
    },
  };

  public farmers = {
    getProfile: async (uid: string): Promise<any> => {
      return this.request(`/api/farmers/profile/${uid}`);
    },
    updateProfile: async (uid: string, data: any): Promise<any> => {
      return this.request(`/api/farmers/profile/${uid}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    verifySeller: async (uid: string, data: any): Promise<any> => {
      return this.request(`/api/farmers/verify-seller/${uid}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  };

  public auth = {
    sendEmailOtp: async (email: string, farmerName?: string): Promise<any> => {
      return this.request('/api/auth/send-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email, farmerName }),
      });
    },
    verifyEmailOtp: async (email: string, otp: string): Promise<any> => {
      return this.request('/api/auth/verify-email-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      });
    },
  };
}

export const mobileApi = new MobileApiClient();
