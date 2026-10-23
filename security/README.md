# AEGISAI Security Core

**Owner:** Rohini
**Module:** Policy enforcement, secret handling, LLM context sanitization, and audit integrity.

## Responsibilities

The Security Core provides application-level security controls for the AEGISAI adversarial testing sandbox.

- **Policy engine:** Evaluates requests using the policy identifiers defined in `contracts/POLICY_CONTRACT.md`.
- **Secret manager:** Reads the configured `BLUE_TEAM_SECRET` for trusted internal use without exposing its value in responses.
- **LLM safety adapter:** Creates sanitized copies of structured context by removing recognized sensitive field names and enforcing input complexity limits.
- **Audit chain:** Records sanitized security decisions in a SHA-256 hash-linked chain and verifies the chain's integrity.
- **Security engine:** Combines policy evaluation, audit recording, LLM sanitization, and security status reporting.

## Source Files

| File | Responsibility |
|---|---|
| `src/policy-engine.js` | Evaluates requests and returns ALLOW or DENY decisions. |
| `src/secret-manager.js` | Reads and checks the Blue Team secret configuration. |
| `src/llm-safety.js` | Removes recognized sensitive fields from structured LLM context. |
| `src/audit-chain.js` | Creates and verifies hash-linked audit events. |
| `src/security-engine.js` | Coordinates policy decisions and audit recording. |
| `tests/security-engine.test.js` | Tests security policies, sanitization, secret handling, and audit integrity. |

## Run Tests

Run from the repository root:

```bash
node --test security/tests/*.test.js
```

The tests cover legitimate same-boundary evaluation, cross-boundary secret denial, invalid requests, protected file and network-action denial, LLM context sanitization, secret configuration, audit integrity, and audit metadata sanitization.

## Security Guarantees and Limitations

- Unauthorized secret-access requests are denied by the policy engine.
- Evaluation responses and audit events do not intentionally include request payloads or the configured secret.
- Audit events use the field names defined in `contracts/EVENT_CONTRACT.md`.
- Policy identifiers must remain consistent with `contracts/POLICY_CONTRACT.md`.
- Audit events are currently held in memory. The hash chain is not persistent or independently anchored against an attacker who can rewrite the entire chain.
- LLM sanitization filters recognized sensitive field names. It does not guarantee detection of secrets embedded in arbitrary text.
- File and network actions are denied by this policy simulation; the module does not itself implement filesystem isolation or perform network security enforcement.
- These controls provide application-level safeguards for the prototype, not production-grade isolation or comprehensive protection against every attack.

## Integration

Public interfaces must follow the shared contracts. Coordinate any changes to shared API, event, policy, or environment-variable contracts with the backend and frontend owners before modifying them.
