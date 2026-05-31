# 🧪 Blockchain Testing Guide

Complete guide to test your deployed smart contracts on Ethereum Sepolia.

---

## 📋 Prerequisites

Make sure your `.env` has these addresses from deployment:

```bash
# Factory & Proxies (already set)
FACTORY_ADDRESS=0x3828Ddf3dC3bdB4f9F838e498e4B5536bb74230e
REGISTRY_ADDRESS_KNUST=0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3
REGISTRY_ADDRESS_UG=0xD207B844f595AF7A6b43191633D8bF11C9bB8316
REGISTRY_ADDRESS_UCC=0x049e478B03eb3a2f8B83C0e58895488b51EE971C

# Test accounts (add these)
TEST_STUDENT_ADDRESS=0xC52A761304DE7DFEea1570361bf190803fF55b6c
TEST_STUDENT_PRIVATE_KEY=your_test_student_private_key_here
TEST_VERIFIER_ADDRESS=0x... (create new wallet)
TEST_VERIFIER_PRIVATE_KEY=...
```

---

## 🎯 Test Sequence

### Test 1: Check Factory Status

Check if your deployed contracts are working:

```bash
forge script script/TestDeployedContracts.s.sol:CheckFactoryStatus \
  --rpc-url https://sepolia.drpc.org \
  -vvv
```

**Expected Output:**
```
Factory: 0x3828Ddf3dC3bdB4f9F838e498e4B5536bb74230e
Total Universities: 3
Active Universities: 3
KNUST - Version: 1.0.0
UG - Version: 1.0.0
UCC - Version: 1.0.0
```

---

### Test 2: Register a Transcript (Registrar)

Register a test transcript on blockchain:

```bash
forge script script/TestDeployedContracts.s.sol:TestRegisterTranscript \
  --rpc-url https://sepolia.drpc.org \
  --broadcast \
  --legacy \
  -vvv
```

**What this does:**
1. Connects as university registrar
2. Registers a transcript with test data
3. Stores hash on blockchain
4. Returns `recordId` (save this!)

**Save the Record ID:**
```bash
# Copy the recordId from output
echo "RECORD_ID=0x..." >> .env
```

**View on Etherscan:**
```
https://sepolia.etherscan.io/address/0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3
```

---

### Test 3: Grant Access (Student)

Student grants verifier access to transcript:

```bash
# Make sure RECORD_ID is in .env from Test 2
source .env

forge script script/TestDeployedContracts.s.sol:TestGrantAccess \
  --rpc-url https://sepolia.drpc.org \
  --broadcast \
  --legacy \
  -vvv
```

**What this does:**
1. Student wallet signs transaction
2. Grants 30-day access to verifier
3. Recorded on blockchain

---

### Test 4: Verify Transcript (Verifier)

Verifier checks if transcript is authentic:

```bash
forge script script/TestDeployedContracts.s.sol:TestVerifyTranscript \
  --rpc-url https://sepolia.drpc.org \
  --broadcast \
  --legacy \
  -vvv
```

**Expected Output:**
```
Is Valid: YES - AUTHENTIC
File Hash Match: true
Total Verifications: 1
```

---

## 📊 Test Results Checklist

After running all tests, verify:

- [ ] Factory shows 3 active universities
- [ ] Transcript registered successfully (recordId returned)
- [ ] Transaction visible on Etherscan
- [ ] Student granted access (30 days)
- [ ] Verifier successfully verified transcript
- [ ] Contract stats updated (transcriptCount, verificationCount)

---

## 🔍 Manual Verification on Etherscan

### Check Transaction History

1. Go to your registry address:
   ```
   https://sepolia.etherscan.io/address/0x9e0a1bd17c0f0190FB64dABe8cB54E871D3712D3
   ```

2. Click "Transactions" tab
3. You should see:
   - ✅ `registerTranscript` transaction
   - ✅ `grantAccess` transaction
   - ✅ `verifyTranscript` transaction

### Check Contract State

1. Click "Contract" → "Read Contract"
2. Query these functions:
   - `transcriptCount()` should return 1
   - `verificationCount()` should return 1
   - `isActive()` should return true
   - `universityName()` should return "Kwame Nkrumah University..."

---

## 🚨 Troubleshooting

### Issue: "Only registrar can call this"
**Solution:** Make sure you're using `REGISTRAR_PRIVATE_KEY` for registration

### Issue: "Not the transcript owner"
**Solution:** Student address must match the hash used during registration

### Issue: "Access denied or expired"
**Solution:** Student must grant access before verifier can verify

### Issue: "Transcript does not exist"
**Solution:** Check that `RECORD_ID` is set correctly in `.env`

---

## 📈 Gas Costs (Actual)

| Action | Gas Used | Cost (at 0.02 gwei) |
|--------|----------|---------------------|
| Register Transcript | ~150,000 | $0.003 |
| Grant Access | ~80,000 | $0.0016 |
| Verify Transcript | ~50,000 | $0.001 |
| **Total Test Suite** | **~280,000** | **~$0.0056** |

---

## ✅ Success Criteria

Your blockchain testing is successful if:

1. ✅ All 4 test scripts execute without errors
2. ✅ Transactions appear on Etherscan
3. ✅ Contract state updates correctly
4. ✅ Verification returns `true` (authentic)
5. ✅ Gas costs are reasonable (<$0.01 total)

---

## 🎯 Next: Set Up Pinata IPFS

Once blockchain testing is complete, proceed to:

1. Create Pinata account
2. Upload test transcript PDF
3. Get real IPFS CID
4. Replace placeholder CID in tests
5. Re-run tests with real IPFS data

**Ready to test? Run Test 1 first!** 🚀