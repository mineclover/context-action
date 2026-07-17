import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const exampleDirectory = path.join(rootDirectory, 'example');
const storageKey = 'context-action.openrouter.api-key';
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
      const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(
    `Example server did not become ready at ${url}: ${lastError instanceof Error ? lastError.message : 'unknown error'}`
  );
}

async function startServer() {
  const port = await reservePort();
  const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
  serverProcess = spawn(
    command,
    ['exec', 'vite', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: exampleDirectory,
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
    // The server may already have exited after a failed assertion.
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  serverProcess = undefined;
}

async function waitForInputValue(locator, expected, label) {
  const deadline = Date.now() + 5_000;
  let actual = '';
  while (Date.now() < deadline) {
    actual = await locator.inputValue();
    if (actual === expected) return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(`${label} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
}

const { chromium } = resolvePlaywright();
const url = await startServer();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.route('**/api/v1/models', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [] }),
    });
  });

  const aiPage = await context.newPage();
  const editorPage = await context.newPage();
  const pageErrors = [];
  for (const page of [aiPage, editorPage]) {
    page.on('pageerror', (error) => pageErrors.push(error.message));
  }

  await Promise.all([
    aiPage.goto(`${url}integrations/tool-context-ai`, {
      waitUntil: 'networkidle',
    }),
    editorPage.goto(`${url}integrations/live-code-editor`, {
      waitUntil: 'networkidle',
    }),
  ]);

  const aiKeyInput = aiPage.locator('#apiKey');
  const editorKeyInput = editorPage.getByLabel('OpenRouter key');
  await aiKeyInput.waitFor();
  await editorKeyInput.waitFor();

  await aiKeyInput.fill('sk-or-shared-from-ai');
  await waitForInputValue(
    editorKeyInput,
    'sk-or-shared-from-ai',
    'Live Code Editor key after AI page update'
  );

  await editorKeyInput.fill('sk-or-shared-from-editor');
  await waitForInputValue(
    aiKeyInput,
    'sk-or-shared-from-editor',
    'AI page key after Live Code Editor update'
  );

  await aiPage.getByRole('button', { name: 'Clear saved key' }).click();
  await waitForInputValue(editorKeyInput, '', 'Live Code Editor key after clear');
  const storedKey = await aiPage.evaluate((key) => localStorage.getItem(key), storageKey);
  if (storedKey !== null) {
    throw new Error('The shared OpenRouter key remained in localStorage after clear.');
  }
  if (pageErrors.length) {
    throw new Error(`Example OpenRouter browser errors: ${pageErrors.join(' | ')}`);
  }

  await context.close();
  console.log(`Verified example OpenRouter key sharing at ${url}`);
} finally {
  await browser?.close();
  await stopServer();
}
