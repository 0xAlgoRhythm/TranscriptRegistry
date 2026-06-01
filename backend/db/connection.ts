import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema.js"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load workspace Root .env file
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const connectionString = process.env.DATABASE_URL || "postgresql://user:password@localhost:5432/transcriptchain"

export const pool = new Pool({
  connectionString,
})

export const db = drizzle(pool, { schema })
