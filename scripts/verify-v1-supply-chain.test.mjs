import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { executableShellCommands } from './verify-v1-supply-chain.mjs';

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const verifier = path.join(repositoryRoot, 'scripts', 'verify-v1-supply-chain.mjs');
const repositoryScripts = JSON.parse(await readFile(path.join(repositoryRoot, 'package.json'), 'utf8')).scripts;
const workflowNames = [
  'publish-maintenance-patch.yml',
  'publish-mutative.yml',
  'publish-packages.yml',
  'publish-prerelease.yml',
  'publish-coordinated-stable-candidate.yml',
  'publish-v1-stable-candidate.yml',
];
const protectedWorkflowNames = [
  'publish-maintenance-patch.yml',
  'publish-mutative.yml',
  'publish-coordinated-stable-candidate.yml',
  'publish-v1-stable-candidate.yml',
];
const reactCompatibilityMatrixCommand = 'node scripts/verify-react-compatibility.mjs --react-version 19.2.0 --react-types 19.2.0 --react-dom-types 19.2.0 && node scripts/verify-react-compatibility.mjs --react-version 19.2.8 --react-types 19.2.17 --react-dom-types 19.2.3';
const verifyAllCommand = 'pnpm build:live-code-editor && pnpm build && pnpm verify:react-compatibility && pnpm test:ai-sdk-integration && pnpm verify:ai-sdk-tool-protocol-contract && pnpm verify:react-aria-reference-hydration && pnpm verify:doc-snippets && pnpm verify:core-artifact-parity && pnpm verify:react-artifact-boundary && pnpm verify:react-webmcp-isolation && pnpm verify:package-exports && pnpm verify:package-tarballs && pnpm verify:tool-protocol-changelog && pnpm verify:webmcp-changelog && pnpm package-boundary:check && pnpm package-boundary:test && pnpm verify:local-tool-consumers && pnpm verify:v1-lifecycle && pnpm verify:v1-release-manifest && pnpm verify:v1-release-state-alignment && pnpm verify:coordinated-stable-release-plan && pnpm test:release-safety && pnpm verify:v1-release-workflows && pnpm verify:v1-supply-chain && pnpm tool-durable:test:evidence && pnpm lint && pnpm convention:check && pnpm docs:management && pnpm llms:check && pnpm type-check && pnpm test && node --test scripts/example-route-impact.test.mjs && pnpm --filter example check && pnpm --filter example test && pnpm --filter example build && pnpm web-coding:build && pnpm docs:build && pnpm verify:private-tools';
const prereleasePackageCohort = '@context-action/core,@context-action/react,@context-action/tool-durable-operations,@context-action/tool-protocol,@context-action/webmcp';

test('preserves brace expansion while normalizing executable shell groups', () => {
  assert.deepEqual(executableShellCommands('for attempt in {1..12}; do\n  echo "$attempt"\ndone'), [
    'for attempt in {1..12}',
    'do',
    'echo "$attempt"',
    'done',
  ]);
});

