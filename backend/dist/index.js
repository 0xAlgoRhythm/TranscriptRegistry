import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./db/connection.js";
import { universities, transcripts, accessGrants, ipfsUploads, students, transcriptStatusHistory, verifications } from "./db/schema.js";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { eq, and, sql } from "drizzle-orm";
import { startIndexer } from "./indexer/sync.js";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });
const app = new Hono();
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
        const pinataBody = {
            pinataContent: {
                ...body,
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
// ─── REGISTRAR DASHBOARD ENDPOINTS ───
// Get all students under a registrar's university
app.get("/api/registrar/students/:registrarAddress", async (c) => {
    try {
        const registrarAddress = c.req.param("registrarAddress").toLowerCase();
        const uni = await db.query.universities.findFirst({
            where: eq(universities.registrar, registrarAddress)
        });
        if (!uni) {
            return c.json({ error: "Registrar not registered with any university" }, 404);
        }
        const list = await db.select().from(students)
            .where(eq(students.universityId, uni.universityId));
        return c.json(list);
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
