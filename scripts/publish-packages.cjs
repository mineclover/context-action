#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const { dirname } = require('node:path');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const path = require('node:path');

if (process.env.GITHUB_ACTIONS !== 'true') {
  throw new Error('Direct package publication is disabled. Use an approved GitHub Actions release workflow.');
}

const argumentsList = process.argv.slice(2).filter((argument) => argument !== '--');

function optionValues(name) {
  const values = [];
  for (let index = 0; index < argumentsList.length; index += 1) {
    if (argumentsList[index] !== name) continue;
    const value = argumentsList[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
    values.push(value);
    index += 1;
  }
  return values;
}

function positionalArguments() {
  const positional = [];
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument.startsWith('--')) {
      index += 1;
      continue;
    }
    positional.push(argument);
  }
  return positional;
}

const summaryOption = optionValues('--summary-file');
if (summaryOption.length > 1) throw new Error('--summary-file may be provided once');
const distTagOption = optionValues('--dist-tag');
if (distTagOption.length > 1) throw new Error('--dist-tag may be provided once');
const scopes = optionValues('--scope');
const [summaryArgument] = positionalArguments();
const summaryFile = summaryOption[0] ?? summaryArgument ?? path.join('reports', 'npm-publish-summary.json');
const distTag = distTagOption[0];
if (distTag && !/^[a-z][a-z0-9._-]*$/u.test(distTag)) {
  throw new Error(`Invalid npm dist-tag: ${distTag}`);
}
for (const scope of scopes) {
  if (!/^@context-action\/[a-z0-9-]+$/u.test(scope)) {
    throw new Error(`Invalid package scope: ${scope}`);
  }
}
const maxAttempts = 3;
const retryDelayMs = 15_000;

mkdirSync(dirname(summaryFile), { recursive: true });

function commandSucceeded(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    env: { ...process.env },
    ...options,
  });
  return result.status === 0 ? result : undefined;
}

function publishScopedPackages() {
  if (!distTag) throw new Error('Scoped publishing requires --dist-tag');
  const listResult = commandSucceeded('pnpm', ['exec', 'lerna', 'list', '--all', '--json']);
  if (!listResult) throw new Error('Could not read the Lerna package list for scoped publishing');
  const packages = JSON.parse(listResult.stdout);
  const selected = scopes.map((name) => {
    const packageEntry = packages.find((entry) => entry.name === name);
    if (!packageEntry) throw new Error(`Requested package is not publishable: ${name}`);
    return packageEntry;
  });
  const summary = [];

  function ensureDistTag(manifest, packageDirectory) {
    let tags;
    const attempts = 12;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const tagsResult = commandSucceeded(
        'npm',
        ['view', manifest.name, 'dist-tags', '--json', '--registry=https://registry.npmjs.org'],
      );
      if (tagsResult) {
        tags = JSON.parse(tagsResult.stdout);
        break;
      }
      if (attempt < attempts) {
        process.stdout.write(`Waiting for npm dist-tags (${attempt}/${attempts - 1})...\n`);
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10_000);
      }
    }
    if (!tags) throw new Error(`Could not read dist-tags for ${manifest.name}`);
    if (tags[distTag] === manifest.version) return;
    const add = spawnSync(
      'npm',
      ['dist-tag', 'add', `${manifest.name}@${manifest.version}`, distTag],
      { cwd: packageDirectory, stdio: 'inherit', env: { ...process.env } },
    );
    if (add.status !== 0) {
      throw new Error(`Could not assign ${distTag} to ${manifest.name}@${manifest.version}`);
    }
    process.stdout.write(`Assigned ${distTag} to ${manifest.name}@${manifest.version}.\n`);
  }

  for (const packageEntry of selected) {
    const manifest = JSON.parse(readFileSync(path.join(packageEntry.location, 'package.json'), 'utf8'));
    const published = commandSucceeded(
      'npm',
      ['view', `${manifest.name}@${manifest.version}`, 'version', '--registry=https://registry.npmjs.org'],
    );
    if (published?.stdout.trim() === manifest.version) {
      process.stdout.write(`${manifest.name}@${manifest.version} is already published; skipping.\n`);
      summary.push({ packageName: manifest.name, version: manifest.version, status: 'already-published' });
      ensureDistTag(manifest, packageEntry.location);
      continue;
    }

    const publish = spawnSync(
      'npm',
      ['publish', '--access', 'public', '--tag', distTag, '--provenance'],
      { cwd: packageEntry.location, stdio: 'inherit', env: { ...process.env } },
    );
    if (publish.status !== 0) {
      throw new Error(`${manifest.name}@${manifest.version} failed to publish`);
    }
    summary.push({ packageName: manifest.name, version: manifest.version, status: 'published' });
    ensureDistTag(manifest, packageEntry.location);
  }

  writeFileSync(summaryFile, `${JSON.stringify(summary, null, 2)}\n`);
}

if (scopes.length > 0) {
  publishScopedPackages();
  process.exit(0);
}

for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'lerna',
      'publish',
      'from-package',
      '--yes',
      '--summary-file', summaryFile,
      ...(distTag ? ['--dist-tag', distTag] : []),
      ...scopes.flatMap((scope) => ['--scope', scope]),
    ],
    { stdio: 'inherit', env: { ...process.env } },
  );

  if (result.status === 0) {
    // Lerna does not create a summary file when there are no unpublished
    // versions. Keep the release contract deterministic for downstream
    // verification and artifact upload steps.
    if (!existsSync(summaryFile)) writeFileSync(summaryFile, '[]\n');
    process.exit(0);
  }

  const failure = result.signal === null
    ? `exit code ${String(result.status)}`
    : `signal ${result.signal}`;
  if (attempt === maxAttempts) {
    process.stderr.write(`Package publication failed after ${maxAttempts} attempts (${failure}).\n`);
    process.exit(result.status ?? 1);
  }

  process.stderr.write(
    `Package publication attempt ${attempt}/${maxAttempts} failed (${failure}); retrying in ${retryDelayMs / 1000}s.\n`,
  );
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelayMs);
}