async function runVerifier(root) {
  try {
    const result = await execFileAsync(process.execPath, [
      verifier,
      '--root', root,
      '--output', 'reports/security-report.json',
    ]);
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

async function createFixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'context-action-supply-chain-'));
  await Promise.all([
    mkdir(path.join(root, '.github', 'workflows'), { recursive: true }),
    mkdir(path.join(root, 'example'), { recursive: true }),
    mkdir(path.join(root, 'packages', 'fixture'), { recursive: true }),
    mkdir(path.join(root, 'packages', 'tool-durable-operations'), { recursive: true }),
    mkdir(path.join(root, 'scripts'), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(root, 'SECURITY.md'), [
      '# Security',
      '## Supported versions',
      'Supported releases.',
      '## Reporting a vulnerability',
      'Report vulnerabilities privately.',
      '',
    ].join('\n')),
    writeFile(path.join(root, 'pnpm-lock.yaml'), "lockfileVersion: '9.0'\n"),
    writeFile(path.join(root, 'example', 'package.json'), `${JSON.stringify({
      private: true,
      scripts: {
        check: 'biome check src && pnpm run verify:catalog && pnpm run verify:approval && pnpm run verify:trace && pnpm run verify:usecase && pnpm run verify:conditional && pnpm run verify:mouse-action && pnpm run verify:mouse-pattern && pnpm run verify:mouse-enhanced',
        test: 'vitest run',
        build: 'tsc && vite build',
      },
    }, null, 2)}\n`),
    writeFile(path.join(root, 'package.json'), `${JSON.stringify({
      private: true,
      scripts: {
        'build:live-code-editor': 'pnpm --filter @context-action/live-code-editor build',
        build: 'lerna run build',
        'publish:packages': 'node scripts/publish-packages.cjs',
        'verify:published-tool-consumers': 'node scripts/verify-published-tool-consumers.cjs',
        'verify:local-tool-consumers': 'node scripts/verify-published-tool-consumers.cjs --local',
        'verify:react-compatibility': reactCompatibilityMatrixCommand,
        'test:ai-sdk-integration': 'pnpm --filter @context-action/tool-protocol build && pnpm --filter @context-action/ai-sdk build && node scripts/verify-ai-sdk-runtime.mjs',
        'verify:ai-sdk-tool-protocol-contract': 'pnpm --filter @context-action/tool-protocol build && pnpm --filter @context-action/ai-sdk build && node scripts/verify-ai-sdk-tool-protocol-contract.mjs',
        'verify:react-aria-reference-hydration': 'node scripts/verify-react-aria-reference-hydration.mjs',
        'verify:doc-snippets': 'node scripts/verify-doc-snippets.mjs',
        'verify:core-artifact-parity': 'node scripts/verify-core-artifact-parity.mjs',
        'verify:react-artifact-boundary': 'node scripts/verify-react-artifact-boundary.mjs',
        'verify:react-webmcp-isolation': 'node scripts/verify-react-webmcp-isolation.mjs',
        'verify:package-exports': 'node scripts/verify-package-exports.mjs',
        'verify:package-tarballs': 'node scripts/verify-package-tarballs.mjs',
        'verify:tool-protocol-changelog': 'node scripts/verify-tool-protocol-changelog.mjs',
        'verify:webmcp-changelog': 'node scripts/verify-tool-protocol-changelog.mjs --package webmcp',
        'package-boundary:check': 'node scripts/verify-package-boundaries.mjs',
        'package-boundary:test': 'node --test scripts/verify-package-boundaries.test.mjs',
        'verify:v1-lifecycle': 'node scripts/verify-v1-lifecycle-contract.mjs',
        'verify:v1-release-manifest': 'node scripts/verify-v1-release-manifest.mjs',
        'verify:v1-release-state-alignment': 'node scripts/verify-v1-release-state-alignment.mjs',
        'verify:coordinated-stable-release-plan': 'node scripts/verify-coordinated-stable-release-plan.mjs',
        'web-coding:build': 'pnpm --filter @context-action/web-coding-demo build',
        'test:release-safety': 'node --test --test-concurrency=1 scripts/maintenance-release-safety.test.mjs scripts/publish-packages.test.mjs scripts/verify-published-tool-consumers.test.cjs scripts/coordinated-stable-release.test.mjs scripts/verify-v1-release-workflows.test.mjs scripts/verify-v1-supply-chain.test.mjs',
        'verify:v1-release-workflows': 'node scripts/verify-v1-release-workflows.mjs',
        'verify:v1-supply-chain': 'node scripts/verify-v1-supply-chain.mjs',
      'tool-durable:test:evidence': 'node --test scripts/verify-durable-operation-evidence-schema.test.mjs',
        lint: repositoryScripts.lint,
        'convention:check': 'node scripts/check-context-layered-conventions.mjs',
        'docs:management': 'node scripts/verify-documentation-management.mjs',
        'llms:check': 'node packages/llms-generator/dist/cli/index.js detect-mismatches --check-only --fail-on-mismatch',
        'type-check': 'lerna run type-check',
        test: 'lerna run test',
        'docs:build': 'vitepress build docs',
        'verify:private-tools': 'node scripts/verify-private-tools.mjs',
        'verify:all': verifyAllCommand,
        'capture:published-release': 'node scripts/capture-published-release.mjs',
        'verify:prerelease-dist-tags': 'node scripts/verify-prerelease-dist-tags.cjs',
        'verify:stable-publish-authorization': 'node scripts/verify-stable-publish-authorization.mjs',
        'tool-durable:verify:env': 'pnpm --filter @context-action/tool-durable-operations verify:env',
        'tool-durable:verify:redis': 'pnpm --filter @context-action/tool-durable-operations verify:redis',
        'tool-durable:verify:postgres': 'pnpm --filter @context-action/tool-durable-operations verify:postgres',
        'tool-durable:verify:http': 'pnpm --filter @context-action/tool-durable-operations verify:http',
        'tool-durable:verify:queue': 'pnpm --filter @context-action/tool-durable-operations verify:queue',
        'release:roadmap:check': 'node scripts/verify-v1-release-roadmap-alignment.mjs && node scripts/verify-coordinated-stable-release-plan.mjs',
        'docs:api': 'typedoc --options ./typedoc.json',
        'docs:sync': 'pnpm --filter @context-action/typedoc-vitepress-sync build && node packages/typedoc-vitepress-sync/bin/cli.js sync --config ./typedoc-vitepress-sync.config.js',
        'test:canonical-example': 'pnpm --dir packages/react test:canonical-example',
        'release:check': 'pnpm verify:all && pnpm example:smoke && pnpm release:roadmap:check && pnpm docs:api && pnpm docs:sync && pnpm docs:build && pnpm test:canonical-example && git diff --exit-code -- docs/en/api docs/.vitepress/config/api-spec.ts',
      },
    }, null, 2)}\n`),
    writeFile(path.join(root, 'packages', 'fixture', 'package.json'), `${JSON.stringify({
      name: '@context-action/fixture',
      version: '1.0.0',
      license: 'Apache-2.0',
    }, null, 2)}\n`),
    writeFile(path.join(root, 'packages', 'fixture', 'LICENSE'), 'Apache License 2.0\n'),
    writeFile(path.join(root, 'packages', 'tool-durable-operations', 'package.json'), `${JSON.stringify({
      name: '@context-action/tool-durable-operations',
      private: true,
      scripts: {
        'verify:env': 'node scripts/verify-durable-operation-env.mjs',
        'verify:redis': 'pnpm run build && node scripts/verify-redis.mjs',
        'verify:postgres': 'pnpm run build && node scripts/verify-postgres.mjs',
        'verify:http': 'pnpm run build && node scripts/verify-http-side-effect.mjs',
        'verify:queue': 'pnpm run build && node scripts/verify-queue-side-effect.mjs',
      },
    }, null, 2)}\n`),
    copyFile(
      path.join(repositoryRoot, 'scripts', 'publish-packages.cjs'),
      path.join(root, 'scripts', 'publish-packages.cjs'),
    ),
    ...workflowNames.map(name => copyFile(
      path.join(repositoryRoot, '.github', 'workflows', name),
      path.join(root, '.github', 'workflows', name),
    )),
  ]);
  return root;
}

async function withFixture(callback) {
  const root = await createFixture();
  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function replaceInWorkflowStep(source, stepName, search, replacement) {
  const marker = `      - name: ${stepName}\n`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`Workflow step not found: ${stepName}`);
  const next = source.indexOf('\n      - name:', start + marker.length);
  const end = next < 0 ? source.length : next;
  const stepSource = source.slice(start, end);
  const mutatedStep = stepSource.replace(search, replacement);
  if (mutatedStep === stepSource) throw new Error(`Workflow step mutation did not match: ${stepName}`);
  return `${source.slice(0, start)}${mutatedStep}${source.slice(end)}`;
}

