import { Callout } from "@/components/docs/docs-ui"

export function DocsIntro() {
  return (
    <div>
      <div className="section-eyebrow">Documentation</div>
      <h1 className="section-title">CredAxis Developer Docs</h1>
      <p className="section-lead">
        CredAxis is an on-chain academic credential infrastructure built on{" "}
        <strong>Base (EVM)</strong>. Universities deploy their own Registry smart
        contracts to issue tamper-proof transcripts. External parties — employers,
        graduate schools, regulators — verify credentials instantly without
        contacting the institution.
      </p>

      <Callout type="info">
        <strong>Base URL:</strong> All API calls go through{" "}
        <code>https://credaxis.app/api</code> — the Render backend is proxied
        and never exposed publicly.
      </Callout>

      <div className="intro-grid">
        <div className="intro-card">
          <div className="intro-card-icon">🏛️</div>
          <h3>For Institutions</h3>
          <p>
            Universities & schools deploy a Registry contract, whitelist
            students, and issue on-chain transcripts with one click. The
            registrar dashboard handles everything.
          </p>
        </div>
        <div className="intro-card">
          <div className="intro-card-icon">🎓</div>
          <h3>For Students</h3>
          <p>
            Students connect their wallet, request their transcript, and share
            a cryptographic proof link with anyone. No PDFs that can be faked.
          </p>
        </div>
        <div className="intro-card">
          <div className="intro-card-icon">🔍</div>
          <h3>For Verifiers</h3>
          <p>
            Employers, graduate schools, or HR systems call our Verify API with
            a record ID or student ID and receive instant, on-chain
            confirmation.
          </p>
        </div>
        <div className="intro-card">
          <div className="intro-card-icon">🛠️</div>
          <h3>For Developers</h3>
          <p>
            Integrate CredAxis into your LMS, HR platform, or verification
            portal with our REST API and institutional API tokens.
          </p>
        </div>
      </div>

      <h2>Platform Architecture</h2>
      <div className="arch-diagram">
        <div className="arch-row">
          <div className="arch-box accent">University Registrar</div>
          <div className="arch-arrow">→</div>
          <div className="arch-box">Registry Smart Contract<br /><span className="arch-sub">Base L2 (EVM)</span></div>
          <div className="arch-arrow">→</div>
          <div className="arch-box">On-Chain Event Indexer<br /><span className="arch-sub">Hono + PostgreSQL</span></div>
        </div>
        <div className="arch-row">
          <div className="arch-box">Student Wallet</div>
          <div className="arch-arrow">→</div>
          <div className="arch-box">IPFS (Pinata)<br /><span className="arch-sub">Metadata + PDF Hash</span></div>
          <div className="arch-arrow">→</div>
          <div className="arch-box accent">CredAxis REST API<br /><span className="arch-sub">credaxis.app/api</span></div>
        </div>
        <div className="arch-row">
          <div className="arch-box">External Verifier</div>
          <div className="arch-arrow">→</div>
          <div className="arch-box accent">Verify Endpoint<br /><span className="arch-sub">GET /api/public/verify</span></div>
          <div className="arch-arrow">→</div>
          <div className="arch-box success">Instant Result ✓</div>
        </div>
      </div>

      <h2>Authentication</h2>
      <p>
        Most read endpoints are <strong>public</strong> and require no
        authentication. Write operations and private data endpoints require a{" "}
        <strong>Privy JWT</strong> (for registered users) or a{" "}
        <strong>CredAxis institutional API token</strong> (prefixed{" "}
        <code>ct_</code>) passed as a Bearer token.
      </p>
      <div className="auth-methods">
        <div className="auth-method">
          <code className="auth-tag">Public</code>
          <p>No token required. Read-only access to public registry data.</p>
        </div>
        <div className="auth-method">
          <code className="auth-tag">Privy JWT</code>
          <p>Issued on login via Privy. Required for student & registrar write actions.</p>
        </div>
        <div className="auth-method">
          <code className="auth-tag">ct_ token</code>
          <p>Institutional API key. Issued by admin. Used for server-to-server verification.</p>
        </div>
      </div>
    </div>
  )
}
