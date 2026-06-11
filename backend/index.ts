import { Hono } from "hono"
import { cors } from "hono/cors"
import { db } from "./db/connection.js"
import { universities, transcripts, accessGrants, ipfsUploads, students, transcriptStatusHistory, verifications, systemAuditLogs, registrarEmails, governanceRequests, publicAccessRequests, issuedTokens, transcriptRequests, institutions, institutionRequests } from "./db/schema.js"
import { createRemoteJWKSet, jwtVerify } from "jose"
import { eq, and, sql, inArray } from "drizzle-orm"
import { startIndexer } from "./indexer/sync.js"
import { serve } from "@hono/node-server"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import nodemailer from "nodemailer"
import { keccak256, encodePacked, isAddress } from "viem"
import { generateEmailTemplate } from "./utils/email.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, "../.env") })

const app = new Hono()

app.get("/", (c) => c.json({ status: "active", service: "CredAxis Transcript Registry API", version: "1.0.0" }))
app.get("/api", (c) => c.json({ status: "active", service: "CredAxis Transcript Registry API", version: "1.0.0" }))

// Set up Nodemailer transport
let transporter: nodemailer.Transporter | null = null;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
// Remove any inner spaces from app passwords just in case
const smtpPass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "").replace(/\s/g, "");

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
  console.log(`[EMAIL] Nodemailer initialized with ${smtpUser} via ${smtpHost}`);
} else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  const gmailPass = process.env.GMAIL_APP_PASSWORD.replace(/\s/g, "");
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: gmailPass,
    },
  });
  console.log(`[EMAIL] Nodemailer initialized with ${process.env.GMAIL_USER}`);
} else {
  console.log(`[EMAIL] Nodemailer not initialized. Missing SMTP or GMAIL configuration in .env`);
}

// ─── Global BigInt JSON patch ───
// Drizzle ORM returns bigint for block_number columns. Native JSON.stringify
// throws on BigInt, so we patch it globally once at startup.
; (BigInt.prototype as any).toJSON = function () {
  return this.toString()
}

app.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}))

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID

