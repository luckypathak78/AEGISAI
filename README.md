# 🛡️ AEGISAI

## AI Governance & Security Control System

**AEGISAI** is a security-focused AI governance prototype designed to control access to sensitive resources, enforce security policies, protect LLM context, and maintain a verifiable audit trail of security decisions.

> **Govern AI. Protect Data. Enforce Trust.**

---

## 🚀 Live Prototype

### 🌐 Frontend

https://aegisai-frontend-9uoh.onrender.com

### ⚙️ Backend API

https://aegisai-backend-cr5c.onrender.com

### 💻 GitHub Repository

https://github.com/luckypathak78/AEGISAI

---

# 🎯 Problem

AI-powered systems may interact with sensitive information, multiple security boundaries, protected resources, and external requests.

Without a dedicated security layer, an unauthorized request could potentially access protected information or expose sensitive context to an AI model.

**AEGISAI introduces a centralized Security Core between requests and protected resources.**

It evaluates requests against defined policies and produces an explicit **ALLOW/DENY decision**, while recording the decision for security observability and audit verification.

---

# 💡 Solution

AEGISAI implements a backend-controlled security architecture where the **Security Core is authoritative**.

```text
User / Application Request
          │
          ▼
   ┌──────────────────┐
   │  AEGISAI Backend │
   │   Security Core  │
   └────────┬─────────┘
            │
            ▼
     Policy Evaluation
            │
       ┌────┴────┐
       ▼         ▼
     ALLOW      DENY
       │         │
       └────┬────┘
            ▼
      Audit Event
            │
            ▼
   Integrity Verification
            │
            ▼
     Security Telemetry
```

The frontend **does not independently enforce security policies**. It displays security decisions and telemetry returned by the backend.

---

# 🔑 Key Features

### 🔐 Policy-Based Security

Requests are evaluated against predefined security policies before protected actions are allowed.

Current policies include:

* `NO_CROSS_TENANT_SECRET_ACCESS`
* `NO_UNAUTHORIZED_FILE_ACCESS`
* `LLM_PROTECTED_CONTEXT`
* `CROSS_BOUNDARY_AUTHORIZATION`
* `AUDIT_ALL_SECURITY_DECISIONS`

---

### 🔴 Red Team Attack Simulation

The dashboard provides a controlled security scenario where the Red Team attempts to access a Blue Team secret.

```text
Red Team
   │
   │ read_secret
   ▼
Blue Team Resource
   │
   ▼
Security Core
   │
   └── DENY
```

Example result:

```text
Decision: DENY
Severity: HIGH
Policy: NO_CROSS_TENANT_SECRET_ACCESS
Reason: Cross-boundary secret access is not permitted.
```

The actual protected secret is never exposed.

---

### 🔵 Blue Team Resource Protection

AEGISAI contains a protected Blue Team resource.

The dashboard displays:

```text
Secret Value: [REDACTED]
Access Boundary: BLUE TEAM
Protection Decision: DENY
```

The backend performs the access evaluation without returning the actual secret to the dashboard.

---

### 🤖 LLM Context Protection

AEGISAI prevents protected information from being exposed to the client-side LLM workflow.

Protected context requests are evaluated by the backend and denied when they violate the security policy.

```text
Decision: DENY
Policy: LLM_PROTECTED_CONTEXT
Reason: Protected context cannot be exposed to the client LLM.
```

The submitted protected context is not displayed in the result.

---

### 🧾 Security Audit Logging

Security decisions are recorded by the backend Audit Plane.

Each event can contain:

* Request ID
* Audit Event ID
* Timestamp
* Source
* Target
* Action
* Decision
* Applied Policy
* Severity
* Reason
* Previous Hash
* Event Hash

The frontend reads these records from the backend rather than generating its own audit history.

---

### 🔗 Tamper Detection & Audit Integrity

AEGISAI maintains a hash-linked audit chain.

