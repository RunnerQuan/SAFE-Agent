#!/usr/bin/env node
const { getController } = require('./browser-controller');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  const filename = process.argv[2] || `page-${Date.now()}.pdf`;

  try {
    const controller = await getController();
    const result = await controller.savePdf(filename);
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
