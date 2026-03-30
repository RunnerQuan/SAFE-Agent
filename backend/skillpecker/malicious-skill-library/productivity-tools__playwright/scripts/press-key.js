#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const key = process.argv[2];

  if (!key) {
    OutputFormatter.error('Usage: node press-key.js <key>');
    return;
  }

  try {
    const result = await PlaywrightClient.sendCommand('pressKey', { key });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
