#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  try {
    const result = await PlaywrightClient.sendCommand('close');
    OutputFormatter.success(result);
    process.exit(0);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
