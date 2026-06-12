# Model Context Protocol (MCP) Server

**Date:** June 2026
**Ecosystem Component:** AI Agent Integration Layer

## Overview
CredAxis includes a built-in **Model Context Protocol (MCP)** server. The MCP server is a Node.js-based service that allows external, locally running AI Agents (such as Claude Desktop) to connect to the CredAxis PostgreSQL database securely.

By providing standardized tools over a Server-Sent Events (SSE) connection stream, AI agents can parse transcripts, verify on-chain statuses, and query platform analytics directly from their prompt windows without needing separate API integrations.

---

## 🔒 Security & Compliance
For maximum research compliance and to prevent unauthorized mutations of on-chain credentials, the CredAxis MCP server is engineered as **Strictly Read-Only**.

AI agents connected via the MCP cannot:
- Approve or reject student applications.
- Mint, issue, or revoke transcripts.
- Modify platform analytics.

If write-access is ever required in the future, it must be gated behind explicit human-in-the-loop (HITL) approval mechanics.

---

## 🛠️ Architecture
The MCP Server resides in the `/mcp` directory at the project root and functions as an independent Express.js API.

- **Dependencies:** `@modelcontextprotocol/sdk`, `express`, `pg` (PostgreSQL Client), `dotenv`.
- **Communication:** Server-Sent Events (SSE). Exposes endpoints `/sse` and `/message`.
- **Data Source:** Connects directly to the `transcriptchain` database defined by the root `.env` file.

---

## 🤖 Available AI Tools
When an AI agent connects to the CredAxis MCP server, it gains access to the following native tools:

### 1. `get_platform_stats`
**Description:** Retrieves platform metrics including total active universities, total verified transcripts, and total registered students.
**Inputs:** `None`
**Usage Scenario:** An AI agent generating a health report or an executive summary of the CredAxis network's current footprint.

### 2. `lookup_student`
**Description:** Look up a student's verification status, email, and associated university ID by using their wallet address or email.
**Inputs:** 
- `identifier` (string): The student's `0x...` wallet address OR email address.
**Usage Scenario:** Checking if a specific student account has been successfully approved by the university registrar yet.

### 3. `check_transcript`
**Description:** Check a transcript's on-chain status (Active/Revoked/Amended) and timestamp using its unique Record ID hash.
**Inputs:**
- `recordId` (string): The 32-byte hex hash of the transcript record ID.
**Usage Scenario:** Validating whether an external transcript PDF or hash is actively valid or if the issuing institution has revoked it.

---

### Remote Hosting
Because the server operates over SSE rather than local `stdio`, you can host this Express app on Render, Vercel, or AWS.

### Claude Desktop Integration
If you are using Claude Desktop, you can configure it to connect to the remote CredAxis MCP Server. Add the following to your `claude_desktop_config.json`:

```json
{
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
}
```
*Note: Replace `https://api.credaxis.app/sse` with your actual deployment URL.*
