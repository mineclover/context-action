#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'coordinated-stable-2026-10.json');
const packagePaths = {
  '@context-action/core': 'packages/core/package.json',
  '@context-action/store-core': 'packages/store-core/package.json',
  '@context-action/mutative-core': 'packages/mutative-core/package.json',
  '@context-action/mutative': 'packages/mutative/package.json',
  '@context-action/react': 'packages/react/package.json',
};
const changelogPaths = {
  '@context-action/core': 'packages/core/CHANGELOG.md',
  '@context-action/store-core': 'packages/store-core/CHANGELOG.md',
  '@context-action/mutative-core': 'packages/mutative-core/CHANGELOG.md',
  '@context-action/mutative': 'packages/mutative/CHANGELOG.md',
  '@context-action/react': 'packages/react/CHANGELOG.md',
};
const expectedCohort = Object.keys(packagePaths);
const upstreamLockPath = 'packages/mutative-core/upstream-lock.json';
const upstreamSyncPath = 'packages/mutative-core/upstream-sync.json';
const argumentsForCurrentSource = process.argv.slice(2);
const strictCurrentSourceFlag = '--require-current-source';

if (
  argumentsForCurrentSource.length > 1
  || argumentsForCurrentSource.some(argument => argument !== strictCurrentSourceFlag)
) {
  throw new Error(`Usage: ${path.basename(process.argv[1])} [${strictCurrentSourceFlag}]`);
}

const requireCurrentSource = argumentsForCurrentSource.length === 1;

function assertPlan(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Release plan must be a JSON object');
  if (value.schemaVersion !== 'context-action-coordinated-stable-plan.v2') throw new Error('Release plan schemaVersion is not supported');
  if (value.status !== 'approved-for-candidate') throw new Error('Release plan must be approved-for-candidate before publication');
  if (value.candidateDistTag !== 'next' || value.promotionDistTag !== 'latest') throw new Error('Release plan must use next candidate and latest promotion tags');
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value ?? '')) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString().slice(0, 10) === value;
}

const plan = JSON.parse(await readFile(planPath, 'utf8'));
assertPlan(plan);
const errors = [];
for (const [name, version] of Object.entries(plan.packages ?? {})) {
  const packagePath = packagePaths[name];
  const changelogPath = changelogPaths[name];
  const changelogDate = plan.changelogDates?.[name];
  if (!packagePath || !changelogPath || typeof version !== 'string') {
    errors.push(`Release plan has an unsupported package entry: ${name}`);
    continue;
  }
  if (typeof changelogDate !== 'string' || !isCalendarDate(changelogDate)) {
    errors.push(`${name} must have an ISO changelog date in the release plan`);
  }
  if (requireCurrentSource) {
    const [packageSource, changelog] = await Promise.all([
      readFile(path.join(repositoryRoot, packagePath), 'utf8'),
      readFile(path.join(repositoryRoot, changelogPath), 'utf8'),
    ]);
    const manifest = JSON.parse(packageSource);
    if (manifest.name !== name || manifest.version !== version) errors.push(`${name} must be ${version} in its package manifest`);
    if (typeof changelogDate === 'string'
      && isCalendarDate(changelogDate)
      && (!(/^# Change (?:Log|log)\n|^# Changelog\n/u.test(changelog))
        || !changelog.includes(`## [${version}] (${changelogDate})`)
        && !changelog.includes(`## ${version} (${changelogDate})`))) {
      errors.push(`${name} must have a dated ${version} changelog entry`);
    }
  }
}
if (requireCurrentSource) {
  const react = JSON.parse(await readFile(path.join(repositoryRoot, packagePaths['@context-action/react']), 'utf8'));
  const expectedReactFloors = {
    '@context-action/core': `^${plan.packages['@context-action/core']}`,
    '@context-action/mutative': `^${plan.packages['@context-action/mutative']}`,
    '@context-action/store-core': `^${plan.packages['@context-action/store-core']}`,
  };
  if (JSON.stringify(Object.keys(plan.reactDependencyFloors ?? {}).sort())
    !== JSON.stringify(Object.keys(expectedReactFloors).sort())) {
    errors.push('Release plan must define the exact React dependency floor keys for core and Mutative');
  }
  for (const [name, floor] of Object.entries(expectedReactFloors)) {
    if (plan.reactDependencyFloors?.[name] !== floor) errors.push(`Release plan floor must be ${name}@${floor}`);
    const actualFloor = name === '@context-action/store-core'
      ? react.peerDependencies?.[name]
      : react.dependencies?.[name];
    if (actualFloor !== floor) {
      errors.push(`React ${name === '@context-action/store-core' ? 'peer dependency' : 'dependency'} floor must be ${name}@${floor}`);
    }
  }
  const mutative = JSON.parse(await readFile(path.join(repositoryRoot, packagePaths['@context-action/mutative']), 'utf8'));
  const expectedMutativeCoreFloor = `^${plan.packages['@context-action/mutative-core']}`;
  if (mutative.dependencies?.['@context-action/mutative-core'] !== expectedMutativeCoreFloor) {
    errors.push(`Mutative adapter dependency floor must be @context-action/mutative-core@${expectedMutativeCoreFloor}`);
  }
  const [upstreamLock, upstreamSync] = await Promise.all([
    readFile(path.join(repositoryRoot, upstreamLockPath), 'utf8').then(JSON.parse),
    readFile(path.join(repositoryRoot, upstreamSyncPath), 'utf8').then(JSON.parse),
  ]);
  if (upstreamLock.upstream?.version !== '1.3.0'
    || upstreamSync.upstream?.version !== '1.3.0'
    || upstreamLock.upstream?.gitHead !== upstreamSync.upstream?.gitHead) {
    errors.push('Mutative release plan must bind both upstream lock and sync metadata to mutative@1.3.0 with one gitHead');
  }
  if (plan.provenanceBinding !== 'workflow-release-commit') errors.push('Release plan must bind provenance to workflow release_commit');
  if (react.exports?.['./tools']) {
    errors.push('React state-management release must not export the Durable-backed ./tools subpath');
  }
  if (react.dependencies?.['@context-action/tool-durable-operations']) {
    errors.push('React state-management release must not require Durable Operations at install time');
  }
}
if (JSON.stringify(Object.keys(plan.packages ?? {})) !== JSON.stringify(expectedCohort)) {
  errors.push('Release plan must define the exact coordinated package cohort in core, mutative-core, mutative, react order');
}
if (JSON.stringify(Object.keys(plan.changelogDates ?? {}).sort()) !== JSON.stringify(expectedCohort.slice().sort())) errors.push('Release plan must define changelog dates for the exact coordinated package cohort');
if (plan.provenanceBinding !== 'workflow-release-commit') {
  errors.push('Release plan must bind provenance to the workflow release_commit for the exact coordinated package cohort');
}

if (errors.length > 0) {
  console.error(`Coordinated stable release plan failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: 'ok',
    release: plan.release,
    packages: plan.packages,
    currentSource: requireCurrentSource ? 'required' : 'historical-plan',
  }));
}
