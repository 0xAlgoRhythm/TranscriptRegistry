import { db } from './dist/db/connection.js'
import { students, universities } from './dist/db/schema.js'
import { eq } from 'drizzle-orm'
import { generateEmailTemplate } from './dist/utils/email.js'
import nodemailer from 'nodemailer'

const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || "587");
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_PASS;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
})

async function runRealEmailTest() {
  console.log("=========================================")
  console.log("   CREATING NEW REAL RECORD FOR TESTING  ")
  console.log("=========================================")

  try {
    const mockWallet = "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, '0')
    const realEmail = "johnokyere282@icloud.com" // User's real email
    const studentName = "John Okyere (Real Data Test)"
    const studentId = "ST-" + Date.now()
    
    // Create new student
    console.log(`[1] Creating new student in DB:`)
    console.log(`    Name:  ${studentName}`)
    console.log(`    ID:    ${studentId}`)
    console.log(`    Email: ${realEmail}`)

    const approvalToken = "st_app_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
    
    await db.insert(students).values({
      walletAddress: mockWallet,
      fullName: studentName,
      studentId: studentId,
      universityId: 1, // University of Ghana
      email: realEmail,
      status: "pending",
      approvalToken: approvalToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const uni = await db.query.universities.findFirst({
      where: eq(universities.universityId, 1)
    })

    const adminEmail = process.env.SMTP_USER || process.env.GMAIL_USER || ""
    const recipient = uni?.registrarEmail || adminEmail

    console.log(`\n[2] Sending new HTML Branded Email to: ${recipient}`)

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://credaxis-backend.onrender.com"
    const approveUrl = `${apiBase}/api/students/approve-via-token?token=${approvalToken}`
    const rejectUrl = `${apiBase}/api/students/reject-via-token?token=${approvalToken}`

    const messageHtml = `
      <p>Hello,</p>
      <p>A new student has submitted a profile verification request for your institution.</p>
      <div class="details-box">
        <p><span class="label">Name:</span> <strong>${studentName}</strong></p>
        <p><span class="label">Student ID:</span> <strong>${studentId}</strong></p>
        <p><span class="label">Email:</span> <strong><a href="mailto:${realEmail}" style="color: #3b82f6; text-decoration: none;">${realEmail}</a></strong></p>
        <p><span class="label">University:</span> <strong>${uni ? uni.name : "N/A"}</strong></p>
      </div>
      <p>Please review and accept or reject this application instantly using the buttons below, or log into the institutional portal.</p>
      <div class="button-container" style="display: flex; justify-content: center; gap: 20px;">
        <a href="${approveUrl}" class="button" style="background-color: #10b981; margin-right: 15px; color: #fff;">APPROVE APPLICATION</a>
        <a href="${rejectUrl}" class="button" style="background-color: #ef4444; color: #fff;">REJECT APPLICATION</a>
      </div>
    `

    const mailOptions = {
      from: process.env.SMTP_FROM || adminEmail,
      to: recipient,
      replyTo: realEmail,
      subject: `New Student Verification Request - ${studentName}`,
      text: `A new student (${studentName}, ID: ${studentId}, Email: ${realEmail}) has submitted a profile verification request.`,
      html: generateEmailTemplate("New Student Verification Request", messageHtml)
    }

    await transporter.sendMail(mailOptions)

    console.log(`    ✅ Success! Email sent successfully.`)
    console.log(`\n👉 Please check your inbox (${recipient}) to see the NEW beautifully branded email and test the APPROVE button with the real production URL!`)
    process.exit(0)

  } catch (err) {
    console.error("\n❌ Test encountered an error:", err)
    process.exit(1)
  }
}

runRealEmailTest()
