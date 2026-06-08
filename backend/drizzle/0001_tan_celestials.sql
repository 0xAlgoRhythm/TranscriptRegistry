CREATE TABLE "governance_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"university_id" integer NOT NULL,
	"contract_addr" text NOT NULL,
	"current_value" text NOT NULL,
	"new_value" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"action_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "issued_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"institution_name" text NOT NULL,
	"issuer_address" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "issued_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "public_access_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"requester_name" text NOT NULL,
	"requester_org" text NOT NULL,
	"requester_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"expires_at" timestamp with time zone,
	CONSTRAINT "public_access_requests_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "registrar_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"tx_hash" text NOT NULL,
	"email" text NOT NULL,
	CONSTRAINT "registrar_emails_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"wallet_address" text,
	"full_name" text NOT NULL,
	"student_id" text NOT NULL,
	"university_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"action_at" timestamp with time zone,
	CONSTRAINT "students_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "system_audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor_type" text NOT NULL,
	"actor_address" text NOT NULL,
	"action" text NOT NULL,
	"details" text,
	"timestamp" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transcript_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_wallet" text NOT NULL,
	"student_name" text NOT NULL,
	"student_id" text NOT NULL,
	"email" text NOT NULL,
	"university_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "registrar_email" text;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "universities" ADD COLUMN "stamp_url" text;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_university_id_universities_university_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("university_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcript_requests" ADD CONSTRAINT "transcript_requests_university_id_universities_university_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("university_id") ON DELETE no action ON UPDATE no action;