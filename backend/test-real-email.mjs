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
  console.log("   SENDING REAL EMAIL TEST NOTIFICATION  ")
  console.log("=========================================")

  try {
    // 1. Pick a real student from the database (pending status)
    const realStudent = await db.query.students.findFirst({
      where: eq(students.status, "pending")
    })

    if (!realStudent) {
      console.log("❌ No pending students found in the database. Please register a student first.")
      process.exit(1)
    }

    console.log(`[1] Selected Real Student:`)
    console.log(`    Name:  ${realStudent.fullName}`)
    console.log(`    ID:    ${realStudent.studentId}`)
    console.log(`    Email: ${realStudent.email}`)

    // 2. Generate and set approval token if missing
    let token = realStudent.approvalToken
    if (!token) {
      token = "st_app_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
      await db.update(students)
        .set({ approvalToken: token })
        .where(eq(students.id, realStudent.id))
      console.log(`\n[2] Generated new approval token for this student: ${token}`)
    } else {
      console.log(`\n[2] Student already has an approval token: ${token}`)
    }

    // 3. Send the email
    const uni = await db.query.universities.findFirst({
      where: eq(universities.universityId, realStudent.universityId)
    })

    const adminEmail = process.env.SMTP_USER || process.env.GMAIL_USER || ""
    const recipient = uni?.registrarEmail || adminEmail

    console.log(`\n[3] Sending Email to: ${recipient}`)
    
    if (!transporter) {
      console.log("❌ Email transporter is not configured. Check SMTP settings in .env.")
      process.exit(1)
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    const approveUrl = `${apiBase}/api/students/approve-via-token?token=${token}`
    const rejectUrl = `${apiBase}/api/students/reject-via-token?token=${token}`

    const messageHtml = `
      <p>Hello,</p>
      <p>A new student has submitted a profile verification request for your institution.</p>
      <div class="details-box">
        <p><span class="label">Name:</span> <strong>${realStudent.fullName}</strong></p>
        <p><span class="label">Student ID:</span> <strong>${realStudent.studentId}</strong></p>
        <p><span class="label">Email:</span> <strong><a href="mailto:${realStudent.email}" style="color: #3b82f6; text-decoration: none;">${realStudent.email}</a></strong></p>
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
      replyTo: realStudent.email,
      subject: `[REAL DATA TEST] New Student Verification Request - ${realStudent.fullName}`,
      text: `A new student (${realStudent.fullName}, ID: ${realStudent.studentId}, Email: ${realStudent.email}) has submitted a profile verification request.`,
      html: generateEmailTemplate("New Student Verification Request", messageHtml)
    }

    await transporter.sendMail(mailOptions)

    console.log(`    ✅ Success! Email sent successfully.`)
    console.log(`\n👉 Please check your inbox (${recipient}) to see the beautifully branded email and test the APPROVE button!`)
    process.exit(0)

  } catch (err) {
    console.error("\n❌ Test encountered an error:", err)
    process.exit(1)
  }
}

runRealEmailTest()
