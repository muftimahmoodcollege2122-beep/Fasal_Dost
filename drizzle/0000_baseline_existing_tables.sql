CREATE TABLE "advisory_mandi_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"crop" text NOT NULL,
	"mandi" text NOT NULL,
	"province" text NOT NULL,
	"min_price" numeric NOT NULL,
	"max_price" numeric NOT NULL,
	"modal_price" numeric NOT NULL,
	"unit" text DEFAULT 'per 40kg maund' NOT NULL,
	"price_trend" text DEFAULT 'stable' NOT NULL,
	"change_percent" numeric DEFAULT '0.0',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "advisory_weather_alerts" (
	"id" serial PRIMARY KEY NOT NULL,
	"alert_code" text NOT NULL,
	"severity" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"affected_crops" jsonb DEFAULT '[]'::jsonb,
	"recommended_action" text NOT NULL,
	"issued_at" timestamp DEFAULT now(),
	CONSTRAINT "advisory_weather_alerts_alert_code_unique" UNIQUE("alert_code")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_diseases" (
	"id" serial PRIMARY KEY NOT NULL,
	"scan_id" integer NOT NULL,
	"disease_name" text NOT NULL,
	"severity" text DEFAULT 'medium' NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"description" text,
	"symptoms" jsonb DEFAULT '[]'::jsonb,
	"treatment" jsonb DEFAULT '[]'::jsonb,
	"urgency" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diagnostic_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"scan_code" text NOT NULL,
	"user_id" text,
	"client_ip" text,
	"crop_detected" text NOT NULL,
	"is_healthy" boolean DEFAULT false NOT NULL,
	"overall_confidence" integer DEFAULT 0 NOT NULL,
	"image_quality" text DEFAULT 'good' NOT NULL,
	"prevention_advice" text,
	"location_province" text,
	"location_district" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "diagnostic_scans_scan_code_unique" UNIQUE("scan_code")
);
--> statement-breakpoint
CREATE TABLE "farmer_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"full_name" text NOT NULL,
	"phone_number" text NOT NULL,
	"email" text,
	"profile_photo_url" text,
	"cnic_number" text,
	"cnic_front_url" text,
	"cnic_back_url" text,
	"province" text DEFAULT 'Punjab' NOT NULL,
	"division" text,
	"district" text,
	"tehsil" text,
	"village" text,
	"land_size_acres" text,
	"preferred_language" text DEFAULT 'ur',
	"primary_crops" jsonb DEFAULT '[]'::jsonb,
	"verified_status" boolean DEFAULT false,
	"is_seller_verified" boolean DEFAULT false,
	"seller_verification_status" text DEFAULT 'unverified',
	"anti_bot_verification_score" numeric DEFAULT '0.98',
	"ai_verification_confidence" numeric DEFAULT '0.95',
	"ai_verification_notes" text,
	"verification_issues" jsonb DEFAULT '[]'::jsonb,
	"rejected_reason" text,
	"reviewed_by" text,
	"verified_seller_badge" text DEFAULT 'Verified Genuine Farmer',
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "farmer_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "marketplace_inquiries" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"buyer_id" text,
	"buyer_name" text NOT NULL,
	"buyer_phone" text NOT NULL,
	"offered_price_pkr" numeric,
	"message" text,
	"status" text DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketplace_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_code" text NOT NULL,
	"seller_id" text NOT NULL,
	"farmer_name" text NOT NULL,
	"farmer_phone" text NOT NULL,
	"province" text NOT NULL,
	"district" text NOT NULL,
	"tehsil" text,
	"village" text,
	"crop_name" text NOT NULL,
	"variety" text,
	"quantity" text NOT NULL,
	"unit" text DEFAULT 'Kg' NOT NULL,
	"price_pkr" numeric NOT NULL,
	"quality_grade" text DEFAULT 'Grade A' NOT NULL,
	"harvest_date" text,
	"description" text,
	"images" jsonb DEFAULT '[]'::jsonb,
	"videos" jsonb DEFAULT '[]'::jsonb,
	"is_seller_verified" boolean DEFAULT false,
	"seller_badge" text DEFAULT 'Verified Genuine Farmer',
	"status" text DEFAULT 'available' NOT NULL,
	"views_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "marketplace_listings_listing_code_unique" UNIQUE("listing_code")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text,
	"client_ip" text,
	"plan" text NOT NULL,
	"billing_cycle" text NOT NULL,
	"amount_pkr" integer NOT NULL,
	"scans_quota" integer NOT NULL,
	"payment_method" text DEFAULT 'easypaisa' NOT NULL,
	"payment_reference" text,
	"status" text DEFAULT 'active' NOT NULL,
	"starts_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"email" text,
	"phone" text,
	"display_name" text,
	"photo_url" text,
	"platform" text DEFAULT 'web',
	"role" text DEFAULT 'farmer',
	"plan" text DEFAULT 'free' NOT NULL,
	"billing_cycle" text DEFAULT 'monthly',
	"subscription_expires_at" timestamp,
	"monthly_scan_quota" integer DEFAULT 0,
	"monthly_scans_used" integer DEFAULT 0,
	"subscription_started_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "diagnostic_diseases" ADD CONSTRAINT "diagnostic_diseases_scan_id_diagnostic_scans_id_fk" FOREIGN KEY ("scan_id") REFERENCES "public"."diagnostic_scans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_scans" ADD CONSTRAINT "diagnostic_scans_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_inquiries" ADD CONSTRAINT "marketplace_inquiries_listing_id_marketplace_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."marketplace_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_inquiries" ADD CONSTRAINT "marketplace_inquiries_buyer_id_users_uid_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("uid") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_seller_id_users_uid_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_uid_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("uid") ON DELETE cascade ON UPDATE no action;