import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '.env') })

const connectionString = process.env.DATABASE_URL

async function run() {
  if (!connectionString) {
    console.error('DATABASE_URL not found')
    return
  }
  const pool = new pg.Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  try {
    console.log('Cleaning up old universities and transcripts from previous deployments...')
    // Delete transcripts that point to old universities
    await pool.query('DELETE FROM transcripts WHERE university_id >= 3')
    // Delete old universities
    const res = await pool.query('DELETE FROM universities WHERE university_id >= 3')
    console.log(`Deleted ${res.rowCount} old university records from database.`)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await pool.end()
  }
}
run()
