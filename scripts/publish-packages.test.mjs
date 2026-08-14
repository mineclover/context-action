import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publishHelper = path.join(repositoryRoot, 'scripts', 'publish-packages.cjs');

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'context-action-publish-helper-'));
  const binaryDirectory = path.join(root, 'bin');
  const packageNames = ['@context-action/mutative-core', '@context-action/mutative'];
  const packages = [];
  await mkdir(binaryDirectory, { recursive: true });
  for (const name of packageNames) {
    const location = path.join(root, 'packages', name.split('/')[1]);
    await mkdir(location, { recursive: true });
    await writeFile(
      path.join(location, 'package.json'),
      `${JSON.stringify({ name, version: '0.8.8' }, null, 2)}\n`,
    );
    packages.push({ name, version: '0.8.8', location });
  }

  const pnpmPath = path.join(binaryDirectory, 'pnpm');
  await writeFile(pnpmPath, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args.join(' ') !== 'exec lerna list --all --json') process.exit(91);
process.stdout.write(process.env.FAKE_LERNA_PACKAGES);
`);
  await chmod(pnpmPath, 0o755);

const npmPath = path.join(binaryDirectory, 'npm');
  await writeFile(npmPath, `#!/usr/bin/env node
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const args = process.argv.slice(2);
fs.appendFileSync(process.env.FAKE_NPM_LOG, JSON.stringify({ args, cwd: process.cwd() }) + '\\n');
const versions = JSON.parse(process.env.FAKE_NPM_VERSIONS || '{}');
const failures = JSON.parse(process.env.FAKE_NPM_FAILURES || '{}');
const publishFailures = JSON.parse(process.env.FAKE_PUBLISH_FAILURES || '[]');
const integrityOverrides = JSON.parse(process.env.FAKE_NPM_INTEGRITIES || '{}');
const packedManifestOverrides = JSON.parse(process.env.FAKE_PACKED_MANIFESTS || '{}');
function artifactContent(name, version) {
  return Buffer.from('approved-artifact:' + name + '@' + version);
}
function integrity(name, version) {
  return 'sha512-' + crypto.createHash('sha512').update(artifactContent(name, version)).digest('base64');
}
if (args[0] === 'view' && args[2] === 'versions') {
  if (Object.hasOwn(failures, args[1])) {
    process.stderr.write('npm error code ' + failures[args[1]] + '\\n');
    process.exit(1);
  }
  if (!Object.hasOwn(versions, args[1])) process.exit(92);
  process.stdout.write(JSON.stringify(versions[args[1]]));
  process.exit(0);
}
if (args[0] === 'view' && args[2] === 'version') {
  const separator = args[1].lastIndexOf('@');
  const name = args[1].slice(0, separator);
  const version = args[1].slice(separator + 1);
  if ((versions[name] || []).includes(version)) process.stdout.write(version + '\\n');
  else process.exit(1);
  process.exit(0);
}
if (args[0] === 'view' && args[2] === 'dist.integrity') {
  const separator = args[1].lastIndexOf('@');
  const name = args[1].slice(0, separator);
  const version = args[1].slice(separator + 1);
  process.stdout.write(JSON.stringify(integrityOverrides[name] || integrity(name, version)));
  process.exit(0);
}
if (args[0] === 'view' && args[2] === 'dist-tags') {
  process.stdout.write(JSON.stringify({}));
  process.exit(0);
}
if (args[0] === 'run' && args[1] === 'prepublishOnly' && args[2] === '--if-present') {
  fs.writeFileSync(path.join(process.cwd(), '.prepublish-ran'), 'yes');
  process.exit(0);
}
if (args[0] === 'publish') {
  const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  if (publishFailures.includes(manifest.name)) process.exit(94);
  process.stdout.write(manifest.name + '@' + manifest.version + '\\n');
  process.exit(0);
}
if (args[0] === 'pack') {
  const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
  if (!fs.existsSync(path.join(process.cwd(), '.prepublish-ran'))) process.exit(95);
  const destination = args[args.indexOf('--pack-destination') + 1];
  const filename = manifest.name.slice(1).replace('/', '-') + '-' + manifest.version + '.tgz';
  fs.mkdirSync(destination, { recursive: true });
  fs.writeFileSync(path.join(destination, filename), artifactContent(manifest.name, manifest.version));
  const packedManifest = packedManifestOverrides[manifest.name] || manifest;
  process.stdout.write(JSON.stringify([{
    filename,
    name: packedManifest.name,
    version: packedManifest.version,
  }]));
  process.exit(0);
}
if (args[0] === 'dist-tag') process.exit(0);
process.exit(93);
`);
  await chmod(npmPath, 0o755);

  const tarPath = path.join(binaryDirectory, 'tar');
  await writeFile(tarPath, `#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const manifest = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
