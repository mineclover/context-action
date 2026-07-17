const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdirSync, mkdtempSync, writeFileSync } = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  DOCUMENT_BINDING_VALIDATION_SCHEMA,
  DocumentBindingValidationService,
  SemClient,
  renderDocumentBindingValidationText,
} = require('../dist');

const fakeBinary = path.join(__dirname, 'fixtures', 'fake-sem.cjs');

function createFixtureRepository(binding = {}) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'sem-doc-binding-validation-'));
  mkdirSync(path.join(root, 'src'), { recursive: true });
  mkdirSync(path.join(root, 'managed'), { recursive: true });
  writeFileSync(path.join(root, 'src', 'auth.ts'), 'export function authenticateUser() {}\n');
  writeFileSync(
    path.join(root, 'managed', 'authentication.md'),
    [
      '---',
      `semEntityId: ${binding.id ?? 'src/auth.ts::function::authenticateUser'}`,
      `semEntityName: ${binding.name ?? 'authenticateUser'}`,
      `semEntityType: ${binding.type ?? 'function'}`,
      `semEntityFile: ${binding.file ?? 'src/auth.ts'}`,
      '---',
      '# [[Authentication Entry Point]]',
      '',
    ].join('\n')
  );
  writeFileSync(path.join(root, 'managed', 'concept.md'), '# [[Authentication Concept]]\n');
  execFileSync('git', ['init', '-q'], { cwd: root });
  execFileSync('git', ['config', 'user.email', 'sem-doc@example.test'], { cwd: root });
  execFileSync('git', ['config', 'user.name', 'sem-doc test'], { cwd: root });
  execFileSync('git', ['add', '.'], { cwd: root });
  execFileSync('git', ['commit', '-qm', 'fixture'], { cwd: root });
  return root;
}

function validationService() {
  return new DocumentBindingValidationService({
    client: new SemClient({ binary: process.execPath, prefixArgs: [fakeBinary] }),
  });
}

test('validates declared bindings against revision-pinned sem entities', () => {
  const repositoryRoot = createFixtureRepository();
  const report = validationService().analyze({ repositoryRoot, docsRoot: 'managed' });

  assert.equal(report.schemaVersion, DOCUMENT_BINDING_VALIDATION_SCHEMA);
  assert.equal(report.valid, true);
  assert.equal(report.engine.version, '0.21.0');
  assert.deepEqual(report.engine.args, ['--json']);
  assert.equal(report.summary.definitions, 2);
  assert.equal(report.summary.bound, 1);
  assert.equal(report.summary.unbound, 1);
  assert.equal(report.summary.resolved, 1);
  assert.equal(report.summary.errors, 0);
  assert.match(renderDocumentBindingValidationText(report), /Document Entity Bindings: valid/);
});

test('reports missing IDs and mismatched provenance without name fallback', () => {
  const missing = validationService().analyze({
    repositoryRoot: createFixtureRepository({ id: 'src/missing.ts::function::authenticateUser' }),
    docsRoot: 'managed',
    noCache: true,
  });
  assert.equal(missing.valid, false);
  assert.deepEqual(missing.engine.args, ['--no-cache', '--json']);
  assert.equal(missing.issues[0].code, 'missing-sem-entity');

  const mismatch = validationService().analyze({
    repositoryRoot: createFixtureRepository({ type: 'class' }),
    docsRoot: 'managed',
  });
  assert.equal(mismatch.valid, false);
  assert.equal(mismatch.summary.unresolved, 1);
  assert.equal(mismatch.issues[0].code, 'provenance-mismatch');
});
