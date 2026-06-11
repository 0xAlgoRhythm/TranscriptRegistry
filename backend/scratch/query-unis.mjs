import { db } from '../dist/db/connection.js'
import { universities } from '../dist/db/schema.js'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

async function main() {
  try {
    const list = await db.select().from(universities)
    console.log('UNIVERSITIES:', JSON.stringify(list, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}
main()
