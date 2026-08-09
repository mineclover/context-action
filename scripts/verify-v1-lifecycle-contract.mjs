#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOutput = 'reports/release/v1.0.0/test-results/lifecycle-report.json';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

function run(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', chunk => stdout.push(chunk));
    child.stderr.on('data', chunk => stderr.push(chunk));
    child.on('error', error => resolve({ exitCode: 1, output: error.message }));
    child.on('close', code => resolve({
      exitCode: code ?? 1,
      output: `${Buffer.concat(stdout)}${Buffer.concat(stderr)}`,
    }));
  });
}

async function main() {
  const output = path.resolve(repositoryRoot, option('--output', defaultOutput));
  const tests = [
    '__tests__/unit/action-register.lifecycle.test.ts',
    '__tests__/unit/execution-result-metrics.test.ts',
    '__tests__/type-safety/ActionRegister.type-safety.test.ts',
  ];
  const command = [
    '--filter', '@context-action/core', 'exec', 'jest', '--runInBand',
    '--runTestsByPath', ...tests,
  ];
  const [result, actionRegisterSource] = await Promise.all([
    run('pnpm', command),
    readFile(path.join(repositoryRoot, 'packages/core/src/ActionRegister.ts'), 'utf8'),
  ]);
  const sourceInvariants = [
    ['three-state lifecycle', "'active' | 'closing' | 'destroyed'"],
    ['reentrant stable shutdown promise', 'if (this.destroyAsyncPromise) return this.destroyAsyncPromise;'],
    ['abort before drain', 'this.lifecycleController.abort(shutdownError);'],
    ['drain dispatches and handlers', 'this.activeDispatches.size > 0 || this.activeHandlerPromises.size > 0'],
    ['finalize only after drain', 'this.finalizeDestroy();'],
  ].map(([name, expected]) => ({ name, passed: actionRegisterSource.includes(expected) }));
  const passed = result.exitCode === 0 && sourceInvariants.every(invariant => invariant.passed);
  const report = {
    schemaVersion: 'context-action-v1-lifecycle-report.v1',
    release: 'context-action-v1.0.0',
    generatedAt: new Date().toISOString(),
    status: passed ? 'passed' : 'failed',
    command: {
      command: 'pnpm',
      args: command,
      exitCode: result.exitCode,
      output: result.output,
    },
    coverage: [
      'queue wait cancellation and destroy rejection',
      'debounce cancellation',
      'retry telemetry and terminal outcomes',
      'reentrant destroyAsync and active-handler drain',
      'race loser drain before cleanup',
      'ExecutionResult metric and immutable-snapshot contracts',
    ],
    sourceInvariants,
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${report.status} lifecycle report to ${path.relative(repositoryRoot, output)}`);
  if (!passed) process.exitCode = 1;
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
