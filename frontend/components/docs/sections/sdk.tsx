import { CodeBlock, Callout } from "@/components/docs/docs-ui"

export function DocsSDK() {
  return (
    <div>
      <div className="section-eyebrow">Integration</div>
      <h2 className="section-title">SDK & Integration Guide</h2>
      <p className="section-lead">
        Step-by-step guides for integrating CredAxis verification into your
        existing systems — whether it's a school management system, HR
        platform, or government portal.
      </p>

      <h3>1. School Management System (LMS) Integration</h3>
      <p>
        If you're a school or university that wants to integrate CredAxis into
        your existing LMS (Moodle, Canvas, etc.), follow these steps:
      </p>

      <div className="integration-steps">
        <div className="integration-step">
          <div className="int-step-header">
            <span className="int-step-num">A</span>
            <h4>Contact CredAxis Admin</h4>
          </div>
          <p>
            Email <a href="mailto:support@credaxis.app">support@credaxis.app</a>{" "}
            to request a university registry deployment. We'll deploy a smart
            contract specifically for your institution.
          </p>
        </div>

        <div className="integration-step">
          <div className="int-step-header">
            <span className="int-step-num">B</span>
            <h4>Whitelist Students via CSV</h4>
          </div>
          <p>
            Upload your student roster using the bulk whitelist endpoint. This
            pre-approves students so they can auto-onboard.
          </p>
          <CodeBlock
            lang="typescript"
            label="Bulk Student Whitelist"
            code={`const response = await fetch("https://credaxis.app/api/students/bulk", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    registrarAddress: "0xYourRegistrarWallet",
    studentsList: [
      { fullName: "Kofi Asante", studentId: "KNUST/EE/2022/001", email: "kofi@student.knust.edu.gh" },
      { fullName: "Ama Osei", studentId: "KNUST/EE/2022/002", email: "ama@student.knust.edu.gh" },
      // ... hundreds of students
    ]
  })
})

const result = await response.json()
// { success: true, processed: 250, details: [...] }`}
          />
        </div>

        <div className="integration-step">
          <div className="int-step-header">
            <span className="int-step-num">C</span>
            <h4>Issue Transcripts via API</h4>
          </div>
          <p>
            When a student graduates, upload their transcript metadata to IPFS
            and register it on-chain through the registrar dashboard or
            programmatically via the IPFS upload API.
          </p>
        </div>
      </div>

      <h3>2. HR / Employer Integration</h3>
      <p>
        Automate transcript verification in your hiring pipeline:
      </p>

      <CodeBlock
        lang="typescript"
        label="HR Platform — Auto-verify Applicant"
        code={`// In your applicant processing pipeline
async function verifyApplicantCredentials(
  studentId: string,
  apiToken: string
) {
  const res = await fetch(
    \`https://credaxis.app/api/public/verify?studentId=\${encodeURIComponent(studentId)}&token=\${apiToken}\`
  )

  if (!res.ok) {
    const err = await res.json()
    return { verified: false, error: err.error, code: err.code }
  }

  const data = await res.json()

  return {
    verified: data.transcript?.status === "Active",
    studentName: data.student?.fullName,
    university: data.university?.name,
    gpa: data.transcript?.fileHash ? "Available via IPFS" : "N/A",
    issuedAt: data.transcript?.issuedAt,
    onChainRecord: data.transcript?.recordId,
  }
}

// Usage in your hiring workflow
const result = await verifyApplicantCredentials(
  "UG/CS/2021/001",
  "ct_your_institutional_token"
)

if (result.verified) {
  console.log(\`✅ \${result.studentName} — verified from \${result.university}\`)
} else {
  console.log(\`❌ Verification failed: \${result.error}\`)
}`}
      />

      <h3>3. Python Integration</h3>
      <CodeBlock
        lang="python"
        label="Python — Verify Transcript"
        code={`import requests

BASE_URL = "https://credaxis.app/api"
API_TOKEN = "ct_your_institutional_token"

def verify_transcript(record_id=None, student_id=None):
    params = {}
    if record_id:
        params["recordId"] = record_id
    elif student_id:
        params["studentId"] = student_id
        params["token"] = API_TOKEN

    resp = requests.get(f"{BASE_URL}/public/verify", params=params)
    resp.raise_for_status()
    data = resp.json()

    return {
        "is_valid": data.get("transcript", {}).get("status") == "Active",
        "student": data.get("student"),
        "university": data.get("university"),
    }

# Verify by record ID (public, no token needed)
result = verify_transcript(record_id="0xaa877681f268...")
print(result["is_valid"])  # True

# Verify by student ID (needs token)
result = verify_transcript(student_id="UG/CS/2021/001")
print(result["student"]["fullName"])  # "John Doe"`}
      />

      <h3>4. Webhook / Batch Processing</h3>
      <CodeBlock
        lang="typescript"
        label="Batch Verification"
        code={`const API_TOKEN = "ct_your_token"
const studentIds = [
  "UG/CS/2021/001",
  "KNUST/EE/2022/045",
  "UCC/BA/2023/012",
]

const results = await Promise.all(
  studentIds.map(async (id) => {
    const res = await fetch(
      \`https://credaxis.app/api/public/verify?studentId=\${encodeURIComponent(id)}&token=\${API_TOKEN}\`
    )
    const data = await res.json()
    return {
      studentId: id,
      verified: data.transcript?.status === "Active",
      name: data.student?.fullName || "Unknown",
    }
  })
)

console.table(results)
// ┌─────────────────────┬──────────┬────────────────┐
// │ studentId           │ verified │ name           │
// ├─────────────────────┼──────────┼────────────────┤
// │ UG/CS/2021/001      │ true     │ John Doe       │
// │ KNUST/EE/2022/045   │ true     │ Ama Osei       │
// │ UCC/BA/2023/012     │ false    │ Unknown        │
// └─────────────────────┴──────────┴────────────────┘`}
      />

      <Callout type="warning">
        <strong>Rate Limits:</strong> The API does not currently enforce strict
        rate limits, but excessive calls ({">"} 1000 req/min) may be throttled.
        For bulk verification, use sequential batches of 50 with a small delay.
      </Callout>
    </div>
  )
}
