CREATE TABLE "institution_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"institution_id" integer NOT NULL,
	"student_name" text NOT NULL,
	"student_id" text NOT NULL,
	"student_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"record_id" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"action_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"wallet_address" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"action_at" timestamp with time zone,
	"action_by" text,
	CONSTRAINT "institutions_email_unique" UNIQUE("email"),
	CONSTRAINT "institutions_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "approval_token" text;--> statement-breakpoint
ALTER TABLE "institution_requests" ADD CONSTRAINT "institution_requests_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;