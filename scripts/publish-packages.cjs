#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const { dirname } = require('node:path');
const { existsSync, mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const summaryFile = process.argv[2] ?? path.join('reports', 'npm-publish-summary.json');
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
      '--summary-file',
      summaryFile,
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
