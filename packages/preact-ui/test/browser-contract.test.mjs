import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
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
      const executable = path.join(cacheRoot, entry, 'chrome-headless-shell-mac-arm64', 'chrome-headless-shell');
      if (existsSync(executable)) candidates.push(executable);
      const linuxExecutable = path.join(cacheRoot, entry, 'chrome-headless-shell-linux64', 'chrome-headless-shell');
      if (existsSync(linuxExecutable)) candidates.push(linuxExecutable);
    }
  }
  return candidates.sort().at(-1);
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  await new Promise(resolve => server.close(resolve));
  return port;
}

const port = await freePort();
const server = spawn('pnpm', ['exec', 'vite', '--config', 'examples/vite.config.ts', '--host', '127.0.0.1', '--port', String(port)], {
  cwd: root,
  detached: true,
  stdio: ['ignore', 'pipe', 'pipe'],
});
const executablePath = resolveCachedChromium();
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const url = `http://127.0.0.1:${port}/layer-panel-browser.html`;
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.locator('#status[data-ready="true"]').waitFor({ state: 'attached' });

  const initial = await page.locator('pre-layer-panel').evaluate(element => ({
    selected: element.selectedId,
    count: element.shadowRoot?.querySelectorAll('button').length,
    pressed: element.shadowRoot?.querySelector('button[aria-pressed="true"]')?.textContent,
  }));
  assert.deepEqual(initial, { selected: 'one', count: 2, pressed: 'One' });
  assert.equal(await page.locator('pre-layer-panel [data-slot-label]').textContent(), 'External suffix');
  assert.equal(await page.locator('pre-layer-panel').getByRole('button', { name: 'Two' }).count(), 1);

  await page.locator('pre-layer-panel').locator('button').nth(1).click();
  assert.equal(await page.evaluate(() => window.layerPanelContract.requestIds.join(',')), 'two');
  assert.equal(await page.locator('pre-layer-panel').evaluate(element => element.selectedId), 'one');

  await page.locator('pre-layer-panel').evaluate(element => { element.selectedId = 'two'; });
  assert.equal(await page.evaluate(() => window.layerPanelContract.requestIds.join(',')), 'two');
  await page.evaluate(() => window.layerPanelContract.reconnect());
  assert.equal(await page.locator('pre-layer-panel').evaluate(element => element.selectedId), 'two');
  assert.equal(await page.locator('pre-layer-panel').evaluate(element => element.focusItem('two')), true);
  assert.equal(await page.locator('pre-layer-panel [data-slot-label]').textContent(), 'External suffix');
  await page.locator('pre-layer-panel').evaluate(element => { element.selectedId = 'one'; });
  await page.locator('pre-layer-panel').getByRole('button', { name: 'Two' }).focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => window.layerPanelContract.requestIds.join(',')), 'two,two');

  await page.locator('#template-host button').nth(1).click();
  assert.equal(await page.evaluate(() => window.layerPanelContract.templateRequestIds.join(',')), 'two');
  assert.equal(await page.locator('#template-host button[aria-pressed="true"]').textContent(), 'One');

  await page.goto(`${new URL(url).origin}/vanilla-embed.html`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#wc-change-name').count(), 1);
  const orderWorkspace = page.locator('order-workspace');
  await orderWorkspace.waitFor({ state: 'attached' });
  await page.locator('#wc-change-name').click();
  await page.waitForTimeout(50);
  const customerName = await orderWorkspace.evaluate(element => ({
    property: element.customerName,
    attribute: element.getAttribute('customer-name'),
    input: element.shadowRoot?.querySelector('[data-testid="input-customer-name"]')?.value,
  }));
  assert.deepEqual(customerName, {
    property: '이순신 (조선 수군)',
    attribute: '이순신 (조선 수군)',
    input: '이순신 (조선 수군)',
  });

  console.log('Layer Panel browser contract passed');
} finally {
  await browser.close();
  if (server.pid) {
    try { process.kill(-server.pid, 'SIGTERM'); } catch {}
  }
}
