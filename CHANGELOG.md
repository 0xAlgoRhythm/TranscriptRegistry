# Changelog

## [Unreleased]

## [2026-06-11] — Privy Auth Edge Case Fix

### Fixed
- **Privy embedded wallet auto-bind** (`student-gate.tsx`, `backend/index.ts`): Resolved a critical
  UX/auth gap where email-authenticated students were required to manually click "Bind Wallet" to
  synchronize their Privy embedded wallet with the database. The `StudentGate` component now performs
  a two-stage profile lookup: first by wallet address, then by verified Privy email on a 404. If a
  whitelisted record with no wallet is found, it automatically calls the new `self-bind-wallet`
  endpoint to complete the binding atomically — eliminating all manual steps for email-login students.

### Added
- `GET /api/students/profile/by-email/:email` — email-based profile lookup, preferring unbound
  records (`walletAddress IS NULL`) for the auto-bind flow.
- `PUT /api/students/:id/self-bind-wallet` — secure self-service wallet binding endpoint with email
  ownership verification, null-wallet guard (HTTP 409), global wallet uniqueness check, and
  `AUTO_WALLET_BOUND` audit trail.
- `autoBinding` state in `StudentGate` renders a "Linking Your Identity..." spinner during the
  auto-bind phase for transparent UX.

---

## [2026-06-05] — Audit History & System Hardening

### Fixed
- Test script function signatures to match contract interfaces
- Tuple destructuring issues in coverage mode
- Naming conflicts between test contracts

### Changed
- UniversityFactoryBeacon implementation variable from immutable to regular
- Test contract names for upgradeable version to avoid conflicts

### Added
- Coverage testing configuration
- Coverage documentation
- Testing guide
