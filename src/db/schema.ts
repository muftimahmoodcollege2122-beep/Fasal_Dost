// ─────────────────────────────────────────────────────────────────────────────
// src/db/schema.ts
// Single PostgreSQL database schema with clear domain module ownership
// ─────────────────────────────────────────────────────────────────────────────

import {
  pgTable, serial, text, timestamp, integer, boolean, numeric, jsonb,
  uuid, date, doublePrecision, index, unique, check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

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
  passwordHash: text('password_hash'), // ERD: optional (Firebase Auth is primary)
  language: text('language').default('en').notNull(), // ERD: UI language
  status: text('status').default('active').notNull(), // ERD: active | suspended | deleted (is_active kept for legacy code)
  lastLoginAt: timestamp('last_login_at'),
  platform: text('platform').default('web'), // 'web' | 'android' | 'ios'
  role: text('role').default('farmer'), // 'farmer' | 'buyer' | 'agronomist' | 'admin'
  plan: text('plan').default('free').notNull(), // 'free' | 'gold' | 'diamond' | 'unlimited'
  billingCycle: text('billing_cycle').default('monthly'), // 'monthly' | 'yearly'
  subscriptionExpiresAt: timestamp('subscription_expires_at'),
  monthlyScanQuota: integer('monthly_scan_quota').default(0),
  monthlyScansUsed: integer('monthly_scans_used').default(0),
  subscriptionStartedAt: timestamp('subscription_started_at'),
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
  cnicVerified: boolean('cnic_verified').default(false).notNull(), // ERD
  farmerType: text('farmer_type'), // ERD: e.g. smallholder | commercial | cooperative
  dateOfBirth: date('date_of_birth'), // ERD
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
  clientIp: text('client_ip'),
  cropDetected: text('crop_detected').notNull(),
  isHealthy: boolean('is_healthy').notNull().default(false),
  overallConfidence: integer('overall_confidence').notNull().default(0),
  imageQuality: text('image_quality').notNull().default('good'), // 'good' | 'blurry' | 'unclear'
  imageUrl: text('image_url'), // ERD: stored scan image
  s3Key: text('s3_key'), // ERD: object-storage key
  processingTimeMs: integer('processing_time_ms'), // ERD
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
  sellerEmail: text('seller_email'), // ERD
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
  inquiriesCount: integer('inquiries_count').default(0).notNull(), // ERD
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

// ═════════════════════════════════════════════════════════════════════════════
// MODULE 5: SUBSCRIPTIONS & PACKAGES DOMAIN
// ═════════════════════════════════════════════════════════════════════════════

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'cascade' }),
  clientIp: text('client_ip'),
  plan: text('plan').notNull(), // 'free' | 'gold' | 'diamond' | 'unlimited'
  billingCycle: text('billing_cycle').notNull(), // 'monthly' | 'yearly'
  amountPkr: integer('amount_pkr').notNull(),
  scansQuota: integer('scans_quota').notNull(), // 7 per day for free, 250 for gold, 500 for diamond, 999999 for unlimited
  paymentMethod: text('payment_method').default('easypaisa').notNull(), // 'jazzcash' | 'easypaisa' | 'bank_transfer' | 'card'
  paymentReference: text('payment_reference'),
  status: text('status').default('active').notNull(), // 'active' | 'expired' | 'cancelled'
  startsAt: timestamp('starts_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});


// ═════════════════════════════════════════════════════════════════════════════
// AGRIFOODS PLATFORM MODULES (added from the ERD; additive, existing tables above
// are unchanged).
//
// Conventions for every table below:
//   • Primary key  : uuid, generated by Postgres (gen_random_uuid()).
//   • User refs    : TEXT referencing users.uid (same convention as the existing
//                    tables). The ERD draws users.id as a String, but the real
//                    users.id is serial/integer, so uid is the stable key.
//   • Farmer refs  : INTEGER referencing farmer_profiles.id (real column is serial).
//   • Money / qty  : numeric(p,s) -> returned to JS as string (no float rounding).
//   • Status cols  : text (project convention); allowed values are in comments.
//   • onDelete     : mirrors the ERD/Prisma rules — required relations RESTRICT,
//                    optional relations SET NULL, owned children CASCADE.
//   • `listings` (commerce v2) is separate from legacy `marketplace_listings`.
// ═════════════════════════════════════════════════════════════════════════════

const pkUuid = () => uuid('id').primaryKey().defaultRandom();
const createdAtCol = () => timestamp('created_at').defaultNow().notNull();
const updatedAtCol = () => timestamp('updated_at').defaultNow().notNull().$onUpdate(() => new Date());
const money = (name: string, precision = 14) => numeric(name, { precision, scale: 2 });

// ── MODULE 6: IDENTITY & ACCESS (extended) ───────────────────────────────────

export const accounts = pgTable('accounts', {
  id: pkUuid(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  createdAt: createdAtCol(),
}, (t) => [index('accounts_user_id_idx').on(t.userId)]);

export const organizations = pgTable('organizations', {
  id: pkUuid(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  registrationNumber: text('registration_number'),
  address: text('address'),
  status: text('status').notNull().default('active'),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const organizationMembers = pgTable('organization_members', {
  id: pkUuid(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: createdAtCol(),
}, (t) => [
  unique('organization_members_user_org_uq').on(t.userId, t.organizationId),
  index('organization_members_org_idx').on(t.organizationId),
]);

// ── MODULE 7: FARMER & FARM ──────────────────────────────────────────────────

export const farms = pgTable('farms', {
  id: pkUuid(),
  farmerId: integer('farmer_id').notNull().references(() => farmerProfiles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  address: text('address'),
  areaSize: numeric('area_size', { precision: 10, scale: 2 }),
  ownershipType: text('ownership_type'),
  irrigationType: text('irrigation_type'),
  status: text('status').notNull().default('active'),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
}, (t) => [index('farms_farmer_id_idx').on(t.farmerId)]);

export const crops = pgTable('crops', {
  id: pkUuid(),
  name: text('name').notNull(),
  category: text('category'),
  description: text('description'),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const cropCycles = pgTable('crop_cycles', {
  id: pkUuid(),
  farmId: uuid('farm_id').notNull().references(() => farms.id, { onDelete: 'cascade' }),
  fieldId: text('field_id'),
  cropId: uuid('crop_id').notNull().references(() => crops.id, { onDelete: 'restrict' }),
  variety: text('variety'),
  plantingDate: date('planting_date'),
  expectedHarvestDate: date('expected_harvest_date'),
  actualHarvestDate: date('actual_harvest_date'),
  status: text('status').notNull().default('planned'), // planned | growing | harvested | cancelled
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
}, (t) => [
  index('crop_cycles_farm_id_idx').on(t.farmId),
  index('crop_cycles_crop_id_idx').on(t.cropId),
]);

// ── MODULE 8: MARKETPLACE (commerce v2) ──────────────────────────────────────

export const listings = pgTable('listings', {
  id: pkUuid(),
  farmerId: integer('farmer_id').notNull().references(() => farmerProfiles.id, { onDelete: 'cascade' }),
  cropId: uuid('crop_id').references(() => crops.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description'),
  quantity: money('quantity', 12).notNull(),
  unit: text('unit').notNull(),
  pricePerUnit: money('price_per_unit', 12).notNull(),
  qualityGrade: text('quality_grade'),
  availableFrom: date('available_from'),
  availableUntil: date('available_until'),
  status: text('status').notNull().default('active'), // active | reserved | sold | archived
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
}, (t) => [
  index('listings_farmer_id_idx').on(t.farmerId),
  index('listings_crop_status_idx').on(t.cropId, t.status),
  check('listings_quantity_nonneg', sql`${t.quantity} >= 0`),
  check('listings_price_nonneg', sql`${t.pricePerUnit} >= 0`),
]);

export const listingImages = pgTable('listing_images', {
  id: pkUuid(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url').notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  createdAt: createdAtCol(),
}, (t) => [index('listing_images_listing_id_idx').on(t.listingId)]);

export const offers = pgTable('offers', {
  id: pkUuid(),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
  buyerId: text('buyer_id').notNull().references(() => users.uid, { onDelete: 'restrict' }),
  offerPrice: money('offer_price', 12).notNull(),
  quantity: money('quantity', 12).notNull(),
  status: text('status').notNull().default('pending'), // pending | accepted | declined | expired
  expiresAt: timestamp('expires_at'),
  createdAt: createdAtCol(),
}, (t) => [
  index('offers_listing_id_idx').on(t.listingId),
  index('offers_buyer_id_idx').on(t.buyerId),
  check('offers_price_nonneg', sql`${t.offerPrice} >= 0`),
  check('offers_quantity_pos', sql`${t.quantity} > 0`),
]);

// ── MODULE 9: ORDERS & LOGISTICS ─────────────────────────────────────────────

export const orders = pgTable('orders', {
  id: pkUuid(),
  buyerId: text('buyer_id').notNull().references(() => users.uid, { onDelete: 'restrict' }),
  listingId: uuid('listing_id').references(() => listings.id, { onDelete: 'set null' }),
  totalAmount: money('total_amount').notNull(),
  status: text('status').notNull().default('pending'), // pending | confirmed | shipped | delivered | cancelled
  deliveryAddress: text('delivery_address'),
  expectedDeliveryDate: date('expected_delivery_date'),
  actualDeliveryDate: date('actual_delivery_date'),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
}, (t) => [
  index('orders_buyer_status_idx').on(t.buyerId, t.status),
  index('orders_created_at_idx').on(t.createdAt),
  check('orders_total_nonneg', sql`${t.totalAmount} >= 0`),
]);

export const orderItems = pgTable('order_items', {
  id: pkUuid(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  listingId: uuid('listing_id').notNull().references(() => listings.id, { onDelete: 'restrict' }),
  quantity: money('quantity', 12).notNull(),
  unitPrice: money('unit_price', 12).notNull(),
  totalPrice: money('total_price').notNull(),
  createdAt: createdAtCol(),
}, (t) => [
  index('order_items_order_id_idx').on(t.orderId),
  index('order_items_listing_id_idx').on(t.listingId),
  check('order_items_quantity_pos', sql`${t.quantity} > 0`),
  check('order_items_prices_nonneg', sql`${t.unitPrice} >= 0 AND ${t.totalPrice} >= 0`),
]);

export const logisticsProviders = pgTable('logistics_providers', {
  id: pkUuid(),
  name: text('name').notNull(),
  phone: text('phone'),
  type: text('type'),
  status: text('status').notNull().default('active'),
  createdAt: createdAtCol(),
});

export const shipments = pgTable('shipments', {
  id: pkUuid(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  logisticsProviderId: uuid('logistics_provider_id').references(() => logisticsProviders.id, { onDelete: 'set null' }),
  trackingNumber: text('tracking_number').unique(),
  status: text('status').notNull().default('pending'), // pending | picked_up | in_transit | delivered | failed
  pickupLocation: text('pickup_location'),
  deliveryLocation: text('delivery_location'),
  dispatchedAt: timestamp('dispatched_at'),
  deliveredAt: timestamp('delivered_at'),
  createdAt: createdAtCol(),
}, (t) => [
  index('shipments_order_id_idx').on(t.orderId),
  index('shipments_provider_id_idx').on(t.logisticsProviderId),
]);

export const deliveryEvents = pgTable('delivery_events', {
  id: pkUuid(),
  shipmentId: uuid('shipment_id').notNull().references(() => shipments.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  location: text('location'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  createdAt: createdAtCol(),
}, (t) => [index('delivery_events_shipment_ts_idx').on(t.shipmentId, t.timestamp)]);

// ── MODULE 10: INVENTORY & WAREHOUSE ─────────────────────────────────────────

export const warehouses = pgTable('warehouses', {
  id: pkUuid(),
  name: text('name').notNull(),
  location: text('location'),
  capacity: money('capacity', 12),
  type: text('type'),
  status: text('status').notNull().default('active'),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
});

export const inventoryLots = pgTable('inventory_lots', {
  id: pkUuid(),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'restrict' }),
  cropId: uuid('crop_id').notNull().references(() => crops.id, { onDelete: 'restrict' }),
  quantity: money('quantity', 12).notNull(),
  unit: text('unit').notNull(),
  qualityGrade: text('quality_grade'),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  expiryDate: date('expiry_date'),
  status: text('status').notNull().default('in_stock'), // in_stock | reserved | depleted | expired
  createdAt: createdAtCol(),
}, (t) => [
  index('inventory_lots_warehouse_id_idx').on(t.warehouseId),
  index('inventory_lots_crop_id_idx').on(t.cropId),
  check('inventory_lots_quantity_nonneg', sql`${t.quantity} >= 0`),
]);

export const stockMovements = pgTable('stock_movements', {
  id: pkUuid(),
  inventoryLotId: uuid('inventory_lot_id').notNull().references(() => inventoryLots.id, { onDelete: 'restrict' }),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'restrict' }),
  type: text('type').notNull(), // inbound | outbound | transfer | adjustment
  quantity: money('quantity', 12).notNull(),
  referenceId: text('reference_id'),
  notes: text('notes'),
  createdAt: createdAtCol(),
}, (t) => [
  index('stock_movements_lot_id_idx').on(t.inventoryLotId),
  index('stock_movements_warehouse_created_idx').on(t.warehouseId, t.createdAt),
]);

// ── MODULE 11: FINANCE & SETTLEMENTS (LEDGER) ────────────────────────────────

export const walletAccounts = pgTable('wallet_accounts', {
  id: pkUuid(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'restrict' }),
  accountType: text('account_type').notNull(),
  balance: money('balance', 16).notNull().default('0'),
  currency: text('currency').notNull().default('PKR'),
  status: text('status').notNull().default('active'),
  createdAt: createdAtCol(),
  updatedAt: updatedAtCol(),
}, (t) => [index('wallet_accounts_user_id_idx').on(t.userId)]);

export const ledgerTransactions = pgTable('ledger_transactions', {
  id: pkUuid(),
  walletId: uuid('wallet_id').notNull().references(() => walletAccounts.id, { onDelete: 'restrict' }),
  type: text('type').notNull(),
  amount: money('amount', 16).notNull(),
  currency: text('currency').notNull().default('PKR'),
  description: text('description'),
  referenceId: text('reference_id'),
  status: text('status').notNull().default('posted'), // pending | posted | reversed
  createdAt: createdAtCol(),
}, (t) => [
  index('ledger_transactions_wallet_created_idx').on(t.walletId, t.createdAt),
  index('ledger_transactions_reference_idx').on(t.referenceId),
]);

export const ledgerEntries = pgTable('ledger_entries', {
  id: pkUuid(),
  transactionId: uuid('transaction_id').notNull().references(() => ledgerTransactions.id, { onDelete: 'restrict' }),
  accountId: uuid('account_id').notNull().references(() => walletAccounts.id, { onDelete: 'restrict' }),
  entryType: text('entry_type').notNull(), // debit | credit
  amount: money('amount', 16).notNull(),
  balanceAfter: money('balance_after', 16).notNull(),
  description: text('description'),
  createdAt: createdAtCol(),
}, (t) => [
  index('ledger_entries_transaction_id_idx').on(t.transactionId),
  index('ledger_entries_account_created_idx').on(t.accountId, t.createdAt),
  check('ledger_entries_type_valid', sql`${t.entryType} IN ('debit', 'credit')`),
  check('ledger_entries_amount_pos', sql`${t.amount} > 0`),
]);

export const settlements = pgTable('settlements', {
  id: pkUuid(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  farmerId: integer('farmer_id').notNull().references(() => farmerProfiles.id, { onDelete: 'restrict' }),
  logisticsProviderId: uuid('logistics_provider_id').references(() => logisticsProviders.id, { onDelete: 'set null' }),
  platformFee: money('platform_fee').notNull(),
  farmerAmount: money('farmer_amount').notNull(),
  logisticsAmount: money('logistics_amount'),
  status: text('status').notNull().default('pending'), // pending | released | failed
  releaseDate: timestamp('release_date'),
  createdAt: createdAtCol(),
}, (t) => [
  index('settlements_order_id_idx').on(t.orderId),
  index('settlements_farmer_id_idx').on(t.farmerId),
  check('settlements_amounts_nonneg', sql`${t.platformFee} >= 0 AND ${t.farmerAmount} >= 0 AND (${t.logisticsAmount} IS NULL OR ${t.logisticsAmount} >= 0)`),
]);

export const payouts = pgTable('payouts', {
  id: pkUuid(),
  settlementId: uuid('settlement_id').notNull().references(() => settlements.id, { onDelete: 'restrict' }),
  recipientId: text('recipient_id').notNull().references(() => users.uid, { onDelete: 'restrict' }),
  amount: money('amount').notNull(),
  method: text('method').notNull(), // jazzcash | easypaisa | bank_transfer
  status: text('status').notNull().default('pending'), // pending | paid | failed
  transactionReference: text('transaction_reference'),
  createdAt: createdAtCol(),
}, (t) => [
  index('payouts_settlement_id_idx').on(t.settlementId),
  index('payouts_recipient_id_idx').on(t.recipientId),
  check('payouts_amount_pos', sql`${t.amount} > 0`),
]);

// ── MODULE 12: VERIFICATION & TRUST ──────────────────────────────────────────

export const verifications = pgTable('verifications', {
  id: pkUuid(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  status: text('status').notNull().default('pending'), // pending | verified | rejected
  documents: jsonb('documents').$type<unknown[]>().notNull().default([]),
  verifiedAt: timestamp('verified_at'),
  createdAt: createdAtCol(),
}, (t) => [index('verifications_user_type_idx').on(t.userId, t.type)]);

export const disputes = pgTable('disputes', {
  id: pkUuid(),
  orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'restrict' }),
  raisedById: text('raised_by_id').notNull().references(() => users.uid, { onDelete: 'restrict' }),
  type: text('type').notNull(),
  description: text('description'),
  status: text('status').notNull().default('open'), // open | investigating | resolved | rejected
  createdAt: createdAtCol(),
}, (t) => [
  index('disputes_order_id_idx').on(t.orderId),
  index('disputes_raised_by_idx').on(t.raisedById),
]);

export const auditLogs = pgTable('audit_logs', {
  id: pkUuid(),
  userId: text('user_id').references(() => users.uid, { onDelete: 'set null' }),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: createdAtCol(),
}, (t) => [
  index('audit_logs_user_created_idx').on(t.userId, t.createdAt),
  index('audit_logs_entity_idx').on(t.entityType, t.entityId),
]);

// ── MODULE 13: REFERENCE / LOOKUP ────────────────────────────────────────────

export const cropCategories = pgTable('crop_categories', {
  id: pkUuid(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const units = pgTable('units', {
  id: pkUuid(),
  name: text('name').notNull().unique(),
  symbol: text('symbol').notNull(),
});

export const roles = pgTable('roles', {
  id: pkUuid(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const countries = pgTable('countries', {
  id: pkUuid(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
});

// ── MODULE 14: BACKGROUND JOBS ───────────────────────────────────────────────

export const jobExecutions = pgTable('job_executions', {
  id: pkUuid(),
  queueName: text('queue_name').notNull(),
  jobId: text('job_id').notNull().unique(),
  name: text('name').notNull(),
  data: jsonb('data').$type<unknown>().notNull(),
  status: text('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  result: jsonb('result').$type<unknown>(),
  error: text('error'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: createdAtCol(),
});

// ═════════════════════════════════════════════════════════════════════════════
// RELATIONS for the platform modules (typed navigation only; no DB effect)
// ═════════════════════════════════════════════════════════════════════════════

export const farmerProfilesRelations = relations(farmerProfiles, ({ many }) => ({
  farms: many(farms),
  commerceListings: many(listings),
  settlements: many(settlements),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
}));

export const organizationMembersRelations = relations(organizationMembers, ({ one }) => ({
  organization: one(organizations, { fields: [organizationMembers.organizationId], references: [organizations.id] }),
  user: one(users, { fields: [organizationMembers.userId], references: [users.uid] }),
}));

export const farmsRelations = relations(farms, ({ one, many }) => ({
  farmer: one(farmerProfiles, { fields: [farms.farmerId], references: [farmerProfiles.id] }),
  cropCycles: many(cropCycles),
}));

export const cropsRelations = relations(crops, ({ many }) => ({
  cropCycles: many(cropCycles),
  listings: many(listings),
  inventoryLots: many(inventoryLots),
}));

export const cropCyclesRelations = relations(cropCycles, ({ one }) => ({
  farm: one(farms, { fields: [cropCycles.farmId], references: [farms.id] }),
  crop: one(crops, { fields: [cropCycles.cropId], references: [crops.id] }),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  farmer: one(farmerProfiles, { fields: [listings.farmerId], references: [farmerProfiles.id] }),
  crop: one(crops, { fields: [listings.cropId], references: [crops.id] }),
  images: many(listingImages),
  offers: many(offers),
  orderItems: many(orderItems),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));

export const offersRelations = relations(offers, ({ one }) => ({
  listing: one(listings, { fields: [offers.listingId], references: [listings.id] }),
  buyer: one(users, { fields: [offers.buyerId], references: [users.uid] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.uid] }),
  listing: one(listings, { fields: [orders.listingId], references: [listings.id] }),
  items: many(orderItems),
  shipments: many(shipments),
  settlements: many(settlements),
  disputes: many(disputes),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  listing: one(listings, { fields: [orderItems.listingId], references: [listings.id] }),
}));

export const logisticsProvidersRelations = relations(logisticsProviders, ({ many }) => ({
  shipments: many(shipments),
  settlements: many(settlements),
}));

export const shipmentsRelations = relations(shipments, ({ one, many }) => ({
  order: one(orders, { fields: [shipments.orderId], references: [orders.id] }),
  logisticsProvider: one(logisticsProviders, { fields: [shipments.logisticsProviderId], references: [logisticsProviders.id] }),
  events: many(deliveryEvents),
}));

export const deliveryEventsRelations = relations(deliveryEvents, ({ one }) => ({
  shipment: one(shipments, { fields: [deliveryEvents.shipmentId], references: [shipments.id] }),
}));

export const warehousesRelations = relations(warehouses, ({ many }) => ({
  lots: many(inventoryLots),
  movements: many(stockMovements),
}));

export const inventoryLotsRelations = relations(inventoryLots, ({ one, many }) => ({
  warehouse: one(warehouses, { fields: [inventoryLots.warehouseId], references: [warehouses.id] }),
  crop: one(crops, { fields: [inventoryLots.cropId], references: [crops.id] }),
  movements: many(stockMovements),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  inventoryLot: one(inventoryLots, { fields: [stockMovements.inventoryLotId], references: [inventoryLots.id] }),
  warehouse: one(warehouses, { fields: [stockMovements.warehouseId], references: [warehouses.id] }),
}));

export const walletAccountsRelations = relations(walletAccounts, ({ one, many }) => ({
  user: one(users, { fields: [walletAccounts.userId], references: [users.uid] }),
  transactions: many(ledgerTransactions),
  entries: many(ledgerEntries),
}));

export const ledgerTransactionsRelations = relations(ledgerTransactions, ({ one, many }) => ({
  wallet: one(walletAccounts, { fields: [ledgerTransactions.walletId], references: [walletAccounts.id] }),
  entries: many(ledgerEntries),
}));

export const ledgerEntriesRelations = relations(ledgerEntries, ({ one }) => ({
  transaction: one(ledgerTransactions, { fields: [ledgerEntries.transactionId], references: [ledgerTransactions.id] }),
  account: one(walletAccounts, { fields: [ledgerEntries.accountId], references: [walletAccounts.id] }),
}));

export const settlementsRelations = relations(settlements, ({ one, many }) => ({
  order: one(orders, { fields: [settlements.orderId], references: [orders.id] }),
  farmer: one(farmerProfiles, { fields: [settlements.farmerId], references: [farmerProfiles.id] }),
  logisticsProvider: one(logisticsProviders, { fields: [settlements.logisticsProviderId], references: [logisticsProviders.id] }),
  payouts: many(payouts),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  settlement: one(settlements, { fields: [payouts.settlementId], references: [settlements.id] }),
  recipient: one(users, { fields: [payouts.recipientId], references: [users.uid] }),
}));

export const verificationsRelations = relations(verifications, ({ one }) => ({
  user: one(users, { fields: [verifications.userId], references: [users.uid] }),
}));

export const disputesRelations = relations(disputes, ({ one }) => ({
  order: one(orders, { fields: [disputes.orderId], references: [orders.id] }),
  raisedBy: one(users, { fields: [disputes.raisedById], references: [users.uid] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.uid] }),
}));
