import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
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
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
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
    if ((await page.getByLabel('Web studio prompt').inputValue()) !== '') {
      throw new Error('The standalone composer must start empty and rely on placeholder or recipes for examples.');
    }

    const editor = page.getByLabel('Edit index.html');
    const initialRevision = await page
      .locator('.revision-label')
      .textContent();
    const initialSource = await editor.inputValue();
    if ((await page.locator('.code-highlight .syntax-tag').count()) === 0) {
      throw new Error('The source editor did not render syntax-highlight tokens.');
    }
    const sourceLengthStatus = page.locator('.code-source-length');
    if ((await sourceLengthStatus.count()) !== 1) {
      throw new Error('The source editor did not expose its text-size budget.');
    }
    if (!(await sourceLengthStatus.textContent())?.includes('/ 80,000 chars')) {
      throw new Error('The source editor text-size budget is not readable.');
    }
    await page
      .getByRole('button', { name: 'Create new workspace file' })
      .click();
    const createFileDialog = page.getByRole('dialog', { name: 'New file' });
    await createFileDialog.waitFor();
    const createSourceLengthStatus = createFileDialog.locator(
      '#create-file-source-count'
    );
    if ((await createSourceLengthStatus.count()) !== 1) {
      throw new Error('The new-file dialog did not expose its text-size budget.');
    }
    if (!(await createSourceLengthStatus.textContent())?.includes('/ 80,000 chars')) {
      throw new Error('The new-file text-size budget is not readable.');
    }
    await createFileDialog
      .getByRole('button', { name: 'Close new file dialog' })
      .click();
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
    const fileTree = page.getByRole('tree', { name: 'Workspace files' });
    if ((await fileTree.getByRole('treeitem').count()) !== 4) {
      throw new Error('The workspace file tree did not expose its four entries.');
    }
    const activeTreeItem = fileTree.getByRole('treeitem', {
      name: 'Open index.html',
    });
    await activeTreeItem.focus();
    await page.keyboard.press('ArrowDown');
    const nextTreeItem = fileTree.getByRole('treeitem', {
      name: 'Open README.md',
    });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Open README.md'
    );
    if ((await nextTreeItem.getAttribute('tabindex')) !== '0') {
      throw new Error('The file tree did not move its roving tabindex.');
    }
    await page.keyboard.press('Home');
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Open app.js'
    );
    await page.keyboard.press('ArrowDown');
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Open index.html'
    );
    await page
      .getByRole('button', { name: 'Quick open workspace file' })
      .click();
    const quickOpenDialog = page.getByRole('dialog', {
      name: 'Quick open file',
    });
    const quickOpenInput = quickOpenDialog.getByLabel(
      'Quick open workspace file'
    );
    await quickOpenInput.waitFor();
    if (
      !(await quickOpenInput.evaluate(
        (element) => document.activeElement === element
      ))
    ) {
      throw new Error('Quick open did not focus its file input.');
    }
    await quickOpenInput.press('ArrowDown');
    await quickOpenInput.press('Enter');
    await page.getByLabel('Edit styles.css').waitFor();
    if (
      (await page
        .getByRole('tab', { name: /styles\.css/ })
        .getAttribute('aria-selected')) !== 'true'
    ) {
      throw new Error('Quick open did not select the requested workspace file.');
    }
    await page.getByRole('tab', { name: /index\.html/ }).click();
    await page.getByLabel('Edit index.html').waitFor();
    await page.getByLabel('Edit index.html').focus();
    await page.keyboard.press('Control+P');
    await quickOpenDialog.waitFor();
    await page.keyboard.press('Escape');
    await quickOpenDialog.waitFor({ state: 'detached' });
    const editorTabs = page.getByRole('tab');
    await editorTabs.filter({ hasText: 'index.html' }).focus();
    await page.keyboard.press('ArrowRight');
    await page.getByLabel('Edit styles.css').waitFor();
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('button[role="tab"]')).some(
          (button) =>
            button.textContent?.includes('styles.css') &&
            !(button instanceof HTMLButtonElement && button.disabled)
        )
    );
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
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('button[role="tab"]')).some(
          (button) =>
            button.textContent?.includes('README.md') &&
            !(button instanceof HTMLButtonElement && button.disabled)
        )
    );
    await page.getByRole('tab', { name: /README\.md/ }).focus();
    await page.keyboard.press('Home');
    await page.getByLabel('Edit index.html').waitFor();
    const searchTrigger = page.getByRole('button', {
      name: 'Search workspace',
    });
    await searchTrigger.click();
    const searchInput = page.getByLabel('Search workspace files');
    await searchInput.fill('hero');
    await searchInput.press('ArrowDown');
    await searchInput.press('Enter');
    await page
      .locator('#workspace-search-panel')
      .waitFor({ state: 'detached' });
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Edit index.html'
    );
    await page.getByRole('button', { name: 'Search workspace' }).click();
    const openSearchInput = page.getByLabel('Search workspace files');
    await openSearchInput.press('Control+S');
    if (!(await page.locator('#workspace-search-panel').isVisible())) {
      throw new Error('Save shortcut unexpectedly closed the workspace search.');
    }
    await openSearchInput.press('Control+P');
    if (await page.getByRole('dialog', { name: 'Quick open file' }).count()) {
      throw new Error('Quick open shortcut unexpectedly opened over workspace search.');
    }
    await openSearchInput.press('Escape');
    await page.waitForFunction(
      () => document.activeElement?.getAttribute('aria-label') === 'Search workspace'
    );
    await page.getByRole('tab', { name: /app\.js/ }).click();
    const appEditor = page.getByLabel('Edit app.js');
    const initialAppSource = await appEditor.inputValue();
    await appEditor.fill(
      "throw new Error('browser preview proof ' + 'x'.repeat(1000));\n"
    );
    const previewError = page.getByRole('alert', {
      name: 'Preview runtime error',
    });
    await previewError.waitFor();
    const previewErrorText = await previewError.textContent();
    if (!previewErrorText?.includes('browser preview proof')) {
      throw new Error('The preview runtime error message was not surfaced.');
    }
    if (previewErrorText.length > 420) {
      throw new Error(
        `The preview runtime error was not bounded: ${previewErrorText.length} characters.`
      );
    }
    await appEditor.fill(initialAppSource);
    await page.locator('.preview-status-synced').waitFor();
    await page.getByRole('tab', { name: /index\.html/ }).click();
    await page.getByLabel('Edit index.html').waitFor();
    await editor.fill(`${initialSource}\n<!-- browser editing proof -->\n`);
    await page.getByText('Unsaved changes', { exact: true }).waitFor();
    await page.waitForFunction(
      (previousRevision) =>
        document.querySelector('.revision-label')?.textContent !==
        previousRevision,
      initialRevision
    );
    const dirtySource = await editor.inputValue();
    const undoButton = page.getByRole('button', { name: 'Undo last edit' });
    await undoButton.focus();
    await page.locator('.preview-status-synced').waitFor();
    await page.waitForFunction(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (candidate) => candidate.getAttribute('aria-label') === 'Undo last edit'
      );
      return button instanceof HTMLButtonElement && !button.disabled;
    });
    await page.keyboard.press('Control+Z');
    await page.getByLabel('Edit index.html').waitFor();
    await page.waitForFunction(
      (expectedSource) => document.querySelector('textarea[aria-label="Edit index.html"]')?.value === expectedSource,
      initialSource
    );
    await page.getByRole('button', { name: /^Send/ }).waitFor();
    await page.keyboard.press('Control+Shift+Z');
    await page.getByLabel('Edit index.html').waitFor();
    await page.waitForFunction(
      (expectedSource) => document.querySelector('textarea[aria-label="Edit index.html"]')?.value === expectedSource,
      dirtySource
    );

    const prompt = page.getByLabel('Web studio prompt');
    const send = page.getByRole('button', { name: /^Send/ });
    await prompt.fill('Show workspace status');
    await send.click();
    await page.getByText(/Local agent inspected the workspace/).waitFor();
    const localStatusTraceVisible = await page
      .locator('#trace-list .trace-row')
      .evaluateAll((rows) =>
        rows.some((row) => {
          const name = row.querySelector('strong')?.textContent?.trim();
          const metadata = row.querySelector('small')?.textContent ?? '';
          return name === 'workspace.getStatus' && metadata.includes('local');
        })
      );
    if (!localStatusTraceVisible) {
      throw new Error(
        'The local-agent tool trace did not preserve its explicit local source.'
      );
    }

    await prompt.fill('Change missing.md from "old" to "new"');
    await send.click();
    await page.getByText(/\[WORKSPACE_FILE_NOT_FOUND\]/).waitFor();

    await prompt.fill(
      'Change index.html from "text that is not in this file" to "new text"'
    );
    await send.click();
    const patchApproval = page.getByRole('button', {
      name: 'Approve workspace.applyPatch',
    });
    await patchApproval.waitFor();
    await patchApproval.click();
    await page.getByText(/\[WORKSPACE_PATCH_NOT_FOUND\]/).waitFor();

    await prompt.fill('Delete file index.html');
    await send.click();
    const deletePreviewApproval = page.getByRole('button', {
      name: 'Approve workspace.deleteFile',
    });
    await deletePreviewApproval.waitFor();
    await deletePreviewApproval.click();
    await page.getByText(/\[WORKSPACE_PREVIEW_ENTRY_REQUIRED\]/).waitFor();

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
    const initialTraceToolCallIds = await page
      .locator('#trace-list .trace-row')
      .evaluateAll((rows) =>
        rows
          .map((row) => row.getAttribute('title') ?? '')
          .filter((title) => title.startsWith('toolCallId '))
          .map((title) => title.split(' · ')[0])
      );
    if (new Set(initialTraceToolCallIds).size !== initialTraceToolCallIds.length) {
      throw new Error('Tool call IDs were not unique in the local agent trace.');
    }

    const completedThemeTraceBeforeCancel = await page
      .locator('#trace-list .trace-row-completed')
      .filter({ hasText: 'preview.setTheme' })
      .count();
    await prompt.fill('Make it amber');
    await send.click();
    await page
      .getByRole('button', { name: 'Approve preview.setTheme' })
      .waitFor();
    if (!(await page.getByRole('button', { name: 'Clear execution trace' }).isDisabled())) {
      throw new Error('The execution trace could be cleared during a running tool call.');
    }
    const cancelExecutionButton = page.getByRole('button', {
      name: /^Cancel/,
    });
    await cancelExecutionButton.waitFor();
    await page.keyboard.press('Escape');
    await page.getByText('Execution cancelled.', { exact: true }).waitFor();
    if (await page.getByRole('button', { name: 'Approve preview.setTheme' }).count()) {
      throw new Error('Cancelling an agent run left a pending tool approval behind.');
    }
    const completedThemeTraceAfterCancel = await page
      .locator('#trace-list .trace-row-completed')
      .filter({ hasText: 'preview.setTheme' })
      .count();
    if (completedThemeTraceAfterCancel !== completedThemeTraceBeforeCancel) {
      throw new Error('Cancelling before approval executed the preview theme tool.');
    }

    await prompt.fill('Make it amber');
    await send.click();
    await page
      .getByRole('button', { name: 'Approve preview.setTheme' })
      .click();
    await page
      .getByText(
        /Local agent inspected the workspace, called workspace\.getStatus, preview\.setTheme/
      )
      .last()
      .waitFor();
    const showAllTrace = page.getByRole('button', {
      name: 'Show all execution trace',
    });
    await showAllTrace.waitFor();
    await showAllTrace.click();
    if ((await page.locator('#trace-list .trace-row').count()) <= 8) {
      throw new Error('The execution trace did not reveal older entries.');
    }
    const showRecentTrace = page.getByRole('button', {
      name: 'Show recent execution trace',
    });
    if ((await showRecentTrace.getAttribute('aria-expanded')) !== 'true') {
      throw new Error('The full execution trace state was not announced.');
    }
    await showRecentTrace.click();
    if ((await page.locator('#trace-list .trace-row').count()) > 8) {
      throw new Error('The recent execution trace limit was not restored.');
    }

    await page.locator('button[title="styles.css"]').click();
    await page.getByLabel('Edit styles.css').waitFor();
    if (
      (await page
        .getByRole('tab', { name: /styles\.css/ })
        .getAttribute('aria-selected')) !== 'true'
    ) {
      throw new Error('The active workspace path did not switch to styles.css before reload.');
    }

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByText('Ready', { exact: true }).waitFor();
    const stylesEditor = page.getByLabel('Edit styles.css');
    await stylesEditor.waitFor();
    if (
      (await page
        .getByRole('tab', { name: /styles\.css/ })
        .getAttribute('aria-selected')) !== 'true'
    ) {
      throw new Error('The persisted active workspace path did not restore styles.css after reload.');
    }
    const restoredStyles = await stylesEditor.inputValue();
    if (!restoredStyles.includes('--accent: #f59e0b')) {
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
  <body><h1 id="folder-proof">Folder import works</h1><script type="module" src="app.js"></script></body>
</html>`
    );
    await writeFile(
      path.join(folderFixture, 'styles.css'),
      ':root { --accent: #10b981; --accent-soft: #e7fbf3; } body { color: var(--accent); }'
    );
    await writeFile(
      path.join(folderFixture, 'app.js'),
      "import { card } from './src/components/card%20file.js'; import './cycle-a.js'; const { dynamic } = await import('./dynamic.js'); document.body.dataset.folderImport = card; document.body.dataset.moduleCycle = 'ok'; document.body.dataset.dynamicImport = dynamic;"
    );
    await writeFile(
      path.join(folderFixture, 'dynamic.js'),
      "export const dynamic = 'dynamic module proof';"
    );
    await writeFile(
      path.join(folderFixture, 'cycle-a.js'),
      "import './cycle-b.js'; export const cycle = 'cycle proof';"
    );
    await writeFile(
      path.join(folderFixture, 'cycle-b.js'),
      "import './cycle-a.js'; export const other = 'cycle dependency proof';"
    );
    await mkdir(path.join(folderFixture, 'src', 'components'), {
      recursive: true,
    });
    await writeFile(
      path.join(folderFixture, 'src', 'components', 'card file.js'),
      "export const card = 'folder tree proof';"
    );
    await page.getByLabel('Choose workspace folder').setInputFiles(folderFixture);
    await page.getByText(/Opened .* with 7 file\(s\)/).waitFor();
    await page
      .frameLocator('iframe[title="Live generated web preview"]')
      .locator('#folder-proof')
      .waitFor();
    const folderPreviewBody = page
      .frameLocator('iframe[title="Live generated web preview"]')
      .locator('body');
    if (
      (await folderPreviewBody.getAttribute('data-folder-import')) !==
      'folder tree proof'
    ) {
      throw new Error(
        'Local JavaScript module imports did not execute in the folder preview.'
      );
    }
    if ((await folderPreviewBody.getAttribute('data-module-cycle')) !== 'ok') {
      throw new Error(
        'Cyclic JavaScript module imports did not execute in the folder preview.'
      );
    }
    if (
      (await folderPreviewBody.getAttribute('data-dynamic-import')) !==
      'dynamic module proof'
    ) {
      throw new Error(
        'Nested dynamic JavaScript module imports did not execute in the folder preview.'
      );
    }
    const srcDirectory = page
      .locator('button[role="treeitem"][aria-level="1"]')
      .filter({ hasText: 'src' })
      .first();
    await srcDirectory.waitFor();
    await srcDirectory.focus();
    await page.keyboard.press('ArrowLeft');
    await page.waitForFunction(
      () =>
        document
          .querySelector('button[role="treeitem"][aria-label$="src"]')
          ?.getAttribute('aria-expanded') === 'false'
    );
    await page.keyboard.press('ArrowRight');
    await page.waitForFunction(
      () =>
        document
          .querySelector('button[role="treeitem"][aria-label$="src"]')
          ?.getAttribute('aria-expanded') === 'true'
    );

    await page.evaluate(() => {
      class ProofWritable {
        constructor(handle) {
          this.handle = handle;
          this.chunks = [];
        }

        async write(data) {
          this.chunks.push(data);
        }

        async close() {
          const values = [];
          for (const chunk of this.chunks) {
            values.push(typeof chunk === 'string' ? chunk : await chunk.text());
          }
          this.handle.file = new File(values, this.handle.name, {
            type: this.handle.type,
          });
        }
      }

      class ProofFile {
        kind = 'file';

        constructor(name, source, type = 'text/plain') {
          this.name = name;
          this.type = type;
          this.file = new File([source], name, { type });
        }

        async getFile() {
          return this.file;
        }

        async createWritable() {
          return new ProofWritable(this);
        }
      }

      class ProofDirectory {
        kind = 'directory';
        children = new Map();
        permission = 'granted';
        failWrites = false;

        constructor(name) {
          this.name = name;
        }

        addFile(relativePath, source, type = 'text/plain') {
          const parts = relativePath.split('/').filter(Boolean);
          const name = parts.pop();
          let directory = this;
          for (const part of parts) {
            let child = directory.children.get(part);
            if (!child) {
              child = new ProofDirectory(part);
              directory.children.set(part, child);
            }
            directory = child;
          }
          directory.children.set(name, new ProofFile(name, source, type));
        }

        async *entries() {
          for (const entry of this.children.entries()) yield entry;
        }

        async getDirectoryHandle(name, options = {}) {
          if (this.failWrites) {
            throw Object.assign(new Error('Folder disappeared during write.'), {
              name: 'NotFoundError',
            });
          }
          const existing = this.children.get(name);
          if (existing?.kind === 'directory') return existing;
          if (existing) throw new Error(`Expected directory: ${name}`);
          if (!options.create) {
            throw Object.assign(new Error(`Missing directory: ${name}`), {
              name: 'NotFoundError',
            });
          }
          const directory = new ProofDirectory(name);
          this.children.set(name, directory);
          return directory;
        }

        async getFileHandle(name, options = {}) {
          if (this.failWrites) {
            throw Object.assign(new Error('Folder disappeared during write.'), {
              name: 'NotFoundError',
            });
          }
          const existing = this.children.get(name);
          if (existing?.kind === 'file') return existing;
          if (existing) throw new Error(`Expected file: ${name}`);
          if (!options.create) {
            throw Object.assign(new Error(`Missing file: ${name}`), {
              name: 'NotFoundError',
            });
          }
          const file = new ProofFile(name, '');
          this.children.set(name, file);
          return file;
        }

        async removeEntry(name) {
          this.children.delete(name);
        }

        async queryPermission() {
          return this.permission;
        }

        async requestPermission() {
          return this.permission;
        }
      }

      const root = new ProofDirectory('folder-api-proof');
      root.addFile(
        'index.html',
        '<!doctype html><html><body><h1 id="api-folder-proof">API folder works</h1><script src="app.js"></script><script src="missing.js"></script><script type="module">if (false) { import(\'./missing-module.js\'); import(\'react\'); }</script></body></html>',
        'text/html'
      );
      root.addFile('app.js', "document.body.dataset.apiFolder = 'ready';", 'text/javascript');
      root.addFile('notes.md', '# API folder proof', 'text/markdown');
      window.__webCodingFolderProof = root;
      window.showDirectoryPicker = async () => root;
    });
    await page.getByRole('button', { name: /^Open$/ }).click();
    await page.getByText(/Opened folder-api-proof with 3 file\(s\)/).waitFor();
    if ((await page.locator('.workspace-name').textContent())?.trim() !== 'folder-api-proof') {
      throw new Error('The imported folder root name was not reflected in the workspace metadata.');
    }
    await page
      .frameLocator('iframe[title="Live generated web preview"]')
      .locator('#api-folder-proof')
      .waitFor();
    const previewDiagnostics = page.locator(
      '[aria-label="Preview diagnostics"]'
    );
    await previewDiagnostics.waitFor();
    if (!(await previewDiagnostics.innerText()).includes('Missing script: missing.js')) {
      throw new Error('Preview diagnostics did not surface the missing folder dependency.');
    }
    if (
      !(await previewDiagnostics.innerText()).includes(
        'Missing module import: ./missing-module.js'
      )
    ) {
      throw new Error(
        'Preview diagnostics did not surface the missing module dependency.'
      );
    }
    if (
      !(await previewDiagnostics.innerText()).includes(
        'Bare module specifier is unavailable in the standalone preview: react'
      )
    ) {
      throw new Error(
        'Preview diagnostics did not surface the unsupported bare module dependency.'
      );
    }

    await prompt.fill('Add a feature card "Missing slot" "This should explain the target error."');
    await send.click();
    await page.getByRole('button', { name: 'Approve preview.addFeature' }).click();
    await page.getByText(/\[PREVIEW_TARGET_NOT_FOUND\]/).waitFor();

    await page.getByRole('tab', { name: /notes\.md/ }).click();
    await page.getByRole('button', { name: 'Rename notes.md' }).click();
    const renameDialog = page.getByRole('dialog', { name: 'Rename file' });
    await renameDialog.getByLabel('New file path').fill('renamed.md');
    await renameDialog
      .getByRole('button', { name: 'Rename file', exact: true })
      .click();
    await page.getByLabel('Edit renamed.md').waitFor();
    await page.locator('.statusbar-state:not(.statusbar-state-running)').waitFor();
    await page.getByRole('button', { name: 'Revert renamed.md' }).click();
    const revertDialog = page.getByRole('dialog', {
      name: 'Revert active file?',
    });
    await revertDialog.getByRole('button', { name: 'Revert file' }).click();
    await page.getByLabel('Edit notes.md').waitFor();
    if (await page.getByRole('tab', { name: /renamed\.md/ }).count()) {
      throw new Error('Reverting a renamed file did not restore its original path.');
    }

    await page.getByRole('tab', { name: /app\.js/ }).click();
    const apiFolderEditor = page.getByLabel('Edit app.js');
    await apiFolderEditor.fill("document.body.dataset.apiFolder = 'saved';");
    await page.locator('.editor-save').click();
    await page.getByText('Saved', { exact: true }).waitFor();
    const savedFolderSource = await page.evaluate(
      () => window.__webCodingFolderProof.children.get('app.js')?.file.text()
    );
    if ((await savedFolderSource) !== "document.body.dataset.apiFolder = 'saved';") {
      throw new Error('Save to folder did not write through the File System Access boundary.');
    }

    await page.evaluate(() => {
      window.__webCodingFolderProof.failWrites = true;
    });
    await apiFolderEditor.fill("document.body.dataset.apiFolder = 'stale-save';");
    await page.locator('.editor-save').click();
    await page.getByText(/\[WORKSPACE_FOLDER_STALE\]/).waitFor();
    await page.getByRole('button', { name: 'Reconnect folder' }).waitFor();
    await page.evaluate(() => {
      window.__webCodingFolderProof.failWrites = false;
    });
    await page.getByRole('button', { name: 'Reconnect folder' }).click();
    const reconnectDialog = page.getByRole('dialog', {
      name: 'Open a new folder?',
    });
    await reconnectDialog.getByRole('button', { name: 'Open folder' }).click();
    await page.getByText(/Opened folder-api-proof with 3 file\(s\)/).waitFor();
    await page.getByRole('tab', { name: /app\.js/ }).click();

    await page.evaluate(() => {
      window.__webCodingFolderProof.permission = 'denied';
    });
    await apiFolderEditor.fill("document.body.dataset.apiFolder = 'permission-denied';");
    await page.locator('.editor-save').click();
    await page.getByText(/\[WORKSPACE_FOLDER_PERMISSION_DENIED\]/).waitFor();
    await page.getByRole('button', { name: 'Grant folder access' }).waitFor();
    await page.evaluate(() => {
      window.__webCodingFolderProof.permission = 'granted';
    });
    await page.getByRole('button', { name: 'Grant folder access' }).click();
    await page.getByText('Write access restored for the connected folder.').waitFor();
    await page.locator('.editor-save').click();
    await page.getByText('Saved', { exact: true }).waitFor();
    const permissionRecoveredSource = await page.evaluate(
      () => window.__webCodingFolderProof.children.get('app.js')?.file.text()
    );
    if ((await permissionRecoveredSource) !== "document.body.dataset.apiFolder = 'permission-denied';") {
      throw new Error('Granting folder access did not recover the pending save.');
    }

    await page.getByRole('tab', { name: /notes\.md/ }).click();
    await page.getByRole('button', { name: 'Rename notes.md' }).click();
    const folderRenameDialog = page.getByRole('dialog', { name: 'Rename file' });
    await folderRenameDialog.getByLabel('New file path').fill('renamed-folder.md');
    await folderRenameDialog
      .getByRole('button', { name: 'Rename file', exact: true })
      .click();
    await page.getByLabel('Edit renamed-folder.md').waitFor();
    await page.locator('.statusbar-state:not(.statusbar-state-running)').waitFor();
    await page.locator('.editor-save').click();
    await page
      .getByText(/Saved 1 file\(s\) and deleted 1 file\(s\)/)
      .last()
      .waitFor();
    const renamedFolderState = await page.evaluate(async () => {
      const root = window.__webCodingFolderProof;
      const renamed = root.children.get('renamed-folder.md');
      return {
        notesPresent: root.children.has('notes.md'),
        renamedSource: renamed ? await renamed.file.text() : null,
      };
    });
    if (
      renamedFolderState.notesPresent ||
      renamedFolderState.renamedSource !== '# API folder proof'
    ) {
      throw new Error('Save to folder did not converge the renamed file and deletion.');
    }

    await page.getByRole('button', { name: 'Revert renamed-folder.md' }).click();
    const folderRevertDialog = page.getByRole('dialog', {
      name: 'Revert active file?',
    });
    await folderRevertDialog.getByRole('button', { name: 'Revert file' }).click();
    await page.getByLabel('Edit notes.md').waitFor();
    await page.locator('.statusbar-state:not(.statusbar-state-running)').waitFor();
    await page.locator('.editor-save').click();
    await page
      .getByText(/Saved 1 file\(s\) and deleted 1 file\(s\)/)
      .last()
      .waitFor();
    const restoredFolderState = await page.evaluate(() => {
      const root = window.__webCodingFolderProof;
      return {
        notesPresent: root.children.has('notes.md'),
        renamedPresent: root.children.has('renamed-folder.md'),
      };
    });
    if (!restoredFolderState.notesPresent || restoredFolderState.renamedPresent) {
      throw new Error('Reverting and saving the renamed folder file did not restore notes.md.');
    }

    await page.evaluate(() => {
      const handle = window.__webCodingFolderProof.children.get('app.js');
      handle.file = new File(["document.body.dataset.apiFolder = 'reloaded';"], 'app.js', {
        type: 'text/javascript',
      });
    });
    await page.getByRole('button', { name: 'Reload connected workspace folder' }).click();
    await page.getByText(/Reloaded the connected folder with 3 file\(s\)/).waitFor();
    await page.getByRole('tab', { name: /app\.js/ }).click();
    if ((await page.getByLabel('Edit app.js').inputValue()) !== "document.body.dataset.apiFolder = 'reloaded';") {
      throw new Error('Reload did not replace the browser workspace with folder contents.');
    }
    await page.getByRole('button', { name: 'Disconnect linked workspace folder' }).click();
    await page.getByRole('button', { name: /^Save$/ }).waitFor();
    if (await page.getByRole('button', { name: 'Disconnect linked workspace folder' }).count()) {
      throw new Error('Disconnect did not remove the local folder sync controls.');
    }
    await page.getByRole('tab', { name: /notes\.md/ }).click();
    await page.getByRole('button', { name: 'Rename notes.md' }).click();
    const persistedRenameDialog = page.getByRole('dialog', {
      name: 'Rename file',
    });
    await persistedRenameDialog
      .getByLabel('New file path')
      .fill('renamed-persisted.md');
    await persistedRenameDialog
      .getByRole('button', { name: 'Rename file', exact: true })
      .click();
    await page.getByLabel('Edit renamed-persisted.md').waitFor();
    await page
      .locator('.statusbar-state:not(.statusbar-state-running)')
      .waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.getByLabel('Edit renamed-persisted.md').waitFor();
    if ((await page.locator('.workspace-name').textContent())?.trim() !== 'folder-api-proof') {
      throw new Error('The persisted workspace root name did not restore after reload.');
    }
    const persistedRenameEditor = page.getByLabel('Edit renamed-persisted.md');
    const writeFileTrace = page
      .locator('#trace-list .trace-row')
      .filter({ hasText: 'workspace.writeFile' });
    const writeFileTraceCount = await writeFileTrace.count();
    await persistedRenameEditor.fill('# changed after reload\n');
    await page.getByText('Unsaved changes', { exact: true }).waitFor();
    await page.waitForFunction(
      (expectedCount) =>
        document.querySelectorAll('#trace-list .trace-row').length > 0 &&
        Array.from(document.querySelectorAll('#trace-list .trace-row')).filter(
          (row) => row.textContent?.includes('workspace.writeFile')
        ).length > expectedCount,
      writeFileTraceCount
    );
    await page.locator('.statusbar-state:not(.statusbar-state-running)').waitFor();
    await page
      .getByRole('button', { name: 'Revert renamed-persisted.md' })
      .click();
    const persistedRevertDialog = page.getByRole('dialog', {
      name: 'Revert active file?',
    });
    await persistedRevertDialog.waitFor();
    await persistedRevertDialog
      .getByRole('button', { name: 'Revert file' })
      .click();
    await page.getByLabel('Edit notes.md').waitFor();
    if ((await page.getByLabel('Edit notes.md').inputValue()) !== '# API folder proof') {
      throw new Error(
        'Reverting a persisted rename did not restore the saved source at the original path.'
      );
    }
    await page.getByRole('tab', { name: /index\.html/ }).click();

    await page
      .getByRole('button', { name: 'Open OpenRouter settings' })
      .click();
    let settingsDialog = page.getByRole('dialog', { name: 'OpenRouter API' });
    if (
      !(await settingsDialog.locator('.settings-note').innerText()).includes(
        'context-action.openrouter.api-key'
      )
    ) {
      throw new Error(
        'The OpenRouter settings dialog does not explain the shared API-key storage contract.'
      );
    }
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

    const blockedIndexedDbPage = await page.context().browser().newPage();
    const blockedIndexedDbErrors = [];
    blockedIndexedDbPage.on('console', (message) => {
      if (message.type() === 'error') blockedIndexedDbErrors.push(message.text());
    });
    blockedIndexedDbPage.on('pageerror', (error) =>
      blockedIndexedDbErrors.push(error.message)
    );
    await blockedIndexedDbPage.addInitScript(() => {
      Object.defineProperty(window, 'indexedDB', {
        configurable: true,
        get() {
          throw new DOMException('IndexedDB blocked for proof.', 'SecurityError');
        },
      });
    });
    try {
      await blockedIndexedDbPage.goto(url, { waitUntil: 'networkidle' });
      const storageErrorChip = blockedIndexedDbPage.getByRole('status', {
        name: /browser persistence unavailable/i,
      });
      await storageErrorChip.waitFor();
      const storageErrorLabel = await storageErrorChip.getAttribute('aria-label');
      if (!storageErrorLabel?.includes('MissingAPIError')) {
        throw new Error(
          `The IndexedDB failure reason was not exposed in the storage status: ${storageErrorLabel ?? 'missing label'}`
        );
      }
      await blockedIndexedDbPage
        .locator('[data-tool-name="workspace.getStatus"]')
        .click();
      await blockedIndexedDbPage
        .getByRole('button', { name: 'Run with arguments' })
        .click();
      const statusTrace = blockedIndexedDbPage
        .locator('#trace-list .trace-row')
        .filter({ hasText: 'workspace.getStatus' })
        .first();
      await statusTrace.waitFor();
      await statusTrace.getByText('Inspect tools/call').click();
      const statusResultText = await statusTrace
        .locator('.trace-detail-block')
        .last()
        .innerText();
      if (!statusResultText.includes('storageError')) {
        throw new Error(
          'workspace.getStatus did not return the browser persistence error.'
        );
      }
      const blockedEditor = blockedIndexedDbPage.getByLabel('Edit index.html');
      const blockedWriteTrace = blockedIndexedDbPage
        .locator('#trace-list .trace-row')
        .filter({ hasText: 'workspace.writeFile' });
      const blockedWriteTraceCount = await blockedWriteTrace.count();
      await blockedEditor.fill('<!doctype html><title>memory proof</title>');
      await blockedIndexedDbPage
        .getByText('Unsaved changes', { exact: true })
        .waitFor();
      await blockedIndexedDbPage.waitForFunction(
        (expectedCount) =>
          Array.from(document.querySelectorAll('#trace-list .trace-row')).filter(
            (row) => row.textContent?.includes('workspace.writeFile')
          ).length > expectedCount,
        blockedWriteTraceCount
      );
      await blockedIndexedDbPage
        .locator('.statusbar-state:not(.statusbar-state-running)')
        .waitFor();
      const blockedWriteEntry = blockedIndexedDbPage
        .locator('#trace-list .trace-row')
        .filter({ hasText: 'workspace.writeFile' })
        .last();
      await blockedWriteEntry.getByText('Inspect tools/call').click();
      const blockedWriteResult = await blockedWriteEntry
        .locator('.trace-detail-block')
        .last()
        .innerText();
      if (!blockedWriteResult.includes('"storageMode": "memory"')) {
        throw new Error(
          'A memory-only workspace mutation did not expose storageMode in its tool result.'
        );
      }
      if (blockedIndexedDbErrors.length) {
        throw new Error(
          `Blocked IndexedDB browser errors: ${blockedIndexedDbErrors.join(' | ')}`
        );
      }
    } finally {
      await blockedIndexedDbPage.close();
    }

    const retryContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const retryPage = await retryContext.newPage();
    const retryConsoleErrors = [];
    let retryRequestCount = 0;
    retryPage.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (
        text.includes('document is sandboxed and lacks the') ||
        text.includes('server responded with a status of 503')
      ) {
        return;
      }
      retryConsoleErrors.push(text);
    });
    retryPage.on('pageerror', (error) => {
      if (error.message.includes('document is sandboxed and lacks the')) return;
      retryConsoleErrors.push(error.message);
    });
    await retryPage.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, 'test-openrouter-key');
    }, 'context-action.openrouter.api-key');
    await retryPage.route('**/api/v1/chat/completions', async (route) => {
      retryRequestCount += 1;
      if (retryRequestCount <= 2) {
        await route.fulfill({
          status: 503,
          contentType: 'text/plain',
          body: 'upstream unavailable',
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'Transient provider recovery',
              },
            },
          ],
        }),
      });
    });
    try {
      await retryPage.goto(url, { waitUntil: 'networkidle' });
      await retryPage.getByText('Ready', { exact: true }).waitFor();
      const retryPrompt = retryPage.getByLabel('Web studio prompt');
      const retrySend = retryPage.getByRole('button', { name: /^Send/ });
      await retryPrompt.fill('Show workspace status');
      await retrySend.click();
      const firstRequestDeadline = Date.now() + 2_000;
      while (retryRequestCount < 1 && Date.now() < firstRequestDeadline) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      if (retryRequestCount !== 1) {
        throw new Error('The OpenRouter retry proof did not start its request.');
      }
      await retryPage
        .getByText(/retrying provider request 1\/2/)
        .waitFor();
      await retryPage.getByRole('button', { name: /^Cancel/ }).click();
      await retryPage.getByText('Execution cancelled.', { exact: true }).waitFor();
      if (retryRequestCount !== 1) {
        throw new Error('Cancelling during provider backoff allowed another request.');
      }

      await retryPrompt.fill('Show workspace status');
      await retrySend.click();
      await retryPage
        .getByText('Transient provider recovery', { exact: true })
        .waitFor();
      if (retryRequestCount !== 3) {
        throw new Error(
          `The OpenRouter retry proof expected two retries, got ${retryRequestCount - 1}.`
        );
      }
      if (retryConsoleErrors.length) {
        throw new Error(
          `OpenRouter retry browser errors: ${retryConsoleErrors.join(' | ')}`
        );
      }
    } finally {
      await retryContext.close();
    }

    const authContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const authPage = await authContext.newPage();
    const authConsoleErrors = [];
    let authRequestCount = 0;
    authPage.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (
        text.includes('document is sandboxed and lacks the') ||
        text.includes('server responded with a status of 401')
      ) {
        return;
      }
      authConsoleErrors.push(text);
    });
    authPage.on('pageerror', (error) => {
      if (error.message.includes('document is sandboxed and lacks the')) return;
      authConsoleErrors.push(error.message);
    });
    await authPage.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, 'test-openrouter-auth-key');
    }, 'context-action.openrouter.api-key');
    await authPage.route('**/api/v1/chat/completions', async (route) => {
      authRequestCount += 1;
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { message: 'User not found.' },
        }),
      });
    });
    try {
      await authPage.goto(url, { waitUntil: 'networkidle' });
      await authPage.getByText('Ready', { exact: true }).waitFor();
      await authPage.getByLabel('Web studio prompt').fill('Show workspace status');
      await authPage.getByRole('button', { name: /^Send/ }).click();
      await authPage
        .getByText('[OPENROUTER_AUTHENTICATION_FAILED] User not found.', {
          exact: true,
        })
        .waitFor();
      if (authRequestCount !== 1) {
        throw new Error(
          `The OpenRouter authentication failure unexpectedly retried ${authRequestCount} request(s).`
        );
      }
      if (
        await authPage.getByRole('button', { name: 'Retry', exact: true }).count()
      ) {
        throw new Error(
          'A non-retryable OpenRouter authentication failure exposed a misleading Retry action.'
        );
      }
      await authPage
        .getByRole('button', { name: 'Open provider settings' })
        .click();
      await authPage.getByRole('dialog', { name: 'OpenRouter API' }).waitFor();
      if (authConsoleErrors.length) {
        throw new Error(
          `OpenRouter authentication browser errors: ${authConsoleErrors.join(' | ')}`
        );
      }
    } finally {
      await authContext.close();
    }

    const toolLoopContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const toolLoopPage = await toolLoopContext.newPage();
    const toolLoopConsoleErrors = [];
    let toolLoopRequestCount = 0;
    let toolLoopFinalRequestBody;
    let toolLoopPatchExpectedRevision;
    let toolLoopErrorResultContent;
    toolLoopPage.on('console', (message) => {
      if (message.type() !== 'error') return;
      const text = message.text();
      if (text.includes('document is sandboxed and lacks the')) return;
      toolLoopConsoleErrors.push(text);
    });
    toolLoopPage.on('pageerror', (error) => {
      if (error.message.includes('document is sandboxed and lacks the')) return;
      toolLoopConsoleErrors.push(error.message);
    });
    await toolLoopPage.addInitScript((storageKey) => {
      window.localStorage.setItem(storageKey, 'test-openrouter-tool-loop-key');
    }, 'context-action.openrouter.api-key');
    await toolLoopPage.route(
      '**/api/v1/chat/completions',
      async (route) => {
        toolLoopRequestCount += 1;
        const requestBody = route.request().postDataJSON();
        if (toolLoopRequestCount === 1) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              choices: [
                {
                  message: {
                    role: 'assistant',
                    content: null,
                    tool_calls: [
                      {
                        id: 'provider_status_1',
                        type: 'function',
                        function: {
                          name: 'workspace.getStatus',
                          arguments: '{}',
                        },
                      },
                      {
                        id: 'provider_preview_1',
                        type: 'function',
                        function: {
                          name: 'preview.getStatus',
                          arguments: '{}',
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          });
          return;
        }
        if (toolLoopRequestCount === 2) {
          const statusResultMessage = requestBody.messages?.find(
            (message) =>
              message.role === 'tool' &&
              message.tool_call_id === 'provider_status_1'
          );
          const statusResult = JSON.parse(statusResultMessage?.content ?? '{}');
          toolLoopPatchExpectedRevision = statusResult.revision;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              choices: [
                {
                  message: {
                    role: 'assistant',
                    content: null,
                    tool_calls: [
                      {
                        id: 'provider_patch_1',
                        type: 'function',
                        function: {
                          name: 'workspace.applyPatch',
                          arguments: JSON.stringify({
                            path: 'index.html',
                            search: 'Ship a page from a conversation.',
                            replace: 'Ship a page from a failed provider tool.',
                            occurrence: 'first',
                            expectedRevision: toolLoopPatchExpectedRevision + 1,
                          }),
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          });
          return;
        }
        if (toolLoopRequestCount === 3) {
          const failedPatchResultMessage = requestBody.messages?.find(
            (message) =>
              message.role === 'tool' &&
              message.tool_call_id === 'provider_patch_1'
          );
          toolLoopErrorResultContent = failedPatchResultMessage?.content;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              choices: [
                {
                  message: {
                    role: 'assistant',
                    content: null,
                    tool_calls: [
                      {
                        id: 'provider_patch_2',
                        type: 'function',
                        function: {
                          name: 'workspace.applyPatch',
                          arguments: JSON.stringify({
                            path: 'index.html',
                            search: 'Ship a page from a conversation.',
                            replace: 'Ship a page from a provider tool chain.',
                            occurrence: 'first',
                            expectedRevision: toolLoopPatchExpectedRevision,
                          }),
                        },
                      },
                    ],
                  },
                },
              ],
            }),
          });
          return;
        }
        toolLoopFinalRequestBody = requestBody;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            choices: [
              {
                message: {
                  role: 'assistant',
                  content: 'Provider tool chain completed',
                },
              },
            ],
          }),
        });
      }
    );
    try {
      await toolLoopPage.goto(url, { waitUntil: 'networkidle' });
      await toolLoopPage.getByText('Ready', { exact: true }).waitFor();
      const toolLoopPrompt = toolLoopPage.getByLabel('Web studio prompt');
      await toolLoopPrompt.fill(
        'Inspect the current workspace status and update the hero title.'
      );
      await toolLoopPage.getByRole('button', { name: /^Send/ }).click();
      const toolLoopPatchApproval = toolLoopPage.getByRole('button', {
        name: 'Approve workspace.applyPatch',
      });
      await toolLoopPatchApproval.waitFor();
      await toolLoopPatchApproval.click();
      await toolLoopPatchApproval.waitFor();
      await toolLoopPatchApproval.click();
      await toolLoopPage
        .getByText('Provider tool chain completed', { exact: true })
        .waitFor();
      if (toolLoopRequestCount !== 4) {
        throw new Error(
          `The OpenRouter tool loop expected four provider requests, got ${toolLoopRequestCount}.`
        );
      }
      if (typeof toolLoopPatchExpectedRevision !== 'number') {
        throw new Error(
          'The OpenRouter mutation tool call did not receive the workspace revision from the status result.'
        );
      }
      const toolLoopMessages = toolLoopFinalRequestBody?.messages;
      const assistantStatusToolMessage = toolLoopMessages?.find(
        (message) =>
          message.role === 'assistant' &&
          Array.isArray(message.tool_calls) &&
          message.tool_calls.some(
            (toolCall) => toolCall.id === 'provider_status_1'
          )
      );
      const statusToolResultMessage = toolLoopMessages?.find(
        (message) =>
          message.role === 'tool' &&
          message.tool_call_id === 'provider_status_1'
      );
      const assistantPreviewToolMessage = toolLoopMessages?.find(
        (message) =>
          message.role === 'assistant' &&
          Array.isArray(message.tool_calls) &&
          message.tool_calls.some(
            (toolCall) => toolCall.id === 'provider_preview_1'
          )
      );
      const previewToolResultMessage = toolLoopMessages?.find(
        (message) =>
          message.role === 'tool' &&
          message.tool_call_id === 'provider_preview_1'
      );
      const assistantPatchToolMessage = toolLoopMessages?.find(
        (message) =>
          message.role === 'assistant' &&
          Array.isArray(message.tool_calls) &&
          message.tool_calls.some(
            (toolCall) => toolCall.id === 'provider_patch_2'
          )
      );
      const patchToolResultMessage = toolLoopMessages?.find(
        (message) =>
          message.role === 'tool' &&
          message.tool_call_id === 'provider_patch_2'
      );
      const failedPatchToolResultMessage = toolLoopMessages?.find(
        (message) =>
          message.role === 'tool' &&
          message.tool_call_id === 'provider_patch_1'
      );
      if (
        !assistantStatusToolMessage ||
        !statusToolResultMessage ||
        !assistantPreviewToolMessage ||
        !previewToolResultMessage ||
        !assistantPatchToolMessage ||
        !patchToolResultMessage ||
        !failedPatchToolResultMessage
      ) {
        throw new Error(
          'The OpenRouter follow-up request did not preserve both assistant tool calls and their correlated results.'
        );
      }
      if (
        typeof statusToolResultMessage.content !== 'string' ||
        !statusToolResultMessage.content.includes('storageMode')
      ) {
        throw new Error(
          'The OpenRouter tool result did not contain the structured workspace status.'
        );
      }
      if (
        typeof previewToolResultMessage.content !== 'string' ||
        !previewToolResultMessage.content.includes('"status"')
      ) {
        throw new Error(
          'The OpenRouter batch tool result did not contain the preview status.'
        );
      }
      if (
        typeof patchToolResultMessage.content !== 'string' ||
        !patchToolResultMessage.content.includes('"preview":"synced"')
      ) {
        throw new Error(
          'The OpenRouter mutation result did not report a synchronized preview.'
        );
      }
      if (
        typeof toolLoopErrorResultContent !== 'string' ||
        !toolLoopErrorResultContent.includes('"status":"error"') ||
        !toolLoopErrorResultContent.includes('WORKSPACE_REVISION_CONFLICT') ||
        !toolLoopErrorResultContent.includes('"retryable":true')
      ) {
        throw new Error(
          'The OpenRouter follow-up did not receive a structured retryable revision-conflict result before retrying the mutation.'
        );
      }
      if (
        !(await toolLoopPage.getByLabel('Edit index.html').inputValue()).includes(
          'Ship a page from a provider tool chain.'
        )
      ) {
        throw new Error(
          'The OpenRouter mutation did not update the workspace editor source.'
        );
      }
      await toolLoopPage
        .frameLocator('iframe[title="Live generated web preview"]')
        .getByText('Ship a page from a provider tool chain.', { exact: true })
        .waitFor();
      await toolLoopPage
        .locator('#trace-list .trace-row')
        .filter({ hasText: 'workspace.getStatus' })
        .first()
        .waitFor();
      await toolLoopPage
        .locator('#trace-list .trace-row')
        .filter({ hasText: 'workspace.applyPatch' })
        .first()
        .waitFor();
      if (
        (await toolLoopPage
          .locator('#trace-list .trace-row')
          .filter({ hasText: 'retryable' })
          .count()) < 1
      ) {
        throw new Error(
          'The trace UI did not surface retryable recovery metadata for the failed tool call.'
        );
      }
      if (toolLoopConsoleErrors.length) {
        throw new Error(
          `OpenRouter tool loop browser errors: ${toolLoopConsoleErrors.join(' | ')}`
        );
      }
    } finally {
      await toolLoopContext.close();
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

    const failedChunkContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const failedChunkPage = await failedChunkContext.newPage();
    let blockedEditorModuleRequest = false;
    const failedChunkModuleRequests = [];
    failedChunkPage.on('request', (request) => {
      if (request.url().includes('/src/')) {
        failedChunkModuleRequests.push(request.url());
      }
    });
    await failedChunkPage.route('**/*', async (route) => {
      if (!route.request().url().includes('/src/BoltStyleEditor.tsx')) {
        await route.continue();
        return;
      }
      blockedEditorModuleRequest = true;
      await route.abort('failed');
    });
    try {
      await failedChunkPage.goto(url, { waitUntil: 'networkidle' });
      try {
        await failedChunkPage
          .locator('main[role="alert"]')
          .waitFor({ timeout: 3_000 });
      } catch (error) {
        const failedChunkBody = await failedChunkPage.locator('body').innerText();
        throw new Error(
          `The editor load-failure UI did not appear. blocked=${blockedEditorModuleRequest}; requests=${failedChunkModuleRequests.join(' | ')}; body=${failedChunkBody}; ${error instanceof Error ? error.message : String(error)}`
        );
      }
      await failedChunkPage
        .getByRole('button', { name: 'Reload studio' })
        .waitFor();
      if (!blockedEditorModuleRequest) {
        throw new Error(
          `The lazy editor module was not intercepted in the load-failure proof. Requests: ${failedChunkModuleRequests.join(' | ')}`
        );
      }
    } finally {
      await failedChunkContext.close();
    }

    const unexpectedConsoleErrors = consoleErrors.filter(
      (message) => !message.startsWith('browser preview proof')
    );
    if (unexpectedConsoleErrors.length) {
      throw new Error(
        `Browser console errors: ${unexpectedConsoleErrors.join(' | ')}`
      );
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