let jwks: any = null
if (PRIVY_APP_ID && PRIVY_APP_ID !== "your_privy_app_id_here" && !PRIVY_APP_ID.includes("placeholder")) {
  jwks = createRemoteJWKSet(
    new URL(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/.well-known/jwks.json`)
  )
  console.log(`[AUTH] Privy JWKS initialized for App ID: ${PRIVY_APP_ID}`)
} else {
  console.warn("⚠️ [AUTH] PRIVY_APP_ID is not configured. Backend verification will bypass signature check for demo/dev mode.")
}

// Auth Middleware (verifies Privy JWTs)
const verifyAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  const token = authHeader.split(" ")[1]

  // Bypass signature check for local/dev and specific verifier tokens first
  if (token === "credaxis-registrar" || token === "demo_token") {
    c.set("user", { sub: "did:privy:demo" })
    await next()
    return
  }

  if (jwks) {
    try {
      const { payload } = await jwtVerify(token, jwks, {
        issuer: "privy.io",
        audience: PRIVY_APP_ID,
      })
      c.set("user", payload)
    } catch (err: any) {
      console.error("Privy JWT verify failed:", err)
      return c.json({ error: "Invalid or expired Privy JWT token" }, 401)
    }
  } else {
    // Development fallback
    if (!token || token.split(".").length !== 3) {
      return c.json({ error: "Unauthorized: Invalid token format" }, 401)
    } else {
      try {
        const parts = token.split(".")
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString())
        c.set("user", payload)
      } catch (e) {
        c.set("user", { sub: "did:privy:demo" })
      }
    }
  }

  await next()
}

// ─── API Routes ───

// Helper: Add Audit Log
async function logAudit(actorType: string, actorAddress: string, action: string, details?: string) {
  try {
    await db.insert(systemAuditLogs).values({
      actorType,
      actorAddress,
      action,
      details,
    })
  } catch (err) {
    console.error("Failed to write audit log:", err)
  }
}

// Audit Logs Endpoint
app.get("/api/audit-logs", async (c) => {
  try {
    const actorAddress = c.req.query("actorAddress")
    if (actorAddress) {
      const logs = await db.select().from(systemAuditLogs)
        .where(eq(systemAuditLogs.actorAddress, actorAddress.toLowerCase()))
        .orderBy(sql`${systemAuditLogs.timestamp} DESC`)
        .limit(100)
      return c.json(logs)
    }
    const logs = await db.select().from(systemAuditLogs)
      .orderBy(sql`${systemAuditLogs.timestamp} DESC`)
      .limit(200)
    return c.json(logs)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post("/api/audit-logs", async (c) => {
  try {
    const { actorType, actorAddress, action, details } = await c.req.json()
    await logAudit(actorType, actorAddress.toLowerCase(), action, details)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Registrar Settings
app.get("/api/registrar/settings/:registrarAddr", async (c) => {
  try {
    const addr = c.req.param("registrarAddr").toLowerCase()
    const uni = await db.query.universities.findFirst({
      where: eq(universities.registrar, addr)
    })
    if (!uni) return c.json({ error: "University not found" }, 404)
    return c.json(uni)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post("/api/registrar/settings", async (c) => {
  try {
    const { registrarAddr, logoUrl, stampUrl } = await c.req.json()
    const result = await db.update(universities)
      .set({ logoUrl, stampUrl })
      .where(eq(universities.registrar, registrarAddr.toLowerCase()))
      .returning()

    await logAudit("registrar", registrarAddr.toLowerCase(), "UPDATED_SETTINGS", `Updated logo/stamp assets`)
    return c.json(result[0])
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})


// Platform stats
app.get("/api/stats/platform", async (c) => {
  try {
    const totalUnisResult = await db.select({ count: sql<number>`count(*)` }).from(universities)
    const activeUnisResult = await db.select({ count: sql<number>`count(*)` }).from(universities).where(eq(universities.isActive, true))
    const totalTranscriptsResult = await db.select({ count: sql<number>`count(*)` }).from(transcripts)
    const totalVerificationsResult = await db.select({ count: sql<number>`count(*)` }).from(verifications)

    return c.json({
      totalUniversities: Number(totalUnisResult[0]?.count || 0),
      activeUniversities: Number(activeUnisResult[0]?.count || 0),
      totalTranscripts: Number(totalTranscriptsResult[0]?.count || 0),
      totalVerifications: Number(totalVerificationsResult[0]?.count || 0),
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Universities
app.get("/api/universities", async (c) => {
  try {
    const list = await db.select().from(universities)
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post("/api/universities/register-email", async (c) => {
  try {
    const { txHash, email } = await c.req.json()
    if (!txHash || !email) {
      return c.json({ error: "Missing required fields" }, 400)
    }
    const cleanHash = txHash.toLowerCase()
    const cleanEmail = email.toLowerCase()

    await db.insert(registrarEmails).values({
      txHash: cleanHash,
      email: cleanEmail,
    }).onConflictDoUpdate({
      target: registrarEmails.txHash,
      set: { email: cleanEmail }
    })

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Governance / Recovery Requests
app.get("/api/governance/requests", async (c) => {
  try {
    const list = await db.select().from(governanceRequests).orderBy(sql`${governanceRequests.createdAt} DESC`)
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post("/api/governance/requests", async (c) => {
  try {
    const { type, universityId, contractAddr, currentValue, newValue } = await c.req.json()
    if (!type || (universityId === undefined || universityId === null || universityId === "") || !contractAddr || !currentValue || !newValue) {
      return c.json({ error: "Missing required fields" }, 400)
    }

    const result = await db.insert(governanceRequests).values({
      type, // 'email' | 'wallet'
      universityId: parseInt(universityId),
      contractAddr: contractAddr.toLowerCase(),
      currentValue: currentValue.toLowerCase(),
      newValue: newValue.toLowerCase(),
      status: "pending",
      createdAt: new Date(),
    }).returning()

    await logAudit("registrar", contractAddr.toLowerCase(), "GOVERNANCE_REQUEST_SUBMITTED", `Requested ${type} change from ${currentValue} to ${newValue}`)
    return c.json(result[0])
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post("/api/governance/requests/:id/approve", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const req = await db.query.governanceRequests.findFirst({
      where: eq(governanceRequests.id, id)
    })
    if (!req) return c.json({ error: "Request not found" }, 404)
    if (req.status !== "pending") return c.json({ error: "Request is already processed" }, 400)

    // Update request status
    await db.update(governanceRequests)
      .set({ status: "approved", actionAt: new Date() })
      .where(eq(governanceRequests.id, id))

    if (req.type === "email") {
      // For email change, we update the database
      await db.update(universities)
        .set({ registrarEmail: req.newValue.toLowerCase() })
        .where(eq(universities.universityId, req.universityId))

      await logAudit("admin", "0x31eee44788ea5ae0c65dbdcb1d1c3ea1d8a4e592", "APPROVED_EMAIL_CHANGE", `Approved email change to ${req.newValue} for university ID ${req.universityId}`)
    } else if (req.type === "wallet") {
      // For wallet change, we also update the universities registrar wallet in DB
      await db.update(universities)
        .set({ registrar: req.newValue.toLowerCase() })
        .where(eq(universities.universityId, req.universityId))

      await logAudit("admin", "0x31eee44788ea5ae0c65dbdcb1d1c3ea1d8a4e592", "APPROVED_WALLET_CHANGE", `Approved wallet change to ${req.newValue} for university ID ${req.universityId}`)
    }

    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.post("/api/governance/requests/:id/reject", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const req = await db.query.governanceRequests.findFirst({
      where: eq(governanceRequests.id, id)
    })
    if (!req) return c.json({ error: "Request not found" }, 404)
    if (req.status !== "pending") return c.json({ error: "Request is already processed" }, 400)

    await db.update(governanceRequests)
      .set({ status: "rejected", actionAt: new Date() })
      .where(eq(governanceRequests.id, id))

    await logAudit("admin", "0x31eee44788ea5ae0c65dbdcb1d1c3ea1d8a4e592", "REJECTED_GOVERNANCE_CHANGE", `Rejected ${req.type} change to ${req.newValue} for university ID ${req.universityId}`)
    return c.json({ success: true })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get("/api/universities/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const uni = await db.query.universities.findFirst({
      where: eq(universities.universityId, id)
    })
    if (!uni) return c.json({ error: "University not found" }, 404)
    return c.json(uni)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get("/api/universities/by-address/:addr", async (c) => {
  try {
    const addr = c.req.param("addr").toLowerCase()
    const uni = await db.query.universities.findFirst({
      where: eq(universities.contractAddr, addr)
    })
    if (!uni) return c.json({ error: "Registry contract address not registered" }, 404)
    return c.json(uni)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Transcripts
app.get("/api/transcripts/:recordId", async (c) => {
  try {
    const recordId = c.req.param("recordId")
    const tx = await db.query.transcripts.findFirst({
      where: eq(transcripts.recordId, recordId)
    })
    if (!tx) return c.json({ error: "Transcript record not found" }, 404)
    return c.json(tx)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get("/api/transcripts/by-student/:studentHash", async (c) => {
  try {
    const studentHash = c.req.param("studentHash").toLowerCase()
    const list = await db.select().from(transcripts).where(eq(transcripts.studentHash, studentHash))
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get("/api/transcripts/by-registrar/:address", async (c) => {
  try {
    const address = c.req.param("address").toLowerCase()
    const list = await db.select().from(transcripts).where(eq(transcripts.issuer, address))
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get("/api/transcripts/by-registry/:addr", async (c) => {
  try {
    const addr = c.req.param("addr").toLowerCase()
    const list = await db.select().from(transcripts).where(eq(transcripts.registryAddr, addr))
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Student request a transcript (auto-delivers if exists, queues and alerts registrar if not)
app.post("/api/transcripts/request", async (c) => {
  try {
    const { studentWallet, email } = await c.req.json()
    if (!studentWallet) {
      return c.json({ error: "Missing required studentWallet address" }, 400)
    }

    const cleanWallet = studentWallet.toLowerCase()

    // 1. Resolve student profile
    const student = await db.query.students.findFirst({
      where: eq(students.walletAddress, cleanWallet)
    })
    if (!student) {
      return c.json({ error: "Student profile not found. Please onboarding first." }, 404)
    }

    // 2. Check if active transcript exists
    const studentHashVal = keccak256(encodePacked(["address"], [cleanWallet as `0x${string}`]))
    const activeTx = await db.query.transcripts.findFirst({
      where: and(
        eq(transcripts.studentHash, studentHashVal),
        eq(transcripts.status, "Active")
      ),
      orderBy: (transcripts, { desc }) => [desc(transcripts.issuedAt)]
    })

    if (activeTx) {
      // Transcript exists -> retrieve metadata and auto-mail verification receipt
      const upload = await db.query.ipfsUploads.findFirst({
        where: eq(ipfsUploads.fileHash, activeTx.fileHash)
      })
      const metadataJson = (upload?.metadataJson || {}) as any

      if (transporter) {
        try {
          const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
          const verifyUrl = `${frontendBase}/verify/${activeTx.recordId}?registry=${activeTx.registryAddr}`
          const messageHtml = `
            <h2 style="color: #6c5bf0; padding-bottom: 10px;">TRANSCRIPT SECURED</h2>
            <p>Hello <strong>${student.fullName}</strong>,</p>
            <p>Your university registrar has just uploaded and secured your official academic transcript metadata on IPFS.</p>
            <div class="details-box">
              <p><span class="label">Student Name:</span> <strong>${student.fullName}</strong></p>
              <p><span class="label">Student ID:</span> <strong>${student.studentId}</strong></p>
              <p><span class="label">Major:</span> <strong>${metadataJson?.major || 'N/A'}</strong></p>
              <p><span class="label">GPA:</span> <strong>${metadataJson?.gpa || 'N/A'}</strong></p>
            </div>
            <p>You can verify this credential instantly through the platform.</p>
            <div class="button-container">
              <a href="${verifyUrl}" class="button">View Transcript</a>
            </div>
          `;

          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
            to: student.email,
            subject: "📜 CredAxis — Auto-Delivered Official Transcript Receipt",
            html: generateEmailTemplate("Official Transcript Receipt", messageHtml)
          })
          console.log(`[EMAIL] Auto-receipt sent to student: ${student.email}`)
        } catch (emailErr: any) {
          console.error(`[REQUEST API] Failed to auto-mail transcript to ${student.email}:`, emailErr.message)
        }
      }

      return c.json({ status: "sent", message: "Official transcript found! A verification receipt has been emailed to you." })
    }

    // Transcript does not exist -> resolve university registrar to record request queue
    const uni = await db.query.universities.findFirst({
      where: eq(universities.universityId, student.universityId)
    })

    const existingReq = await db.query.transcriptRequests.findFirst({
      where: and(
        eq(transcriptRequests.studentWallet, cleanWallet),
        eq(transcriptRequests.status, "pending")
      )
    })

    // Rate Limiting: Max 3 transcript generation requests per 6 months (Semester Quota)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const requestCount = await db.select({ count: sql`count(*)` })
      .from(transcriptRequests)
      .where(and(
        eq(transcriptRequests.studentWallet, cleanWallet),
        sql`${transcriptRequests.createdAt} > ${sixMonthsAgo.toISOString()}`
      ))

    const count = parseInt(requestCount[0].count as string) || 0
    if (count >= 3 && !existingReq) {
      return c.json({ error: "Semester quota exceeded: You have reached the maximum of 3 official transcript requests for this term. Please contact your registrar." }, 429)
    }

    if (!existingReq) {
      await db.insert(transcriptRequests).values({
        studentWallet: cleanWallet,
        studentName: student.fullName,
        studentId: student.studentId,
        email: student.email,
        universityId: student.universityId,
        status: "pending",
      })

      // Notify the registrar
      if (transporter && uni && uni.registrarEmail) {
        try {
          const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
          const issueUrl = `${frontendBase}/issue?studentId=${encodeURIComponent(student.studentId)}`

          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
            to: uni.registrarEmail,
            subject: `🔔 CredAxis — Transcript Request: ${student.fullName}`,
            html: `
              <div style="font-family: monospace; background: #0b0b0f; color: #fff; padding: 25px; border: 1px solid #333; max-width: 600px;">
                <h2 style="color: #eab308; border-bottom: 1px solid #222; padding-bottom: 10px;">PENDING TRANSCRIPT REQUEST</h2>
                <p>Hello Registrar,</p>
                <p>A student has requested their official transcript. Since they do not have an active transcript on-chain, please issue it.</p>
                <div style="background: #111; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px dashed #444;">
                  <p style="margin: 5px 0;"><strong>Student Name:</strong> ${student.fullName}</p>
                  <p style="margin: 5px 0;"><strong>Student ID:</strong> ${student.studentId}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${student.email}</p>
                  <p style="margin: 5px 0; font-size: 11px;"><strong>Wallet:</strong> ${student.walletAddress}</p>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${issueUrl}" style="background-color: #eab308; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">ISSUE TRANSCRIPT NOW</a>
                </div>
                <p style="font-size: 10px; color: #666; border-top: 1px solid #222; padding-top: 15px; margin-top: 20px;">
                  This is a secure institutional notification from the CredAxis on-chain protocol.
                </p>
              </div>
            `
          })
          console.log(`[REQUEST API] Notified registrar ${uni.registrarEmail} for student request`)
        } catch (emailErr: any) {
          console.error(`[REQUEST API] Failed to notify registrar ${uni.registrarEmail}:`, emailErr.message)
        }
      }
    }

    return c.json({ status: "requested", message: "Transcript request submitted to your university registrar." })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get pending transcript requests for a registrar
app.get("/api/registrar/requests/:registrarAddress", async (c) => {
  try {
    const registrarAddress = c.req.param("registrarAddress").toLowerCase()
    const unis = await db.select().from(universities).where(eq(universities.registrar, registrarAddress))
    if (!unis || unis.length === 0) {
      return c.json([])
    }
    const uniIds = unis.map(u => u.universityId)
    const list = await db.select().from(transcriptRequests)
      .where(and(
        inArray(transcriptRequests.universityId, uniIds),
        eq(transcriptRequests.status, "pending")
      ))
      .orderBy(sql`${transcriptRequests.createdAt} DESC`)
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Complete a student transcript request
app.put("/api/registrar/requests/:requestId/complete", async (c) => {
  try {
    const requestId = parseInt(c.req.param("requestId"))
    const result = await db.update(transcriptRequests)
      .set({ status: "completed" })
      .where(eq(transcriptRequests.id, requestId))
      .returning()
    return c.json({ success: true, request: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 1. Register a new institution
app.post("/api/institutions/register", async (c) => {
  try {
    const { name, email, walletAddress } = await c.req.json()
    if (!name || !email || !walletAddress) {
      return c.json({ error: "Missing required fields name, email, or walletAddress" }, 400)
    }
    const cleanWallet = walletAddress.toLowerCase()
    const cleanEmail = email.toLowerCase()

    // Check if already registered
    const existing = await db.query.institutions.findFirst({
      where: and(
        sql`LOWER(${institutions.walletAddress}) = ${cleanWallet} OR LOWER(${institutions.email}) = ${cleanEmail}`
      )
    })
    if (existing) {
      return c.json({ error: "Institution with this email or wallet address is already registered." }, 400)
    }

    const result = await db.insert(institutions).values({
      name,
      email: cleanEmail,
      walletAddress: cleanWallet,
      status: "pending"
    }).returning()

    return c.json({ success: true, institution: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 2. Resolve institution profile by wallet
app.get("/api/institutions/profile/:wallet", async (c) => {
  try {
    const wallet = c.req.param("wallet").toLowerCase()
    const result = await db.query.institutions.findFirst({
      where: eq(institutions.walletAddress, wallet)
    })
    if (!result) {
      return c.json({ status: "not_registered" })
    }
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 3. Get pending whitelisting requests
app.get("/api/institutions/pending", async (c) => {
  try {
    const result = await db.select().from(institutions).where(eq(institutions.status, "pending"))
    return c.json(result)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 4. Approve whitelist request
app.put("/api/institutions/:id/approve", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const { actionBy } = await c.req.json()
    const result = await db.update(institutions)
      .set({
        status: "approved",
        actionAt: new Date(),
        actionBy: actionBy || "system"
      })
      .where(eq(institutions.id, id))
      .returning()
    return c.json({ success: true, institution: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Reject whitelist request
app.put("/api/institutions/:id/reject", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const { actionBy } = await c.req.json()
    const result = await db.update(institutions)
      .set({
        status: "rejected",
        actionAt: new Date(),
        actionBy: actionBy || "system"
      })
      .where(eq(institutions.id, id))
      .returning()
    return c.json({ success: true, institution: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 5. Institution requests a student transcript (creates entry + sends email)
app.post("/api/institutions/requests", async (c) => {
  try {
    const { institutionId, studentName, studentId, studentEmail } = await c.req.json()
    if (!institutionId || !studentName || !studentId || !studentEmail) {
      return c.json({ error: "Missing required fields" }, 400)
    }

    const inst = await db.query.institutions.findFirst({
      where: eq(institutions.id, institutionId)
    })
    if (!inst || inst.status !== "approved") {
      return c.json({ error: "Unauthorized or unapproved institution" }, 403)
    }

    const result = await db.insert(institutionRequests).values({
      institutionId,
      studentName,
      studentId,
      studentEmail: studentEmail.toLowerCase(),
      status: "pending"
    }).returning()

    // Send email to student
    if (transporter) {
      try {
        const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
        const consentUrl = `${frontendBase}/transcripts`

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
          to: studentEmail,
          subject: `🔒 CredAxis — Transcript Access Request from ${inst.name}`,
          html: `
            <div style="font-family: monospace; background: #0b0b0f; color: #fff; padding: 25px; border: 1px solid #333; max-width: 600px;">
              <h2 style="color: #6c5bf0; border-bottom: 1px solid #222; padding-bottom: 10px;">ACCESS REQUEST</h2>
              <p>Hello <strong>${studentName}</strong>,</p>
              <p><strong>${inst.name}</strong> is requesting access to view your verified official transcript and academic credentials on the CredAxis platform.</p>
              <div style="background: #111; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px dashed #444;">
                <p style="margin: 5px 0;"><strong>Requesting Org:</strong> ${inst.name}</p>
                <p style="margin: 5px 0;"><strong>Student Name:</strong> ${studentName}</p>
                <p style="margin: 5px 0;"><strong>Student ID:</strong> ${studentId}</p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${consentUrl}" style="background-color: #6c5bf0; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">MANAGE ACCESS PERMISSIONS</a>
              </div>
              <p style="font-size: 10px; color: #666; border-top: 1px solid #222; padding-top: 15px; margin-top: 20px;">
                You can approve or deny this request securely from your student dashboard.
              </p>
            </div>
          `
        })
        console.log(`[INST REQUEST] Sent release consent email to student ${studentEmail}`)
      } catch (emailErr: any) {
        console.error(`[INST REQUEST] Failed to send release consent email to student ${studentEmail}:`, emailErr.message)
      }
    }

    return c.json({ success: true, request: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 6. Get requests made by an institution
app.get("/api/institutions/requests/:wallet", async (c) => {
  try {
    const wallet = c.req.param("wallet").toLowerCase()
    const inst = await db.query.institutions.findFirst({
      where: eq(institutions.walletAddress, wallet)
    })
    if (!inst) {
      return c.json([])
    }
    const list = await db.select().from(institutionRequests)
      .where(eq(institutionRequests.institutionId, inst.id))
      .orderBy(sql`${institutionRequests.createdAt} DESC`)
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 7. Get requests for a student
app.get("/api/student/institution-requests/:email", async (c) => {
  try {
    const email = c.req.param("email").toLowerCase()
    const list = await db.select({
      id: institutionRequests.id,
      studentName: institutionRequests.studentName,
      studentId: institutionRequests.studentId,
      studentEmail: institutionRequests.studentEmail,
      status: institutionRequests.status,
      recordId: institutionRequests.recordId,
      createdAt: institutionRequests.createdAt,
      institutionName: institutions.name,
      institutionEmail: institutions.email
    })
      .from(institutionRequests)
      .innerJoin(institutions, eq(institutionRequests.institutionId, institutions.id))
      .where(eq(institutionRequests.studentEmail, email))
      .orderBy(sql`${institutionRequests.createdAt} DESC`)
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 8. Approve student consent request
app.put("/api/student/institution-requests/:id/approve", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const { recordId } = await c.req.json()
    if (!recordId) {
      return c.json({ error: "Missing required recordId" }, 400)
    }
    const result = await db.update(institutionRequests)
      .set({
        status: "approved",
        recordId,
        actionAt: new Date()
      })
      .where(eq(institutionRequests.id, id))
      .returning()
    return c.json({ success: true, request: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 9. Reject student consent request
app.put("/api/student/institution-requests/:id/reject", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const result = await db.update(institutionRequests)
      .set({
        status: "rejected",
        actionAt: new Date()
      })
      .where(eq(institutionRequests.id, id))
      .returning()
    return c.json({ success: true, request: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// 10. Update institution profile (wallet & email updates)
app.put("/api/institutions/update-profile", async (c) => {
  try {
    const { oldWallet, name, email, walletAddress } = await c.req.json()
    if (!oldWallet || !name || !email || !walletAddress) {
      return c.json({ error: "Missing fields" }, 400)
    }
    const cleanOldWallet = oldWallet.toLowerCase()
    const cleanNewWallet = walletAddress.toLowerCase()
    const cleanEmail = email.toLowerCase()

    const inst = await db.query.institutions.findFirst({
      where: eq(institutions.walletAddress, cleanOldWallet)
    })
    if (!inst) {
      return c.json({ error: "Institution profile not found" }, 404)
    }

    // Check if new email or new wallet is taken by another record
    if (cleanNewWallet !== cleanOldWallet) {
      const dupWallet = await db.query.institutions.findFirst({
        where: eq(institutions.walletAddress, cleanNewWallet)
      })
      if (dupWallet) {
        return c.json({ error: "New wallet address is already registered by another institution." }, 400)
      }
    }
    if (cleanEmail !== inst.email) {
      const dupEmail = await db.query.institutions.findFirst({
        where: eq(institutions.email, cleanEmail)
      })
      if (dupEmail) {
        return c.json({ error: "New email is already registered by another institution." }, 400)
      }
    }

    const result = await db.update(institutions)
      .set({
        name,
        email: cleanEmail,
        walletAddress: cleanNewWallet,
        actionAt: new Date()
      })
      .where(eq(institutions.id, inst.id))
      .returning()

    return c.json({ success: true, institution: result[0] })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Access Hub
app.get("/api/access/by-student/:studentHash", async (c) => {
  try {
    const studentHash = c.req.param("studentHash").toLowerCase()
    const list = await db.select().from(accessGrants).where(eq(accessGrants.student, studentHash))
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.get("/api/access/:recordId/:verifier", async (c) => {
  try {
    const recordId = c.req.param("recordId")
    const verifier = c.req.param("verifier").toLowerCase()
    const grant = await db.query.accessGrants.findFirst({
      where: and(
        eq(accessGrants.recordId, recordId),
        eq(accessGrants.verifier, verifier),
        eq(accessGrants.isActive, true)
      )
    })
    return c.json({ hasAccess: !!grant })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── IPFS Upload via Pinata ───
app.post("/api/ipfs/upload", verifyAuth, async (c) => {
  try {
    const body = await c.req.json()

    const pinataJWT = process.env.PINATA_JWT
    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecretKey = process.env.PINATA_SECRET_KEY

    if (!pinataJWT && !(pinataApiKey && pinataSecretKey)) {
      return c.json({ error: "Pinata credentials not configured on server" }, 503)
    }

    // Build the structured metadata JSON — max 10 keyvalues for Pinata
    const metadataPayload = {
      name: `CredAxis Transcript — ${body.studentName || "Student"} @ ${body.universityName || "University"}`,
      keyvalues: {
        studentAddr: (body.studentAddress || "").slice(0, 20),
        studentName: body.studentName || "",
        university: body.universityName || "",
        registry: (body.registryAddress || "").slice(0, 20),
        gpa: body.gpa || "",
        major: body.major || "",
        gradYear: body.gradYear || "",
        fileHash: (body.fileHash || "").slice(0, 20),
        platform: "CredAxis",
      },
    }

    const logoUrl = body.logoUrl || "https://credaxis.vercel.app/icon.svg"
    const frontendUrl = process.env.FRONTEND_URL || "https://credaxis.app"
    const verifyUrl = `${frontendUrl}/verify/${body.fileHash || ""}`

    const pinataBody = {
      pinataContent: {
        ...body,
        name: `CredAxis Academic Transcript — ${body.studentName || "Student"}`,
        description: `Official academic transcript for ${body.studentName || "Student"} issued by ${body.universityName || "University"}. Secured and verified on-chain via CredAxis.`,
        image: logoUrl,
        external_url: verifyUrl,
        attributes: [
          { trait_type: "Student Name", value: body.studentName || "Unknown" },
          { trait_type: "Student ID", value: body.studentId || "Unknown" },
          { trait_type: "University", value: body.universityName || "Unknown" },
          { trait_type: "Major", value: body.major || "Unknown" },
          { trait_type: "GPA", value: parseFloat(body.gpa) || 0, display_type: "number" },
          { trait_type: "Graduation Year", value: parseInt(body.gradYear) || 2026 },
          { trait_type: "Issued Date", value: new Date().toLocaleDateString() }
        ],
        issuedAt: new Date().toISOString().split('T')[0],
        platform: "CredAxis",
      },
      pinataMetadata: metadataPayload,
      pinataOptions: { cidVersion: 1 },
    }

    // Call Pinata pinJSONToIPFS REST API
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (pinataJWT) {
      headers["Authorization"] = `Bearer ${pinataJWT}`
    } else {
      headers["pinata_api_key"] = pinataApiKey!
      headers["pinata_secret_api_key"] = pinataSecretKey!
    }

    const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers,
      body: JSON.stringify(pinataBody),
    })

    if (!pinataRes.ok) {
      const errText = await pinataRes.text()
      console.error("Pinata API error:", errText)
      return c.json({ error: `Pinata upload failed: ${pinataRes.status} ${errText}` }, 502)
    }

    const pinataData = await pinataRes.json() as { IpfsHash: string; PinSize: number; Timestamp: string }
    const cid = pinataData.IpfsHash
    const fileHash = body.fileHash || ("0x" + Math.random().toString(16).slice(2, 66))

    // Save upload record in DB
    await db.insert(ipfsUploads).values({
      cid,
      fileHash,
      studentHash: body.studentAddress || "0x",
      universityName: body.universityName || "Unknown",
      uploadedAt: new Date(),
      metadataJson: pinataBody.pinataContent,
      recordId: body.tempRecordId || null,
    })

    console.log(`✅ Pinata upload success: CID=${cid}`)

    return c.json({
      cid,
      fileHash,
      gateway: `https://gateway.pinata.cloud/ipfs/${cid}`,
      ipfsUrl: `ipfs://${cid}`,
      metadataJson: pinataBody.pinataContent,
    })
  } catch (err: any) {
    console.error("IPFS upload error:", err)
    return c.json({ error: err.message }, 500)
  }
})

