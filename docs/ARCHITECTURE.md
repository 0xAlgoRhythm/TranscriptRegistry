# CredAxis Architecture Overview

This file contains the overall architecture flowchart, sequence diagrams, and structural overview for the live production MVP. All Mermaid diagrams are compatible with **GitHub-flavored Mermaid rendering**.

---

## 1) Overall System Architecture

```mermaid
flowchart TD
  subgraph Frontend["Frontend Layer (Next.js App Router)"]
    UI["Web Application (Dark Fintech)"]
    Wagmi["Wagmi / Viem hooks"]
    Auth["Privy Auth"]
    RBAC["Role-Based Access Control"]
  end

  subgraph Backend["Backend Layer (Hono Node API)"]
    API["REST API Endpoints"]
    Indexer["Viem Event Indexer (Microservice)"]
    Drizzle["Drizzle ORM"]
  end

  subgraph DB["Database Layer (PostgreSQL)"]
    Postgres[(Indexed Blockchain Data)]
  end

  subgraph Blockchain["Base Sepolia Blockchain (EVM)"]
    Factory["UniversityFactoryBeacon (Registry Manager)"]
    Beacon["UpgradeableBeacon"]
    Proxies["Beacon Proxy Instances (Registries)"]
  end

  %% Relationships
  UI <--> |API Calls| API
  Wagmi <--> |RPC| Blockchain
  Indexer <--> |Listen to Events| Blockchain
  API <--> Drizzle
  Indexer <--> Drizzle
  Drizzle <--> Postgres
  Factory --> |Creates| Proxies
  Factory --> |Reads impl from| Beacon
```

## 2) Smart Contract Architecture (Beacon Proxy Pattern)

```mermaid
flowchart LR
  Admin((Platform Admin))
  Factory[UniversityFactoryBeacon]
  Beacon[UpgradeableBeacon]
  Impl[TranscriptRegistryUpgradeable V1]
  Proxy1[Registry Proxy A]
  Proxy2[Registry Proxy B]

  Admin -->|Deploys & Upgrades| Factory
  Factory -->|Points to| Beacon
  Beacon -->|Holds address of| Impl
  Factory -->|Deploys| Proxy1
  Factory -->|Deploys| Proxy2
  Proxy1 -.->|Delegates calls to| Impl
  Proxy2 -.->|Delegates calls to| Impl
```

## 3) Backend API Flow

```mermaid
sequenceDiagram
  participant UI as Next.js Frontend
  participant API as Hono Backend
  participant DB as PostgreSQL
  participant Indexer as Viem Indexer
  participant Chain as Base Sepolia

  %% Background indexing
  loop Every Block
    Indexer->>Chain: Poll for Logs (TranscriptRegistered, etc.)
    Chain-->>Indexer: Event Logs
    Indexer->>DB: Insert/Update Records
  end

  %% Client request
  UI->>API: GET /api/transcripts/by-registry/:addr
  API->>DB: Query transcripts
  DB-->>API: Result rows
  API-->>UI: JSON Payload
```

## 4) Issue Transcript Sequence

```mermaid
sequenceDiagram
  participant Registrar as University Registrar
  participant UI as Frontend App
  participant API as Backend API
  participant Chain as TranscriptRegistry Proxy

  Registrar->>UI: Input Student Data & Document
  UI->>UI: Calculate SHA-256 File Hash
  UI->>API: Upload Metadata (Pinata IPFS)
  API-->>UI: Return ipfsHash
  UI->>Chain: registerTranscript(hash, metaCID, fileHash)
  Chain-->>UI: Transaction Confirmed
```

## 5) Student Registration & Email Approval Flow

```mermaid
sequenceDiagram
  participant Student as Student (Frontend)
  participant API as Hono Backend
  participant DB as PostgreSQL
  participant Registrar as Registrar (Email)

  Student->>API: POST /api/students (Name, ID, Email)
  API->>DB: Insert Student (status: "pending", generates approvalToken)
  API->>Registrar: Send SMTP Email with tokenized HTML buttons
  Registrar->>API: Click "APPROVE APPLICATION" in Email
  API->>DB: Query by approvalToken, update status to "approved"
  API->>Student: Send "Application Approved" Notification Email
  API-->>Registrar: 302 Redirect to /admin dashboard
  Student->>Student: Can now bind wallet and request transcripts via Privy
```

## 6) AI Integration Layer (MCP Server)

```mermaid
flowchart TD
  Agent["AI Agent (e.g., Claude Desktop)"]
  MCP["CredAxis MCP Server (Node.js)"]
  DB[(PostgreSQL)]

  Agent -- "Stdio Request (Tool Call)" --> MCP
  MCP -- "Read-Only Queries" --> DB
  DB -- "Result Set" --> MCP
  MCP -- "JSON Response" --> Agent
```
*For complete tool schema details, see [MCP_SERVER.md](file:///c:/Users/user/Desktop/TranscriptRegistry/docs/MCP_SERVER.md).*
