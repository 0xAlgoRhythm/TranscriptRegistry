import { db } from '../backend/dist/db/connection.js'
import { universities } from '../backend/dist/db/schema.js'

async function main() {
  try {
    const unis = await db.select().from(universities)
    console.log('=== UNIVERSITIES ===')
    unis.forEach(u => {
      console.log(`ID: ${u.id}, UniId: ${u.universityId}, Name: ${u.name}, Address: ${u.contractAddr}, Active: ${u.isActive}`)
    })
  } catch (err) {
    console.error(err)
  } finally {
    process.exit(0)
  }
}

main()
