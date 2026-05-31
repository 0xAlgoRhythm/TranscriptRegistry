# TranscriptRegistry (CredAxis v2) Project Context

## Overview
CredAxis is a full-stack decentralized academic transcript issuance and verification registry. It allows universities to issue cryptographically signed transcript fingerprints on Ethereum, students to control delegate verification access rights, and verifiers to instantly validate credentials on-chain.

## Tech Stack
- **Frontend**: Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS v4, Zustand stores, Zod schemas, Privy Auth, Wagmi & Viem.
- **Backend**: Bun runtime, Hono API server, Drizzle ORM, PostgreSQL database, and event indexers.
- **Smart Contracts**: Solidity smart contracts (beacon proxies, upgradeable contracts, foundry-tested).

## Core Modules
- **Frontend App (`frontend/`)**: Containing landing page layout and internal app dashboard paths (Admin console, Registrar issuance, Student Hub, Public verification).
- **Backend API (`backend/`)**: Indexed events database schema and Pinata IPFS metadata upload.
- **Smart Contracts (`src/`)**: core solidity implementations including `TranscriptRegistry.sol` and `UniversityFactory.sol`.

## Core Features
1. **Administrative Deployment**: Platform admins can deploy isolated, upgradeable registries for accredited institutions.
2. **Four-Step Issuance**: Registrars compute PDF SHA-256 signatures, compile student metadata, upload to IPFS, and write the credential to the registry contract.
3. **Access Delegation**: Students grant time-limited verifier permissions or revoke delegate authorization immediately.
4. **On-Chain Verification**: Authorized verifiers match original PDF documents to the on-chain hashes.