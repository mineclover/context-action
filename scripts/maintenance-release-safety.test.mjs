import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  assertChangelogVersion,
  changelogValidationOptions,
} from './verify-tool-protocol-changelog.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const maintenanceWorkflow = readFileSync(
  path.join(repositoryRoot, '.github', 'workflows', 'publish-maintenance-patch.yml'),
  'utf8',
);
const publishedConsumerVerifier = readFileSync(
  path.join(repositoryRoot, 'scripts', 'verify-published-tool-consumers.cjs'),
  'utf8',
);
const toolProtocolManifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'packages', 'tool-protocol', 'package.json'), 'utf8'),
);
const durableOperationsManifest = JSON.parse(
  readFileSync(
    path.join(repositoryRoot, 'packages', 'tool-durable-operations', 'package.json'),
    'utf8',
  ),
);
const reactManifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'packages', 'react', 'package.json'), 'utf8'),
);
const rootManifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'package.json'), 'utf8'),
);
const lernaManifest = JSON.parse(
  readFileSync(path.join(repositoryRoot, 'lerna.json'), 'utf8'),
);

function workflowStep(source, name) {
  const marker = `      - name: ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing workflow step: ${name}`);
  const end = source.indexOf('\n      - name:', start + marker.length);
  return source.slice(start, end === -1 ? source.length : end);
}

function workflowRunScript(name) {
  const step = workflowStep(maintenanceWorkflow, name);
  const marker = '        run: |\n';
  const start = step.indexOf(marker);
  assert.notEqual(start, -1, `missing run script: ${name}`);
  return step.slice(start + marker.length).replace(/^ {10}/gmu, '');
}

function runWorkflowScript(script, preamble, environment = {}) {
  return spawnSync('bash', ['-e', '-o', 'pipefail', '-c', `${preamble}\n${script}`], {
    encoding: 'utf8',
    env: {
      ...process.env,
      BASH_ENV: '',
      GITHUB_ENV: '/dev/null',
      PACKAGE_NAME: '@context-action/test',
      PACKAGE_VERSION: '1.2.3',
      ...environment,
    },
  });
}

