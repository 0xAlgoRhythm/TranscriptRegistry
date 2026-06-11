export function DocsErrorCodes() {
  return (
    <div>
      <div className="section-eyebrow">Reference</div>
      <h2 className="section-title">Error Codes & Responses</h2>
      <p className="section-lead">
        All API errors return a JSON object with an <code>error</code> field
        and an HTTP status code. Some endpoints also include a <code>code</code>{" "}
        field for programmatic error handling.
      </p>

      <h3>HTTP Status Codes</h3>
      <table className="param-table error-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Meaning</th>
            <th>Typical Cause</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code className="status-2xx">200</code></td>
            <td>Success</td>
            <td>Request completed. Response body contains the requested data.</td>
          </tr>
          <tr>
            <td><code className="status-4xx">400</code></td>
            <td>Bad Request</td>
            <td>Missing required fields, invalid parameters, or duplicate entry.</td>
          </tr>
          <tr>
            <td><code className="status-4xx">401</code></td>
            <td>Unauthorized</td>
            <td>Missing or invalid Bearer token. JWT expired or malformed.</td>
          </tr>
          <tr>
            <td><code className="status-4xx">403</code></td>
            <td>Forbidden</td>
            <td>Valid auth but insufficient permissions. Or: token expired/invalid for verify endpoint.</td>
          </tr>
          <tr>
            <td><code className="status-4xx">404</code></td>
            <td>Not Found</td>
            <td>Transcript, student, or university record does not exist.</td>
          </tr>
          <tr>
            <td><code className="status-4xx">409</code></td>
            <td>Conflict</td>
            <td>Wallet already bound, duplicate registration.</td>
          </tr>
          <tr>
            <td><code className="status-4xx">429</code></td>
            <td>Too Many Requests</td>
            <td>Semester quota exceeded (max 3 transcript requests per 6 months).</td>
          </tr>
          <tr>
            <td><code className="status-5xx">500</code></td>
            <td>Internal Server Error</td>
            <td>Database or server error. Contact support if persistent.</td>
          </tr>
          <tr>
            <td><code className="status-5xx">502</code></td>
            <td>Bad Gateway</td>
            <td>Pinata/IPFS upstream failure.</td>
          </tr>
          <tr>
            <td><code className="status-5xx">503</code></td>
            <td>Service Unavailable</td>
            <td>Pinata credentials not configured on the server.</td>
          </tr>
        </tbody>
      </table>

      <h3>Verify API Error Codes</h3>
      <p>
        The <code>GET /api/public/verify</code> endpoint returns a <code>code</code>{" "}
        field for specific error conditions:
      </p>
      <table className="param-table error-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>HTTP Status</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>MISSING_PARAMS</code></td>
            <td>400</td>
            <td>Neither <code>recordId</code> nor <code>studentId</code> was provided.</td>
          </tr>
          <tr>
            <td><code>NOT_FOUND</code></td>
            <td>404</td>
            <td>No transcript record matches the given parameters.</td>
          </tr>
          <tr>
            <td><code>INVALID_TOKEN</code></td>
            <td>403</td>
            <td>The provided access token does not exist or has been revoked.</td>
          </tr>
          <tr>
            <td><code>EXPIRED_TOKEN</code></td>
            <td>403</td>
            <td>The token exists but has passed its expiration date.</td>
          </tr>
        </tbody>
      </table>

      <h3>Example Error Response</h3>
      <div className="code-block">
        <div className="code-block-header">
          <span className="code-lang">json</span>
        </div>
        <pre><code>{`// 404 Not Found
{
  "error": "Transcript record not found in the registry.",
  "code": "NOT_FOUND"
}

// 403 Forbidden
{
  "error": "The provided access token is invalid or expired.",
  "code": "INVALID_TOKEN"
}

// 429 Rate Limited
{
  "error": "Semester quota exceeded: You have reached the maximum of 3 official transcript requests for this term."
}

// 400 Bad Request
{
  "error": "Missing required fields"
}`}</code></pre>
      </div>

      <h3>Contact Support</h3>
      <p>
        If you encounter persistent 500 errors or unexpected behaviour, please
        reach out:
      </p>
      <ul className="support-list">
        <li>📧 <a href="mailto:support@credaxis.app">support@credaxis.app</a></li>
        <li>📧 <a href="mailto:info@credaxis.app">info@credaxis.app</a></li>
        <li>🌐 <a href="https://credaxis.app">credaxis.app</a></li>
      </ul>
    </div>
  )
}
