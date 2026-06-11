import { CodeBlock, EndpointBadge, ParamTable, Callout } from "@/components/docs/docs-ui"

export function DocsVerifyAPI() {
  return (
    <div>
      <div className="section-eyebrow">API Reference</div>
      <h2 className="section-title">Verify API</h2>
      <p className="section-lead">
        The Verify API is the primary public interface for external systems to
        check the authenticity of academic credentials on-chain.
      </p>

      {/* ── Public Verify ── */}
      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/public/verify" />
        <p>
          Verify a transcript by its on-chain <strong>Record ID</strong> or by{" "}
          <strong>Student ID</strong> (with token). Querying by record ID is
          fully public — no token needed. Querying by student ID requires a
          valid institutional token for privacy protection.
        </p>

        <h4>Query Parameters</h4>
        <ParamTable
          params={[
            {
              name: "recordId",
              type: "string",
              required: false,
              desc: "The 0x-prefixed on-chain record ID (keccak256 hash). No token required.",
            },
            {
              name: "studentId",
              type: "string",
              required: false,
              desc: "The university student ID. Requires a valid token parameter.",
            },
            {
              name: "token",
              type: "string",
              required: false,
              desc: "Institutional API key (ct_...) or student-approved access token (req_...).",
            },
          ]}
        />

        <Callout type="warning">
          You must provide either <code>recordId</code> or <code>studentId</code>. Both together defaults to <code>recordId</code>.
        </Callout>

        <h4>Response — Authorized (Full Data)</h4>
        <CodeBlock
          lang="json"
          label="200 OK — Full authorized response"
          code={`{
  "transcript": {
    "recordId": "0xaa877681f268...",
    "registryAddr": "0x0487722E60f4...",
    "studentHash": "0xdef456abc...",
    "fileHash": "0x1234abcdef...",
    "issuedAt": "2025-12-01T10:00:00.000Z",
    "status": "Active",
    "issuer": "0xregistrar_address",
    "universityId": 1
  },
  "student": {
    "fullName": "John Doe",
    "studentId": "UG/CS/2021/001",
    "email": "john.doe@example.com",
    "walletAddress": "0xC52A761..."
  },
  "university": {
    "name": "Kwame Nkrumah University of Science and Technology",
    "contractAddr": "0x0487722E60f4...",
    "logoUrl": "https://ipfs.io/ipfs/...",
    "stampUrl": "https://ipfs.io/ipfs/..."
  },
  "authorizedBy": "Institutional API Key (Acme Graduate School)"
}`}
        />

        <h4>Response — Public Limited (No Token, Student ID Query)</h4>
        <CodeBlock
          lang="json"
          label="200 OK — Limited public response"
          code={`{
  "transcript": {
    "recordId": "0xaa877681f268...",
    "registryAddr": "0x0487722E60f4...",
    "issuedAt": "2025-12-01T10:00:00.000Z",
    "status": "Active"
  },
  "university": {
    "name": "Kwame Nkrumah University",
    "logoUrl": "https://...",
    "contractAddr": "0x0487722E..."
  },
  "requestAccessRequired": true
}`}
        />
      </div>

      {/* ── Request Access ── */}
      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/public/request-access" />
        <p>
          Allows an external verifier (employer, institution) to request
          permission from a student to view their full transcript details. The
          student receives an email and can approve or deny with one click.
        </p>

        <h4>Request Body</h4>
        <ParamTable
          params={[
            { name: "recordId", type: "string", required: true, desc: "The on-chain transcript record ID." },
            { name: "requesterName", type: "string", required: true, desc: "Full name of the requester." },
            { name: "requesterOrg", type: "string", required: true, desc: "Organisation or company name." },
            { name: "requesterEmail", type: "string", required: true, desc: "Email where the access token will be sent upon approval." },
          ]}
        />
        <CodeBlock
          lang="bash"
          label="cURL"
          code={`curl -X POST https://credaxis.app/api/public/request-access \\
  -H "Content-Type: application/json" \\
  -d '{
    "recordId": "0xaa877681f268...",
    "requesterName": "Dr. Mary Asante",
    "requesterOrg": "Accra Graduate School",
    "requesterEmail": "m.asante@agsgh.edu"
  }'`}
        />
        <CodeBlock
          lang="json"
          label="Response"
          code={`{
  "success": true,
  "message": "Verification request sent to student email."
}`}
        />
        <Callout type="success">
          Upon student approval, a time-limited access token is emailed to the requester. Access is valid for <strong>30 days</strong>.
        </Callout>
      </div>

      {/* ── Email Transcript ── */}
      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/public/email-transcript" />
        <p>
          Sends a formatted, verified transcript receipt email directly to any
          email address. Useful for sharing proof without exposing the
          dashboard URL.
        </p>
        <CodeBlock
          lang="bash"
          label="cURL"
          code={`curl -X POST https://credaxis.app/api/public/email-transcript \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "employer@company.com",
    "recordId": "0xaa877681f268...",
    "registryAddress": "0x0487722E60f4...",
    "studentName": "John Doe",
    "studentId": "UG/CS/2021/001",
    "gpa": "3.85",
    "major": "BSc Computer Science",
    "gradYear": "2025",
    "universityName": "KNUST"
  }'`}
        />
      </div>

      {/* ── Stats ── */}
      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/stats/platform" />
        <p>Returns real-time platform statistics.</p>
        <CodeBlock
          lang="json"
          label="Response"
          code={`{
  "totalUniversities": 8,
  "activeUniversities": 6,
  "totalTranscripts": 342,
  "totalVerifications": 1024
}`}
        />
      </div>
    </div>
  )
}
