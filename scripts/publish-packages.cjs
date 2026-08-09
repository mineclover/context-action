#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const { dirname } = require('node:path');
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

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
