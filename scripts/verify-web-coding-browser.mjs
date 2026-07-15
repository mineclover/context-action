import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const demoDirectory = path.join(rootDirectory, 'demos/bolt-style-editor');
const requestedUrl = process.env.WEB_CODING_URL?.trim();
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
    `Web coding server did not become ready at ${url}: ${lastError instanceof Error ? lastError.message : 'unknown error'}`
  );
}

async function startServer() {
  const port = await reservePort();
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  serverProcess = spawn(
    command,
    ['exec', 'vite', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: demoDirectory,
      detached: process.platform !== 'win32',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const url = `http://127.0.0.1:${port}/`;
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
    // The server may already have exited after the browser assertion failed.
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  serverProcess = undefined;
}

async function runBrowserProof(url) {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  let folderFixture;
  const consoleErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByText('Ready', { exact: true }).waitFor();

    if ((await page.getByText('tools/list · 23', { exact: true }).count()) !== 1) {
      throw new Error('The standalone catalog did not expose 23 tools.');
    }
    if ((await page.getByTitle('Live generated web preview').count()) !== 1) {
      throw new Error('The sandbox preview iframe is missing.');
    }
    if (await page.getByLabel('Edit index.html').isDisabled()) {
      throw new Error('The source editor remained disabled after hydration.');
    }

    const editor = page.getByLabel('Edit index.html');
    const initialRevision = await page
      .locator('.revision-label')
      .textContent();
    const initialSource = await editor.inputValue();
    if ((await page.locator('.code-highlight .syntax-tag').count()) === 0) {
      throw new Error('The source editor did not render syntax-highlight tokens.');
    }
    await editor.fill(`${initialSource}\n<!-- browser editing proof -->\n`);
    await page.getByText('Unsaved changes', { exact: true }).waitFor();
    await page.waitForFunction(
      (previousRevision) =>
        document.querySelector('.revision-label')?.textContent !==
        previousRevision,
      initialRevision
    );

    const prompt = page.getByLabel('Web studio prompt');
    const send = page.getByRole('button', { name: /^Send/ });
    await prompt.fill('Show workspace status');
    await send.click();
    await page.getByText(/Local agent inspected the workspace/).waitFor();

    await prompt.fill('Make it emerald');
    await send.click();
    const approval = page.getByRole('button', {
      name: 'Approve preview.setTheme',
    });
    await approval.waitFor();
    await approval.click();
    await page
      .getByText(
        /Local agent inspected the workspace, called workspace\.getStatus, preview\.setTheme/
      )
      .waitFor();

    const preview = page.frameLocator(
      'iframe[title="Live generated web preview"]'
    );
    await preview.locator('#hero-title').waitFor();
    const accent = await preview
      .locator(':root')
      .evaluate((element) => getComputedStyle(element).getPropertyValue('--accent').trim());
    if (accent !== '#10b981') {
      throw new Error(`The preview did not apply the emerald theme: ${accent}`);
    }

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Ready', { exact: true }).waitFor();
    await page.locator('button[title="styles.css"]').click();
    const stylesEditor = page.getByLabel('Edit styles.css');
    await stylesEditor.waitFor();
    const restoredStyles = await stylesEditor.inputValue();
    if (!restoredStyles.includes('--accent: #10b981')) {
      throw new Error(
        'The persisted styles.css source did not restore after a browser reload.'
      );
    }
    await page
      .frameLocator('iframe[title="Live generated web preview"]')
      .locator('#hero-title')
      .waitFor();

    folderFixture = await mkdtemp(
      path.join(os.tmpdir(), 'context-action-web-coding-')
    );
    await writeFile(
      path.join(folderFixture, 'index.html'),
      `<!doctype html>
<html lang="en">
  <head><meta charset="UTF-8" /><link rel="stylesheet" href="styles.css" /></head>
  <body><h1 id="folder-proof">Folder import works</h1><script src="app.js"></script></body>
</html>`
    );
    await writeFile(
      path.join(folderFixture, 'styles.css'),
      ':root { --accent: #10b981; --accent-soft: #e7fbf3; } body { color: var(--accent); }'
    );
    await writeFile(
      path.join(folderFixture, 'app.js'),
      "document.body.dataset.folderImport = 'ok';"
    );
    await page.getByLabel('Choose workspace folder').setInputFiles(folderFixture);
    await page.getByText(/Opened .* with 3 file\(s\)/).waitFor();
    await page
      .frameLocator('iframe[title="Live generated web preview"]')
      .locator('#folder-proof')
      .waitFor();

    if (consoleErrors.length) {
      throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
    }
  } catch (error) {
    const bodyText = await page.locator('body').innerText();
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}\n--- page tail ---\n${bodyText.slice(-4000)}`
    );
  } finally {
    if (folderFixture) {
      await rm(folderFixture, { recursive: true, force: true });
    }
    await page.context().browser()?.close();
  }
}

const url = requestedUrl || (await startServer());
try {
  await runBrowserProof(url);
  console.log(`Verified standalone web-coding browser flow at ${url}`);
} finally {
  await stopServer();
}
