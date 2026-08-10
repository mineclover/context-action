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

const [stableCandidate, generalPublish, maintenancePatch, manifestSource, packageSource, publishHelper] = await Promise.all([
  readFile(path.join(workflowDirectory, 'publish-v1-stable-candidate.yml'), 'utf8'),
  readFile(path.join(workflowDirectory, 'publish-packages.yml'), 'utf8'),
  readFile(path.join(workflowDirectory, 'publish-maintenance-patch.yml'), 'utf8'),
  readFile(manifestPath, 'utf8'),
  readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
  readFile(path.join(repositoryRoot, 'scripts', 'publish-packages.cjs'), 'utf8'),
]);
const manifest = JSON.parse(manifestSource);
const rootPackage = JSON.parse(packageSource);
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
if (rootPackage.scripts?.release !== 'node scripts/refuse-direct-release.mjs'
  || rootPackage.scripts?.['release:patch'] !== 'node scripts/refuse-direct-release.mjs') {
  errors.push('Root release scripts must refuse direct npm publication');
}
requireText(errors, publishHelper, "process.env.GITHUB_ACTIONS !== 'true'", 'Publish helper must reject direct local publication');
if (maintenancePatch.includes('local_consumers=') || maintenancePatch.includes('PATCH_LOCAL_CONSUMERS') || maintenancePatch.includes('--local-package')) {
  errors.push('Maintenance candidate matrix must consume only published registry artifacts');
}

for (const required of [
  'workflow_dispatch:',
  'package:',
  'core',
  'react',
  'ai-sdk',
  'tool-protocol',
  'webmcp',
  'release_commit:',
  'name: npm-stable',
  'test "$CONFIRMATION" = publish-maintenance-patch',
  'node scripts/verify-tool-protocol-changelog.mjs --package "$PACKAGE_DIRECTORY" --forbid-unreleased',
  'PATCH_CONSUMER_CLOSURE=$consumer_closure',
  'PATCH_BUILD_CLOSURE=',
  'verify-maintenance-patch-version.mjs',
  '--allow-initial',
  'Resume an existing verified candidate when safe',
  'PUBLISH_REQUIRED=false',
  'dist-tags.maintenance',
  'dist.integrity',
  'Verify local tarball reverse dependency closure',
  '--dist-tag maintenance',
  '--package-tag "$PACKAGE_NAME=maintenance"',
  'Verify published AI SDK Tool Protocol deduplication',
  'verify-ai-sdk-tool-protocol-contract.mjs --published --version "$PACKAGE_VERSION"',
  'verify-maintenance-patch-provenance.mjs',
  'Record previous latest tag',
  'LATEST_ALREADY_PROMOTED=true',
  'Promote verified candidate to latest',
  'verify:published-tool-consumers -- --tag latest --packages "$PATCH_CONSUMER_CLOSURE"',
  'capture:published-release -- --tag latest --packages "$PACKAGE_NAME"',
  'Roll back latest after post-promotion failure',
]) {
  requireText(errors, maintenancePatch, required, `Maintenance patch workflow must include ${required}`);
}
requireOrder(errors, maintenancePatch, 'Verify source and packed changelog', 'Publish the new patch candidate', 'Maintenance changelog validation must occur before candidate publication');
requireOrder(errors, maintenancePatch, 'Build and test the maintenance closure', 'Publish the new patch candidate', 'Maintenance package validation must occur before candidate publication');
requireOrder(errors, maintenancePatch, 'Verify local tarball reverse dependency closure', 'Publish the new patch candidate', 'Maintenance local consumer closure must run before candidate publication');
requireOrder(errors, maintenancePatch, 'Resume an existing verified candidate when safe', 'Publish the new patch candidate', 'Maintenance candidate resume decision must occur before publication');
requireOrder(errors, maintenancePatch, 'Resume an existing verified candidate when safe', 'Verify patch-only semantic version increment', 'Maintenance candidate resume decision must precede patch version validation');
requireOrder(errors, maintenancePatch, 'Verify published candidate reverse dependency closure', 'Promote verified candidate to latest', 'Candidate consumer closure must pass before latest mutation');
requireOrder(errors, maintenancePatch, 'Verify published candidate changelog and provenance', 'Promote verified candidate to latest', 'Candidate provenance must pass before latest mutation');
requireOrder(errors, maintenancePatch, 'Record previous latest tag', 'Promote verified candidate to latest', 'Maintenance workflow must record the rollback target before latest mutation');
requireOrder(errors, maintenancePatch, 'Promote verified candidate to latest', 'Verify latest closure and capture evidence', 'Latest consumer closure must run after promotion');

if (errors.length > 0) {
  console.error(`v1 release workflow contract failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'ok', workflows: ['publish-v1-stable-candidate.yml', 'publish-maintenance-patch.yml'], cohort: packages.map(([name]) => name) }));
}
