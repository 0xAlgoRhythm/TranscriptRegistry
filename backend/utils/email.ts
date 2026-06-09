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
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #09090b;
          color: #fafafa;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          overflow: hidden;
        }
        .header {
          background-color: #09090b;
          padding: 24px;
          text-align: center;
          border-bottom: 1px solid #27272a;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: #fafafa;
        }
        .header span {
          color: #3b82f6; /* ca-accent color */
        }
        .content {
          padding: 32px 24px;
          line-height: 1.6;
          font-size: 15px;
          color: #a1a1aa;
        }
        .content p {
          margin: 0 0 16px 0;
        }
        .content strong {
          color: #fafafa;
        }
        .details-box {
          background-color: #09090b;
          border: 1px solid #27272a;
          border-radius: 8px;
          padding: 16px;
          margin: 24px 0;
        }
        .details-box p {
          margin: 8px 0;
          font-size: 14px;
        }
        .details-box span.label {
          display: inline-block;
          width: 120px;
          color: #71717a;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.05em;
        }
        .button-container {
          text-align: center;
          margin-top: 32px;
        }
        .button {
          display: inline-block;
          background-color: #fafafa;
          color: #09090b;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
        }
        .footer {
          padding: 24px;
          text-align: center;
          font-size: 12px;
          color: #71717a;
          border-top: 1px solid #27272a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Cred<span>Axis</span></h1>
        </div>
        <div class="content">
          ${messageHtml}
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} CredAxis Protocol. All rights reserved.</p>
          <p>Automated message sent by the Transcript Registry Network.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
