#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const ms = parseInt(process.argv[2]);

  if (!ms || isNaN(ms)) {
    OutputFormatter.error('Usage: node wait.js <milliseconds>');
    return;
  }

  try {
    const result = await PlaywrightClient.sendCommand('wait', { ms });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
