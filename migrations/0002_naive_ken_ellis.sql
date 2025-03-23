CREATE TYPE "public"."payout_frequency" AS ENUM('one_time', 'weekly', 'biweekly', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."payout_method" AS ENUM('bank_transfer', 'paypal', 'stripe', 'check', 'crypto');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'canceled');--> statement-breakpoint
CREATE TABLE "payment_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" uuid NOT NULL,
	"account_type" "payout_method" NOT NULL,
	"account_name" text NOT NULL,
	"account_email" text,
	"account_details" text,
	"routing_number" text,
	"account_number" text,
	"bank_name" text,
	"bank_address" text,
	"swift_code" text,
	"paypal_email" text,
	"stripe_account_id" text,
	"is_verified" boolean DEFAULT false,
	"is_default" boolean DEFAULT false,
	"verification_documents" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payout_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payout_id" uuid NOT NULL,
	"action" text NOT NULL,
	"status" "payout_status" NOT NULL,
	"message" text,
	"metadata" text,
	"performed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payout_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" uuid NOT NULL,
	"project_id" uuid,
	"frequency" "payout_frequency" NOT NULL,
	"next_payout_date" date NOT NULL,
	"minimum_payout_amount" numeric DEFAULT '100' NOT NULL,
	"is_active" boolean DEFAULT true,
	"day_of_week" integer,
	"day_of_month" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" uuid NOT NULL,
	"project_id" uuid,
	"payment_account_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"fee" numeric DEFAULT '0' NOT NULL,
	"net_amount" numeric NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "payout_status" DEFAULT 'pending' NOT NULL,
	"scheduled_date" date,
	"processed_date" timestamp,
	"transaction_id" text,
	"reference" text,
	"notes" text,
	"processed_by" uuid,
	"failure_reason" text,
	"batch_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "project_statistics" (
	"id" text,
	"title" text,
	"backer_count" integer,
	"average_contribution" numeric(10, 2),
	"goal" numeric,
	"raised" numeric,
	"currency" text,
	"percentage_funded" numeric(5, 2),
	"comment_count" integer,
	"update_count" integer,
	"view_count" integer,
	"conversion_rate" numeric,
	"status" text,
	"created_at" timestamp,
	"end_date" timestamp,
	"days_remaining" integer
);
--> statement-breakpoint
CREATE TABLE "tax_information" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"publisher_id" uuid NOT NULL,
	"tax_id_type" text NOT NULL,
	"tax_id_number" text NOT NULL,
	"legal_name" text NOT NULL,
	"business_type" text,
	"tax_country" text NOT NULL,
	"tax_state" text,
	"tax_form_submitted" boolean DEFAULT false,
	"tax_form_type" text,
	"tax_form_submission_date" timestamp,
	"tax_form_verified" boolean DEFAULT false,
	"tax_form_verification_date" timestamp,
	"tax_withholding_rate" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_logs" ADD CONSTRAINT "payout_logs_payout_id_payouts_id_fk" FOREIGN KEY ("payout_id") REFERENCES "public"."payouts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_logs" ADD CONSTRAINT "payout_logs_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_schedules" ADD CONSTRAINT "payout_schedules_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_schedules" ADD CONSTRAINT "payout_schedules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_payment_account_id_payment_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_processed_by_users_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tax_information" ADD CONSTRAINT "tax_information_publisher_id_publishers_id_fk" FOREIGN KEY ("publisher_id") REFERENCES "public"."publishers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_payment_accounts_publisher_id" ON "payment_accounts" USING btree ("publisher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_default_account_per_publisher" ON "payment_accounts" USING btree ("publisher_id","is_default") WHERE "payment_accounts"."is_default" = true;--> statement-breakpoint
CREATE INDEX "idx_payout_logs_payout_id" ON "payout_logs" USING btree ("payout_id");--> statement-breakpoint
CREATE INDEX "idx_payout_logs_action" ON "payout_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_payout_logs_status" ON "payout_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payout_logs_created_at" ON "payout_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_payout_schedules_publisher_id" ON "payout_schedules" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "idx_payout_schedules_project_id" ON "payout_schedules" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_payouts_publisher_id" ON "payouts" USING btree ("publisher_id");--> statement-breakpoint
CREATE INDEX "idx_payouts_project_id" ON "payouts" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_payouts_payment_account_id" ON "payouts" USING btree ("payment_account_id");--> statement-breakpoint
CREATE INDEX "idx_payouts_status" ON "payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_payouts_scheduled_date" ON "payouts" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_payouts_batch_id" ON "payouts" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_tax_information_publisher_id" ON "tax_information" USING btree ("publisher_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_publisher_tax_info" ON "tax_information" USING btree ("publisher_id");