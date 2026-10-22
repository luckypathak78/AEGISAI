# AEGISAI — Hack in Hills '26 Round 2

Team: THREAT FORGE
Members:
- Rohini Komal — AI / Security
- Lucky — Backend / Integration
- Rachna Garg — Frontend / Design

## Goal
Build one integrated prototype for the Bayora problem statement:
a policy-driven adversarial testing sandbox with isolation, controlled communication, observation, auditability and measurable security outcomes.

## Round-2 demo
Red Team attempts to read a protected Blue Team secret.
The Policy Gateway denies the action.
The secret is never returned.
An audit event is recorded.
Audit integrity is verified.
A legitimate evaluation then continues.

## Ownership
- `security/` — Rohini
- `backend/` — Lucky
- `frontend/` — Rachna
- `contracts/`, root configuration and integration — shared, coordinated by Lucky

## Important
Do not change API contracts, policy names, event schemas, environment variable names or shared database fields without coordinating with all three members.
