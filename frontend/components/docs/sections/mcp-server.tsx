import { CodeBlock } from "../docs-ui"

export function DocsMCPServer() {
  return (
    <div className="docs-content-wrapper animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      <div className="docs-badge">AI Integration</div>
      <h2 className="docs-heading">Model Context Protocol (MCP) Server</h2>

      <p className="docs-text">
        CredAxis provides a built-in <strong>Model Context Protocol (MCP) Server</strong>, allowing AI agents (such as Claude Desktop or custom LangChain agents) to query the CredAxis ecosystem securely over standard I/O streams.
      </p>

      <p className="docs-text">
        The MCP Server is specifically designed to be <strong>Strictly Read-Only</strong>. This ensures that autonomous agents cannot mint transcripts or approve student applications, preserving maximum security and research compliance.
      </p>

      <h3 className="docs-subheading mt-10">Available AI Tools</h3>
      <p className="docs-text">
        Once connected, your AI agents gain access to the following native tools:
      </p>

      <ul className="docs-list mt-4">
        <li>
          <strong><code className="docs-code-inline text-ca-accent">get_platform_stats</code></strong>
          <p className="text-sm mt-1 mb-2">Retrieves platform metrics including total active universities, total verified transcripts, and total registered students.</p>
        </li>
        <li>
          <strong><code className="docs-code-inline text-ca-accent">lookup_student</code></strong>
          <p className="text-sm mt-1 mb-2">Look up a student's verification status, email, and associated university ID by passing an <code className="docs-code-inline">identifier</code> (wallet address or email).</p>
        </li>
        <li>
          <strong><code className="docs-code-inline text-ca-accent">check_transcript</code></strong>
          <p className="text-sm mt-1">Check a transcript's on-chain status (Active/Revoked/Amended) by passing its <code className="docs-code-inline">recordId</code> hash.</p>
        </li>
      </ul>

      <h3 className="docs-subheading mt-10">Remote Hosting & Connections (SSE)</h3>
      <p className="docs-text">
        The MCP Server operates over Server-Sent Events (SSE), making it perfect for remote hosting (e.g. Render, Vercel). 
      </p>

      <p className="docs-text">
        When the server is running, you can connect your AI Agent to the exposed endpoint:
      </p>

      <CodeBlock
        language="bash"
        code={`https://api.credaxis.app/sse`}
      />

      <p className="docs-text mt-6">
        To configure Claude Desktop to connect to a remotely hosted CredAxis MCP Server, add the following to your <code className="docs-code-inline">claude_desktop_config.json</code>:
      </p>

      <CodeBlock
        language="json"
        code={`{
  "mcpServers": {
    "credaxis": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/inspector",
        "https://api.credaxis.app/sse"
      ]
    }
  }
}`}
      />
    </div>
  )
}
