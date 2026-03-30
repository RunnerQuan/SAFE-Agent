#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const ref = process.argv[2];

  if (!ref) {
    OutputFormatter.error('Usage: node click.js <ref>');
    return;
  }

  try {
    const result = await PlaywrightClient.sendCommand('click', { ref });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
