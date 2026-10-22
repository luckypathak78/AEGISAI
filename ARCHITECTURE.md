# AEGISAI Shared Architecture

## Logical flow

RED TEAM
  |
  v
POLICY GATEWAY
  |
  +----> BLUE TEAM
  |
  +----> CLIENT LLM
  |
  v
AUDIT PLANE
  |
  v
METRICS / DASHBOARD

## MVP boundaries

### Implement in Round 2
- Application-level policy enforcement
- Controlled Red/Blue evaluation flow
- Secret non-disclosure
- Audit event creation
- Tamper-evident audit chain
- Metrics derived from actual prototype runs
- React dashboard
- Node/Express API
- Docker-ready service separation

### Do not falsely claim as fully implemented
- Complete kernel-level isolation
- Perfect side-channel protection
- Production-grade multi-tenant security
- Comprehensive autonomous adversarial testing

Advanced Linux namespace/seccomp/cgroup hardening and advanced side-channel testing may be demonstrated as deployment-hardening/future scope unless actually implemented and tested.