function createFakeRegistry(initialTags) {
  const directory = mkdtempSync(path.join(tmpdir(), 'maintenance-registry-'));
  const npmPath = path.join(directory, 'npm');
  const statePath = path.join(directory, 'tags.json');
  const logPath = path.join(directory, 'operations.log');
  const faultPath = path.join(directory, 'fault-fired');
  const staleStatePath = path.join(directory, 'stale-reads.json');
  const githubEnvPath = path.join(directory, 'github.env');
  const journalEvidencePath = path.join(directory, 'journal-evidence.json');
  writeFileSync(statePath, `${JSON.stringify(initialTags)}\n`);
  writeFileSync(logPath, '');
  writeFileSync(githubEnvPath, '');
  writeFileSync(npmPath, String.raw`#!/usr/bin/env node
const { appendFileSync, existsSync, readFileSync, writeFileSync } = require('node:fs');

const statePath = process.env.NPM_REGISTRY_STATE;
const logPath = process.env.NPM_REGISTRY_LOG;
const faultPath = process.env.NPM_FAULT_STATE;
const staleStatePath = process.env.NPM_STALE_STATE;
const staleReadsAfterWrite = Number(process.env.NPM_STALE_READS_AFTER_WRITE || 0);
const args = process.argv.slice(2);
const tags = JSON.parse(readFileSync(statePath, 'utf8'));
const log = value => appendFileSync(logPath, value + '\n');
const persist = () => writeFileSync(statePath, JSON.stringify(tags) + '\n');
const clone = value => JSON.parse(JSON.stringify(value));
const armStaleReads = snapshot => {
  if (staleReadsAfterWrite > 0) {
    writeFileSync(staleStatePath, JSON.stringify({ remaining: staleReadsAfterWrite, tags: snapshot }) + '\n');
  }
};
const failAfter = operation => {
  if (process.env.NPM_FAIL_AFTER === operation && !existsSync(faultPath)) {
    writeFileSync(faultPath, operation + '\n');
    process.stderr.write('simulated accepted mutation with lost response\n');
    process.exit(86);
  }
};

if (args[0] === 'view' && args[2] === 'dist-tags') {
  log('view');
  let visibleTags = tags;
  if (staleStatePath && existsSync(staleStatePath)) {
    const stale = JSON.parse(readFileSync(staleStatePath, 'utf8'));
    if (stale.remaining > 0) {
      stale.remaining -= 1;
      writeFileSync(staleStatePath, JSON.stringify(stale) + '\n');
      visibleTags = stale.tags;
    }
  }
  process.stdout.write(JSON.stringify(visibleTags));
  process.exit(0);
}
if (args[0] === 'dist-tag' && args[1] === 'add') {
  const spec = args[2];
  const versionIndex = spec.lastIndexOf('@');
  const version = spec.slice(versionIndex + 1);
  const tag = args[3];
  const before = clone(tags);
  tags[tag] = version;
  persist();
  armStaleReads(before);
  log('add:' + tag + '=' + version);
  failAfter('add:' + tag);
  process.exit(0);
}
if (args[0] === 'dist-tag' && args[1] === 'rm') {
  const tag = args[3];
  const before = clone(tags);
  delete tags[tag];
  persist();
  armStaleReads(before);
  log('rm:' + tag);
  failAfter('rm:' + tag);
  process.exit(0);
}
process.stderr.write('unsupported fake npm command: ' + args.join(' ') + '\n');
process.exit(2);
`);
  chmodSync(npmPath, 0o755);

  return {
    cleanup() {
      rmSync(directory, { recursive: true, force: true });
    },
    githubEnv() {
      return readFileSync(githubEnvPath, 'utf8');
    },
    journalEvidence() {
      return JSON.parse(readFileSync(journalEvidencePath, 'utf8'));
    },
    operations() {
      return readFileSync(logPath, 'utf8').trim().split('\n').filter(Boolean);
    },
    resetRunFiles() {
      writeFileSync(githubEnvPath, '');
      rmSync(staleStatePath, { force: true });
    },
    run(name, { environment = {}, failAfter, staleReadsAfterWrite = 0 } = {}) {
      this.resetRunFiles();
      return runWorkflowScript(
        workflowRunScript(name),
        'sleep() { :; }',
        {
          GITHUB_ENV: githubEnvPath,
          NPM_FAIL_AFTER: failAfter ?? '',
          NPM_FAULT_STATE: faultPath,
          NPM_REGISTRY_LOG: logPath,
          NPM_REGISTRY_STATE: statePath,
          NPM_STALE_STATE: staleStatePath,
          NPM_STALE_READS_AFTER_WRITE: String(staleReadsAfterWrite),
          PATH: `${directory}:${process.env.PATH}`,
          JOURNAL_EVIDENCE_PATH: journalEvidencePath,
          ...environment,
        },
      );
    },
    tags() {
      return JSON.parse(readFileSync(statePath, 'utf8'));
    },
  };
}

function withFakeRegistry(initialTags, callback) {
  const registry = createFakeRegistry(initialTags);
  try {
    callback(registry);
  } finally {
    registry.cleanup();
  }
}

