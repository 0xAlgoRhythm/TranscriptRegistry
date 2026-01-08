# TranscriptChain - Decentralized Transcript Management System


A blockchain-based platform for issuing, managing, and verifying academic transcripts using Beacon Proxy pattern for gas-efficient, upgradeable smart contracts.

## 🌟 Features

- ✅ **Beacon Proxy Architecture** - 82% gas savings per deployment
- ✅ **Upgradeable Contracts** - Fix bugs without redeployment
- ✅ **IPFS Storage** - Decentralized file storage via Pinata
- ✅ **Access Control** - Student-controlled transcript sharing
- ✅ **Instant Verification** - <5 second verification time
- ✅ **Multi-University Support** - Each university has isolated data
- ✅ **Comprehensive Tests** - 137 tests with >95% coverage

## 📊 Contract Addresses (Ethereum Sepolia)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| **UniversityFactoryBeacon** | `0x3828Ddf3dC3bdB4f9F838e498e4B5536bb74230e` | [View](https://sepolia.etherscan.io/address/0x3828Ddf3dC3bdB4f9F838e498e4B5536bb74230e) |
| **Implementation** | `0x39F6408AaF6f7Ff533982B4fc62e480004D39dAe` | [View](https://sepolia.etherscan.io/address/0x39F6408AaF6f7Ff533982B4fc62e480004D39dAe) |
| **Beacon** | `0x1f442707955F41BFD180a23D88f84E616167A319` | [View](https://sepolia.etherscan.io/address/0x1f442707955F41BFD180a23D88f84E616167A319) |
| **KNUST Proxy** | `0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3` | [View](https://sepolia.etherscan.io/address/0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3) |
| **UG Proxy** | `0xD207B844f595AF7A6b43191633D8bF11C9bB8316` | [View](https://sepolia.etherscan.io/address/0xD207B844f595AF7A6b43191633D8bF11C9bB8316) |
| **UCC Proxy** | `0x049e478B03eb3a2f8B83C0e58895488b51EE971C` | [View](https://sepolia.etherscan.io/address/0x049e478B03eb3a2f8B83C0e58895488b51EE971C) |

## 🏗️ Architecture

```
UniversityFactory (Beacon Pattern)
├── TranscriptRegistryUpgradeable (Implementation)
├── UpgradeableBeacon
└── BeaconProxy instances (one per university)
    ├── KNUST Proxy
    ├── UG Proxy
    └── UCC Proxy
```

## 🚀 Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/mhiskall282/TranscriptRegistryPlatform.git
cd TranscriptRegistryPlatform

# Install dependencies
forge install

# Copy environment variables
cp .env.example .env

# Edit .env with your private keys and API keys
nano .env
```

### Build

```bash
# Compile contracts
forge build

# Run tests
forge test -vv

# Check coverage
forge coverage --report summary

# Generate gas report
forge test --gas-report
```

## 📝 Testing

```bash
# Run all tests
forge test -vv

# Run specific test file
forge test --match-path test/TranscriptRegistryUpgradeable.t.sol -vv

# Run with gas reporting
forge test --gas-report

# Run coverage
forge coverage
```

### Test Results
```
Ran 5 test suites: 137 tests passed, 0 failed
Coverage: >95%
```

## 🔧 Deployment

### Deploy to Testnet

```bash
# Deploy beacon factory
forge script script/DeployBeacon.s.sol:DeployBeaconSystem \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify

# Deploy universities
forge script script/DeployBeacon.s.sol:DeployTestUniversitiesBeacon \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast
```

### Verify Contracts

```bash
forge verify-contract \
  <CONTRACT_ADDRESS> \
  src/UniversityFactoryBeacon.sol:UniversityFactoryBeacon \
  --chain sepolia
```

## 📖 Smart Contract Documentation

### TranscriptRegistryUpgradeable

Main contract for managing university transcripts.

**Key Functions:**
- `registerTranscript(bytes32 studentHash, string metadataCID, bytes32 fileHash)` - Register new transcript
- `grantAccess(bytes32 recordId, address verifier, uint256 duration)` - Grant verifier access
- `verifyTranscript(bytes32 recordId, bytes32 fileHash)` - Verify transcript authenticity
- `revokeAccess(bytes32 recordId, address verifier)` - Revoke verifier access

### UniversityFactoryBeacon

Factory for deploying university-specific registries using beacon proxy pattern.

**Key Functions:**
- `deployUniversityProxy(string name, address registrar)` - Deploy new university
- `upgradeImplementation(address newImplementation)` - Upgrade all universities at once
- `getUniversity(uint256 id)` - Get university information

## 💰 Gas Costs

| Operation | Old System | Beacon Proxy | Savings |
|-----------|-----------|--------------|---------|
| Deploy University | 2,800,000 gas | ~488,000 gas | 82% |
| Register Transcript | 150,000 gas | 150,000 gas | 0% |
| Verify Transcript | 50,000 gas | 50,000 gas | 0% |

## 🔐 Security

- ✅ Access control modifiers (`onlyAdmin`, `onlyRegistrar`)
- ✅ Reentrancy protection
- ✅ Input validation on all functions
- ✅ Event emissions for tracking
- ✅ Comprehensive test coverage (>95%)
- ✅ OpenZeppelin battle-tested contracts

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Authors

- **Your Name** - *Initial work* - [@YourGithub](https://github.com/YOUR_USERNAME)

## 🙏 Acknowledgments

- OpenZeppelin for upgradeable contract patterns
- Foundry for development framework
- Base network for L2 infrastructure

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

---

**Built with ❤️ using Foundry and OpenZeppelin**