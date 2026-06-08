import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./db/connection.js";
import { universities, transcripts, accessGrants, ipfsUploads, students, transcriptStatusHistory, verifications, systemAuditLogs, registrarEmails, governanceRequests } from "./db/schema.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq, and, sql, inArray } from "drizzle-orm";
import { startIndexer } from "./indexer/sync.js";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = new Hono();
// Set up Nodemailer transport
let transporter = null;
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
}
else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const gmailPass = process.env.GMAIL_APP_PASSWORD.replace(/\s/g, "");
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: gmailPass,
        },
    });
    console.log(`[EMAIL] Nodemailer initialized with ${process.env.GMAIL_USER}`);
}
else {
    console.log(`[EMAIL] Nodemailer not initialized. Missing SMTP or GMAIL configuration in .env`);
}
// ─── Global BigInt JSON patch ───
// Drizzle ORM returns bigint for block_number columns. Native JSON.stringify
// throws on BigInt, so we patch it globally once at startup.
;
BigInt.prototype.toJSON = function () {
    return this.toString();
};
app.use("/*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
}));
const PRIVY_APP_ID = process.env.PRIVY_APP_ID || process.env.NEXT_PUBLIC_PRIVY_APP_ID;
let jwks = null;
if (PRIVY_APP_ID && PRIVY_APP_ID !== "your_privy_app_id_here" && !PRIVY_APP_ID.includes("placeholder")) {
    jwks = createRemoteJWKSet(new URL(`https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/.well-known/jwks.json`));
    console.log(`[AUTH] Privy JWKS initialized for App ID: ${PRIVY_APP_ID}`);
}
else {
    console.warn("⚠️ [AUTH] PRIVY_APP_ID is not configured. Backend verification will bypass signature check for demo/dev mode.");
}
// Auth Middleware (verifies Privy JWTs)
const verifyAuth = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.split(" ")[1];
    if (jwks) {
        try {
            const { payload } = await jwtVerify(token, jwks, {
                issuer: "privy.io",
                audience: PRIVY_APP_ID,
            });
            c.set("user", payload);
        }
        catch (err) {
            console.error("Privy JWT verify failed:", err);
            return c.json({ error: "Invalid or expired Privy JWT token" }, 401);
        }
    }
    else {
        // Development fallback
        if (!token || token.split(".").length !== 3) {
            if (token === "demo_token" || token === "credaxis-registrar") {
                c.set("user", { sub: "did:privy:demo" });
            }
            else {
                return c.json({ error: "Unauthorized: Invalid token format" }, 401);
            }
        }
        else {
            try {
                const parts = token.split(".");
                const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
                c.set("user", payload);
            }
            catch (e) {
                c.set("user", { sub: "did:privy:demo" });
            }
        }
    }
    await next();
};
// ─── API Routes ───
// Helper: Add Audit Log
async function logAudit(actorType, actorAddress, action, details) {
    try {
        await db.insert(systemAuditLogs).values({
            actorType,
            actorAddress,
            action,
            details,
        });
    }
    catch (err) {
        console.error("Failed to write audit log:", err);
    }
}
// Audit Logs Endpoint
app.get("/api/audit-logs", async (c) => {
    try {
        const actorAddress = c.req.query("actorAddress");
        if (actorAddress) {
            const logs = await db.select().from(systemAuditLogs)
                .where(eq(systemAuditLogs.actorAddress, actorAddress.toLowerCase()))
                .orderBy(sql `${systemAuditLogs.timestamp} DESC`)
                .limit(100);
            return c.json(logs);
        }
        const logs = await db.select().from(systemAuditLogs)
            .orderBy(sql `${systemAuditLogs.timestamp} DESC`)
            .limit(200);
        return c.json(logs);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.post("/api/audit-logs", async (c) => {
    try {
        const { actorType, actorAddress, action, details } = await c.req.json();
        await logAudit(actorType, actorAddress.toLowerCase(), action, details);
        return c.json({ success: true });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Registrar Settings
app.get("/api/registrar/settings/:registrarAddr", async (c) => {
    try {
        const addr = c.req.param("registrarAddr").toLowerCase();
        const uni = await db.query.universities.findFirst({
            where: eq(universities.registrar, addr)
        });
        if (!uni)
            return c.json({ error: "University not found" }, 404);
        return c.json(uni);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.post("/api/registrar/settings", async (c) => {
    try {
        const { registrarAddr, logoUrl, stampUrl } = await c.req.json();
        const result = await db.update(universities)
            .set({ logoUrl, stampUrl })
            .where(eq(universities.registrar, registrarAddr.toLowerCase()))
            .returning();
        await logAudit("registrar", registrarAddr.toLowerCase(), "UPDATED_SETTINGS", `Updated logo/stamp assets`);
        return c.json(result[0]);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Platform stats
app.get("/api/stats/platform", async (c) => {
    try {
        const totalUnisResult = await db.select({ count: sql `count(*)` }).from(universities);
        const activeUnisResult = await db.select({ count: sql `count(*)` }).from(universities).where(eq(universities.isActive, true));
        const totalTranscriptsResult = await db.select({ count: sql `count(*)` }).from(transcripts);
        const totalVerificationsResult = await db.select({ count: sql `count(*)` }).from(verifications);
        return c.json({
            totalUniversities: Number(totalUnisResult[0]?.count || 0),
            activeUniversities: Number(activeUnisResult[0]?.count || 0),
            totalTranscripts: Number(totalTranscriptsResult[0]?.count || 0),
            totalVerifications: Number(totalVerificationsResult[0]?.count || 0),
        });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Universities
app.get("/api/universities", async (c) => {
    try {
        const list = await db.select().from(universities);
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.post("/api/universities/register-email", async (c) => {
    try {
        const { txHash, email } = await c.req.json();
        if (!txHash || !email) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        const cleanHash = txHash.toLowerCase();
        const cleanEmail = email.toLowerCase();
        await db.insert(registrarEmails).values({
            txHash: cleanHash,
            email: cleanEmail,
        }).onConflictDoUpdate({
            target: registrarEmails.txHash,
            set: { email: cleanEmail }
        });
        return c.json({ success: true });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Governance / Recovery Requests
app.get("/api/governance/requests", async (c) => {
    try {
        const list = await db.select().from(governanceRequests).orderBy(sql `${governanceRequests.createdAt} DESC`);
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.post("/api/governance/requests", async (c) => {
    try {
        const { type, universityId, contractAddr, currentValue, newValue } = await c.req.json();
        if (!type || !universityId || !contractAddr || !currentValue || !newValue) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        const result = await db.insert(governanceRequests).values({
            type, // 'email' | 'wallet'
            universityId: parseInt(universityId),
            contractAddr: contractAddr.toLowerCase(),
            currentValue: currentValue.toLowerCase(),
            newValue: newValue.toLowerCase(),
            status: "pending",
            createdAt: new Date(),
        }).returning();
        await logAudit("registrar", contractAddr.toLowerCase(), "GOVERNANCE_REQUEST_SUBMITTED", `Requested ${type} change from ${currentValue} to ${newValue}`);
        return c.json(result[0]);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.post("/api/governance/requests/:id/approve", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const req = await db.query.governanceRequests.findFirst({
            where: eq(governanceRequests.id, id)
        });
        if (!req)
            return c.json({ error: "Request not found" }, 404);
        if (req.status !== "pending")
            return c.json({ error: "Request is already processed" }, 400);
        // Update request status
        await db.update(governanceRequests)
            .set({ status: "approved", actionAt: new Date() })
            .where(eq(governanceRequests.id, id));
        if (req.type === "email") {
            // For email change, we update the database
            await db.update(universities)
                .set({ registrarEmail: req.newValue.toLowerCase() })
                .where(eq(universities.universityId, req.universityId));
            await logAudit("admin", "0x31eee44788ea5ae0c65dbdcb1d1c3ea1d8a4e592", "APPROVED_EMAIL_CHANGE", `Approved email change to ${req.newValue} for university ID ${req.universityId}`);
        }
        else if (req.type === "wallet") {
            // For wallet change, we also update the universities registrar wallet in DB
            await db.update(universities)
                .set({ registrar: req.newValue.toLowerCase() })
                .where(eq(universities.universityId, req.universityId));
            await logAudit("admin", "0x31eee44788ea5ae0c65dbdcb1d1c3ea1d8a4e592", "APPROVED_WALLET_CHANGE", `Approved wallet change to ${req.newValue} for university ID ${req.universityId}`);
        }
        return c.json({ success: true });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.post("/api/governance/requests/:id/reject", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const req = await db.query.governanceRequests.findFirst({
            where: eq(governanceRequests.id, id)
        });
        if (!req)
            return c.json({ error: "Request not found" }, 404);
        if (req.status !== "pending")
            return c.json({ error: "Request is already processed" }, 400);
        await db.update(governanceRequests)
            .set({ status: "rejected", actionAt: new Date() })
            .where(eq(governanceRequests.id, id));
        await logAudit("admin", "0x31eee44788ea5ae0c65dbdcb1d1c3ea1d8a4e592", "REJECTED_GOVERNANCE_CHANGE", `Rejected ${req.type} change to ${req.newValue} for university ID ${req.universityId}`);
        return c.json({ success: true });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.get("/api/universities/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const uni = await db.query.universities.findFirst({
            where: eq(universities.universityId, id)
        });
        if (!uni)
            return c.json({ error: "University not found" }, 404);
        return c.json(uni);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.get("/api/universities/by-address/:addr", async (c) => {
    try {
        const addr = c.req.param("addr").toLowerCase();
        const uni = await db.query.universities.findFirst({
            where: eq(universities.contractAddr, addr)
        });
        if (!uni)
            return c.json({ error: "Registry contract address not registered" }, 404);
        return c.json(uni);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Transcripts
app.get("/api/transcripts/:recordId", async (c) => {
    try {
        const recordId = c.req.param("recordId");
        const tx = await db.query.transcripts.findFirst({
            where: eq(transcripts.recordId, recordId)
        });
        if (!tx)
            return c.json({ error: "Transcript record not found" }, 404);
        return c.json(tx);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.get("/api/transcripts/by-student/:studentHash", async (c) => {
    try {
        const studentHash = c.req.param("studentHash").toLowerCase();
        const list = await db.select().from(transcripts).where(eq(transcripts.studentHash, studentHash));
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.get("/api/transcripts/by-registrar/:address", async (c) => {
    try {
        const address = c.req.param("address").toLowerCase();
        const list = await db.select().from(transcripts).where(eq(transcripts.issuer, address));
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.get("/api/transcripts/by-registry/:addr", async (c) => {
    try {
        const addr = c.req.param("addr").toLowerCase();
        const list = await db.select().from(transcripts).where(eq(transcripts.registryAddr, addr));
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Access Hub
app.get("/api/access/by-student/:studentHash", async (c) => {
    try {
        const studentHash = c.req.param("studentHash").toLowerCase();
        const list = await db.select().from(accessGrants).where(eq(accessGrants.student, studentHash));
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.get("/api/access/:recordId/:verifier", async (c) => {
    try {
        const recordId = c.req.param("recordId");
        const verifier = c.req.param("verifier").toLowerCase();
        const grant = await db.query.accessGrants.findFirst({
            where: and(eq(accessGrants.recordId, recordId), eq(accessGrants.verifier, verifier), eq(accessGrants.isActive, true))
        });
        return c.json({ hasAccess: !!grant });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// ─── IPFS Upload via Pinata ───
app.post("/api/ipfs/upload", verifyAuth, async (c) => {
    try {
        const body = await c.req.json();
        const pinataJWT = process.env.PINATA_JWT;
        const pinataApiKey = process.env.PINATA_API_KEY;
        const pinataSecretKey = process.env.PINATA_SECRET_KEY;
        if (!pinataJWT && !(pinataApiKey && pinataSecretKey)) {
            return c.json({ error: "Pinata credentials not configured on server" }, 503);
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
        };
        const logoUrl = body.logoUrl || "https://credaxis.vercel.app/icon.svg";
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const verifyUrl = `${frontendUrl}/verify/${body.fileHash || ""}`;
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
                issuedAt: new Date().toISOString(),
                platform: "CredAxis",
            },
            pinataMetadata: metadataPayload,
            pinataOptions: { cidVersion: 1 },
        };
        // Call Pinata pinJSONToIPFS REST API
        const headers = {
            "Content-Type": "application/json",
        };
        if (pinataJWT) {
            headers["Authorization"] = `Bearer ${pinataJWT}`;
        }
        else {
            headers["pinata_api_key"] = pinataApiKey;
            headers["pinata_secret_api_key"] = pinataSecretKey;
        }
        const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
            method: "POST",
            headers,
            body: JSON.stringify(pinataBody),
        });
        if (!pinataRes.ok) {
            const errText = await pinataRes.text();
            console.error("Pinata API error:", errText);
            return c.json({ error: `Pinata upload failed: ${pinataRes.status} ${errText}` }, 502);
        }
        const pinataData = await pinataRes.json();
        const cid = pinataData.IpfsHash;
        const fileHash = body.fileHash || ("0x" + Math.random().toString(16).slice(2, 66));
        // Save upload record in DB
        await db.insert(ipfsUploads).values({
            cid,
            fileHash,
            studentHash: body.studentAddress || "0x",
            universityName: body.universityName || "Unknown",
            uploadedAt: new Date(),
            metadataJson: pinataBody.pinataContent,
        });
        console.log(`✅ Pinata upload success: CID=${cid}`);
        return c.json({
            cid,
            fileHash,
            gateway: `https://gateway.pinata.cloud/ipfs/${cid}`,
            ipfsUrl: `ipfs://${cid}`,
            metadataJson: pinataBody.pinataContent,
        });
    }
    catch (err) {
        console.error("IPFS upload error:", err);
        return c.json({ error: err.message }, 500);
    }
});
// Get IPFS upload metadata by CID
app.get("/api/ipfs/metadata/:cid", async (c) => {
    try {
        const cid = c.req.param("cid");
        const record = await db.query.ipfsUploads.findFirst({
            where: eq(ipfsUploads.cid, cid)
        });
        if (!record)
            return c.json({ error: "Metadata record not found" }, 404);
        return c.json(record);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// ─── STUDENT LIFECYCLE ENDPOINTS ───
// Student applies for onboarding or matches with whitelist
app.post("/api/students", async (c) => {
    try {
        const { walletAddress, fullName, studentId, universityId, email } = await c.req.json();
        if (!walletAddress || !fullName || !studentId || !universityId || !email) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        const cleanWallet = walletAddress.toLowerCase();
        const cleanEmail = email.toLowerCase();
        // Check if student with this wallet already exists
        const existingWallet = await db.query.students.findFirst({
            where: eq(students.walletAddress, cleanWallet)
        });
        if (existingWallet) {
            return c.json({ error: "Wallet address already registered" }, 400);
        }
        // Check if there is an approved registrar whitelist record matching email or studentId (and has no wallet yet)
        const whitelisted = await db.query.students.findFirst({
            where: and(eq(students.universityId, universityId), sql `(${students.email} = ${cleanEmail} OR ${students.studentId} = ${studentId})`, sql `${students.walletAddress} IS NULL`)
        });
        if (whitelisted) {
            // Automatically merge and mark as approved
            await db.update(students)
                .set({
                walletAddress: cleanWallet,
                fullName, // update with real name
                studentId, // update with real student ID
                status: "approved",
                updatedAt: new Date(),
                actionAt: new Date(),
            })
                .where(eq(students.id, whitelisted.id));
            return c.json({ status: "approved", message: "Onboarding completed. Profile automatically approved via registrar whitelist." });
        }
        // Otherwise, create a pending application
        await db.insert(students).values({
            walletAddress: cleanWallet,
            fullName,
            studentId,
            universityId,
            email: cleanEmail,
            status: "pending",
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        // Send an email notification to the Admin/Registrar
        console.log(`[EMAIL NOTIFICATION] Preparing to send email for new student ${fullName}`);
        if (transporter) {
            try {
                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
                    to: process.env.SMTP_USER || process.env.GMAIL_USER, // sending to self/admin
                    subject: "New Student Verification Request",
                    text: `A new student (${fullName}, ID: ${studentId}, Email: ${cleanEmail}) has submitted a profile verification request.\n\nPlease review and accept or reject the application in the admin portal.`,
                });
                console.log(`[EMAIL] Notification sent successfully.`);
            }
            catch (err) {
                console.error(`[EMAIL] Failed to send notification:`, err);
            }
        }
        else {
            console.log(`[EMAIL] Transporter not configured. Skipping email.`);
        }
        return c.json({ status: "pending", message: "Application submitted. Awaiting registrar approval." });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Get student profile
app.get("/api/students/profile/:walletAddress", async (c) => {
    try {
        const walletAddress = c.req.param("walletAddress").toLowerCase();
        const profile = await db.query.students.findFirst({
            where: eq(students.walletAddress, walletAddress)
        });
        if (!profile) {
            return c.json({ error: "Profile not found" }, 404);
        }
        return c.json(profile);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Get student profile by ID, Name, Email, or Wallet Address (Case-insensitive)
app.get("/api/students/profile-by-id/:studentId", async (c) => {
    try {
        const studentId = c.req.param("studentId").trim().toLowerCase();
        const profile = await db.query.students.findFirst({
            where: sql `LOWER(${students.studentId}) = ${studentId} 
                 OR LOWER(${students.email}) = ${studentId} 
                 OR LOWER(${students.walletAddress}) = ${studentId}
                 OR LOWER(${students.fullName}) = ${studentId}`,
            orderBy: (students, { desc }) => [
                sql `CASE WHEN ${students.status} = 'approved' THEN 1 WHEN ${students.status} = 'pending' THEN 2 ELSE 3 END ASC`,
                desc(students.id)
            ]
        });
        if (!profile) {
            return c.json({ error: "Profile not found" }, 404);
        }
        return c.json(profile);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Search for students by any matching query parameter (Name, Email, ID, Wallet)
app.get("/api/students/search", async (c) => {
    try {
        const q = c.req.query("q")?.trim().toLowerCase();
        if (!q) {
            return c.json([]);
        }
        const cleanQ = `%${q}%`;
        const list = await db.select().from(students)
            .where(sql `LOWER(${students.fullName}) LIKE ${cleanQ} 
                 OR LOWER(${students.email}) LIKE ${cleanQ} 
                 OR LOWER(${students.studentId}) LIKE ${cleanQ} 
                 OR LOWER(${students.walletAddress}) LIKE ${cleanQ}`)
            .orderBy(sql `CASE WHEN ${students.status} = 'approved' THEN 1 WHEN ${students.status} = 'pending' THEN 2 ELSE 3 END ASC`, sql `${students.id} DESC`);
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// ─── REGISTRAR DASHBOARD ENDPOINTS ───
// Get all students under a registrar's university
app.get("/api/registrar/students/:registrarAddress", async (c) => {
    try {
        const registrarAddress = c.req.param("registrarAddress").toLowerCase();
        // A registrar may be assigned to multiple universities (e.g. from script redeployments)
        const unis = await db.select().from(universities).where(eq(universities.registrar, registrarAddress));
        if (!unis || unis.length === 0) {
            return c.json({ error: "Registrar not registered with any university" }, 404);
        }
        const uniIds = unis.map(u => u.universityId);
        const list = await db.select().from(students)
            .where(inArray(students.universityId, uniIds));
        return c.json(list);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Registrar binds a wallet address to a whitelisted student
app.put("/api/students/:id/bind-wallet", async (c) => {
    try {
        const studentIdStr = c.req.param("id");
        const { walletAddress, registrarAddress } = await c.req.json();
        if (!walletAddress || !registrarAddress) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        const uni = await db.query.universities.findFirst({
            where: eq(universities.registrar, registrarAddress.toLowerCase())
        });
        if (!uni) {
            return c.json({ error: "Registrar university not found" }, 403);
        }
        const existingWallet = await db.query.students.findFirst({
            where: eq(students.walletAddress, walletAddress.toLowerCase())
        });
        if (existingWallet) {
            return c.json({ error: "Wallet address already bound to a student" }, 400);
        }
        await db.update(students)
            .set({
            walletAddress: walletAddress.toLowerCase(),
            updatedAt: new Date(),
        })
            .where(and(eq(students.id, parseInt(studentIdStr)), eq(students.universityId, uni.universityId)));
        return c.json({ success: true, message: "Wallet successfully bound to student profile." });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
app.put("/api/students/:id", async (c) => {
    try {
        const id = parseInt(c.req.param("id"));
        const { fullName, email, walletAddress } = await c.req.json();
        const updateData = {};
        if (fullName)
            updateData.fullName = fullName;
        if (email)
            updateData.email = email.toLowerCase();
        if (walletAddress !== undefined) {
            const cleanWallet = walletAddress ? walletAddress.toLowerCase() : null;
            if (cleanWallet) {
                // Check uniqueness excluding current student
                const existing = await db.query.students.findFirst({
                    where: and(eq(students.walletAddress, cleanWallet), sql `id != ${id}`)
                });
                if (existing) {
                    return c.json({ error: "Wallet address is already registered to another profile" }, 400);
                }
            }
            updateData.walletAddress = cleanWallet;
        }
        updateData.updatedAt = new Date();
        const result = await db.update(students)
            .set(updateData)
            .where(eq(students.id, id))
            .returning();
        await logAudit("registrar", "system", "EDITED_STUDENT_DETAILS", `Updated student ID ${id} details: Name: ${fullName}, Email: ${email}, Wallet: ${walletAddress}`);
        return c.json(result[0]);
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Registrar updates student approval status
app.put("/api/students/:walletAddress/status", async (c) => {
    try {
        const walletAddress = c.req.param("walletAddress").toLowerCase();
        const { status, registrarAddress } = await c.req.json();
        if (!status || !["approved", "rejected"].includes(status)) {
            return c.json({ error: "Invalid status value" }, 400);
        }
        if (!registrarAddress) {
            return c.json({ error: "Missing registrarAddress verification" }, 400);
        }
        const uni = await db.query.universities.findFirst({
            where: eq(universities.registrar, registrarAddress.toLowerCase())
        });
        if (!uni) {
            return c.json({ error: "Registrar university not found" }, 403);
        }
        const student = await db.query.students.findFirst({
            where: eq(students.walletAddress, walletAddress)
        });
        if (!student) {
            return c.json({ error: "Student profile not found" }, 404);
        }
        if (student.universityId !== uni.universityId) {
            return c.json({ error: "Unauthorized: student is registered to another university" }, 403);
        }
        await db.update(students)
            .set({
            status,
            actionAt: new Date(),
            updatedAt: new Date(),
        })
            .where(eq(students.walletAddress, walletAddress));
        return c.json({ status, message: `Student status updated to ${status}` });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Registrar CSV bulk upload / whitelist
app.post("/api/students/bulk", async (c) => {
    try {
        const { registrarAddress, studentsList } = await c.req.json();
        if (!registrarAddress || !studentsList || !Array.isArray(studentsList)) {
            return c.json({ error: "Missing required fields" }, 400);
        }
        const uni = await db.query.universities.findFirst({
            where: eq(universities.registrar, registrarAddress.toLowerCase())
        });
        if (!uni) {
            return c.json({ error: "Registrar university not found" }, 403);
        }
        const results = [];
        for (const s of studentsList) {
            const { fullName, studentId, email } = s;
            if (!fullName || !studentId || !email)
                continue;
            const cleanEmail = email.toLowerCase();
            // Check if already exists in this university by email or student ID
            const existing = await db.query.students.findFirst({
                where: and(eq(students.universityId, uni.universityId), sql `(${students.email} = ${cleanEmail} OR ${students.studentId} = ${studentId})`)
            });
            if (existing) {
                if (!existing.walletAddress) {
                    // If no wallet is bound yet, update details and mark as approved
                    await db.update(students)
                        .set({
                        fullName,
                        studentId,
                        status: "approved",
                        updatedAt: new Date(),
                    })
                        .where(eq(students.id, existing.id));
                    results.push({ email: cleanEmail, status: "updated_whitelist" });
                }
                else {
                    results.push({ email: cleanEmail, status: "already_registered" });
                }
            }
            else {
                // Create a pre-approved whitelist record
                await db.insert(students).values({
                    fullName,
                    studentId,
                    email: cleanEmail,
                    universityId: uni.universityId,
                    status: "approved",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                results.push({ email: cleanEmail, status: "whitelisted" });
            }
        }
        return c.json({ success: true, processed: results.length, details: results });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// ─── ADMIN SYSTEM LOGS ENDPOINT ───
app.get("/api/logs", async (c) => {
    try {
        const unis = await db.select().from(universities).orderBy(sql `deployed_at DESC`).limit(20);
        const txs = await db.select().from(transcripts).orderBy(sql `issued_at DESC`).limit(20);
        const history = await db.select().from(transcriptStatusHistory).orderBy(sql `changed_at DESC`).limit(20);
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
        ];
        logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return c.json(logs.slice(0, 50));
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// ─── TEST EMAIL ENDPOINT ───
app.post("/api/test-email", async (c) => {
    try {
        const { to } = await c.req.json();
        if (!transporter) {
            return c.json({ error: "Email transporter is not configured on the server." }, 500);
        }
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
            to: to || process.env.SMTP_USER || process.env.GMAIL_USER,
            subject: "Test Email from CredAxis System",
            text: "If you are reading this, the email configuration is fully working and perfectly aligned with the architecture!",
        });
        return c.json({ success: true, message: "Test email sent successfully", messageId: info.messageId });
    }
    catch (err) {
        return c.json({ error: err.message }, 500);
    }
});
// Start server and launch micro-indexer listener
const port = 3001;
serve({
    fetch: app.fetch,
    port,
});
console.log(`CredAxis Database-Backed API Server running on http://localhost:${port}`);
// Launch real-time background blockchain listener
startIndexer().catch((err) => {
    console.error("Failed to start indexing agent service on start:", err);
});
