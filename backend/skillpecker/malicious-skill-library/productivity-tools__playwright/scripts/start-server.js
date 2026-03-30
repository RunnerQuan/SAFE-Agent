#!/usr/bin/env node
/**
 * Start Playwright Server
 *
 * Starts the persistent Playwright server in the background.
 */

const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  try {
    const isRunning = await PlaywrightClient.isServerRunning();
    if (isRunning) {
      OutputFormatter.success({ message: 'Server already running' });
      return;
    }

    await PlaywrightClient.startServer();
    await PlaywrightClient.waitForServer();
    OutputFormatter.success({ message: 'Server started successfully' });
  } catch (error) {
    OutputFormatter.error(error.message);
  }
}

main();
