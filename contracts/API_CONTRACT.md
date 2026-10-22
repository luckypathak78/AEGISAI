# AEGISAI API Contract — SOURCE OF TRUTH

Base URL is provided by `VITE_API_BASE_URL` in the frontend.

## GET /api/health
Returns service health.

## GET /api/system/status
Response:
{
  "system": "AEGISAI",
  "policyGateway": "ACTIVE",
  "auditPlane": "ACTIVE",
  "clientLLM": "READY",
  "redTeam": "ISOLATED",
  "blueTeam": "ISOLATED",
  "auditIntegrity": "VERIFIED"
}

## GET /api/policies
Returns active policy definitions.

## POST /api/evaluate
Request:
{
  "source": "red-team",
  "target": "blue-team",
  "action": "read_secret",
  "payload": "controlled test payload"
}

Response:
{
  "requestId": "REQ-...",
  "decision": "DENY",
  "policy": "NO_CROSS_TENANT_SECRET_ACCESS",
  "severity": "HIGH",
  "reason": "Cross-boundary secret access is not permitted.",
  "auditEventId": "EVT-..."
}

Allowed values:
- decision: ALLOW | DENY
- source: red-team | blue-team | client-llm | system
- severity: LOW | MEDIUM | HIGH | CRITICAL

## POST /api/security/test
Runs one controlled security test.

## POST /api/demo/run
Runs the canonical end-to-end demo and returns ordered steps.

Canonical demo:
1. legitimate evaluation -> ALLOW
2. Red Team reads Blue Team secret -> DENY
3. protected resource remains undisclosed
4. audit event recorded
5. audit chain verified
6. legitimate evaluation continues -> ALLOW

## GET /api/audit/events
Returns sanitized audit events only.

## GET /api/audit/verify
Response:
{
  "verified": true,
  "eventsChecked": 0,
  "message": "Audit chain integrity verified"
}

## GET /api/metrics
Returns metrics derived from actual recorded runs.

## Security contract
Never return or log the Blue Team secret in an unauthorized response.
Never place API keys or secrets in frontend code.
Frontend is never authoritative for security decisions.
