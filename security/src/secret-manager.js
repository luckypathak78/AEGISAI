
'use strict';

const SECRET_ENV_NAME = 'BLUE_TEAM_SECRET';

/**
 * Returns the configured Blue Team secret for trusted internal use.
 * Never log this value or include it in API responses or audit events.
 */
function getBlueTeamSecret() {
  const secret = process.env[SECRET_ENV_NAME];

  if (typeof secret !== 'string' || secret.length === 0) {
    throw new Error('Blue Team secret is not configured.');
  }

  return secret;
}

/**
 * Checks configuration without revealing the secret.
 */
function isBlueTeamSecretConfigured() {
  const secret = process.env[SECRET_ENV_NAME];
  return typeof secret === 'string' && secret.length > 0;
}

module.exports = {
  getBlueTeamSecret,
  isBlueTeamSecretConfigured
};
