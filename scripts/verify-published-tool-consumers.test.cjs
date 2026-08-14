#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { parse } = require('yaml');
const {
  runContextActionDependencyResolutionSmoke,
} = require('./verify-published-tool-consumers.cjs');

const repositoryRoot = path.resolve(__dirname, '..');
const candidateVersions = {
  '@context-action/core': '1.1.0-rc.1',
  '@context-action/react': '2.0.0-rc.1',
  '@context-action/tool-durable-operations': '0.2.0-rc.1',
  '@context-action/tool-protocol': '1.0.2-rc.1',
  '@context-action/webmcp': '0.2.0-rc.1',
};
const candidateNames = Object.keys(candidateVersions);

function packageDirectory(root, packageName) {
  return path.join(root, 'node_modules', ...packageName.split('/'));
}

function writePackage(root, packageName, version, dependencies = {}, parentDirectory = root) {
  const directory = path.join(parentDirectory, 'node_modules', ...packageName.split('/'));
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
    name: packageName,
    version,
    main: 'index.cjs',
    dependencies,
  }));
  writeFileSync(path.join(directory, 'index.cjs'), 'module.exports = {};\n');
  return directory;
}

function createCoherentFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'context-action-cohort-test-'));
  writePackage(root, '@context-action/core', candidateVersions['@context-action/core']);
  writePackage(
    root,
    '@context-action/tool-durable-operations',
    candidateVersions['@context-action/tool-durable-operations'],
  );
  writePackage(root, '@context-action/tool-protocol', candidateVersions['@context-action/tool-protocol']);
  writePackage(
    root,
    '@context-action/webmcp',
    candidateVersions['@context-action/webmcp'],
    { '@context-action/tool-protocol': candidateVersions['@context-action/tool-protocol'] },
  );
  writePackage(
    root,
    '@context-action/react',
    candidateVersions['@context-action/react'],
    {
      '@context-action/core': candidateVersions['@context-action/core'],
      '@context-action/tool-durable-operations': candidateVersions['@context-action/tool-durable-operations'],
      '@context-action/tool-protocol': candidateVersions['@context-action/tool-protocol'],
      '@context-action/webmcp': candidateVersions['@context-action/webmcp'],
    },
  );
  return root;
}

const selectedPackages = candidateNames.map(name => ({ name }));

test('accepts one coherent packed prerelease dependency graph', () => {
  const root = createCoherentFixture();
  try {
    assert.doesNotThrow(() => {
      runContextActionDependencyResolutionSmoke(root, selectedPackages);
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

for (const dependencyName of [
  '@context-action/core',
  '@context-action/tool-durable-operations',
  '@context-action/tool-protocol',
  '@context-action/webmcp',
]) {
  test(`rejects a nested non-candidate ${dependencyName} resolved from React`, () => {
    const root = createCoherentFixture();
    try {
      const reactDirectory = packageDirectory(root, '@context-action/react');
      writePackage(root, dependencyName, '0.0.1', {}, reactDirectory);
      assert.throws(
        () => runContextActionDependencyResolutionSmoke(root, selectedPackages),
        error => {
          assert.match(error.message, /@context-action\/react packed dependencies\./u);
          assert.match(error.message, new RegExp(dependencyName.replace('/', '\\/'), 'u'));
          assert.match(error.message, /expected the selected cohort candidate/u);
          return true;
        },
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}

test('protected prerelease workflow binds durable operations into every cohort gate', () => {
  const workflowPath = path.join(repositoryRoot, '.github/workflows/publish-prerelease.yml');
  const workflow = parse(readFileSync(workflowPath, 'utf8'));
  const steps = workflow.jobs['publish-prerelease'].steps;
  const step = name => steps.find(candidate => candidate.name === name);
  const durableName = '@context-action/tool-durable-operations';

  assert.match(
    step('Validate prerelease package versions').run,
    /packages\/tool-durable-operations\/package\.json/u,
  );
  assert.match(
    step('Verify packed prerelease cohort dependency closure').run,
    /--local --cohort-only/u,
  );
  assert.match(
    step('Verify packed prerelease cohort dependency closure').run,
    new RegExp(durableName.replace('/', '\\/'), 'u'),
  );
  assert.match(
    step('Publish the approved prerelease package set').run,
    /--scope @context-action\/tool-durable-operations/u,
  );
  for (const name of [
    'Verify published prerelease consumer',
    'Verify prerelease does not point latest at an RC',
    'Capture immutable registry evidence',
  ]) {
    assert.match(step(name).run, new RegExp(durableName.replace('/', '\\/'), 'u'));
  }
});
