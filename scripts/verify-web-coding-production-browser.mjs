import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const demoDirectory = path.join(rootDirectory, 'demos/bolt-style-editor');
const expectedBase = '/context-action/web-coding/';
const requestedUrl = process.env.WEB_CODING_PRODUCTION_URL?.trim();
let serverProcess;

function resolvePlaywright() {
  const require = createRequire(import.meta.url);
  const modulePath = require.resolve('playwright', {
    paths: [path.join(rootDirectory, 'packages/style-testing')],
  });
  return require(modulePath);
}

async function reservePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

async function waitForServer(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `Production web-coding server did not become ready at ${url}: ${lastError instanceof Error ? lastError.message : 'unknown error'}`
  );
}

async function startServer() {
  const port = await reservePort();
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  serverProcess = spawn(
    command,
    ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: demoDirectory,
      detached: process.platform !== 'win32',
      env: { ...process.env, NODE_ENV: 'production' },
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const url = `http://127.0.0.1:${port}${expectedBase}`;
  await waitForServer(url);
  return url;
}

async function stopServer() {
  if (!serverProcess?.pid) return;
  try {
    if (process.platform !== 'win32') {
      process.kill(-serverProcess.pid, 'SIGTERM');
    } else {
      serverProcess.kill('SIGTERM');
    }
  } catch {
    // The preview server may already have exited after the browser assertion failed.
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  serverProcess = undefined;
}

async function runProductionSmoke(url) {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const consoleErrors = [];
  const failedRequests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? 'failed'}`);
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByText('Ready', { exact: true }).waitFor();
    if (!page.url().includes(expectedBase)) {
      throw new Error(`Production page did not stay under ${expectedBase}: ${page.url()}`);
    }
    if ((await page.getByText('tools/list · 23', { exact: true }).count()) !== 1) {
      throw new Error('The production catalog did not expose 23 tools.');
    }
    await page.getByLabel('Edit index.html').waitFor();
    await page
      .frameLocator('iframe[title="Live generated web preview"]')
      .locator('body')
      .waitFor();

    const assetUrls = await page.evaluate(() =>
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .filter((name) => name.includes('/assets/'))
    );
    if (!assetUrls.some((assetUrl) => assetUrl.includes('BoltStyleEditor-'))) {
      throw new Error('The production lazy editor chunk was not loaded.');
    }
    if (failedRequests.length) {
      throw new Error(`Production asset requests failed: ${failedRequests.join(' | ')}`);
    }
    const unexpectedConsoleErrors = consoleErrors.filter(
      (message) =>
        !message.includes('document is sandboxed and lacks the') &&
        message !== 'browser preview proof'
    );
    if (unexpectedConsoleErrors.length) {
      throw new Error(
        `Production browser console errors: ${unexpectedConsoleErrors.join(' | ')}`
      );
    }
  } catch (error) {
    const bodyText = await page.locator('body').innerText();
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\n--- page tail ---\n${bodyText.slice(-2000)}`
    );
  } finally {
    await browser.close();
  }
}

const url = requestedUrl || (await startServer());
try {
  await runProductionSmoke(url);
  console.log(`Verified standalone production web-coding browser flow at ${url}`);
} finally {
  await stopServer();
}
