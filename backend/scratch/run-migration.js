import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL;

console.log('Connecting to database...');

const client = new pg.Client({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected successfully.');

    // 1. Create table transcript_requests
    console.log('Creating transcript_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "transcript_requests" (
        "id" serial PRIMARY KEY NOT NULL,
        "student_wallet" text NOT NULL,
        "student_name" text NOT NULL,
        "student_id" text NOT NULL,
        "email" text NOT NULL,
        "university_id" integer NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 2. Add foreign key constraint
    console.log('Adding foreign key constraint...');
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transcript_requests_university_id_universities_university_id_fk') THEN
              ALTER TABLE "transcript_requests" ADD CONSTRAINT "transcript_requests_university_id_universities_university_id_fk" FOREIGN KEY ("university_id") REFERENCES "public"."universities"("university_id") ON DELETE no action ON UPDATE no action;
          END IF;
      END $$;
    `);

    // 3. Create table institutions
    console.log('Creating institutions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "institutions" (
        "id" serial PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text UNIQUE NOT NULL,
        "wallet_address" text UNIQUE NOT NULL,
        "status" text DEFAULT 'pending' NOT NULL,
        "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
        "action_at" timestamp with time zone,
        "action_by" text
      );
    `);

    // 4. Create table institution_requests
    console.log('Creating institution_requests table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS "institution_requests" (
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
    `);

    // 5. Add foreign key constraint for institution_requests
    console.log('Adding foreign key constraint for institution_requests...');
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'institution_requests_institution_id_institutions_id_fk') THEN
              ALTER TABLE "institution_requests" ADD CONSTRAINT "institution_requests_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE cascade ON UPDATE no action;
          END IF;
      END $$;
    `);

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await client.end();
  }
}

main();
