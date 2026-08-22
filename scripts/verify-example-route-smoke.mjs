#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import {
  buildExampleRouteIndex,
  canonicalRoutes,
  collectChangedFiles,
  selectAffectedRoutes,
} from './example-route-impact.mjs';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const exampleDirectory = path.join(rootDirectory, 'example');
let serverProcess;

function resolvePlaywright() {
  const require = createRequire(import.meta.url);
  const modulePath = require.resolve('playwright', {
    paths: [path.join(rootDirectory, 'packages/style-testing')],
  });
  return require(modulePath);
}

function parseArguments(argv) {
  const options = {
    all: false,
    base: undefined,
    changedFiles: [],
    head: undefined,
    routes: [],
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--') continue;
    if (argument === '--all') options.all = true;
    else if (argument === '--base' || argument === '--head') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${argument} requires a commit SHA or ref.`);
      }
      options[argument.slice(2)] = value;
      index += 1;
    }
    else if (argument === '--changed-files' || argument === '--routes') {
      const key = argument === '--changed-files' ? 'changedFiles' : 'routes';
      for (index += 1; index < argv.length && !argv[index].startsWith('--'); index += 1) {
        options[key].push(argv[index]);
      }
      index -= 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
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
    if (process.platform !== 'win32') process.kill(-serverProcess.pid, 'SIGTERM');
    else serverProcess.kill('SIGTERM');
  } catch {
    // The dev server may already have exited after a failed assertion.
  }
  await new Promise((resolve) => setTimeout(resolve, 250));
  serverProcess = undefined;
}

function selectRoutes(options) {
  const routes = canonicalRoutes(buildExampleRouteIndex());
  if (options.routes.length) {
    const requested = new Set(options.routes);
    const missing = options.routes.filter((route) => !routes.some((entry) => entry.path === route));
    if (missing.length) throw new Error(`Unknown canonical example route(s): ${missing.join(', ')}`);
    return routes.filter((route) => requested.has(route.path));
  }
  if (options.all) return routes;
  return selectAffectedRoutes(options.changedFiles, routes);
}

async function runSmoke(url, routes) {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch({ headless: true });
  const failures = [];

  try {
    for (const route of routes) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.goto(new URL(route.path.slice(1), url).toString(), {
          waitUntil: 'domcontentloaded',
        });
        await page.locator('body').waitFor();
        await page.waitForTimeout(150);
        if (!((await page.locator('body').innerText()).trim())) {
          throw new Error('The route rendered an empty document body.');
        }
        if (errors.length) {
          throw new Error(`Browser errors: ${errors.join(' | ')}`);
        }
        console.log(`Verified example route: ${route.path}`);
      } catch (error) {
        failures.push(
          `${route.path} (${route.entry}): ${error instanceof Error ? error.message : String(error)}`
        );
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    throw new Error(`Example route smoke failures:\n${failures.join('\n')}`);
  }
}

const options = parseArguments(process.argv.slice(2));
if (Boolean(options.base) !== Boolean(options.head)) {
  throw new Error('--base and --head must be supplied together.');
}
if (options.base && options.head) {
  options.changedFiles.push(...collectChangedFiles(options.base, options.head));
}
const routes = selectRoutes(options);
if (!routes.length) {
  console.log('No public example route is affected by the supplied files.');
} else {
  const url = await startServer();
  try {
    await runSmoke(url, routes);
  } finally {
    await stopServer();
  }
}
