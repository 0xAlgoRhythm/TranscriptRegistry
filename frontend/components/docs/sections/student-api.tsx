import { CodeBlock, EndpointBadge, ParamTable, Callout } from "@/components/docs/docs-ui"

export function DocsStudentAPI() {
  return (
    <div>
      <div className="section-eyebrow">API Reference</div>
      <h2 className="section-title">Student API</h2>
      <p className="section-lead">
        Endpoints for student onboarding, profile management, and consent
        control over who can access their credentials.
      </p>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/students" />
        <p>
          Register a new student profile. If the student's email or ID matches
          a registrar-whitelisted record, they are <strong>automatically approved</strong>.
          Otherwise, the application is queued for registrar review.
        </p>
        <ParamTable params={[
          { name: "walletAddress", type: "string", required: true, desc: "Student's EVM wallet address." },
          { name: "fullName", type: "string", required: true, desc: "Student's full legal name." },
          { name: "studentId", type: "string", required: true, desc: "University-issued student ID." },
          { name: "universityId", type: "number", required: true, desc: "ID of the university (from /api/universities)." },
          { name: "email", type: "string", required: true, desc: "Student's email address." },
        ]} />
        <CodeBlock lang="bash" label="cURL" code={`curl -X POST https://credaxis.app/api/students \\
  -H "Content-Type: application/json" \\
  -d '{
    "walletAddress": "0xC52A761304DE7DFEea1570361bf190803fF55b6c",
    "fullName": "John Ato Mensah",
    "studentId": "UG/CS/2021/001",
    "universityId": 1,
    "email": "john.mensah@student.ug.edu.gh"
  }'`} />
        <CodeBlock lang="json" label="Response — Auto-Approved" code={`{
  "status": "approved",
  "message": "Onboarding completed. Profile automatically approved via registrar whitelist."
}`} />
        <CodeBlock lang="json" label="Response — Pending Review" code={`{
  "status": "pending",
  "message": "Application submitted. Awaiting registrar approval."
}`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/students/profile/:walletAddress" />
        <p>Get a student's full profile by their wallet address.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/students/profile/0xC52A761304DE7DFEea1570361bf190803fF55b6c`} />
        <CodeBlock lang="json" label="Response" code={`{
  "id": 5,
  "walletAddress": "0xC52A761...",
  "fullName": "John Ato Mensah",
  "studentId": "UG/CS/2021/001",
  "email": "john.mensah@student.ug.edu.gh",
  "universityId": 1,
  "status": "approved",
  "createdAt": "2025-11-20T10:00:00.000Z"
}`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/students/profile/by-email/:email" />
        <p>
          Look up a student by email. Used primarily for the Privy email-auth
          embedded wallet auto-bind flow.
        </p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/students/profile/by-email/john.mensah%40student.ug.edu.gh`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/students/profile-by-id/:studentId" />
        <p>
          Find a student by student ID, email, wallet address, or full name
          (case-insensitive search across all four fields).
        </p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/students/profile-by-id/UG%2FCS%2F2021%2F001`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/students/search?q=:query" />
        <p>
          Full-text search across all student records (name, email, ID, wallet).
          Used by registrars in the dashboard search.
        </p>
        <CodeBlock lang="bash" label="cURL" code={`curl "https://credaxis.app/api/students/search?q=john+mensah"`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="PUT" path="/api/students/:id/self-bind-wallet" />
        <p>
          Students with a Privy embedded wallet (email login) can self-bind
          their wallet to a whitelisted record that has no wallet yet.
        </p>
        <Callout type="warning">
          Can only be called once per record. Once a wallet is bound, it cannot
          be changed by the student — only by a registrar.
        </Callout>
        <ParamTable params={[
          { name: "walletAddress", type: "string", required: true, desc: "New wallet address to bind." },
          { name: "email", type: "string", required: true, desc: "Email must match the whitelisted record." },
        ]} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/student/institution-requests/:email" />
        <p>Returns all institution access requests for a student (by email).</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/student/institution-requests/john.mensah%40student.ug.edu.gh`} />
        <CodeBlock lang="json" label="Response" code={`[
  {
    "id": 88,
    "studentName": "John Ato Mensah",
    "status": "pending",
    "institutionName": "MIT Graduate Admissions",
    "createdAt": "2025-12-05T..."
  }
]`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="PUT" path="/api/student/institution-requests/:id/approve" />
        <p>Student approves an institution's access request. Requires the record ID.</p>
        <ParamTable params={[
          { name: "recordId", type: "string", required: true, desc: "The on-chain record ID the institution is requesting access to." },
        ]} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="PUT" path="/api/student/institution-requests/:id/reject" />
        <p>Student rejects an institution's access request.</p>
      </div>
    </div>
  )
}
