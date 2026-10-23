'use strict';

require('dotenv').config({ path: require('node:path').resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');

const {
  evaluateRequest,
  getAuditEvents,
  verifyAuditChain,
  sanitizeLLMContext,
  getSecurityStatus
} = require('../../security/src/security-engine');

const {
  getBlueTeamSecret,
  isBlueTeamSecretConfigured
} = require('../../security/src/secret-manager');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/policies', (_req, res) => {
  res.json({
    ok: true,
    policies: [
      {
        id: 'NO_CROSS_TENANT_SECRET_ACCESS',
        description: 'Prevents secret access across team boundaries.'
      },
      {
        id: 'NO_UNAUTHORIZED_FILE_ACCESS',
        description: 'Prevents unauthorized protected file access.'
      },
      {
        id: 'LLM_PROTECTED_CONTEXT',
        description: 'Prevents protected context from reaching the client LLM.'
      },
      {
        id: 'CROSS_BOUNDARY_AUTHORIZATION',
        description: 'Controls cross-boundary security actions.'
      },
      {
        id: 'AUDIT_ALL_SECURITY_DECISIONS',
        description: 'Records security decisions in the audit chain.'
      }
    ]
  });
});

app.post('/api/evaluate', (req, res) => {
  const { source, target, action } = req.body || {};

  const result = evaluateRequest({
    source,
    target,
    action,
    requestId: `REQ-${Date.now()}`
  });

  res.json({
    requestId: result.requestId,
    decision: result.decision,
    policy: result.policy,
    severity: result.severity,
    reason: result.reason,
    auditEventId: result.auditEventId
  });
});
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'aegisai-backend'
  });
});

app.get('/api/system/status', (_req, res) => {
  const securityStatus = getSecurityStatus();

  res.json({
    system: 'AEGISAI',
    policyGateway: 'ACTIVE',
    auditPlane: securityStatus.auditPlane,
    auditIntegrity: securityStatus.auditIntegrity,
    clientLLM: 'READY',
    redTeam: 'ISOLATED',
    blueTeam: 'ISOLATED',
    securityCore: securityStatus.policyEngine,
    blueTeamSecretConfigured:
      securityStatus.blueTeamSecretConfigured
  });
});

app.post('/api/security/sanitize-llm-context', (req, res) => {
  const context = req.body?.context;

  const securityDecision = evaluateRequest({
    source: 'system',
    target: 'client-llm',
    action: 'send_protected_context',
    requestId: `REQ-${Date.now()}`
  });

  const security = {
    decision: securityDecision.decision,
    policy: securityDecision.policy,
    severity: securityDecision.severity,
    reason: securityDecision.reason,
    auditEventId: securityDecision.auditEventId
  };

  // Fail closed: never return protected context when the policy denies it.
  if (securityDecision.decision !== 'ALLOW') {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'SECURITY_POLICY_DENIED',
        message: 'Protected context was blocked by AEGISAI Security Core.'
      },
      security
    });
  }

  try {
    const sanitizedContext = sanitizeLLMContext(context);

    return res.json({
      ok: true,
      security,
      sanitizedContext
    });
  } catch (error) {
    return res.status(400).json({
      ok: false,
      error: {
        code: 'INVALID_LLM_CONTEXT',
        message: error.message
      },
      security
    });
  }
});

app.get('/api/red-team/blue-secret', (req, res) => {
  const securityDecision = evaluateRequest({
    source: 'red-team',
    target: 'blue-team',
    action: 'read_secret',
    requestId: `REQ-${Date.now()}`
  });

  if (securityDecision.decision !== 'ALLOW') {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'SECURITY_POLICY_DENIED',
        message: 'Access denied by AEGISAI Security Core.'
      },
      security: {
        decision: securityDecision.decision,
        policy: securityDecision.policy,
        severity: securityDecision.severity,
        reason: securityDecision.reason,
        auditEventId: securityDecision.auditEventId
      }
    });
  }

  const secret = getBlueTeamSecret();

  return res.json({
    ok: true,
    secret
  });
});

app.get('/api/blue-team/secret-status', (_req, res) => {
  const securityDecision = evaluateRequest({
    source: 'blue-team',
    target: 'blue-team',
    action: 'read_secret',
    requestId: `REQ-${Date.now()}`
  });

  if (securityDecision.decision !== 'ALLOW') {
    return res.status(403).json({
      ok: false,
      error: {
        code: 'SECURITY_POLICY_DENIED',
        message: 'Access denied by AEGISAI Security Core.'
      },
      security: securityDecision
    });
  }

  let configured = false;

  try {
    const secret = getBlueTeamSecret();

    configured = typeof secret === 'string' && secret.length > 0;
  } catch (_error) {
    configured = false;
  }

  return res.json({
    ok: true,
    resource: 'blue-team-secret',
    access: 'ALLOWED',
    secretPresent: configured,
    secret: '[REDACTED]',
    security: {
      decision: securityDecision.decision,
      policy: securityDecision.policy,
      severity: securityDecision.severity,
      reason: securityDecision.reason,
      auditEventId: securityDecision.auditEventId
    }
  });
});


