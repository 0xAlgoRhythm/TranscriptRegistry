import { db } from '../dist/db/connection.js'
import { ipfsUploads } from '../dist/db/schema.js'

async function main() {
  try {
    const res = await db.insert(ipfsUploads).values({
      cid: "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
      fileHash: "0xbd60604bc181acb4f59c8bb1a2333b2ec62eb25e4c8165035cbbf8fedba11ee2",
      studentHash: "0xffe36ff47ede2542dcc532e8e418eba3bc9f524c8165035cbbf8fedba11ee294",
      universityName: "Kwame Nkrumah University of Science and Technology",
      uploadedAt: new Date(),
      metadataJson: {
        studentName: "John Okyere",
        studentId: "230025344",
        major: "BSc Computer Science",
        gpa: "3.85",
        gradYear: "2026",
        issuedAt: new Date().toISOString(),
        courses: [
          { code: "CS-401", name: "Distributed Systems & Blockchain", credits: 3, grade: "A" },
          { code: "CS-402", name: "Advanced Cryptography", credits: 3, grade: "A" },
          { code: "CS-403", name: "On-Chain Smart Contract Dev", credits: 4, grade: "A" }
        ],
        fileHash: "0xbd60604bc181acb4f59c8bb1a2333b2ec62eb25e4c8165035cbbf8fedba11ee2",
        registryAddress: "0x0487722e60f437f5588bc97501177d1384c84e19"
      }
    }).returning()
    console.log('INSERTED METADATA:', JSON.stringify(res, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    process.exit(0)
  }
}
main()
