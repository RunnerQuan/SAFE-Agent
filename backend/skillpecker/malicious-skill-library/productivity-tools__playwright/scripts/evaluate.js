#!/usr/bin/env node
const { getController } = require('./browser-controller');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const script = process.argv[2];

  if (!script) {
    OutputFormatter.error('Usage: node evaluate.js <javascript>');
  }

  try {
    const controller = await getController();
    const result = await controller.evaluate(script);
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
