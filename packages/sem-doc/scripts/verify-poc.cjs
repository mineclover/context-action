#!/usr/bin/env node

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const { WORK_CONTEXT_SCHEMA, SemClient, WorkContextService } = require('../dist');

const invocationCwd = process.cwd();
const repositoryRoot = resolveRepositoryRoot(invocationCwd);
const packageRoot = path.resolve(__dirname, '..');
const packageInvocationPath = path.relative(invocationCwd, packageRoot) || '.';
const binary = process.env.SEM_BIN || 'sem';
const versionProbe = spawnSync(binary, ['--version'], { cwd: repositoryRoot, encoding: 'utf8' });
if (versionProbe.error || versionProbe.status !== 0) {
  process.stderr.write(
    `sem-doc POC requires a working sem binary. Run pnpm install or set SEM_BIN.\n${
      versionProbe.error?.message ?? versionProbe.stderr ?? ''
    }\n`
  );
  process.exitCode = 2;
} else {
  const entity = process.env.SEM_DOC_POC_ENTITY || 'SemClient';
  const file = normalizeInputPath(
    process.env.SEM_DOC_POC_FILE || path.join(packageInvocationPath, 'src/sem-client.ts'),
    invocationCwd,
    repositoryRoot
  );
  const docsRoot = normalizeInputPath(
    process.env.SEM_DOC_POC_DOCS_ROOT || path.join(packageInvocationPath, 'spec'),
    invocationCwd,
    repositoryRoot
  );
  const report = new WorkContextService({
    client: new SemClient({ binary }),
  }).analyze({
    repositoryRoot,
    entity,
    file,
    docsRoot,
    budget: Number(process.env.SEM_DOC_POC_BUDGET || 2000),
  });

  assert.equal(report.schemaVersion, WORK_CONTEXT_SCHEMA);
  assert.equal(report.source, 'sem-doc');
  assert.equal(report.engine.name, 'sem');
  assert.notEqual(report.engine.version, 'unknown');
  assert.equal(report.sem.impact.payload.entity.name, entity);
  assert.ok(report.sem.context.payload.entries.length > 0);
  assert.match(report.revision.workingTreeDigest, /^[a-f0-9]{64}$/);

  process.stdout.write(
    `${JSON.stringify(
      {
        schemaVersion: report.schemaVersion,
        semVersion: report.engine.version,
        entity: report.target.entity,
        impact: report.sem.impact.payload.impact.total,
        contextEntries: report.sem.context.payload.entries.length,
        documentDefinitions: report.documents.target.definitions.length,
        documentBacklinks: report.documents.target.backlinks.length,
        repositoryRoot: path.relative(repositoryRoot, report.repositoryRoot) || '.',
      },
      null,
      2
    )}\n`
  );
}

function resolveRepositoryRoot(cwd) {
  const result = spawnSync('git', ['rev-parse', '--show-toplevel'], {
    cwd,
    encoding: 'utf8',
  });
  if (result.status !== 0 || result.error || !result.stdout.trim()) return cwd;
  return path.resolve(result.stdout.trim());
}

function normalizeInputPath(value, cwd, root) {
  const relative = path.relative(root, path.resolve(cwd, value));
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    if (!relative) return '.';
    throw new Error(`POC path must remain inside the Git repository: ${value}`);
  }
  return relative.split(path.sep).join('/');
}
