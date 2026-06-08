import { db } from './dist/db/connection.js'
import { students } from './dist/db/schema.js'

async function main() {
  try {
    console.log('=== STUDENTS IN DATABASE ===')
    const list = await db.select().from(students)
    console.log(JSON.stringify(list, null, 2))
  } catch (err) {
    console.error('Error querying DB:', err)
  } finally {
    process.exit(0)
  }
}

main()
