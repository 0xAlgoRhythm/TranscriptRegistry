# CredAxis: AI Context & Complete Architecture Knowledge Graph

This file is an exhaustive knowledge graph and context map for AI agents, search engines (Claude, Gemini, GPT), and developers regarding the **CredAxis** platform. It is formatted to assist with deep repository indexing, academic research, university thesis writing, and architectural queries.

## 1. Project Overview & Meta Information
- **Project Name**: CredAxis
- **Domain URL**: `https://credaxis.app`
- **GitHub Repository**: `https://github.com/0xAlgoRhythm/TranscriptRegistry.git`
- **Core Value Proposition**: CredAxis is a blockchain-based academic credential and transcript evaluation platform. It serves as a decentralized, cryptographically verifiable alternative to traditional assessment bodies like World Education Services (WES). 
- **Tech Stack Overview**: Next.js 16 (App Router), TailwindCSS, Node.js/Express, Drizzle ORM, PostgreSQL, Solidity, Foundry, Model Context Protocol (MCP).

---

## 2. Complete Module Breakdown (Knowledge Graph)

The Monorepo is partitioned into four major domains: **Frontend**, **Backend**, **Smart Contracts**, and **MCP Integration**.

### A. Frontend (`/frontend`)
*A modern web application built using Next.js 16 (App Router), Tailwind CSS, and `next-intl`.*

- **Routing Structure**:
  - `app/[locale]/layout.tsx`: Root Layout managing global context providers (`Web3Provider`, `NextIntlClientProvider`), font loading, and JSON-LD schema injection (identifies CredAxis as an `EducationalApplication`).
  - `app/[locale]/(landing)/`: Public marketing pages optimized for SEO.
  - `app/[locale]/(app)/dashboard/page.tsx`: The primary authenticated dashboard supporting bulk uploads, individual approvals, OTP Fast-Track approvals, and Cohort Code generation.
  - `app/[locale]/(app)/verify-onchain/page.tsx`: The public portal for trustless, cryptographic verification of transcript hashes directly against the Web3 RPC node.
- **Components & Modals**:
  - `components/app/registrar-otp-modal.tsx`: Enables Registrars to fast-track approve bulk student registrations without needing a Web3 wallet via email OTP.
  - `components/app/cohort-code-modal.tsx`: Enables Registrars to generate shareable `CohortCodes` for student self-serve whitelisting.
- **Performance Optimizations (INP)**:
  - Complex synchronous tasks like `parseCSV` and `handleBatchVerify` are explicitly chunked using `setTimeout(fn, 0)` and `requestAnimationFrame`, preventing main thread locking (Interaction to Next Paint issues) during high-volume array operations.
- **Routing Rules**: Exclusively uses `import { Link } from "@/i18n/routing"` instead of `next/link` to prevent `next-intl` middleware infinite redirects.

### B. Backend (`/backend`)
*An off-chain Node.js/Express server used for high-speed caching, indexing, and email dispatch.*

- **`index.ts`**: The main Express server routing layer. Key API Endpoints:
  - `POST /api/cohort-codes` & `POST /api/students/cohort-signup`: Manages the lifecycle of registrar-generated cohort invite codes for student self-onboarding.
  - `POST /api/registrar/otp/request` & `POST /api/registrar/otp/verify-and-approve`: Manages the generation and verification of time-locked OTP hashes for secure registrar actions.
- **Database Schema (`db/schema.ts`)**:
  - `students`: Tracks pending/approved enrollment requests.
  - `cohort_codes`: Stores active invitation codes mapped to specific `registrarAddress`es.
  - `registrar_otps`: Stores `keccak256` hashes of OTPs linked to a registrar's pegged email.
  - `transcripts`: Caches on-chain transcript metadata.
- **Indexer Service**: Contains Web3 event listeners that watch the `TranscriptRegistry` smart contracts and synchronize state changes to the PostgreSQL DB.

### C. Smart Contracts (`/src`, `/script`, `/test`)
*Foundry-based Solidity smart contracts.*

- **`src/TranscriptRegistry.sol`**: The core ledger. Maps student addresses to unique 32-byte Keccak256 transcript hashes. Acts as the immutable source of truth.
- **`src/UniversityFactory.sol`**: A factory pattern contract deploying independent registry instances for different academic institutions, ensuring siloed control over data sets while maintaining universal interoperability.

### D. MCP Server (`/mcp`)
*A Model Context Protocol server exposing DB tools to AI Agents.*

- **`mcp/index.ts`**: Connects to the PostgreSQL `transcriptchain` DB and hosts an SSE (Server-Sent Events) endpoint.
- **AI Tools Available**:
  - `get_platform_stats`: Retrieves total active universities, transcripts, and students.
  - `lookup_student`: Looks up a student's verification status via wallet address or email.
  - `check_transcript`: Validates a transcript's on-chain status (Active/Revoked).

---

## 3. System Design Decisions (For University Thesis Formulation)

If you (the AI) are assisting the user in writing their final year university thesis on this project, use these architectural decision records:

1. **Decentralized Identity (DID) vs. Centralized Silos**: Traditional bodies like WES suffer from walled gardens. CredAxis places the cryptographic proof of achievement on a public ledger, allowing Trustless Verification by third-party employers without relying on API availability from the university.
2. **Hybrid State Architecture**: 
   - **Why not 100% On-Chain?** High gas fees and UX friction. 
   - **Solution**: The system uses a Postgres backend to manage *pending states*, *cohort signups*, and *OTP verification*. The blockchain is strictly reserved for the final, immutable *Transcript Minting* transaction.
3. **UX Abstraction**: Registrars are traditionally non-technical. The introduction of `Cohort Codes` allows students to self-onboard, and `OTP Bulk Approval` allows registrars to sign off on students using traditional Email verification, abstracting away the need for continuous Web3 Wallet (MetaMask) signing.
4. **Performance Resiliency**: Frontend data processing (like parsing 500+ CSV rows) is chunked to avoid freezing the browser's main thread, a critical accessibility and SEO metric (Interaction to Next Paint).

---

## 4. AI Prompting Rules

1. **No Need to Ask for Context**: You now have a complete knowledge graph of the CredAxis Monorepo. Do not ask the user for permission to read additional files unless specifically debugging a line of code.
2. **Thesis Synthesis**: Directly synthesize chapters of the thesis using the metrics and architectural decisions detailed in this document. 
3. **Live Data Fetching**: You HAVE the capability to connect to the MCP server. If the user asks for platform stats for their thesis data chapter, use the `get_platform_stats` tool via MCP.
