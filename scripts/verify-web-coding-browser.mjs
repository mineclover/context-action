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
    if (
      (await page.locator('.save-status[role="status"]').count()) !== 1 ||
      (await page.locator('.preview-status[role="status"]').count()) !== 1
    ) {
      throw new Error('Workspace save and preview states are not live regions.');
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
    if (
      (await page
        .getByRole('tab', { name: /index\.html/ })
        .getAttribute('aria-selected')) !== 'true'
    ) {
      throw new Error('The active workspace tab did not expose aria-selected.');
    }
    if (
      (await page.locator('.file-row-active').getAttribute('aria-current')) !==
      'page'
    ) {
      throw new Error('The active file row did not expose aria-current.');
    }
    if (
      (await page
        .locator('[data-tool-name="workspace.getStatus"]')
        .getAttribute('aria-pressed')) !== 'true'
    ) {
      throw new Error('The selected tool did not expose aria-pressed.');
    }
    const editorTabs = page.getByRole('tab');
    await editorTabs.filter({ hasText: 'index.html' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.getByLabel('Edit styles.css').waitFor();
    if (
      (await page
        .getByRole('tab', { name: /styles\.css/ })
        .getAttribute('aria-selected')) !== 'true'
    ) {
      throw new Error('Arrow-key tab navigation did not select styles.css.');
    }
    await page.getByRole('tab', { name: /styles\.css/ }).focus();
    await page.keyboard.press('End');
    await page.getByLabel('Edit README.md').waitFor();
    await page.getByRole('tab', { name: /README\.md/ }).focus();
    await page.keyboard.press('Home');
    await page.getByLabel('Edit index.html').waitFor();
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
    await page.waitForFunction(
      () =>
        document.activeElement?.getAttribute('aria-label') ===
        'Approve preview.setTheme'
    );
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

    await prompt.fill(
      'Update the hero title to "Ship from context" with subtitle "Typed tools keep the preview honest."'
    );
    await send.click();
    const heroApproval = page.getByRole('button', {
      name: 'Approve preview.updateHero',
    });
    await heroApproval.waitFor();
    await heroApproval.click();
    await page
      .getByText(
        /Local agent inspected the workspace, called workspace\.getStatus, preview\.updateHero/
      )
      .waitFor();
    if (
      (await preview.locator('#hero-title').textContent())?.trim() !==
      'Ship from context'
    ) {
      throw new Error('The local agent did not pass the quoted hero title.');
    }

    await prompt.fill(
      'Add a feature card "Inspectable tools" "Every call leaves a trace."'
    );
    await send.click();
    const featureApproval = page.getByRole('button', {
      name: 'Approve preview.addFeature',
    });
    await featureApproval.waitFor();
    await featureApproval.click();
    await page
      .getByText(
        /Local agent inspected the workspace, called workspace\.getStatus, preview\.addFeature/
      )
      .waitFor();
    await preview.getByText('Inspectable tools', { exact: true }).waitFor();

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
    await page.locator('button[title="index.html"]').click();
    const restoredIndex = await page.getByLabel('Edit index.html').inputValue();
    if (!restoredIndex.includes('Ship from context')) {
      throw new Error(
        'The persisted index.html source did not restore after a browser reload.'
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

    await page
      .getByRole('button', { name: 'Open OpenRouter settings' })
      .click();
    let settingsDialog = page.getByRole('dialog', { name: 'OpenRouter API' });
    const settingsKey = settingsDialog.locator('input').first();
    await settingsKey.fill('sk-or-v1-browser-proof');
    await settingsDialog
      .getByRole('button', { name: 'Save settings' })
      .click();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('Edit index.html').waitFor();
    await page
      .getByRole('button', { name: 'Open OpenRouter settings' })
      .click();
    settingsDialog = page.getByRole('dialog', { name: 'OpenRouter API' });
    if ((await settingsDialog.locator('input').first().inputValue()) !== 'sk-or-v1-browser-proof') {
      throw new Error('The OpenRouter key did not persist across a browser reload.');
    }
    await settingsDialog.getByRole('button', { name: 'Clear key' }).click();
    await settingsDialog
      .getByRole('button', { name: 'Save settings' })
      .click();

    const blockedStoragePage = await page.context().browser().newPage();
    const blockedStorageErrors = [];
    blockedStoragePage.on('console', (message) => {
      if (message.type() === 'error') blockedStorageErrors.push(message.text());
    });
    blockedStoragePage.on('pageerror', (error) =>
      blockedStorageErrors.push(error.message)
    );
    await blockedStoragePage.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('Storage blocked for proof.', 'SecurityError');
        },
      });
    });
    try {
      await blockedStoragePage.goto(url, { waitUntil: 'networkidle' });
      await blockedStoragePage.getByText('Ready', { exact: true }).waitFor();
      await blockedStoragePage
        .getByRole('button', { name: 'Open OpenRouter settings' })
        .click();
      const blockedSettings = blockedStoragePage.getByRole('dialog', {
        name: 'OpenRouter API',
      });
      await blockedSettings.locator('input').first().fill('sk-or-v1-session-proof');
      await blockedSettings
        .getByRole('button', { name: 'Save settings' })
        .click();
      await blockedStoragePage.getByText('OpenRouter', { exact: true }).waitFor();
      if (blockedStorageErrors.length) {
        throw new Error(
          `Blocked storage browser errors: ${blockedStorageErrors.join(' | ')}`
        );
      }
    } finally {
      await blockedStoragePage.close();
    }

    const mobilePage = await page.context().browser().newPage({
      viewport: { width: 390, height: 844 },
    });
    try {
      await mobilePage.goto(url, { waitUntil: 'networkidle' });
      await mobilePage.getByText('Ready', { exact: true }).waitFor();
      const mobileLayout = await mobilePage.evaluate(() => ({
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth,
        sidebarHeight:
          document.querySelector('.studio-sidebar')?.getBoundingClientRect()
            .height ?? 0,
        editorTop:
          document.querySelector('.studio-main')?.getBoundingClientRect().top ??
          0,
      }));
      if (mobileLayout.bodyScrollWidth > mobileLayout.bodyClientWidth) {
        throw new Error('The mobile studio introduced horizontal page overflow.');
      }
      if (mobileLayout.sidebarHeight > 560 || mobileLayout.editorTop > 850) {
        throw new Error(
          `The mobile editor is pushed below the first viewport: ${JSON.stringify(mobileLayout)}`
        );
      }
    } finally {
      await mobilePage.close();
    }

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
