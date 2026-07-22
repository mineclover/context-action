#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const consumerRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolingRoot = path.resolve(
  process.env.DOCUMENTATION_TOOLING_ROOT ?? path.join(consumerRoot, '..', 'context-action-documentation-tooling'),
);
const architectureRoot = path.join(consumerRoot, 'packages/architecture-governance');
const foundationPackages = [
  ['@context-action/sem-foundation-contracts', 'packages/sem-foundation'],
  ['@context-action/sem-foundation-repository', 'packages/sem-foundation-repository'],
];

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
    env: options.env ?? { ...process.env, npm_config_update_notifier: 'false' },
  });
}

function packageRootExists() {
  return existsSync(path.join(architectureRoot, 'package.json'))
    && foundationPackages.every(([, relativePath]) => (
      existsSync(path.join(toolingRoot, relativePath, 'package.json'))
    ));
}

function packPackage(packageRoot, destination) {
  const output = run('pnpm', ['pack', '--json', '--pack-destination', destination], packageRoot);
  const parsed = JSON.parse(output);
  const entry = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!entry || typeof entry.filename !== 'string' || !existsSync(entry.filename)) {
    throw new Error(`pnpm pack did not produce an archive for ${packageRoot}.`);
  }
  return entry.filename;
}

function initializeFixture(fixtureRoot) {
  writeFileSync(
    path.join(fixtureRoot, 'package.json'),
    JSON.stringify({
      name: 'architecture-governance-tooling-consumer-smoke',
      private: true,
      type: 'module',
      allowScripts: [],
    }, null, 2),
  );
  writeFileSync(path.join(fixtureRoot, '.npmrc'), 'audit=false\nfund=false\nupdate-notifier=false\n');
}

if (!packageRootExists()) {
  console.log(`Tooling consumer smoke skipped: ${toolingRoot} is not available.`);
  process.exit(0);
}

const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'architecture-governance-tooling-consumer-'));
const archiveRoot = path.join(tempRoot, 'archives');
const fixtureRoot = path.join(tempRoot, 'consumer');
const npmGlobalConfig = path.join(tempRoot, 'npm-globalrc');

try {
  mkdirSync(archiveRoot, { recursive: true });
  mkdirSync(fixtureRoot, { recursive: true });
  writeFileSync(npmGlobalConfig, '');
  initializeFixture(fixtureRoot);

  run('pnpm', ['arch:build'], consumerRoot, { stdio: 'inherit' });
  for (const [name] of foundationPackages) {
    run('pnpm', ['--filter', name, 'build'], toolingRoot, { stdio: 'inherit' });
  }

  const architectureArchive = packPackage(architectureRoot, archiveRoot);
  const foundationArchives = foundationPackages.map(([, relativePath]) => (
    packPackage(path.join(toolingRoot, relativePath), archiveRoot)
  ));
  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--no-package-lock',
    '--userconfig',
    path.join(fixtureRoot, '.npmrc'),
    '--globalconfig',
    npmGlobalConfig,
    '--registry=https://registry.npmjs.org',
    `file:${architectureArchive}`,
    ...foundationArchives.map((archive) => `file:${archive}`),
  ], fixtureRoot, {
    stdio: 'inherit',
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR,
      LANG: process.env.LANG,
      NODE_OPTIONS: process.env.NODE_OPTIONS,
    },
  });

  const moduleCheck = [
    "const governance = await import('@context-action/architecture-governance');",
    "if (typeof governance.createContextScope !== 'function') throw new Error('Architecture Governance export missing');",
    "if (typeof governance.parseArchitectureRegistry !== 'function') throw new Error('Architecture Governance parser export missing');",
  ].join('');
  run(process.execPath, ['--input-type=module', '-e', moduleCheck], fixtureRoot, { stdio: 'inherit' });
  run(path.join(fixtureRoot, 'node_modules/.bin/arch-verify'), ['--help'], fixtureRoot, { stdio: 'inherit' });
  process.stdout.write('Architecture Governance tooling consumer smoke verified with local Foundation tarballs.\n');
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
