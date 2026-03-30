/**
 * Playwright Server Client
 *
 * Communicates with the persistent Playwright server.
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const PORT = 3847;
const SERVER_SCRIPT = path.join(__dirname, '..', 'server.js');
const SERVER_PID_FILE = path.join(__dirname, '..', '.server-pid');

class PlaywrightClient {
  static async sendCommand(command, params = {}) {
    // Check if server is running, if not start it
    const isRunning = await this.isServerRunning();
    if (!isRunning) {
      await this.startServer();
      // Wait for server to be ready
      await this.waitForServer();
    }

    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ command, params });

      const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data)
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(body);
            if (result.success) {
              resolve(result.data);
            } else {
              reject(new Error(result.error));
            }
          } catch (e) {
            reject(new Error(`Invalid response: ${body}`));
          }
        });
      });

      req.on('error', (e) => {
        reject(new Error(`Server connection failed: ${e.message}`));
      });

      req.write(data);
      req.end();
    });
  }

  static async isServerRunning() {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: PORT,
        path: '/status',
        method: 'GET',
        timeout: 1000
      }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  static async startServer() {
    return new Promise((resolve, reject) => {
      console.log('Starting Playwright server...');

      const child = spawn('node', [SERVER_SCRIPT], {
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      let started = false;

      child.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('server running') && !started) {
          started = true;
          child.unref();
          resolve();
        }
      });

      child.stderr.on('data', (data) => {
        console.error('Server error:', data.toString());
      });

      child.on('error', (err) => {
        reject(new Error(`Failed to start server: ${err.message}`));
      });

      // Timeout if server doesn't start
      setTimeout(() => {
        if (!started) {
          reject(new Error('Server startup timeout'));
        }
      }, 15000);
    });
  }

  static async waitForServer(maxRetries = 30) {
    for (let i = 0; i < maxRetries; i++) {
      const running = await this.isServerRunning();
      if (running) return true;
      await new Promise(r => setTimeout(r, 500));
    }
    throw new Error('Server did not start in time');
  }

  static async stopServer() {
    if (fs.existsSync(SERVER_PID_FILE)) {
      const pid = parseInt(fs.readFileSync(SERVER_PID_FILE, 'utf8'));
      try {
        process.kill(pid);
        fs.unlinkSync(SERVER_PID_FILE);
        return true;
      } catch (e) {
        // Process might already be dead
        fs.unlinkSync(SERVER_PID_FILE);
        return false;
      }
    }
    return false;
  }
}

module.exports = PlaywrightClient;
