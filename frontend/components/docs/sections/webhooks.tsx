import { Callout } from "@/components/docs/docs-ui"

export function DocsWebhooks() {
  return (
    <div>
      <div className="section-eyebrow">Notifications</div>
      <h2 className="section-title">Webhooks & Email Notifications</h2>
      <p className="section-lead">
        CredAxis sends automated email notifications at every critical step in
        the credential lifecycle. These replace the need for manual follow-up
        and ensure all parties stay informed.
      </p>

      <h3>Email Notification Triggers</h3>

      <div className="webhook-grid">
        <div className="webhook-card">
          <div className="webhook-icon">📝</div>
          <h4>Student Onboarding Request</h4>
          <p>
            <strong>Recipient:</strong> Registrar / Admin<br />
            <strong>Trigger:</strong> Student submits a profile via <code>POST /api/students</code><br />
            <strong>Contains:</strong> Student name, ID, email, university. One-click Approve/Reject buttons.
          </p>
        </div>

        <div className="webhook-card">
          <div className="webhook-icon">✅</div>
          <h4>Application Approved</h4>
          <p>
            <strong>Recipient:</strong> Student<br />
            <strong>Trigger:</strong> Registrar clicks "Approve" (email or dashboard)<br />
            <strong>Contains:</strong> Confirmation with link to student dashboard.
          </p>
        </div>

        <div className="webhook-card">
          <div className="webhook-icon">❌</div>
          <h4>Application Rejected</h4>
          <p>
            <strong>Recipient:</strong> Student<br />
            <strong>Trigger:</strong> Registrar clicks "Reject"<br />
            <strong>Contains:</strong> Rejection notice with guidance to contact admin.
          </p>
        </div>

        <div className="webhook-card">
          <div className="webhook-icon">📜</div>
          <h4>Transcript Secured (Auto-Delivery)</h4>
          <p>
            <strong>Recipient:</strong> Student<br />
            <strong>Trigger:</strong> Student requests transcript and an active one exists on-chain<br />
            <strong>Contains:</strong> Transcript details (name, major, GPA) with a "View Transcript" link.
          </p>
        </div>

        <div className="webhook-card">
          <div className="webhook-icon">🔔</div>
          <h4>Transcript Request (No Active Record)</h4>
          <p>
            <strong>Recipient:</strong> Registrar<br />
            <strong>Trigger:</strong> Student requests transcript but none exists on-chain<br />
            <strong>Contains:</strong> Student details with "Issue Transcript Now" button.
          </p>
        </div>

        <div className="webhook-card">
          <div className="webhook-icon">🔒</div>
          <h4>Access Request (External Verifier)</h4>
          <p>
            <strong>Recipient:</strong> Student<br />
            <strong>Trigger:</strong> Verifier calls <code>POST /api/public/request-access</code><br />
            <strong>Contains:</strong> Requester details with Approve/Deny buttons. Access valid for 30 days.
          </p>
        </div>

        <div className="webhook-card">
          <div className="webhook-icon">🏢</div>
          <h4>Institution Access Request</h4>
          <p>
            <strong>Recipient:</strong> Student<br />
            <strong>Trigger:</strong> Approved institution calls <code>POST /api/institutions/requests</code><br />
            <strong>Contains:</strong> Institution name and link to manage access permissions in the dashboard.
          </p>
        </div>

        <div className="webhook-card">
          <div className="webhook-icon">🔓</div>
          <h4>Access Granted</h4>
          <p>
            <strong>Recipient:</strong> External verifier<br />
            <strong>Trigger:</strong> Student approves access request<br />
            <strong>Contains:</strong> Unique link to view the full verified transcript (30-day expiry).
          </p>
        </div>
      </div>

      <Callout type="info">
        <strong>Email Provider:</strong> All emails are sent via SMTP (Gmail or
        custom SMTP configured by the admin). Styled in the CredAxis dark
        fintech template. You can customize the branding by forking the email
        template in <code>backend/utils/email.ts</code>.
      </Callout>

      <h3>One-Click Email Actions</h3>
      <p>
        Several emails include <strong>one-click action buttons</strong> that
        call backend endpoints directly from the email:
      </p>
      <table className="param-table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Endpoint</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Approve Student</td>
            <td><code>GET /api/students/approve-via-token?token=...</code></td>
            <td>Registrar one-click approves a student from email.</td>
          </tr>
          <tr>
            <td>Reject Student</td>
            <td><code>GET /api/students/reject-via-token?token=...</code></td>
            <td>Registrar one-click rejects from email.</td>
          </tr>
          <tr>
            <td>Approve Access</td>
            <td><code>GET /api/public/access-requests/approve?token=...</code></td>
            <td>Student one-click approves verifier access from email.</td>
          </tr>
          <tr>
            <td>Reject Access</td>
            <td><code>GET /api/public/access-requests/reject?token=...</code></td>
            <td>Student one-click rejects verifier access from email.</td>
          </tr>
        </tbody>
      </table>

      <Callout type="warning">
        Tokens used in email links are <strong>single-use</strong> and tied to
        the specific request. They cannot be reused after the action is taken.
      </Callout>
    </div>
  )
}
