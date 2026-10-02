// ─────────────────────────────────────────────────────────────────────────────
// server/modules/auth/auth.service.ts
// Shared Authentication Service (PostgreSQL Users Table + Email OTP Verification)
// ─────────────────────────────────────────────────────────────────────────────

import { eq } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import { users, farmerProfiles } from '../../../src/db/schema.ts';
import { adminAuth } from '../../core/firebase-admin';
import { AppError } from '../../core/types';
import { sendOtpEmail } from '../../core/mailer';
import {
  IAuthModule,
  UserAccountDto,
  SyncUserRequestDto,
  RegisterFarmerDto,
} from './auth.interface';

// In-Memory store for Email OTP verification codes (with 10-minute expiry)
interface OtpEntry {
  code: string;
  expiresAt: number;
}
const emailOtpStore = new Map<string, OtpEntry>();

export class AuthService implements IAuthModule {
  public async sendEmailOtp(email: string, farmerName?: string): Promise<{ success: boolean; message: string; isCustomSmtp?: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new AppError('A valid email address is required', 400, 'INVALID_EMAIL');
    }

    // Generate genuine random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    emailOtpStore.set(cleanEmail, { code: otp, expiresAt });

    console.log(`[EmailOTP] Generated genuine OTP for ${cleanEmail}: ${otp}`);

    // Dispatch genuine email via real Gmail SMTP mailer
    try {
      await sendOtpEmail(cleanEmail, otp, farmerName);
    } catch (mailErr) {
      console.error('[EmailOTP] Mail dispatch error:', mailErr);
      throw new AppError('Failed to dispatch verification email. Please ensure your email is correct and try again.', 500, 'MAIL_SEND_FAILED');
    }

