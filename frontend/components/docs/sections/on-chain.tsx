import { CodeBlock, Callout } from "@/components/docs/docs-ui"

export function DocsOnChain() {
  return (
    <div>
      <div className="section-eyebrow">Blockchain</div>
      <h2 className="section-title">On-Chain Contracts</h2>
      <p className="section-lead">
        CredAxis deploys a <strong>Factory + Registry</strong> pattern on Base
        Sepolia. The Factory contract deploys individual Registry contracts
        for each university. All transcript records are stored immutably on-chain.
      </p>

      <h3>Deployed Contracts</h3>
      <div className="contracts-grid">
        <div className="contract-card">
          <div className="contract-header">
            <span className="contract-type">Factory</span>
            <span className="contract-network">Base Sepolia</span>
          </div>
          <code className="contract-addr">0x9632D1a3194947CD888b37020261952A6aC52613</code>
          <p>
            The master factory that deploys per-university Registry contracts.
            Managed by the platform admin.
          </p>
          <a
            href="https://sepolia.basescan.org/address/0x9632D1a3194947CD888b37020261952A6aC52613"
            target="_blank"
            rel="noopener noreferrer"
            className="contract-link"
          >
            View on BaseScan ↗
          </a>
        </div>

        <div className="contract-card">
          <div className="contract-header">
            <span className="contract-type">Registry — KNUST</span>
            <span className="contract-network">Base Sepolia</span>
          </div>
          <code className="contract-addr">0x0487722E60f437F5588BC97501177d1384c84E19</code>
          <p>
            Kwame Nkrumah University of Science and Technology — registry
            contract for issuing and managing transcript records.
          </p>
          <a
            href="https://sepolia.basescan.org/address/0x0487722E60f437F5588BC97501177d1384c84E19"
            target="_blank"
            rel="noopener noreferrer"
            className="contract-link"
          >
            View on BaseScan ↗
          </a>
        </div>

        <div className="contract-card">
          <div className="contract-header">
            <span className="contract-type">Registry — UG</span>
            <span className="contract-network">Base Sepolia</span>
          </div>
          <code className="contract-addr">0x8bc95ae597deaE61b087F45efCA355AF07BBF32B</code>
          <p>University of Ghana registry contract.</p>
          <a
            href="https://sepolia.basescan.org/address/0x8bc95ae597deaE61b087F45efCA355AF07BBF32B"
            target="_blank"
            rel="noopener noreferrer"
            className="contract-link"
          >
            View on BaseScan ↗
          </a>
        </div>

        <div className="contract-card">
          <div className="contract-header">
            <span className="contract-type">Registry — UCC</span>
            <span className="contract-network">Base Sepolia</span>
          </div>
          <code className="contract-addr">0x862942e757351E5EB84F10d4cA3E143cdF0e2F86</code>
          <p>University of Cape Coast registry contract.</p>
          <a
            href="https://sepolia.basescan.org/address/0x862942e757351E5EB84F10d4cA3E143cdF0e2F86"
            target="_blank"
            rel="noopener noreferrer"
            className="contract-link"
          >
            View on BaseScan ↗
          </a>
        </div>
      </div>

      <h3>Registry Contract Interface</h3>
      <p>
        Each Registry contract exposes the following key functions. You can
        interact with them directly via ethers.js / viem or through our REST API.
      </p>

      <CodeBlock
        lang="solidity"
        label="Registry Contract — Key Functions"
        code={`// Register a transcript record on-chain
function registerTranscript(
    bytes32 studentHash,  // keccak256(abi.encodePacked(studentAddress))
    bytes32 fileHash,     // SHA-256 of the transcript PDF
    string calldata ipfsURI
) external onlyRegistrar returns (bytes32 recordId);

// Get a transcript record
function getTranscript(bytes32 recordId) external view returns (
    bytes32 studentHash,
    bytes32 fileHash,
    string memory ipfsURI,
    uint256 issuedAt,
    TranscriptStatus status
);

// Update transcript status (Active, Revoked, Amended)
function updateTranscriptStatus(
    bytes32 recordId,
    TranscriptStatus newStatus,
    string calldata reason
) external onlyRegistrar;

// Grant access to a verifier
function grantAccess(
    bytes32 recordId,
    address verifier
) external;

// Revoke access
function revokeAccess(
    bytes32 recordId,
    address verifier
) external;`}
      />

      <h3>On-Chain Events (Indexed by Backend)</h3>
      <p>
        The backend micro-indexer listens for these events in real-time and
        syncs them to the PostgreSQL database:
      </p>

      <CodeBlock
        lang="solidity"
        label="Indexed Events"
        code={`event TranscriptRegistered(
    bytes32 indexed recordId,
    bytes32 indexed studentHash,
    bytes32 fileHash,
    address indexed registrar
);

event TranscriptStatusChanged(
    bytes32 indexed recordId,
    TranscriptStatus oldStatus,
    TranscriptStatus newStatus,
    string reason
);

event AccessGranted(
    bytes32 indexed recordId,
    address indexed verifier,
    address indexed granter
);

event AccessRevoked(
    bytes32 indexed recordId,
    address indexed verifier
);

event UniversityRegistered(
    uint256 indexed universityId,
    string name,
    address registryContract,
    address registrar
);`}
      />

      <Callout type="info">
        <strong>Direct on-chain reads:</strong> You can read transcript data
        directly from the contract without using our API. However, the API
        provides enriched data (student names, university metadata, IPFS content)
        that is not available on-chain.
      </Callout>

      <h3>Reading Contracts with viem</h3>
      <CodeBlock
        lang="typescript"
        label="TypeScript — Read contract directly"
        code={`import { createPublicClient, http } from "viem"
import { baseSepolia } from "viem/chains"

const client = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.drpc.org"),
})

// Read a transcript directly from the registry
const result = await client.readContract({
  address: "0x0487722E60f437F5588BC97501177d1384c84E19",
  abi: registryABI,
  functionName: "getTranscript",
  args: ["0xaa877681f268a7a927036de034fd930a854f2aec555795b6b612edb479ae2987"],
})

console.log(result)
// [studentHash, fileHash, ipfsURI, issuedAt, status]`}
      />
    </div>
  )
}
