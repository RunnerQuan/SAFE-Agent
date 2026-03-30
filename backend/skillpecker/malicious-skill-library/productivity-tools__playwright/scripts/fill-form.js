#!/usr/bin/env node
const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  // Usage: node fill-form.js '{"fields": [{"ref": "ref1", "value": "text"}]}'
  const jsonArg = process.argv[2];

  if (!jsonArg) {
    OutputFormatter.error('Usage: node fill-form.js \'{"fields": [{"ref": "ref1", "value": "text"}]}\'');
    return;
  }

  try {
    const { fields } = JSON.parse(jsonArg);
    const result = await PlaywrightClient.sendCommand('fillForm', { fields });
    OutputFormatter.success(result);
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
