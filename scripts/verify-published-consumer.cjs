#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const summaryPath = path.resolve('reports/npm-publish-summary.json');
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const semDoc = summary.find((entry) => entry.packageName === '@context-action/sem-doc');

if (semDoc === undefined) {
  process.stdout.write('No sem-doc package was published in this run; consumer smoke test skipped.\n');
  process.exit(0);
}

const consumerRoot = mkdtempSync(path.join(os.tmpdir(), 'context-action-sem-doc-consumer-'));
try {
  writeFileSync(
    path.join(consumerRoot, 'package.json'),
    JSON.stringify({ name: 'sem-doc-consumer-smoke', private: true }, null, 2),
  );

  const packageSpec = `${semDoc.packageName}@${semDoc.version}`;
  execFileSync(
    'npm',
    [
      'install',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      '--registry=https://registry.npmjs.org',
      packageSpec,
    ],
    {
      cwd: consumerRoot,
      stdio: 'inherit',
      env: { ...process.env },
    },
  );

  const cliPath = path.join(consumerRoot, 'node_modules', '@context-action', 'sem-doc', 'dist', 'cli.js');
  const version = execFileSync(process.execPath, [cliPath, 'version'], {
    cwd: consumerRoot,
    encoding: 'utf8',
    env: { ...process.env },
  }).trim();
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(version)) {
    throw new Error(`sem-doc consumer smoke test returned an invalid sem version: ${version}`);
  }
  process.stdout.write(`Published sem-doc consumer smoke test passed: ${packageSpec}; sem ${version}\n`);
} finally {
  rmSync(consumerRoot, { recursive: true, force: true });
}
