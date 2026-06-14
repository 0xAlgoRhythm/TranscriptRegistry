import { CodeBlock, EndpointBadge, ParamTable, Callout } from "@/components/docs/docs-ui"

export function DocsInstitutionAPI() {
  return (
    <div>
      <div className="section-eyebrow">API Reference</div>
      <h2 className="section-title">Institution API</h2>
      <p className="section-lead">
        External institutions — graduate schools, employers, regulators — can
        register on CredAxis to gain API access for requesting and verifying
        student transcripts in bulk.
      </p>

      <Callout type="info">
        Institutions must be <strong>approved by a CredAxis admin</strong> before
        making transcript requests. Registration is free.
      </Callout>

      <h3>Institution Lifecycle</h3>
      <div className="lifecycle-steps">
        <div className="lifecycle-step">
          <span className="lifecycle-num">1</span>
          <span>Register via <code>POST /api/institutions/register</code></span>
        </div>
        <div className="lifecycle-arrow">→</div>
        <div className="lifecycle-step">
          <span className="lifecycle-num">2</span>
          <span>Admin reviews & approves</span>
        </div>
        <div className="lifecycle-arrow">→</div>
        <div className="lifecycle-step">
          <span className="lifecycle-num">3</span>
          <span>Request student transcripts</span>
        </div>
        <div className="lifecycle-arrow">→</div>
        <div className="lifecycle-step success-step">
          <span className="lifecycle-num">4</span>
          <span>Student consents → Access granted</span>
        </div>
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/institutions/register" />
        <p>Register a new institution on the CredAxis platform.</p>
        <ParamTable params={[
          { name: "name", type: "string", required: true, desc: "Official institution name." },
          { name: "email", type: "string", required: true, desc: "Primary contact email for the institution." },
          { name: "walletAddress", type: "string", required: true, desc: "EVM wallet address for the institution." },
        ]} />
        <CodeBlock lang="bash" label="cURL" code={`curl -X POST https://credaxis.app/api/institutions/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "MIT Graduate Admissions",
    "email": "admissions@mit.edu",
    "walletAddress": "0xYourEthAddress"
  }'`} />
        <CodeBlock lang="json" label="Response" code={`{
  "success": true,
  "institution": {
    "id": 12,
    "name": "MIT Graduate Admissions",
    "email": "admissions@mit.edu",
    "walletAddress": "0x...",
    "status": "pending"
  }
}`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/institutions/profile/:wallet" />
        <p>Look up an institution's profile and approval status by wallet address.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/institutions/profile/0xYourEthAddress`} />
        <CodeBlock lang="json" label="Response" code={`{
  "id": 12,
  "name": "MIT Graduate Admissions",
  "email": "admissions@mit.edu",
  "walletAddress": "0x...",
  "status": "approved",
  "actionAt": "2025-12-10T09:00:00.000Z"
}`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/institutions/requests" />
        <p>
          An approved institution requests access to a student's transcript. The
          student receives an email notification and must consent before the
          institution can view full transcript details.
        </p>
        <ParamTable params={[
          { name: "institutionId", type: "number", required: true, desc: "Your institution's ID from the profile endpoint." },
          { name: "studentName", type: "string", required: true, desc: "Student's full name." },
          { name: "studentId", type: "string", required: true, desc: "Student's university ID." },
          { name: "studentEmail", type: "string", required: true, desc: "Student's email address for the consent notification." },
        ]} />
        <CodeBlock lang="bash" label="cURL" code={`curl -X POST https://credaxis.app/api/institutions/requests \\
  -H "Content-Type: application/json" \\
  -d '{
    "institutionId": 12,
    "studentName": "Ama Osei",
    "studentId": "KNUST/EE/2022/045",
    "studentEmail": "ama.osei@student.knust.edu.gh"
  }'`} />
        <CodeBlock lang="json" label="Response" code={`{
  "success": true,
  "request": {
    "id": 88,
    "institutionId": 12,
    "studentName": "Ama Osei",
    "status": "pending"
  }
}`} />
        <Callout type="success">
          The student receives an email with Approve / Deny buttons. On approval,
          the institution receives the record ID and full transcript access for 30 days.
        </Callout>
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/institutions/requests/:wallet" />
        <p>Get all transcript requests made by an institution.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/institutions/requests/0xYourEthAddress`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="PUT" path="/api/institutions/update-profile" />
        <p>Update institution name, email, or wallet address.</p>
        <ParamTable params={[
          { name: "oldWallet", type: "string", required: true, desc: "Current wallet address (used for lookup)." },
          { name: "name", type: "string", required: true, desc: "New institution name." },
          { name: "email", type: "string", required: true, desc: "New email." },
          { name: "walletAddress", type: "string", required: true, desc: "New wallet address." },
        ]} />
      </div>

      {/* Universities */}
      <h3 style={{ marginTop: "2.5rem" }}>University Registry Endpoints</h3>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/universities" />
        <p>Returns all registered universities and their smart contract addresses.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/universities`} />
        <CodeBlock lang="json" label="Response (array)" code={`[
  {
    "universityId": 1,
    "name": "Kwame Nkrumah University of Science and Technology",
    "contractAddr": "0x0487722E60f437F5588BC97501177d1384c84E19",
    "registrar": "0x6912bC40f1446Dd8A2201F797f2c09dca3CeB88c",
    "registrarEmail": "registrar@knust.edu.gh",
    "isActive": true,
    "deployedAt": "2025-11-15T08:00:00.000Z",
    "txHash": "0x..."
  }
]`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/universities/by-address/:addr" />
        <p>Resolve a university by its registry smart contract address.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/universities/by-address/0x0487722E60f437F5588BC97501177d1384c84E19`} />
      </div>

      <h3 style={{ marginTop: "2.5rem" }}>Registrar Abstraction Endpoints (Hybrid State)</h3>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/cohort-codes" />
        <p>Generates a new Cohort Invite Code, allowing mass student self-onboarding.</p>
        <ParamTable params={[
          { name: "registrarAddress", type: "string", required: true, desc: "The wallet address of the issuing registrar." },
          { name: "cohortName", type: "string", required: true, desc: "Name of the cohort (e.g. Class of 2026 - CS)." },
          { name: "maxUses", type: "number", required: false, desc: "Maximum number of times this code can be used." }
        ]} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/registrar/otp/request" />
        <p>Requests a time-locked, 6-digit OTP to be sent to the registrar's pegged email address. Used for fast-track batch approvals without a Web3 wallet.</p>
        <ParamTable params={[
          { name: "email", type: "string", required: true, desc: "The authenticated registrar email." }
        ]} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/registrar/otp/verify-and-approve" />
        <p>Verifies the 6-digit OTP and natively batch-updates pending student statuses to approved in the PostgreSQL state.</p>
        <ParamTable params={[
          { name: "email", type: "string", required: true, desc: "The registrar email." },
          { name: "otp", type: "string", required: true, desc: "The 6-digit OTP code." },
          { name: "targetWalletAddresses", type: "array", required: true, desc: "Array of student wallet addresses to approve." }
        ]} />
      </div>
    </div>
  )
}