// Get IPFS upload metadata by CID
app.get("/api/ipfs/metadata/:cid", async (c) => {
  try {
    const cid = c.req.param("cid")
    const record = await db.query.ipfsUploads.findFirst({
      where: eq(ipfsUploads.cid, cid)
    })
    if (!record) return c.json({ error: "Metadata record not found" }, 404)
    return c.json(record)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── STUDENT LIFECYCLE ENDPOINTS ───

// Student applies for onboarding or matches with whitelist
app.post("/api/students", async (c) => {
  try {
    const { walletAddress, fullName, studentId, universityId, email, department, faculty } = await c.req.json()
    if (!walletAddress || !fullName || !studentId || (universityId === undefined || universityId === null || universityId === "") || !email) {
      return c.json({ error: "Missing required fields" }, 400)
    }

    const cleanWallet = walletAddress.toLowerCase()
    const cleanEmail = email.toLowerCase()

    // Check if student with this wallet already exists
    const existingWallet = await db.query.students.findFirst({
      where: eq(students.walletAddress, cleanWallet)
    })
    if (existingWallet) {
      return c.json({ error: "Wallet address already registered" }, 400)
    }

    // Check if there is an approved registrar whitelist record matching email or studentId (and has no wallet yet)
    const whitelisted = await db.query.students.findFirst({
      where: and(
        eq(students.universityId, universityId),
        sql`(${students.email} = ${cleanEmail} OR ${students.studentId} = ${studentId})`,
        sql`${students.walletAddress} IS NULL`
      )
    })

    if (whitelisted) {
      // Automatically merge and mark as approved
      await db.update(students)
        .set({
          walletAddress: cleanWallet,
          fullName, // update with real name
          studentId, // update with real student ID
          department,
          faculty,
          status: "approved",
          updatedAt: new Date(),
          actionAt: new Date(),
        })
        .where(eq(students.id, whitelisted.id))

      return c.json({ status: "approved", message: "Onboarding completed. Profile automatically approved via registrar whitelist." })
    }

    const approvalToken = "st_app_" + Math.random().toString(36).slice(2) + Date.now().toString(36)

    // Otherwise, create a pending application
    await db.insert(students).values({
      walletAddress: cleanWallet,
      fullName,
      studentId,
      universityId,
      email: cleanEmail,
      department,
      faculty,
      status: "pending",
      approvalToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Send an email notification to the Admin/Registrar
    console.log(`[EMAIL NOTIFICATION] Preparing to send email for new student ${fullName}`);
    if (transporter) {
      try {
        const uni = await db.query.universities.findFirst({
          where: eq(universities.universityId, universityId)
        });

        const adminEmail = process.env.SMTP_USER || process.env.GMAIL_USER || "";
        const recipient = uni?.registrarEmail || adminEmail;

        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const approveUrl = `${apiBase}/api/students/approve-via-token?token=${approvalToken}`;
        const rejectUrl = `${apiBase}/api/students/reject-via-token?token=${approvalToken}`;

        const messageHtml = `
          <p>Hello,</p>
          <p>A new student has submitted a profile verification request for your institution.</p>
          <div class="details-box">
            <p><span class="label">Name:</span> <strong>${fullName}</strong></p>
            <p><span class="label">Student ID:</span> <strong>${studentId}</strong></p>
            <p><span class="label">Email:</span> <strong><a href="mailto:${cleanEmail}" style="color: #3b82f6; text-decoration: none;">${cleanEmail}</a></strong></p>
            <p><span class="label">University:</span> <strong>${uni ? uni.name : "N/A"}</strong></p>
          </div>
          <p>Please review and accept or reject this application instantly using the buttons below, or log into the institutional portal.</p>
          <div class="button-container" style="display: flex; justify-content: center; gap: 20px;">
            <a href="${approveUrl}" class="button" style="background-color: #10b981; margin-right: 15px; color: #fff;">APPROVE APPLICATION</a>
            <a href="${rejectUrl}" class="button" style="background-color: #ef4444; color: #fff;">REJECT APPLICATION</a>
          </div>
        `;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || adminEmail,
          to: recipient,
          replyTo: cleanEmail,
          subject: `New Student Verification Request - ${fullName}`,
          text: `A new student (${fullName}, ID: ${studentId}, Email: ${cleanEmail}) has submitted a profile verification request.\n\nPlease review and accept or reject the application in the admin portal.`,
          html: generateEmailTemplate("New Student Verification Request", messageHtml)
        });
        console.log(`[EMAIL] Notification sent successfully to ${recipient}.`);
      } catch (err) {
        console.error(`[EMAIL] Failed to send notification:`, err);
      }
    } else {
      console.log(`[EMAIL] Transporter not configured. Skipping email.`);
    }

    return c.json({ status: "pending", message: "Application submitted. Awaiting registrar approval." })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── EMAIL ONE-CLICK APPROVAL ENDPOINTS ───

app.get("/api/students/approve-via-token", async (c) => {
  try {
    const token = c.req.query("token")
    if (!token) return c.html("<h3>Error: Missing token</h3>", 400)

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.approvalToken, token)
    })

    if (!studentRecord) return c.html("<h3>Error: Invalid or expired token</h3>", 404)

    if (studentRecord.status !== "pending") {
      return c.html("<h3>This application has already been processed.</h3>", 400)
    }

    await db.update(students)
      .set({
        status: "approved",
        actionAt: new Date()
      })
      .where(eq(students.id, studentRecord.id))

    // Send approval email to student
    if (transporter) {
      const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
      const loginUrl = `${frontendBase}/dashboard`

      const messageHtml = `
        <h2 style="color: #10b981; margin-top: 0;">APPLICATION APPROVED</h2>
        <p>Dear <strong>${studentRecord.fullName}</strong>,</p>
        <p>Your student registration has been successfully approved by the university registrar.</p>
        <p>You may now log into your dashboard to manage your digital identity and request official transcripts.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${loginUrl}" class="button" style="background-color: #10b981; color: #fff;">ACCESS DASHBOARD</a>
        </div>
      `
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
        to: studentRecord.email,
        subject: "✓ Student Profile Approved — CredAxis",
        html: generateEmailTemplate("Application Approved", messageHtml)
      })
    }

    const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
    return c.redirect(`${frontendBase}/admin?status=student_approved`)
  } catch (err: any) {
    return c.html(`<h3>Error: ${err.message}</h3>`, 500)
  }
})

app.get("/api/students/reject-via-token", async (c) => {
  try {
    const token = c.req.query("token")
    if (!token) return c.html("<h3>Error: Missing token</h3>", 400)

    const studentRecord = await db.query.students.findFirst({
      where: eq(students.approvalToken, token)
    })

    if (!studentRecord) return c.html("<h3>Error: Invalid or expired token</h3>", 404)

    if (studentRecord.status !== "pending") {
      return c.html("<h3>This application has already been processed.</h3>", 400)
    }

    await db.update(students)
      .set({
        status: "rejected",
        actionAt: new Date()
      })
      .where(eq(students.id, studentRecord.id))

    // Send rejection email to student
    if (transporter) {
      const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
      const messageHtml = `
        <h2 style="color: #ef4444; margin-top: 0;">APPLICATION REJECTED</h2>
        <p>Dear <strong>${studentRecord.fullName}</strong>,</p>
        <p>Your student registration request has been <strong>rejected</strong> by the university registrar.</p>
        <p>This typically occurs if your provided details (Name, Student ID, or Email) do not match the official institutional records.</p>
        <p>Please review your details and contact your university's administration office if you believe this is an error.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${frontendBase}/dashboard" class="button" style="background-color: #ef4444; color: #fff;">RETURN TO DASHBOARD</a>
        </div>
      `
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
        to: studentRecord.email,
        subject: "✕ Student Profile Rejected — CredAxis",
        html: generateEmailTemplate("Application Rejected", messageHtml)
      })
    }

    const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
    return c.redirect(`${frontendBase}/admin?status=student_rejected`)
  } catch (err: any) {
    return c.html(`<h3>Error: ${err.message}</h3>`, 500)
  }
})