    return {
      success: true,
      message: `A genuine 6-digit verification code has been dispatched to ${cleanEmail}. Please check your inbox or spam folder.`,
      isCustomSmtp: true,
    };
  }

  public async verifyEmailOtp(email: string, otp: string): Promise<{ success: boolean }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = (otp || '').trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      throw new AppError('Please provide the 6-digit verification code sent to your email.', 400, 'INVALID_OTP');
    }

    const record = emailOtpStore.get(cleanEmail);
    if (!record) {
      throw new AppError('No verification OTP found for this email address or code expired. Please tap "Resend Code".', 400, 'OTP_NOT_FOUND');
    }

    if (Date.now() > record.expiresAt) {
      emailOtpStore.delete(cleanEmail);
      throw new AppError('The verification code has expired. Please request a new code.', 400, 'OTP_EXPIRED');
    }

    if (record.code !== cleanOtp) {
      throw new AppError('Incorrect verification code. Please check your email inbox and try again.', 400, 'INCORRECT_OTP');
    }

    // OTP Verified successfully!
    emailOtpStore.delete(cleanEmail);
    return { success: true };
  }

  public async registerFarmer(dto: RegisterFarmerDto): Promise<UserAccountDto> {
    const cleanEmail = dto.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new AppError('Valid email address is required', 400, 'INVALID_EMAIL');
    }

    if (!dto.firstName?.trim() || !dto.lastName?.trim()) {
      throw new AppError('First Name and Last Name are required', 400, 'NAME_REQUIRED');
    }

    // MANDATORY OTP VALIDATION: Ensure user verified the OTP sent to their email
    if (!dto.otp || dto.otp.trim().length !== 6) {
      throw new AppError('Email verification code is required to register. Please enter the 6-digit OTP sent to your email.', 400, 'OTP_REQUIRED');
    }

    // Verify OTP strictly
    await this.verifyEmailOtp(cleanEmail, dto.otp);

    const fullName = [
      dto.firstName.trim(),
      dto.middleName?.trim() || '',
      dto.lastName.trim(),
    ]
      .filter(Boolean)
      .join(' ');

    const phone = dto.phone?.trim() || '';
    const uid = `farmer_user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      // 1. Insert into PostgreSQL users table
      const [savedUser] = await db
        .insert(users)
        .values({
          uid,
          email: cleanEmail,
          phone,
          displayName: fullName,
          platform: 'web',
          role: 'farmer',
          isActive: true,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: cleanEmail,
            phone,
            displayName: fullName,
            updatedAt: new Date(),
          },
        })
        .returning();

      // 2. Insert into PostgreSQL farmer_profiles table
      await db
        .insert(farmerProfiles)
        .values({
          userId: uid,
          fullName,
          phoneNumber: phone,
          province: 'Punjab',
          preferredLanguage: 'en',
        })
        .onConflictDoUpdate({
          target: farmerProfiles.userId,
          set: {
            fullName,
            phoneNumber: phone,
            updatedAt: new Date(),
          },
        });

      return {
        id: savedUser.id,
        uid: savedUser.uid,
        email: savedUser.email,
        phone: savedUser.phone,
        displayName: savedUser.displayName,
        photoUrl: savedUser.photoUrl,
        platform: 'web',
        role: 'farmer',
        isActive: true,
        createdAt: savedUser.createdAt?.toISOString(),
        updatedAt: savedUser.updatedAt?.toISOString(),
      };
    } catch (error) {
      console.error('[AuthService] Error registering farmer into PostgreSQL:', error);
      throw new AppError('Failed to register farmer in database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async loginFarmer(dto: { email: string; password?: string }): Promise<UserAccountDto> {
    const cleanEmail = dto.email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new AppError('Email address is required', 400, 'EMAIL_REQUIRED');
    }

    try {
      const [user] = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (!user) {
        throw new AppError('No account registered with this email. Please register first.', 404, 'USER_NOT_FOUND');
      }

      return {
        id: user.id,
        uid: user.uid,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        platform: (user.platform as any) || 'web',
        role: user.role || 'farmer',
        isActive: !!user.isActive,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('[AuthService] Error logging in farmer:', error);
      throw new AppError('Failed to authenticate with database', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async syncUser(dto: SyncUserRequestDto): Promise<UserAccountDto> {
    if (!dto.uid) {
      throw new AppError('UID is required', 400, 'INVALID_UID');
    }

    try {
      const [saved] = await db
        .insert(users)
        .values({
          uid: dto.uid,
          email: dto.email || null,
          phone: dto.phone || null,
          displayName: dto.displayName || null,
          photoUrl: dto.photoUrl || null,
          platform: dto.platform || 'web',
          role: 'farmer',
          isActive: true,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email: dto.email || undefined,
            phone: dto.phone || undefined,
            displayName: dto.displayName || undefined,
            photoUrl: dto.photoUrl || undefined,
            platform: dto.platform || undefined,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        id: saved.id,
        uid: saved.uid,
        email: saved.email,
        phone: saved.phone,
        displayName: saved.displayName,
        photoUrl: saved.photoUrl,
        platform: (saved.platform as any) || 'web',
        role: saved.role || 'farmer',
        isActive: !!saved.isActive,
        createdAt: saved.createdAt?.toISOString(),
        updatedAt: saved.updatedAt?.toISOString(),
      };
    } catch (error) {
      console.error('[AuthService] Error syncing user:', error);
      throw new AppError('Failed to sync user profile', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async getUserByUid(uid: string): Promise<UserAccountDto | null> {
    try {
      const [user] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
      if (!user) return null;

      return {
        id: user.id,
        uid: user.uid,
        email: user.email,
        phone: user.phone,
        displayName: user.displayName,
        photoUrl: user.photoUrl,
        platform: (user.platform as any) || 'web',
        role: user.role || 'farmer',
        isActive: !!user.isActive,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString(),
      };
    } catch (error) {
      console.error('[AuthService] Error fetching user:', error);
      throw new AppError('Database error fetching user', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async verifyToken(token: string): Promise<UserAccountDto> {
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      return await this.syncUser({
        uid: decoded.uid,
        email: decoded.email,
        phone: decoded.phone_number,
        displayName: decoded.name,
        photoUrl: decoded.picture,
      });
    } catch (error: any) {
      throw new AppError('Invalid token verification', 401, 'INVALID_TOKEN', { cause: error });
    }
  }
}

export const authService = new AuthService();
