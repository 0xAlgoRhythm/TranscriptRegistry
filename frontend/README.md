# 🚀 CredAxis Deployment & Operation Guide

Complete step-by-step documentation for deploying, configuring, and executing the **CredAxis (TranscriptChain)** platform MVP.

---

## 🏗️ Architecture Overview

The system runs on a 3-layer architecture:
1. **Solidity Smart Contracts (Base / Ethereum Sepolia)**: Gas-efficient registrar instances deployed using the Upgradeable Beacon Proxy pattern.
2. **Hono & Drizzle API Backend**: A microservice that acts as a real-time blockchain indexer (polling events via Viem) and hosts query routes.
3. **Next.js 16 Web Dashboard**: Connected via Privy Web3 Auth, letting students, registrars, and verifiers interact with on-chain records.

---

## 📂 Configuration Setup

Copy `.env.example` in both directories to configure keys.

### 1. Root Workspace Configuration (`/.env`)
Create a `.env` in the root folder with:
```bash
# Platform Deployer Admin Private Key
PRIVATE_KEY=your_private_key_here

# Sepolia RPC URL
BASE_SEPOLIA_RPC_URL=https://sepolia.drpc.org

# Deployed Factory Registry Address
FACTORY_ADDRESS=0x3828Ddf3dC3bdB4f9F838e498e4B5536bb74230e

# Backend PostgreSQL Connection
DATABASE_URL=postgresql://postgres:password@localhost:5432/transcriptchain
```

### 2. Frontend Configuration (`/frontend/.env`)
Create a `.env` in `/frontend`:
```bash
# Privy Web3 App Connection
NEXT_PUBLIC_PRIVY_APP_ID=cmptfuzpa014r0cl587n80doz

# Sepolia RPC URL
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://sepolia.drpc.org

# Hono API Endpoint
# Hono API Endpoint
NEXT_PUBLIC_API_URL=https://your-production-backend.com

# Registry Factory Contract
NEXT_PUBLIC_REGISTRY_FACTORY_ADDRESS=0x3828Ddf3dC3bdB4f9F838e498e4B5536bb74230e

# Pinata IPFS Keys
NEXT_PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsIn...
NEXT_PUBLIC_GATEWAY_URL=https://gateway.pinata.cloud
```

---

## 🚀 Deployment Guide

### Step 1: Database Migration Setup
Push the table schemas to your live PostgreSQL database using Drizzle-Kit inside the `backend` folder:
```bash
cd backend
npx drizzle-kit generate
npx drizzle-kit push
```

To pre-load the three live deployed Sepolia registry contracts, run the seed script against your PostgreSQL instance:
```bash
psql -d transcriptchain -f drizzle/seed.sql
```

### Step 2: Running the Backend Indexer & API
Start the backend service to run the server on port `3001` and start syncing events:
```bash
cd backend
pnpm install
pnpm build
pnpm start
```

### Step 3: Running the Frontend Dashboard
Start the Next.js development server:
```bash
cd frontend
pnpm install
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to access the platform.

---

## 📖 Step-by-Step Operator Guide

### 1. Accessing and Authentication
1. Click **Connect Wallet** on the landing page or auth gate.
2. Sign in using your Web3 wallet (MetaMask, Coinbase), Email, or Google. Privy will automatically provision an embedded wallet. 
3. **Automated Binding & Verification**: For email/social logins, the platform automatically submits your details to the university registrar. Once the Registrar approves your application (either via the UI or directly from their notification email), you will receive a "Profile Approved" email granting you full access to your Student Dashboard. No manual "Bind Wallet" step is required.
4. Switch your MetaMask network to **Sepolia Testnet**.

### 2. Simulating User Roles
For demonstration purposes, a **Simulator Control** panel is embedded on the bottom of the sidebar. You can toggle roles to inspect different interfaces:
* **Platform Admin**: Access the *Platform Admin* tab to deploy new university registry contracts.
* **University Registrar**: Access the *Issue Transcript* wizard to register credentials.
* **Student Hub**: Access *My Transcripts* and *Access Hub* to view credentials and delegate permissions to verifiers.
* **Public Verifier**: Access *Verify On-Chain* to check cryptographic records.

### 3. Deploying a New Registry (Admin)
1. Set the role simulator to **Platform Admin**.
2. Go to **Platform Admin** in the sidebar.
3. Enter the **Institution Name** and the designated **Registrar Wallet Address**.
4. Click **Deploy Registry Contract** and approve the transaction in your wallet. The indexer will pick up the deployment event and register it to the database within seconds.

### 4. Issuing a Transcript (Registrar)
1. Set the role simulator to **University Registrar**.
2. Go to **Issue Transcript**.
3. **Step 1**: Enter the university registry contract address (e.g., `0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3` for KNUST).
4. **Step 2**: Provide the recipient student's wallet address, full name, and student ID.
5. **Step 3**: Drag and drop the official transcript PDF to automatically calculate the SHA-256 hash.
6. **Step 4**: Enter the student's major, GPA, and graduation year. Click **Issue On-Chain Credential** to execute the smart contract call.

### 5. Managing Credentials & Access Delegation (Student)
1. Set the role simulator to **Student Hub**.
2. Go to **My Transcripts** to see your on-chain credentials.
3. Navigate to **Access Hub** to delegate access to a verifier (employer/school) by inputting their wallet address and choosing an expiration duration (e.g. 30 days).

### 6. Verifying a Transcript (Verifier)
1. Set the role simulator to **Public Verifier**.
2. Go to **Verify On-Chain**.
3. Input the **Record ID hash** of the transcript and upload the original PDF file. The portal will compare the calculated hash with the on-chain registry value to verify authenticity.
