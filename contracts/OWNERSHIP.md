# Team Ownership — Avoid Conflicts

## Rohini — Security / AI
Owns:
- `security/`
- policy engine
- threat simulation
- LLM safety adapter logic
- audit hash-chain logic

Must not redesign frontend or change public API schemas unilaterally.

## Lucky — Backend / Integration
Owns:
- `backend/`
- database
- Express routes
- Docker Compose/root integration
- integration tests
- shared contracts

Coordinates changes affecting API/database contracts.

## Rachna — Frontend / Design
Owns:
- `frontend/`
- React pages/components
- dashboard UX
- demo visualization
- API client integration

Must consume the API contract rather than inventing endpoints.

## Shared
- `contracts/` is the source of truth.
- Root README and architecture may be updated after agreement.
- No member should overwrite another member's owned directory.
- If a contract must change, update the contract first and notify all affected owners.
