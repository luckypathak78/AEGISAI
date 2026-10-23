'use strict';

const { randomUUID } = require('node:crypto');
const {
  POLICY_IDS,
  evaluatePolicy
} = require('./policy-engine');
const {
  createAuditChain
} = require('./audit-chain');
const {
  sanitizeForLLM
} = require('./llm-safety');
const {
  isBlueTeamSecretConfigured
} = require('./secret-manager');

const VALID_SOURCES = new Set([
  'red-team',
  'blue-team',
  'client-llm',
  'system'
]);

const auditChain = createAuditChain();

function createId(prefix) {
  return `${prefix}-${randomUUID()}`;
}


const VALID_TARGETS = new Set([
  'red-team',
  'blue-team',
  'client-llm',
  'system'
]);

const AUDITABLE_ACTIONS = new Set([
  'evaluate',
  'read_secret',
  'access_secret',
  'read_file',
  'write_file',
  'access_file',
  'read_protected_file',
  'write_protected_file',
  'network',
  'network_request',
  'network_access',
  'connect',
  'send_network_request',
  'read_protected_context',
  'send_protected_context',
  'include_protected_context',
  'expose_protected_context'
]);

function safeAuditTarget(value) {
  return typeof value === 'string' &&
    VALID_TARGETS.has(value.trim().toLowerCase())
    ? value.trim().toLowerCase()
    : 'unknown-target';
}

function safeAuditAction(value) {
  return typeof value === 'string' &&
    AUDITABLE_ACTIONS.has(value.trim().toLowerCase())
    ? value.trim().toLowerCase()
    : 'unrecognized-action';
}

function safeRequestId(value) {
  if (
    typeof value === 'string' &&
    /^REQ-[A-Za-z0-9-]{1,100}$/.test(value)
  ) {
    return value;
  }

  return createId('REQ');
}


function evaluateRequest(request) {
  const policyResult = evaluatePolicy(request);

  // Keep audit records sanitized, even for malformed requests.
  const source =
    request &&
    typeof request === 'object' &&
    VALID_SOURCES.has(request.source)
      ? request.source
      : 'system';
  const target = safeAuditTarget(
    request && typeof request === 'object' ? request.target : null
  );

  const action = safeAuditAction(
    request && typeof request === 'object' ? request.action : null
  );

  const requestId = safeRequestId(
    request && typeof request === 'object' ? request.requestId : null
  );


  const auditEventId = createId('EVT');

  auditChain.append({
    eventId: auditEventId,
    requestId,
    timestamp: new Date().toISOString(),
    source,
    target,
    action,
    decision: policyResult.decision,
    policy: policyResult.policy,
    severity: policyResult.severity,
    reason: policyResult.reason
  });

  // Never return request payloads or protected secrets.
  return Object.freeze({
    requestId,
    decision: policyResult.decision,
    policy: policyResult.policy,
    severity: policyResult.severity,
    reason: policyResult.reason,
    auditEventId
  });
}

function getAuditEvents() {
  return auditChain.getEvents();
}

function verifyAuditChain() {
  return auditChain.verify();
}

function sanitizeLLMContext(context) {
  return sanitizeForLLM(context);
}

function getSecurityStatus() {
  return Object.freeze({
    policyEngine: 'ACTIVE',
    auditPlane: 'ACTIVE',
    auditIntegrity: auditChain.verify().verified
      ? 'VERIFIED'
      : 'FAILED',
    blueTeamSecretConfigured: isBlueTeamSecretConfigured()
  });
}

module.exports = {
  evaluateRequest,
  getAuditEvents,
  verifyAuditChain,
  sanitizeLLMContext,
  getSecurityStatus
};
