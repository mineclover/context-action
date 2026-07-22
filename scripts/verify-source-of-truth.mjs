#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'source-of-truth.json');

const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const manifest = await readJson(manifestPath);

const expectedSemContract = {
  evidenceProvider: '@ataraxy-labs/sem',
  primaryPackage: '@context-action/sem-doc',
  foundationPackages: [
    '@context-action/sem-foundation-contracts',
    '@context-action/sem-foundation-repository',
  ],
  ssotArtifact: 'revision-bound-serialized-symbol-context',
  artifactSchemas: [
    'context-action/symbol-snapshot@1.1',
    'context-action/symbol-snapshot-diff@1.0',
    'sem-doc-work-context.v5',
    'sem-doc-context-scope.v3',
    'sem-doc-context-scope-history.v2',
    'sem-doc-context-scope-history-stream.v1',
    'sem-doc-context-scope-diff.v1',
    'sem-doc-context-scope-branch-compare.v1',
  ],
  nonGoals: [
    'runtime-call-graph',
    'lsp-exact-reference-locations',
    'architecture-policy-ownership',
  ],
};
const expectedCutoverRule =
  'Consumer uses published tooling packages; no Foundation or sem-doc migration copies remain in the consumer workspace.';

if (JSON.stringify(manifest.semContract) !== JSON.stringify(expectedSemContract)) {
  throw new Error('The consumer manifest must declare the canonical SEM contract and non-goals.');
}

if (manifest.schemaVersion !== 'source-of-truth-manifest.v1') {
  throw new Error('Unsupported source-of-truth manifest schema.');
}
if (manifest.repository?.role !== 'consumer') {
  throw new Error('context-action must declare itself as the consumer repository.');
}
const toolingLifecycleState = `${manifest.toolingRepository?.phase}:${manifest.toolingRepository?.remoteStatus}`;
if (!['local-scaffold:not-configured', 'pre-release:configured', 'published:configured'].includes(toolingLifecycleState)) {
  throw new Error(
    'The consumer manifest must use a supported tooling lifecycle and remote state before migration cutover.',
  );
}
if (typeof manifest.publishedArtifactNote !== 'string' || manifest.publishedArtifactNote.length === 0) {
  throw new Error('The consumer manifest must document the published tooling artifact state.');
}
if (manifest.cutoverRule !== expectedCutoverRule) {
  throw new Error('The consumer manifest must declare the completed published-package cutover.');
}

const expectedPublished = new Map([
  ['@context-action/sem-foundation-contracts', '0.1.1'],
  ['@context-action/sem-foundation-repository', '0.1.1'],
  ['@context-action/sem-doc', '0.2.0'],
]);
const listedPublished = new Map(
  (manifest.publishedPackages ?? []).map((entry) => [entry.name, entry.version]),
);
if (manifest.canonicalPackages?.length || manifest.migrationCopyExceptions?.length) {
  throw new Error('Consumer source-of-truth must not retain migration-copy package entries after cutover.');
}
if (listedPublished.size !== expectedPublished.size
  || [...listedPublished.keys()].some((name) => !expectedPublished.has(name))) {
  throw new Error('Consumer published package manifest must contain exactly the three tooling packages.');
}
for (const [name, version] of expectedPublished) {
  if (listedPublished.get(name) !== version) {
    throw new Error(`Published package version mismatch for ${name}.`);
  }
}
for (const relativePath of [
  'packages/sem-foundation/package.json',
  'packages/sem-foundation/src',
  'packages/sem-foundation-repository/package.json',
  'packages/sem-foundation-repository/src',
  'packages/sem-doc/package.json',
  'packages/sem-doc/src',
]) {
  if (existsSync(path.join(root, relativePath))) {
    throw new Error(`${relativePath} must be removed after the published tooling cutover.`);
  }
}

const expectedConsumerOwned = new Set([
  '@context-action/architecture-governance',
  '@context-action/typedoc-vitepress-sync',
  '@context-action/llms-generator',
]);
const actualConsumerOwned = new Set(manifest.consumerOwnedPackages ?? []);
for (const name of expectedConsumerOwned) {
  if (!actualConsumerOwned.has(name)) {
    throw new Error(`Consumer-owned package is missing from the manifest: ${name}.`);
  }
}
const packageJson = async (relativePath) => readJson(path.join(root, relativePath, 'package.json'));
const architecturePackage = await packageJson('packages/architecture-governance');
const architectureDependencies = {
  ...(architecturePackage.dependencies ?? {}),
  ...(architecturePackage.optionalDependencies ?? {}),
  ...(architecturePackage.peerDependencies ?? {}),
};
if (architectureDependencies['@context-action/sem-doc']) {
  throw new Error('Architecture Governance must not depend on sem-doc report contracts.');
}
for (const dependency of [
  '@context-action/sem-foundation-contracts',
  '@context-action/sem-foundation-repository',
]) {
  const expectedVersion = expectedPublished.get(dependency);
  if (architectureDependencies[dependency] !== `^${expectedVersion}`) {
    throw new Error(`Architecture Governance must use ${dependency}@^${expectedVersion}.`);
  }
}

console.log(
  `Source-of-truth verified: ${expectedPublished.size} published tooling packages, ${expectedConsumerOwned.size} consumer-owned packages.`,
);
