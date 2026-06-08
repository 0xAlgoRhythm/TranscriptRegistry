import { db } from '../dist/db/connection.js'
import { students, transcripts, ipfsUploads } from '../dist/db/schema.js'
import { eq, and } from 'drizzle-orm'
import { keccak256, encodePacked } from 'viem'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const API_URL = 'http://localhost:3001'

// Helper: Run server if not running, or check connectivity
async function checkServer() {
  try {
    const res = await fetch(`${API_URL}/api/universities`)
    return res.ok
  } catch (e) {
    return false
  }
}

async function testFlows() {
  console.log('=== RUNNING AUTOMATED BACKEND TESTS ===')

  // Check server is alive
  const isServerAlive = await checkServer()
  if (!isServerAlive) {
    console.error('❌ Server is not running on http://localhost:3001. Please start it first.')
    process.exit(1)
  }
  console.log('✓ Server connectivity verified.')

  // 1. Test Privy Auth Bypass
  console.log('\n--- Test 1: Privy Auth Bypass ---')
  
  // A. Request with valid bypass token
  const bypassRes = await fetch(`${API_URL}/api/tokens`, {
    headers: { 'Authorization': 'Bearer credaxis-registrar' }
  })
  if (bypassRes.ok) {
    console.log('✓ SUCCESS: Privy Auth successfully bypassed with "credaxis-registrar" token.')
  } else {
    console.error(`❌ FAILURE: Bypass failed. Status code: ${bypassRes.status}`)
    process.exit(1)
  }

  // B. Request with invalid token
  const invalidRes = await fetch(`${API_URL}/api/tokens`, {
    headers: { 'Authorization': 'Bearer invalid-token' }
  })
  if (invalidRes.status === 401) {
    console.log('✓ SUCCESS: Invalid token rejected with 401 Unauthorized.')
  } else {
    console.error(`❌ FAILURE: Invalid token did not return 401. Status code: ${invalidRes.status}`)
    process.exit(1)
  }

  // 2. Prepare test data in database
  console.log('\n--- Setting up Test Data ---')
  const testStudentId = 'knust-test-999'
  const testWallet = '0x1234567890123456789012345678901234567899'
  const studentHashVal = keccak256(encodePacked(['address'], [testWallet]))
  const tempRecordId = '0xtemp-record-id-999'
  const realRecordId = '0xreal-record-id-999'
  const fileHash = '0xfile-hash-999'

  // Clean up any stale test data first
  await db.delete(transcripts).where(eq(transcripts.recordId, realRecordId))
  await db.delete(ipfsUploads).where(eq(ipfsUploads.recordId, tempRecordId))
  await db.delete(students).where(eq(students.studentId, testStudentId))

  // Insert Student
  const [student] = await db.insert(students).values({
    fullName: 'Test Student KNUST',
    studentId: testStudentId,
    universityId: 0,
    walletAddress: testWallet.toLowerCase(),
    status: 'approved',
    email: 'test@student.knust.edu.gh'
  }).returning()
  console.log(`✓ Inserted test student: ${student.fullName} (ID: ${student.studentId})`)

  // Insert IPFS Upload record mapping tempRecordId to fileHash
  await db.insert(ipfsUploads).values({
    recordId: tempRecordId,
    cid: 'QmCid999Test',
    fileHash: fileHash,
    studentHash: testWallet.toLowerCase(),
    universityName: 'KNUST',
    uploadedAt: new Date(),
    metadataJson: { tempRecordId: tempRecordId, fileHash: fileHash }
  })
  console.log(`✓ Inserted IPFS upload mapping ${tempRecordId} -> ${fileHash}`)

  // Insert Real Transcript record registered on-chain with fileHash
  await db.insert(transcripts).values({
    recordId: realRecordId,
    studentHash: studentHashVal,
    metadataCid: 'QmCid999Test',
    fileHash: fileHash,
    issuer: '0x6912ce2ba6cb8d70dfadccad5d1c3a61d8a4b88c',
    registryAddr: '0x0487722e60f437f5588bc97501177d1384c84e19',
    universityId: 0,
    issuedAt: new Date(),
    status: 'Active'
  })
  console.log(`✓ Inserted on-chain registered transcript: ${realRecordId}`)

  // 3. Test QR code direct recordId verify lookup (should auto-authorize/public)
  console.log('\n--- Test 2: QR Code Scan (Direct Record ID lookup) ---')
  const qrVerifyRes = await fetch(`${API_URL}/api/public/verify?recordId=${tempRecordId}`)
  if (qrVerifyRes.ok) {
    const data = await qrVerifyRes.json()
    if (data.requestAccessRequired) {
      console.error('❌ FAILURE: Direct QR code scan by tempRecordId was not auto-authorized.')
      process.exit(1)
    }
    if (data.transcript?.recordId === realRecordId) {
      console.log('✓ SUCCESS: Temp Record ID from QR code successfully mapped to real mined on-chain record ID.')
      console.log('✓ SUCCESS: Direct scan is auto-authorized (public access).')
    } else {
      console.error(`❌ FAILURE: Mapped recordId mismatch. Got: ${data.transcript?.recordId}`)
      process.exit(1)
    }
  } else {
    console.error(`❌ FAILURE: Verify request failed with status: ${qrVerifyRes.status}`)
    process.exit(1)
  }

  // 4. Test Student ID case-insensitive lookup (requires access token)
  console.log('\n--- Test 3: Index Lookup (Case-insensitive studentId) ---')
  
  // Test with UPPERCASE query of lowercase DB studentId
  const studentVerifyRes = await fetch(`${API_URL}/api/public/verify?studentId=KNUST-TEST-999`)
  if (studentVerifyRes.ok) {
    const data = await studentVerifyRes.json()
    if (data.requestAccessRequired === true) {
      console.log('✓ SUCCESS: Case-insensitive student ID lookup succeeded.')
      console.log('✓ SUCCESS: Enforced privacy rule: student ID lookup blocks access and requires approval.')
    } else {
      console.error('❌ FAILURE: Case-insensitive lookup returned full details without token/approval.')
      process.exit(1)
    }
  } else {
    console.error(`❌ FAILURE: Student lookup verify request failed with status: ${studentVerifyRes.status}`)
    process.exit(1)
  }

  // 5. Clean up test data
  console.log('\n--- Cleaning up Test Data ---')
  await db.delete(transcripts).where(eq(transcripts.recordId, realRecordId))
  await db.delete(ipfsUploads).where(eq(ipfsUploads.recordId, tempRecordId))
  await db.delete(students).where(eq(students.studentId, testStudentId))
  console.log('✓ Test data deleted successfully.')

  console.log('\n=======================================')
  console.log('🎉 ALL AUTOMATED BACKEND TESTS PASSED 🎉')
  console.log('=======================================')
}

testFlows().catch(err => {
  console.error('Test execution failed:', err)
  process.exit(1)
})
