#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const planPath = path.join(repositoryRoot, 'releases', 'coordinated-stable-2026-08.json');
const packagePaths = {
  '@context-action/core': 'packages/core/package.json',
  '@context-action/react': 'packages/react/package.json',
};
const changelogPaths = {
  '@context-action/core': 'packages/core/CHANGELOG.md',
  '@context-action/react': 'packages/react/CHANGELOG.md',
};

function assertPlan(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Release plan must be a JSON object');
  if (value.schemaVersion !== 'context-action-coordinated-stable-plan.v1') throw new Error('Release plan schemaVersion is not supported');
  if (value.status !== 'approved-for-candidate') throw new Error('Release plan must be approved-for-candidate before publication');
  if (value.candidateDistTag !== 'next' || value.promotionDistTag !== 'latest') throw new Error('Release plan must use next candidate and latest promotion tags');
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
  const [packageSource, changelog] = await Promise.all([
    readFile(path.join(repositoryRoot, packagePath), 'utf8'),
    readFile(path.join(repositoryRoot, changelogPath), 'utf8'),
  ]);
  const manifest = JSON.parse(packageSource);
  if (manifest.name !== name || manifest.version !== version) errors.push(`${name} must be ${version} in its package manifest`);
  if (typeof changelogDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/u.test(changelogDate)) {
    errors.push(`${name} must have an ISO changelog date in the release plan`);
  } else if (!changelog.startsWith(`# Change Log\n`) || !changelog.includes(`## [${version}] (${changelogDate})`)) {
    errors.push(`${name} must have a dated ${version} changelog entry`);
  }
}
const react = JSON.parse(await readFile(path.join(repositoryRoot, packagePaths['@context-action/react']), 'utf8'));
for (const [name, floor] of Object.entries(plan.reactDependencyFloors ?? {})) {
  if (react.dependencies?.[name] !== floor) errors.push(`React dependency floor must be ${name}@${floor}`);
}
if (react.exports?.['./tools']) {
  errors.push('React state-management release must not export the Durable-backed ./tools subpath');
}
if (react.dependencies?.['@context-action/tool-durable-operations']) {
  errors.push('React state-management release must not require Durable Operations at install time');
}
if (Object.keys(plan.packages ?? {}).length !== Object.keys(packagePaths).length) errors.push('Release plan must define the exact coordinated package cohort');
if (Object.keys(plan.changelogDates ?? {}).length !== Object.keys(packagePaths).length) errors.push('Release plan must define changelog dates for the exact coordinated package cohort');

if (errors.length > 0) {
  console.error(`Coordinated stable release plan failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ status: 'ok', release: plan.release, packages: plan.packages }));
}
