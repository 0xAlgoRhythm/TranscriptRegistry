CREATE TABLE "access_grants" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"verifier" text NOT NULL,
	"student" text NOT NULL,
	"granted_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true,
	"revoked_at" timestamp with time zone,
	"grant_tx" text,
	"revoke_tx" text
);
--> statement-breakpoint
CREATE TABLE "indexer_state" (
	"chain_id" integer PRIMARY KEY NOT NULL,
	"last_block" bigint NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ipfs_uploads" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" text,
	"cid" text NOT NULL,
	"file_hash" text NOT NULL,
	"student_hash" text NOT NULL,
	"university_name" text NOT NULL,
	"uploaded_at" timestamp with time zone NOT NULL,
	"metadata_json" jsonb NOT NULL,
	CONSTRAINT "ipfs_uploads_cid_unique" UNIQUE("cid")
);
--> statement-breakpoint
CREATE TABLE "transcript_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" text,
	"old_status" text NOT NULL,
	"new_status" text NOT NULL,
	"reason" text,
	"changed_at" timestamp with time zone NOT NULL,
	"tx_hash" text
);
--> statement-breakpoint
CREATE TABLE "transcripts" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"student_hash" text NOT NULL,
	"metadata_cid" text NOT NULL,
	"file_hash" text NOT NULL,
	"issuer" text NOT NULL,
	"registry_addr" text NOT NULL,
	"university_id" integer,
	"issued_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'Active',
	"tx_hash" text,
	"block_number" bigint,
	CONSTRAINT "transcripts_record_id_unique" UNIQUE("record_id")
);
--> statement-breakpoint
CREATE TABLE "universities" (
	"id" serial PRIMARY KEY NOT NULL,
	"university_id" integer NOT NULL,
	"name" text NOT NULL,
	"contract_addr" text NOT NULL,
	"registrar" text NOT NULL,
	"deployed_at" timestamp with time zone NOT NULL,
	"is_active" boolean DEFAULT true,
	"tx_hash" text,
	"block_number" bigint,
	CONSTRAINT "universities_university_id_unique" UNIQUE("university_id")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"record_id" text NOT NULL,
	"verifier" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"tx_hash" text,
	"block_number" bigint
);
--> statement-breakpoint
ALTER TABLE "transcript_status_history" ADD CONSTRAINT "transcript_status_history_record_id_transcripts_record_id_fk" FOREIGN KEY ("record_id") REFERENCES "public"."transcripts"("record_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transcripts" ADD CONSTRAINT "transcripts_university_id_universities_university_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("university_id") ON DELETE no action ON UPDATE no action;