test('accepts every reviewed publishing workflow with its supply-chain controls intact', async () => {
  await withFixture(async root => {
    const result = await runVerifier(root);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /Wrote passed supply-chain report/);
  });
});

test('requires coordinated candidate plan validation to bind the immutable current source', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-coordinated-stable-candidate.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = source.replace(
      '        run: pnpm verify:coordinated-stable-release-plan -- --require-current-source',
      '        run: pnpm verify:coordinated-stable-release-plan',
    );
    assert.notEqual(mutated, source);
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must validate the exact coordinated stable plan against the immutable current source before publication/u);
  });
});

test('requires maintenance rollback journal preparation before latest promotion', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = source
      .replace('      - name: Prepare registry rollback journal\n', '      - name: TEMP maintenance state step\n')
      .replace('      - name: Promote verified candidate to latest\n', '      - name: Prepare registry rollback journal\n')
      .replace('      - name: TEMP maintenance state step\n', '      - name: Promote verified candidate to latest\n');
    assert.notEqual(mutated, source);
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must prepare the rollback journal before latest promotion/u);
  });
});

test('requires candidate-specific maintenance journal marker names', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Promote verified candidate to latest',
      'journal_ready_tag="maintenance-journal-ready-$PACKAGE_VERSION"',
      'journal_ready_tag="maintenance-journal-ready"',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must bind every rollback journal marker to PACKAGE_VERSION/u);
  });
});

test('requires unresolved foreign maintenance journals to fail closed', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Prepare registry rollback journal',
      'candidate !== process.env.CURRENT_CANDIDATE',
      'candidate === process.env.CURRENT_CANDIDATE',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must reject unresolved or unfinished foreign candidate journals before promotion/u);
  });
});

test('requires an optimistic latest comparison immediately before maintenance promotion', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Promote verified candidate to latest',
      '            test "$current_latest" = "$previous_latest"',
      '            true',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must compare latest with the recorded predecessor immediately before promotion/u);
  });
});

test('requires maintenance rollback on both failure and cancellation', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = source.replace(
      '        if: $' + '{{ failure() || cancelled() }}',
      '        if: $' + '{{ failure() }}',
    );
    assert.notEqual(mutated, source);
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must run rollback on both failure\(\) and cancelled\(\)/u);
  });
});

test('requires maintenance evidence upload before successful journal finalization', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const uploadStart = source.indexOf('      - name: Upload maintenance-patch evidence\n');
    const uploadEnd = source.indexOf('      - name: Finalize successful promotion journal\n', uploadStart);
    assert.ok(uploadStart >= 0 && uploadEnd > uploadStart);
    const uploadStep = source.slice(uploadStart, uploadEnd);
    const withoutUpload = `${source.slice(0, uploadStart)}${source.slice(uploadEnd)}`;
    const rollbackStart = withoutUpload.indexOf('      - name: Roll back latest after post-promotion failure\n');
    assert.ok(rollbackStart > uploadStart);
    const mutated = `${withoutUpload.slice(0, rollbackStart)}${uploadStep}${withoutUpload.slice(rollbackStart)}`;
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must upload maintenance evidence successfully before writing the completed journal marker/u);
  });
});

test('requires source-bound maintenance journal evidence report fields', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Capture maintenance journal evidence',
      'workflowEventSha: process.env.GITHUB_SHA,',
      'workflowEventSha: process.env.RELEASE_COMMIT,',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must write every reviewed maintenance journal evidence field/u);
  });
});

test('requires the rolled-back marker to be persisted before latest restoration', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Roll back latest after post-promotion failure',
      '            test "$(tag_value "$journal_rolled_back_tag")" = "$PACKAGE_VERSION"',
      '            true',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must CAS-check latest and persist the rolled-back marker before restoring or removing latest/u);
  });
});

test('requires terminal registry verification after maintenance rollback', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Roll back latest after post-promotion failure',
      '          test "$(tag_value latest)" = "$rollback_target"',
      '          true',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must terminally verify latest and every journal marker after rollback/u);
  });
});

test('fails closed on duplicate workflow YAML keys', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, `${source}\npermissions:\n  contents: write\n`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Invalid GitHub workflow YAML|Map keys must be unique/u);
  });
});

test('rejects a newly added publishing workflow until it receives an explicit policy', async () => {
  await withFixture(async root => {
    await writeFile(path.join(root, '.github', 'workflows', 'publish-shadow.yml'), `name: Unsafe publisher
on:
  workflow_dispatch:
permissions:
  contents: read
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: npm publish --access public
`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unreviewed publishing workflows are forbidden: publish-shadow\.yml/);
    assert.match(result.stderr, /direct npm publish without an explicit tag and --provenance/);
  });
});

test('rejects a credentialed workflow with a fully indirect publisher', async () => {
  await withFixture(async root => {
    await writeFile(path.join(root, '.github', 'workflows', 'release-shadow.yml'), `name: Unsafe indirect publisher
on:
  workflow_dispatch:
permissions:
  contents: read
  id-token: write
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - env:
          NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
        run: |
          runner=npm
          verb=publish
          "$runner" "$verb" packages/mutative --access public --tag latest --provenance
`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /dynamic command and script positions are forbidden/u);
  });
});

test('rejects Mutative publication outside the protected npm-stable environment', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('      name: npm-stable', '      name: npm-unprotected'));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include the protected npm-stable environment/);
  });
});

test('rejects Mutative publication without OIDC provenance permission', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('  id-token: write\n', ''));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml does not grant workflow-level id-token: write/);
  });
});

