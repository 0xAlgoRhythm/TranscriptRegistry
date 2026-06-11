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
    
    console.log('Inserting mock transcript for student hash:', studentHashVal)
    const res = await db.insert(transcripts).values({
      recordId: "0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987",
      studentHash: studentHashVal,
      metadataCid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      fileHash: "0xbd60604bc181acb4f59c8bb1a2333b2ec62eb25e4c8165035cbbf8fedba11ee2",
      issuer: "0x6912bc40f1446dd8a2201f797f2c09dca3ceb88c",
      registryAddr: "0x9632D1a3194947CD888b37020261952A6aC52613",
      universityId: 1,
      issuedAt: new Date(),
      status: "Active",
      txHash: "0xmocktxhash1234567890abcdef1234567890abcdef1234567890abcdef1234",
      blockNumber: "10005000"
    }).returning()
    
    console.log('Inserted:', JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}
main()
