#!/usr/bin/env node
const { getController } = require('./browser-controller');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const selector = process.argv[2];
  const timeout = parseInt(process.argv[3]) || 30000;

  if (!selector) {
    OutputFormatter.error('Usage: node wait-for.js <selector> [timeout_ms]');
  }

  try {
    const controller = await getController();
    const result = await controller.waitFor(selector, timeout);
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
