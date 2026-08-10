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

const [stableCandidate, generalPublish, maintenancePatch, manifestSource] = await Promise.all([
  readFile(path.join(workflowDirectory, 'publish-v1-stable-candidate.yml'), 'utf8'),
  readFile(path.join(workflowDirectory, 'publish-packages.yml'), 'utf8'),
  readFile(path.join(workflowDirectory, 'publish-maintenance-patch.yml'), 'utf8'),
  readFile(manifestPath, 'utf8'),
]);
const manifest = JSON.parse(manifestSource);
const packages = Object.entries(manifest.artifactCohort?.packages ?? {});
const stablePackageNames = (manifest.stableSurfaces ?? []).join(',');
const errors = [];

requireText(errors, stableCandidate, 'workflow_dispatch:', 'Stable candidate workflow must be manually dispatched');
requireText(errors, stableCandidate, 'release_commit:', 'Stable candidate workflow must require an explicit release_commit');
requireText(errors, stableCandidate, 'id-token: write', 'Stable candidate workflow must permit npm provenance through OIDC');
requireText(errors, stableCandidate, 'name: npm-stable', 'Stable candidate workflow must use the npm-stable environment');
requireText(errors, stableCandidate, 'test "$GITHUB_REF" = "refs/heads/main"', 'Stable candidate workflow must reject runs outside main');
requireText(errors, stableCandidate, 'pnpm verify:stable-publish-authorization -- --commit "$RELEASE_COMMIT"', 'Stable candidate workflow must verify publish authorization');
requireOrder(errors, stableCandidate, 'pnpm verify:stable-publish-authorization', 'pnpm publish:packages', 'Stable candidate authorization must occur before publication');
requireText(errors, stableCandidate, `STABLE_CANDIDATE_PACKAGES: '${stablePackageNames}'`, 'Stable candidate consumer cohort must match stable surfaces');

for (const [name, version] of packages) {
  if (name === '@context-action/webmcp') continue;
  requireText(errors, stableCandidate, `--scope ${name}`, `Stable candidate workflow must publish ${name}@${version}`);
}

for (const name of [
  '@context-action/typedoc-vitepress-sync',
  '@context-action/mutative-core',
  '@context-action/mutative',
  '@context-action/ai-sdk',
  '@context-action/tool-durable-operations',
  '@context-action/llms-generator',
]) {
  requireText(errors, generalPublish, `--scope ${name}`, `General publish workflow must use the approved regular-package allow-list entry ${name}`);
}
for (const [name] of packages) {
  if (generalPublish.includes(`--scope ${name}`)) errors.push(`General publish workflow must not scope into the v1 artifact cohort package ${name}`);
}

for (const required of [
  'workflow_dispatch:',
  'package:',
  'tool-protocol',
  'webmcp',
  'release_commit:',
  'name: npm-stable',
  'test "$CONFIRMATION" = publish-maintenance-patch',
  'node scripts/verify-tool-protocol-changelog.mjs --package "$PACKAGE_DIRECTORY"',
  'PATCH_CONSUMER_CLOSURE:',
  'verify:published-tool-consumers -- --tag latest --packages "$PATCH_CONSUMER_CLOSURE"',
  'capture:published-release -- --tag latest --packages "$PACKAGE_NAME"',
]) {
  requireText(errors, maintenancePatch, required, `Maintenance patch workflow must include ${required}`);
}
requireOrder(errors, maintenancePatch, 'Verify source and packed changelog', 'Publish the new patch to latest', 'Maintenance changelog validation must occur before publication');
requireOrder(errors, maintenancePatch, 'Build and test the patch package', 'Publish the new patch to latest', 'Maintenance package validation must occur before publication');
requireOrder(errors, maintenancePatch, 'Publish the new patch to latest', 'Verify reverse dependency closure and capture evidence', 'Maintenance consumer closure must run after publication');

if (errors.length > 0) {
  console.error(`v1 release workflow contract failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'ok', workflows: ['publish-v1-stable-candidate.yml', 'publish-maintenance-patch.yml'], cohort: packages.map(([name]) => name) }));
}
