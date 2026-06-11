import { db } from '../dist/db/connection.js'
import { transcripts } from '../dist/db/schema.js'
import { eq } from 'drizzle-orm'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

async function main() {
  try {
    const res = await db.update(transcripts)
      .set({
        registryAddr: "0x0487722e60f437f5588bc97501177d1384c84e19",
        universityId: 0
      })
      .where(eq(transcripts.id, 14))
      .returning()
    console.log('UPDATED TRANSCRIPT REGISTRY:', JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}
main()
