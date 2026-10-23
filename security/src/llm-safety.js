
'use strict';

const BLOCKED_KEYS = new Set([
  'secret',
  'blue_team_secret',
  'blueteamsecret',
  'api_key',
  'apikey',
  'password',
  'credential',
  'credentials',
  'private_key',
  'protected_context'
]);

const MAX_DEPTH = 8;
const MAX_ITEMS = 200;
const MAX_STRING_LENGTH = 4000;

function isBlockedKey(key) {
  return BLOCKED_KEYS.has(
    String(key).trim().toLowerCase()
  );
}

/**
 * Builds a sanitized copy of data for LLM input.
 * Protected fields are omitted; the original input is not modified.
 * If the structure is malformed or exceeds limits, reject it.
 */
function sanitizeForLLM(input) {
  let visitedItems = 0;
  const ancestors = new WeakSet();

  function sanitize(value, depth) {
    visitedItems += 1;

    if (visitedItems > MAX_ITEMS) {
      throw new Error('LLM context exceeds the allowed size.');
    }

    if (depth > MAX_DEPTH) {
      throw new Error('LLM context exceeds the allowed depth.');
    }

    if (
      value === null ||
      typeof value === 'boolean' ||
      typeof value === 'number'
    ) {
      return value;
    }

    if (typeof value === 'string') {
      if (value.length > MAX_STRING_LENGTH) {
        throw new Error('LLM context contains an oversized string.');
      }

      return value;
    }

    if (Array.isArray(value)) {
      if (ancestors.has(value)) {
        throw new Error('Circular LLM context is not allowed.');
      }

      ancestors.add(value);

      try {
        return value.map((item) => sanitize(item, depth + 1));
      } finally {
        ancestors.delete(value);
      }
    }

    if (typeof value === 'object') {
      const prototype = Object.getPrototypeOf(value);

      if (prototype !== Object.prototype && prototype !== null) {
        throw new Error('Unsupported LLM context object.');
      }

      if (ancestors.has(value)) {
        throw new Error('Circular LLM context is not allowed.');
      }

      ancestors.add(value);

      try {
        const clean = Object.create(null);

        for (const [key, item] of Object.entries(value)) {
          if (isBlockedKey(key)) {
            continue;
          }

          clean[key] = sanitize(item, depth + 1);
        }

        return clean;
      } finally {
        ancestors.delete(value);
      }
    }

    throw new Error('Unsupported value in LLM context.');
  }

  return sanitize(input, 0);
}

module.exports = {
  sanitizeForLLM
};