test('rejects Mutative publication without an immutable checked-out commit', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('          ref: $' + '{{ inputs.release_commit }}\n', ''));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include checkout of the approved release_commit/);
  });
});

test('rejects a Mutative workflow that can advance latest', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '--summary-file reports/npm-mutative-summary.json --dist-tag next',
      '--summary-file reports/npm-mutative-summary.json --dist-tag latest',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must not publish or promote the latest dist-tag/);
  });
});

test('rejects Mutative publication without registry evidence capture', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('pnpm capture:published-release', 'pnpm capture:disabled-release'));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must capture registry evidence and always upload the evidence artifact/);
  });
});

test('requires Mutative to request fail-closed unpublished-cohort preflight', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('            --require-all-unpublished \\\n', ''));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /publish-mutative\.yml must require every approved Mutative version to be unpublished before mutation/,
    );
  });
});

for (const [workflowName, expectedFailure] of [
  ['publish-packages.yml', /must require every regular candidate version to be unpublished before mutation/u],
  ['publish-prerelease.yml', /must require every prerelease candidate version to be unpublished before mutation/u],
  ['publish-v1-stable-candidate.yml', /must require every stable candidate version to be unpublished before mutation/u],
]) {
  test(`${workflowName} requires fail-closed unpublished-cohort preflight`, async () => {
    await withFixture(async root => {
      const workflowPath = path.join(root, '.github', 'workflows', workflowName);
      const source = await readFile(workflowPath, 'utf8');
      await writeFile(workflowPath, source.replace('            --require-all-unpublished \\\n', ''));
      const result = await runVerifier(root);
      assert.equal(result.code, 1);
      assert.match(result.stderr, expectedFailure);
    });
  });
}

test('keeps Mutative packages out of the general publisher', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '            --scope @context-action/ai-sdk \\',
      [
        '            --scope @context-action/mutative-core \\',
        '            --scope @context-action/ai-sdk \\',
      ].join('\n'),
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /publish-packages\.yml must leave mutative-core exclusively to the protected Mutative publisher/u,
    );
  });
});

test('rejects an additional unscoped publish helper invocation', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          pnpm publish:packages -- --summary-file reports/unsafe.json --dist-tag next\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-packages\.yml must contain exactly one scoped publish helper invocation/u);
  });
});

test('rejects a direct publish helper entrypoint outside the approved invocation', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          node scripts/publish-packages.cjs --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-packages\.yml must contain exactly one scoped publish helper invocation/u);
  });
});

test('rejects package-manager wrappers around an extra publish helper invocation', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          corepack pnpm --silent publish:packages -- --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-packages\.yml must contain exactly one scoped publish helper invocation/u);
  });
});

test('rejects publication hidden behind executable shell wrappers', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          command env pnpm publish:packages -- --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must contain exactly one scoped publish helper invocation|must not publish or promote the latest dist-tag/u);
  });
});

test('rejects publication hidden inside an executable shell group', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          (node scripts/publish-packages.cjs --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative)\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-packages\.yml must contain exactly one scoped publish helper invocation/u);
  });
});

test('rejects publication hidden inside a shell command string', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      "          bash -c 'node scripts/publish-packages.cjs --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative'\n          mkdir -p reports\n",
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-packages\.yml must contain exactly one scoped publish helper invocation/u);
  });
});

test('forbids dynamic shell command strings even when the publisher name is indirect', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          /usr/bin/env /bin/bash -lc \'runner=pnpm; "$runner" publish:packages -- --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\'\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /bash\/sh\/zsh -c and eval are forbidden in workflows/u);
  });
});

test('forbids a shell command string invoked through the default BASH variable', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          "$BASH" -c \'node scripts/publish-packages.cjs --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\'\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /bash\/sh\/zsh -c and eval are forbidden in workflows/u);
  });
});

test('rejects an absolute-path npm publisher outside the approved invocation', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          /usr/bin/npm publish --access public --tag latest --provenance\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unapproved publication command|must not publish or promote the latest dist-tag/u);
  });
});

test('forbids nice-wrapped dynamic shell command strings', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          /usr/bin/nice -n 5 "$BASH" -lc \'node scripts/publish-packages.cjs --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\'\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /bash\/sh\/zsh -c and eval are forbidden in workflows/u);
  });
});

test('inventories a publisher invoked through a dynamic command position', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          NPM=/usr/bin/npm\n          "$NPM" publish --access public --tag latest --provenance\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unapproved publication command|must not publish or promote the latest dist-tag/u);
  });
});

test('forbids fully indirect package-manager and command names', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          runner=pnpm\n          verb=publish:packages\n          "$runner" "$verb" -- --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /dynamic command and script positions are forbidden/u);
  });
});

test('forbids dynamic package-manager verbs and node script paths', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          verb=publish:packages\n          pnpm "$verb" -- --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\n          script=scripts/publish-packages.cjs\n          node "$script" --summary-file reports/rogue-node.json --dist-tag latest --scope @context-action/mutative\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /dynamic command and script positions are forbidden/u);
  });
});

test('rejects timeout-wrapped direct npm publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          timeout 60 /usr/bin/npm publish packages/mutative --access public --tag latest --provenance\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unapproved publication command|must not publish or promote the latest dist-tag/u);
  });
});

test('forbids timeout-wrapped fully indirect publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      '          runner=pnpm\n          verb=publish:packages\n          timeout 60 "$runner" "$verb" -- --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\n          mkdir -p reports\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /dynamic command and script positions are forbidden/u);
  });
});

test('rejects shell interpreter heredocs that can hide publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          mkdir -p reports\n',
      "          bash <<'ROGUE'\n          node scripts/publish-packages.cjs --summary-file reports/rogue.json --dist-tag latest --scope @context-action/mutative\n          ROGUE\n          mkdir -p reports\n",
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /shell interpreter heredocs are forbidden/u);
  });
});

