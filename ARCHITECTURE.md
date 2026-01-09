# TranscriptRegistry — Architecture Overview

This file contains the overall architecture flowchart, the issue and verify sequence diagrams, and the two adaptations (fully on-chain and ERC-721 wrapping).  
All Mermaid diagrams are compatible with **GitHub-flavored Mermaid rendering**.

---

## 1) Overall architecture (Mermaid flowchart)

```mermaid
flowchart LR
  subgraph OffChain["Off-chain User Layer"]
    UI["Web App / DApp"]
    Backend["Backend API / Indexer"]
    DB["Indexed Metadata DB"]
    IPFS["IPFS / File Storage"]
    Institutions["Institution Issuer"]
    Students["Student Holder"]
    Verifiers["Verifier Employer or School"]
  end

  subgraph OnChain["On-chain Blockchain Layer"]
    Chain["EVM Network"]
    Registry["TranscriptRegistry Contract"]
  end

  Institutions --> Backend
  Backend --> IPFS
  IPFS --> Backend
  Backend --> Registry

  Students --> UI
  UI --> Registry

  Verifiers --> Registry
  Verifiers --> IPFS

  Registry --> Backend
  Backend --> DB

  UI --> Backend
  Chain --> Registry

  Institutions --> Registry
```

## 2) Sequence diagrams

### 2.1 Issue flow (sequence diagram)

```mermaid
sequenceDiagram
  participant Issuer as Institution
  participant Backend
  participant IPFS
  participant Chain as TranscriptRegistry
  participant Student

  Issuer->>Backend: Upload transcript file and metadata
  Backend->>IPFS: Store file
  IPFS-->>Backend: Return CID
  Backend->>Chain: issueTranscript(CID, metadataHash, recipient)
  Chain-->>Backend: TranscriptIssued event
  Backend->>Student: Notify and provide proof
```

### 2.2 Verify flow (sequence diagram)

```mermaid
sequenceDiagram
  participant Verifier
  participant UI
  participant Chain as TranscriptRegistry
  participant IPFS

  Verifier->>UI: Request verification
  UI->>Chain: Read transcript record
  Chain-->>UI: Transcript data
  UI->>IPFS: Fetch file by CID
  IPFS-->>UI: Transcript file
  UI->>Verifier: Present transcript
  Verifier->>Chain: Check revocation status
  Chain-->>Verifier: Issued or Revoked
```

## 3) Adaptations

### 3.1 Fully on-chain storage (simplified)

Tradeoff: higher gas and storage costs with simpler verification.

```mermaid
flowchart LR
  RegistryOnChain["On-chain TranscriptRegistry"]

  Institutions --> RegistryOnChain
  Students --> RegistryOnChain
  Verifiers --> RegistryOnChain
```

### 3.2 ERC-721 wrapping (transcript as NFT)

```mermaid
flowchart LR
  Institutions --> IPFS2["IPFS"]
  Institutions --> ERC721["ERC-721 Contract"]
  ERC721 --> Students
  Verifiers --> ERC721
  ERC721 --> Backend2["Backend Indexer"]
```
