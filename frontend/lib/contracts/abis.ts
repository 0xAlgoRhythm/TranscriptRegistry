export const transcriptRegistryAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "_universityName", type: "string" },
      { name: "_admin", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  // Events
  {
    type: "event",
    name: "TranscriptRegistered",
    inputs: [
      { name: "recordId", type: "bytes32", indexed: true },
      { name: "studentHash", type: "bytes32", indexed: true },
      { name: "metadataCID", type: "string", indexed: false },
      { name: "fileHash", type: "bytes32", indexed: false },
      { name: "issuer", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AccessGranted",
    inputs: [
      { name: "recordId", type: "bytes32", indexed: true },
      { name: "verifier", type: "address", indexed: true },
      { name: "student", type: "address", indexed: true },
      { name: "expiresAt", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "AccessRevoked",
    inputs: [
      { name: "recordId", type: "bytes32", indexed: true },
      { name: "verifier", type: "address", indexed: true },
      { name: "student", type: "address", indexed: true },
    ],
  },
  {
    type: "event",
    name: "TranscriptStatusUpdated",
    inputs: [
      { name: "recordId", type: "bytes32", indexed: true },
      { name: "oldStatus", type: "uint8", indexed: false },
      { name: "newStatus", type: "uint8", indexed: false },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TranscriptVerified",
    inputs: [
      { name: "recordId", type: "bytes32", indexed: true },
      { name: "verifier", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "RegistrarUpdated",
    inputs: [
      { name: "oldRegistrar", type: "address", indexed: true },
      { name: "newRegistrar", type: "address", indexed: true },
    ],
  },
  // Read functions
  {
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registrar",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "universityName",
    inputs: [],
    outputs: [{ type: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isActive",
    inputs: [],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "transcriptCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verificationCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTranscript",
    inputs: [{ name: "recordId", type: "bytes32" }],
    outputs: [
      { name: "studentHash", type: "bytes32" },
      { name: "metadataCID", type: "string" },
      { name: "fileHash", type: "bytes32" },
      { name: "issuer", type: "address" },
      { name: "timestamp", type: "uint256" },
      { name: "status", type: "uint8" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStudentTranscripts",
    inputs: [{ name: "studentHash", type: "bytes32" }],
    outputs: [{ name: "", type: "bytes32[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "checkAccess",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "verifier", type: "address" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accessControl",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "verifier", type: "address" },
    ],
    outputs: [
      { name: "verifier", type: "address" },
      { name: "grantedAt", type: "uint256" },
      { name: "expiresAt", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getContractStats",
    inputs: [],
    outputs: [
      { name: "totalTranscripts", type: "uint256" },
      { name: "totalVerifications", type: "uint256" },
      { name: "contractActive", type: "bool" },
    ],
    stateMutability: "view",
  },
  // Write functions
  {
    type: "function",
    name: "registerTranscript",
    inputs: [
      { name: "studentHash", type: "bytes32" },
      { name: "metadataCID", type: "string" },
      { name: "fileHash", type: "bytes32" },
    ],
    outputs: [{ name: "recordId", type: "bytes32" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateTranscriptStatus",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "newStatus", type: "uint8" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "grantAccess",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "verifier", type: "address" },
      { name: "duration", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "revokeAccess",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "verifier", type: "address" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "verifyTranscript",
    inputs: [
      { name: "recordId", type: "bytes32" },
      { name: "fileHash", type: "bytes32" },
    ],
    outputs: [{ type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "updateRegistrar",
    inputs: [{ name: "newRegistrar", type: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "activateContract",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateContract",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const

export const universityFactoryAbi = [
  {
    type: "constructor",
    inputs: [],
    stateMutability: "nonpayable",
  },
  // Events
  {
    type: "event",
    name: "UniversityDeployed",
    inputs: [
      { name: "universityId", type: "uint256", indexed: true },
      { name: "contractAddress", type: "address", indexed: true },
      { name: "universityName", type: "string", indexed: false },
      { name: "registrar", type: "address", indexed: true },
      { name: "timestamp", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UniversityDeactivated",
    inputs: [
      { name: "universityId", type: "uint256", indexed: true },
      { name: "contractAddress", type: "address", indexed: true },
      { name: "reason", type: "string", indexed: false },
    ],
  },
  {
    type: "event",
    name: "UniversityReactivated",
    inputs: [
      { name: "universityId", type: "uint256", indexed: true },
      { name: "contractAddress", type: "address", indexed: true },
    ],
  },
  // Read functions
  {
    type: "function",
    name: "platformAdmin",
    inputs: [],
    outputs: [{ type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "universityCount",
    inputs: [],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUniversity",
    inputs: [{ name: "universityId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "name", type: "string" },
          { name: "contractAddress", type: "address" },
          { name: "registrar", type: "address" },
          { name: "deployedAt", type: "uint256" },
          { name: "isActive", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveUniversities",
    inputs: [
      { name: "offset", type: "uint256" },
      { name: "limit", type: "uint256" },
    ],
    outputs: [{ type: "uint256[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getPlatformStats",
    inputs: [],
    outputs: [
      { name: "totalUniversities", type: "uint256" },
      { name: "activeCount", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isUniversityContract",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUniversityIdByContract",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "contractToUniversityId",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
  // Write functions
  {
    type: "function",
    name: "deployUniversityContract",
    inputs: [
      { name: "universityName", type: "string" },
      { name: "registrar", type: "address" },
    ],
    outputs: [
      { name: "universityId", type: "uint256" },
      { name: "contractAddress", type: "address" },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deactivateUniversity",
    inputs: [
      { name: "universityId", type: "uint256" },
      { name: "reason", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "reactivateUniversity",
    inputs: [{ name: "universityId", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
] as const
