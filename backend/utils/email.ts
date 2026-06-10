export function generateEmailTemplate(title: string, messageHtml: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #0b0b0f; /* --ca-bg */
          color: #fafafa;
        }
        .wrapper {
          width: 100%;
          table-layout: fixed;
          background-color: #0b0b0f;
          padding: 40px 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #131317; /* --ca-surface */
          border: 1px solid rgba(255, 255, 255, 0.08); /* --ca-border */
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px -8px rgba(0, 0, 0, 0.6);
        }
        .header {
          padding: 32px 24px;
          text-align: center;
          background: linear-gradient(135deg, rgba(108, 91, 240, 0.1) 0%, transparent 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #ffffff;
        }
        .header span {
          color: #8b5cf6; /* --ca-accent */
        }
        .content {
          padding: 40px 32px;
          line-height: 1.6;
          font-size: 15px;
          color: #d4d4d8; /* --ca-text-2 */
        }
        .content p {
          margin: 0 0 20px 0;
        }
        .content h2 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 24px;
          letter-spacing: -0.01em;
        }
        .content strong {
          color: #ffffff;
        }
        .details-box {
          background-color: #1a1a21; /* --ca-surface-3 */
          border: 1px solid rgba(139, 92, 246, 0.3); /* --ca-border-accent */
          border-radius: 8px;
          padding: 24px;
          margin: 32px 0;
          box-shadow: 0 0 32px -8px rgba(139, 92, 246, 0.25); /* --ca-shadow-accent */
        }
        .details-box p {
          margin: 12px 0;
          font-size: 14px;
        }
        .details-box p:last-child {
          margin-bottom: 0;
        }
        .details-box p:first-child {
          margin-top: 0;
        }
        .details-box span.label {
          display: inline-block;
          width: 130px;
          color: #a1a1aa;
          text-transform: uppercase;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.1em;
        }
        .button-container {
          text-align: center;
          margin-top: 40px;
          margin-bottom: 10px;
        }
        .button {
          display: inline-block;
          background-color: #8b5cf6; /* --ca-accent */
          color: #ffffff;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.02em;
          box-shadow: 0 4px 12px -2px rgba(139, 92, 246, 0.4);
        }
        .footer {
          padding: 24px 32px;
          text-align: center;
          font-size: 12px;
          color: #71717a; /* --ca-muted */
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background-color: #0b0b0f;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>Cred<span>Axis</span></h1>
          </div>
          <div class="content">
            ${messageHtml}
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CredAxis Transcripts. Powered by Base Sepolia.</p>
            <p>This is an automated system notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
