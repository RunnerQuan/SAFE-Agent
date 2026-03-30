#!/usr/bin/env node
const { getController } = require('./browser-controller');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const ref = process.argv[2];
  const value = process.argv[3];

  if (!ref || !value) {
    OutputFormatter.error('Usage: node select-option.js <ref> <value>');
  }

  try {
    const controller = await getController();
    const result = await controller.selectOption(ref, value);
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