// Get student profile
app.get("/api/students/profile/:walletAddress", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress").toLowerCase()
    const profile = await db.query.students.findFirst({
      where: eq(students.walletAddress, walletAddress)
    })
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404)
    }
    return c.json(profile)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get student profile by email (used for Privy email-auth embedded wallet auto-bind flow)
app.get("/api/students/profile/by-email/:email", async (c) => {
  try {
    const email = c.req.param("email").toLowerCase()
    const profile = await db.query.students.findFirst({
      where: eq(students.email, email),
      orderBy: (students, { asc }) => [
        // Prefer records without a wallet (unbound whitelist entries)
        sql`CASE WHEN ${students.walletAddress} IS NULL THEN 0 ELSE 1 END`,
        asc(students.id)
      ]
    })
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404)
    }
    return c.json(profile)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Self-bind wallet — student binds their own embedded wallet to a whitelisted record that has no wallet yet.
// Only allowed when the current walletAddress on the record is NULL (prevents overwriting existing bindings).
app.put("/api/students/:id/self-bind-wallet", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const { walletAddress, email } = await c.req.json()

    if (!walletAddress || !email) {
      return c.json({ error: "Missing required fields: walletAddress and email" }, 400)
    }

    const cleanWallet = walletAddress.toLowerCase()
    const cleanEmail = email.toLowerCase()

    // Verify the record exists and belongs to this email
    const record = await db.query.students.findFirst({
      where: and(eq(students.id, id), eq(students.email, cleanEmail))
    })

    if (!record) {
      return c.json({ error: "Student record not found or email mismatch" }, 404)
    }

    // Guard: only bind if walletAddress is currently null
    if (record.walletAddress !== null) {
      return c.json({ error: "A wallet is already bound to this student profile" }, 409)
    }

    // Ensure the wallet isn't already used by another student
    const existingWallet = await db.query.students.findFirst({
      where: eq(students.walletAddress, cleanWallet)
    })
    if (existingWallet) {
      return c.json({ error: "Wallet address is already registered to another profile" }, 400)
    }

    await db.update(students)
      .set({
        walletAddress: cleanWallet,
        updatedAt: new Date(),
      })
      .where(eq(students.id, id))

    await logAudit("student", cleanWallet, "AUTO_WALLET_BOUND", `Privy embedded wallet auto-bound to student ID ${id} (email: ${cleanEmail})`)

    return c.json({ success: true, message: "Wallet successfully auto-bound to your student profile." })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})


