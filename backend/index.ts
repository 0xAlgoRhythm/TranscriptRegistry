import { Hono } from "hono"
import { cors } from "hono/cors"

const app = new Hono()

// Enable CORS
app.use("/*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}))

// Mock Database State for prototyping
const mockUniversities = [
  {
    id: 1,
    universityId: 0,
    name: "Massachusetts Institute of Technology",
    contractAddr: "0x82c81e9d12a9bdfef0789278912ef64d0012bc0a",
    registrar: "0x5b38da6a701c568545dcfcb03fcb875f56beddc4",
    deployedAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    isActive: true,
  },
  {
    id: 2,
    universityId: 1,
    name: "Stanford University",
    contractAddr: "0xd207b844f0789278912ef64d0012bc09a63fe89d",
    registrar: "0xab8483f64d9c6d1ecf9b849ae677d3f2400a5788",
    deployedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    isActive: true,
  },
]

const mockTranscripts = [
  {
    recordId: "0x4f3e5c72a819bdfef0789278912ef64d0012bc09a63fe89d71a8bc8f921888ad",
    studentHash: "0x89a3f2b1cde458a28793b8dcf284e921888a7b6d19a2b8e72c841e2a0b9c3f4e", // keccak256 hash
    metadataCid: "QmXyZk4s8ad9d821389bc72a912ef64d0012bc09a63fe89d71a8bc8f921888ad",
    fileHash: "0x4f3e5c72a819bdfef0789278912ef64d0012bc09a63fe89d71a8bc8f921888ad",
    issuer: "0x5b38da6a701c568545dcfcb03fcb875f56beddc4",
    registryAddr: "0x82c81e9d12a9bdfef0789278912ef64d0012bc0a",
    universityId: 0,
    issuedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    status: "Active",
  },
  {
    recordId: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f12ef",
    studentHash: "0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f12ef3a2b1c0d9e8f7a6b5c4d3e2f",
    metadataCid: "bafybeigdyrzt5swn7g7ofwrdgahqznb52yc1hpu3y25e1cf42fhpu3y25e",
    fileHash: "0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f12ef",
    issuer: "0xab8483f64d9c6d1ecf9b849ae677d3f2400a5788",
    registryAddr: "0xd207b844f0789278912ef64d0012bc09a63fe89d",
    universityId: 1,
    issuedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    status: "Active",
  },
]

const mockAccessGrants = [
  {
    recordId: "0x4f3e5c72a819bdfef0789278912ef64d0012bc09a63fe89d71a8bc8f921888ad",
    verifier: "0x4b20993bc481177ec7c8f571cecae8a9e22c02db",
    student: "0x0f1117...",
    grantedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 29 * 24 * 3600 * 1000).toISOString(),
    isActive: true,
  },
]

// ─── Privy Mock Auth Middleware ───
const mockAuth = async (c: any, next: any) => {
  const authHeader = c.req.header("Authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401)
  }
  // For prototype mock validation, accept any bearer token
  await next()
}

// ─── Routes ───

// Platform stats
app.get("/api/stats/platform", (c) => {
  return c.json({
    totalUniversities: mockUniversities.length,
    activeUniversities: mockUniversities.filter(u => u.isActive).length,
    totalTranscripts: mockTranscripts.length,
    totalVerifications: 142,
  })
})

// Universities
app.get("/api/universities", (c) => {
  return c.json(mockUniversities)
})

app.get("/api/universities/:id", (c) => {
  const id = parseInt(c.req.param("id"))
  const uni = mockUniversities.find((u) => u.universityId === id)
  if (!uni) return c.json({ error: "University not found" }, 404)
  return c.json(uni)
})

app.get("/api/universities/by-address/:addr", (c) => {
  const addr = c.req.param("addr").toLowerCase()
  const uni = mockUniversities.find((u) => u.contractAddr.toLowerCase() === addr)
  if (!uni) return c.json({ error: "Registry address not found" }, 404)
  return c.json(uni)
})

// Transcripts
app.get("/api/transcripts/:recordId", (c) => {
  const recordId = c.req.param("recordId")
  const tx = mockTranscripts.find((t) => t.recordId === recordId)
  if (!tx) return c.json({ error: "Transcript not found" }, 404)
  return c.json(tx)
})

app.get("/api/transcripts/by-student/:studentHash", (c) => {
  const studentHash = c.req.param("studentHash").toLowerCase()
  const txs = mockTranscripts.filter((t) => t.studentHash.toLowerCase() === studentHash)
  return c.json(txs)
})

app.get("/api/transcripts/by-registrar/:address", (c) => {
  const address = c.req.param("address").toLowerCase()
  const txs = mockTranscripts.filter((t) => t.issuer.toLowerCase() === address)
  return c.json(txs)
})

app.get("/api/transcripts/by-registry/:addr", (c) => {
  const addr = c.req.param("addr").toLowerCase()
  const txs = mockTranscripts.filter((t) => t.registryAddr.toLowerCase() === addr)
  return c.json(txs)
})

// Access Hub
app.get("/api/access/by-student/:studentHash", (c) => {
  const studentHash = c.req.param("studentHash").toLowerCase()
  const grants = mockAccessGrants.filter((g) => g.student.toLowerCase() === studentHash)
  return c.json(grants)
})

app.get("/api/access/:recordId/:verifier", (c) => {
  const recordId = c.req.param("recordId")
  const verifier = c.req.param("verifier").toLowerCase()
  const grant = mockAccessGrants.find(
    (g) => g.recordId === recordId && g.verifier.toLowerCase() === verifier
  )
  return c.json({ hasAccess: !!grant && grant.isActive })
})

// IPFS Upload Simulator
app.post("/api/ipfs/upload", mockAuth, async (c) => {
  const body = await c.req.json()
  const fileHash = body.fileHash || "0x" + Math.random().toString(16).slice(2, 66)
  const cid = "Qm" + Math.random().toString(36).slice(2, 48)

  return c.json({
    cid,
    fileHash,
    metadataJson: {
      studentAddress: body.studentAddress,
      universityName: body.universityName,
      registryAddress: body.registryAddress,
      uploadedAt: new Date().toISOString(),
    }
  })
})

export default {
  port: 3001,
  fetch: app.fetch,
}
console.log("CredAxis Hono Mock Backend running on http://localhost:3001")
