import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import pg from "pg";
import dotenv from "dotenv";

// Load environment variables from root
import path from "path";
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

  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("CredAxis MCP Server running on stdio");
}

main().catch(console.error);
