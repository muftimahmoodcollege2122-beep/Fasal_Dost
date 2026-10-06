ALTER TABLE "diagnostic_scans" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "diagnostic_scans" ADD COLUMN "s3_key" text;--> statement-breakpoint
ALTER TABLE "diagnostic_scans" ADD COLUMN "processing_time_ms" integer;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD COLUMN "cnic_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD COLUMN "farmer_type" text;--> statement-breakpoint
ALTER TABLE "farmer_profiles" ADD COLUMN "date_of_birth" date;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD COLUMN "seller_email" text;--> statement-breakpoint
ALTER TABLE "marketplace_listings" ADD COLUMN "inquiries_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "language" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_login_at" timestamp;