// Get student profile by ID, Name, Email, or Wallet Address (Case-insensitive)
app.get("/api/students/profile-by-id/:studentId", async (c) => {
  try {
    const studentId = c.req.param("studentId").trim().toLowerCase()
    const profile = await db.query.students.findFirst({
      where: sql`LOWER(${students.studentId}) = ${studentId} 
                 OR LOWER(${students.email}) = ${studentId} 
                 OR LOWER(${students.walletAddress}) = ${studentId}
                 OR LOWER(${students.fullName}) = ${studentId}`,
      orderBy: (students, { desc }) => [
        sql`CASE WHEN ${students.status} = 'approved' THEN 1 WHEN ${students.status} = 'pending' THEN 2 ELSE 3 END ASC`,
        desc(students.id)
      ]
    })
    if (!profile) {
      return c.json({ error: "Profile not found" }, 404)
    }
    return c.json(profile)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Search for students by any matching query parameter (Name, Email, ID, Wallet)
app.get("/api/students/search", async (c) => {
  try {
    const q = c.req.query("q")?.trim().toLowerCase()
    if (!q) {
      return c.json([])
    }
    const cleanQ = `%${q}%`
    const list = await db.select().from(students)
      .where(sql`LOWER(${students.fullName}) LIKE ${cleanQ} 
                 OR LOWER(${students.email}) LIKE ${cleanQ} 
                 OR LOWER(${students.studentId}) LIKE ${cleanQ} 
                 OR LOWER(${students.walletAddress}) LIKE ${cleanQ}`)
      .orderBy(
        sql`CASE WHEN ${students.status} = 'approved' THEN 1 WHEN ${students.status} = 'pending' THEN 2 ELSE 3 END ASC`,
        sql`${students.id} DESC`
      )
    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── REGISTRAR DASHBOARD ENDPOINTS ───

// Get all students under a registrar's university
app.get("/api/registrar/students/:registrarAddress", async (c) => {
  try {
    const registrarAddress = c.req.param("registrarAddress").toLowerCase()

    // A registrar may be assigned to multiple universities (e.g. from script redeployments)
    const unis = await db.select().from(universities).where(eq(universities.registrar, registrarAddress))

    if (!unis || unis.length === 0) {
      return c.json({ error: "Registrar not registered with any university" }, 404)
    }

    const uniIds = unis.map(u => u.universityId)

    const list = await db.select().from(students)
      .where(inArray(students.universityId, uniIds))

    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Registrar binds a wallet address to a whitelisted student
app.put("/api/students/:id/bind-wallet", async (c) => {
  try {
    const studentIdStr = c.req.param("id")
    const { walletAddress, registrarAddress } = await c.req.json()
    if (!walletAddress || !registrarAddress) {
      return c.json({ error: "Missing required fields" }, 400)
    }

    const uni = await db.query.universities.findFirst({
      where: eq(universities.registrar, registrarAddress.toLowerCase())
    })
    if (!uni) {
      return c.json({ error: "Registrar university not found" }, 403)
    }

    const existingWallet = await db.query.students.findFirst({
      where: eq(students.walletAddress, walletAddress.toLowerCase())
    })
    if (existingWallet) {
      return c.json({ error: "Wallet address already bound to a student" }, 400)
    }

    await db.update(students)
      .set({
        walletAddress: walletAddress.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(and(
        eq(students.id, parseInt(studentIdStr)),
        eq(students.universityId, uni.universityId)
      ))

    return c.json({ success: true, message: "Wallet successfully bound to student profile." })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

app.put("/api/students/:id", async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const { fullName, email, walletAddress } = await c.req.json()

    const updateData: any = {}
    if (fullName) updateData.fullName = fullName
    if (email) updateData.email = email.toLowerCase()

    if (walletAddress !== undefined) {
      const cleanWallet = walletAddress ? walletAddress.toLowerCase() : null
      if (cleanWallet) {
        // Check uniqueness excluding current student
        const existing = await db.query.students.findFirst({
          where: and(
            eq(students.walletAddress, cleanWallet),
            sql`id != ${id}`
          )
        })
        if (existing) {
          return c.json({ error: "Wallet address is already registered to another profile" }, 400)
        }
      }
      updateData.walletAddress = cleanWallet
    }

    updateData.updatedAt = new Date()

    const result = await db.update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning()

    await logAudit("registrar", "system", "EDITED_STUDENT_DETAILS", `Updated student ID ${id} details: Name: ${fullName}, Email: ${email}, Wallet: ${walletAddress}`)
    return c.json(result[0])
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Registrar updates student approval status
app.put("/api/students/:walletAddress/status", async (c) => {
  try {
    const walletAddress = c.req.param("walletAddress").toLowerCase()
    const { status, registrarAddress } = await c.req.json()
    if (!status || !["approved", "rejected"].includes(status)) {
      return c.json({ error: "Invalid status value" }, 400)
    }
    if (!registrarAddress) {
      return c.json({ error: "Missing registrarAddress verification" }, 400)
    }

    const uni = await db.query.universities.findFirst({
      where: eq(universities.registrar, registrarAddress.toLowerCase())
    })
    if (!uni) {
      return c.json({ error: "Registrar university not found" }, 403)
    }

    const student = await db.query.students.findFirst({
      where: eq(students.walletAddress, walletAddress)
    })
    if (!student) {
      return c.json({ error: "Student profile not found" }, 404)
    }

    if (student.universityId !== uni.universityId) {
      return c.json({ error: "Unauthorized: student is registered to another university" }, 403)
    }

    await db.update(students)
      .set({
        status,
        actionAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(students.walletAddress, walletAddress))

    return c.json({ status, message: `Student status updated to ${status}` })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Registrar CSV bulk upload / whitelist
app.post("/api/students/bulk", async (c) => {
  try {
    const { registrarAddress, studentsList } = await c.req.json()
    if (!registrarAddress || !studentsList || !Array.isArray(studentsList)) {
      return c.json({ error: "Missing required fields" }, 400)
    }

    const uni = await db.query.universities.findFirst({
      where: eq(universities.registrar, registrarAddress.toLowerCase())
    })
    if (!uni) {
      return c.json({ error: "Registrar university not found" }, 403)
    }

    const results = []
    for (const s of studentsList) {
      const { fullName, studentId, email, department, faculty } = s
      if (!fullName || !studentId || !email) continue

      const cleanEmail = email.toLowerCase()

      // Check if already exists in this university by email or student ID
      const existing = await db.query.students.findFirst({
        where: and(
          eq(students.universityId, uni.universityId),
          sql`(${students.email} = ${cleanEmail} OR ${students.studentId} = ${studentId})`
        )
      })

      if (existing) {
        if (!existing.walletAddress) {
          // If no wallet is bound yet, update details and mark as approved
          await db.update(students)
            .set({
              fullName,
              studentId,
              department,
              faculty,
              status: "approved",
              updatedAt: new Date(),
            })
            .where(eq(students.id, existing.id))
          results.push({ email: cleanEmail, status: "updated_whitelist" })
        } else {
          results.push({ email: cleanEmail, status: "already_registered" })
        }
      } else {
        // Create a pre-approved whitelist record
        await db.insert(students).values({
          fullName,
          studentId,
          email: cleanEmail,
          department,
          faculty,
          universityId: uni.universityId,
          status: "approved",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        results.push({ email: cleanEmail, status: "whitelisted" })
      }
    }

    return c.json({ success: true, processed: results.length, details: results })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── ADMIN SYSTEM LOGS ENDPOINT ───

app.get("/api/logs", async (c) => {
  try {
    const unis = await db.select().from(universities).orderBy(sql`deployed_at DESC`).limit(20)
    const txs = await db.select().from(transcripts).orderBy(sql`issued_at DESC`).limit(20)
    const history = await db.select().from(transcriptStatusHistory).orderBy(sql`changed_at DESC`).limit(20)

    const logs = [
      ...unis.map(u => ({
        type: "university_registered",
        description: `University "${u.name}" registered (ID: ${u.universityId})`,
        operator: u.registrar,
        timestamp: u.deployedAt,
        txHash: u.txHash,
      })),
      ...txs.map(t => ({
        type: "transcript_issued",
        description: `Transcript record ${t.recordId.slice(0, 10)}... issued for student hash ${t.studentHash.slice(0, 10)}...`,
        operator: t.issuer,
        timestamp: t.issuedAt,
        txHash: t.txHash,
      })),
      ...history.map(h => ({
        type: "status_changed",
        description: `Transcript ${h.recordId?.slice(0, 10)}... status updated from ${h.oldStatus} to ${h.newStatus}: ${h.reason || 'No reason specified'}`,
        operator: "Registrar",
        timestamp: h.changedAt,
        txHash: h.txHash,
      }))
    ]

    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return c.json(logs.slice(0, 50))
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── PUBLIC LOOKUP & PRIVACY ACCESS APIs ───

// Public verify API
app.get("/api/public/verify", async (c) => {
  try {
    const recordId = c.req.query("recordId")?.trim()
    const studentId = c.req.query("studentId")?.trim()
    const token = c.req.query("token")?.trim()

    if (!recordId && !studentId) {
      return c.json({ error: "Provide recordId or studentId parameter", code: "MISSING_PARAMS" }, 400)
    }

    let tx: any = null
    let queryByRecordId = false

    if (recordId) {
      queryByRecordId = true
      tx = await db.query.transcripts.findFirst({
        where: sql`LOWER(${transcripts.recordId}) = LOWER(${recordId})`
      })

      if (!tx) {
        // Look up by tempRecordId in ipfsUploads table
        const upload = await db.query.ipfsUploads.findFirst({
          where: sql`LOWER(${ipfsUploads.recordId}) = LOWER(${recordId}) OR LOWER(${ipfsUploads.metadataJson}->>'tempRecordId') = LOWER(${recordId})`
        })
        if (upload) {
          tx = await db.query.transcripts.findFirst({
            where: eq(transcripts.fileHash, upload.fileHash)
          })
        }
      }
    } else if (studentId) {
      const student = await db.query.students.findFirst({
        where: sql`LOWER(${students.studentId}) = ${studentId.toLowerCase()}`
      })
      if (student && student.walletAddress) {
        const studentHashVal = keccak256(encodePacked(["address"], [student.walletAddress as `0x${string}`]))
        tx = await db.query.transcripts.findFirst({
          where: eq(transcripts.studentHash, studentHashVal),
          orderBy: (transcripts, { desc }) => [desc(transcripts.issuedAt)]
        })
      }
    }

    if (!tx) {
      return c.json({ error: "Transcript record not found in the registry.", code: "NOT_FOUND" }, 404)
    }

    // Check Token authorization
    let isAuthorized = false
    let authorizedBy = ""
    let tokenErrorCode = ""

    // Rule: If anyone scans QR code / accesses by recordId, we show full results.
    // Otherwise (searched by student index/ID), it requires student-approved token access.
    if (queryByRecordId) {
      isAuthorized = true
      authorizedBy = "Direct QR Code / Record ID Link"
    } else if (token) {
      // 1. Check if token is in publicAccessRequests and approved
      const pRequest = await db.query.publicAccessRequests.findFirst({
        where: and(
          eq(publicAccessRequests.recordId, tx.recordId),
          eq(publicAccessRequests.token, token),
          eq(publicAccessRequests.status, "approved")
        )
      })

      if (pRequest) {
        if (!pRequest.expiresAt || new Date(pRequest.expiresAt).getTime() > Date.now()) {
          isAuthorized = true
          authorizedBy = `Public Approval Request (${pRequest.requesterEmail})`
        } else {
          tokenErrorCode = "EXPIRED_TOKEN"
        }
      } else {
        // 2. Check if token is a valid, active institutional verifier token
        const iToken = await db.query.issuedTokens.findFirst({
          where: and(
            eq(issuedTokens.token, token),
            eq(issuedTokens.isActive, true)
          )
        })

        if (iToken) {
          if (!iToken.expiresAt || new Date(iToken.expiresAt).getTime() > Date.now()) {
            isAuthorized = true
            authorizedBy = `Institutional API Key (${iToken.institutionName})`
          } else {
            tokenErrorCode = "EXPIRED_TOKEN"
          }
        } else {
          tokenErrorCode = "INVALID_TOKEN"
        }
      }
    }

    // Explicitly reject if a token was provided but failed validation
    if (!isAuthorized && token && tokenErrorCode) {
      return c.json({ error: "The provided access token is invalid or expired.", code: tokenErrorCode }, 403)
    }

    // Resolve university details (always public)
    const uni = await db.query.universities.findFirst({
      where: eq(universities.universityId, tx.universityId || 0)
    })

    if (!isAuthorized) {
      // Hide student privacy details, return basic verify state
      return c.json({
        transcript: {
          recordId: tx.recordId,
          registryAddr: tx.registryAddr,
          issuedAt: tx.issuedAt,
          status: tx.status
        },
        university: uni ? {
          name: uni.name,
          logoUrl: uni.logoUrl,
          contractAddr: uni.contractAddr
        } : null,
        requestAccessRequired: true
      })
    }

    // Resolve full student details
    let studentDetails: any = null
    const allStudents = await db.select().from(students)
    for (const s of allStudents) {
      if (s.walletAddress && isAddress(s.walletAddress)) {
        const h = keccak256(encodePacked(["address"], [s.walletAddress as `0x${string}`]))
        if (h === tx.studentHash) {
          studentDetails = {
            fullName: s.fullName,
            studentId: s.studentId,
            email: s.email,
            walletAddress: s.walletAddress
          }
          break
        }
      }
    }

    return c.json({
      transcript: tx,
      student: studentDetails,
      university: uni ? {
        name: uni.name,
        contractAddr: uni.contractAddr,
        logoUrl: uni.logoUrl,
        stampUrl: uni.stampUrl
      } : null,
      authorizedBy
    })

  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Request access API (verifier submits request)
app.post("/api/public/request-access", async (c) => {
  try {
    const { recordId, requesterName, requesterOrg, requesterEmail } = await c.req.json()

    if (!recordId || !requesterName || !requesterOrg || !requesterEmail) {
      return c.json({ error: "Missing required fields" }, 400)
    }

    const tx = await db.query.transcripts.findFirst({
      where: eq(transcripts.recordId, recordId)
    })
    if (!tx) {
      return c.json({ error: "Transcript record not found" }, 404)
    }

    // Find student details
    let studentDetails: any = null
    const allStudents = await db.select().from(students)
    for (const s of allStudents) {
      if (s.walletAddress && isAddress(s.walletAddress)) {
        const h = keccak256(encodePacked(["address"], [s.walletAddress as `0x${string}`]))
        if (h === tx.studentHash) {
          studentDetails = s
          break
        }
      }
    }

    if (!studentDetails) {
      return c.json({ error: "Student profile not found for this transcript" }, 404)
    }

    const token = "req_" + Math.random().toString(36).slice(2) + Date.now().toString(36)

    await db.insert(publicAccessRequests).values({
      recordId,
      requesterName,
      requesterOrg,
      requesterEmail,
      token,
      status: "pending"
    })

    if (transporter) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const approveUrl = `${apiBase}/api/public/access-requests/approve?token=${token}`
      const rejectUrl = `${apiBase}/api/public/access-requests/reject?token=${token}`

      const messageHtml = `
        <h2 style="color: #6c5bf0; padding-bottom: 10px;">TRANSCRIPT ACCESS REQUEST</h2>
        <p>Hello <strong>${studentDetails.fullName}</strong>,</p>
        <p>An external verifier has requested permission to verify your official academic transcript on-chain.</p>
        <div class="details-box">
          <p><span class="label">Requester:</span> <strong>${requesterName}</strong></p>
          <p><span class="label">Organization:</span> <strong>${requesterOrg}</strong></p>
          <p><span class="label">Email:</span> <strong><a href="mailto:${requesterEmail}" style="color: #3b82f6; text-decoration: none;">${requesterEmail}</a></strong></p>
          <p><span class="label">Record Hash:</span> <strong>${recordId}</strong></p>
        </div>
        <p>To protect your privacy, this verifier cannot see your GPA, major, or grades unless you approve.</p>
        <div class="button-container" style="display: flex; justify-content: center; gap: 20px;">
          <a href="${approveUrl}" class="button" style="background-color: #10b981; margin-right: 15px;">APPROVE ACCESS</a>
          <a href="${rejectUrl}" class="button" style="background-color: #ef4444; color: #fff;">REJECT ACCESS</a>
        </div>
        <p style="font-size: 10px; color: #71717a; border-top: 1px solid #27272a; padding-top: 15px; margin-top: 20px;">
          This access request token is unique. Approving gives access for 30 days. You can revoke it anytime.
        </p>
      `;

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
        to: studentDetails.email,
        replyTo: requesterEmail,
        subject: "🔒 CredAxis — Access Request to Verify your Transcript",
        html: generateEmailTemplate("Transcript Access Request", messageHtml)
      })
    }

    return c.json({ success: true, message: "Verification request sent to student email." })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Access approve endpoint (student clicks approve link in email)
app.get("/api/public/access-requests/approve", async (c) => {
  try {
    const token = c.req.query("token")

    if (!token) return c.html("<h3>Error: Missing request token</h3>", 400)

    const request = await db.query.publicAccessRequests.findFirst({
      where: eq(publicAccessRequests.token, token)
    })

    if (!request) return c.html("<h3>Error: Access request not found</h3>", 404)

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await db.update(publicAccessRequests)
      .set({
        status: "approved",
        expiresAt
      })
      .where(eq(publicAccessRequests.token, token))

    const tx = await db.query.transcripts.findFirst({
      where: eq(transcripts.recordId, request.recordId)
    })

    // Email verifier
    if (transporter && tx) {
      const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
      const accessUrl = `${frontendBase}/verify/${request.recordId}?token=${token}&registry=${tx.registryAddr}`

      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
        to: request.requesterEmail,
        subject: "✓ Access Granted — CredAxis Transcript Verification",
        html: generateEmailTemplate("Access Granted", `
          <h2 style="color: #10b981; margin-top: 0;">ACCESS GRANTED</h2>
          <p>Dear <strong>${request.requesterName}</strong>,</p>
          <p>Your request to verify the academic transcript record on-chain has been <strong>approved</strong> by the student.</p>
          <p>You can access the full verified transcript details using the unique link below. This link will be active for 30 days.</p>
          <div class="button-container">
            <a href="${accessUrl}" class="button">VIEW VERIFIED TRANSCRIPT</a>
          </div>
          <div class="details-box" style="margin-top: 30px;">
            <p><span class="label">Record ID:</span> <strong>${request.recordId}</strong></p>
          </div>
        `)
      })
    }

    const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
    return c.redirect(`${frontendBase}/dashboard?status=access_granted`)
  } catch (err: any) {
    return c.html(`<h3>Error: ${err.message}</h3>`, 500)
  }
})

// Access reject endpoint (student clicks reject link in email)
app.get("/api/public/access-requests/reject", async (c) => {
  try {
    const token = c.req.query("token")

    if (!token) return c.html("<h3>Error: Missing request token</h3>", 400)

    await db.update(publicAccessRequests)
      .set({
        status: "rejected"
      })
      .where(eq(publicAccessRequests.token, token))

    const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
    return c.redirect(`${frontendBase}/dashboard?status=access_denied`)
  } catch (err: any) {
    return c.html(`<h3>Error: ${err.message}</h3>`, 500)
  }
})

// ─── VERIFIER INSTITUTIONAL TOKENS APIs (ADMIN/REGISTRAR ONLY) ───

// Issue a long-lived institutional API token
app.post("/api/tokens/issue", verifyAuth, async (c) => {
  try {
    const { institutionName, expiresDays, issuerAddress, role } = await c.req.json()

    if (!institutionName) {
      return c.json({ error: "Institution Name is required" }, 400)
    }

    const token = "ct_" + Math.random().toString(36).slice(2) + Date.now().toString(36)
    const expiresAt = expiresDays ? new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000) : null

    await db.insert(issuedTokens).values({
      token,
      institutionName,
      issuerAddress: issuerAddress || "0x",
      role: role || "registrar",
      expiresAt,
      isActive: true
    })

    await logAudit(role || "registrar", issuerAddress || "0x", "issue_token", `Issued verifier token to ${institutionName}`)

    return c.json({
      success: true,
      token,
      institutionName,
      expiresAt: expiresAt ? expiresAt.toISOString() : null
    })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Get all tokens issued by current user or all tokens if admin
app.get("/api/tokens", verifyAuth, async (c) => {
  try {
    const issuerAddress = c.req.query("issuerAddress")?.toLowerCase()
    const role = c.req.query("role")

    let list
    if (role === "admin") {
      list = await db.select().from(issuedTokens).orderBy(sql`${issuedTokens.createdAt} DESC`)
    } else if (issuerAddress) {
      list = await db.select().from(issuedTokens)
        .where(eq(issuedTokens.issuerAddress, issuerAddress))
        .orderBy(sql`${issuedTokens.createdAt} DESC`)
    } else {
      list = await db.select().from(issuedTokens).orderBy(sql`${issuedTokens.createdAt} DESC`)
    }

    return c.json(list)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Revoke/delete a verifier token
app.delete("/api/tokens/:id", verifyAuth, async (c) => {
  try {
    const id = parseInt(c.req.param("id"))
    const operator = c.req.query("operator") || "0x"

    await db.update(issuedTokens)
      .set({ isActive: false })
      .where(eq(issuedTokens.id, id))

    await logAudit("system", operator, "revoke_token", `Revoked verifier token ID: ${id}`)

    return c.json({ success: true, message: "Token revoked successfully" })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Email verified transcript directly
app.post("/api/public/email-transcript", async (c) => {
  try {
    const { to, recordId, registryAddress, studentName, studentId, gpa, major, gradYear, fileHash, universityName } = await c.req.json()

    if (!to || !recordId || !studentName) {
      return c.json({ error: "Missing required email recipient details" }, 400)
    }

    if (!transporter) {
      return c.json({ error: "Email transporter is not configured on the server." }, 500)
    }

    const frontendBase = process.env.FRONTEND_URL || "https://credaxis.app"
    const verifyUrl = `${frontendBase}/verify/${recordId}?registry=${registryAddress || ''}`

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
      to,
      subject: `📜 CredAxis Verified Transcript — ${studentName}`,
      html: `
        <div style="font-family: monospace; border: 1px solid #333; padding: 25px; max-width: 600px; background-color: #0b0b0f; color: #fff; border-radius: 8px;">
          <h2 style="color: #6c5bf0; border-bottom: 1px solid #222; padding-bottom: 12px; margin-top: 0;">📜 CREDAXIS VERIFICATION RECEIPT</h2>
          <p>An official academic credential transcript has been successfully verified on-chain via the CredAxis protocol.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888; width: 40%;">Institution:</td><td style="padding: 8px; font-weight: bold; color: #fff;">${universityName || 'Accredited University'}</td></tr>
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888;">Student Name:</td><td style="padding: 8px; color: #fff;">${studentName}</td></tr>
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888;">Student ID:</td><td style="padding: 8px; color: #fff;">${studentId}</td></tr>
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888;">Degree Program:</td><td style="padding: 8px; color: #fff;">${major}</td></tr>
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888;">Cumulative GPA:</td><td style="padding: 8px; font-weight: bold; color: #10b981;">${gpa ? parseFloat(gpa).toFixed(2) : '0.00'} / 4.00</td></tr>
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888;">Graduation Year:</td><td style="padding: 8px; color: #fff;">${gradYear}</td></tr>
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888;">Transcript Record Hash:</td><td style="padding: 8px; font-size: 11px; word-break: break-all; color: #6c5bf0;">${recordId}</td></tr>
            <tr style="border-bottom: 1px solid #222;"><td style="padding: 8px; color: #888;">PDF SHA-256 Checksum:</td><td style="padding: 8px; font-size: 11px; word-break: break-all; color: #a3e635;">${fileHash}</td></tr>
          </table>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${verifyUrl}" style="background-color: #6c5bf0; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Authenticity On-Chain</a>
          </div>
          <p style="font-size: 10px; color: #666; border-top: 1px solid #222; padding-top: 15px; margin-top: 30px;">
            This verification audit receipt is cryptographically tied to the transaction logs of the university registry contract.
          </p>
        </div>
      `
    })

    return c.json({ success: true, message: "Verified transcript details emailed successfully!" })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// ─── TEST EMAIL ENDPOINT ───
app.post("/api/test-email", async (c) => {
  try {
    const { to } = await c.req.json()
    if (!transporter) {
      return c.json({ error: "Email transporter is not configured on the server." }, 500)
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
      to: to || process.env.SMTP_USER || process.env.GMAIL_USER,
      subject: "Test Email from CredAxis System",
      text: "If you are reading this, the email configuration is fully working and perfectly aligned with the architecture!",
    });

    return c.json({ success: true, message: "Test email sent successfully", messageId: info.messageId })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// Start server and launch micro-indexer listener
const port = 3001
serve({
  fetch: app.fetch,
  port,
})
console.log(`CredAxis Database-Backed API Server running on http://localhost:${port}`)

// Launch real-time background blockchain listener
startIndexer().catch((err: any) => {
  console.error("Failed to start indexing agent service on start:", err)
})
