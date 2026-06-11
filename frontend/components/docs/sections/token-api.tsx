import { CodeBlock, EndpointBadge, ParamTable, Callout } from "@/components/docs/docs-ui"

export function DocsTokenAPI() {
  return (
    <div>
      <div className="section-eyebrow">API Reference</div>
      <h2 className="section-title">API Keys & Tokens</h2>
      <p className="section-lead">
        CredAxis issues institutional API tokens (prefixed <code>ct_</code>) for
        server-to-server verification. Tokens are issued by admins or registrars
        and can be revoked at any time.
      </p>

      <Callout type="info">
        Tokens are long-lived and intended for backend integrations (e.g.,
        an HR system that automatically verifies applicant transcripts). Do NOT
        expose tokens in frontend code or mobile apps.
      </Callout>

      <div className="api-endpoint-block">
        <EndpointBadge method="POST" path="/api/tokens/issue" auth />
        <p>Issue a new institutional API token. Requires Privy JWT authentication.</p>
        <ParamTable params={[
          { name: "institutionName", type: "string", required: true, desc: "Name of the institution receiving the token." },
          { name: "expiresDays", type: "number", required: false, desc: "Token expiry in days. Null = never expires." },
          { name: "issuerAddress", type: "string", required: false, desc: "Wallet address of the issuer (registrar or admin)." },
          { name: "role", type: "string", required: false, desc: "Role of the issuer: 'registrar' or 'admin'." },
        ]} />
        <CodeBlock lang="bash" label="cURL" code={`curl -X POST https://credaxis.app/api/tokens/issue \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <privy_jwt>" \\
  -d '{
    "institutionName": "Accra Employment Agency",
    "expiresDays": 365,
    "issuerAddress": "0xRegistrarAddress",
    "role": "registrar"
  }'`} />
        <CodeBlock lang="json" label="Response" code={`{
  "success": true,
  "token": "ct_x8k2m4n7p9r1j3w5l8q0v1641234567",
  "institutionName": "Accra Employment Agency",
  "expiresAt": "2026-12-01T00:00:00.000Z"
}`} />
        <Callout type="warning">
          <strong>Store the token securely.</strong> It is only shown once. If lost,
          you must revoke and reissue.
        </Callout>
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="GET" path="/api/tokens" auth />
        <p>
          List all issued tokens. Admins see all tokens; registrars see only
          tokens they issued.
        </p>
        <h4>Query Parameters</h4>
        <ParamTable params={[
          { name: "issuerAddress", type: "string", required: false, desc: "Filter by issuer wallet address." },
          { name: "role", type: "string", required: false, desc: "Pass 'admin' to see all tokens." },
        ]} />
        <CodeBlock lang="bash" label="cURL" code={`curl -H "Authorization: Bearer <privy_jwt>" \\
  "https://credaxis.app/api/tokens?role=admin"`} />
      </div>

      <div className="api-endpoint-block">
        <EndpointBadge method="DELETE" path="/api/tokens/:id" auth />
        <p>Revoke (deactivate) an institutional API token by its database ID.</p>
        <CodeBlock lang="bash" label="cURL" code={`curl -X DELETE \\
  -H "Authorization: Bearer <privy_jwt>" \\
  "https://credaxis.app/api/tokens/15?operator=0xAdminAddress"`} />
        <CodeBlock lang="json" label="Response" code={`{
  "success": true,
  "message": "Token revoked successfully"
}`} />
      </div>

      <h3>Using Tokens for Verification</h3>
      <p>
        Once you have a <code>ct_</code> token, use it in the <code>token</code>{" "}
        query parameter of the Verify API:
      </p>
      <CodeBlock lang="bash" label="Verify with token" code={`curl "https://credaxis.app/api/public/verify?studentId=UG/CS/2021/001&token=ct_x8k2m4n7p9r1j3w5l8q0v1641234567"`} />
      <p>
        This grants full access to the student's transcript details (name, GPA,
        major, etc.) without requiring individual student consent — the token
        represents institutional-level trust.
      </p>
    </div>
  )
}
