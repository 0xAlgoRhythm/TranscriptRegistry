import { db } from './dist/db/connection.js'
import { students } from './dist/db/schema.js'
import { eq } from 'drizzle-orm'

const API_URL = 'http://localhost:3001'

async function runEmailAndApprovalTest() {
  console.log("=========================================")
  console.log("   TESTING NEW STUDENT EMAIL APPROVAL    ")
  console.log("=========================================")

  const mockWallet = "0xTest" + Math.random().toString(16).slice(2, 10)
  const mockEmail = `test-student-${Date.now()}@university.edu`
  
  console.log(`\n[1] Student applies via /api/students`)
  console.log(`    Wallet: ${mockWallet}`)
  console.log(`    Email:  ${mockEmail}`)

  try {
    const res = await fetch(`${API_URL}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        walletAddress: mockWallet,
        fullName: "Test Automated Student",
        studentId: "TEST-ID-" + Math.floor(Math.random() * 10000),
        universityId: 0, // Fallback uni or specific one
        email: mockEmail
      })
    })

    const data = await res.json()
    console.log(`    API Response:`, data)

    if (data.status !== "pending") {
      console.log("❌ Failed to create pending student application.")
      process.exit(1)
    }

    console.log(`\n[2] Fetching approval token from database...`)
    const studentRecord = await db.query.students.findFirst({
      where: eq(students.walletAddress, mockWallet.toLowerCase())
    })

    if (!studentRecord || !studentRecord.approvalToken) {
      console.log("❌ Failed to find student record or approval token in DB.")
      process.exit(1)
    }

    console.log(`    Found Token: ${studentRecord.approvalToken}`)
    console.log(`    (The email sent to the registrar contains this token in the Accept/Reject links)`)

    console.log(`\n[3] Registrar clicks APPROVE link in email`)
    const approveUrl = `${API_URL}/api/students/approve-via-token?token=${studentRecord.approvalToken}`
    console.log(`    Calling GET ${approveUrl}`)
    
    const approveRes = await fetch(approveUrl)
    const htmlResponse = await approveRes.text()

    if (approveRes.ok && htmlResponse.includes("STUDENT APPROVED")) {
      console.log(`    ✅ Success! Server returned the success HTML page.`)
    } else {
      console.log(`    ❌ Failed! Unexpected response:`, htmlResponse)
      process.exit(1)
    }

    console.log(`\n[4] Verifying database status is updated`)
    const updatedRecord = await db.query.students.findFirst({
      where: eq(students.walletAddress, mockWallet.toLowerCase())
    })

    if (updatedRecord?.status === "approved") {
      console.log(`    ✅ Success! Student status is now 'approved'.`)
    } else {
      console.log(`    ❌ Failed! Student status is still '${updatedRecord?.status}'.`)
      process.exit(1)
    }

    console.log("\n✅ ALL TESTS PASSED! The email approval flow is working 100%.")
    process.exit(0)

  } catch (err) {
    console.error("\n❌ Test encountered an error:", err)
    process.exit(1)
  }
}

runEmailAndApprovalTest()
