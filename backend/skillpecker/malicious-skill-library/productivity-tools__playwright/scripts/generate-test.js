#!/usr/bin/env node
const { getController } = require('./browser-controller');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const testName = process.argv[2] || 'generated-test';

  try {
    const controller = await getController();
    const result = await controller.generateTest(testName);
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
