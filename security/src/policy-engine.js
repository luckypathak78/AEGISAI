
'use strict';

const POLICY_IDS = Object.freeze({
  NO_CROSS_TENANT_SECRET_ACCESS:
    'NO_CROSS_TENANT_SECRET_ACCESS',
  NO_UNAUTHORIZED_FILE_ACCESS:
    'NO_UNAUTHORIZED_FILE_ACCESS',
  LLM_PROTECTED_CONTEXT:
    'LLM_PROTECTED_CONTEXT',
  CROSS_BOUNDARY_AUTHORIZATION:
    'CROSS_BOUNDARY_AUTHORIZATION',
  AUDIT_ALL_SECURITY_DECISIONS:
    'AUDIT_ALL_SECURITY_DECISIONS'
});

const ALLOWED_SOURCES = new Set([
  'red-team',
  'blue-team',
  'client-llm',
  'system'
]);

const SECRET_ACTIONS = new Set([
  'read_secret',
  'access_secret'
]);

const FILE_ACTIONS = new Set([
  'read_file',
  'write_file',
  'access_file',
  'read_protected_file',
  'write_protected_file'
]);

const NETWORK_ACTIONS = new Set([
  'network',
  'network_request',
  'network_access',
  'connect',
  'send_network_request'
]);

const PROTECTED_CONTEXT_ACTIONS = new Set([
  'read_protected_context',
  'send_protected_context',
  'include_protected_context',
  'expose_protected_context'
]);

const SAFE_EVALUATION_ACTION = 'evaluate';
const TINYFISH_ACTION = 'tinyfish_investigate';

function result(decision, policy, severity, reason) {
  return Object.freeze({
    decision,
    policy,
    severity,
    reason
  });
}

function denyInvalidRequest() {
  return result(
    'DENY',
    POLICY_IDS.CROSS_BOUNDARY_AUTHORIZATION,
    'MEDIUM',
    'Request is invalid or missing required fields.'
  );
}

function evaluatePolicy(request) {
  // Fail closed for malformed input without exposing its contents.
  if (
    request === null ||
    typeof request !== 'object' ||
    Array.isArray(request)
  ) {
    return denyInvalidRequest();
  }

  const { source, target, action } = request;

  if (
    typeof source !== 'string' ||
    !ALLOWED_SOURCES.has(source) ||
    typeof target !== 'string' ||
    target.trim().length === 0 ||
    target.length > 128 ||
    typeof action !== 'string' ||
    action.trim().length === 0 ||
    action.length > 128
  ) {
    return denyInvalidRequest();
  }

  const normalizedTarget = target.trim().toLowerCase();
  const normalizedAction = action.trim().toLowerCase();

  // Protected information must not be sent to the client LLM.
  if (
    normalizedTarget === 'client-llm' &&
    (
      SECRET_ACTIONS.has(normalizedAction) ||
      PROTECTED_CONTEXT_ACTIONS.has(normalizedAction)
    )
  ) {
    return result(
      'DENY',
      POLICY_IDS.LLM_PROTECTED_CONTEXT,
      'HIGH',
      'Protected context cannot be exposed to the client LLM.'
    );
  }

  // Secret access across team boundaries is always denied.
  if (
    SECRET_ACTIONS.has(normalizedAction) &&
    source !== normalizedTarget
  ) {
    return result(
      'DENY',
      POLICY_IDS.NO_CROSS_TENANT_SECRET_ACCESS,
      'HIGH',
      'Cross-boundary secret access is not permitted.'
    );
  }

  // Protected-file actions require authorization.
  // No authorization-grant schema is defined in the shared contract,
  // so this initial evaluator denies these actions.
  if (FILE_ACTIONS.has(normalizedAction)) {
    return result(
      'DENY',
      POLICY_IDS.NO_UNAUTHORIZED_FILE_ACCESS,
      'HIGH',
      'Protected file access is not authorized.'
    );
  }

  // Network actions are simulated only; no network operation is performed.
  if (NETWORK_ACTIONS.has(normalizedAction)) {
    return result(
      'DENY',
      POLICY_IDS.CROSS_BOUNDARY_AUTHORIZATION,
      'HIGH',
      'Network action is not authorized by the active policy.'
    );
  }

  // A legitimate evaluation is allowed within its own boundary.
  if (
    normalizedAction === SAFE_EVALUATION_ACTION &&
    source === normalizedTarget
  ) {
    return result(
      'ALLOW',
      POLICY_IDS.CROSS_BOUNDARY_AUTHORIZATION,
      'LOW',
      'Same-boundary evaluation is permitted.'
    );
  }

  // TinyFish investigations are explicitly authorized as a controlled
// external-web operation from the client LLM boundary to the system.
if (
  normalizedAction === TINYFISH_ACTION &&
  source === 'client-llm' &&
  normalizedTarget === 'system'
) {
  return result(
    'ALLOW',
    POLICY_IDS.CROSS_BOUNDARY_AUTHORIZATION,
    'LOW',
    'Authorized TinyFish web investigation is permitted.'
  );
}

  // Unknown and cross-boundary actions are not implicitly trusted.
  return result(
    'DENY',
    POLICY_IDS.CROSS_BOUNDARY_AUTHORIZATION,
    'MEDIUM',
    'Action is not explicitly authorized by the active policy.'
  );
}

module.exports = {
  POLICY_IDS,
  evaluatePolicy
};
