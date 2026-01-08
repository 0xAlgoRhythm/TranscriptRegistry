# 🚀 TranscriptChain Deployment Guide

Complete guide to deploy TranscriptChain smart contracts to Base Sepolia testnet.

---

## 📋 Pre-Deployment Checklist

### 1. **Install Required Tools**

```bash
# Foundry (already installed)
forge --version

# Make sure you have Node.js for scripts
node --version
npm --version
```

### 2. **Get Test ETH for Base Sepolia**

You need testnet ETH to deploy contracts:

1. **Get Sepolia ETH first:**
   - Go to: https://sepoliafaucet.com/ 
   - OR: https://www.alchemy.com/faucets/ethereum-sepolia
   - Connect your wallet and claim Sepolia ETH

2. **Bridge to Base Sepolia:**
   - Go to: https://bridge.base.org/
   - Switch to Sepolia network in MetaMask
   - Bridge your Sepolia ETH to Base Sepolia
   - Wait 1-2 minutes for bridging

3. **Verify you have Base Sepolia ETH:**
   - Switch MetaMask to "Base Sepolia" network
   - Check your balance (you need at least 0.01 ETH)

### 3. **Set Up Environment Variables**

```bash
# Copy the example file
cp .env.example .env

# Edit .env file
nano .env  # or use any text editor
```

**Required variables for initial deployment:**

```bash
# Your wallet private key (export from MetaMask)
# Settings > Security & Privacy > Reveal Secret Key
PRIVATE_KEY=your_private_key_without_0x

# Base Sepolia RPC (use the public one)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Basescan API key (optional but recommended for verification)
# Get from: https://basescan.org/register
BASESCAN_API_KEY=your_api_key_here
```

### 4. **Add Base Sepolia to MetaMask**

If not already added:

- **Network Name:** Base Sepolia
- **RPC URL:** https://sepolia.base.org
- **Chain ID:** 84532
- **Currency Symbol:** ETH
- **Block Explorer:** https://sepolia.basescan.org

---

## 🏗️ Deployment Steps

### Step 1: Final Build & Test

```bash
# Clean previous builds
forge clean

# Build contracts
forge build

# Run all tests one final time
forge test -vv

# Check coverage
forge coverage --report summary
```

**Expected output:**
```
| File                       | % Lines        | % Statements   | % Branches     |
|----------------------------|----------------|----------------|----------------|
| src/TranscriptRegistry.sol | 100.00% (58/58)| 100.00% (76/76)| 100.00% (24/24)|
| src/UniversityFactory.sol  | 100.00% (32/32)| 100.00% (42/42)| 100.00% (10/10)|
| Total                      | 100.00% (90/90)| 100.00% (118/118)| 100.00% (34/34)|
```

### Step 2: Deploy UniversityFactory

```bash
# Deploy to Base Sepolia
forge script script/Deploy.s.sol:DeployTranscriptChain \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  -vvvv
```

**What this does:**
1. Deploys `UniversityFactory` contract
2. Sets you as the platform admin
3. Verifies contract on Basescan (if API key provided)

**Expected output:**
```
==============================================
TRANSCRIPTCHAIN DEPLOYMENT SCRIPT
==============================================
Deployer address: 0x1234...5678
Deployer balance: 50000000000000000
Chain ID: 84532
==============================================

1. Deploying UniversityFactory...
   UniversityFactory deployed at: 0xABCD...EF12
   Platform Admin: 0x1234...5678

==============================================
DEPLOYMENT SUMMARY
==============================================
UniversityFactory: 0xABCD...EF12
Platform Admin: 0x1234...5678
==============================================
```

**📝 Save the Factory Address:**

```bash
# Add to your .env file
echo "FACTORY_ADDRESS=0xABCD...EF12" >> .env
```

### Step 3: Verify Deployment on Basescan

1. Go to: https://sepolia.basescan.org/
2. Search for your factory address
3. Click on "Contract" tab
4. You should see a ✅ green checkmark (verified)
5. You can now interact with the contract directly on Basescan

### Step 4: Create Test Registrar Wallets

You need separate wallets for university registrars:

**Option A: Use MetaMask**
1. Create 3 new accounts in MetaMask
2. Copy each address
3. Add to `.env`:
   ```bash
   REGISTRAR_1=0x...
   REGISTRAR_2=0x...
   REGISTRAR_3=0x...
   ```

**Option B: Generate with Cast**
```bash
# Generate 3 new wallets
cast wallet new

# Copy private keys and addresses to .env
```

### Step 5: Deploy Test Universities

```bash
# Make sure FACTORY_ADDRESS and REGISTRAR addresses are in .env
# Then run:

forge script script/Deploy.s.sol:DeployTestUniversities \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv
```

**Expected output:**
```
==============================================
DEPLOYING TEST UNIVERSITIES
==============================================
Factory address: 0xABCD...EF12
Platform admin: 0x1234...5678
==============================================

Deploying university: Kwame Nkrumah University of Science and Technology
Registrar address: 0x2222...3333
   University ID: 0
   Contract address: 0x4444...5555
   University name: Kwame Nkrumah University of Science and Technology
   Is active: true

... (2 more universities)

==============================================
DEPLOYMENT COMPLETE
==============================================
Total universities deployed: 3
Active universities: 3
==============================================
```

**📝 Save University Addresses:**

```bash
# Add to .env
REGISTRY_ADDRESS_KNUST=0x4444...5555
REGISTRY_ADDRESS_UG=0x6666...7777
REGISTRY_ADDRESS_UCC=0x8888...9999
```

### Step 6: Test Transcript Registration

