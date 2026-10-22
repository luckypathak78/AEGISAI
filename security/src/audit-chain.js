
'use strict';

const crypto = require('node:crypto');

const GENESIS_HASH = 'GENESIS';

const EVENT_FIELDS = Object.freeze([
  'eventId',
  'requestId',
  'timestamp',
  'source',
  'target',
  'action',
  'decision',
  'policy',
  'severity',
  'reason'
]);

const VALID_DECISIONS = new Set(['ALLOW', 'DENY']);
const VALID_SEVERITIES = new Set([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
]);

function hashEvent(eventData, previousHash) {
  // Fixed field order ensures consistent hashing.
  const canonicalEvent = {};

  for (const field of EVENT_FIELDS) {
    canonicalEvent[field] = eventData[field];
  }

  canonicalEvent.previousHash = previousHash;

  return crypto
    .createHash('sha256')
    .update(JSON.stringify(canonicalEvent))
    .digest('hex');
}

function validateEventData(eventData) {
  if (
    eventData === null ||
    typeof eventData !== 'object' ||
    Array.isArray(eventData)
  ) {
    throw new Error('Audit event must be an object.');
  }

  // Accept only the contract fields that this module needs.
  const keys = Object.keys(eventData);

  if (
    keys.length !== EVENT_FIELDS.length ||
    keys.some((key) => !EVENT_FIELDS.includes(key))
  ) {
    throw new Error('Audit event does not match the expected schema.');
  }

  for (const field of EVENT_FIELDS) {
    if (
      typeof eventData[field] !== 'string' ||
      eventData[field].trim().length === 0
    ) {
      throw new Error(`Invalid audit event field: ${field}`);
    }
  }

  if (
    !Number.isFinite(Date.parse(eventData.timestamp)) ||
    !/^\d{4}-\d{2}-\d{2}T/.test(eventData.timestamp)
  ) {
    throw new Error('Audit timestamp must be ISO-8601 formatted.');
  }

  if (!VALID_DECISIONS.has(eventData.decision)) {
    throw new Error('Invalid audit decision.');
  }

  if (!VALID_SEVERITIES.has(eventData.severity)) {
    throw new Error('Invalid audit severity.');
  }
}


function verifyEvents(events) {
  if (!Array.isArray(events)) {
    return {
      verified: false,
      eventsChecked: 0,
      message: 'Audit chain is invalid.'
    };
  }

  let previousHash = GENESIS_HASH;
  let checked = 0;

  for (const event of events) {
    checked += 1;

    if (
      event === null ||
      typeof event !== 'object' ||
      Array.isArray(event)
    ) {
      return {
        verified: false,
        eventsChecked: checked,
        message: 'Audit chain integrity verification failed.'
      };
    }

    const expectedFields = [
      ...EVENT_FIELDS,
      'previousHash',
      'eventHash'
    ];

    const actualFields = Object.keys(event);

    if (
      actualFields.length !== expectedFields.length ||
      actualFields.some((field) => !expectedFields.includes(field))
    ) {
      return {
        verified: false,
        eventsChecked: checked,
        message: 'Audit chain integrity verification failed.'
      };
    }

    const eventData = {};

    for (const field of EVENT_FIELDS) {
      eventData[field] = event[field];
    }

    try {
      validateEventData(eventData);
    } catch {
      return {
        verified: false,
        eventsChecked: checked,
        message: 'Audit chain integrity verification failed.'
      };
    }

    if (
      event.previousHash !== previousHash ||
      typeof event.eventHash !== 'string' ||
      event.eventHash !== hashEvent(eventData, previousHash)
    ) {
      return {
        verified: false,
        eventsChecked: checked,
        message: 'Audit chain integrity verification failed.'
      };
    }

    previousHash = event.eventHash;
  }

  return {
    verified: true,
    eventsChecked: checked,
    message: 'Audit chain integrity verified'
  };
}


function createAuditChain() {
  const events = [];

  function append(eventData) {
    validateEventData(eventData);

    // Copy only approved contract fields; don't mutate the caller's object.
    const cleanData = {};

    for (const field of EVENT_FIELDS) {
      cleanData[field] = eventData[field];
    }

    const previousHash =
      events.length === 0
        ? GENESIS_HASH
        : events[events.length - 1].eventHash;

    const event = Object.freeze({
      ...cleanData,
      previousHash,
      eventHash: hashEvent(cleanData, previousHash)
    });

    events.push(event);

    return { ...event };
  }

  function getEvents() {
    return events.map((event) => ({ ...event }));
  }

  function verify() {
    return verifyEvents(getEvents());
  }

  return Object.freeze({
    append,
    getEvents,
    verify
  });
}

module.exports = {
  createAuditChain,
  verifyEvents
};
