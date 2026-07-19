#!/usr/bin/env node
'use strict';

const { execFileSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const summaryPath = path.resolve('reports/npm-publish-summary.json');
const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const packageName = '@context-action/sem-doc';

async function main() {
  const published = summary.find((entry) => entry.packageName === packageName);
  const version = published?.version ?? (await readPublishedVersion(packageName));
  const packageSpec = `${packageName}@${version}`;
  const consumerRoot = mkdtempSync(path.join(os.tmpdir(), 'context-action-sem-doc-consumer-'));

  try {
    await waitForPublishedVersion(packageSpec);
    writeFileSync(
      path.join(consumerRoot, 'package.json'),
      JSON.stringify({ name: 'sem-doc-consumer-smoke', private: true }, null, 2),
    );

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
    const semVersion = execFileSync(process.execPath, [cliPath, 'version'], {
      cwd: consumerRoot,
      encoding: 'utf8',
      env: { ...process.env },
    }).trim();
    if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(semVersion)) {
      throw new Error(`sem-doc consumer smoke test returned an invalid sem version: ${semVersion}`);
    }
    process.stdout.write(`Published sem-doc consumer smoke test passed: ${packageSpec}; sem ${semVersion}\n`);
  } finally {
    rmSync(consumerRoot, { recursive: true, force: true });
  }
}

async function readPublishedVersion(name) {
  const output = execFileSync(
    'npm',
    ['view', name, 'version', '--registry=https://registry.npmjs.org'],
    { encoding: 'utf8', env: { ...process.env, npm_config_loglevel: 'error' } },
  ).trim();
  if (!/^\d+\.\d+\.\d+(?:[-+][A-Za-z0-9.-]+)?$/u.test(output)) {
    throw new Error(`npm returned an invalid published version for ${name}: ${output}`);
  }
  return output;
}

async function waitForPublishedVersion(packageSpec) {
  const attempts = 30;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await readPublishedVersion(packageSpec);
      if (attempt > 1) process.stdout.write(`npm metadata became visible after ${attempt} attempts.\n`);
      return;
    } catch (error) {
      if (attempt === attempts) throw error;
      process.stdout.write(`Waiting for npm metadata (${attempt}/${attempts - 1})...\n`);
      await new Promise((resolve) => setTimeout(resolve, 10_000));
    }
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