const overrides = JSON.parse(process.env.FAKE_PACKED_MANIFESTS || '{}');
process.stdout.write(JSON.stringify(overrides[manifest.name] || manifest));
`);
  await chmod(tarPath, 0o755);

  return {
    root,
    packages,
    npmLog: path.join(root, 'npm-calls.jsonl'),
    environment: {
      ...process.env,
      GITHUB_ACTIONS: 'true',
      PATH: `${binaryDirectory}${path.delimiter}${process.env.PATH}`,
      FAKE_LERNA_PACKAGES: JSON.stringify(packages),
      FAKE_NPM_LOG: path.join(root, 'npm-calls.jsonl'),
    },
  };
}

async function npmCalls(fixture) {
  try {
    return (await readFile(fixture.npmLog, 'utf8'))
      .trim()
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function runHelper(
  fixture,
  additionalArguments = [],
  versions = {},
  failures = {},
  publishFailures = [],
  integrities = {},
  packedManifests = {},
) {
  return spawnSync(
    process.execPath,
    [
      publishHelper,
      '--summary-file', 'reports/summary.json',
      '--dist-tag', 'next',
      ...additionalArguments,
      ...fixture.packages.flatMap(({ name }) => ['--scope', name]),
    ],
    {
      cwd: fixture.root,
      encoding: 'utf8',
      env: {
        ...fixture.environment,
        FAKE_NPM_VERSIONS: JSON.stringify(versions),
        FAKE_NPM_FAILURES: JSON.stringify(failures),
        FAKE_PUBLISH_FAILURES: JSON.stringify(publishFailures),
        FAKE_NPM_INTEGRITIES: JSON.stringify(integrities),
        FAKE_PACKED_MANIFESTS: JSON.stringify(packedManifests),
      },
    },
  );
}

async function withFixture(callback) {
  const fixture = await createFixture();
  try {
    await callback(fixture);
  } finally {
    await rm(fixture.root, { recursive: true, force: true });
  }
}

test('strict scoped publication preflights every version and performs no mutation when one exists', async () => {
  await withFixture(async fixture => {
    const result = runHelper(fixture, ['--require-all-unpublished'], {
      '@context-action/mutative-core': [],
      '@context-action/mutative': ['0.8.7', '0.8.8'],
    });
    assert.notEqual(result.status, 0);
    assert.match(
      result.stderr,
      /Refusing scoped publication because approved versions already exist: @context-action\/mutative@0\.8\.8/u,
    );
    const calls = await npmCalls(fixture);
    assert.deepEqual(
      calls.map(({ args }) => args.slice(0, 3)),
      [
        ['view', '@context-action/mutative-core', 'versions'],
        ['view', '@context-action/mutative', 'versions'],
      ],
    );
    assert.equal(calls.some(({ args }) => args[0] === 'publish' || args[0] === 'dist-tag'), false);
  });
});

test('strict scoped publication proceeds only after every version is confirmed unpublished', async () => {
  await withFixture(async fixture => {
    const result = runHelper(fixture, ['--require-all-unpublished'], {
      '@context-action/mutative-core': ['0.8.7'],
      '@context-action/mutative': ['0.8.7'],
    });
    assert.equal(result.status, 0, result.stderr);
    const calls = await npmCalls(fixture);
    const publishIndexes = calls
      .map(({ args }, index) => args[0] === 'publish' ? index : -1)
      .filter(index => index >= 0);
    const preflightIndexes = calls
      .map(({ args }, index) => args[0] === 'view' && args[2] === 'versions' ? index : -1)
      .filter(index => index >= 0);
    assert.equal(preflightIndexes.length, 2);
    assert.equal(publishIndexes.length, 2);
    assert.ok(Math.max(...preflightIndexes) < Math.min(...publishIndexes));
    for (const packageName of ['mutative-core', 'mutative']) {
      const prepublishIndex = calls.findIndex(({ args, cwd }) =>
        args[0] === 'run' && args[1] === 'prepublishOnly' && path.basename(cwd) === packageName);
      const packIndex = calls.findIndex(({ args, cwd }) =>
        args[0] === 'pack' && path.basename(cwd) === packageName);
      assert.ok(prepublishIndex >= 0 && prepublishIndex < packIndex);
    }
  });
});

test('strict scoped publication treats an explicit npm E404 as an unpublished package', async () => {
  await withFixture(async fixture => {
    const result = runHelper(
      fixture,
      ['--require-all-unpublished'],
      { '@context-action/mutative': [] },
      { '@context-action/mutative-core': 'E404' },
    );
    assert.equal(result.status, 0, result.stderr);
    const calls = await npmCalls(fixture);
    assert.equal(calls.filter(({ args }) => args[0] === 'publish').length, 2);
    assert.deepEqual(
      calls.filter(({ args }) => args[0] === 'view' && args[2] === 'versions')
        .map(({ args }) => args[1]),
      ['@context-action/mutative-core', '@context-action/mutative'],
    );
  });
});

test('strict scoped publication fails closed on invalid registry metadata after checking every scope', async () => {
  await withFixture(async fixture => {
    const result = runHelper(fixture, ['--require-all-unpublished'], {
      '@context-action/mutative-core': null,
      '@context-action/mutative': [],
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Scoped publication preflight failed closed: npm returned invalid version metadata/u);
    const calls = await npmCalls(fixture);
    assert.deepEqual(
      calls.filter(({ args }) => args[0] === 'view' && args[2] === 'versions')
        .map(({ args }) => args[1]),
      ['@context-action/mutative-core', '@context-action/mutative'],
    );
    assert.equal(calls.some(({ args }) => args[0] === 'publish' || args[0] === 'dist-tag'), false);
  });
});

test('non-strict scoped publication preserves the existing idempotent retag behavior', async () => {
  await withFixture(async fixture => {
    const result = runHelper(fixture, [], {
      '@context-action/mutative-core': ['0.8.8'],
      '@context-action/mutative': ['0.8.8'],
    });
    assert.equal(result.status, 0, result.stderr);
    const calls = await npmCalls(fixture);
    assert.equal(calls.some(({ args }) => args[0] === 'publish'), false);
    assert.equal(
      calls.filter(({ args }) => args[0] === 'view' && args[2] === 'version').length,
      2,
    );
  });
});

test('publication rejects an unscoped workspace-wide fallback before invoking package tools', async () => {
  await withFixture(async fixture => {
    const result = spawnSync(
      process.execPath,
      [publishHelper, '--summary-file', 'reports/summary.json', '--dist-tag', 'next'],
      { cwd: fixture.root, encoding: 'utf8', env: fixture.environment },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Publication requires at least one explicit --scope package/u);
    assert.deepEqual(await npmCalls(fixture), []);
  });
});

test('strict partial publication preserves atomic success and failure evidence with remediation', async () => {
  await withFixture(async fixture => {
    const result = runHelper(
      fixture,
      ['--require-all-unpublished'],
      {
        '@context-action/mutative-core': [],
        '@context-action/mutative': [],
      },
      {},
      ['@context-action/mutative'],
    );
    assert.notEqual(result.status, 0);
    const summary = JSON.parse(await readFile(path.join(fixture.root, 'reports', 'summary.json'), 'utf8'));
    assert.deepEqual(summary.map(({ packageName, status }) => [packageName, status]), [
      ['@context-action/mutative-core', 'published'],
      ['@context-action/mutative', 'publish-failed'],
    ]);
    assert.match(summary[1].remediation, /--resume-matching-existing/u);
    const temporaryFiles = await readdir(path.join(fixture.root, 'reports'));
    assert.deepEqual(temporaryFiles, ['summary.json']);
  });
});

test('strict partial publication resumes only after matching the existing registry artifact', async () => {
  await withFixture(async fixture => {
    const result = runHelper(
      fixture,
      ['--require-all-unpublished', '--resume-matching-existing'],
      {
        '@context-action/mutative-core': ['0.8.8'],
        '@context-action/mutative': [],
      },
    );
    assert.equal(result.status, 0, result.stderr);
    const summary = JSON.parse(await readFile(path.join(fixture.root, 'reports', 'summary.json'), 'utf8'));
    assert.deepEqual(summary.map(({ packageName, status }) => [packageName, status]), [
      ['@context-action/mutative-core', 'existing-integrity-verified'],
      ['@context-action/mutative', 'published'],
    ]);
    const calls = await npmCalls(fixture);
    assert.deepEqual(
      calls.filter(({ args }) => args[0] === 'publish').map(({ cwd }) => path.basename(cwd)),
      ['mutative'],
    );
    const firstMutation = calls.findIndex(({ args }) => args[0] === 'publish' || args[0] === 'dist-tag');
    const integrityLookup = calls.findIndex(({ args }) => args[2] === 'dist.integrity');
    assert.ok(integrityLookup >= 0 && integrityLookup < firstMutation);
  });
});

test('strict recovery performs no mutation when an existing artifact does not match', async () => {
  await withFixture(async fixture => {
    const result = runHelper(
      fixture,
      ['--require-all-unpublished', '--resume-matching-existing'],
      {
        '@context-action/mutative-core': ['0.8.8'],
        '@context-action/mutative': [],
      },
      {},
      [],
      { '@context-action/mutative-core': `sha512-${Buffer.alloc(64).toString('base64')}` },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Registry artifact integrity does not match the approved source/u);
    const calls = await npmCalls(fixture);
    assert.equal(calls.some(({ args }) => args[0] === 'publish' || args[0] === 'dist-tag'), false);
    const summary = JSON.parse(await readFile(path.join(fixture.root, 'reports', 'summary.json'), 'utf8'));
    assert.equal(summary[0].status, 'existing-integrity-unverified');
  });
});

test('strict publication pins every registry mutation to npmjs', async () => {
  await withFixture(async fixture => {
    const result = runHelper(fixture, ['--require-all-unpublished'], {
      '@context-action/mutative-core': [],
      '@context-action/mutative': [],
    });
    assert.equal(result.status, 0, result.stderr);
    const mutations = (await npmCalls(fixture))
      .filter(({ args }) => args[0] === 'publish' || args[0] === 'dist-tag');
    assert.equal(mutations.length, 4);
    for (const { args } of mutations) {
      assert.ok(args.includes('--registry=https://registry.npmjs.org'));
    }
  });
});

test('strict publication rejects a lifecycle-mutated packed package identity before mutation', async () => {
  await withFixture(async fixture => {
    const result = runHelper(
      fixture,
      ['--require-all-unpublished'],
      {
        '@context-action/mutative-core': [],
        '@context-action/mutative': [],
      },
      {},
      [],
      {},
      {
        '@context-action/mutative-core': {
          name: '@context-action/core',
          version: '9.9.9',
        },
      },
    );
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /npm returned invalid pack metadata/u);
    const calls = await npmCalls(fixture);
    assert.equal(calls.some(({ args }) => args[0] === 'publish' || args[0] === 'dist-tag'), false);
  });
});