```bash
# Set up environment variables for test
export TEST_STUDENT_ADDRESS=0x... # Any address
export REGISTRAR_PRIVATE_KEY=... # Private key of REGISTRAR_1
export REGISTRY_ADDRESS=$REGISTRY_ADDRESS_KNUST

# Register a test transcript
forge script script/Deploy.s.sol:RegisterTestTranscript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  -vvvv
```

**Expected output:**
```
==============================================
REGISTERING TEST TRANSCRIPT
==============================================
Registry address: 0x4444...5555
University: Kwame Nkrumah University of Science and Technology
==============================================

Registering transcript...
Student hash: 0xabcd...
Metadata CID: QmTestMetadataCID123456789
File hash: 0x1234...

Transcript registered successfully!
Record ID: 0x9876...

==============================================
TRANSCRIPT VERIFICATION
==============================================
Student hash matches: true
Metadata CID: QmTestMetadataCID123456789
File hash matches: true
Issuer: 0x2222...3333
Timestamp: 1704722400
Status: Active
==============================================
```

---

## 🔍 Verify Everything is Working

### On Basescan

1. **Factory Contract:**
   ```
   https://sepolia.basescan.org/address/YOUR_FACTORY_ADDRESS
   ```
   - Read Contract → platformAdmin (should be your address)
   - Read Contract → universityCount (should be 3)

2. **University Contracts:**
   ```
   https://sepolia.basescan.org/address/YOUR_UNIVERSITY_ADDRESS
   ```
   - Read Contract → universityName
   - Read Contract → registrar
   - Read Contract → transcriptCount

3. **Transactions:**
   - Check your wallet address on Basescan
   - You should see deployment and registration transactions

### Using Cast (Command Line)

```bash
# Check factory stats
cast call $FACTORY_ADDRESS "getPlatformStats()" --rpc-url $BASE_SEPOLIA_RPC_URL

# Check university info
cast call $REGISTRY_ADDRESS_KNUST "universityName()" --rpc-url $BASE_SEPOLIA_RPC_URL

# Check transcript count
cast call $REGISTRY_ADDRESS_KNUST "transcriptCount()" --rpc-url $BASE_SEPOLIA_RPC_URL
```

---

## 📊 Deployment Costs

Approximate gas costs on Base Sepolia (L2 is cheap!):

| Action | Gas Used | Cost (at 0.01 gwei) |
|--------|----------|---------------------|
| Deploy Factory | 1,200,000 | ~$0.001 |
| Deploy University | 2,800,000 | ~$0.003 |
| Register Transcript | 150,000 | ~$0.0002 |
| Grant Access | 80,000 | ~$0.0001 |
| Verify Transcript | 50,000 | ~$0.00005 |

**Total for MVP pilot (3 universities, 50 transcripts):** ~$0.02 USD 💰

---

## 🎉 Success Criteria

✅ **Deployment is successful if:**

1. Factory contract deployed and verified on Basescan
2. 3 university contracts deployed successfully
3. Each university contract has correct name and registrar
4. You can register a test transcript
5. Transcript data is retrievable from contract
6. All contracts are verified (green checkmark on Basescan)
7. Gas costs are reasonable (<$0.01 total)

---

## 🐛 Troubleshooting

### Issue: "Insufficient funds"

**Solution:**
```bash
# Check your balance
cast balance YOUR_ADDRESS --rpc-url $BASE_SEPOLIA_RPC_URL

# If too low, get more testnet ETH from faucet
```

### Issue: "Nonce too low" or "already known"

**Solution:**
```bash
# Reset nonce
cast send --reset

# Or wait a few minutes and try again
```

### Issue: "Contract verification failed"

**Solution:**
```bash
# Manually verify on Basescan
# Go to contract address → Contract tab → Verify & Publish

# Or use forge verify
forge verify-contract \
  YOUR_CONTRACT_ADDRESS \
  src/UniversityFactory.sol:UniversityFactory \
  --chain base-sepolia \
  --etherscan-api-key $BASESCAN_API_KEY
```

### Issue: "RPC request failed"

**Solution:**
```bash
# Try a different RPC
# Alchemy: https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
# Infura: https://base-sepolia.infura.io/v3/YOUR_KEY

# Or wait and retry (public RPCs can be rate-limited)
```

### Issue: Transaction pending too long

**Solution:**
```bash
# Check transaction status
cast receipt YOUR_TX_HASH --rpc-url $BASE_SEPOLIA_RPC_URL

# If stuck, try increasing gas price in next transaction
```

---

## 📝 Post-Deployment Checklist

After successful deployment:

- [ ] Save all contract addresses in `.env`
- [ ] Verify all contracts on Basescan
- [ ] Test registering a transcript
- [ ] Test granting access
- [ ] Test verifying a transcript
- [ ] Document contract addresses in README
- [ ] Create a deployment report with:
  - Contract addresses
  - Transaction hashes
  - Gas costs
  - Basescan links
- [ ] Commit code to Git (exclude `.env`!)
- [ ] Share contract addresses with team
- [ ] Update PRD with deployed addresses

---

## 🎯 Next Steps After Deployment

1. **Backend Integration** (Week 3-4)
   - Set up API endpoints
   - Integrate with smart contracts using ethers.js
   - Set up Pinata for IPFS storage

2. **Frontend Development** (Week 5-8)
   - Connect to deployed contracts
   - Use contract addresses from `.env`
   - Test on Base Sepolia testnet

3. **Pilot Testing** (Week 11)
   - Onboard real universities
   - Deploy production contracts (if needed)
   - Start issuing real transcripts

---

## 📞 Need Help?

If deployment fails or you encounter issues:

1. Check Foundry docs: https://book.getfoundry.sh/
2. Base docs: https://docs.base.org/
3. Basescan: https://sepolia.basescan.org/
4. Share error message for debugging

---

**Congratulations on your deployment! 🚀**

You now have a working blockchain-based transcript management system deployed on Base Sepolia testnet!