test('rejects Node heredocs that can hide publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          pnpm publish:packages -- --summary-file reports/npm-mutative-summary.json --dist-tag next \\\n',
      "          node <<'ROGUE'\n          require('node:child_process').execFileSync('npm', ['publish', 'packages/mutative', '--tag', 'latest'], { stdio: 'inherit' });\n          ROGUE\n          pnpm publish:packages -- --summary-file reports/npm-mutative-summary.json --dist-tag next \\\n",
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unreviewed inline interpreter execution is forbidden/u);
  });
});

test('requires integrity-bound recovery on every strict publisher', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('            --resume-matching-existing \\\n', ''));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must bind strict recovery to matching registry artifacts|must use its approved integrity-bound strict recovery policy/u);
  });
});

test('does not count scope-like text inside another quoted helper argument', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source
      .replace(
        '--summary-file reports/npm-mutative-summary.json',
        '--summary-file "reports/npm-mutative-summary.json --scope @context-action/mutative-core "',
      )
      .replace('            --scope @context-action/mutative-core \\\n', ''));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must publish exactly its approved package scope cohort/u);
  });
});

test('requires the complete regular package consumer cohort', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '--packages "@context-action/typedoc-vitepress-sync,@context-action/ai-sdk,@context-action/tool-durable-operations,@context-action/llms-generator"',
      '--packages "@context-action/typedoc-vitepress-sync,@context-action/ai-sdk,@context-action/tool-durable-operations"',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must fail closed on the complete consumer cohort before recording passing evidence/u);
  });
});

test('requires passing consumer evidence for the regular package cohort', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('--consumer-status passed', '--consumer-status not-run'));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must capture passing evidence for exactly its approved tag and package cohort/u);
  });
});

test('binds uploaded evidence to the exact captured path and fail-closed upload policy', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source
      .replace('          path: reports/npm-mutative-*.json', '          path: SECURITY.md')
      .replace('          if-no-files-found: error', '          if-no-files-found: ignore'));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must fail closed while uploading the exact captured evidence path/u);
  });
});

test('rejects continue-on-error on the evidence upload step', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '      - name: Upload mutative publish evidence\n',
      '      - name: Upload mutative publish evidence\n        continue-on-error: true\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must fail closed while uploading the exact captured evidence path/u);
  });
});

test('requires the regular consumer matrix to fail closed before evidence capture', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '      - name: Verify published tool package consumer install\n',
      '      - name: Verify published tool package consumer install\n        continue-on-error: true\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must fail closed on the complete consumer cohort before recording passing evidence/u);
  });
});

test('does not accept a consumer command hidden in inactive shell control flow', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    const command = 'pnpm verify:published-tool-consumers -- --tag next --packages "@context-action/typedoc-vitepress-sync,@context-action/ai-sdk,@context-action/tool-durable-operations,@context-action/llms-generator"';
    await writeFile(workflowPath, source.replace(
      `        run: ${command}`,
      `        run: |\n          if false; then\n            ${command}\n          fi`,
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must fail closed on the complete consumer cohort before recording passing evidence/u);
  });
});

test('requires the complete Mutative consumer cohort', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      'run: pnpm verify:published-tool-consumers -- --tag next --packages "@context-action/mutative-core,@context-action/mutative"',
      'run: pnpm verify:published-tool-consumers -- --tag next --packages "@context-action/core"',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must fail closed on the complete consumer cohort before recording passing evidence/u);
  });
});

test('does not allow a release gate to override a protected durable backend endpoint', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '      - name: Verify durable-operation external backends and bridges\n',
      '      - name: Verify durable-operation external backends and bridges\n        env:\n          REDIS_URL: redis://attacker.invalid:6379\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must not override protected job variable REDIS_URL/u);
  });
});

test('requires every regular changelog gate before publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          node scripts/verify-tool-protocol-changelog.mjs --package llms-generator --forbid-unreleased --require-release-date\n',
      '',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must verify the llms-generator source and packed changelog before publication/u);
  });
});

test('requires both Mutative changelog gates before publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          node scripts/verify-tool-protocol-changelog.mjs --package mutative --forbid-unreleased --require-release-date\n',
      '',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must verify the mutative source and packed changelog before publication/u);
  });
});

test('does not accept changelog gates hidden in inactive shell control flow', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source
      .replace(
        '          node scripts/verify-tool-protocol-changelog.mjs --package mutative-core --forbid-unreleased --require-release-date\n',
        '          if false; then\n            node scripts/verify-tool-protocol-changelog.mjs --package mutative-core --forbid-unreleased --require-release-date\n',
      )
      .replace(
        '          node scripts/verify-tool-protocol-changelog.mjs --package mutative --forbid-unreleased --require-release-date\n',
        '            node scripts/verify-tool-protocol-changelog.mjs --package mutative --forbid-unreleased --require-release-date\n          fi\n',
      ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must run both Mutative changelog gates as one straight-line fail-closed step/u);
  });
});

test('requires evidence for the exact approved Mutative tag and cohort', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      'pnpm capture:published-release -- --tag next --packages "@context-action/mutative-core,@context-action/mutative"',
      'pnpm capture:published-release -- --tag latest --packages "@context-action/core"',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must capture passing evidence for exactly its approved tag and package cohort/u);
  });
});

test('does not accept a changelog gate that can continue after failure', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '      - name: Verify source and packed release changelogs\n',
      '      - name: Verify source and packed release changelogs\n        continue-on-error: true\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must verify the mutative-core source and packed changelog before publication/u);
  });
});

test('rejects publishing durable operations when an external-backend gate is skipped', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('          pnpm tool-durable:verify:redis\n', ''));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-packages\.yml must run the Redis integration smoke test before publication/);
  });
});

