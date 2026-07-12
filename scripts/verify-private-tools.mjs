#!/usr/bin/env node

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const styleTestingDirectory = path.join(repositoryRoot, 'packages/style-testing');
const testDrivenDocsDirectory = path.join(repositoryRoot, 'packages/test-driven-docs');

const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, cwd, environment = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: environment,
      stdio: 'inherit',
    });

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const reason = signal ? `signal ${signal}` : `exit code ${code}`;
      reject(new Error(`${command} ${args.join(' ')} failed with ${reason}`));
    });
  });
}

// pnpm lifecycle scripts inject npm_config_* values that are meaningful to
// pnpm but rejected by standalone npm installs (notably allow-scripts). Keep
// the independent npm package isolated from its parent package manager.
const standaloneNpmEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(
    ([key]) => !key.toLowerCase().startsWith('npm_'),
  ),
);

await run(pnpmCommand, ['type-check'], styleTestingDirectory);
await run(pnpmCommand, ['test'], styleTestingDirectory);
await run(
  npmCommand,
  ['ci', '--ignore-scripts'],
  testDrivenDocsDirectory,
  standaloneNpmEnvironment,
);
await run(npmCommand, ['test'], testDrivenDocsDirectory, standaloneNpmEnvironment);

console.log('Verified workspace-only tool packages.');
