// ─────────────────────────────────────────────────────────────────────────────
// server/modules/farmers/farmer.service.ts
// Farmer Module Service Implementation using PostgreSQL & Drizzle ORM
// ─────────────────────────────────────────────────────────────────────────────

import { eq, sql, desc } from 'drizzle-orm';
import { db } from '../../../src/db/index.ts';
import { farmerProfiles, users, diagnosticScans, marketplaceListings } from '../../../src/db/schema.ts';
import {
  IFarmerModule,
  FarmerProfileDto,
  UpdateFarmerProfileDto,
  VerifySellerDto,
  FarmerOverviewStats,
} from './farmer.interface';
import { AppError } from '../../core/types';
import { storageService } from '../storage/storage.service';
import { documentVerificationService } from './verification.service';

export class FarmerService implements IFarmerModule {
  public async getProfile(userId: string): Promise<FarmerProfileDto> {
    try {
      const [existingUser] = await db.select().from(users).where(eq(users.uid, userId)).limit(1);
      if (!existingUser) {
        await db.insert(users).values({ uid: userId, role: 'farmer' }).onConflictDoNothing();
      }

      const [profile] = await db
        .select()
        .from(farmerProfiles)
        .where(eq(farmerProfiles.userId, userId))
        .limit(1);

      if (!profile) {
        return {
          userId,
          fullName: existingUser?.displayName || '',
          phoneNumber: existingUser?.phone || '',
          email: existingUser?.email || '',
          profilePhotoUrl: existingUser?.photoUrl || null,
          cnicNumber: null,
          cnicFrontUrl: null,
          cnicBackUrl: null,
          province: '',
          division: '',
          district: '',
          tehsil: '',
          village: '',
          landSizeAcres: '',
          preferredLanguage: 'en',
          primaryCrops: [],
          verifiedStatus: false,
          isSellerVerified: false,
          sellerVerificationStatus: 'unverified',
          antiBotVerificationScore: '0',
          verifiedSellerBadge: 'Unverified Seller',
        };
      }

      return {
        userId: profile.userId,
        fullName: profile.fullName || '',
        phoneNumber: profile.phoneNumber || '',
        email: profile.email || existingUser?.email || '',
        profilePhotoUrl: profile.profilePhotoUrl || existingUser?.photoUrl || null,
        cnicNumber: profile.cnicNumber,
        cnicFrontUrl: profile.cnicFrontUrl,
        cnicBackUrl: profile.cnicBackUrl,
        province: profile.province || '',
        division: profile.division || '',
        district: profile.district || '',
        tehsil: profile.tehsil || '',
        village: profile.village || '',
        landSizeAcres: profile.landSizeAcres || '',
        preferredLanguage: profile.preferredLanguage || 'en',
        primaryCrops: profile.primaryCrops || [],
        verifiedStatus: !!profile.verifiedStatus,
        isSellerVerified: !!profile.isSellerVerified,
        sellerVerificationStatus: profile.sellerVerificationStatus || 'unverified',
        antiBotVerificationScore: profile.antiBotVerificationScore,
        verifiedSellerBadge: profile.verifiedSellerBadge || 'Verified Genuine Farmer',
        verifiedAt: profile.verifiedAt,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      };
    } catch (error) {
      console.error('[FarmerService] Error fetching profile:', error);
      throw new AppError('Unable to load farmer profile', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async upsertProfile(userId: string, data: UpdateFarmerProfileDto): Promise<FarmerProfileDto> {
    if (!userId) {
      throw new AppError('User ID is required', 400, 'INVALID_USER');
    }

    try {
      await db.insert(users).values({ uid: userId, role: 'farmer' }).onConflictDoNothing();

      const [updated] = await db
        .insert(farmerProfiles)
        .values({
          userId,
          fullName: data.fullName || '',
          phoneNumber: data.phoneNumber || '',
          email: data.email || null,
          profilePhotoUrl: data.profilePhotoUrl || null,
          cnicNumber: data.cnicNumber || null,
          cnicFrontUrl: data.cnicFrontUrl || null,
          cnicBackUrl: data.cnicBackUrl || null,
          province: data.province || '',
          division: data.division || '',
          district: data.district || '',
          tehsil: data.tehsil || '',
          village: data.village || '',
          landSizeAcres: data.landSizeAcres || '',
          preferredLanguage: data.preferredLanguage || 'en',
          primaryCrops: data.primaryCrops || [],
          isSellerVerified: data.isSellerVerified ?? false,
        })
        .onConflictDoUpdate({
          target: farmerProfiles.userId,
          set: {
            fullName: data.fullName !== undefined ? data.fullName : undefined,
            phoneNumber: data.phoneNumber !== undefined ? data.phoneNumber : undefined,
            email: data.email !== undefined ? data.email : undefined,
            profilePhotoUrl: data.profilePhotoUrl !== undefined ? data.profilePhotoUrl : undefined,
            cnicNumber: data.cnicNumber !== undefined ? data.cnicNumber : undefined,
            cnicFrontUrl: data.cnicFrontUrl !== undefined ? data.cnicFrontUrl : undefined,
            cnicBackUrl: data.cnicBackUrl !== undefined ? data.cnicBackUrl : undefined,
            province: data.province !== undefined ? data.province : undefined,
            division: data.division !== undefined ? data.division : undefined,
            district: data.district !== undefined ? data.district : undefined,
            tehsil: data.tehsil !== undefined ? data.tehsil : undefined,
            village: data.village !== undefined ? data.village : undefined,
            landSizeAcres: data.landSizeAcres !== undefined ? data.landSizeAcres : undefined,
            preferredLanguage: data.preferredLanguage !== undefined ? data.preferredLanguage : undefined,
            primaryCrops: data.primaryCrops !== undefined ? data.primaryCrops : undefined,
            isSellerVerified: data.isSellerVerified !== undefined ? data.isSellerVerified : undefined,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        userId: updated.userId,
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber,
        email: updated.email,
        profilePhotoUrl: updated.profilePhotoUrl,
        cnicNumber: updated.cnicNumber,
        cnicFrontUrl: updated.cnicFrontUrl,
        cnicBackUrl: updated.cnicBackUrl,
        province: updated.province,
        division: updated.division,
        district: updated.district,
        tehsil: updated.tehsil,
        village: updated.village,
        landSizeAcres: updated.landSizeAcres,
        preferredLanguage: updated.preferredLanguage,
        primaryCrops: updated.primaryCrops,
        verifiedStatus: updated.verifiedStatus,
        isSellerVerified: updated.isSellerVerified,
        sellerVerificationStatus: updated.sellerVerificationStatus,
        antiBotVerificationScore: updated.antiBotVerificationScore,
        verifiedSellerBadge: updated.verifiedSellerBadge,
        verifiedAt: updated.verifiedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error) {
      console.error('[FarmerService] Error updating profile:', error);
      throw new AppError('Unable to update farmer profile', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async verifySeller(userId: string, data: VerifySellerDto): Promise<FarmerProfileDto> {
    if (!userId) {
      throw new AppError('User ID is required', 400, 'INVALID_USER');
    }

    // 1. Run Automated AI & Forensics Document Verification
    const verification = await documentVerificationService.verifySellerSubmission({
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      email: data.email,
      cnicNumber: data.cnicNumber,
      province: data.province,
      profilePhotoDataUrl: data.profilePhotoDataUrl,
      cnicFrontDataUrl: data.cnicFrontDataUrl,
      cnicBackDataUrl: data.cnicBackDataUrl,
    });

    const cleanedCnic = data.cnicNumber.replace(/\D/g, '');

    try {
      // 2. Upload images to S3-compatible persistent storage
      const [profileUpload, cnicFrontUpload, cnicBackUpload] = await Promise.all([
        storageService.uploadMedia(`sellers/${userId}/profile`, data.profilePhotoDataUrl, 'profile.jpg'),
        storageService.uploadMedia(`sellers/${userId}/cnic`, data.cnicFrontDataUrl, 'cnic_front.jpg'),
        storageService.uploadMedia(`sellers/${userId}/cnic`, data.cnicBackDataUrl, 'cnic_back.jpg'),
      ]);

      const antiBotScore = verification.confidenceScore.toString();
      const formattedCnic = `${cleanedCnic.slice(0, 5)}-${cleanedCnic.slice(5, 12)}-${cleanedCnic.slice(12)}`;

      await db.insert(users).values({
        uid: userId,
        displayName: data.fullName,
        phone: data.phoneNumber,
        email: data.email,
        photoUrl: profileUpload.url,
        role: 'farmer',
      }).onConflictDoUpdate({
        target: users.uid,
        set: {
          displayName: data.fullName,
          phone: data.phoneNumber,
          email: data.email,
          photoUrl: profileUpload.url,
        },
      });

      // 3. Save verified seller record into farmer_profiles without conflicts
      const [updated] = await db
        .insert(farmerProfiles)
        .values({
          userId,
          fullName: data.fullName,
          phoneNumber: data.phoneNumber,
          email: data.email,
          profilePhotoUrl: profileUpload.url,
          cnicNumber: formattedCnic,
          cnicFrontUrl: cnicFrontUpload.url,
          cnicBackUrl: cnicBackUpload.url,
          province: data.province || 'Punjab',
          district: data.district || '',
          tehsil: data.tehsil || '',
          village: data.village || '',
          landSizeAcres: data.landSizeAcres || '',
          isSellerVerified: verification.status === 'verified',
          sellerVerificationStatus: verification.status,
          antiBotVerificationScore: antiBotScore,
          aiVerificationConfidence: verification.confidenceScore.toString(),
          aiVerificationNotes: verification.notes,
          verificationIssues: verification.issues,
          verifiedSellerBadge: verification.status === 'verified' ? 'Verified Genuine Farmer' : 'Verification Under Review',
          verifiedStatus: verification.status === 'verified',
          verifiedAt: verification.status === 'verified' ? new Date() : null,
        })
        .onConflictDoUpdate({
          target: farmerProfiles.userId,
          set: {
            fullName: data.fullName,
            phoneNumber: data.phoneNumber,
            email: data.email,
            profilePhotoUrl: profileUpload.url,
            cnicNumber: formattedCnic,
            cnicFrontUrl: cnicFrontUpload.url,
            cnicBackUrl: cnicBackUpload.url,
            province: data.province || 'Punjab',
            district: data.district || '',
            tehsil: data.tehsil || '',
            village: data.village || '',
            landSizeAcres: data.landSizeAcres || '',
            isSellerVerified: verification.status === 'verified',
            sellerVerificationStatus: verification.status,
            antiBotVerificationScore: antiBotScore,
            aiVerificationConfidence: verification.confidenceScore.toString(),
            aiVerificationNotes: verification.notes,
            verificationIssues: verification.issues,
            verifiedSellerBadge: verification.status === 'verified' ? 'Verified Genuine Farmer' : 'Verification Under Review',
            verifiedStatus: verification.status === 'verified',
            verifiedAt: verification.status === 'verified' ? new Date() : null,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        userId: updated.userId,
        fullName: updated.fullName,
        phoneNumber: updated.phoneNumber,
        email: updated.email,
        profilePhotoUrl: updated.profilePhotoUrl,
        cnicNumber: updated.cnicNumber,
        cnicFrontUrl: updated.cnicFrontUrl,
        cnicBackUrl: updated.cnicBackUrl,
        province: updated.province,
        division: updated.division,
        district: updated.district,
        tehsil: updated.tehsil,
        village: updated.village,
        landSizeAcres: updated.landSizeAcres,
        preferredLanguage: updated.preferredLanguage,
        primaryCrops: updated.primaryCrops,
        verifiedStatus: updated.verifiedStatus,
        isSellerVerified: updated.isSellerVerified,
        sellerVerificationStatus: updated.sellerVerificationStatus,
        antiBotVerificationScore: updated.antiBotVerificationScore,
        verifiedSellerBadge: updated.verifiedSellerBadge,
        verifiedAt: updated.verifiedAt,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      console.error('[FarmerService] Error in verifySeller:', error);
      throw new AppError('Unable to complete seller verification', 500, 'DATABASE_ERROR', { cause: error });
    }
  }

  public async getPendingVerifications(): Promise<any[]> {
    try {
      const records = await db
        .select()
        .from(farmerProfiles)
        .where(sql`${farmerProfiles.cnicNumber} IS NOT NULL`)
        .orderBy(desc(farmerProfiles.updatedAt))
        .limit(50);

      return records.map((r) => ({
        userId: r.userId,
        fullName: r.fullName,
        phoneNumber: r.phoneNumber,
        email: r.email,
        profilePhotoUrl: r.profilePhotoUrl,
        cnicNumber: r.cnicNumber,
        cnicFrontUrl: r.cnicFrontUrl,
        cnicBackUrl: r.cnicBackUrl,
        province: r.province,
        district: r.district,
        landSizeAcres: r.landSizeAcres,
        isSellerVerified: r.isSellerVerified,
        sellerVerificationStatus: r.sellerVerificationStatus,
        aiVerificationConfidence: r.aiVerificationConfidence,
        aiVerificationNotes: r.aiVerificationNotes,
        verificationIssues: r.verificationIssues,
        rejectedReason: r.rejectedReason,
        reviewedBy: r.reviewedBy,
        verifiedAt: r.verifiedAt,
        updatedAt: r.updatedAt,
      }));
    } catch (error) {
      console.error('[FarmerService] Error fetching verifications for admin:', error);
      throw new AppError('Unable to fetch seller verifications', 500, 'DATABASE_ERROR');
    }
  }

  public async reviewVerification(
    targetUserId: string,
    decision: 'approved' | 'rejected',
    reason?: string,
    reviewer: string = 'Admin'
  ): Promise<any> {
    try {
      const isApproved = decision === 'approved';
      const [updated] = await db
        .update(farmerProfiles)
        .set({
          isSellerVerified: isApproved,
          sellerVerificationStatus: isApproved ? 'verified' : 'rejected',
          verifiedSellerBadge: isApproved ? 'Verified Genuine Farmer' : 'Verification Rejected',
          verifiedStatus: isApproved,
          verifiedAt: isApproved ? new Date() : null,
          rejectedReason: !isApproved ? reason || 'Documents could not be verified' : null,
          reviewedBy: reviewer,
          updatedAt: new Date(),
        })
        .where(eq(farmerProfiles.userId, targetUserId))
        .returning();

      if (!updated) {
        throw new AppError(`Seller ${targetUserId} not found`, 404, 'NOT_FOUND');
      }

      return {
        userId: updated.userId,
        status: updated.sellerVerificationStatus,
        isSellerVerified: updated.isSellerVerified,
        reviewedBy: updated.reviewedBy,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError('Unable to update verification status', 500, 'DATABASE_ERROR');
    }
  }

  public async getStats(userId: string): Promise<FarmerOverviewStats> {
    try {
      const [scansCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(diagnosticScans)
        .where(eq(diagnosticScans.userId, userId));

      const [listingsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(marketplaceListings)
        .where(eq(marketplaceListings.sellerId, userId));

      const [activeListingsCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(marketplaceListings)
        .where(sql`${marketplaceListings.sellerId} = ${userId} AND ${marketplaceListings.status} = 'available'`);

      const [profile] = await db
        .select()
        .from(farmerProfiles)
        .where(eq(farmerProfiles.userId, userId))
        .limit(1);

      return {
        totalScans: Number(scansCount?.count || 0),
        totalListings: Number(listingsCount?.count || 0),
        activeListings: Number(activeListingsCount?.count || 0),
        verified: !!profile?.verifiedStatus,
      };
    } catch (error) {
      console.error('[FarmerService] Error calculating stats:', error);
      throw new AppError('Unable to compute overview metrics', 500, 'DATABASE_ERROR', { cause: error });
    }
  }
}

export const farmerService = new FarmerService();
