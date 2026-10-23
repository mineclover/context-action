import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { createServer } from 'node:net';
import os from 'node:os';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const playwrightPath = require.resolve('playwright', {
  paths: [path.resolve(root, '../style-testing')],
});
const { chromium } = require(playwrightPath);

function resolveCachedChromium() {
  const defaultExecutable = chromium.executablePath();
  if (existsSync(defaultExecutable)) return defaultExecutable;

  const cacheRoots = [
    path.join(os.homedir(), 'Library', 'Caches', 'ms-playwright'),
    path.join(os.homedir(), '.cache', 'ms-playwright'),
  ];
  const candidates = [];
  for (const cacheRoot of cacheRoots) {
    if (!existsSync(cacheRoot)) continue;
    for (const entry of readdirSync(cacheRoot)) {
      if (!entry.startsWith('chromium_headless_shell-')) continue;
      const macExecutable = path.join(
        cacheRoot,
        entry,
        'chrome-headless-shell-mac-arm64',
        'chrome-headless-shell',
      );
      if (existsSync(macExecutable)) candidates.push(macExecutable);
      const linuxExecutable = path.join(
        cacheRoot,
        entry,
        'chrome-headless-shell-linux64',
        'chrome-headless-shell',
      );
      if (existsSync(linuxExecutable)) candidates.push(linuxExecutable);
    }
  }
  return candidates.sort().at(-1);
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise(resolve => server.close(resolve));
  return port;
}

const port = await freePort();
const server = spawn(
  'pnpm',
  [
    'exec',
    'vite',
    '--config',
    'examples/vite.config.ts',
    '--host',
    '127.0.0.1',
    '--port',
    String(port),
  ],
  {
    cwd: root,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

let serverLog = '';
server.stdout?.on('data', chunk => {
  serverLog += chunk;
});
server.stderr?.on('data', chunk => {
  serverLog += chunk;
});

const executablePath = resolveCachedChromium();
let browser;

try {
  browser = await chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
  });

  const url = `http://127.0.0.1:${port}/hydration.html`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      // Vite is still starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const page = await browser.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') pageErrors.push(message.text());
  });

  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#status[data-ready="true"]').waitFor({ state: 'attached' });

  const contract = await page.evaluate(() => {
    const value = window.__litHydrationContract;
    if (!value) throw new Error('Hydration contract was not installed');
    return {
      sameShadowRoot: value.shadowBefore === value.shadowAfter,
      serverPart: value.serverPart,
      serverData: value.serverData,
      hasRuler: Boolean(value.shadowAfter?.querySelector('[part="ruler"]')),
      hasData: Boolean(value.shadowAfter?.querySelector('[part="data"]')),
      controllerConnected: value.target.hasAttribute('data-controller-connected'),
      label: value.target.getAttribute('label'),
      count: value.target.count,
      slotted: value.target
        .querySelector('[slot="suffix"]')
        ?.getAttribute('data-slot'),
      serverItemCount: value.serverItemCount,
      itemCount: value.itemCount,
      preservedItems: value.preservedItems,
      shadowStyleCount: value.shadowAfter?.querySelectorAll('style').length,
      hostCount: document.querySelectorAll('lit-hydration-probe').length,
      shadowButtons: value.shadowAfter?.querySelectorAll('[data-testid="increment"]').length,
      documentButtons: document.querySelectorAll('[data-testid="increment"]').length,
    };
  });

  assert.deepEqual(contract, {
    sameShadowRoot: true,
    serverPart: 'ruler',
    serverData: '{"from":"server"}',
    hasRuler: true,
    hasData: true,
    controllerConnected: true,
    label: 'server',
    count: 0,
    slotted: 'suffix',
    serverItemCount: 3,
    itemCount: 3,
    preservedItems: true,
    shadowStyleCount: 1,
    hostCount: 1,
    shadowButtons: 1,
    documentButtons: 0,
  });

  await page.locator('lit-hydration-probe [data-testid="increment"]').click();
  await page.waitForFunction(
    () => window.__litHydrationContract?.target.count === 1,
  );

  const interaction = await page.evaluate(() => ({
    count: window.__litHydrationContract?.target.count,
    clicks: window.__litHydrationContract?.clicks,
  }));
  assert.deepEqual(interaction, { count: 1, clicks: [1] });

  assert.deepEqual(pageErrors, []);
  console.log('Lit DSD hydration browser contract passed');
} catch (error) {
  console.error(serverLog);
  throw error;
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, 'SIGTERM');
  } catch {
    server.kill('SIGTERM');
  }
  server.unref();
}
