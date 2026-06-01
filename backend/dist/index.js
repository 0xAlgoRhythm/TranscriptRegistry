import { Hono } from "hono";
import { cors } from "hono/cors";
import { db } from "./db/connection.js";
import { universities, transcripts, accessGrants, ipfsUploads } from "./db/schema.js";
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
app.use("/*", cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
}));
// Auth Middleware Stub (can check Privy JWTs)
const verifyAuth = async (c, next) => {
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Unauthorized" }, 401);
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
        return c.json({
            totalUniversities: Number(totalUnisResult[0]?.count || 0),
            activeUniversities: Number(activeUnisResult[0]?.count || 0),
            totalTranscripts: Number(totalTranscriptsResult[0]?.count || 0),
            totalVerifications: 28, // mock stat
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
// IPFS Upload Simulator
app.post("/api/ipfs/upload", verifyAuth, async (c) => {
    try {
        const body = await c.req.json();
        const fileHash = body.fileHash || "0x" + Math.random().toString(16).slice(2, 66);
        const cid = "Qm" + Math.random().toString(36).slice(2, 48);
        const metadata = {
            studentAddress: body.studentAddress,
            universityName: body.universityName,
            registryAddress: body.registryAddress,
            uploadedAt: new Date().toISOString(),
        };
        // Save metadata CID register record in DB
        await db.insert(ipfsUploads).values({
            cid,
            fileHash,
            studentHash: body.studentAddress || "0x",
            universityName: body.universityName || "MIT",
            uploadedAt: new Date(),
            metadataJson: metadata,
        });
        return c.json({
            cid,
            fileHash,
            metadataJson: metadata,
        });
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
