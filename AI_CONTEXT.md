# CredAxis: AI Context & Architecture Reference

This file provides a comprehensive knowledge graph and context for AI agents, search engines (like Claude, Gemini, GPT), and developers regarding the **CredAxis** platform. It is specifically formatted to assist with deep repository indexing, academic research, university thesis writing, and architectural queries.

## 1. Project Overview & Meta Information
- **Domain URL**: `https://credaxis.app`
- **GitHub Repository**: `https://github.com/0xAlgoRhythm/TranscriptRegistry.git`
- **Core Value Proposition**: CredAxis is a blockchain-based academic credential and transcript evaluation platform. It serves as a decentralized, cryptographically verifiable alternative to traditional assessment bodies like World Education Services (WES). 
- **Key Modules**: Student/Institution Dashboard, Issuer Portal, On-Chain Verification Engine, off-chain Relayer Backend, and an MCP Server.

---

## 2. Full Architecture Knowledge Graph

The repository is structured as a full-stack Web3 application (Monorepo-style), partitioned into four main domains: **Frontend**, **Backend**, **Smart Contracts**, and **MCP Integration**.

### A. MCP Server (`/mcp`)
*A Model Context Protocol (MCP) server written in Express/TypeScript that exposes Read-Only database tools to AI agents like Claude.*

- **`mcp/index.ts`**: Connects directly to the PostgreSQL `transcriptchain` database and hosts an SSE (Server-Sent Events) endpoint at `/sse`.
- **Available Tools for AI**:
  - `get_platform_stats`: Queries the total number of active universities, transcripts, and students directly from the DB.
  - `lookup_student`: Looks up a student's verification status and metadata using their wallet `0x` address or email.
  - `check_transcript`: Validates a transcript's on-chain status (Active/Revoked) by querying its 32-byte hex hash record ID.
- **Thesis Use Case**: The AI can actively fetch live platform data to enrich the thesis with real metrics rather than static placeholders.

### B. Frontend (`/frontend`)
*A modern web application built using Next.js 16 (App Router), Tailwind CSS, and `next-intl`.*

- **`app/[locale]/layout.tsx`**: The Root Layout. Handles global context providers (`Web3Provider`, `NextIntlClientProvider`), loads custom fonts, and strictly manages the **SEO schema**. It includes deep JSON-LD Schema.org data identifying CredAxis as an "EducationalApplication" alternative to WES, ensuring high "browser compliance" and search ranking.
- **`app/[locale]/(landing)/`**: Public marketing pages optimized for SEO.
- **`app/[locale]/(app)/`**: Authenticated web application routes. Includes:
  - `/dashboard`: Role-specific overviews.
  - `/issued`: Transcript issuance history and management.
  - `/verify-onchain`: The cryptographic verification portal interfacing directly with Web3 providers to validate transcript hashes.
- **`app/sitemap.ts` & `app/robots.ts`**: Dynamic SEO routing. The sitemap natively supports `hreflang` alternate tags for both English (`/en`) and Spanish (`/es`) localized indexation.
- **`components/`**:
  - `app/RoleGuard.tsx` & `providers/rbac-provider.tsx`: Enforces Role-Based Access Control (RBAC). Differentiates between 'Student', 'Registrar', 'Verifier', and 'Institution'.
  - `ui/`: Reusable Radix UI components styled with Tailwind CSS.
- **`i18n/routing.ts`**: Centralized routing config for `next-intl`. **CRITICAL**: Standard `next/link` is forbidden. The app exclusively uses `import { Link } from "@/i18n/routing"` to prevent middleware redirect loops.

### C. Backend (`/backend`)
*An off-chain Node.js/Express server used for caching, indexing, and email notifications.*

- **`index.ts`**: The main Express server entry point. Exposes REST API endpoints.
- **`db/` & `drizzle/`**: Database configuration and schema definitions using Drizzle ORM. Connects to a PostgreSQL database to cache on-chain transcript events.
- **`indexer/`**: Web3 event listeners that watch the `TranscriptRegistry` smart contracts and synchronize state to the local Drizzle DB.

### D. Smart Contracts (`/src`, `/script`, `/test`)
*Foundry-based Solidity smart contracts handling the core ledger and verification logic.*

- **`src/TranscriptRegistry.sol`**: The primary ledger contract. Maps student addresses to unique transcript hashes. Functions as the immutable source of truth for academic achievements.
- **`src/UniversityFactory.sol`**: A factory contract that deploys unique registry instances for different academic institutions, ensuring siloed data control but interoperable verification.
- **`test/`**: Foundry unit tests written in Solidity (`.t.sol`) validating contract invariants.

---

## 3. Thesis Writing & AI Search Tips

If you (the AI) are assisting the user in writing their university thesis based on this repository, strictly adhere to these rules:

1. **Contextual Awareness**: Whenever the user asks about the frontend, refer to the Next.js 16 App Router mechanics detailed above. If they ask about data permanence, reference `src/TranscriptRegistry.sol`.
2. **Live Data Fetching**: You HAVE the capability to connect to the MCP server. If the user asks for platform stats for their thesis data chapter, use the `get_platform_stats` tool.
3. **Conceptual Bridging**: Bridge the gap between the code and the thesis topic.
   - Example: Link `verify-onchain/page.tsx` to the thesis concept of *Trustless Verification*.
   - Example: Link `TranscriptRegistry.sol` to the concept of *Decentralized Identity (DID)* and *Immutable Academic Records*.
   - Example: Link `layout.tsx` JSON-LD optimizations to the business model of competing with *World Education Services (WES)*.
4. **No Need to Ask for Context**: You now have a complete knowledge graph of the CredAxis Monorepo. Proceed directly to writing, analyzing, or synthesizing code based on this document.