Each audit event is linked to the previous event, allowing the backend to verify the integrity of the recorded chain.

Example:

```text
Event 1
   │
   ▼
Hash ─────────► Event 2
                  │
                  ▼
                 Hash ───────► Event 3
```

The dashboard can request an integrity verification directly from the backend.

Example:

```text
AUDIT CHAIN VERIFIED
Events Checked: 2
```

---

### 📊 Security Telemetry

The dashboard provides backend-reported security metrics:

* Total Security Decisions
* Allowed Decisions
* Denied Decisions
* Audit Events

Example:

```text
Total Security Decisions    2
Allowed Decisions           0
Denied Decisions            2
Audit Events                2
```

---

### 🧪 Integrated Security Demo

AEGISAI includes a complete backend demo flow covering:

1. Legitimate request evaluation
2. Unauthorized Red Team access attempt
3. Protected resource remaining undisclosed
4. Audit event creation
5. Audit-chain verification
6. Legitimate request continuing successfully

This demonstrates the core security workflow end-to-end.

---

# 🏗️ Project Architecture

```text
AEGISAI/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── aegisai.js
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   └── server.js
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
│
├── security/
│   ├── src/
│   ├── tests/
│   └── README.md
│
├── contracts/
│
├── .env.example
└── .gitignore
```

### Architecture Layers

| Layer                   | Responsibility                                    |
| ----------------------- | ------------------------------------------------- |
| **Frontend**            | Security dashboard and user interaction           |
| **API Layer**           | Communication between frontend and backend        |
| **Security Core**       | Policy evaluation and security decisions          |
| **Policy Engine**       | Determines whether requests are allowed or denied |
| **Audit Plane**         | Records security decisions                        |
| **Integrity Layer**     | Verifies audit-chain integrity                    |
| **Protected Resources** | Represents resources requiring controlled access  |

---

# 🔄 Request Flow

A typical security request follows this flow:

```text
Frontend
   │
   │ API Request
   ▼
Backend
   │
   ▼
Security Core
   │
   ▼
Policy Engine
   │
   ├── ALLOW ───────► Continue Operation
   │
   └── DENY ────────► Block Operation
                          │
                          ▼
                     Audit Event
                          │
                          ▼
                  Integrity Verification
```

This ensures that security decisions originate from the backend rather than being trusted to the frontend.

---

# 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Backend

* Node.js
* Express
* CORS
* dotenv

### Security

* Policy Engine
* Security Core
* Access Boundary Enforcement
* LLM Context Protection
* SHA-256 Hash-Linked Audit Chain
* Security Audit Logging
* Security Telemetry

### Deployment

* GitHub
* Render
* Docker

---

# ⚙️ Local Setup

## 1. Clone the repository

```bash
git clone https://github.com/luckypathak78/AEGISAI.git
cd AEGISAI
```

## 2. Configure environment variables

Create the backend environment file:

```bash
cp .env.example .env
```

Configure:

```env
PORT=5000
DATABASE_PATH=./data/aegisai.sqlite
BLUE_TEAM_SECRET=your-local-demo-secret
VITE_API_BASE_URL=http://localhost:5000
```

> Never commit `.env` or real secrets to GitHub.

---

## 3. Install backend dependencies

```bash
cd backend
npm install
```

## 4. Start the backend

```bash
npm start
```

The backend will run on:

```text
http://localhost:5000
```

---