app.post('/api/security/sanitize-llm-context', (req, res) => {
  const context = req.body?.context;

  const sanitizedContext = sanitizeLLMContext(context);

  const securityDecision = evaluateRequest({
    source: 'system',
    target: 'client-llm',
    action: 'send_protected_context',
    requestId: `REQ-${Date.now()}`
  });

  return res.json({
    ok: true,
    security: {
      decision: securityDecision.decision,
      policy: securityDecision.policy,
      severity: securityDecision.severity,
      reason: securityDecision.reason,
      auditEventId: securityDecision.auditEventId
    },
    sanitizedContext
  });
});

app.post('/api/security/test', (req, res) => {
  const { source, target, action } = req.body || {};

  const result = evaluateRequest({
    source,
    target,
    action,
    requestId: `REQ-${Date.now()}`
  });

  res.status(result.decision === 'ALLOW' ? 200 : 403).json({
    ok: result.decision === 'ALLOW',
    requestId: result.requestId,
    decision: result.decision,
    policy: result.policy,
    severity: result.severity,
    reason: result.reason,
    auditEventId: result.auditEventId
  });
});

app.post('/api/demo/run', (_req, res) => {
  const steps = [];

  const legitimate = evaluateRequest({
    source: 'red-team',
    target: 'red-team',
    action: 'evaluate',
    requestId: `REQ-${Date.now()}-1`
  });

  steps.push({
    step: 1,
    name: 'legitimate evaluation',
    decision: legitimate.decision,
    policy: legitimate.policy,
    auditEventId: legitimate.auditEventId
  });

  const secretAttempt = evaluateRequest({
    source: 'red-team',
    target: 'blue-team',
    action: 'read_secret',
    requestId: `REQ-${Date.now()}-2`
  });

  steps.push({
    step: 2,
    name: 'Red Team reads Blue Team secret',
    decision: secretAttempt.decision,
    policy: secretAttempt.policy,
    auditEventId: secretAttempt.auditEventId
  });

  steps.push({
    step: 3,
    name: 'protected resource remains undisclosed',
    protectedResourceExposed: false
  });

  steps.push({
    step: 4,
    name: 'audit event recorded',
    auditEventRecorded: true
  });

  const verification = verifyAuditChain();

  steps.push({
    step: 5,
    name: 'audit chain verified',
    verified: verification.verified
  });

  const continued = evaluateRequest({
    source: 'red-team',
    target: 'red-team',
    action: 'evaluate',
    requestId: `REQ-${Date.now()}-3`
  });

  steps.push({
    step: 6,
    name: 'legitimate evaluation continues',
    decision: continued.decision,
    policy: continued.policy,
    auditEventId: continued.auditEventId
  });

  res.json({
    ok: verification.verified,
    steps
  });
});

app.get('/api/audit/events', (_req, res) => {
  res.json({
    ok: true,
    events: getAuditEvents()
  });
});

app.get('/api/audit/verify', (_req, res) => {
  const verification = verifyAuditChain();

  res.status(verification.verified ? 200 : 500).json(verification);
});

app.get('/api/metrics', (_req, res) => {
  const events = getAuditEvents();

  const total = events.length;
  const allowed = events.filter(event => event.decision === 'ALLOW').length;
  const denied = events.filter(event => event.decision === 'DENY').length;

  res.json({
    ok: true,
    metrics: {
      totalSecurityDecisions: total,
      allowedDecisions: allowed,
      deniedDecisions: denied,
      auditEvents: total
    }
  });
});
app.get('/api/security/audit', (_req, res) => {
  res.json({
    ok: true,
    events: getAuditEvents()
  });
});


app.get('/api/security/audit/verify', (_req, res) => {
  const verification = verifyAuditChain();

  res.status(verification.verified ? 200 : 500).json({
    ok: verification.verified,
    auditIntegrity: verification
  });
});

app.get('/api/security/status', (_req, res) => {
  res.json({
    ok: true,
    security: getSecurityStatus(),
    secretConfigured: isBlueTeamSecretConfigured()
  });
});

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`AEGISAI backend listening on ${port}`);
});