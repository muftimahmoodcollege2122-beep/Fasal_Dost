// ─────────────────────────────────────────────────────────────────────────────
// server/modules/auth/auth.interface.ts
// Shared Authentication (Web, Android, iOS) Interface & Contracts
// ─────────────────────────────────────────────────────────────────────────────

export interface UserAccountDto {
  id?: number;
  uid: string;
  email?: string | null;
  phone?: string | null;
  displayName?: string | null;
  photoUrl?: string | null;
  platform: 'web' | 'android' | 'ios';
  role: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SyncUserRequestDto {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoUrl?: string;
  platform?: 'web' | 'android' | 'ios';
}

export interface SendEmailOtpDto {
  email: string;
}

export interface VerifyEmailOtpDto {
  email: string;
  otp: string;
}

export interface RegisterFarmerDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string;
  otp?: string;
}

export interface LoginFarmerDto {
  email: string;
  password?: string;
}

export interface IAuthModule {
  syncUser(dto: SyncUserRequestDto): Promise<UserAccountDto>;
  getUserByUid(uid: string): Promise<UserAccountDto | null>;
  verifyToken(token: string): Promise<UserAccountDto>;
  sendEmailOtp(email: string, farmerName?: string): Promise<{ success: boolean; message: string; otp?: string; previewUrl?: string | false; isCustomSmtp?: boolean }>;
  verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean }>;
  registerFarmer(dto: RegisterFarmerDto): Promise<UserAccountDto>;
  loginFarmer(dto: LoginFarmerDto): Promise<UserAccountDto>;
}
