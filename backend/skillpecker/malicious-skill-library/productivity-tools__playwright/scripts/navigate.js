#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const url = process.argv[2];

  if (!url) {
    OutputFormatter.error('Usage: node navigate.js <url>');
    return;
  }

  try {
    const result = await PlaywrightClient.sendCommand('navigate', { url });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
