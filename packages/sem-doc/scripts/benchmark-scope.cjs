#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const {
  DOCUMENT_INDEX_SCHEMA,
  RepositoryRevisionReader,
  SEM_ADVISORY_SCHEMA,
  SemAdvisoryProvider,
  SemClient,
  WORK_CONTEXT_SCHEMA,
  WorkContextService,
  selectWorkContextHops,
} = require('../dist');

const samples = positiveInteger(process.env.SEM_DOC_BENCH_SAMPLES, 7, 'SEM_DOC_BENCH_SAMPLES');
const warmups = nonNegativeInteger(process.env.SEM_DOC_BENCH_WARMUPS, 2, 'SEM_DOC_BENCH_WARMUPS');
const realSem = typeof process.env.SEM_BIN === 'string' && process.env.SEM_BIN.length > 0;
const fixtureRoot = realSem ? undefined : createFixtureRepository();
const repositoryRoot = realSem ? process.cwd() : fixtureRoot;
const binary = realSem ? process.env.SEM_BIN : process.execPath;
const prefixArgs = realSem ? [] : [path.join(__dirname, '..', 'test', 'fixtures', 'fake-sem.cjs')];
const entity = process.env.SEM_DOC_BENCH_ENTITY || (realSem ? 'SemClient' : 'authenticateUser');
const file = process.env.SEM_DOC_BENCH_FILE || (realSem ? 'src/sem-client.ts' : 'src/auth.ts');
const docsRoot = process.env.SEM_DOC_BENCH_DOCS_ROOT || (realSem ? 'spec' : 'managed');
const client = new SemClient({ binary, prefixArgs });
const engineVersion = client.version({ cwd: repositoryRoot });
const revisionReader = new RepositoryRevisionReader();
const workContext = new WorkContextService({ client, revisionReader });
const advisory = new SemAdvisoryProvider(client);

try {
  const measurements = [
    benchmark('work-context-1-hop', () => runWorkContext(1)),
    benchmark('work-context-2-hop', () => runWorkContext(2)),
    benchmark('separate-1-and-2-hop-queries', runSeparateHopQueries),
    benchmark('single-2-hop-query-with-derived-1-hop-view', runSharedHopQuery),
    benchmark('sem-entity-diff', runEntityDiff),
  ];
  const result = {
    schemaVersion: 'sem-doc-scope-benchmark.v1',
    generatedAt: new Date().toISOString(),
    policy: 'observational-no-wall-clock-gate',
    contracts: {
      workContext: WORK_CONTEXT_SCHEMA,
      documents: DOCUMENT_INDEX_SCHEMA,
      advisory: SEM_ADVISORY_SCHEMA,
    },
    scope: {
      entitySource: 'sem-exposed-only',
      completeLocalScopeInventory: false,
      exactReferenceSites: false,
      workContextHops: [1, 2],
      semanticDiff: 'typed-sem-entity-advisory',
      nativeGitDiff: 'factual-evidence-not-semantic-judgment',
    },
    engine: {
      mode: realSem ? 'real-sem' : 'fake-sem-orchestration',
      version: engineVersion,
    },
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuModel: os.cpus()[0]?.model ?? 'unknown',
      logicalCpus: os.cpus().length,
    },
    configuration: {
      samples,
      warmups,
      entity,
      file,
      docsRoot,
      contextBudget: 2000,
      cache: 'engine-default',
      hopReuse: 'query-2-hop-once-and-derive-1-hop-view',
    },
    measurements,
  };
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  if (fixtureRoot !== undefined) rmSync(fixtureRoot, { recursive: true, force: true });
}

function runWorkContext(depth) {
  const report = analyzeWorkContext(depth);
  assert.equal(report.symbols.maxHops, depth);
  assert.equal(report.symbols.complete, true);
  assert.equal(report.affectedTests.complete, true);
  return {
    symbols: report.symbols.entries.length,
    affectedTests: report.affectedTests.entries.length,
  };
}

function analyzeWorkContext(depth) {
  return workContext.analyze({
    repositoryRoot,
    entity,
    file,
    docsRoot,
    budget: 2000,
    depth,
    engineVersion,
  });
}

function runSeparateHopQueries() {
  const oneHop = analyzeWorkContext(1);
  const twoHop = analyzeWorkContext(2);
  return {
    oneHopSymbols: oneHop.symbols.entries.length,
    twoHopSymbols: twoHop.symbols.entries.length,
    semQueries: 4,
  };
}

function runSharedHopQuery() {
  const twoHop = analyzeWorkContext(2);
  const oneHop = selectWorkContextHops(twoHop.symbols, 1);
  return {
    oneHopSymbols: oneHop.entries.length,
    twoHopSymbols: twoHop.symbols.entries.length,
    semQueries: 2,
  };
}

function runEntityDiff() {
  const revision = revisionReader.read(repositoryRoot);
  const report = advisory.analyzeDiff({
    args: ['--format', 'json'],
    repositoryRoot,
    revision,
    engineVersion,
  });
  assert.equal(report.command, 'diff');
  return { entityChanges: report.payload.changes.length };
}

function benchmark(name, operation) {
  let observed;
  for (let index = 0; index < warmups; index += 1) observed = operation();
  const durations = [];
  for (let index = 0; index < samples; index += 1) {
    const startedAt = performance.now();
    observed = operation();
    durations.push(performance.now() - startedAt);
  }
  durations.sort((left, right) => left - right);
  return {
    name,
    unit: 'milliseconds',
    samples,
    warmups,
    min: round(durations[0]),
    p50: round(percentile(durations, 0.5)),
    p95: round(percentile(durations, 0.95)),
    max: round(durations.at(-1)),
    mean: round(durations.reduce((total, value) => total + value, 0) / durations.length),
    observed,
  };
}

function percentile(sorted, ratio) {
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function round(value) {
  return Math.round(value * 1000) / 1000;
}

function positiveInteger(value, fallback, name) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1)
    throw new Error(`${name} must be a positive integer`);
  return parsed;
}

function nonNegativeInteger(value, fallback, name) {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }
  return parsed;
}

function createFixtureRepository() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-scope-benchmark-'));
  mkdirSync(path.join(root, 'src'), { recursive: true });
  mkdirSync(path.join(root, 'managed'), { recursive: true });
  writeFileSync(
    path.join(root, 'src', 'auth.ts'),
    'export function authenticateUser() { return true; }\n'
  );
  writeFileSync(
    path.join(root, 'managed', 'authentication.md'),
    [
      '---',
      'semEntityId: src/auth.ts::function::authenticateUser',
      'semEntityName: authenticateUser',
      'semEntityType: function',
      'semEntityFile: src/auth.ts',
      '---',
      '# [[authenticateUser]]',
      '',
      'Authentication behavior.',
      '',
    ].join('\n')
  );
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'sem-doc@example.test'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'sem-doc benchmark'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  return root;
}
