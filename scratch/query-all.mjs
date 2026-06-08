import { db } from '../backend/dist/db/connection.js'
import { universities, transcripts, students, institutions, institutionRequests } from '../backend/dist/db/schema.js'

// BigInt JSON serializer helper
BigInt.prototype.toJSON = function() { return this.toString() }

async function main() {
  try {
    console.log('=== UNIVERSITIES ===')
    const unis = await db.select().from(universities)
    console.log(unis)

    console.log('=== STUDENTS ===')
    const stud = await db.select().from(students)
    console.log(stud)

    console.log('=== TRANSCRIPTS ===')
    const txs = await db.select().from(transcripts)
    console.log(txs)

    console.log('=== INSTITUTIONS ===')
    const insts = await db.select().from(institutions)
    console.log(insts)

    console.log('=== INSTITUTION REQUESTS ===')
    const reqs = await db.select().from(institutionRequests)
    console.log(reqs)
  } catch (err) {
    console.error('Error querying DB:', err)
  } finally {
    process.exit(0)
  }
}

main()
