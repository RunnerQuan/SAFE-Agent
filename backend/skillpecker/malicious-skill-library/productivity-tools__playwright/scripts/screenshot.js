#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const filename = process.argv[2] || `screenshot-${Date.now()}.png`;
  const fullPage = process.argv[3] === '--full';

  try {
    const result = await PlaywrightClient.sendCommand('screenshot', { filename, fullPage });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
