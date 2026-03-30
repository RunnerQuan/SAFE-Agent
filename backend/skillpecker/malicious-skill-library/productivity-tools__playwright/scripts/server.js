#!/usr/bin/env node
/**
 * Playwright Persistent Server
 *
 * Maintains a browser instance and handles commands via HTTP.
 * This solves the issue of browser persistence between script executions.
 */

const http = require('http');
const { chromium } = require('playwright');
const StateManager = require('./utils/state-manager');
const fs = require('fs');

const PORT = 3847;
const SERVER_PID_FILE = require('path').join(__dirname, '.server-pid');

class PlaywrightServer {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.refs = {};
    this.refCounter = 1;
  }

  async initialize() {
    const storageStatePath = StateManager.getStorageStatePath();

    this.browser = await chromium.launch({
      headless: false,
      args: ['--start-maximized']
    });

    const contextOptions = { viewport: null };
    if (fs.existsSync(storageStatePath)) {
      contextOptions.storageState = storageStatePath;
    }

    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();

    // Save state on page changes
    this.page.on('load', async () => {
      await this.saveCurrentState();
    });

    console.log('Browser initialized');
    return this;
  }

  async saveCurrentState() {
    try {
      const storageStatePath = StateManager.getStorageStatePath();
      await this.context.storageState({ path: storageStatePath });
      StateManager.saveState({
        url: this.page.url(),
        title: await this.page.title(),
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      // Ignore errors during state save
    }
  }

  async handleCommand(command, params) {
    switch (command) {
      case 'navigate':
        return await this.navigate(params.url);
      case 'snapshot':
        return await this.snapshot();
      case 'click':
        return await this.click(params.ref);
      case 'type':
        return await this.type(params.text, params.ref);
      case 'fillForm':
        return await this.fillForm(params.fields);
      case 'pressKey':
        return await this.pressKey(params.key);
      case 'screenshot':
        return await this.screenshot(params);
      case 'evaluate':
        return await this.evaluate(params.script);
      case 'wait':
        return await this.wait(params.ms);
      case 'waitFor':
        return await this.waitFor(params.selector, params.timeout);
      case 'hover':
        return await this.hover(params.ref);
      case 'selectOption':
        return await this.selectOption(params.ref, params.value);
      case 'goBack':
        return await this.goBack();
      case 'goForward':
        return await this.goForward();
      case 'savePdf':
        return await this.savePdf(params.filename);
      case 'close':
        return await this.close();
      case 'status':
        return await this.status();
      default:
        throw new Error(`Unknown command: ${command}`);
    }
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
    const snapshot = await this.page.accessibility.snapshot();
    this.refs = {};
    this.refCounter = 1;

    const processNode = (node, path = '') => {
      if (!node) return '';

      let output = '';
      const indent = '  '.repeat(path.split('/').length - 1);

      let refStr = '';
      if (['button', 'link', 'textbox', 'checkbox', 'combobox', 'menuitem'].includes(node.role)) {
        const ref = `ref${this.refCounter++}`;
        this.refs[ref] = {
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
    StateManager.saveRefs(this.refs);

    return tree;
  }

  async click(ref) {
    const element = this.refs[ref];
    if (!element) {
      throw new Error(`Ref "${ref}" not found. Run snapshot first.`);
    }

    // Try multiple strategies to find the element
    const name = element.name;
    const cleanName = name.replace(/\s+required$/i, '').trim();

    // Strategy 1: Try getByLabel for textbox (most reliable for form inputs)
    if (element.role === 'textbox') {
      try {
        const locator = this.page.getByLabel(cleanName);
        await locator.click({ timeout: 5000 });
        await this.saveCurrentState();
        return { clicked: ref, element: element };
      } catch {
        // Continue to next strategy
      }
    }

    // Strategy 2: Try getByRole with cleaned name
    try {
      const locator = this.page.getByRole(element.role, { name: cleanName });
      await locator.click({ timeout: 5000 });
      await this.saveCurrentState();
      return { clicked: ref, element: element };
    } catch {
      // Continue to next strategy
    }

    // Strategy 3: Try getByRole with original name, using first() if multiple matches
    const locator = this.page.getByRole(element.role, { name: name });

    // Check if there are multiple matches and use first()
    const count = await locator.count();
    if (count > 1) {
      await locator.first().click({ timeout: 10000 });
    } else {
      await locator.click({ timeout: 10000 });
    }
    await this.saveCurrentState();

    return { clicked: ref, element: element, note: count > 1 ? `Multiple matches (${count}), clicked first` : undefined };
  }

  async type(text, ref = null) {
    if (ref) {
      await this.click(ref);
    }
    await this.page.keyboard.type(text);
    return { typed: text };
  }

  async fillForm(fields) {
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
    const filepath = require('path').isAbsolute(filename)
      ? filename
      : require('path').join(__dirname, '..', '..', '..', '..', filename);

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

  async wait(ms) {
    await this.page.waitForTimeout(ms);
    return { waited: ms };
  }

  async waitFor(selector, timeout = 30000) {
    await this.page.waitForSelector(selector, { timeout });
    return { found: selector };
  }

  async hover(ref) {
    const element = this.refs[ref];
    if (!element) {
      throw new Error(`Ref "${ref}" not found. Run snapshot first.`);
    }

    const locator = this.page.getByRole(element.role, { name: element.name });
    await locator.hover();

    return { hovered: ref };
  }

  async selectOption(ref, value) {
    const element = this.refs[ref];
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

  async status() {
    return {
      url: this.page.url(),
      title: await this.page.title(),
      refs: Object.keys(this.refs).length
    };
  }
}

async function startServer() {
  const playwright = new PlaywrightServer();
  await playwright.initialize();

  const server = http.createServer(async (req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        try {
          const { command, params } = JSON.parse(body);
          const result = await playwright.handleCommand(command, params || {});

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, data: result }));

          // If close command, shut down server
          if (command === 'close') {
            console.log('Closing server...');
            if (fs.existsSync(SERVER_PID_FILE)) {
              fs.unlinkSync(SERVER_PID_FILE);
            }
            server.close();
            process.exit(0);
          }
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: error.message }));
        }
      });
    } else if (req.method === 'GET' && req.url === '/status') {
      try {
        const status = await playwright.status();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, data: status }));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: error.message }));
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  server.listen(PORT, () => {
    console.log(`Playwright server running on http://localhost:${PORT}`);
    // Save PID for management
    fs.writeFileSync(SERVER_PID_FILE, process.pid.toString());
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await playwright.close();
    if (fs.existsSync(SERVER_PID_FILE)) {
      fs.unlinkSync(SERVER_PID_FILE);
    }
    process.exit(0);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
