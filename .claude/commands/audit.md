---
allowed-tools: Read, Glob, Grep, Bash, Task, AskUserQuestion
argument-hint: [contract-path]
description: Run a structured smart contract security audit
---

Run a structured security audit on the contract(s) at `$ARGUMENTS`.

## Audit Workflow

Invoke the `/solidity-security` skill first, then walk through each section:

### 1. Static Analysis
- Run `forge build` — check for warnings
- Run `slither .` if available
- Run `forge test -vvv` — all tests must pass
- Check: floating pragma, unused imports, unused variables

### 2. Access Control
- Map all external/public functions and their modifiers
- Verify `onlyOwner` / role checks on admin functions
- Check for `tx.origin` usage (must not exist)
- Verify ownership transfer is 2-step

### 3. Reentrancy & CEI
- Verify ALL external calls follow Checks-Effects-Interactions
- Check for `ReentrancyGuard` on state-changing functions with external calls
- Check cross-function reentrancy (shared state)

### 4. Upgrade Safety (if proxy)
- Verify storage layout compatibility
- Check `_disableInitializers()` in implementation constructor
- Verify upgrade function is access-controlled

### 5. Economic Vectors
- Check flash loan resistance
- Verify slippage protection and deadlines
- Verify oracle freshness checks
- Check for fee-on-transfer / rebasing token handling

### 6. Gas & DoS
- Check for unbounded loops
- Verify pull-over-push for payments
- Check fallback/receive function complexity

### 7. External Dependencies
- Verify OpenZeppelin version is current
- Verify external contract addresses
- Check interface compatibility

### 8. Events & NatSpec
- Verify events for all state changes
- Check NatSpec completeness on public/external functions

Report findings with severity: Critical, High, Medium, Low, Info.


# FULL PROJECT AUDIT COMMAND

When this command is triggered:

## 1. Analyze Repository Structure
- frontend/
- src/
- lib/
- script/
- test/
- blockchain contracts

## 2. Evaluate Architecture
Check:
- separation of concerns
- API design consistency
- blockchain interaction safety
- frontend-backend coupling

## 3. Smart Contract Audit
- reentrancy risks
- access control issues
- gas inefficiencies
- event emissions
- storage layout

## 4. Backend Audit
- API security
- validation
- environment handling
- database (if any)

## 5. Frontend Audit
- state management
- wallet integration
- UX flow
- API consumption correctness

## 6. Output Format
Return:
- Critical Issues
- Medium Issues
- Suggestions
- Refactor Plan
- Deployment Readiness Score (0–10)