test('rejects rebinding a reviewed release gate root script', async () => {
  await withFixture(async root => {
    const packagePath = path.join(root, 'package.json');
    const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
    manifest.scripts['verify:published-tool-consumers'] = 'true';
    await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /root release scripts must not be rebound: verify:published-tool-consumers/u);
  });
});

test('rejects rebinding the exact React compatibility matrix', async () => {
  await withFixture(async root => {
    const packagePath = path.join(root, 'package.json');
    const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
    manifest.scripts['verify:react-compatibility'] = 'true';
    await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /root release scripts must not be rebound: verify:react-compatibility/u);
  });
});

for (const scriptName of ['test:release-safety', 'lint']) {
  test(`${scriptName} retains the published-consumer regression suite binding`, async () => {
    await withFixture(async root => {
      const packagePath = path.join(root, 'package.json');
      const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
      const original = manifest.scripts[scriptName];
      manifest.scripts[scriptName] = original.replace(
        ' scripts/verify-published-tool-consumers.test.cjs',
        '',
      );
      assert.notEqual(manifest.scripts[scriptName], original);
      await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
      const result = await runVerifier(root);
      assert.equal(result.code, 1);
      assert.match(
        result.stderr,
        new RegExp(`root release scripts must not be rebound: [^\\n]*${scriptName}`, 'u'),
      );
    });
  });
}

test('rejects bypassing the aggregate release preflight binding', async () => {
  await withFixture(async root => {
    const packagePath = path.join(root, 'package.json');
    const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
    manifest.scripts['verify:all'] = 'true';
    await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /root release scripts must not be rebound: verify:all/u);
  });
});

test('rejects representative no-op rebindings throughout the aggregate release gate', async () => {
  await withFixture(async root => {
    const packagePath = path.join(root, 'package.json');
    const original = JSON.parse(await readFile(packagePath, 'utf8'));
    const protectedAliases = [
      'build',
      'verify:core-artifact-parity',
      'verify:react-artifact-boundary',
      'verify:react-webmcp-isolation',
      'verify:package-exports',
      'verify:package-tarballs',
      'verify:local-tool-consumers',
      'test:release-safety',
      'lint',
      'type-check',
      'test',
      'verify:private-tools',
    ];
    for (const scriptName of protectedAliases) {
      const manifest = structuredClone(original);
      manifest.scripts[scriptName] = 'true';
      await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
      const result = await runVerifier(root);
      assert.equal(result.code, 1, `${scriptName} rebind unexpectedly passed`);
      assert.match(
        result.stderr,
        new RegExp(`root release scripts must not be rebound: [^\\n]*${scriptName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`, 'u'),
      );
    }
  });
});

test('rejects no-op rebindings of example leaf release gates', async () => {
  await withFixture(async root => {
    const packagePath = path.join(root, 'example', 'package.json');
    const original = JSON.parse(await readFile(packagePath, 'utf8'));
    for (const scriptName of ['check', 'test', 'build']) {
      const manifest = structuredClone(original);
      manifest.scripts[scriptName] = 'true';
      await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
      const result = await runVerifier(root);
      assert.equal(result.code, 1, `example ${scriptName} rebind unexpectedly passed`);
      assert.match(
        result.stderr,
        new RegExp(`example release scripts must not be rebound: [^\\n]*${scriptName}`, 'u'),
      );
    }
  });
});

test('rejects rebinding the package-level durable release implementation', async () => {
  await withFixture(async root => {
    const packagePath = path.join(root, 'packages', 'tool-durable-operations', 'package.json');
    const manifest = JSON.parse(await readFile(packagePath, 'utf8'));
    manifest.scripts['verify:redis'] = 'true';
    await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /durable package release scripts must not be rebound: verify:redis/u);
  });
});

test('rejects rebinding a protected durable endpoint through GITHUB_ENV', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '      - name: Verify durable-operation external backends and bridges\n',
      '      - name: Rebind release endpoint\n        run: echo \'REDIS_URL=redis://attacker.invalid\' >> "$GITHUB_ENV"\n\n      - name: Verify durable-operation external backends and bridges\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must not rebind protected job variable REDIS_URL through GITHUB_ENV/u);
  });
});

test('requires the regular release gate before publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('        run: pnpm release:check\n', '        run: true\n'));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must run the root release gate/u);
  });
});

for (const workflowName of ['publish-prerelease.yml', 'publish-v1-stable-candidate.yml']) {
  test(`${workflowName} requires the root release gate before publication`, async () => {
    await withFixture(async root => {
      const workflowPath = path.join(root, '.github', 'workflows', workflowName);
      const source = await readFile(workflowPath, 'utf8');
      await writeFile(workflowPath, source.replace('        run: pnpm release:check\n', '        run: true\n'));
      const result = await runVerifier(root);
      assert.equal(result.code, 1);
      assert.match(result.stderr, /must run the root release gate/u);
    });
  });
}

test('requires the complete Mutative build before publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('        run: pnpm build\n', '        run: true\n'));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must build the complete Mutative cohort before publication/u);
  });
});

test('requires the complete workspace build before maintenance target validation', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Build workspace dependencies and test the maintenance target',
      '          pnpm build',
      '          pnpm --filter @context-action/react build',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /must build the complete workspace dependency graph before maintenance target type-check and test/u,
    );
  });
});

test('requires maintenance approved-source verification adjacent to publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = source.replace(
      '      - name: Publish the new patch candidate\n',
      [
        '      - name: Intervening lifecycle mutation',
        '        run: true',
        '',
        '      - name: Publish the new patch candidate',
        '',
      ].join('\n'),
    );
    assert.notEqual(mutated, source);
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /must re-verify the approved clean source immediately before publication/u,
    );
  });
});

