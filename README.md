<div align="center">
  <img src="https://i.imgur.com/G5XU265.png" alt="CredAxis Logo" width="200" />
  <h1>CredAxis — Official Transcripts Registry</h1>
  <p><strong>A highly secure, decentralized Transcript Management platform built on Base Sepolia.</strong></p>
</div>

CredAxis brings a premium "Dark Fintech" aesthetic and zero-compromise security to academic credentialing. It allows universities to issue cryptographically verifiable transcripts, allows students to own their academic records via Web3 wallets, and allows third-party verifiers (employers) to independently audit credentials on-chain.

---

## 🌟 Platform Features

- ✅ **Seamless Identity & Auth**: Powered by [Privy](https://privy.io/) for embedded wallets and secure email verification.
- ✅ **Decentralized Storage**: Transcripts are securely pinned to IPFS via Pinata, guaranteeing absolute permanence.
- ✅ **Base Sepolia Integration**: Lightning-fast, ultra-cheap L2 rollups ensuring sub-second transcript verification.
- ✅ **Beacon Proxy Architecture**: Smart contracts utilize the Upgradeable Beacon pattern for isolated university registries with 82% gas savings.
- ✅ **Beautiful Dark Fintech UI**: A sleek, premium Next.js interface inspired by ZenithPay, heavily utilizing Electric Indigo (`#8b5cf6`) and pure darks (`#0b0b0f`).
- ✅ **Automated Email Engine**: Node/Hono backend routing customized notification HTML emails to registrars and students dynamically.

## 🏗️ System Architecture

CredAxis is a multi-layered ecosystem:

1. **The Smart Contracts (`/src`, `/script`)**: Solidity contracts defining the `UniversityFactoryBeacon` and individual `TranscriptRegistryUpgradeable` proxies.
2. **The Backend API (`/backend`)**: A Hono REST API powered by Drizzle ORM connecting to PostgreSQL and Viem for on-chain indexing.
3. **The Frontend (`/frontend`)**: A Next.js App Router project leveraging React 19, Tailwind CSS, and Privy for the presentation layer.

For deep technical specifications, please explore the `/docs` directory.

## 📚 Documentation

Detailed documentation and architectural blueprints are located in the `docs/` folder:

- 📄 [System Overview](docs/system.md) - The complete student onboarding and transcript verification flow.
- 📄 [Architecture Diagram](docs/ARCHITECTURE.md) - Deep dive into the Upgradeable Beacon Proxy structure.
- 📄 [Deployment Guide](docs/DEPLOYMENT.md) - Instructions for deploying the full stack.
- 📄 [Blockchain Testing](docs/BLOCKCHAIN_TESTING.md) - Information on smart contract testing suites.
- 📄 [Beacon Deployment Details](docs/BEACON_DEPLOYMENT.md) - The technical specifics of factory deployments.
- 📄 [Full System Audit](docs/SYSTEM_REVIEW_AND_AUDIT.md) - Current state, completed phases, and outstanding issues.

## 🚀 Quick Start (Local Development)

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) v18+
- [Git](https://git-scm.com/)

### Installation & Execution

We provide an automated manager script to control the entire mono-repo stack.

```bash
# Clone the repository
git clone https://github.com/mhiskall282/TranscriptRegistryPlatform.git
cd TranscriptRegistryPlatform

# Copy environment variables and populate with your keys
cp .env.example .env
nano .env

# Run the Platform Manager UI
./platform-manager.sh
```

From the Platform Manager, you can:
- Start the Frontend
- Start the Backend
- Start a Local Anvil Node
- Run Smart Contract Tests
- Deploy Contracts

## 🤝 Contributing

Contributions are heavily encouraged to push the boundaries of decentralized education! 

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Note on Contributions**: All new UI components must strictly adhere to the established Dark Fintech design language defined in `frontend/app/globals.css`.

## 📞 Support

For enterprise support or integration queries, contact [johnokyere@lovify.tech](mailto:johnokyere@lovify.tech) or open an issue on GitHub.

---

<div align="center">
  <strong>Built with ❤️ using Next.js, Hono, Foundry, and OpenZeppelin</strong>
</div>
