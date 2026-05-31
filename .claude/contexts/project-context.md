# TranscriptRegistry Project Context

## Overview
This is a full-stack decentralized Transcript Registry system for managing academic records using blockchain.

## Tech Stack
- Frontend: (React / Next.js assumed — confirm if different)
- Backend: Node.js / Express (or similar)
- Blockchain: Solidity smart contracts (Foundry project detected)
- Testing: Foundry + JS/TS tests
- Scripts: Bash automation scripts
- Config: dotenv-based environment management

## Core Modules
- Smart Contracts (src/)
- Backend APIs (lib/ or src/)
- Frontend UI (frontend/)
- Deployment scripts (script/)
- Tests (test/)

## Goal
Build a secure, verifiable academic transcript registry with:
- Blockchain immutability
- Admin-controlled issuance
- Student verification access
-Organizations verification access
- Frontend dashboard
- Deployment readiness for testnet/mainnet

## Critical Rules
- Smart contracts must be secure and audited
- No private keys in frontend
- Backend must validate all inputs before blockchain writes
- All transactions must be test-covered