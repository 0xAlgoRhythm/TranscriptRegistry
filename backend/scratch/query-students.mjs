import { db } from './dist/db/connection.js'
import { students, transcripts } from './dist/db/schema.js'

// BigInt patch
BigInt.prototype.toJSON = function () {
  return this.toString()
}

async function main() {
  try {
    console.log('=== STUDENTS ===')
    const stds = await db.select().from(students)
    console.log(JSON.stringify(stds, null, 2))

    console.log('=== TRANSCRIPTS ===')
    const txs = await db.select().from(transcripts)
    console.log(JSON.stringify(txs, null, 2))
  } catch (err) {
    console.error('Error querying DB:', err)
  } finally {
    process.exit(0)
  }
}

main()