test('does not accept a neutralized maintenance approved-source check', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-maintenance-patch.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Re-verify approved source immediately before publication',
      '          git diff --cached --exit-code',
      '          git diff --cached --exit-code || true',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /must re-verify the approved clean source immediately before publication/u,
    );
  });
});

test('rejects a later checkout between the approved source guard and publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '      - name: Publish the approved mutative package set to next\n',
      [
        '      - name: Replace the approved workspace',
        '        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
        '        with:',
        '          ref: refs/heads/other',
        '',
        '      - name: Publish the approved mutative package set to next',
        '',
      ].join('\n'),
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must re-verify the approved clean source immediately before publication/u);
  });
});

test('requires both tag and manual main provenance guards on the regular publisher', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-packages.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"',
      '          true',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must bind a manual publication to the current origin\/main commit/u);
  });
});

test('binds the reviewed inline validator to all five prerelease package versions', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Validate prerelease package versions',
      "            'packages/tool-durable-operations/package.json': '@context-action/tool-durable-operations',\n",
      '',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unreviewed inline interpreter execution is forbidden/u);
  });
});

test('requires the exact five-package prerelease publication scope', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Publish the approved prerelease package set',
      '            --scope @context-action/tool-durable-operations \\\n',
      '',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /publish-prerelease\.yml must publish exactly its approved package scope cohort/u,
    );
  });
});

test('requires the exact local packed prerelease cohort closure before publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Verify packed prerelease cohort dependency closure',
      '--local --cohort-only',
      '--local',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /must verify the exact packed prerelease cohort dependency closure before publication/u,
    );
  });
});

test('requires the published prerelease consumer to use the exact five-package cohort', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Verify published prerelease consumer',
      prereleasePackageCohort,
      '@context-action/core,@context-action/react,@context-action/tool-protocol,@context-action/webmcp',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /must fail closed on the complete consumer cohort before recording passing evidence/u,
    );
  });
});

test('requires the exact prerelease non-promotion gate before evidence capture', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Verify prerelease does not point latest at an RC',
      prereleasePackageCohort,
      '@context-action/core',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must verify the exact prerelease tag and cohort before evidence capture/u);
  });
});

test('requires prerelease registry evidence for the exact five-package cohort', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Capture immutable registry evidence',
      prereleasePackageCohort,
      '@context-action/core,@context-action/react,@context-action/tool-protocol,@context-action/webmcp',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /must capture passing evidence for exactly its approved tag and package cohort/u,
    );
  });
});

test('binds the prerelease evidence upload to the exact fail-closed report path', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    const mutated = replaceInWorkflowStep(
      source,
      'Upload prerelease publish evidence',
      '          path: reports/npm-prerelease-*.json',
      '          path: reports/npm-prerelease-registry-evidence.json',
    );
    await writeFile(workflowPath, mutated);
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(
      result.stderr,
      /must fail closed while uploading the exact captured evidence path/u,
    );
  });
});

test('requires exactly the reviewed prerelease dist-tag input options', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace('          - next\n', '          - next\n          - beta\n'));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must allow exactly the reviewed rc and next prerelease dist-tags/u);
  });
});

test('requires prerelease dist-tag options to remain a required choice input', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      "        description: 'Prerelease npm dist-tag'\n        required: true\n        default: rc\n        type: choice",
      "        description: 'Prerelease npm dist-tag'\n        required: false\n        default: latest\n        type: string",
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must allow exactly the reviewed rc and next prerelease dist-tags/u);
  });
});

test('requires a runtime prerelease dist-tag allow-list before publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '[[ "$PRERELEASE_DIST_TAG" =~ ^(rc|next)$ ]]',
      '[[ -n "$PRERELEASE_DIST_TAG" ]]',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must bind the prerelease to current main and enforce the dist-tag allow-list immediately before publication/u);
  });
});

test('requires prerelease publication to run from the current main commit', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)"\n',
      '',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must bind the prerelease to current main/u);
  });
});

test('requires every prerelease cohort changelog before publication', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-prerelease.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '          node scripts/verify-tool-protocol-changelog.mjs --package tool-durable-operations\n',
      '',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /must verify every prerelease source and packed changelog/u);
  });
});

for (const workflowName of protectedWorkflowNames) {
  test(`${workflowName} binds release_commit to the immutable workflow event SHA`, async () => {
    await withFixture(async root => {
      const workflowPath = path.join(root, '.github', 'workflows', workflowName);
      const source = await readFile(workflowPath, 'utf8');
      const mutated = source.replace('          test "$RELEASE_COMMIT" = "$GITHUB_SHA"\n', '');
      assert.notEqual(mutated, source);
      await writeFile(workflowPath, mutated);
      const result = await runVerifier(root);
      assert.equal(result.code, 1);
      assert.match(
        result.stderr,
        new RegExp(`${workflowName.replaceAll('.', '\\.') } must include release_commit equality with the immutable workflow event SHA`, 'u'),
      );
    });
  });
}

for (const [description, replacement] of [
  ['commented out', '          # test "$RELEASE_COMMIT" = "$GITHUB_SHA"'],
  ['echoed as data', '          echo \'test "$RELEASE_COMMIT" = "$GITHUB_SHA"\''],
  ['neutralized by an OR-list', '          test "$RELEASE_COMMIT" = "$GITHUB_SHA" || true'],
]) {
  test(`does not accept a protected event-SHA guard ${description}`, async () => {
    await withFixture(async root => {
      const workflowName = 'publish-mutative.yml';
      const workflowPath = path.join(root, '.github', 'workflows', workflowName);
      const source = await readFile(workflowPath, 'utf8');
      const mutated = source.replace(
        '          test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
        replacement,
      );
      assert.notEqual(mutated, source);
      await writeFile(workflowPath, mutated);
      const result = await runVerifier(root);
      assert.equal(result.code, 1);
      assert.match(
        result.stderr,
        /publish-mutative\.yml must include release_commit equality with the immutable workflow event SHA/u,
      );
    });
  });
}

