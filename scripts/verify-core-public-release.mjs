#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const requireCurrentSource = process.argv.slice(2).filter(value => value !== '--').includes('--require-current-source');
const plan = JSON.parse(await readFile(path.join(root, 'releases/core-public-2026-10-patch-1.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(root, 'packages/core/package.json'), 'utf8'));
const changelog = await readFile(path.join(root, 'packages/core/CHANGELOG.md'), 'utf8');

const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };
expect(plan.schemaVersion === 'context-action-core-public-release.v1', 'Core public release plan schemaVersion is invalid');
expect(plan.status === 'approved-for-candidate', 'Core public release plan must be approved-for-candidate');
expect(plan.candidateDistTag === 'next', 'Core public release plan must publish to next');
expect(plan.promotionDistTag === 'latest', 'Core public release plan must promote to latest');
expect(plan.promotionWorkflow === 'promote-core-public.yml', 'Core public release plan must bind the promotion workflow');
expect(plan.promotionConfirmation === 'PROMOTE_CORE_PUBLIC', 'Core public release plan must bind the promotion confirmation');
expect(plan.provenanceBinding === 'workflow-release-commit', 'Core public release plan must bind workflow release_commit');
expect(plan.packages?.['@context-action/core'] === '1.3.0', 'Core public release plan must contain Core 1.3.0');
expect(JSON.stringify(plan.publicationOrder) === JSON.stringify(['@context-action/core']), 'Core publication order must contain only Core');
expect(manifest.name === '@context-action/core', 'Core manifest identity is invalid');
expect(manifest.version === '1.3.0', 'Core manifest must be 1.3.0');
expect(manifest.private !== true, 'Core must not be private');
expect(manifest.publishConfig?.access === 'public', 'Core must publish with public access');
for (const exportName of plan.requiredExports ?? []) {
  expect(Object.hasOwn(manifest.exports ?? {}, exportName), `Core is missing required export ${exportName}`);
}
const releaseDate = plan.changelogDates?.['@context-action/core'];
expect(changelog.includes(`## [1.3.0] (${releaseDate})`), 'Core CHANGELOG must contain the dated 1.3.0 entry');

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
  console.log(JSON.stringify({ status: 'ok', release: plan.release, package: '@context-action/core', version: manifest.version, currentSource: requireCurrentSource ? 'required' : 'not-required' }));
}
