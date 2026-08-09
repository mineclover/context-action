#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coreDirectory = path.join(repositoryRoot, 'packages/core');

function run(command, args, options) {
  return execFileSync(command, args, { encoding: 'utf8', ...options });
}

function isolatedNpmEnvironment() {
  return Object.fromEntries(Object.entries(process.env).filter(
    ([key]) => !/^(npm_config|pnpm_config)_/iu.test(key),
  ));
}

async function main() {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'context-action-v1-core-fixture-'));
  try {
    const packageDirectory = path.join(temporaryDirectory, 'package');
    const consumerDirectory = path.join(temporaryDirectory, 'consumer');
    await Promise.all([mkdir(packageDirectory), mkdir(consumerDirectory)]);
    const packed = JSON.parse(run('pnpm', ['pack', '--json', '--pack-destination', packageDirectory], {
      cwd: coreDirectory,
      env: { ...process.env, npm_config_update_notifier: 'false' },
    }));
    const packageFile = Array.isArray(packed) ? packed[0]?.filename : packed.filename;
    if (typeof packageFile !== 'string') throw new Error('pnpm pack did not return a tarball filename');
    const packagePath = path.isAbsolute(packageFile) ? packageFile : path.join(packageDirectory, packageFile);
    await writeFile(path.join(consumerDirectory, 'package.json'), JSON.stringify({
      name: 'context-action-v1-core-migration-fixture', private: true, type: 'module',
    }, null, 2));
    run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--no-package-lock', packagePath], {
      cwd: consumerDirectory,
      env: isolatedNpmEnvironment(),
    });
    const source = `
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface Actions extends ActionPayloadMap {
  save: { id: string };
}

const register = new ActionRegister<Actions>();
register.register('save', ({ id }) => ({ id }), { blocking: true });
register.registerEffect('save', payload => { void payload.id; }, { effectKind: 'guard' });
register.registerEffect('save', event => { void event.id; }, { effectKind: 'observer' });

// @ts-expect-error Dynamic effects must choose a role in the retained 1.x contract.
register.registerEffect('save', () => {});
void register.dispatch('save', { id: 'fixture' });
`;
    const sourcePath = path.join(consumerDirectory, 'index.ts');
    await writeFile(sourcePath, source);
    const typescriptPath = path.join(repositoryRoot, 'node_modules/typescript/bin/tsc');
    await readFile(typescriptPath);
    run(process.execPath, [typescriptPath, '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', sourcePath], { cwd: consumerDirectory, stdio: 'inherit' });
    console.log('Packed @context-action/core v1 migration fixture passed.');
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
