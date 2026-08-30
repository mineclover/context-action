import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

test('the approved coordinated plan remains historically valid after later maintenance releases', () => {
  const result = execFileSync(process.execPath, ['scripts/verify-coordinated-stable-release-plan.mjs'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  assert.match(result, /"status":"ok"/u);
  assert.match(result, /"currentSource":"historical-plan"/u);
});

test('the coordinated plan verifier rejects unknown current-source modes', () => {
  const result = spawnSync(process.execPath, [
    'scripts/verify-coordinated-stable-release-plan.mjs',
    '--allow-current-source-drift',
  ], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: verify-coordinated-stable-release-plan\.mjs/u);
});

test('promotion uses durable registry journal markers and refuses local execution', () => {
  const source = read('scripts/promote-coordinated-stable.mjs');
  for (const required of [
    "process.env.GITHUB_ACTIONS !== 'true'",
    "new Set(['@context-action/core', '@context-action/react'])",
    'packages.length !== expectedPackages.size',
    'packages.some(([name]) => !expectedPackages.has(name))',
    'stable-previous-',
    'stable-previous-absent-',
    'stable-ready-',
    'stable-completed-',
    'stable-rolled-back-',
    'encodeURIComponent(name)',
    '/dist-tags?cacheBust=',
    "'cache-control': 'no-cache'",
    'async function waitForTag',
    'await waitForTag(name, entries.ready, version)',
    "await waitForTag(item.name, 'latest', item.version)",
    "if (tags.latest !== item.version)",
    "if (item.predecessor) add(item.name, item.predecessor, 'latest');",
    "else remove(item.name, 'latest');",
  ]) assert.ok(source.includes(required), `missing coordinated promotion safeguard: ${required}`);
});

test('provenance verification is bound to the approved Core and React cohort', () => {
  const source = read('scripts/verify-coordinated-stable-provenance.mjs');
  for (const required of [
    "new Set(['@context-action/core', '@context-action/react'])",
    'packages.length !== expectedPackages.size',
    'packages.some(([name]) => !expectedPackages.has(name))',
    'exact Core and React cohort',
  ]) assert.ok(source.includes(required), `missing coordinated provenance cohort guard: ${required}`);
});

test('candidate and promotion workflows bind the exact coordinated cohort', () => {
  const candidate = read('.github/workflows/publish-coordinated-stable-candidate.yml');
  const promotion = read('.github/workflows/promote-coordinated-stable.yml');
  const cohort = '@context-action/core,@context-action/react';
  assert.ok(candidate.includes(`--packages "${cohort}"`));
  assert.ok(candidate.includes('pnpm verify:coordinated-stable-release-plan -- --require-current-source'));
  assert.ok(promotion.includes(`--packages "${cohort}"`));
  assert.ok(candidate.includes('test "$RELEASE_COMMIT" = "$GITHUB_SHA"'));
  assert.ok(promotion.includes('test "$CONFIRMATION" = "PROMOTE_COORDINATED_STABLE"'));
  assert.ok(promotion.includes('ref: ${{ github.sha }}'));
  assert.ok(promotion.includes('git merge-base --is-ancestor "$RELEASE_COMMIT" HEAD'));
  assert.ok(!promotion.includes('test "$RELEASE_COMMIT" = "$GITHUB_SHA"'));
  assert.ok(promotion.includes('name: Verify npm token auth'));
  assert.ok(promotion.includes('NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}'));
});

test('the React state-management artifact excludes the Durable-backed tools entry', () => {
  const manifest = JSON.parse(read('packages/react/package.json'));
  const buildConfig = read('packages/react/tsdown.config.ts');
  assert.equal(manifest.exports['./tools'], undefined);
  assert.equal(manifest.dependencies['@context-action/tool-durable-operations'], undefined);
  assert.doesNotMatch(buildConfig, /src\/tools\/index\.ts/u);
});
