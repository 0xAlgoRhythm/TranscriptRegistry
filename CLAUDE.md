# CredAxis (TranscriptRegistry) Developer Guide

## Core Commands

### Frontend (`frontend/`)
- Install dependencies: `pnpm install`
- Start dev server: `pnpm run dev`
- Production build: `pnpm run build`
- Run linting: `pnpm run lint`

### Backend (`backend/`)
- Run Hono mock server: `bun backend/index.ts` (runs on http://localhost:3001)

### Smart Contracts (Root)
- Compile contracts: `forge build`
- Run smart contract tests: `forge test`
- Format Solidity code: `forge fmt`

## Code Style & Architecture

### Tech Stack Reference
- **Frontend**: Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS v4, Lucide Icons, Zustand (state management), Zod (schemas), Web3 (Wagmi + Viem + Privy Auth).
- **Backend**: Bun runtime + Hono routing + Drizzle ORM + PostgreSQL schema + Viem event indexing.
- **Smart Contracts**: Solidity (Beacon proxy patterns, Checks-Effects-Interactions, Custom Errors).

### Guidelines
- **OKLCH Theme System**: Enforce `--ca-*` visual tokens for glassmorphic elements and dark fintech look.
- **Role Simulation**: Use Zustand `useRoleStore` to test Admin, Registrar, Student, and Verifier views client-side.
- **Validation**: Use Zod schemas in `lib/schemas/forms.ts` for address lookup, transcript deployment, access delegation, and verifications.
