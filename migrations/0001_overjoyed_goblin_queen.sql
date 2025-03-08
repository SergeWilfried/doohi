CREATE TYPE "public"."currency" AS ENUM('USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_status" AS ENUM('pending', 'fulfilled', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video', 'document');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('project_update', 'comment', 'funding_goal', 'reward_fulfillment', 'system');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('draft', 'active', 'funded', 'expired', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."publisher_type" AS ENUM('user', 'organization');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('backer', 'publisher', 'admin');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"line1" text NOT NULL,
	"line2" text,
	"city" text NOT NULL,
	"state" text,
	"postal_code" text NOT NULL,
	"country" text NOT NULL,
	"phone" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "analytics_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"project_id" uuid,
	"event_type" text NOT NULL,
	"event_data" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "backers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"total_amount_pledged" numeric DEFAULT '0' NOT NULL,
	"projects_backed" integer DEFAULT 0 NOT NULL,
	"bio" text,
	"preferences" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"display_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"comment_text" text NOT NULL,
	"parent_comment_id" uuid,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contributions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"backer_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"reward_id" uuid,
	"amount" numeric NOT NULL,
	"currency" "currency" DEFAULT 'USD',
	"address_id" uuid,
	"anonymous" boolean DEFAULT false,
	"message" text,
	"transaction_id" text,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"refunded" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"read" boolean DEFAULT false,
	"data" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"contact_email" text,
	"contact_phone" text,
	"website_url" text,
	"logo_url" text,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "organizations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"media_type" "media_type" NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"description" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "project_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text NOT NULL,
	"goal" numeric NOT NULL,
	"minimum_pledge" numeric DEFAULT '1' NOT NULL,
	"raised" numeric DEFAULT '0' NOT NULL,
	"currency" "currency" DEFAULT 'USD',
	"days_left" integer,
	"end_date" timestamp NOT NULL,
	"status" "project_status" DEFAULT 'draft' NOT NULL,
	"featured_image" text,
	"publisher_id" uuid,
	"category_id" uuid,
	"publisher_type" "publisher_type" DEFAULT 'user' NOT NULL,
	"featured" boolean DEFAULT false,
	"view_count" integer DEFAULT 0,
	"conversion_rate" numeric DEFAULT '0',
	"risks" text,
	"faq" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "publishers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"total_projects" integer DEFAULT 0 NOT NULL,
	"total_funds_raised" numeric DEFAULT '0' NOT NULL,
	"default_currency" "currency" DEFAULT 'USD',
	"trust_score" integer DEFAULT 0 NOT NULL,
	"year_founded" integer NOT NULL,
	"social_links" json,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"amount_required" numeric NOT NULL,
	"currency" "currency" DEFAULT 'USD',
	"quantity_available" integer NOT NULL,
	"quantity_claimed" integer DEFAULT 0,
	"estimated_delivery_date" timestamp,
	"shipping_required" boolean DEFAULT false,
	"shipping_restrictions" json,
	"fulfillment_status" "fulfillment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "tags_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"update_text" text NOT NULL,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"following_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'backer' NOT NULL,
	"organization_id" uuid,
	"email_verified" boolean DEFAULT false,
	"email_verification_token" text,
	"password_reset_token" text,
	"password_reset_expires" timestamp,
	"mfa_enabled" boolean DEFAULT false,
	"mfa_secret" text,
	"profile_image_url" text,
	"bio" text,
	"preferences" json,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DROP TABLE "todo";--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "contact_email" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "contact_phone" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "backers" ADD CONSTRAINT "backers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_comment_id_comments_id_fk" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contributions" ADD CONSTRAINT "contributions_backer_id_backers_id_fk" FOREIGN KEY ("backer_id") REFERENCES "public"."backers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contributions" ADD CONSTRAINT "contributions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contributions" ADD CONSTRAINT "contributions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contributions" ADD CONSTRAINT "contributions_address_id_addresses_id_fk" FOREIGN KEY ("address_id") REFERENCES "public"."addresses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_media" ADD CONSTRAINT "project_media_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "project_tags" ADD CONSTRAINT "project_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projects" ADD CONSTRAINT "projects_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "rewards" ADD CONSTRAINT "rewards_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "updates" ADD CONSTRAINT "updates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_follows" ADD CONSTRAINT "user_follows_following_id_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_addresses_user_id" ON "addresses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_events_user_id" ON "analytics_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_events_project_id" ON "analytics_events" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_events_event_type" ON "analytics_events" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_analytics_events_created_at" ON "analytics_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_backers_user_id" ON "backers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_project_id" ON "comments" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_user_id" ON "comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_comments_parent_comment_id" ON "comments" USING btree ("parent_comment_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contributions_backer_id" ON "contributions" USING btree ("backer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contributions_project_id" ON "contributions" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_contributions_reward_id" ON "contributions" USING btree ("reward_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_notifications_read" ON "notifications" USING btree ("read");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_media_project_id" ON "project_media" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_tags_project_id" ON "project_tags" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_project_tags_tag_id" ON "project_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_project_tag_idx" ON "project_tags" USING btree ("project_id","tag_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_publisher_id" ON "projects" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_category_id" ON "projects" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_featured" ON "projects" USING btree ("featured");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_projects_end_date" ON "projects" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rewards_project_id" ON "rewards" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_updates_project_id" ON "updates" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "follower_idx" ON "user_follows" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "following_idx" ON "user_follows" USING btree ("following_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "unique_follow_idx" ON "user_follows" USING btree ("follower_id","following_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "organization" ADD CONSTRAINT "organization_name_unique" UNIQUE("name");
