#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireCurrentSource = process.argv.slice(2).filter(value => value !== '--').includes('--require-current-source');
const plan = JSON.parse(await readFile(path.join(root, 'releases/core-public-2026-10-patch-1.json'), 'utf8'));

const cohort = [
  { name: '@context-action/core', directory: 'packages/core', expectedVersion: '1.3.1' },
  { name: '@context-action/store-core', directory: 'packages/store-core', expectedVersion: '0.1.4' },
  { name: '@context-action/xstate', directory: 'packages/xstate', expectedVersion: '0.1.0' },
];

const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };
expect(plan.schemaVersion === 'context-action-core-public-release.v1', 'Core public release plan schemaVersion is invalid');
expect(plan.status === 'approved-for-candidate', 'Core public release plan must be approved-for-candidate');
expect(plan.candidateDistTag === 'next', 'Core public release plan must publish to next');
expect(plan.promotionDistTag === 'latest', 'Core public release plan must promote to latest');
expect(plan.promotionWorkflow === 'promote-core-public.yml', 'Core public release plan must bind the promotion workflow');
expect(plan.promotionConfirmation === 'PROMOTE_CORE_PUBLIC', 'Core public release plan must bind the promotion confirmation');
expect(plan.provenanceBinding === 'workflow-release-commit', 'Core public release plan must bind workflow release_commit');
expect(
  JSON.stringify(plan.publicationOrder) === JSON.stringify(cohort.map(item => item.name)),
  'Core publication order must list core, store-core, and xstate in dependency order',
);

for (const entry of cohort) {
  const manifest = JSON.parse(await readFile(path.join(root, entry.directory, 'package.json'), 'utf8'));
  const changelog = await readFile(path.join(root, entry.directory, 'CHANGELOG.md'), 'utf8');
  expect(plan.packages?.[entry.name] === entry.expectedVersion, `Core public release plan must contain ${entry.name}@${entry.expectedVersion}`);
  expect(manifest.name === entry.name, `${entry.directory}/package.json name mismatch`);
  expect(manifest.version === entry.expectedVersion, `${entry.name} manifest must be ${entry.expectedVersion}`);
  expect(manifest.private !== true, `${entry.name} must not be private`);
  expect(manifest.publishConfig?.access === 'public', `${entry.name} must publish with public access`);

  const requiredExports = Array.isArray(plan.requiredExports)
    ? (entry.name === '@context-action/core' ? plan.requiredExports : [])
    : (plan.requiredExports?.[entry.name] ?? []);
  for (const exportName of requiredExports) {
    expect(Object.hasOwn(manifest.exports ?? {}, exportName), `${entry.name} is missing required export ${exportName}`);
  }
  const releaseDate = plan.changelogDates?.[entry.name];
  expect(changelog.includes(`## [${entry.expectedVersion}] (${releaseDate})`), `${entry.name} CHANGELOG must contain the dated ${entry.expectedVersion} entry`);
}

if (requireCurrentSource) {
  const head = (await import('node:child_process')).execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (plan.releaseCommit !== 'pending-pr-merge') {
    if (plan.publication?.status === 'published') {
      try {
        (await import('node:child_process')).execFileSync(
          'git', ['merge-base', '--is-ancestor', plan.releaseCommit, head],
          { cwd: root, encoding: 'utf8' },
        );
      } catch {
        expect(false, 'Published Core release plan releaseCommit must be an ancestor of current source');
      }
    } else {
      expect(plan.releaseCommit === head, 'Core release plan releaseCommit must match current source');
    }
  }
}

if (errors.length > 0) {
  console.error(`Core public release contract failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: 'ok',
    release: plan.release,
    packages: plan.packages,
    currentSource: requireCurrentSource ? 'required' : 'not-required',
  }));
}
