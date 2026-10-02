import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const require = createRequire(import.meta.url);
const playwright = require(require.resolve('playwright', {
  paths: [path.resolve(root, '../style-testing')],
}));

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
  ['exec', 'vite', '--config', 'examples/vite.config.ts', '--host', '127.0.0.1', '--port', String(port)],
  { cwd: root, stdio: 'ignore' },
);

try {
  await new Promise(resolve => setTimeout(resolve, 1500));
  for (const browserName of ['firefox', 'webkit']) {
    const browser = await playwright[browserName].launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`http://127.0.0.1:${port}/ssr-browser.html`, { waitUntil: 'networkidle' });
      await page.locator('#ssr-status[data-ready="true"]').waitFor({ state: 'attached' });
      assert.equal(await page.locator('#ssr-host').textContent(), 'Client label');
      await page.getByRole('button', { name: 'Client label', exact: true }).click();
      assert.equal(await page.locator('#ssr-status').getAttribute('data-clicks'), '1');

      await page.goto(`http://127.0.0.1:${port}/layer-panel-browser.html`, { waitUntil: 'networkidle' });
      await page.locator('#status[data-ready="true"]').waitFor({ state: 'attached' });
      assert.equal(await page.locator('pre-layer-panel').getByRole('button', { name: 'Two' }).count(), 1);
      console.log(`${browserName}: SSR hydration and Layer Panel smoke passed`);
    } finally {
      await browser.close();
    }
  }
} finally {
  server.kill('SIGTERM');
  server.unref();
}
