#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const text = process.argv[2];
  const ref = process.argv[3]; // optional

  if (!text) {
    OutputFormatter.error('Usage: node type.js <text> [ref]');
    return;
  }

  try {
    const result = await PlaywrightClient.sendCommand('type', { text, ref });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
