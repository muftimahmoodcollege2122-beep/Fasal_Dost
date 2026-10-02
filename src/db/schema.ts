// ─────────────────────────────────────────────────────────────────────────────
// src/db/schema.ts
// Single PostgreSQL database schema with clear domain module ownership
// ─────────────────────────────────────────────────────────────────────────────

import { pgTable, serial, text, timestamp, integer, boolean, numeric, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 1: AUTH & IDENTITY DOMAIN (Shared cross-platform: Web, Android, iOS)
// ═════════════════════════════════════════════════════════════════════════════

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID (Web, Android, iOS)
  email: text('email'),
  phone: text('phone'),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  platform: text('platform').default('web'), // 'web' | 'android' | 'ios'
  role: text('role').default('farmer'), // 'farmer' | 'buyer' | 'agronomist' | 'admin'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 2: FARMERS & AGRONOMY PROFILES DOMAIN
// ═════════════════════════════════════════════════════════════════════════════

export const farmerProfiles = pgTable('farmer_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id')
    .references(() => users.uid, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  fullName: text('full_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  email: text('email'),
  profilePhotoUrl: text('profile_photo_url'),
  cnicNumber: text('cnic_number'),
  cnicFrontUrl: text('cnic_front_url'),
  cnicBackUrl: text('cnic_back_url'),
  province: text('province').default('Punjab').notNull(),
  division: text('division'),
  district: text('district'),
  tehsil: text('tehsil'),
  village: text('village'),
  landSizeAcres: text('land_size_acres'),
  preferredLanguage: text('preferred_language').default('ur'), // 'ur' | 'en' | 'pa' | 'sd'
  primaryCrops: jsonb('primary_crops').$type<string[]>().default([]),
  verifiedStatus: boolean('verified_status').default(false),
  isSellerVerified: boolean('is_seller_verified').default(false),
  sellerVerificationStatus: text('seller_verification_status').default('unverified'), // 'unverified' | 'pending' | 'verified'
  antiBotVerificationScore: numeric('anti_bot_verification_score').default('0.98'),
  aiVerificationConfidence: numeric('ai_verification_confidence').default('0.95'),
  aiVerificationNotes: text('ai_verification_notes'),
  verificationIssues: jsonb('verification_issues').$type<string[]>().default([]),
  rejectedReason: text('rejected_reason'),
  reviewedBy: text('reviewed_by'),
  verifiedSellerBadge: text('verified_seller_badge').default('Verified Genuine Farmer'),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 3: DIAGNOSTICS & CROP HEALTH DOMAIN
// ═════════════════════════════════════════════════════════════════════════════

export const diagnosticScans = pgTable('diagnostic_scans', {
  id: serial('id').primaryKey(),
  scanCode: text('scan_code').notNull().unique(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'set null' }),
  cropDetected: text('crop_detected').notNull(),
  isHealthy: boolean('is_healthy').notNull().default(false),
  overallConfidence: integer('overall_confidence').notNull().default(0),
  imageQuality: text('image_quality').notNull().default('good'), // 'good' | 'blurry' | 'unclear'
  preventionAdvice: text('prevention_advice'),
  locationProvince: text('location_province'),
  locationDistrict: text('location_district'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const diagnosticDiseases = pgTable('diagnostic_diseases', {
  id: serial('id').primaryKey(),
  scanId: integer('scan_id')
    .references(() => diagnosticScans.id, { onDelete: 'cascade' })
    .notNull(),
  diseaseName: text('disease_name').notNull(),
  severity: text('severity').notNull().default('medium'), // 'low' | 'medium' | 'high' | 'critical'
  confidence: integer('confidence').notNull().default(0),
  description: text('description'),
  symptoms: jsonb('symptoms').$type<string[]>().default([]),
  treatment: jsonb('treatment').$type<string[]>().default([]),
  urgency: text('urgency'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 4: KISAN MARKETPLACE & COMMERCE DOMAIN
// ═════════════════════════════════════════════════════════════════════════════

export const marketplaceListings = pgTable('marketplace_listings', {
  id: serial('id').primaryKey(),
  listingCode: text('listing_code').notNull().unique(),
  sellerId: text('seller_id').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  farmerName: text('farmer_name').notNull(),
  farmerPhone: text('farmer_phone').notNull(),
  province: text('province').notNull(),
  district: text('district').notNull(),
  tehsil: text('tehsil'),
  village: text('village'),
  cropName: text('crop_name').notNull(),
  variety: text('variety'),
  quantity: text('quantity').notNull(),
  unit: text('unit').notNull().default('Kg'), // 'Maunds (40kg)' | 'Kg' | 'Bags' | 'Crates'
  pricePkr: numeric('price_pkr').notNull(),
  qualityGrade: text('quality_grade').notNull().default('Grade A'), // 'Premium' | 'Grade A' | 'Grade B' | 'Standard'
  harvestDate: text('harvest_date'),
  description: text('description'),
  images: jsonb('images').$type<string[]>().default([]),
  videos: jsonb('videos').$type<string[]>().default([]),
  isSellerVerified: boolean('is_seller_verified').default(false),
  sellerBadge: text('seller_badge').default('Verified Genuine Farmer'),
  status: text('status').notNull().default('available'), // 'available' | 'reserved' | 'sold'
  viewsCount: integer('views_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const marketplaceInquiries = pgTable('marketplace_inquiries', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id')
    .references(() => marketplaceListings.id, { onDelete: 'cascade' })
    .notNull(),
  buyerId: text('buyer_id').references(() => users.uid, { onDelete: 'set null' }),
  buyerName: text('buyer_name').notNull(),
  buyerPhone: text('buyer_phone').notNull(),
  offeredPricePkr: numeric('offered_price_pkr'),
  message: text('message'),
  status: text('status').default('pending'), // 'pending' | 'accepted' | 'declined'
  createdAt: timestamp('created_at').defaultNow(),
});

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5: ADVISORY & MANDI INTELLIGENCE DOMAIN
// ═════════════════════════════════════════════════════════════════════════════

export const advisoryMandiRates = pgTable('advisory_mandi_rates', {
  id: serial('id').primaryKey(),
  crop: text('crop').notNull(),
  mandi: text('mandi').notNull(),
  province: text('province').notNull(),
  minPrice: numeric('min_price').notNull(),
  maxPrice: numeric('max_price').notNull(),
  modalPrice: numeric('modal_price').notNull(),
  unit: text('unit').notNull().default('per 40kg maund'),
  priceTrend: text('price_trend').notNull().default('stable'), // 'up' | 'down' | 'stable'
  changePercent: numeric('change_percent').default('0.0'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const advisoryWeatherAlerts = pgTable('advisory_weather_alerts', {
  id: serial('id').primaryKey(),
  alertCode: text('alert_code').notNull().unique(),
  severity: text('severity').notNull().default('info'), // 'info' | 'warning' | 'alert'
  title: text('title').notNull(),
  description: text('description').notNull(),
  affectedCrops: jsonb('affected_crops').$type<string[]>().default([]),
  recommendedAction: text('recommended_action').notNull(),
  issuedAt: timestamp('issued_at').defaultNow(),
});

// ═════════════════════════════════════════════════════════════════════════════
// DRIZZLE RELATIONS (Inter-module typed navigation)
// ═════════════════════════════════════════════════════════════════════════════

export const usersRelations = relations(users, ({ one, many }) => ({
  farmerProfile: one(farmerProfiles, {
    fields: [users.uid],
    references: [farmerProfiles.userId],
  }),
  scans: many(diagnosticScans),
  listings: many(marketplaceListings),
}));

export const diagnosticScansRelations = relations(diagnosticScans, ({ one, many }) => ({
  user: one(users, {
    fields: [diagnosticScans.userId],
    references: [users.uid],
  }),
  diseases: many(diagnosticDiseases),
}));

export const diagnosticDiseasesRelations = relations(diagnosticDiseases, ({ one }) => ({
  scan: one(diagnosticScans, {
    fields: [diagnosticDiseases.scanId],
    references: [diagnosticScans.id],
  }),
}));

export const marketplaceListingsRelations = relations(marketplaceListings, ({ one, many }) => ({
  seller: one(users, {
    fields: [marketplaceListings.sellerId],
    references: [users.uid],
  }),
  inquiries: many(marketplaceInquiries),
}));

export const marketplaceInquiriesRelations = relations(marketplaceInquiries, ({ one }) => ({
  listing: one(marketplaceListings, {
    fields: [marketplaceInquiries.listingId],
    references: [marketplaceListings.id],
  }),
}));
