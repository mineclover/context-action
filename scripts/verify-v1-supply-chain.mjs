#!/usr/bin/env node

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const defaultOutput = 'reports/release/v1.0.0/security-report.json';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? fallback : fallback;
}

async function main() {
  const output = path.resolve(repositoryRoot, option('--output', defaultOutput));
  const failures = [];
  const checks = [];
  const check = (name, passed, detail) => {
    checks.push({ name, passed, detail });
    if (!passed) failures.push(`${name}: ${detail}`);
  };

  const [securityPolicy, lockfile, workflowEntries, packageEntries] = await Promise.all([
    readFile(path.join(repositoryRoot, 'SECURITY.md'), 'utf8').catch(() => ''),
    readFile(path.join(repositoryRoot, 'pnpm-lock.yaml'), 'utf8').catch(() => ''),
    readdir(path.join(repositoryRoot, '.github/workflows'), { withFileTypes: true }),
    readdir(path.join(repositoryRoot, 'packages'), { withFileTypes: true }),
  ]);
  check('security policy', /## Supported versions/u.test(securityPolicy) && /## Reporting a vulnerability/u.test(securityPolicy), 'SECURITY.md must define supported versions and private reporting');
  check('lockfile', lockfile.length > 0, 'pnpm-lock.yaml must be present');

  const workflows = await Promise.all(workflowEntries
    .filter(entry => entry.isFile() && /\.ya?ml$/u.test(entry.name))
    .map(async entry => ({
      name: entry.name,
      source: await readFile(path.join(repositoryRoot, '.github/workflows', entry.name), 'utf8'),
    })));
  const actionRefs = workflows.flatMap(({ name, source }) => [...source.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)@([^\s#]+)(?:\s|#|$)/gmu)]
    .map(([, action, reference]) => ({ workflow: name, action, reference })));
  const mutableActions = actionRefs.filter(({ action, reference }) => !action.startsWith('./') && !/^[a-f0-9]{40}$/u.test(reference));
  check('pinned GitHub Actions', mutableActions.length === 0, mutableActions.length === 0
    ? `${actionRefs.length} external action references use full commit SHAs`
    : mutableActions.map(({ workflow, action, reference }) => `${workflow}: ${action}@${reference}`).join(', '));

  const publishWorkflows = ['publish-packages.yml', 'publish-prerelease.yml']
    .map(name => ({ name, source: workflows.find(workflow => workflow.name === name)?.source ?? '' }));
  check(
    'npm provenance permission',
    publishWorkflows.every(workflow => /id-token:\s*write/u.test(workflow.source)),
    'all npm publish workflows must grant id-token: write for npm provenance',
  );

  const publicPackages = [];
  for (const entry of packageEntries.filter(item => item.isDirectory())) {
    const packageDirectory = path.join(repositoryRoot, 'packages', entry.name);
    const [manifestSource, license] = await Promise.all([
      readFile(path.join(packageDirectory, 'package.json'), 'utf8').catch(() => ''),
      readFile(path.join(packageDirectory, 'LICENSE'), 'utf8').catch(() => ''),
    ]);
    if (!manifestSource) continue;
    const manifest = JSON.parse(manifestSource);
    if (manifest.private === true) continue;
    publicPackages.push(manifest.name ?? entry.name);
    check(
      `license ${manifest.name ?? entry.name}`,
      ['Apache-2.0', 'MIT'].includes(manifest.license) && license.length > 0,
      'public package must declare an approved SPDX license and include LICENSE',
    );
  }

  const report = {
    schemaVersion: 'context-action-v1-security-report.v1',
    release: 'context-action-v1.0.0',
    generatedAt: new Date().toISOString(),
    status: failures.length === 0 ? 'passed' : 'failed',
    scope: {
      publicPackages: publicPackages.sort(),
      workflows: workflows.map(workflow => workflow.name).sort(),
      limits: [
        'This local verifier checks release configuration, not a registry provenance attestation.',
        'Run pnpm security:audit and verify the post-publish npm provenance record for certification.',
      ],
    },
    checks,
  };
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${report.status} supply-chain report to ${path.relative(repositoryRoot, output)}`);
  if (failures.length > 0) {
    for (const failure of failures) console.error(failure);
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