test('prepublish changelog validation rejects an immutable artifact without a release date', () => {
  const options = changelogValidationOptions({ forbidUnreleased: true });
  assert.deepEqual(options, { forbidUnreleased: true, requireReleaseDate: true });
  assert.throws(
    () =>
      assertChangelogVersion(
        `## [${toolProtocolManifest.version}]\n`,
        'undated CHANGELOG fixture',
        options,
      ),
    /must include an ISO release date/u,
  );
  assert.doesNotThrow(() =>
    assertChangelogVersion(
      `## [${toolProtocolManifest.version}] (2026-08-11)\n`,
      'dated CHANGELOG fixture',
      options,
    ),
  );
  for (const invalidDate of ['2026-99-99', '2025-02-29']) {
    assert.throws(
      () =>
        assertChangelogVersion(
          `## [${toolProtocolManifest.version}] (${invalidDate})\n`,
          `invalid ${invalidDate} CHANGELOG fixture`,
          options,
        ),
      /valid calendar date/u,
    );
  }
  assert.doesNotThrow(() =>
    assertChangelogVersion(
      `## [${toolProtocolManifest.version}] (2024-02-29)\n`,
      'leap-year CHANGELOG fixture',
      options,
    ),
  );
});

test('core and react maintenance tarballs contain their dated changelog', { timeout: 60_000 }, () => {
  for (const packageDirectory of ['core', 'react']) {
    const result = spawnSync(
      process.execPath,
      [
        path.join(repositoryRoot, 'scripts', 'verify-tool-protocol-changelog.mjs'),
        '--package', packageDirectory,
        '--forbid-unreleased',
        '--require-release-date',
      ],
      { cwd: repositoryRoot, encoding: 'utf8', timeout: 60_000 },
    );
    assert.equal(
      result.status,
      0,
      `${packageDirectory} pack validation failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
});

test('every maintenance target uses the reviewed full-workspace build contract', () => {
  assert.equal(rootManifest.scripts.build, 'lerna run build');
  assert.equal(
    workflowRunScript('Build workspace dependencies and test the maintenance target').trim(),
    [
      'pnpm build',
      'pnpm --filter "$PACKAGE_NAME" type-check',
      'pnpm --filter "$PACKAGE_NAME" test',
    ].join('\n'),
  );
  assert.doesNotMatch(maintenanceWorkflow, /PATCH_BUILD_CLOSURE|build_closure=/u);

  const lernaPackages = new Set(lernaManifest.packages);
  for (const packageDirectory of [
    'packages/core',
    'packages/tool-protocol',
    'packages/ai-sdk',
    'packages/webmcp',
    'packages/tool-durable-operations',
    'packages/react',
    'packages/mutative-core',
    'packages/mutative',
  ]) {
    assert.ok(lernaPackages.has(packageDirectory), `root build omits ${packageDirectory}`);
  }
});

test('a dist-free workspace build produces every React workspace dependency declaration', {
  timeout: 180_000,
}, () => {
  const fixtureRoot = mkdtempSync(path.join(tmpdir(), 'maintenance-clean-checkout-'));
  const rootFiles = [
    '.npmrc',
    'package.json',
    'pnpm-lock.yaml',
    'pnpm-workspace.yaml',
    'lerna.json',
    'tsconfig.json',
  ];
  const excludedDirectoryNames = new Set(['node_modules', 'dist', 'coverage', '.nx']);
  const requiredReactBuildOutputs = [
    'core',
    'tool-protocol',
    'mutative-core',
    'mutative',
    'tool-durable-operations',
    'webmcp',
    'react',
  ];

  try {
    for (const relativePath of rootFiles) {
      cpSync(path.join(repositoryRoot, relativePath), path.join(fixtureRoot, relativePath));
    }
    for (const packageDirectory of lernaManifest.packages) {
      const destination = path.join(fixtureRoot, packageDirectory);
      mkdirSync(path.dirname(destination), { recursive: true });
      cpSync(path.join(repositoryRoot, packageDirectory), destination, {
        recursive: true,
        filter: source => !excludedDirectoryNames.has(path.basename(source)),
      });
    }

    for (const packageDirectory of lernaManifest.packages) {
      assert.equal(
        existsSync(path.join(fixtureRoot, packageDirectory, 'dist')),
        false,
        `${packageDirectory} must begin without build artifacts`,
      );
    }

    const commandEnvironment = {
      ...process.env,
      CI: 'true',
      HUSKY: '0',
    };
    const install = spawnSync(
      'pnpm',
      ['install', '--frozen-lockfile', '--offline', '--ignore-scripts'],
      {
        cwd: fixtureRoot,
        encoding: 'utf8',
        env: commandEnvironment,
        timeout: 60_000,
      },
    );
    assert.equal(
      install.status,
      0,
      `dist-free fixture install failed:\n${install.stdout}\n${install.stderr}`,
    );

    const build = spawnSync('pnpm', ['build'], {
      cwd: fixtureRoot,
      encoding: 'utf8',
      env: commandEnvironment,
      timeout: 120_000,
    });
    assert.equal(
      build.status,
      0,
      `dist-free workspace build failed:\n${build.stdout}\n${build.stderr}`,
    );
    for (const packageDirectory of requiredReactBuildOutputs) {
      assert.equal(
        existsSync(path.join(fixtureRoot, 'packages', packageDirectory, 'dist')),
        true,
        `workspace build omitted packages/${packageDirectory}/dist`,
      );
    }

    const reactTypecheck = spawnSync(
      'pnpm',
      ['--filter', '@context-action/react', 'type-check:src'],
      {
        cwd: fixtureRoot,
        encoding: 'utf8',
        env: commandEnvironment,
        timeout: 60_000,
      },
    );
    assert.equal(
      reactTypecheck.status,
      0,
      `React source type-check did not resolve fresh workspace declarations:\n${reactTypecheck.stdout}\n${reactTypecheck.stderr}`,
    );
  } finally {
    rmSync(fixtureRoot, { recursive: true, force: true });
  }
});

test('durable Node-only consumer checks ESM and CJS declarations without DOM libraries', () => {
  const start = publishedConsumerVerifier.indexOf('function runNodeOnlyDurableTypecheck');
  const end = publishedConsumerVerifier.indexOf('\nfunction ', start + 1);
  assert.ok(start >= 0, 'missing durable Node-only consumer verifier');
  const durableVerifier = publishedConsumerVerifier.slice(start, end);
  assert.match(durableVerifier, /for \(const extension of \['mts', 'cts'\]\)/u);
  assert.match(durableVerifier, /`durable-node-consumer\.\$\{extension\}`/u);
  assert.match(durableVerifier, /'--skipLibCheck', 'false'/u);
  assert.match(durableVerifier, /'--lib', 'ES2022'/u);
  assert.doesNotMatch(durableVerifier, /DOM/u);
});

test('release preflight runs the React 19.2 minimum and current compatibility matrix once', () => {
  const compatibility = rootManifest.scripts['verify:react-compatibility'];
  const verifyAll = rootManifest.scripts['verify:all'];

  assert.equal(
    compatibility.match(/node scripts\/verify-react-compatibility\.mjs/gu)?.length,
    2,
    'the compatibility command must invoke the minimum and current React 19.2 versions',
  );
  assert.match(
    compatibility,
    /--react-version 19\.2\.0 --react-types 19\.2\.0 --react-dom-types 19\.2\.0/u,
  );
  assert.match(
    compatibility,
    /--react-version 19\.2\.8 --react-types 19\.2\.17 --react-dom-types 19\.2\.3/u,
  );
  assert.doesNotMatch(
    compatibility,
    /pnpm (?:run )?verify:(?:all|react-compatibility)/u,
    'the matrix command must not recurse through itself or verify:all',
  );
  assert.equal(
    verifyAll.match(/pnpm verify:react-compatibility/gu)?.length,
    1,
    'verify:all must run the support matrix exactly once',
  );
});

test('packed consumers exercise every React export, the LLMS CLI module, and the durable evidence bin', () => {
  for (const exportName of Object.keys(reactManifest.exports)) {
    const specifier = exportName === '.'
      ? reactManifest.name
      : `${reactManifest.name}${exportName.slice(1)}`;
    assert.match(
      publishedConsumerVerifier,
      new RegExp(`specifier: '${specifier.replaceAll('/', '\\/')}'`, 'u'),
      `missing packed React consumer for ${specifier}`,
    );
  }

  assert.match(
    publishedConsumerVerifier,
    /specifier: '@context-action\/llms-generator\/cli', exports: \['main'\]/u,
  );
  for (const binName of Object.keys(durableOperationsManifest.bin)) {
    assert.match(
      publishedConsumerVerifier,
      new RegExp(`name: '${binName}'`, 'u'),
      `missing packed CLI smoke for ${binName}`,
    );
  }
  assert.match(publishedConsumerVerifier, /cli\.verify\?\.\(consumerRoot\)/u);
});

test('packed declaration fixtures compile public lifecycle and development fencing contracts without React Tools', () => {
  assert.match(
    publishedConsumerVerifier,
    /register\.destroyAsync\(\{ deferCleanup: true \}\)/u,
  );
  assert.match(publishedConsumerVerifier, /DURABLE_OPERATION_FENCING_CAPABILITY/u);
  assert.match(publishedConsumerVerifier, /hasDurableOperationFencingCapability\(store\)/u);
  assert.match(publishedConsumerVerifier, /createToolApprovalQueue\(\)/u);
  assert.doesNotMatch(publishedConsumerVerifier, /@context-action\/react\/tools/u);
});

test('registry journal retries validated full dist-tags reads and preserves predecessor absence', () => {
  const step = workflowStep(maintenanceWorkflow, 'Prepare registry rollback journal');
  assert.match(step, /for attempt in \{1\.\.12\}; do/u);
  assert.match(
    step,
    /npm view "\$PACKAGE_NAME" dist-tags --json --registry=https:\/\/registry\.npmjs\.org/u,
  );
  assert.match(step, /JSON\.parse\(process\.env\.DIST_TAGS_JSON\)/u);
  assert.match(step, /maintenance-previous-absent-\$PACKAGE_VERSION/u);
  assert.match(step, /maintenance-journal-ready-\$PACKAGE_VERSION/u);
  assert.match(step, /return 1/u);
  assert.doesNotMatch(step, /dist-tags\.latest|\|\| true/u);

  const registryFailure = runWorkflowScript(
    workflowRunScript('Prepare registry rollback journal'),
    `npm() { return 42; }
sleep() { :; }`,
  );
  assert.notEqual(registryFailure.status, 0, 'registry failure must stop promotion');
  assert.match(registryFailure.stderr, /Could not read valid dist-tags/u);
});

test('fresh journals persist and read back a previous or absent predecessor before ready', () => {
  for (const [initialTags, expectedPredecessorTag] of [
    [
      { maintenance: '1.2.3', latest: '1.2.2' },
      ['maintenance-previous-1.2.3', '1.2.2'],
    ],
    [
      { maintenance: '1.2.3' },
      ['maintenance-previous-absent-1.2.3', '1.2.3'],
    ],
  ]) {
    withFakeRegistry(initialTags, registry => {
      const result = registry.run('Prepare registry rollback journal');
      assert.equal(result.status, 0, result.stderr);
      const tags = registry.tags();
      assert.equal(tags[expectedPredecessorTag[0]], expectedPredecessorTag[1]);
      assert.equal(tags['maintenance-journal-ready-1.2.3'], '1.2.3');
      const operations = registry.operations();
      const predecessorWrite = operations.findIndex(operation =>
        operation.startsWith(`add:${expectedPredecessorTag[0]}=`));
      const readyWrite = operations.indexOf('add:maintenance-journal-ready-1.2.3=1.2.3');
      assert.ok(predecessorWrite >= 0 && readyWrite > predecessorWrite, operations.join('\n'));
      assert.ok(
        operations.slice(predecessorWrite + 1, readyWrite).includes('view'),
        'predecessor must be read back before ready is written',
      );
    });
  }
});

test('journal waits for npm to expose predecessor and ready markers after writes', () => {
  withFakeRegistry({ maintenance: '1.2.3', latest: '1.2.2' }, registry => {
    const result = registry.run('Prepare registry rollback journal', { staleReadsAfterWrite: 2 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(registry.tags()['maintenance-previous-1.2.3'], '1.2.2');
    assert.equal(registry.tags()['maintenance-journal-ready-1.2.3'], '1.2.3');
  });
});

test('a rerun completes a predecessor-only crash window without replacing it', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.2',
    'maintenance-previous-1.2.3': '1.2.2',
  }, registry => {
    const result = registry.run('Prepare registry rollback journal');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(registry.tags()['maintenance-journal-ready-1.2.3'], '1.2.3');
    assert.equal(
      registry.operations().filter(operation =>
        operation.startsWith('add:maintenance-previous-1.2.3=')).length,
      0,
    );
  });
});

test('an unarmed foreign journal whose predecessor still owns latest does not block a new patch', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.1.8',
    'maintenance-previous-1.1.9': '1.1.8',
  }, registry => {
    const result = registry.run('Prepare registry rollback journal');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(registry.tags()['maintenance-previous-1.1.9'], '1.1.8');
    assert.equal(registry.tags()['maintenance-journal-ready-1.1.9'], undefined);
    assert.equal(registry.tags()['maintenance-previous-1.2.3'], '1.1.8');
    assert.equal(registry.tags()['maintenance-journal-ready-1.2.3'], '1.2.3');
  });

  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.2',
    'maintenance-previous-1.1.9': '1.1.8',
  }, registry => {
    const result = registry.run('Prepare registry rollback journal');
    assert.notEqual(result.status, 0, 'a foreign predecessor mismatch must remain fail-closed');
    assert.doesNotMatch(registry.operations().join('\n'), /^(?:add|rm):/mu);
  });
});

test('a rerun recovers promotion when latest already names the journaled candidate', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const result = registry.run('Prepare registry rollback journal');
    assert.equal(result.status, 0, result.stderr);
    assert.match(registry.githubEnv(), /LATEST_ALREADY_PROMOTED=true/u);
    assert.doesNotMatch(registry.operations().join('\n'), /^add:/mu);
  });
});

test('an accepted latest promotion with a lost response is recoverable on rerun', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.2',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const interrupted = registry.run('Promote verified candidate to latest', {
      failAfter: 'add:latest',
    });
    assert.notEqual(interrupted.status, 0);
    assert.equal(registry.tags().latest, '1.2.3');

    const resumed = registry.run('Prepare registry rollback journal');
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.match(registry.githubEnv(), /LATEST_ALREADY_PROMOTED=true/u);
  });
});

test('promotion, completion, and rollback wait for npm tag writes to propagate', () => {
  const prepared = {
    maintenance: '1.2.3',
    latest: '1.2.2',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  };

  withFakeRegistry(prepared, registry => {
    const result = registry.run('Promote verified candidate to latest', { staleReadsAfterWrite: 2 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(registry.tags().latest, '1.2.3');
  });

  withFakeRegistry({ ...prepared, latest: '1.2.3' }, registry => {
    const result = registry.run('Finalize successful promotion journal', { staleReadsAfterWrite: 2 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(registry.tags()['maintenance-journal-completed-1.2.3'], '1.2.3');
  });

  withFakeRegistry({ ...prepared, latest: '1.2.3' }, registry => {
    const result = registry.run('Roll back latest after post-promotion failure', { staleReadsAfterWrite: 2 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(registry.tags()['maintenance-journal-rolled-back-1.2.3'], '1.2.3');
    assert.equal(registry.tags().latest, '1.2.2');
  });

  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-absent-1.2.3': '1.2.3',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const result = registry.run('Roll back latest after post-promotion failure', { staleReadsAfterWrite: 2 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(registry.tags()['maintenance-journal-rolled-back-1.2.3'], '1.2.3');
    assert.equal(registry.tags().latest, undefined);
  });
});

test('completed journal reruns preserve verified latest without registry mutation', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
    'maintenance-journal-completed-1.2.3': '1.2.3',
  }, registry => {
    const prepare = registry.run('Prepare registry rollback journal');
    assert.equal(prepare.status, 0, prepare.stderr);
    assert.match(registry.githubEnv(), /JOURNAL_COMPLETED=true/u);
    const rollback = registry.run('Roll back latest after post-promotion failure');
    assert.equal(rollback.status, 0, rollback.stderr);
    assert.equal(registry.tags().latest, '1.2.3');
    assert.doesNotMatch(registry.operations().join('\n'), /^(?:add|rm):/mu);
  });
});

test('uploaded journal evidence binds the verified registry state to the release commit', () => {
  const releaseCommit = 'a'.repeat(40);
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const result = registry.run('Capture maintenance journal evidence', {
      environment: {
        GITHUB_SHA: releaseCommit,
        RELEASE_COMMIT: releaseCommit,
      },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(registry.journalEvidence(), {
      schemaVersion: 1,
      phase: 'verified-before-completion',
      package: '@context-action/test',
      candidateVersion: '1.2.3',
      releaseCommit,
      workflowEventSha: releaseCommit,
      registry: 'https://registry.npmjs.org',
      latest: '1.2.3',
      maintenance: '1.2.3',
      predecessor: { kind: 'version', version: '1.2.2' },
      markers: {
        ready: '1.2.3',
        completed: null,
        rolledBack: null,
      },
      observedAt: registry.journalEvidence().observedAt,
    });
    assert.match(registry.journalEvidence().observedAt, /^\d{4}-\d{2}-\d{2}T/u);
  });
});

test('an accepted completion marker with a lost response prevents rollback of verified latest', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const interrupted = registry.run('Finalize successful promotion journal', {
      failAfter: 'add:maintenance-journal-completed-1.2.3',
    });
    assert.notEqual(interrupted.status, 0);
    assert.equal(registry.tags()['maintenance-journal-completed-1.2.3'], '1.2.3');

    const rollback = registry.run('Roll back latest after post-promotion failure');
    assert.equal(rollback.status, 0, rollback.stderr);
    assert.equal(registry.tags().latest, '1.2.3');
    assert.equal(registry.tags()['maintenance-journal-rolled-back-1.2.3'], undefined);
  });
});

test('rollback intent is durable before restore and a dropped intent response is recoverable', () => {
  const step = workflowStep(maintenanceWorkflow, 'Roll back latest after post-promotion failure');
  const guard = step.indexOf('if [ "$current_latest" != "$PACKAGE_VERSION" ]; then');
  const intent = step.indexOf('npm dist-tag add "$PACKAGE_NAME@$PACKAGE_VERSION" "$journal_rolled_back_tag"', guard);
  const restore = step.indexOf('npm dist-tag add "$PACKAGE_NAME@$rollback_target" latest', guard);
  const remove = step.indexOf('npm dist-tag rm', guard);

  assert.ok(guard >= 0, 'rollback must compare the current latest tag with the candidate');
  assert.ok(intent > guard, 'rollback intent must follow the candidate guard');
  assert.ok(restore > intent, 'rollback restore must follow durable intent');
  assert.ok(remove > intent, 'rollback removal must follow durable intent');
  assert.match(
    step,
    /npm view "\$PACKAGE_NAME" dist-tags --json --registry=https:\/\/registry\.npmjs\.org/u,
  );

  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const interrupted = registry.run('Roll back latest after post-promotion failure', {
      failAfter: 'add:maintenance-journal-rolled-back-1.2.3',
    });
    assert.notEqual(interrupted.status, 0);
    assert.equal(registry.tags().latest, '1.2.3');
    assert.equal(registry.tags()['maintenance-journal-rolled-back-1.2.3'], '1.2.3');

    const resumed = registry.run('Roll back latest after post-promotion failure');
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.equal(registry.tags().latest, '1.2.2');
    const operations = registry.operations();
    assert.ok(
      operations.indexOf('add:maintenance-journal-rolled-back-1.2.3=1.2.3')
      < operations.indexOf('add:latest=1.2.2'),
    );
  });
});

test('an accepted restore with a lost response becomes an idempotent rolled-back rerun', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-1.2.3': '1.2.2',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const interrupted = registry.run('Roll back latest after post-promotion failure', {
      failAfter: 'add:latest',
    });
    assert.notEqual(interrupted.status, 0);
    assert.equal(registry.tags().latest, '1.2.2');
    assert.equal(registry.tags()['maintenance-journal-rolled-back-1.2.3'], '1.2.3');

    const resumed = registry.run('Roll back latest after post-promotion failure');
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.equal(registry.tags().latest, '1.2.2');
  });
});

test('absent latest rollback survives an accepted remove with a lost response', () => {
  withFakeRegistry({
    maintenance: '1.2.3',
    latest: '1.2.3',
    'maintenance-previous-absent-1.2.3': '1.2.3',
    'maintenance-journal-ready-1.2.3': '1.2.3',
  }, registry => {
    const interrupted = registry.run('Roll back latest after post-promotion failure', {
      failAfter: 'rm:latest',
    });
    assert.notEqual(interrupted.status, 0);
    assert.equal(registry.tags().latest, undefined);
    assert.equal(registry.tags()['maintenance-journal-rolled-back-1.2.3'], '1.2.3');

    const resumed = registry.run('Roll back latest after post-promotion failure');
    assert.equal(resumed.status, 0, resumed.stderr);
    assert.equal(registry.tags().latest, undefined);
  });
});

test('contradictory, foreign-active, and CAS-lost journals fail without mutation', () => {
  for (const tags of [
    {
      maintenance: '1.2.3',
      latest: '1.2.2',
      'maintenance-previous-1.2.3': '1.2.2',
      'maintenance-previous-absent-1.2.3': '1.2.3',
    },
    {
      maintenance: '1.2.3',
      latest: '1.2.2',
      'maintenance-journal-ready-1.2.3': '1.2.3',
    },
    {
      maintenance: '1.2.3',
      latest: '1.2.2',
      'maintenance-previous-1.2.3': '1.2.2',
      'maintenance-journal-ready-1.2.3': '9.9.9',
    },
    {
      maintenance: '1.2.3',
      latest: '1.2.2',
      'maintenance-previous-1.1.9': '1.1.8',
      'maintenance-journal-ready-1.1.9': '1.1.9',
    },
    {
      maintenance: '1.2.3',
      latest: '1.2.3',
      'maintenance-previous-1.2.3': '1.2.2',
      'maintenance-journal-ready-1.2.3': '1.2.3',
      'maintenance-journal-completed-1.2.3': '1.2.3',
      'maintenance-journal-rolled-back-1.2.3': '1.2.3',
    },
    {
      maintenance: '1.2.3',
      latest: '9.9.9',
      'maintenance-previous-1.2.3': '1.2.2',
      'maintenance-journal-ready-1.2.3': '1.2.3',
    },
    {
      maintenance: '9.9.9',
      latest: '1.2.3',
      'maintenance-previous-1.2.3': '1.2.2',
      'maintenance-journal-ready-1.2.3': '1.2.3',
    },
  ]) {
    withFakeRegistry(tags, registry => {
      const result = registry.run('Prepare registry rollback journal');
      assert.notEqual(result.status, 0, `unexpected success for ${JSON.stringify(tags)}`);
      assert.doesNotMatch(registry.operations().join('\n'), /^(?:add|rm):/mu);
    });
  }
});
