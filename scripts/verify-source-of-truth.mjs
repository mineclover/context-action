#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
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

if (JSON.stringify(manifest.semContract) !== JSON.stringify(expectedSemContract)) {
  throw new Error('The consumer manifest must declare the canonical SEM contract and non-goals.');
}

if (manifest.schemaVersion !== 'source-of-truth-manifest.v1') {
  throw new Error('Unsupported source-of-truth manifest schema.');
}
if (manifest.repository?.role !== 'consumer') {
  throw new Error('context-action must declare itself as the consumer repository.');
}
if (manifest.toolingRepository?.phase !== 'local-scaffold') {
  throw new Error(
    'The consumer manifest must remain local-scaffold until the tooling repository remote and artifact cutover are complete.',
  );
}
if (manifest.toolingRepository?.remoteStatus !== 'not-configured') {
  throw new Error('The consumer manifest must record the tooling repository remote as not-configured.');
}
if (typeof manifest.publishedArtifactNote !== 'string' || manifest.publishedArtifactNote.length === 0) {
  throw new Error('The consumer manifest must document the legacy published-artifact metadata state.');
}
if (!Array.isArray(manifest.migrationCopyExceptions)
  || !manifest.migrationCopyExceptions.includes('README.md')
  || !manifest.migrationCopyExceptions.includes('package.json')) {
  throw new Error('The consumer manifest must declare README.md and package.json as migration-copy exceptions.');
}

const expectedCanonical = new Map([
  ['@context-action/sem-foundation-contracts', 'packages/sem-foundation'],
  ['@context-action/sem-foundation-repository', 'packages/sem-foundation-repository'],
  ['@context-action/sem-doc', 'packages/sem-doc'],
]);

const lerna = await readJson(path.join(root, 'lerna.json'));
for (const relativePath of expectedCanonical.values()) {
  if ((lerna.packages ?? []).includes(relativePath)) {
    throw new Error(`${relativePath} must stay outside the consumer Lerna publish/build package list.`);
  }
}

const listedCanonical = new Map(
  (manifest.canonicalPackages ?? []).map((entry) => [entry.name, entry]),
);
for (const [name, relativePath] of expectedCanonical) {
  const entry = listedCanonical.get(name);
  if (!entry || entry.path !== relativePath || entry.owner !== manifest.toolingRepository.name) {
    throw new Error(`Canonical package manifest mismatch for ${name}.`);
  }
  if (entry.status !== 'migration-copy') {
    throw new Error(`${name} must be marked as a migration-copy in the consumer repository.`);
  }

  const packagePath = path.join(root, relativePath, 'package.json');
  const packageJson = await readJson(packagePath);
  if (packageJson.name !== name) {
    throw new Error(`${relativePath}/package.json must publish as ${name}.`);
  }
  if (packageJson.private !== true) {
    throw new Error(`${relativePath}/package.json must remain private while it is a migration copy.`);
  }
  const repositoryUrl = packageJson.repository?.url ?? '';
  if (!repositoryUrl.includes('/mineclover/context-action.git')) {
    throw new Error(
      `${relativePath}/package.json must identify the current consumer repository during migration.`,
    );
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
for (const entry of manifest.canonicalPackages ?? []) {
  if (expectedConsumerOwned.has(entry.name)) {
    throw new Error(`${entry.name} cannot be both canonical tooling and consumer-owned.`);
  }
}

const packageJson = async (relativePath) => readJson(path.join(root, relativePath, 'package.json'));
const architecturePackage = await packageJson('packages/architecture-governance');
const semDocPackage = await packageJson('packages/sem-doc');
const architectureDependencies = {
  ...(architecturePackage.dependencies ?? {}),
  ...(architecturePackage.optionalDependencies ?? {}),
  ...(architecturePackage.peerDependencies ?? {}),
};
const semDocDependencies = {
  ...(semDocPackage.dependencies ?? {}),
  ...(semDocPackage.optionalDependencies ?? {}),
  ...(semDocPackage.peerDependencies ?? {}),
};
if (architectureDependencies['@context-action/sem-doc']) {
  throw new Error('Architecture Governance must not depend on sem-doc report contracts.');
}
if (semDocDependencies['@context-action/architecture-governance']) {
  throw new Error('sem-doc must not depend on Architecture Governance report contracts.');
}
for (const dependency of [
  '@context-action/sem-foundation-contracts',
  '@context-action/sem-foundation-repository',
]) {
  if (String(architectureDependencies[dependency] ?? '').startsWith('workspace:')) {
    throw new Error(`Architecture Governance must use a versioned ${dependency} dependency for cutover readiness.`);
  }
}

console.log(
  `Source-of-truth verified: ${expectedCanonical.size} migration copies, ${expectedConsumerOwned.size} consumer-owned packages.`,
);
