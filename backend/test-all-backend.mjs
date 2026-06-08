#!/usr/bin/env node
/**
 * CredAxis Comprehensive Backend Integration Test Suite
 * Tests: Universities, Students, Transcripts, IPFS, and new third-party Institution portal APIs
 * Run: node test-all-backend.mjs
 */

import { db } from './dist/db/connection.js'
import { universities, transcripts, students, institutions, institutionRequests, accessGrants } from './dist/db/schema.js'
import { eq, and, sql } from 'drizzle-orm'
import dotenv from 'dotenv'

dotenv.config()

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

async function apiPut(path, body) {
  const headers = { "Content-Type": "application/json" }
  const res = await fetch(`${API}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  })
  return { res, data: await res.json() }
}

// Global test variables to clean up later
let testStudentId = `TSTUD-${Date.now()}`
let testStudentEmail = `test-student-${Date.now()}@test.com`
let testStudentWallet = `0xstudent${Date.now().toString(16)}`.slice(0, 42).padEnd(42, "0").toLowerCase()
let testRecordId = `0xrec${Date.now().toString(16)}`.slice(0, 66).padEnd(66, "0").toLowerCase()
let testRegistryAddr = "0x0487722e60f437f5588bc97501177d1384c84e19" // KNUST contract addr in DB

let testInstitutionName = `Test Inst ${Date.now()}`
let testInstitutionEmail = `test-inst-${Date.now()}@test.com`
let testInstitutionWallet = `0xinst${Date.now().toString(16)}`.slice(0, 42).padEnd(42, "0").toLowerCase()
let updatedInstitutionEmail = `updated-inst-${Date.now()}@test.com`
let updatedInstitutionWallet = `0xinstup${Date.now().toString(16)}`.slice(0, 42).padEnd(42, "0").toLowerCase()

let createdStudentId = null
let createdTranscriptId = null
let createdInstitutionId = null
let createdRequestId = null

async function runTests() {
  console.log(bold("\n========================================================="))
  console.log(bold("      CREDAXIS COMPREHENSIVE BACKEND INTEGRATION TESTS   "))
  console.log(bold("========================================================="))

  // ─────────────────────────────────────────────────────────────────────────────
  // SETUP / SEEDING TEST DATA
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(bold("\n━━━ SETUP: SEEDING DATABASE TEST RECORDS ━━━━━━━━━━━━━━━━━"))
  
  await test("Seed approved student and active transcript in DB", async () => {
    // 1. Insert test student
    const studentRes = await db.insert(students).values({
      walletAddress: testStudentWallet,
      fullName: "Test Student Seeding",
      studentId: testStudentId,
      universityId: 1,
      status: "approved",
      email: testStudentEmail,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning()
    createdStudentId = studentRes[0].id
    
    // 2. Insert test transcript
    const studentH = sql`keccak256(encodePacked(["address"], [${testStudentWallet}]))`
    const txRes = await db.insert(transcripts).values({
      recordId: testRecordId,
      studentHash: "0xee8aa40ed9464dd4c1280680af8609c2263df3a4adad515998e31a20b0a0c624", // matches viem test StudentHash
      metadataCid: "QmTestMetadataSeeded",
      fileHash: "0xbd60604bc417117eba312956e19e2151d0e6cf9953a45326ca0842ce59c8bb1a",
      issuer: "0x6912bc40f1446dd8a2201f797f2c09dca3ceb88c",
      registryAddr: testRegistryAddr,
      universityId: 0,
      issuedAt: new Date(),
      status: "Active"
    }).returning()
    createdTranscriptId = txRes[0].id

    return `Student DB ID: ${createdStudentId}, Transcript DB ID: ${createdTranscriptId}`
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. HEALTH / REACHABILITY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(bold("\n━━━ 1. SERVER REACHABILITY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

  await test("Backend is running and reachable", async () => {
    const { res } = await apiGet("/api/universities")
    assert(res.ok, `Server returned ${res.status}`)
    return `HTTP ${res.status}`
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. UNIVERSITIES
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(bold("\n━━━ 2. UNIVERSITIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

  let universitiesList = []
  await test("GET /api/universities — returns array", async () => {
    const { res, data } = await apiGet("/api/universities")
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(Array.isArray(data), "Response is not an array")
    universitiesList = data
    return `${data.length} universities`
  })

  await test("GET /api/universities/:id — returns university details", async () => {
    assert(universitiesList.length > 0, "No universities found")
    const u = universitiesList[0]
    const { res, data } = await apiGet(`/api/universities/${u.universityId}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.name === u.name, "Name mismatch")
    return `"${data.name}"`
  })

  await test("GET /api/universities/by-address/:addr — returns university by contract address", async () => {
    assert(universitiesList.length > 0, "No universities found")
    const u = universitiesList[0]
    const { res, data } = await apiGet(`/api/universities/by-address/${u.contractAddr}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    return `"${data.name}"`
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. STUDENTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(bold("\n━━━ 3. STUDENTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

  await test("POST /api/students — creates a student registration request", async () => {
    const freshWallet = `0xstudfresh${Date.now().toString(16)}`.slice(0, 42).padEnd(42, "0").toLowerCase()
    const { res, data } = await apiPost("/api/students", {
      walletAddress: freshWallet,
      fullName: "Fresh Graduate Test",
      studentId: `ST-${Date.now()}`,
      universityId: 1,
      email: `fresh-${Date.now()}@test.edu`
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.status === "pending", `Expected pending status, got ${data.status}`)
    
    // Clean up this temp student
    await db.delete(students).where(eq(students.id, data.id))
    return "Pending request created successfully"
  })

  await test("GET /api/students/profile/:address — returns details for seeded student", async () => {
    const { res, data } = await apiGet(`/api/students/profile/${testStudentWallet}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.fullName === "Test Student Seeding", `Expected name match, got ${data.fullName}`)
    return `Found student "${data.fullName}"`
  })

  await test("GET /api/students/search — finds student by name", async () => {
    const { res, data } = await apiGet(`/api/students/search?q=Seeding`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(Array.isArray(data), "Expected search response to be array")
    assert(data.length > 0, "Expected at least 1 match")
    assert(data[0].walletAddress.toLowerCase() === testStudentWallet.toLowerCase(), "Wallet address mismatch")
    return `Found ${data.length} matches`
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. TRANSCRIPTS
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(bold("\n━━━ 4. TRANSCRIPTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"))

  await test("GET /api/transcripts/:recordId — returns single transcript metadata", async () => {
    const { res, data } = await apiGet(`/api/transcripts/${testRecordId}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.recordId.toLowerCase() === testRecordId.toLowerCase(), "Record ID mismatch")
    return `File Hash: ${data.fileHash}`
  })

  await test("GET /api/transcripts/by-student/:studentHash — returns array of transcripts", async () => {
    // use studentHash that matches the seeded record
    const targetHash = "0xee8aa40ed9464dd4c1280680af8609c2263df3a4adad515998e31a20b0a0c624"
    const { res, data } = await apiGet(`/api/transcripts/by-student/${targetHash}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(Array.isArray(data), "Expected array")
    assert(data.length > 0, "No records found for student hash")
    return `${data.length} transcripts found`
  })

  await test("GET /api/transcripts/by-registry/:addr — returns transcripts on registry contract", async () => {
    const { res, data } = await apiGet(`/api/transcripts/by-registry/${testRegistryAddr}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(Array.isArray(data), "Expected array")
    assert(data.length > 0, "No records found for registry contract")
    return `${data.length} transcripts on contract ${testRegistryAddr.slice(0, 10)}...`
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. THIRD-PARTY INSTITUTIONS PORTAL
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(bold("\n━━━ 5. INSTITUTION PORTAL & CONSENT FLOW ━━━━━━━━━━━━━━━━━"))

  await test("POST /api/institutions/register — registers pending third-party institution", async () => {
    const { res, data } = await apiPost("/api/institutions/register", {
      name: testInstitutionName,
      email: testInstitutionEmail,
      walletAddress: testInstitutionWallet
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.success, "Success flag not true")
    assert(data.institution.status === "pending", "Status should be pending")
    createdInstitutionId = data.institution.id
    return `Pending Inst ID: ${createdInstitutionId}`
  })

  await test("GET /api/institutions/profile/:wallet — shows pending status", async () => {
    const { res, data } = await apiGet(`/api/institutions/profile/${testInstitutionWallet}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.status === "pending", `Expected pending, got ${data.status}`)
    return `Status: ${data.status}`
  })

  await test("GET /api/institutions/pending — retrieves pending whitelist queue", async () => {
    const { res, data } = await apiGet("/api/institutions/pending")
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(Array.isArray(data), "Expected list array")
    const found = data.find(i => i.id === createdInstitutionId)
    assert(found, "Newly registered institution not in pending queue")
    return `Queue size: ${data.length}`
  })

  await test("PUT /api/institutions/:id/approve — platform admin/registrar approves whitelist request", async () => {
    const { res, data } = await apiPut(`/api/institutions/${createdInstitutionId}/approve`, {
      actionBy: "0x6912bc40f1446dd8a2201f797f2c09dca3ceb88c" // KNUST registrar address
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.success, "Success flag not true")
    assert(data.institution.status === "approved", "Status should be approved")
    return `Institution is now whitelisted/approved`
  })

  await test("PUT /api/institutions/update-profile — updates settings (wallet address & email)", async () => {
    const { res, data } = await apiPut("/api/institutions/update-profile", {
      oldWallet: testInstitutionWallet,
      name: testInstitutionName,
      email: updatedInstitutionEmail,
      walletAddress: updatedInstitutionWallet
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.success, "Success flag not true")
    assert(data.institution.email === updatedInstitutionEmail, "Email update failed")
    assert(data.institution.walletAddress.toLowerCase() === updatedInstitutionWallet.toLowerCase(), "Wallet update failed")
    return `Updated wallet: ${updatedInstitutionWallet.slice(0, 12)}...`
  })

  await test("POST /api/institutions/requests — whitelisted institution requests student's transcript", async () => {
    const { res, data } = await apiPost("/api/institutions/requests", {
      institutionId: createdInstitutionId,
      studentName: "Test Student Seeding",
      studentId: testStudentId,
      studentEmail: testStudentEmail
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.success, "Success flag not true")
    assert(data.request.status === "pending", "Request status should be pending")
    createdRequestId = data.request.id
    return `Request ID: ${createdRequestId}`
  })

  await test("GET /api/student/institution-requests/:email — fetches pending releases for student", async () => {
    const { res, data } = await apiGet(`/api/student/institution-requests/${testStudentEmail}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(Array.isArray(data), "Expected array")
    const req = data.find(r => r.id === createdRequestId)
    assert(req, "Release request not found in student queue")
    assert(req.status === "pending", "Status should be pending")
    return `Found pending request from: "${req.institutionName}"`
  })

  await test("PUT /api/student/institution-requests/:id/approve — student approves and releases record ID", async () => {
    const { res, data } = await apiPut(`/api/student/institution-requests/${createdRequestId}/approve`, {
      recordId: testRecordId
    })
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(data.success, "Success flag not true")
    assert(data.request.status === "approved", "Request status should be approved")
    assert(data.request.recordId.toLowerCase() === testRecordId.toLowerCase(), "Record ID not saved")
    return `Consent released for Record ID ${testRecordId.slice(0, 14)}...`
  })

  await test("GET /api/institutions/requests/:wallet — institution fetches requests and gets record ID", async () => {
    const { res, data } = await apiGet(`/api/institutions/requests/${updatedInstitutionWallet}`)
    assert(res.ok, `Expected 200, got ${res.status}`)
    assert(Array.isArray(data), "Expected array")
    const req = data.find(r => r.id === createdRequestId)
    assert(req, "Request not found in institution requests list")
    assert(req.status === "approved", "Expected status approved")
    assert(req.recordId.toLowerCase() === testRecordId.toLowerCase(), "Record ID not received")
    return `Access Granted! Record ID: ${req.recordId.slice(0, 14)}...`
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. TEARDOWN / CLEANUP
  // ─────────────────────────────────────────────────────────────────────────────
  console.log(bold("\n━━━ CLEANUP: DELETING TEST DATABASE RECORDS ━━━━━━━━━━━━━━"))

  await test("Cleanup all seeded test records from DB", async () => {
    // 1. Delete requests
    if (createdRequestId) {
      await db.delete(institutionRequests).where(eq(institutionRequests.id, createdRequestId))
    }
    // 2. Delete institutions
    if (createdInstitutionId) {
      await db.delete(institutions).where(eq(institutions.id, createdInstitutionId))
    }
    // 3. Delete transcripts
    if (createdTranscriptId) {
      await db.delete(transcripts).where(eq(transcripts.id, createdTranscriptId))
    }
    // 4. Delete students
    if (createdStudentId) {
      await db.delete(students).where(eq(students.id, createdStudentId))
    }
    return "All test records successfully removed"
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
    console.log(green(bold("✓ All tests passed successfully!\n")))
    process.exit(0)
  }
}

runTests().catch(e => {
  console.error("Test suite runner crashed:", e)
  process.exit(1)
})
