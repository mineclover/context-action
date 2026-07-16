import { spawn } from 'node:child_process';
import net from 'node:net';
import path from 'node:path';

const rootDirectory = path.resolve(import.meta.dirname, '..');
const demoDirectory = path.join(rootDirectory, 'demos/bolt-style-editor');
let serverProcess;

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
      const body = await response.text();
      if (response.ok && body.includes('/src/main.tsx')) return body;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(
    `Development web-coding server did not become ready at ${url}: ${lastError instanceof Error ? lastError.message : 'unknown error'}`
  );
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
    // The dev server may already have exited after the assertion failed.
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
  serverProcess = undefined;
}

const port = await reservePort();
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
serverProcess = spawn(command, ['dev', '--', '--port', String(port)], {
  cwd: demoDirectory,
  detached: process.platform !== 'win32',
  env: { ...process.env, NODE_ENV: 'development' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let output = '';
serverProcess.stdout?.on('data', (chunk) => {
  output += chunk.toString();
});
serverProcess.stderr?.on('data', (chunk) => {
  output += chunk.toString();
});

const url = `http://127.0.0.1:${port}/`;
try {
  const body = await waitForServer(url);
  if (!body.includes('<title>Context-Action Web Coding Studio</title>')) {
    throw new Error('The development server did not serve the standalone web-coding entry document.');
  }
  console.log(`Verified standalone dev server port override at ${url}`);
} catch (error) {
  const details = output.trim();
  throw new Error(
    `${error instanceof Error ? error.message : String(error)}${details ? `\n--- server output ---\n${details}` : ''}`
  );
} finally {
  await stopServer();
}
