import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from root
dotenv.config({ path: path.join(process.cwd(), "..", ".env") });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:password@localhost:5432/transcriptchain",
});

const server = new Server(
  {
    name: "credaxis-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_platform_stats",
        description: "Retrieve platform metrics including total universities, verified transcripts, and active students.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "lookup_student",
        description: "Lookup a student's verification status by their wallet address or email.",
        inputSchema: {
          type: "object",
          properties: {
            identifier: {
              type: "string",
              description: "The student's wallet address (0x...) or email address.",
            },
          },
          required: ["identifier"],
        },
      },
      {
        name: "check_transcript",
        description: "Check a transcript's on-chain status (Active/Revoked/Amended) using its Record ID hash.",
        inputSchema: {
          type: "object",
          properties: {
            recordId: {
              type: "string",
              description: "The 32-byte hex hash of the transcript record ID.",
            },
          },
          required: ["recordId"],
        },
      },
      {
        name: "check_registrar",
        description: "Check if a wallet address is already linked as a registrar to an existing university to enforce 1-to-1 mapping.",
        inputSchema: {
          type: "object",
          properties: {
            walletAddress: {
              type: "string",
              description: "The wallet address to check.",
            },
          },
          required: ["walletAddress"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_platform_stats") {
    try {
      const uniRes = await pool.query("SELECT COUNT(*) FROM universities WHERE is_active = true");
      const transRes = await pool.query("SELECT COUNT(*) FROM transcripts");
      const studentsRes = await pool.query("SELECT COUNT(*) FROM students");

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              active_universities: parseInt(uniRes.rows[0].count, 10),
              total_transcripts_issued: parseInt(transRes.rows[0].count, 10),
              total_students_registered: parseInt(studentsRes.rows[0].count, 10),
            }, null, 2),
          },
        ],
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }

  if (request.params.name === "lookup_student") {
    const { identifier } = request.params.arguments as any;
    try {
      let query;
      let values;
      
      if (identifier.startsWith("0x")) {
        query = "SELECT wallet_address, full_name, student_id, status, email, university_id FROM students WHERE LOWER(wallet_address) = LOWER($1)";
        values = [identifier];
      } else {
        query = "SELECT wallet_address, full_name, student_id, status, email, university_id FROM students WHERE LOWER(email) = LOWER($1)";
        values = [identifier];
      }

      const res = await pool.query(query, values);
      if (res.rows.length === 0) {
        return { content: [{ type: "text", text: `No student found for identifier: ${identifier}` }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(res.rows[0], null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }

  if (request.params.name === "check_transcript") {
    const { recordId } = request.params.arguments as any;
    try {
      const res = await pool.query(
        "SELECT record_id, status, issued_at, registry_addr, issuer FROM transcripts WHERE record_id = $1",
        [recordId]
      );
      
      if (res.rows.length === 0) {
        return { content: [{ type: "text", text: `No transcript found with Record ID: ${recordId}` }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify(res.rows[0], null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }

  if (request.params.name === "check_registrar") {
    const { walletAddress } = request.params.arguments as any;
    try {
      const res = await pool.query(
        "SELECT university_id, name FROM universities WHERE LOWER(registrar) = LOWER($1)",
        [walletAddress]
      );
      
      if (res.rows.length === 0) {
        return { content: [{ type: "text", text: `Wallet ${walletAddress} is not linked to any university.` }] };
      }

      return {
        content: [{ type: "text", text: JSON.stringify({ isLinked: true, university: res.rows[0] }, null, 2) }],
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// Express Setup
const app = express();
app.use(cors());

let transport: SSEServerTransport | null = null;

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CredAxis MCP Server</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; max-width: 600px; padding: 2rem; background: #1e293b; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #334155; }
        h1 { color: #38bdf8; margin-top: 0; }
        p { line-height: 1.6; color: #cbd5e1; }
        code { background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; color: #a78bfa; font-family: monospace; }
        .status { display: inline-block; padding: 0.25rem 0.75rem; background: #059669; color: white; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <span class="status">● System Operational</span>
        <h1>CredAxis MCP Server</h1>
        <p>This is the Model Context Protocol (MCP) Integration Server for the CredAxis ecosystem.</p>
        <p>This server operates over Server-Sent Events (SSE) and is strictly read-only.</p>
        <p>To connect your AI Agent (like Claude Desktop), point it to the SSE endpoint:<br><br><code>/sse</code></p>
      </div>
    </body>
    </html>
  `);
});

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
  console.log("SSE Client Connected");
});

app.post("/message", express.json(), async (req, res) => {
  if (!transport) {
    res.status(400).send("No active SSE connection");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`CredAxis Hosted MCP Server listening on port ${PORT}`);
  console.log(`SSE URL: http://localhost:${PORT}/sse`);
});
