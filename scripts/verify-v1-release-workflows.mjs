#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const workflowDirectory = path.join(repositoryRoot, '.github', 'workflows');
const manifestPath = path.join(repositoryRoot, 'docs', 'releases', 'v1.0.0', 'release-manifest.json');

function requireText(errors, source, text, description) {
  if (!source.includes(text)) errors.push(description);
}

function requireOrder(errors, source, before, after, description) {
  const beforeIndex = source.indexOf(before);
  const afterIndex = source.indexOf(after);
  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex >= afterIndex) errors.push(description);
}

async function main() {
  const [stableCandidate, promotion, manifestSource] = await Promise.all([
    readFile(path.join(workflowDirectory, 'publish-v1-stable-candidate.yml'), 'utf8'),
    readFile(path.join(workflowDirectory, 'promote-v1-to-latest.yml'), 'utf8'),
    readFile(manifestPath, 'utf8'),
  ]);
  const manifest = JSON.parse(manifestSource);
  const packages = Object.entries(manifest.packages ?? {});
  const packageNames = packages.map(([name]) => name).join(',');
  const errors = [];

  for (const [name, source] of [
    ['stable candidate', stableCandidate],
    ['latest promotion', promotion],
  ]) {
    requireText(errors, source, 'workflow_dispatch:', `${name} workflow must be manually dispatched`);
    requireText(errors, source, 'release_commit:', `${name} workflow must require an explicit release_commit`);
    requireText(errors, source, 'id-token: write', `${name} workflow must permit npm provenance through OIDC`);
    requireText(errors, source, 'name: npm-stable', `${name} workflow must use the npm-stable environment`);
    requireText(errors, source, 'test "$GITHUB_REF" = "refs/heads/main"', `${name} workflow must reject runs outside main`);
    requireText(errors, source, 'RELEASE_COMMIT: ${{ inputs.release_commit }}', `${name} workflow must pass the requested release commit through a shell-safe environment variable`);
    requireText(errors, source, '[[ "$RELEASE_COMMIT" =~ ^[0-9a-f]{40}$ ]]', `${name} workflow must require a full immutable commit SHA`);
    requireText(errors, source, 'git merge-base --is-ancestor "$RELEASE_COMMIT" origin/main', `${name} workflow must require a main-ancestry artifact source`);
  }

  requireText(errors, stableCandidate, 'ref: ${{ inputs.release_commit }}', 'Stable candidate workflow must checkout the requested immutable artifact source');
  requireText(errors, stableCandidate, 'test "$(git rev-parse HEAD)" = "$RELEASE_COMMIT"', 'Stable candidate workflow must bind checkout to the requested artifact source');
  requireText(errors, stableCandidate, 'pnpm verify:stable-publish-authorization -- --commit "$RELEASE_COMMIT"', 'Stable candidate workflow must verify publish authorization for the requested artifact source');
  requireOrder(errors, stableCandidate, 'pnpm verify:stable-publish-authorization', 'pnpm publish:packages', 'Stable candidate authorization must occur before publication');
  requireText(errors, stableCandidate, '--dist-tag next', 'Stable candidate workflow must publish only to next');
  requireText(errors, stableCandidate, 'verify:published-tool-consumers -- --tag next', 'Stable candidate workflow must rerun the next-tag consumer matrix');

  requireText(errors, promotion, 'ref: ${{ github.sha }}', 'Promotion workflow must checkout the current governance commit, not the historic artifact source');
  requireText(errors, promotion, 'test "$(git rev-parse HEAD)" = "$GITHUB_SHA"', 'Promotion workflow must bind checkout to its governance SHA');
  requireText(errors, promotion, '--governance-commit "$GITHUB_SHA"', 'Promotion authorization must receive the checked-out governance SHA');
  requireText(errors, promotion, 'pnpm verify:v1-published-provenance', 'Promotion workflow must independently reverify registry provenance');
  requireOrder(errors, promotion, 'pnpm verify:v1-published-provenance', 'pnpm verify:v1-promotion-authorization', 'Promotion must verify provenance before authorization');
  requireOrder(errors, promotion, 'pnpm verify:v1-promotion-authorization', 'npm dist-tag add "${packages[$index]}" latest', 'Promotion authorization must occur before any latest dist-tag mutation');
  requireText(errors, promotion, 'verify:published-tool-consumers -- --tag latest', 'Promotion workflow must rerun the latest-tag consumer matrix');
  requireOrder(errors, promotion, 'trap rollback EXIT', 'verify:published-tool-consumers -- --tag latest', 'Promotion must preserve rollback until the latest consumer matrix passes');
  requireOrder(errors, promotion, 'verify:published-tool-consumers -- --tag latest', 'trap - EXIT', 'Promotion may clear rollback only after the latest consumer matrix passes');

  const expectedOrder = [
    '@context-action/tool-protocol',
    '@context-action/core',
    '@context-action/webmcp',
    '@context-action/react',
  ];
  const actualOrder = packages.map(([name]) => name);
  if (JSON.stringify(actualOrder) !== JSON.stringify(['@context-action/core', '@context-action/react', '@context-action/tool-protocol', '@context-action/webmcp'])) {
    errors.push('Release manifest package cohort must retain its expected four-package membership');
  }
  for (const name of expectedOrder) {
    const version = manifest.packages?.[name];
    if (typeof version !== 'string') {
      errors.push(`Release manifest is missing ${name}`);
      continue;
    }
    requireText(errors, stableCandidate, `--scope ${name}`, `Stable candidate workflow must publish ${name}@${version}`);
    requireText(errors, promotion, `'${name}@${version}'`, `Promotion workflow must target ${name}@${version}`);
  }
  requireText(errors, stableCandidate, `STABLE_CANDIDATE_PACKAGES: '${packageNames}'`, 'Stable candidate consumer cohort must match the manifest package cohort');
  requireText(errors, promotion, `STABLE_CANDIDATE_PACKAGES: '${packageNames}'`, 'Promotion consumer cohort must match the manifest package cohort');

  if (errors.length > 0) {
    console.error(`v1 release workflow contract failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify({
    status: 'ok',
    workflows: ['publish-v1-stable-candidate.yml', 'promote-v1-to-latest.yml'],
    cohort: expectedOrder,
  }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
