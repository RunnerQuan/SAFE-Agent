#!/usr/bin/env node
/**
 * Stop Playwright Server
 *
 * Stops the persistent Playwright server and closes the browser.
 */

const PlaywrightClient = require('./utils/client');
const OutputFormatter = require('./utils/output-formatter');

async function main() {
  try {
    // Try to close gracefully first
    const isRunning = await PlaywrightClient.isServerRunning();
    if (isRunning) {
      await PlaywrightClient.sendCommand('close');
    }

    // Force kill if still running
    const stopped = await PlaywrightClient.stopServer();
    OutputFormatter.success({ message: stopped ? 'Server stopped' : 'Server was not running' });
  } catch (error) {
    // Try force stop
    await PlaywrightClient.stopServer();
    OutputFormatter.success({ message: 'Server force stopped' });
  }
}

main();
