#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  try {
    const tree = await PlaywrightClient.sendCommand('snapshot');
    OutputFormatter.snapshot(tree);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
