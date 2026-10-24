'use strict';

const TINYFISH_URL = 'https://agent.tinyfish.ai/v1/automation/run';

async function runTinyFish({ url, goal }) {
  const apiKey = process.env.TINYFISH_API_KEY;

  if (!apiKey) {
    throw new Error('TINYFISH_API_KEY is not configured');
  }

  if (!url || !goal) {
    throw new Error('url and goal are required');
  }

  const response = await fetch(TINYFISH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify({
      url,
      goal
    })
  });

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `TinyFish request failed with status ${response.status}`;

    throw new Error(message);
  }

  return data;
}

module.exports = {
  runTinyFish
};