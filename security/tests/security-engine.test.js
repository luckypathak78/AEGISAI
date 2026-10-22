
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluatePolicy } = require('../src/policy-engine');
const {
  createAuditChain,
  verifyEvents
} = require('../src/audit-chain');
const { sanitizeForLLM } = require('../src/llm-safety');
const {
  evaluateRequest,
  getAuditEvents,
  verifyAuditChain
} = require('../src/security-engine');
const {
  getBlueTeamSecret,
  isBlueTeamSecretConfigured
} = require('../src/secret-manager');

test('allows a same-boundary evaluation', () => {
  const result = evaluatePolicy({
    source: 'red-team',
    target: 'red-team',
    action: 'evaluate'
  });

  assert.equal(result.decision, 'ALLOW');
});

test('denies Red Team access to Blue Team secrets', () => {
  const result = evaluatePolicy({
    source: 'red-team',
    target: 'blue-team',
    action: 'read_secret'
  });

  assert.equal(result.decision, 'DENY');
  assert.equal(result.policy, 'NO_CROSS_TENANT_SECRET_ACCESS');
});

test('fails closed for invalid policy requests', () => {
  assert.equal(evaluatePolicy(null).decision, 'DENY');
  assert.equal(
    evaluatePolicy({ source: 'unknown', target: 'blue-team', action: 'evaluate' })
      .decision,
    'DENY'
  );
});

test('sanitizes protected fields without changing original input', () => {
  test('sanitizes camelCase Blue Team secret fields', () => {
  const input = {
    username: 'Lucky',
    blueTeamSecret: 'TEST_SECRET',
    normalData: 'hello'
  };

  const clean = sanitizeForLLM(input);

  assert.equal(clean.username, 'Lucky');
  assert.equal(Object.hasOwn(clean, 'blueTeamSecret'), false);
  assert.equal(clean.normalData, 'hello');
  assert.equal(input.blueTeamSecret, 'TEST_SECRET');
});
  const input = {
    message: 'hello',
    blue_team_secret: 'TEST_SECRET',
    nested: {
      password: 'TEST_PASSWORD',
      topic: 'security'
    }
  };

  const clean = sanitizeForLLM(input);

  assert.equal(clean.message, 'hello');
  assert.equal(Object.hasOwn(clean, 'blue_team_secret'), false);
  assert.equal(Object.hasOwn(clean.nested, 'password'), false);
  assert.equal(clean.nested.topic, 'security');
  assert.equal(input.blue_team_secret, 'TEST_SECRET');
});

test('security engine denies secret access and audits the decision', () => {
  const beforeCount = getAuditEvents().length;

  const response = evaluateRequest({
    requestId: 'REQ-TEST-SECURITY',
    source: 'red-team',
    target: 'blue-team',
    action: 'read_secret',
    payload: 'TEST_SECRET_DO_NOT_RETURN'
  });

  assert.equal(response.decision, 'DENY');
  assert.equal(response.policy, 'NO_CROSS_TENANT_SECRET_ACCESS');
  assert.equal(
    JSON.stringify(response).includes('TEST_SECRET_DO_NOT_RETURN'),
    false
  );

  const events = getAuditEvents();
  assert.equal(events.length, beforeCount + 1);
  assert.equal(
    events.some((event) => event.requestId === 'REQ-TEST-SECURITY'),
    true
  );
  assert.equal(verifyAuditChain().verified, true);
});

test('audit chain detects a modified event', () => {
  const chain = createAuditChain();

  chain.append({
    eventId: 'EVT-TEST-001',
    requestId: 'REQ-TEST-001',
    timestamp: '2026-10-22T14:00:00.000Z',
    source: 'red-team',
    target: 'blue-team',
    action: 'read_secret',
    decision: 'DENY',
    policy: 'NO_CROSS_TENANT_SECRET_ACCESS',
    severity: 'HIGH',
    reason: 'Cross-boundary secret access is not permitted.'
  });

  const modified = chain.getEvents();
  modified[0].reason = 'Modified event';

  assert.equal(verifyEvents(chain.getEvents()).verified, true);
  assert.equal(verifyEvents(modified).verified, false);
});

test('secret manager rejects missing configuration without exposing values', () => {
  const previous = process.env.BLUE_TEAM_SECRET;

  try {
    delete process.env.BLUE_TEAM_SECRET;

    assert.equal(isBlueTeamSecretConfigured(), false);
    assert.throws(
      () => getBlueTeamSecret(),
      /Blue Team secret is not configured/
    );
  } finally {
    if (previous === undefined) {
      delete process.env.BLUE_TEAM_SECRET;
    } else {
      process.env.BLUE_TEAM_SECRET = previous;
    }
  }
});

test('audit chain rejects unexpected fields', () => {
  const chain = createAuditChain();

  chain.append({
    eventId: 'EVT-EXTRA-001',
    requestId: 'REQ-EXTRA-001',
    timestamp: '2026-10-22T14:00:00.000Z',
    source: 'red-team',
    target: 'blue-team',
    action: 'read_secret',
    decision: 'DENY',
    policy: 'NO_CROSS_TENANT_SECRET_ACCESS',
    severity: 'HIGH',
    reason: 'Cross-boundary secret access is not permitted.'
  });

  const modified = chain.getEvents();
  modified[0].unexpectedField = 'not-allowed';

  const result = verifyEvents(modified);

  assert.equal(result.verified, false);
  assert.equal(result.eventsChecked, 1);
});

test('denies Blue Team access to Red Team secrets', () => {
  const result = evaluatePolicy({
    source: 'blue-team',
    target: 'red-team',
    action: 'read_secret'
  });

  assert.equal(result.decision, 'DENY');
  assert.equal(result.policy, 'NO_CROSS_TENANT_SECRET_ACCESS');
});

test('denies unauthorized protected file access', () => {
  const result = evaluatePolicy({
    source: 'red-team',
    target: 'blue-team',
    action: 'read_protected_file'
  });

  assert.equal(result.decision, 'DENY');
  assert.equal(result.policy, 'NO_UNAUTHORIZED_FILE_ACCESS');
});

test('denies simulated unauthorized network actions', () => {
  const result = evaluatePolicy({
    source: 'red-team',
    target: 'blue-team',
    action: 'network_access'
  });

  assert.equal(result.decision, 'DENY');
  assert.equal(result.policy, 'CROSS_BOUNDARY_AUTHORIZATION');
});

test('denies protected context exposure to the client LLM', () => {
  const result = evaluatePolicy({
    source: 'red-team',
    target: 'client-llm',
    action: 'send_protected_context'
  });

  assert.equal(result.decision, 'DENY');
  assert.equal(result.policy, 'LLM_PROTECTED_CONTEXT');
});

test('audit metadata does not copy arbitrary target or action text', () => {
  const response = evaluateRequest({
    requestId: 'request-with-invalid-format',
    source: 'red-team',
    target: 'private secret text',
    action: 'sensitive payload text'
  });

  const event = getAuditEvents().find(
    (item) => item.eventId === response.auditEventId
  );

  assert.ok(event);
  assert.equal(event.target, 'unknown-target');
  assert.equal(event.action, 'unrecognized-action');
  assert.equal(event.requestId.startsWith('REQ-'), true);
  assert.equal(
    JSON.stringify(event).includes('sensitive payload text'),
    false
  );
  assert.equal(verifyAuditChain().verified, true);
});