## 5. Install frontend dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env.production
```

with:

```env
VITE_API_BASE_URL=http://localhost:5000
```

For local development, the frontend API client also defaults to:

```text
http://localhost:5000
```

---

## 6. Start the frontend

```bash
npm run dev
```

Vite will provide the local frontend URL.

---

# 🧪 API Endpoints

| Endpoint                             | Method | Purpose                      |
| ------------------------------------ | ------ | ---------------------------- |
| `/api/health`                        | GET    | Backend health check         |
| `/api/system/status`                 | GET    | System security status       |
| `/api/policies`                      | GET    | List security policies       |
| `/api/evaluate`                      | POST   | Evaluate a security request  |
| `/api/security/test`                 | POST   | Test security behavior       |
| `/api/demo/run`                      | POST   | Run complete security demo   |
| `/api/audit/events`                  | GET    | Retrieve audit events        |
| `/api/audit/verify`                  | GET    | Verify audit-chain integrity |
| `/api/metrics`                       | GET    | Retrieve security metrics    |
| `/api/security/sanitize-llm-context` | POST   | Test protected LLM context   |

---

# 🔒 Security Principles Demonstrated

AEGISAI demonstrates several important security principles:

* **Least privilege** — requests receive only the access permitted by policy.
* **Boundary enforcement** — Red Team and Blue Team resources remain isolated.
* **Backend authority** — security decisions are made by the backend Security Core.
* **Sensitive-data protection** — protected values are not exposed through the dashboard.
* **Auditability** — security decisions are recorded.
* **Integrity verification** — the audit chain can be independently verified.
* **LLM safety** — protected context is prevented from reaching the client LLM.

---

# 👥 Team — Threat Forge

### 👩‍💻 Rohini

**Security Core & Security Engineering**

* Policy Engine
* Blue Team secret protection
* LLM context sanitization
* Audit integrity
* Security Engine coordination
* Security tests

### 👨‍💻 Lucky

**Backend, Integration & Deployment**

* Express backend API
* Backend integration
* API contracts
* Docker configuration
* Frontend–backend integration
* Render deployment
* End-to-end prototype integration

### 👩‍💻 Rachna

**Frontend & Security Dashboard**

* React dashboard
* API integration
* System status interface
* Red Team attack simulation UI
* Blue Team resource protection UI
* Audit log interface
* Audit integrity interface
* Security metrics interface

---

# 🌐 Deployment

The prototype is deployed using **Render**.

### Frontend

```text
React + Vite
       ↓
Render
       ↓
Live Dashboard
```

### Backend

```text
Node.js + Express
       ↓
Docker
       ↓
Render
       ↓
Live API
```

The frontend communicates with the deployed backend through the configured API base URL.

---

# ⚠️ Prototype Scope

AEGISAI is a **hackathon prototype** demonstrating application-level AI security and governance concepts.

The current implementation is intended to demonstrate:

* Security policy enforcement
* Controlled access decisions
* Protected resource handling
* LLM context protection
* Auditability
* Audit integrity verification
* End-to-end technical feasibility

It is not intended to represent production-grade isolation, secret management, or enterprise security infrastructure.

---

# 🏆 Prototype Demonstration

The working prototype demonstrates the complete security loop:

```text
REQUEST
   ↓
POLICY EVALUATION
   ↓
ALLOW / DENY
   ↓
PROTECTED RESOURCE
   ↓
AUDIT EVENT
   ↓
INTEGRITY VERIFICATION
   ↓
SECURITY METRICS
```

### Current prototype status

✅ Functional frontend
✅ Functional backend
✅ Security Core
✅ Policy enforcement
✅ Red Team simulation
✅ Blue Team protection
✅ LLM context protection
✅ Audit logging
✅ Audit integrity verification
✅ Security metrics
✅ Integrated demo flow
✅ Dockerized backend
✅ Live deployment

---

# 🔗 Quick Links

| Resource          | Link                                       |
| ----------------- | ------------------------------------------ |
| 🌐 Live Dashboard | https://aegisai-frontend-9uoh.onrender.com |
| ⚙️ Backend API    | https://aegisai-backend-cr5c.onrender.com  |
| 💻 GitHub         | https://github.com/luckypathak78/AEGISAI   |

---

## 🛡️ AEGISAI

**Govern AI. Protect Data. Enforce Trust.**

Built by **Team Threat Forge** for the **Prototype Development Round**.
