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
      body: JSON.stringify({
        data: [
          {
            id: 'test/function-calling:free',
            name: 'Test Function Calling:free',
            supported_parameters: ['tools'],
          },
        ],
      }),
    });
  });

  let aiRequestCount = 0;
  let aiProviderToolNames;
  let aiProviderToolDefinitions;
  let aiProviderToolsSignature;
  let aiFollowUpMessages;
  await context.route('**/api/v1/chat/completions', async (route) => {
    aiRequestCount += 1;
    const requestBody = route.request().postDataJSON();
    const providerTools = requestBody.tools;
    if (Array.isArray(providerTools)) {
      aiProviderToolNames ??= providerTools.map(
        (tool) => tool?.function?.name ?? tool?.name
      );
      aiProviderToolDefinitions ??= providerTools;
      aiProviderToolsSignature ??= JSON.stringify(providerTools);
    }

    if (aiRequestCount === 1) {
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
                    id: 'example_update_counter_1',
                    type: 'function',
                    function: {
                      name: 'updateCounter',
                      arguments: JSON.stringify({ amount: 3 }),
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

    aiFollowUpMessages = JSON.stringify(requestBody.messages ?? []);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        choices: [
          {
            message: {
              role: 'assistant',
              content: 'Provider tool call updated the counter.',
            },
          },
        ],
      }),
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

  await aiKeyInput.fill('test-openrouter-tool-calling-key');
  await aiPage.waitForFunction(
    () =>
      document.querySelector('#model')?.value === 'test/function-calling:free'
  );
  const aiPrompt = aiPage.locator(
    'input[placeholder="Ask AI to modify the UI..."]'
  );
  await aiPrompt.fill('Increase the counter by three with the UI tool.');
  await aiPage.getByRole('button', { name: 'Send', exact: true }).click();
  await aiPage
    .getByText('Provider tool call updated the counter.', { exact: true })
    .waitFor();
  await aiPage.getByText('Counter: 3', { exact: true }).waitFor();

  const expectedToolNames = [
    'addListItem',
    'clearList',
    'getUiState',
    'showNotification',
    'toggleTheme',
    'updateCounter',
    'updateHeading',
  ];
  if (
    aiRequestCount !== 2 ||
    !Array.isArray(aiProviderToolNames) ||
    JSON.stringify([...aiProviderToolNames].sort()) !==
      JSON.stringify([...expectedToolNames].sort())
  ) {
    throw new Error(
      'The example AI runner did not send the complete canonical UI tool catalog.'
    );
  }
  if (aiProviderToolsSignature === undefined) {
    throw new Error('The example AI runner omitted the provider tool payload.');
  }
  const counterTool = aiProviderToolDefinitions?.find(
    (tool) => (tool?.function?.name ?? tool?.name) === 'updateCounter'
  );
  if (
    !counterTool ||
    !Array.isArray(counterTool.function?.parameters?.required) ||
    !counterTool.function.parameters.required.includes('amount')
  ) {
    throw new Error(
      'The example AI runner did not preserve the canonical updateCounter input schema.'
    );
  }
  if (
    !aiFollowUpMessages?.includes('example_update_counter_1') ||
    !aiFollowUpMessages.includes('counter')
  ) {
    throw new Error(
      'The example AI runner did not preserve the tool call and result for the follow-up turn.'
    );
  }
  if (pageErrors.length) {
    throw new Error(`Example OpenRouter browser errors: ${pageErrors.join(' | ')}`);
  }

  await context.close();
  console.log(`Verified example OpenRouter key sharing and tool loop at ${url}`);
} finally {
  await browser?.close();
  await stopServer();
}
