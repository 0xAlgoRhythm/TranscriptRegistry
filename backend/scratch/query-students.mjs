import { db } from '../dist/db/connection.js'
import { transcripts } from '../dist/db/schema.js'
import { keccak256, encodePacked } from 'viem'

BigInt.prototype.toJSON = function () {
  return this.toString()
}

async function main() {
  try {
    const studentWallet = "0x4523761eac98ebd9a5ce5127163c6649b5852997"
    const studentHashVal = keccak256(encodePacked(["address"], [studentWallet]))
    console.log('EXPECTED STUDENT HASH:', studentHashVal)

    const txs = await db.select().from(transcripts)
    console.log('ALL TRANSCRIPTS IN DB:')
    console.log(JSON.stringify(txs, null, 2))

    const matches = txs.filter(t => t.studentHash.toLowerCase() === studentHashVal.toLowerCase())
    console.log('MATCHING TRANSCRIPTS:', matches.length)

  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}
main()
