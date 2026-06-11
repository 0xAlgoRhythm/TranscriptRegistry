import { CodeBlock, Callout } from "@/components/docs/docs-ui"

export function DocsQuickstart() {
  return (
    <div>
      <div className="section-eyebrow">Getting Started</div>
      <h2 className="section-title">Quickstart Guide</h2>
      <p className="section-lead">
        Integrate CredAxis transcript verification into your system in under 5
        minutes. No blockchain knowledge required.
      </p>

      <div className="steps">
        <div className="step">
          <div className="step-number">01</div>
          <div className="step-content">
            <h3>Get an API Token (for private lookups)</h3>
            <p>
              Public transcript verification by record ID requires no token.
              For private student ID lookups, request an institutional API token
              from your CredAxis admin or via{" "}
              <a href="mailto:support@credaxis.app">support@credaxis.app</a>.
            </p>
            <Callout type="info">
              Tokens are prefixed <code>ct_</code> and passed as a Bearer token
              in the <code>Authorization</code> header.
            </Callout>
          </div>
        </div>

        <div className="step">
          <div className="step-number">02</div>
          <div className="step-content">
            <h3>Verify a Transcript by Record ID (Public)</h3>
            <p>
              This is the simplest integration — just call the public verify
              endpoint with the transcript's record ID (a 66-character{" "}
              <code>0x</code> hash from the blockchain).
            </p>
            <CodeBlock
              lang="bash"
              label="cURL — Verify by Record ID"
              code={`curl -X GET \\
  "https://credaxis.app/api/public/verify?recordId=0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987"`}
            />
            <CodeBlock
              lang="json"
              label="Response"
              code={`{
  "transcript": {
    "recordId": "0xaa877681...",
    "registryAddr": "0x0487722E...",
    "issuedAt": "2025-12-01T10:00:00.000Z",
    "status": "Active",
    "fileHash": "0xabc123...",
    "studentHash": "0xdef456..."
  },
  "student": {
    "fullName": "John Doe",
    "studentId": "UG/CS/2021/001",
    "walletAddress": "0xC52A..."
  },
  "university": {
    "name": "Kwame Nkrumah University",
    "contractAddr": "0x0487722E...",
    "logoUrl": "https://..."
  },
  "authorizedBy": "Direct QR Code / Record ID Link"
}`}
            />
          </div>
        </div>

        <div className="step">
          <div className="step-number">03</div>
          <div className="step-content">
            <h3>Verify by Student ID (Requires Token)</h3>
            <p>
              To look up a transcript by student ID (instead of the on-chain
              record hash), pass your institutional token.
            </p>
            <CodeBlock
              lang="bash"
              label="cURL — Verify by Student ID"
              code={`curl -X GET \\
  "https://credaxis.app/api/public/verify?studentId=UG/CS/2021/001&token=ct_your_token_here"`}
            />
          </div>
        </div>

        <div className="step">
          <div className="step-number">04</div>
          <div className="step-content">
            <h3>JavaScript / TypeScript Integration</h3>
            <CodeBlock
              lang="typescript"
              label="TypeScript — Verify Transcript"
              code={`const BASE_URL = "https://credaxis.app/api"

async function verifyTranscript(recordId: string) {
  const res = await fetch(
    \`\${BASE_URL}/public/verify?recordId=\${recordId}\`
  )

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || "Verification failed")
  }

  const data = await res.json()
  
  // data.transcript.status === "Active" means valid
  return {
    isValid: data.transcript?.status === "Active",
    student: data.student,
    university: data.university,
    issuedAt: data.transcript?.issuedAt,
  }
}

// Usage
const result = await verifyTranscript("0xaa877681...")
console.log(result.isValid)    // true
console.log(result.student)    // { fullName: "John Doe", ... }`}
            />
          </div>
        </div>

        <div className="step">
          <div className="step-number">05</div>
          <div className="step-content">
            <h3>Register Your Institution</h3>
            <p>
              To request transcripts on behalf of your organisation, register as
              an institution:
            </p>
            <CodeBlock
              lang="bash"
              label="cURL — Register Institution"
              code={`curl -X POST https://credaxis.app/api/institutions/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Acme Graduate School",
    "email": "admissions@acme.edu",
    "walletAddress": "0xYourWalletAddress"
  }'`}
            />
            <Callout type="warning">
              After registration, your institution will be reviewed by a CredAxis
              admin. You will receive an email upon approval.
            </Callout>
          </div>
        </div>
      </div>
    </div>
  )
}
