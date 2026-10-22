# AEGISAI Audit Event Contract

Sanitized event fields:

{
  "eventId": "EVT-...",
  "requestId": "REQ-...",
  "timestamp": "ISO-8601",
  "source": "red-team",
  "target": "blue-team",
  "action": "read_secret",
  "decision": "DENY",
  "policy": "NO_CROSS_TENANT_SECRET_ACCESS",
  "severity": "HIGH",
  "reason": "Cross-boundary secret access is not permitted.",
  "eventHash": "...",
  "previousHash": "..."
}

Never include:
- Blue Team secret
- API keys
- credentials
- raw sensitive model context
- private environment variables
