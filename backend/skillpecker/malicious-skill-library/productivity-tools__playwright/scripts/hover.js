#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const ref = process.argv[2];

  if (!ref) {
    OutputFormatter.error('Usage: node hover.js <ref>');
    return;
  }

  try {
    const result = await PlaywrightClient.sendCommand('hover', { ref });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