test('does not accept a commented protected-release guard as executable policy', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(
      workflowPath,
      source.replace(
        '          test "$GITHUB_REF" = "refs/heads/main"',
        '          # test "$GITHUB_REF" = "refs/heads/main"',
      ),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include a main dispatch-ref guard/);
  });
});

test('does not accept an echoed protected-release guard as an executable command', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(
      workflowPath,
      source.replace(
        '          test "$GITHUB_REF" = "refs/heads/main"',
        '          echo \'test "$GITHUB_REF" = "refs/heads/main"\'',
      ),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include a main dispatch-ref guard/);
  });
});

test('does not accept a protected-release guard neutralized by an OR-list', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(
      workflowPath,
      source.replace(
        '          test "$GITHUB_REF" = "refs/heads/main"',
        '          test "$GITHUB_REF" = "refs/heads/main" || true',
      ),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include a main dispatch-ref guard/);
  });
});

test('does not accept protected-release guards from a continue-on-error step', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '      - name: Verify approved main release commit\n',
      '      - name: Verify approved main release commit\n        continue-on-error: true\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include a main dispatch-ref guard/u);
  });
});

test('does not accept protected-release guards under a custom job shell', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(workflowPath, source.replace(
      '    runs-on: ubuntu-latest\n',
      '    runs-on: ubuntu-latest\n    defaults:\n      run:\n        shell: bash {0}\n',
    ));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include a main dispatch-ref guard/u);
  });
});

test('requires protected-release guards in fail-fast order', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    const original = [
      '          [[ "$RELEASE_COMMIT" =~ ^[0-9a-f]{40}$ ]]',
      '          test "$GITHUB_REF" = "refs/heads/main"',
      '          test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
      '          test "$(git rev-parse HEAD)" = "$RELEASE_COMMIT"',
      '          git merge-base --is-ancestor "$RELEASE_COMMIT" origin/main',
    ].join('\n');
    const reordered = [
      '          git merge-base --is-ancestor "$RELEASE_COMMIT" origin/main',
      '          [[ "$RELEASE_COMMIT" =~ ^[0-9a-f]{40}$ ]]',
      '          test "$GITHUB_REF" = "refs/heads/main"',
      '          test "$RELEASE_COMMIT" = "$GITHUB_SHA"',
      '          test "$(git rev-parse HEAD)" = "$RELEASE_COMMIT"',
    ].join('\n');
    await writeFile(workflowPath, source.replace(original, reordered));
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include main ancestry validation/u);
  });
});

test('requires release_commit to be an actual required workflow input', async () => {
  await withFixture(async root => {
    const workflowPath = path.join(root, '.github', 'workflows', 'publish-mutative.yml');
    const source = await readFile(workflowPath, 'utf8');
    await writeFile(
      workflowPath,
      source.replace('      release_commit:\n', '      release_commit_disabled:\n      # release_commit:\n'),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /publish-mutative\.yml must include a required immutable release_commit input/);
  });
});

test('inventories a publisher hidden behind a shell line continuation', async () => {
  await withFixture(async root => {
    await writeFile(
      path.join(root, '.github', 'workflows', 'release-shadow.yml'),
      [
        'name: Hidden publisher',
        'on:',
        '  workflow_dispatch:',
        'jobs:',
        '  publish:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: |',
        "          npm \\",
        '            publish --access public --tag latest --provenance',
        '',
      ].join('\n'),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unreviewed publishing workflows are forbidden: release-shadow\.yml/);
  });
});

test('inventories npm publish resolved from a folded YAML run scalar', async () => {
  await withFixture(async root => {
    await writeFile(
      path.join(root, '.github', 'workflows', 'release-folded.yml'),
      [
        'name: Folded publisher',
        'on:',
        '  workflow_dispatch:',
        'jobs:',
        '  publish:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: >-',
        '          npm',
        '          publish --access public --tag latest --provenance',
        '',
      ].join('\n'),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /unreviewed publishing workflows are forbidden: release-folded\.yml/);
  });
});

test('does not let flags on a later command bless an untagged direct publish', async () => {
  await withFixture(async root => {
    await writeFile(
      path.join(root, '.github', 'workflows', 'release-split.yml'),
      [
        'name: Split publisher',
        'on:',
        '  workflow_dispatch:',
        'permissions:',
        '  id-token: write',
        'jobs:',
        '  publish:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: |',
        '          npm publish --access public',
        '          echo --tag next --provenance',
        '',
      ].join('\n'),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /release-split\.yml has a direct npm publish without an explicit tag and --provenance/);
  });
});

test('does not inventory publisher text that exists only in YAML and shell comments', async () => {
  await withFixture(async root => {
    await writeFile(
      path.join(root, '.github', 'workflows', 'release-comments.yml'),
      [
        'name: Comments only',
        '# run: npm publish --tag latest --provenance',
        'on:',
        '  workflow_dispatch:',
        'jobs:',
        '  check:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: |',
        '          # npm publish --tag latest --provenance',
        '          echo safe',
        '',
      ].join('\n'),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 0, result.stderr);
  });
});

test('does not inventory publisher text in echoed strings or heredoc data', async () => {
  await withFixture(async root => {
    await writeFile(
      path.join(root, '.github', 'workflows', 'release-data.yml'),
      [
        'name: Publisher text as data',
        'on:',
        '  workflow_dispatch:',
        'jobs:',
        '  check:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: |',
        "          echo 'npm publish --tag latest --provenance'",
        "          node - <<'NODE'",
        '          npm publish --tag latest --provenance',
        '          NODE',
        '',
      ].join('\n'),
    );
    const result = await runVerifier(root);
    assert.equal(result.code, 0, result.stderr);
  });
});
