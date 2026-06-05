import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Try loading from multiple locations — works for both ts-node and compiled dist
// dist/db → ../../.env = backend/.env  |  src/db → ../../.env = backend/.env (same)
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
// Also try root .env as fallback
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/transcriptchain";
const isRemote = connectionString.includes("render.com") ||
    connectionString.includes("supabase") ||
    connectionString.includes("neon.tech") ||
    connectionString.includes("amazonaws.com");
export const pool = new Pool({
    connectionString,
    // SSL required for Render, Supabase, and other hosted Postgres
    ssl: isRemote ? { rejectUnauthorized: false } : false,
});
export const db = drizzle(pool, { schema });
