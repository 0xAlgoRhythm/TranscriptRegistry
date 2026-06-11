import { CodeBlock, EndpointBadge, ParamTable, Callout } from "@/components/docs/docs-ui"

export function DocsTranscriptAPI() {
  return (
    <div>
      <div className="section-eyebrow">API Reference</div>
      <h2 className="section-title">Transcript API</h2>
      <p className="section-lead">
        Endpoints for reading transcript records indexed from on-chain events.
        All transcript data is sourced from the Base blockchain indexer.
      </p>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/transcripts/:recordId" />
        <p>Fetch a single transcript by its on-chain record ID.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/transcripts/0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987`} />
        <CodeBlock lang="json" label="Response" code={`{
  "id": 1,
  "recordId": "0xaa877681...",
  "studentHash": "0x...",
  "fileHash": "0x...",
  "registryAddr": "0x0487722E...",
  "issuer": "0x6912bC40...",
  "issuedAt": "2025-12-01T10:00:00.000Z",
  "status": "Active",
  "universityId": 1
}`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/transcripts/by-student/:studentHash" />
        <p>
          Returns all transcripts for a student identified by their{" "}
          <code>studentHash</code> (keccak256 of the student's wallet address).
        </p>
        <Callout type="info">
          Compute <code>studentHash</code>:{" "}
          <code>keccak256(abi.encodePacked(walletAddress))</code>
        </Callout>
        <CodeBlock
          lang="typescript"
          label="Compute studentHash in JS"
          code={`import { keccak256, encodePacked } from "viem"

const studentHash = keccak256(
  encodePacked(["address"], ["0xC52A761304DE7DFEea1570361bf190803fF55b6c"])
)
// → "0xdef456abc..."`}
        />
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/transcripts/by-student/0xdef456abc...`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/transcripts/by-registrar/:address" />
        <p>Returns all transcripts issued by a registrar address.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/transcripts/by-registrar/0x6912bC40f1446Dd8A2201F797f2c09dca3CeB88c`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/transcripts/by-registry/:addr" />
        <p>Returns all transcripts issued through a specific registry contract address.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/transcripts/by-registry/0x0487722E60f437F5588BC97501177d1384c84E19`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/transcripts/request" />
        <p>
          A student submits a request for their transcript. If an active
          transcript already exists on-chain, it is auto-delivered by email.
          If not, the registrar is notified to issue one.
        </p>
        <ParamTable params={[
          { name: "studentWallet", type: "string", required: true, desc: "The student's EVM wallet address." },
          { name: "email", type: "string", required: false, desc: "Student email (optional override)." },
        ]} />
        <CodeBlock lang="bash" label="cURL" code={`curl -X POST https://credaxis.app/api/transcripts/request \\
  -H "Content-Type: application/json" \\
  -d '{
    "studentWallet": "0xC52A761304DE7DFEea1570361bf190803fF55b6c"
  }'`} />
        <CodeBlock lang="json" label="Response — Auto-Delivered" code={`{
  "status": "sent",
  "message": "Official transcript found! A verification receipt has been emailed to you."
}`} />
        <CodeBlock lang="json" label="Response — Queued" code={`{
  "status": "requested",
  "message": "Transcript request submitted to your university registrar."
}`} />
        <Callout type="warning">
          Rate limit: <strong>3 requests per 6 months</strong> per student (semester quota).
        </Callout>
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/ipfs/metadata/:cid" />
        <p>Returns the full IPFS metadata JSON pinned to Pinata for a given CID.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl https://credaxis.app/api/ipfs/metadata/bafybeig...`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/ipfs/upload" auth />
        <p>
          Upload transcript metadata to IPFS via Pinata. Only authenticated
          registrars can call this. Returns the CID and gateway URL.
        </p>
        <Callout type="info">
          Requires a <strong>Privy JWT</strong> in the Authorization header.
        </Callout>
        <ParamTable params={[
          { name: "studentAddress", type: "string", required: true, desc: "Student wallet address." },
          { name: "studentName", type: "string", required: true, desc: "Full student name." },
          { name: "studentId", type: "string", required: true, desc: "University student ID." },
          { name: "universityName", type: "string", required: true, desc: "Name of the university." },
          { name: "registryAddress", type: "string", required: true, desc: "Registry contract address." },
          { name: "gpa", type: "string", required: false, desc: "Cumulative GPA (e.g. '3.85')." },
          { name: "major", type: "string", required: false, desc: "Degree program / major." },
          { name: "gradYear", type: "string", required: false, desc: "Year of graduation." },
          { name: "fileHash", type: "string", required: false, desc: "SHA-256 hash of the PDF document." },
        ]} />
      </div>
    </div>
  )
}
