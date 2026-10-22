/**
 * AwamiConnect E2E Test Suite — Lightweight Headless Chrome Browser Driver
 * Uses Chrome DevTools Protocol (CDP) via native Node.js WebSockets and HTTP.
 * Zero external npm dependencies required.
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const CHROME_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.CHROME_BIN,
  process.env.CHROME_PATH
].filter(Boolean);

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

class BrowserDriver {
  constructor(options = {}) {
    this.port = options.port || 3000;
    this.cdpPort = options.cdpPort || 9222;
    this.rootDir = options.rootDir || path.resolve(__dirname, '..');
    this.server = null;
    this.chromeProcess = null;
    this.browserWs = null;
    this.pageWs = null;
    this.targetId = null;
    this.msgId = 0;
    this.pendingCallbacks = new Map();
    this.consoleLogs = [];
    this.consoleWarns = [];
    this.consoleErrors = [];
    this.unhandledExceptions = [];
  }

  // 1. Static file server
  async startServer() {
    return new Promise((resolve, reject) => {
      // Check if server is already running on this port
      const checkReq = http.get(`http://127.0.0.1:${this.port}`, (res) => {
        // Already running
        resolve(`http://127.0.0.1:${this.port}`);
      });
      checkReq.on('error', () => {
        // Not running, start our own server
        this.server = http.createServer((req, res) => {
          let parsedUrl = req.url.split('?')[0];
          if (parsedUrl === '/' || parsedUrl === '') {
            parsedUrl = '/index.html';
          }
          const safePath = path.normalize(parsedUrl).replace(/^(\.\.[\/\\])+/, '');
          const filePath = path.join(this.rootDir, safePath);

          fs.stat(filePath, (err, stats) => {
            if (err || !stats.isFile()) {
              res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
              res.end(`404 Not Found: ${parsedUrl}`);
              return;
            }
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*'
            });
            fs.createReadStream(filePath).pipe(res);
          });
        });

        this.server.listen(this.port, '127.0.0.1', () => {
          resolve(`http://127.0.0.1:${this.port}`);
        });
        this.server.on('error', (err) => reject(err));
      });
    });
  }

  // 2. Launch headless Chrome
  async launchChrome() {
    let chromeExecutable = null;
    for (const p of CHROME_PATHS) {
      if (fs.existsSync(p)) {
        chromeExecutable = p;
        break;
      }
    }
    if (!chromeExecutable) {
      throw new Error('Google Chrome executable not found on standard paths.');
    }

    const userDataDir = path.join(process.env.TEMP || 'C:\\Windows\\Temp', `chrome_test_${Date.now()}`);

    this.chromeProcess = spawn(chromeExecutable, [
      '--headless=new',
      `--remote-debugging-port=${this.cdpPort}`,
      '--disable-gpu',
      '--no-sandbox',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--mute-audio',
      '--no-first-run',
      `--user-data-dir=${userDataDir}`,
      '--window-size=1280,800',
      'about:blank'
    ], { stdio: 'ignore' });

    // Wait for CDP endpoint to become ready
    const startTime = Date.now();
    let versionData = null;
    while (Date.now() - startTime < 10000) {
      try {
        const res = await fetch(`http://127.0.0.1:${this.cdpPort}/json/version`);
        if (res.ok) {
          versionData = await res.json();
          break;
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    if (!versionData || !versionData.webSocketDebuggerUrl) {
      throw new Error(`Failed to connect to Chrome CDP on port ${this.cdpPort}`);
    }

    // Connect to browser WebSocket
    this.browserWs = new WebSocket(versionData.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      this.browserWs.onopen = resolve;
      this.browserWs.onerror = reject;
    });

    // Create target page
    const createTargetRes = await this.sendBrowserCommand('Target.createTarget', { url: 'about:blank' });
    this.targetId = createTargetRes.targetId;

    const pageWsUrl = `ws://127.0.0.1:${this.cdpPort}/devtools/page/${this.targetId}`;
    this.pageWs = new WebSocket(pageWsUrl);

    await new Promise((resolve, reject) => {
      this.pageWs.onopen = resolve;
      this.pageWs.onerror = reject;
    });

    this.pageWs.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.id && this.pendingCallbacks.has(msg.id)) {
          const cb = this.pendingCallbacks.get(msg.id);
          this.pendingCallbacks.delete(msg.id);
          if (msg.error) {
            cb.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
          } else {
            cb.resolve(msg.result);
          }
          return;
        }

        // Event dispatching
        if (msg.method === 'Runtime.consoleAPICalled') {
          const type = msg.params.type;
          const text = msg.params.args.map(a => a.value !== undefined ? a.value : (a.description || '')).join(' ');
          if (type === 'error') {
            this.consoleErrors.push(text);
          } else if (type === 'warning') {
            this.consoleWarns.push(text);
          } else {
            this.consoleLogs.push(text);
          }
        } else if (msg.method === 'Runtime.exceptionThrown') {
          const text = msg.params.exceptionDetails?.text || 'Uncaught exception';
          const desc = msg.params.exceptionDetails?.exception?.description || '';
          this.unhandledExceptions.push(`${text}: ${desc}`);
        }
      } catch (err) {
        // Ignore parse errors on raw messages
      }
    };

    // Enable domains
    await this.sendPageCommand('Page.enable');
    await this.sendPageCommand('Runtime.enable');
    await this.sendPageCommand('DOM.enable');
  }

  sendBrowserCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      const handler = (evt) => {
        try {
          const msg = JSON.parse(evt.data);
          if (msg.id === id) {
            this.browserWs.removeEventListener('message', handler);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        } catch (e) {
          reject(e);
        }
      };
      this.browserWs.addEventListener('message', handler);
      this.browserWs.send(JSON.stringify({ id, method, params }));
    });
  }

  sendPageCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.pendingCallbacks.set(id, { resolve, reject });
      this.pageWs.send(JSON.stringify({ id, method, params }));
    });
  }

  // Set browser viewport size
  async setViewport(width, height) {
    await this.sendPageCommand('Emulation.setDeviceMetricsOverride', {
      width: Math.round(width),
      height: Math.round(height),
      deviceScaleFactor: 1,
      mobile: width <= 768
    });
    // Brief settle time for layout reflow
    await new Promise(r => setTimeout(r, 100));
  }

  // Navigate to URL and wait for DOM load
  async navigate(urlPath, options = {}) {
    const fullUrl = urlPath.startsWith('http') ? urlPath : `http://127.0.0.1:${this.port}${urlPath.startsWith('/') ? '' : '/'}${urlPath}`;
    this.clearConsoleLogs();

    await this.sendPageCommand('Page.navigate', { url: fullUrl });

    // Wait until document.readyState === 'complete' or timeout
    const timeout = options.timeout || 5000;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const stateRes = await this.evaluate('document.readyState');
        if (stateRes === 'complete') break;
      } catch (e) {
        // Ignore during navigation transition
      }
      await new Promise(r => setTimeout(r, 100));
    }
    // Allow scripts / Leaflet init / microtasks to settle
    await new Promise(r => setTimeout(r, options.settleMs || 300));
  }

  // Evaluate JavaScript in the page context
  async evaluate(expression) {
    const res = await this.sendPageCommand('Runtime.evaluate', {
      expression: String(expression),
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const err = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Evaluation failed: ${err}`);
    }
    return res.result?.value;
  }

  // Clear accumulated console logs
  clearConsoleLogs() {
    this.consoleLogs = [];
    this.consoleWarns = [];
    this.consoleErrors = [];
    this.unhandledExceptions = [];
  }

  // Check horizontal layout overflow on currently loaded page
  async checkHorizontalOverflow() {
    return await this.evaluate(`
      (() => {
        const docElem = document.documentElement;
        const body = document.body;
        const docWidth = window.innerWidth;
        const scrollWidth = Math.max(docElem.scrollWidth, body ? body.scrollWidth : 0);
        
        // Find elements whose bounding box exceeds viewport
        const overflowing = [];
        const all = document.querySelectorAll('*');
        for (const el of all) {
          const rect = el.getBoundingClientRect();
          // Skip elements that are hidden or off-screen intentionally
          if (rect.width === 0 || rect.height === 0) continue;
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          
          if (rect.right > docWidth + 1.5) { // 1.5px subpixel threshold
            overflowing.push({
              tag: el.tagName.toLowerCase(),
              id: el.id || '',
              className: (typeof el.className === 'string' ? el.className : '').slice(0, 50),
              right: Math.round(rect.right),
              docWidth: docWidth,
              delta: Math.round(rect.right - docWidth)
            });
          }
        }

        return {
          docWidth,
          scrollWidth,
          hasOverflow: scrollWidth > docWidth + 1.5,
          overflowDelta: Math.max(0, scrollWidth - docWidth),
          overflowingElements: overflowing.slice(0, 5)
        };
      })()
    `);
  }

  // Clean shutdown
  async close() {
    if (this.pageWs) {
      try { this.pageWs.close(); } catch (e) {}
    }
    if (this.browserWs) {
      try { this.browserWs.close(); } catch (e) {}
    }
    if (this.chromeProcess) {
      try { this.chromeProcess.kill('SIGTERM'); } catch (e) {}
    }
    if (this.server) {
      try { this.server.close(); } catch (e) {}
    }
  }
}

module.exports = BrowserDriver;
