# Development Workflow Rules

## Frontend
- Must consume backend APIs only
- No direct blockchain calls unless wallet interaction
- Must handle loading + error states

## Backend
- All blockchain writes must go through service layer
- Validate all inputs strictly
- Never trust frontend data

## Smart Contracts
- Keep minimal logic on-chain
- Emit events for indexing
- Avoid storage overuse

## Testing Requirement
- Every contract must have Foundry tests
- Every API route must have at least basic test coverage