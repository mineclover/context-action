#!/usr/bin/env node

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRepositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packageDefinitions = [
  {
    name: '@context-action/preact',
    directory: 'packages/preact',
    expectedVersion: '0.1.0',
    dependency: '@context-action/core',
  },
  {
    name: '@context-action/preact-ui',
    directory: 'packages/preact-ui',
    expectedVersion: '0.1.0',
    dependency: '@context-action/preact',
  },
];

const args = process.argv.slice(2);
const requireCurrentSource = args.includes('--require-current-source');
const rootIndex = args.indexOf('--root');
if (rootIndex !== -1 && (!args[rootIndex + 1] || args[rootIndex + 1].startsWith('--'))) {
  throw new Error('--root requires a directory path');
}
const repositoryRoot = rootIndex === -1
  ? defaultRepositoryRoot
  : path.resolve(args[rootIndex + 1] ?? '');
const planPath = path.join(repositoryRoot, 'releases', 'preact-public-2026-10.json');
const unknownArguments = args.filter((argument, index) => argument !== '--require-current-source'
  && argument !== '--root'
  && index !== rootIndex + 1);
if (unknownArguments.length > 0) {
  throw new Error('Usage: verify-preact-public-release.mjs [--require-current-source] [--root <directory>]');
}

function readJson(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), 'utf8').then(JSON.parse);
}

function expect(errors, condition, message) {
  if (!condition) errors.push(message);
}

function isStableVersion(value) {
  return typeof value === 'string' && /^\d+\.\d+\.\d+$/u.test(value);
}

async function validatePlan(errors) {
  let plan;
  try {
    plan = await readJson(path.relative(repositoryRoot, planPath));
  } catch (error) {
    errors.push(`public Preact release plan is missing or invalid: ${error.message}`);
    return null;
  }

  expect(errors, plan.schemaVersion === 'context-action-preact-public-release.v1',
    'public Preact release plan schemaVersion must be context-action-preact-public-release.v1');
  expect(errors, plan.status === 'approved-for-candidate',
    'public Preact release plan must be approved-for-candidate');
  expect(errors, plan.candidateDistTag === 'next' && plan.promotionDistTag === 'latest',
    'public Preact release plan must publish next and promote latest');
  expect(errors, plan.provenanceBinding === 'workflow-release-commit',
    'public Preact release plan must bind provenance to workflow-release-commit');

  const plannedNames = Object.keys(plan.packages ?? {});
  const expectedNames = packageDefinitions.map(definition => definition.name);
  expect(errors, JSON.stringify(plannedNames) === JSON.stringify(expectedNames),
    'public Preact release plan must contain exactly preact then preact-ui');
  for (const definition of packageDefinitions) {
    expect(errors, plan.packages?.[definition.name] === definition.expectedVersion,
      `${definition.name} must be ${definition.expectedVersion} in the public Preact release plan`);
  }

  const plannedDependencies = plan.dependencies ?? {};
  expect(errors, JSON.stringify(Object.keys(plannedDependencies).sort())
    === JSON.stringify(expectedNames.sort()),
  'public Preact release plan must define dependency floors for both packages');
  return plan;
}

async function main() {
  const errors = [];
  const manifests = new Map();
  for (const definition of packageDefinitions) {
    let manifest;
    try {
      manifest = await readJson(`${definition.directory}/package.json`);
    } catch (error) {
      errors.push(`${definition.name} manifest is missing or invalid: ${error.message}`);
      continue;
    }
    manifests.set(definition.name, manifest);
    expect(errors, manifest.name === definition.name,
      `${definition.directory}/package.json must declare ${definition.name}`);
    expect(errors, manifest.version === definition.expectedVersion,
      `${definition.name} must be ${definition.expectedVersion}`);
    expect(errors, manifest.private === false,
      `${definition.name} must explicitly set private=false for publication`);
    expect(errors, manifest.publishConfig?.access === 'public',
      `${definition.name} must set publishConfig.access=public`);
    expect(errors, manifest.repository?.type === 'git'
      && manifest.repository?.url === 'git+https://github.com/mineclover/context-action.git'
      && manifest.repository?.directory === definition.directory,
    `${definition.name} must bind repository metadata for npm provenance`);
    expect(errors, manifest.license === 'Apache-2.0',
      `${definition.name} must declare the Apache-2.0 license`);
    expect(errors, isStableVersion(manifest.version),
      `${definition.name} must use a stable semantic version`);
    for (const dependencyMap of [manifest.dependencies, manifest.optionalDependencies]) {
      for (const [dependencyName, range] of Object.entries(dependencyMap ?? {})) {
        expect(errors, typeof range === 'string' && !range.startsWith('workspace:'),
          `${definition.name} must not publish workspace dependency ${dependencyName}@${range}`);
      }
    }
    for (const requiredFile of ['README.md', 'LICENSE']) {
      try {
        await access(path.join(repositoryRoot, definition.directory, requiredFile));
      } catch {
        errors.push(`${definition.name} is missing ${requiredFile}`);
      }
    }
  }

  const core = await readJson('packages/core/package.json').catch(() => null);
  const preact = manifests.get('@context-action/preact');
  const preactUi = manifests.get('@context-action/preact-ui');
  if (preact && core) {
    expect(errors, preact.dependencies?.['@context-action/core'] === `^${core.version}`,
      `@context-action/preact must depend on @context-action/core@^${core.version}`);
  }
  if (preactUi) {
    expect(errors, preactUi.dependencies?.['@context-action/preact'] === '^0.1.0',
      '@context-action/preact-ui must depend on @context-action/preact@^0.1.0');
  }

  let plan = null;
  if (requireCurrentSource) plan = await validatePlan(errors);
  if (plan) {
    for (const definition of packageDefinitions) {
      const manifest = manifests.get(definition.name);
      const dependencyFloors = plan.dependencies?.[definition.name] ?? {};
      for (const [dependencyName, expectedRange] of Object.entries(dependencyFloors)) {
        expect(errors, manifest?.dependencies?.[dependencyName] === expectedRange,
          `${definition.name} dependency floor must be ${dependencyName}@${expectedRange}`);
      }
      const releaseDate = plan.changelogDates?.[definition.name];
      const changelog = await readFile(path.join(repositoryRoot, definition.directory, 'CHANGELOG.md'), 'utf8')
        .catch(() => '');
      expect(errors, typeof releaseDate === 'string' && releaseDate.length > 0,
        `${definition.name} must define a release date in the public Preact release plan`);
      expect(errors, changelog.includes(`## [${definition.expectedVersion}] (${releaseDate})`),
        `${definition.name} CHANGELOG.md must contain ${definition.expectedVersion} dated ${releaseDate}`);
    }
    const lerna = await readJson('lerna.json').catch(() => null);
    const packagePaths = packageDefinitions.map(definition => definition.directory);
    expect(errors, JSON.stringify(lerna?.packages?.filter(value => packagePaths.includes(value)))
      === JSON.stringify(packagePaths),
    'lerna.json must include the public Preact packages in publication order');
  }

  if (errors.length > 0) {
    console.error(`Public Preact release contract failed:\n${errors.map(error => `- ${error}`).join('\n')}`);
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({
    status: 'ok',
    release: plan?.release ?? 'preact-public-2026-10',
    packages: Object.fromEntries(packageDefinitions.map(definition => [definition.name, definition.expectedVersion])),
    currentSource: requireCurrentSource ? 'required' : 'not-required',
  }));
}

main().catch(error => {
  console.error(error.stack ?? error.message);
  process.exitCode = 1;
});
