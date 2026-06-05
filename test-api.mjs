#!/usr/bin/env node
/**
 * CredAxis Backend API Test Suite
 * Tests: IPFS upload (Pinata), transcript endpoints, student endpoints, activity logs
 * Run: node test-api.mjs
 */

const API = process.env.API_URL || "http://localhost:3001"
const AUTH = "Bearer credaxis-registrar"

let passed = 0
let failed = 0
const results = []

function color(code, text) {
  return `\x1b[${code}m${text}\x1b[0m`
}
const green  = (t) => color(32, t)
const red    = (t) => color(31, t)
const yellow = (t) => color(33, t)
const cyan   = (t) => color(36, t)
const bold   = (t) => color(1, t)

async function test(name, fn) {
  process.stdout.write(`  ${cyan("›")} ${name} ... `)
  try {
    const result = await fn()
    passed++
    results.push({ name, status: "PASS", detail: result })
    console.log(green("PASS") + (result ? ` ${yellow("→")} ${result}` : ""))
  } catch (err) {
    failed++
    results.push({ name, status: "FAIL", detail: err.message })
    console.log(red("FAIL") + ` ${red("→")} ${err.message}`)
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function apiGet(path) {
  const res = await fetch(`${API}${path}`)
  return { res, data: await res.json() }
}

async function apiPost(path, body, auth = false) {
  const headers = { "Content-Type": "application/json" }
  if (auth) headers["Authorization"] = AUTH
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  return { res, data: await res.json() }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. HEALTH / REACHABILITY
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 1. SERVER REACHABILITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

await test("Backend is running and reachable", async () => {
  const res = await fetch(`${API}/api/universities`)
  assert(res.status < 500, `Server returned ${res.status}`)
  return `HTTP ${res.status}`
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. UNIVERSITIES
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 2. UNIVERSITIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

let universities = []
await test("GET /api/universities — returns array", async () => {
  const { res, data } = await apiGet("/api/universities")
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(Array.isArray(data), "Response is not an array")
  universities = data
  return `${data.length} universities`
})

await test("GET /api/universities/:id — valid id returns university", async () => {
  if (universities.length === 0) throw new Error("No universities in DB — skipping")
  const u = universities[0]
  const { res, data } = await apiGet(`/api/universities/${u.universityId}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(data.universityId === u.universityId, "ID mismatch")
  return `"${data.name}"`
})

await test("GET /api/universities/:id — invalid id returns 404", async () => {
  const { res } = await apiGet("/api/universities/999999")
  assert(res.status === 404, `Expected 404, got ${res.status}`)
  return "404 as expected"
})

await test("GET /api/universities/by-address/:addr — known address returns university", async () => {
  if (universities.length === 0) throw new Error("No universities in DB — skipping")
  const u = universities[0]
  const { res, data } = await apiGet(`/api/universities/by-address/${u.contractAddr}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(data.contractAddr.toLowerCase() === u.contractAddr.toLowerCase(), "Address mismatch")
  return `"${data.name}" at ${u.contractAddr.slice(0, 10)}...`
})

await test("GET /api/universities/by-address/:addr — unknown returns 404", async () => {
  const { res } = await apiGet("/api/universities/by-address/0x0000000000000000000000000000000000000001")
  assert(res.status === 404, `Expected 404, got ${res.status}`)
  return "404 as expected"
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. TRANSCRIPTS
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 3. TRANSCRIPTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

let transcripts = []
await test("GET /api/transcripts/by-registry/:addr — valid registry", async () => {
  if (universities.length === 0) throw new Error("No universities — skipping")
  const u = universities[0]
  const { res, data } = await apiGet(`/api/transcripts/by-registry/${u.contractAddr}`)
  assert(res.ok || res.status === 404, `Got ${res.status}`)
  if (Array.isArray(data)) transcripts = data
  return Array.isArray(data) ? `${data.length} transcripts` : "404 (empty registry)"
})

await test("GET /api/transcripts/:recordId — known record", async () => {
  if (transcripts.length === 0) throw new Error("No transcripts in DB — skipping")
  const t = transcripts[0]
  const { res, data } = await apiGet(`/api/transcripts/${t.recordId}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(data.recordId === t.recordId, "Record ID mismatch")
  return `${t.recordId.slice(0, 14)}...`
})

await test("GET /api/transcripts/:recordId — unknown record returns 404", async () => {
  const { res } = await apiGet("/api/transcripts/0x0000000000000000000000000000000000000000000000000000000000000000")
  assert(res.status === 404, `Expected 404, got ${res.status}`)
  return "404 as expected"
})

await test("GET /api/transcripts/by-student/:studentHash — returns array", async () => {
  if (transcripts.length === 0) throw new Error("No transcripts — skipping")
  const t = transcripts[0]
  const { res, data } = await apiGet(`/api/transcripts/by-student/${t.studentHash}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(Array.isArray(data), "Not an array")
  return `${data.length} records for hash ${t.studentHash.slice(0, 12)}...`
})

await test("GET /api/transcripts/by-registrar/:address — returns array", async () => {
  if (transcripts.length === 0) throw new Error("No transcripts — skipping")
  const t = transcripts[0]
  const { res, data } = await apiGet(`/api/transcripts/by-registrar/${t.issuer}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(Array.isArray(data), "Not an array")
  return `${data.length} records by ${t.issuer.slice(0, 12)}...`
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. PLATFORM STATS
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 4. PLATFORM STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

await test("GET /api/stats/platform — returns platform KPIs", async () => {
  const { res, data } = await apiGet("/api/stats/platform")
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(typeof data.totalUniversities === "number", "Missing totalUniversities")
  assert(typeof data.totalTranscripts === "number", "Missing totalTranscripts")
  return `${data.totalUniversities} unis, ${data.totalTranscripts} transcripts`
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. ACTIVITY LOGS
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 5. ACTIVITY LOGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

await test("GET /api/logs — returns real activity log array", async () => {
  const { res, data } = await apiGet("/api/logs")
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(Array.isArray(data), "Response is not an array")
  if (data.length > 0) {
    assert(typeof data[0].type === "string", "Log entry missing .type")
    assert(typeof data[0].description === "string", "Log entry missing .description")
  }
  return `${data.length} log entries (types: ${[...new Set(data.map(d => d.type))].join(", ") || "none"})`
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. STUDENT ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 6. STUDENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

const testWallet = `0xtest${Date.now().toString(16)}`.slice(0, 42).padEnd(42, "0")

await test("POST /api/students — creates pending application", async () => {
  const { res, data } = await apiPost("/api/students", {
    walletAddress: testWallet,
    fullName: "Test Student IPFS",
    studentId: `TEST-${Date.now()}`,
    universityId: universities[0]?.universityId || 1,
    email: `test${Date.now()}@credaxis.test`,
  })
  // 200 (pending/approved) or 400 (duplicate) are acceptable
  assert(res.status === 200 || res.status === 400, `Unexpected status ${res.status}`)
  return data.status || data.error || "ok"
})

await test("GET /api/students/profile/:address — unknown wallet returns 404", async () => {
  const { res } = await apiGet("/api/students/profile/0x0000000000000000000000000000000000000099")
  assert(res.status === 404, `Expected 404, got ${res.status}`)
  return "404 as expected"
})

// ─────────────────────────────────────────────────────────────────────────────
// 7. ACCESS ENDPOINTS
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 7. ACCESS GRANTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

await test("GET /api/access/by-student/:hash — returns array", async () => {
  if (transcripts.length === 0) throw new Error("No transcripts — skipping")
  const t = transcripts[0]
  const { res, data } = await apiGet(`/api/access/by-student/${t.studentHash}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(Array.isArray(data), "Not an array")
  return `${data.length} grants`
})

await test("GET /api/access/:recordId/:verifier — check specific grant", async () => {
  if (transcripts.length === 0) throw new Error("No transcripts — skipping")
  const t = transcripts[0]
  const fakeVerifier = "0x0000000000000000000000000000000000000001"
  const { res, data } = await apiGet(`/api/access/${t.recordId}/${fakeVerifier}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(typeof data.hasAccess === "boolean", "Missing hasAccess field")
  return `hasAccess: ${data.hasAccess}`
})

// ─────────────────────────────────────────────────────────────────────────────
// 8. *** REAL PINATA IPFS UPLOAD TEST ***
// ─────────────────────────────────────────────────────────────────────────────
console.log(bold("\n━━━ 8. PINATA IPFS UPLOAD (REAL) ━━━━━━━━━━━━━━━━━━━━━━━━"))

let realCID = null

await test("POST /api/ipfs/upload — requires Authorization header", async () => {
  const res = await fetch(`${API}/api/ipfs/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ studentAddress: "0x1234", universityName: "Test" }),
  })
  assert(res.status === 401, `Expected 401 without auth, got ${res.status}`)
  return "401 Unauthorized (correct)"
})

await test("POST /api/ipfs/upload — real Pinata pin returns valid CID", async () => {
  const payload = {
    studentAddress: "0xC52A761304DE7DFEea1570361bf190803fF55b6c",
    studentName: "Test Graduate CI",
    studentId: "TEST-2026-CI",
    universityName: "KNUST",
    registryAddress: "0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3",
    gpa: "3.95",
    major: "B.S. Computer Science",
    gradYear: "2026",
    fileHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab",
  }
  const { res, data } = await apiPost("/api/ipfs/upload", payload, true)
  if (res.status === 503) throw new Error("Pinata credentials not configured on server")
  if (res.status === 502) throw new Error(`Pinata API error: ${JSON.stringify(data)}`)
  assert(res.ok, `Expected 200, got ${res.status}: ${JSON.stringify(data)}`)
  assert(typeof data.cid === "string", "Missing CID in response")
  assert(data.cid.length > 0, "CID is empty")
  assert(!data.cid.startsWith("Qm") || data.cid.length >= 46, "CID looks fake (random Qm...)")
  realCID = data.cid
  return `CID: ${data.cid}`
})

await test("POST /api/ipfs/upload — gateway URL returned", async () => {
  if (!realCID) throw new Error("No real CID from previous test — skipping")
  const payload = {
    studentAddress: "0xC52A761304DE7DFEea1570361bf190803fF55b6c",
    studentName: "Gateway Test",
    studentId: "GW-2026",
    universityName: "KNUST",
    registryAddress: "0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3",
    gpa: "3.5",
    major: "Engineering",
    gradYear: "2025",
    fileHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
  }
  const { res, data } = await apiPost("/api/ipfs/upload", payload, true)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(typeof data.gateway === "string", "Missing gateway URL")
  assert(data.gateway.includes("pinata.cloud") || data.gateway.includes("ipfs"), "Gateway URL doesn't look right")
  return data.gateway
})

await test("Pinata gateway — pinned CID is accessible via IPFS gateway", async () => {
  if (!realCID) throw new Error("No real CID from previous test — skipping")
  const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${realCID}`
  const res = await fetch(gatewayUrl, { method: "HEAD" })
  assert(res.ok || res.status === 200 || res.status === 301 || res.status === 302, 
    `Gateway returned ${res.status} for CID ${realCID}`)
  return `${res.status} at ${gatewayUrl}`
})

await test("GET /api/ipfs/metadata/:cid — returns upload metadata from DB", async () => {
  if (!realCID) throw new Error("No real CID from previous test — skipping")
  const { res, data } = await apiGet(`/api/ipfs/metadata/${realCID}`)
  assert(res.ok, `Expected 200, got ${res.status}`)
  assert(data.cid === realCID, "CID mismatch")
  assert(data.metadataJson.studentName === "Test Graduate CI", "Metadata name mismatch")
  return `Successfully fetched metadata for student "${data.metadataJson.studentName}"`
})

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
const total = passed + failed
console.log(bold("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))
console.log(bold("TEST RESULTS"))
console.log(`  Total:  ${total}`)
console.log(`  ${green("Passed:")}  ${passed}`)
console.log(`  ${failed > 0 ? red("Failed:") : "Failed:"}  ${failed > 0 ? red(String(failed)) : failed}`)
console.log(bold("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"))

if (failed > 0) {
  console.log(red(bold("FAILED TESTS:")))
  results.filter(r => r.status === "FAIL").forEach(r => {
    console.log(`  ${red("✗")} ${r.name}`)
    console.log(`    ${yellow(r.detail)}`)
  })
  console.log()
  process.exit(1)
} else {
  console.log(green(bold("✓ All tests passed!\n")))
  if (realCID) {
    console.log(cyan(`📌 Real Pinata CID pinned during test: ${realCID}`))
    console.log(cyan(`   View at: https://gateway.pinata.cloud/ipfs/${realCID}\n`))
  }
}
