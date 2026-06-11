import { db } from './dist/db/connection.js'
import { universities, systemAuditLogs } from './dist/db/schema.js'

BigInt.prototype.toJSON = function () { return this.toString() }

async function main() {
  try {
    console.log('=== UNIVERSITIES IN DATABASE ===')
    const unis = await db.select().from(universities)
    console.log(JSON.stringify(unis, null, 2))

    console.log('=== LATEST 10 SYSTEM AUDIT LOGS ===')
    const logs = await db.select().from(systemAuditLogs).limit(10)
    console.log(JSON.stringify(logs, null, 2))
  } catch (err) {
    console.error('Error querying DB:', err)
  } finally {
    process.exit(0)
  }
}

main()
