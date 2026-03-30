const { chromium } = require('playwright');
const StateManager = require('./utils/state-manager');

class BrowserController {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async initialize() {
    const storageStatePath = StateManager.getStorageStatePath();
    const fs = require('fs');

    // Try to connect to existing browser first
    const endpointData = StateManager.loadEndpoint();
    if (endpointData && endpointData.wsEndpoint) {
      try {
        this.browser = await chromium.connectOverCDP(endpointData.wsEndpoint);
        const contexts = this.browser.contexts();

        if (contexts.length > 0) {
          this.context = contexts[0];
          const pages = this.context.pages();

          if (pages.length > 0) {
            this.page = pages[0];
            // Successfully reconnected
            return this;
          }
        }

        // If we connected but no context/page, create them
        if (!this.context) {
          const contextOptions = { viewport: null };
          if (fs.existsSync(storageStatePath)) {
            contextOptions.storageState = storageStatePath;
          }
          this.context = await this.browser.newContext(contextOptions);
        }

        if (!this.page) {
          this.page = await this.context.newPage();
        }

        return this;
      } catch (error) {
        // Connection failed, will create new browser
        StateManager.clearState();
      }
    }

    // Launch new browser
    this.browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized', '--remote-debugging-port=9222']
    });

    // Save the endpoint for reconnection
    const wsEndpoint = `http://localhost:9222`;
    StateManager.saveEndpoint(wsEndpoint);

    // Try to restore previous session
    const contextOptions = {
      viewport: null // Use full window
    };

    if (fs.existsSync(storageStatePath)) {
      contextOptions.storageState = storageStatePath;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    // Save state on page changes
    this.page.on('load', async () => {
      await this.saveCurrentState();
    });

    return this;
  }

  async saveCurrentState() {
    const storageStatePath = StateManager.getStorageStatePath();
    await this.context.storageState({ path: storageStatePath });

    StateManager.saveState({
      url: this.page.url(),
      title: await this.page.title(),
      timestamp: new Date().toISOString()
    });
  }

  async navigate(url) {
    await this.page.goto(url, { waitUntil: 'networkidle' });
    await this.saveCurrentState();
    return {
      url: this.page.url(),
      title: await this.page.title()
    };
  }

  async snapshot() {
    // Get accessibility tree
    const snapshot = await this.page.accessibility.snapshot();

    // Generate refs for interactive elements
    const refs = {};
    let refCounter = 1;

    const processNode = (node, path = '') => {
      if (!node) return '';

      let output = '';
      const indent = '  '.repeat(path.split('/').length - 1);

      // Generate ref for interactive elements
      let refStr = '';
      if (['button', 'link', 'textbox', 'checkbox', 'combobox', 'menuitem'].includes(node.role)) {
        const ref = `ref${refCounter++}`;
        refs[ref] = {
          role: node.role,
          name: node.name,
          path: path
        };
        refStr = ` [ref=${ref}]`;
      }

      output += `${indent}- ${node.role} "${node.name || ''}"${refStr}\n`;

      if (node.children) {
        node.children.forEach((child, i) => {
          output += processNode(child, `${path}/${i}`);
        });
      }

      return output;
    };

    const tree = processNode(snapshot, '0');
    StateManager.saveRefs(refs);

    return tree;
  }

  async click(ref) {
    const refs = StateManager.loadRefs();
    const element = refs[ref];

    if (!element) {
      throw new Error(`Ref "${ref}" not found. Run snapshot first.`);
    }

    // Find element by role and name
    const locator = this.page.getByRole(element.role, { name: element.name });
    await locator.click();
    await this.saveCurrentState();

    return { clicked: ref, element: element };
  }

  async type(text, ref = null) {
    if (ref) {
      await this.click(ref);
    }
    await this.page.keyboard.type(text);
    return { typed: text };
  }

  async fillForm(fields) {
    // fields: [{ref: 'ref1', value: 'text'}, ...]
    const results = [];
    for (const field of fields) {
      await this.click(field.ref);
      await this.page.keyboard.type(field.value);
      results.push({ ref: field.ref, filled: true });
    }
    return results;
  }

  async pressKey(key) {
    await this.page.keyboard.press(key);
    return { pressed: key };
  }

  async screenshot(options = {}) {
    const filename = options.filename || `screenshot-${Date.now()}.png`;
    const filepath = require('path').join(__dirname, '..', '..', '..', '..', filename);

    await this.page.screenshot({
      path: filepath,
      fullPage: options.fullPage || false
    });

    return { saved: filepath };
  }

  async evaluate(script) {
    const result = await this.page.evaluate(script);
    return { result: result };
  }

  async getConsoleMessages(onlyErrors = false) {
    // Note: This needs to be set up before page load
    // For now, return instruction
    return {
      note: 'Console messages must be captured during page navigation',
      suggestion: 'Use evaluate to check for errors: document.querySelectorAll(".error")'
    };
  }

  async getNetworkRequests() {
    // Similar to console - needs setup before navigation
    return {
      note: 'Network requests must be captured during navigation',
      currentUrl: this.page.url()
    };
  }

  async wait(ms) {
    await this.page.waitForTimeout(ms);
    return { waited: ms };
  }

  async waitFor(selector, timeout = 30000) {
    await this.page.waitForSelector(selector, { timeout });
    return { found: selector };
  }

  async hover(ref) {
    const refs = StateManager.loadRefs();
    const element = refs[ref];

    if (!element) {
      throw new Error(`Ref "${ref}" not found. Run snapshot first.`);
    }

    const locator = this.page.getByRole(element.role, { name: element.name });
    await locator.hover();

    return { hovered: ref };
  }

  async selectOption(ref, value) {
    const refs = StateManager.loadRefs();
    const element = refs[ref];

    if (!element) {
      throw new Error(`Ref "${ref}" not found. Run snapshot first.`);
    }

    const locator = this.page.getByRole(element.role, { name: element.name });
    await locator.selectOption(value);

    return { selected: value, in: ref };
  }

  async goBack() {
    await this.page.goBack();
    await this.saveCurrentState();
    return { url: this.page.url() };
  }

  async goForward() {
    await this.page.goForward();
    await this.saveCurrentState();
    return { url: this.page.url() };
  }

  async savePdf(filename) {
    const filepath = require('path').join(__dirname, '..', '..', '..', '..', filename);
    await this.page.pdf({ path: filepath, format: 'A4' });
    return { saved: filepath };
  }

  async close() {
    StateManager.clearState();
    await this.browser.close();
    return { closed: true };
  }

  async generateTest(testName) {
    const state = StateManager.loadState();
    const refs = StateManager.loadRefs();

    // Generate basic test structure
    const test = `
import { test, expect } from '@playwright/test';

test('${testName}', async ({ page }) => {
  await page.goto('${state?.url || 'https://example.com'}');

  // Add your assertions here
  // Available refs from last snapshot:
  ${Object.entries(refs).map(([ref, el]) =>
    `// ${ref}: ${el.role} "${el.name}"`
  ).join('\n  ')}
});
`;

    return { test: test };
  }
}

// Singleton instance
let controllerInstance = null;

async function getController() {
  if (!controllerInstance) {
    controllerInstance = new BrowserController();
    await controllerInstance.initialize();
  }
  return controllerInstance;
}

module.exports = { BrowserController, getController };
