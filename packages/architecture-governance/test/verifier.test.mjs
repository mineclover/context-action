import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  access,
  chmod,
  cp,
  lstat,
  mkdir,
  mkdtemp,
  realpath,
  readdir,
  readFile,
  rm,
  symlink,
  stat,
  truncate,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  appendSemExecutionFailure,
  collectSymbolHistory,
  collectSymbolSnapshot,
  assertKnownFields,
  assertSemChangeSetIntegrity,
  assertSemProjectAnalysisIntegrity,
  assertVerificationReport,
  boundedDiagnosticList,
  canonicalRepositoryRoot,
  compileGlobPatterns,
  diagnosticErrorMessage,
  diagnosticSystemErrorCode,
  globPatternIssue,
  inspectExistingRepositoryPath,
  InputContractError,
  loadArchitecturePolicySet,
  matchesAny,
  MAX_ARCHITECTURE_COLLECTION_ITEMS,
  MAX_ARCHITECTURE_REFERENCE_ITEMS,
  MAX_ARCHITECTURE_TEXT_CHARS,
  MAX_UNKNOWN_FIELD_DIAGNOSTIC_ITEMS,
  MAX_UNKNOWN_FIELD_NAME_CHARS,
  MAX_IMPACT_POLICY_EVALUATION_OPERATIONS,
  MAX_ERROR_DIAGNOSTIC_CHARS,
  MAX_GLOB_MATCH_VALUE_CHARS,
  MAX_GLOB_PATTERN_CHARS,
  MAX_GLOB_PATTERN_SET_COMPLEXITY,
  parseSemEntities,
  parseArchitectureRegistry,
  parseSemDiff,
  parseSemImpact,
  readBoundedJsonFile,
  renderConsoleReport,
  renderJsonReport,
  renderMarkdownReport,
  reportFailsAt,
  requireExistingRepositoryPath,
  resolveRepositoryPath,
  resolveSemExecutionLimits,
  runSemDiff,
  runSemProjectAnalysis,
  runSemVersion,
  safeOutputRepositoryPath,
  semAnalysisCollectionEvidenceItems,
  semAnalysisCollectionEvidenceTextCharacters,
  SemExecutionError,
  toInputContractError,
  MAX_PACKAGE_MANIFEST_BYTES,
  MAX_SEM_CHANGE_EVIDENCE_ITEMS,
  MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT,
  MAX_SEM_EVIDENCE_ITEMS_TOTAL,
  MAX_SEM_EVIDENCE_TEXT_CHARS,
  MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL,
  MAX_SEM_FAILURE_TEXT_CHARS,
  MAX_SEM_IMPACT_QUERIES_PER_PROJECT,
  MAX_SEM_VERSION_OUTPUT_CHARS,
  MAX_VERIFICATION_REPORT_COLLECTION_ITEMS,
  MAX_VERIFICATION_REPORT_PROJECT_ITEMS,
  MAX_VERIFICATION_REPORT_TEXT_CHARS,
  MAX_VERIFICATION_REPORT_TEXT_CHARS_TOTAL,
  SUPPORTED_SEM_VERSION,
  verifyArchitecture,
} from '../dist/index.js';

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);

test('bounds and sanitizes unknown-field diagnostics', () => {
  const fields = Object.fromEntries(Array.from(
    { length: 10_000 },
    (_, index) => [`unknown-${index}`, true],
  ));
  assert.throws(
    () => assertKnownFields(fields, [], 'fixture'),
    (error) => {
      assert.equal(error instanceof InputContractError, true);
      assert.match(error.message, /unknown-0, unknown-1/);
      assert.match(error.message, /additional fields omitted/);
      assert.doesNotMatch(error.message, /unknown-8(?:\D|$)/);
      assert.ok(error.message.length < 512, error.message);
      return true;
    },
  );

  const longName = 'x'.repeat(1_000_000);
  const unsafeNames = {
    [longName]: true,
    ['\n\u001b[31m\ud800']: true,
    ['\u2066\u2069']: true,
  };
  assert.throws(
    () => assertKnownFields(unsafeNames, [], 'fixture'),
    (error) => {
      assert.equal(error instanceof InputContractError, true);
      assert.ok(
        error.message.length
          < (MAX_UNKNOWN_FIELD_DIAGNOSTIC_ITEMS * MAX_UNKNOWN_FIELD_NAME_CHARS) + 256,
        error.message,
      );
      assert.doesNotMatch(error.message, /\n|\u001b|\ud800/u);
      assert.match(error.message, /<non-visible>/);
      assert.equal(error.message.includes(longName), false);
      return true;
    },
  );
});

test('CLI intersects project-qualified serialized symbol contexts', async () => {
  const root = await fixture();
  const leftPath = path.join(root, 'left.json');
  const rightPath = path.join(root, 'right.json');
  await writeFile(leftPath, JSON.stringify({
    id: 'design',
    symbols: [
      { projectId: 'core', entityId: 'class::Core', filePath: 'packages/core/src/index.ts', symbol: 'class::Core', kind: 'class' },
      { projectId: 'react', entityId: 'function::View', filePath: 'packages/react/src/view.ts', symbol: 'function::View', kind: 'function' },
    ],
  }));
  await writeFile(rightPath, JSON.stringify({
    id: 'architecture',
    symbols: [
      { projectId: 'core', entityId: 'class::Core', filePath: 'packages/core/src/index.ts', symbol: 'class::Core', kind: 'class' },
      { projectId: 'core', entityId: 'function::Other', filePath: 'packages/core/src/index.ts', symbol: 'function::Other', kind: 'function' },
    ],
  }));
  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'intersect',
    '--root', root,
    '--left', 'left.json',
    '--right', 'right.json',
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0);
  const report = JSON.parse(result.stdout);
  assert.equal(report.contractId, 'context-action/symbol-context-comparison');
  assert.deepEqual(report.intersection.map((entry) => entry.symbol), ['class::Core']);
  assert.deepEqual(report.onlyLeft.map((entry) => entry.symbol), ['function::View']);
  assert.deepEqual(report.onlyRight.map((entry) => entry.symbol), ['function::Other']);
});

test('CLI diffs complete serialized symbol snapshots', async () => {
  const root = await fixture();
  const leftPath = path.join(root, 'left-snapshot.json');
  const rightPath = path.join(root, 'right-snapshot.json');
  const entry = {
    projectId: 'core',
    entityId: 'src/index.ts::class::Core',
    filePath: 'src/index.ts',
    symbol: 'class::Core',
    kind: 'class',
    name: 'Core',
    startLine: 1,
    endLine: 1,
  };
  const snapshot = (revision, symbols) => ({
    contractId: 'context-action/symbol-snapshot',
    contractVersion: '1.1',
    repositoryRoot: root,
    revision: { commit: revision },
    projects: [{ id: 'core', root: 'packages/core' }],
    projectStatuses: [{ projectId: 'core', root: 'packages/core', status: 'analyzed' }],
    symbols,
  });
  await writeFile(leftPath, JSON.stringify(snapshot('base', [entry])));
  await writeFile(rightPath, JSON.stringify(snapshot('next', [{ ...entry, endLine: 3 }])));
  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'snapshot-diff',
    '--root', root,
    '--left', 'left-snapshot.json',
    '--right', 'right-snapshot.json',
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.contractId, 'context-action/symbol-snapshot-diff');
  assert.equal(report.beforeRevision, 'base');
  assert.equal(report.afterRevision, 'next');
  assert.equal(report.modified.length, 1);
  assert.equal(report.modified[0].after.endLine, 3);
});

test('bounds error diagnostics without coercing hostile thrown objects', () => {
  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      throw new Error('hostile coercion');
    },
  };
  assert.equal(diagnosticErrorMessage(hostile), 'Non-Error value thrown');
  assert.equal(coercions, 0);

  const longError = new Error(`line one\n${'x'.repeat(100_000)}`);
  const longMessage = diagnosticErrorMessage(longError);
  assert.ok(longMessage.length <= MAX_ERROR_DIAGNOSTIC_CHARS, longMessage);
  assert.doesNotMatch(longMessage, /\n/);
  assert.match(longMessage, /…$/u);

  const inaccessibleMessage = new Error('placeholder');
  Object.defineProperty(inaccessibleMessage, 'message', {
    get() {
      throw hostile;
    },
  });
  assert.equal(
    diagnosticErrorMessage(inaccessibleMessage),
    'Error value could not be inspected',
  );
  assert.equal(coercions, 0);

  const inaccessibleCode = {};
  Object.defineProperty(inaccessibleCode, 'code', {
    get() {
      throw hostile;
    },
  });
  assert.equal(diagnosticSystemErrorCode(inaccessibleCode), undefined);
  assert.equal(coercions, 0);
});

test('input error conversion bounds labels without coercion', () => {
  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      throw new Error('hostile coercion');
    },
  };
  const converted = toInputContractError(hostile, hostile);
  assert.ok(converted instanceof InputContractError);
  assert.equal(
    converted.message,
    'Input validation failed: Non-Error value thrown',
  );

  const existing = new InputContractError('existing contract error');
  assert.equal(toInputContractError(existing, hostile), existing);

  const bounded = toInputContractError(
    new Error('failure'),
    `line one\n${'x'.repeat(100_000)}`,
  );
  assert.doesNotMatch(bounded.message, /\n/);
  assert.ok(bounded.message.length < 256, bounded.message);
  assert.match(bounded.message, /…: failure$/u);
  assert.equal(coercions, 0);
});

test('exact-field diagnostics bound iterables and normalize hostile traps', () => {
  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      throw new Error('hostile coercion');
    },
  };
  const hostileFields = new Proxy({}, {
    ownKeys() {
      throw hostile;
    },
  });
  assert.throws(
    () => assertKnownFields(hostileFields, [], 'fixture'),
    (error) => {
      assert.ok(error instanceof InputContractError);
      assert.equal(
        error.message,
        'fixture field inspection failed: Non-Error value thrown',
      );
      return true;
    },
  );
  const hostileAllowed = {
    [Symbol.iterator]() {
      throw hostile;
    },
  };
  assert.throws(
    () => assertKnownFields({}, hostileAllowed, 'fixture'),
    /fixture field inspection failed: Non-Error value thrown/,
  );
  const unboundedAllowed = {
    *[Symbol.iterator]() {
      while (true) yield 'duplicate';
    },
  };
  assert.throws(
    () => assertKnownFields({}, unboundedAllowed, 'fixture'),
    /Known-field allow list exceeds 4096 item limit/,
  );
  assert.equal(coercions, 0);
});

test('diagnostic lists bound iteration and normalize hostile values', () => {
  let pulls = 0;
  const unbounded = {
    [Symbol.iterator]() {
      return {
        next() {
          pulls += 1;
          return { done: false, value: `value-${pulls}` };
        },
        return() {
          return { done: true };
        },
      };
    },
  };
  const rendered = boundedDiagnosticList(unbounded);
  assert.equal(pulls, 9);
  assert.match(rendered, /additional values omitted/);
  assert.doesNotMatch(rendered, /value-9(?:\D|$)/);

  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      throw new Error('hostile coercion');
    },
  };
  const hostileIterator = {
    [Symbol.iterator]() {
      return {
        next() {
          throw hostile;
        },
      };
    },
  };
  assert.throws(
    () => boundedDiagnosticList(hostileIterator),
    /Diagnostic list rendering failed: Non-Error value thrown/,
  );
  assert.throws(
    () => boundedDiagnosticList([hostile]),
    (error) => {
      assert.ok(error instanceof InputContractError);
      assert.equal(error.message, 'Diagnostic list values must be strings');
      return true;
    },
  );
  assert.equal(coercions, 0);
});

test('verifier isolates hostile thrown sem evidence without coercion', async () => {
  const root = await fixture();
  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      throw new Error('hostile coercion');
    },
  };
  const entity = coreEntity();
  Object.defineProperty(entity, 'id', {
    enumerable: true,
    get() {
      throw hostile;
    },
  });
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [{ ...analysis(root), entities: [entity] }],
  });
  const finding = report.findings.find((entry) =>
    entry.code === 'SEM_ANALYSIS_EVIDENCE_INVALID');
  assert.equal(finding?.message, 'Non-Error value thrown');
  assert.equal(coercions, 0);
});

test('report helpers reject serialization hooks and normalize hostile getters', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  let hookExecutions = 0;
  const hookedReport = { ...report };
  Object.defineProperty(hookedReport, 'toJSON', {
    get() {
      hookExecutions += 1;
      throw new Error('serialization hook executed');
    },
  });
  assert.throws(
    () => renderJsonReport(hookedReport),
    /report must not define toJSON serialization hooks/,
  );
  assert.equal(hookExecutions, 0);

  const hookedFindings = [...report.findings];
  Object.defineProperty(hookedFindings, 'toJSON', {
    value() {
      hookExecutions += 1;
      return [];
    },
  });
  assert.throws(
    () => renderJsonReport({ ...report, findings: hookedFindings }),
    /report must not define toJSON serialization hooks/,
  );
  assert.equal(hookExecutions, 0);

  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      throw new Error('hostile coercion');
    },
  };
  const getterReport = { ...report };
  Object.defineProperty(getterReport, 'summary', {
    enumerable: true,
    get() {
      throw hostile;
    },
  });
  assert.throws(
    () => assertVerificationReport(getterReport),
    (error) => {
      assert.equal(error instanceof InputContractError, true);
      assert.match(
        error.message,
        /Report validation failed: Non-Error value thrown/,
      );
      return true;
    },
  );
  assert.equal(coercions, 0);
});

async function fixture() {
  const root = await mkdtemp(path.join(tmpdir(), 'arch-governance-'));
  await mkdir(path.join(root, 'packages/core/src'), { recursive: true });
  await mkdir(path.join(root, 'packages/core/test'), { recursive: true });
  await mkdir(path.join(root, 'packages/react/src'), { recursive: true });
  await mkdir(path.join(root, 'docs'), { recursive: true });
  await writeFile(path.join(root, 'packages/core/src/index.ts'), 'export class Core {}\n');
  await writeFile(path.join(root, 'packages/core/test/core.test.ts'), 'export {};\n');
  await writeFile(path.join(root, 'packages/react/src/view.ts'), 'export function View() {}\n');
  await writeFile(path.join(root, 'docs/core.md'), '# Core\n');
  await writeFile(path.join(root, 'packages/core/package.json'), JSON.stringify({ name: '@fixture/core', dependencies: {} }));
  return root;
}

function gitRepositoryCommand(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function registry(overrides = {}) {
  return {
    schemaVersion: 1,
    analysisProjects: [{ id: 'core', root: 'packages/core' }],
    capabilities: [{
      id: 'CA-CORE',
      status: 'verified',
      project: 'core',
      spec: 'docs/core.md',
      owners: ['packages/core'],
      implementationAnchors: ['packages/core/src/index.ts::class::Core'],
      testEvidence: ['packages/core/test/core.test.ts'],
      publicDocs: ['docs/core.md'],
      ...overrides,
    }],
  };
}

function coreEntity() {
  return {
    id: 'packages/core/src/index.ts::class::Core',
    file: 'packages/core/src/index.ts',
    name: 'Core',
    kind: 'class',
    startLine: 1,
    endLine: 1,
  };
}

function analysis(root, dependencies = [], dependents = []) {
  return {
    projectId: 'core',
    root: path.join(root, 'packages/core'),
    entities: [coreEntity()],
    impacts: [{
      entity: {
        entityId: coreEntity().id,
        file: coreEntity().file,
        name: 'Core',
        kind: 'class',
      },
      dependencies,
      dependents,
      tests: [],
    }],
  };
}

test('supported SEM version matches the pinned workspace dependency', async () => {
  const packageManifest = JSON.parse(await readFile(
    new URL('../package.json', import.meta.url),
    'utf8',
  ));
  assert.equal(
    packageManifest.dependencies['@ataraxy-labs/sem'],
    SUPPORTED_SEM_VERSION,
  );
  assert.equal(
    packageManifest.devDependencies['@ataraxy-labs/sem'],
    undefined,
  );
  const previousCommand = process.env.SEM_COMMAND;
  process.env.SEM_COMMAND = '';
  try {
    assert.equal(
      runSemVersion({ repositoryRoot: await fixture() }),
      `sem ${SUPPORTED_SEM_VERSION}`,
    );
  } finally {
    if (previousCommand === undefined) delete process.env.SEM_COMMAND;
    else process.env.SEM_COMMAND = previousCommand;
  }
});

test('default sem command resolves an npm-hoisted binary', async () => {
  const applicationRoot = await mkdtemp(path.join(tmpdir(), 'arch-hoisted-sem-'));
  const installedPackageRoot = path.join(
    applicationRoot,
    'node_modules/@context-action/architecture-governance',
  );
  await mkdir(installedPackageRoot, { recursive: true });
  await writeFile(
    path.join(installedPackageRoot, 'package.json'),
    JSON.stringify({ type: 'module' }),
  );
  await cp(
    fileURLToPath(new URL('../dist', import.meta.url)),
    path.join(installedPackageRoot, 'dist'),
    { recursive: true },
  );

  const extension = process.platform === 'win32' ? '.cmd' : '';
  const hoistedCommand = path.join(
    applicationRoot,
    'node_modules/.bin',
    `sem${extension}`,
  );
  await mkdir(path.dirname(hoistedCommand), { recursive: true });
  await writeFile(
    hoistedCommand,
    process.platform === 'win32'
      ? '@echo off\r\necho sem 0.21.0\r\n'
      : `#!${process.execPath}\nprocess.stdout.write('sem 0.21.0\\n');\n`,
  );
  await chmod(hoistedCommand, 0o755);

  const installedLibrary = await import(
    `${pathToFileURL(path.join(installedPackageRoot, 'dist/index.js')).href}?hoisted`
  );
  assert.equal(
    installedLibrary.defaultSemCommand(),
    await realpath(hoistedCommand),
  );
  if (process.platform !== 'win32') {
    assert.equal(
      installedLibrary.runSemVersion({ repositoryRoot: applicationRoot }),
      'sem 0.21.0',
    );
  }
});

test('passes a traceable verified capability with sem entity evidence', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [analysis(root)],
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{ id: 'CORE-NO-REACT', from: 'packages/core', disallow: ['react'] }],
    }],
  });
  assert.equal(report.passed, true);
  assert.equal(report.findings.length, 0);
  assert.equal(report.contractVersion, '2.4');
});

test('collects usage files from SEM dependents for registered symbols', async () => {
  const root = await fixture();
  const dependent = {
    entityId: 'packages/core/test/core.test.ts::test_suite::Core usage',
    file: 'packages/core/test/core.test.ts',
    name: 'Core usage',
    kind: 'test_suite',
  };
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [analysis(root, [], [dependent, {
      ...dependent,
      entityId: 'packages/core/test/core.test.ts::test::Core usage assertion',
      name: 'Core usage assertion',
    }])],
    semVersion: 'sem 0.21.0',
  });
  assert.deepEqual(report.symbolUsages, [{
    capabilityId: 'CA-CORE',
    anchor: 'packages/core/src/index.ts::class::Core',
    projectId: 'core',
    definition: {
      file: 'packages/core/src/index.ts',
      startLine: 1,
      endLine: 1,
    },
    usageFiles: ['packages/core/test/core.test.ts'],
  }]);
  assert.match(renderMarkdownReport(report), /Symbol Usage Files/);
});

test('direct verifier defaults omitted projects and rejects explicit empty inputs', async () => {
  const root = await fixture();
  const defaulted = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: {
      schemaVersion: 1,
      capabilities: [],
    },
  });
  assert.equal(defaulted.passed, true);
  assert.equal(defaulted.findings.length, 0);

  const empty = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: {
      schemaVersion: 1,
      analysisProjects: [],
      capabilities: [],
    },
    policies: [{ schemaVersion: 1 }],
  });
  assert.deepEqual(new Set(empty.findings.map((entry) => entry.code)), new Set([
    'ANALYSIS_PROJECT_REQUIRED',
    'POLICY_SET_EMPTY',
  ]));

  await assert.rejects(
    verifyArchitecture({
      root,
      registryPath: path.join(root, '..', 'outside-registry.json'),
      registry: { schemaVersion: 1, capabilities: [] },
    }),
    /Registry path escapes repository root/,
  );
});

test('direct verifier fails closed on invalid runtime discriminators', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    failOn: 'fatal',
    registry: { schemaVersion: 2, capabilities: [] },
    policies: [{
      schemaVersion: 2,
      impactBoundaries: [{
        id: 'UNSUPPORTED-POLICY',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
      }],
    }],
  });
  assert.equal(report.passed, false);
  assert.equal(report.failOn, 'error');
  assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
    'FAIL_THRESHOLD_INVALID',
    'POLICY_SCHEMA_VERSION_UNSUPPORTED',
    'REGISTRY_SCHEMA_VERSION_UNSUPPORTED',
  ]));
  assert.equal(reportFailsAt(report, report.failOn), true);
});

test('direct verifier rejects unknown option fields before gate fallback', async () => {
  const root = await fixture();
  await assert.rejects(
    verifyArchitecture({
      root,
      registryPath: 'architecture/registry.json',
      registry: { schemaVersion: 1, capabilities: [] },
      policies: [{
        schemaVersion: 1,
        impactBoundaries: [{
          id: 'MISSING-SEM',
          from: ['packages/core/**'],
          disallowDependencies: ['packages/react/**'],
          missingEvidenceSeverity: 'warning',
        }],
      }],
      failOnn: 'warning',
    }),
    /Verification options contain unknown field: failOnn/,
  );
});

test('direct verifier isolates invalid capability and policy enums', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ status: 'done' }),
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{
        id: 'BAD-PACKAGE-SEVERITY',
        from: 'packages/core',
        disallow: ['react'],
        severity: 'critical',
      }],
      impactBoundaries: [{
        id: 'BAD-IMPACT-SEVERITY',
        project: 'core',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
        severity: 'critical',
      }, {
        id: 'BAD-MISSING-EVIDENCE-SEVERITY',
        project: 'core',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
        missingEvidenceSeverity: 'fatal',
      }],
    }],
  });

  assert.equal(report.passed, false);
  assert.equal(report.capabilities[0].status, 'planned');
  assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
    'CAPABILITY_STATUS_INVALID',
    'PACKAGE_POLICY_SEVERITY_INVALID',
    'SEM_POLICY_MISSING_EVIDENCE_SEVERITY_INVALID',
    'SEM_POLICY_SEVERITY_INVALID',
  ]));
  assert.ok(report.findings.every((entry) => entry.severity === 'error'));
  assert.equal(report.summary.errors, 4);
});

test('direct verifier fail-closes malformed structured inputs without throwing', async () => {
  const root = await fixture();
  const cases = [{
    name: 'non-array capabilities',
    options: { registry: { schemaVersion: 1, capabilities: null } },
    code: 'REGISTRY_INPUT_INVALID',
  }, {
    name: 'malformed capability evidence',
    options: {
      registry: registry({ owners: null }),
    },
    code: 'REGISTRY_INPUT_INVALID',
  }, {
    name: 'non-object policy set',
    options: {
      registry: { schemaVersion: 1, capabilities: [] },
      policies: [null],
    },
    code: 'POLICY_INPUT_INVALID',
  }, {
    name: 'malformed impact rule',
    options: {
      registry: { schemaVersion: 1, capabilities: [] },
      policies: [{
        schemaVersion: 1,
        impactBoundaries: [{
          id: 'MALFORMED-IMPACT',
          from: null,
          disallowDependencies: ['packages/react/**'],
        }],
      }],
    },
    code: 'POLICY_INPUT_INVALID',
  }, {
    name: 'malformed dependency fields',
    options: {
      registry: { schemaVersion: 1, capabilities: [] },
      policies: [{
        schemaVersion: 1,
        packageBoundaries: [{
          id: 'MALFORMED-PACKAGE',
          from: 'packages/core',
          disallow: ['react'],
          dependencyFields: 42,
        }],
      }],
    },
    code: 'POLICY_INPUT_INVALID',
  }, {
    name: 'non-array sem analyses',
    options: {
      registry: { schemaVersion: 1, capabilities: [] },
      semAnalyses: {},
    },
    code: 'SEM_ANALYSES_INPUT_INVALID',
  }, {
    name: 'non-array policy collection',
    options: {
      registry: { schemaVersion: 1, capabilities: [] },
      policies: {},
    },
    code: 'POLICIES_INPUT_INVALID',
  }];

  for (const { name, options, code } of cases) {
    const report = await verifyArchitecture({
      root,
      registryPath: 'architecture/registry.json',
      ...options,
    });
    assert.equal(report.passed, false, name);
    assert.ok(report.findings.some((entry) => entry.code === code), name);
  }

  const invisible = ' \u202e\t';
  const invisibleProvenance = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ id: invisible, spec: invisible }),
  });
  assert.equal(invisibleProvenance.passed, false);
  assert.deepEqual(invisibleProvenance.capabilities, []);
  assert.ok(invisibleProvenance.findings.some((entry) =>
    entry.code === 'CAPABILITY_ID_INVALID'));
  assert.ok(invisibleProvenance.findings.some((entry) =>
    entry.code === 'SPEC_PATH_MISSING'));
  assert.ok(invisibleProvenance.findings.every((entry) =>
    entry.capabilityId === undefined && entry.path === undefined));
  assert.doesNotThrow(() => assertVerificationReport(invisibleProvenance));

  const malformedUnicodeProvenance = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ id: 'CA-BROKEN\ud800' }),
  });
  assert.equal(malformedUnicodeProvenance.passed, false);
  assert.deepEqual(malformedUnicodeProvenance.capabilities, []);
  assert.ok(malformedUnicodeProvenance.findings.every((entry) =>
    entry.message.isWellFormed()));
  assert.doesNotThrow(() => assertVerificationReport(malformedUnicodeProvenance));

  const failClosedEvaluation = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
    evaluateImpactPolicies: 'no',
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'EVALUATE-FAIL-CLOSED',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
      }],
    }],
  });
  assert.deepEqual(new Set(failClosedEvaluation.findings.map((entry) => entry.code)), new Set([
    'IMPACT_POLICY_EVALUATION_INVALID',
    'SEM_EVIDENCE_MISSING',
  ]));
});

test('public verifier and path APIs reject invalid provenance with contract errors', async () => {
  const root = await fixture();
  const validRegistry = { schemaVersion: 1, capabilities: [] };
  const invalidVerifierInputs = [
    null,
    { root: null, registryPath: 'architecture/registry.json', registry: validRegistry },
    { root: '', registryPath: 'architecture/registry.json', registry: validRegistry },
    { root: ' \u202e\t', registryPath: 'architecture/registry.json', registry: validRegistry },
    { root, registryPath: null, registry: validRegistry },
    { root, registryPath: '', registry: validRegistry },
    { root, registryPath: ' \u202e\t', registry: validRegistry },
  ];
  for (const options of invalidVerifierInputs) {
    await assert.rejects(
      verifyArchitecture(options),
      (error) => error instanceof InputContractError && !(error instanceof TypeError),
    );
  }

  await assert.rejects(
    canonicalRepositoryRoot(null),
    (error) => error instanceof InputContractError && !(error instanceof TypeError),
  );
  assert.throws(
    () => resolveRepositoryPath(root, null, 'Path'),
    InputContractError,
  );
  assert.throws(
    () => resolveRepositoryPath(root, 'packages/core', 'Path', 'yes'),
    /allowAbsolute must be boolean/,
  );
  for (const [candidate, message] of [
    ['packages/core\0hidden', /must not contain null bytes/],
    [`packages/${String.fromCharCode(0xd800)}`, /must contain well-formed Unicode/],
  ]) {
    assert.throws(
      () => resolveRepositoryPath(root, candidate, 'Path'),
      (error) => {
        assert.ok(error instanceof InputContractError);
        assert.equal(error instanceof TypeError, false);
        assert.match(error.message, message);
        return true;
      },
    );
  }
  await assert.rejects(
    inspectExistingRepositoryPath(root, null),
    InputContractError,
  );
  await assert.rejects(
    requireExistingRepositoryPath(root, '.', 'Project root', 'socket'),
    /expectedType must be file or directory/,
  );
  const canonicalRoot = await realpath(root);
  await assert.rejects(
    safeOutputRepositoryPath(canonicalRoot, '.'),
    /Output path must be a file when it already exists/,
  );
  await writeFile(path.join(root, 'output-parent-file'), 'not a directory\n');
  await assert.rejects(
    safeOutputRepositoryPath(canonicalRoot, 'output-parent-file/report.json'),
    /Existing output path parent must be a directory/,
  );
});

test('bounds direct verifier policy and analysis input collections', async () => {
  const root = await fixture();
  const oversizedCollection = Array.from(
    { length: MAX_ARCHITECTURE_COLLECTION_ITEMS + 1 },
    () => null,
  );
  const policyReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    policies: oversizedCollection,
  });
  assert.deepEqual(policyReport.findings.map((entry) => entry.code), [
    'POLICY_SET_LIMIT_EXCEEDED',
  ]);

  const analysisReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: oversizedCollection,
  });
  assert.deepEqual(analysisReport.findings.map((entry) => entry.code), [
    'SEM_ANALYSES_LIMIT_EXCEEDED',
  ]);

  const registryReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: {
      schemaVersion: 1,
      capabilities: Array.from(
        { length: MAX_ARCHITECTURE_COLLECTION_ITEMS + 1 },
        (_, index) => ({
          id: `CA-OVERSIZED-${index}`,
          status: 'invalid',
          spec: 'docs/core.md',
          owners: [],
          implementationAnchors: [],
          testEvidence: [],
          publicDocs: [],
        }),
      ),
    },
  });
  assert.deepEqual(registryReport.findings.map((entry) => entry.code), [
    'REGISTRY_INPUT_INVALID',
  ]);

  const oversizedTextReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({
      id: `CA-${'A'.repeat(MAX_ARCHITECTURE_TEXT_CHARS)}`,
    }),
  });
  assert.deepEqual(oversizedTextReport.findings.map((entry) => entry.code), [
    'REGISTRY_INPUT_INVALID',
  ]);
  assert.match(
    oversizedTextReport.findings[0]?.message ?? '',
    new RegExp(`${MAX_ARCHITECTURE_TEXT_CHARS} character limit`),
  );
  assert.doesNotThrow(() => assertVerificationReport(oversizedTextReport));

  const policies = Array.from({ length: 3 }, (_, policyIndex) => ({
    schemaVersion: 1,
    impactBoundaries: Array.from({ length: 2048 }, (_, ruleIndex) => ({
      id: `IMPACT-${policyIndex}-${ruleIndex}`,
      from: [`packages/core/source-${ruleIndex}`],
      disallowDependencies: [`packages/react/dependency-${ruleIndex}`],
    })),
  }));
  const aggregateReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    policies,
    evaluateImpactPolicies: false,
  });
  assert.deepEqual(aggregateReport.findings.map((entry) => entry.code), [
    'POLICY_REFERENCE_LIMIT_EXCEEDED',
  ]);
  assert.match(
    aggregateReport.findings[0]?.message ?? '',
    new RegExp(`global limit of ${MAX_ARCHITECTURE_REFERENCE_ITEMS} reference items`),
  );
});

test('async path APIs preserve repository identity through a root symlink', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
    return;
  }
  const root = await fixture();
  const canonicalRoot = await realpath(root);
  const rootAlias = `${root}-alias`;
  await symlink(root, rootAlias, 'dir');

  assert.equal(await canonicalRepositoryRoot(rootAlias), canonicalRoot);
  assert.equal(
    await requireExistingRepositoryPath(
      rootAlias,
      'packages/core/src/index.ts',
      'Source path',
      'file',
    ),
    path.join(canonicalRoot, 'packages/core/src/index.ts'),
  );
  assert.equal(
    await requireExistingRepositoryPath(
      rootAlias,
      path.join(rootAlias, 'packages/core/src/index.ts'),
      'Authored absolute source path',
      'file',
    ),
    path.join(canonicalRoot, 'packages/core/src/index.ts'),
  );
  assert.equal(
    await requireExistingRepositoryPath(
      rootAlias,
      path.join(canonicalRoot, 'packages/core/src/index.ts'),
      'Canonical absolute source path',
      'file',
    ),
    path.join(canonicalRoot, 'packages/core/src/index.ts'),
  );
  const canonicalDocument = path.join(canonicalRoot, 'docs/core.md');
  const documentAlias = path.join(canonicalRoot, 'docs/core-alias.md');
  await symlink(canonicalDocument, documentAlias);
  assert.equal(
    await requireExistingRepositoryPath(
      rootAlias,
      documentAlias,
      'Internal symlink source path',
      'file',
    ),
    canonicalDocument,
  );
  assert.deepEqual(
    await inspectExistingRepositoryPath(
      rootAlias,
      'packages/core/src/index.ts',
    ),
    {
      status: 'inside',
      resolved: path.join(canonicalRoot, 'packages/core/src/index.ts'),
    },
  );
  assert.equal(
    await safeOutputRepositoryPath(rootAlias, 'reports/report.json'),
    path.join(canonicalRoot, 'reports/report.json'),
  );
});

test('public input and sem APIs reject malformed option objects with contract errors', async () => {
  const root = await fixture();
  for (const operation of [
    () => resolveSemExecutionLimits(null),
    () => resolveSemExecutionLimits({ timeoutMs: '100' }),
    () => resolveSemExecutionLimits({ maxOutputBytes: '1024' }),
    () => resolveSemExecutionLimits({ env: { SEM_TIMEOUT_MS: 100 } }),
    () => assertSemProjectAnalysisIntegrity(null),
    () => assertSemChangeSetIntegrity(null),
    () => runSemVersion(null),
    () => runSemDiff(null),
    () => runSemProjectAnalysis(null),
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      aggregateOutputBudget: {
        label: 'invalid aggregate budget',
        limitBytes: 1,
        usedBytes: 2,
      },
    }),
    () => runSemVersion({
      repositoryRoot: root,
      aggregateOutputBudget: {
        label: 'invalid aggregate budget',
        limitBytes: 1,
        usedBytes: 2,
      },
    }),
    () => runSemDiff({
      repositoryRoot: root,
      aggregateOutputBudget: {
        label: 'invalid aggregate budget',
        limitBytes: 1,
        usedBytes: 2,
      },
    }),
  ]) {
    assert.throws(
      operation,
      (error) => error instanceof InputContractError && !(error instanceof TypeError),
    );
  }

  for (const value of ['1e3', '0x100', '+25', '01']) {
    assert.throws(
      () => resolveSemExecutionLimits({ env: { SEM_TIMEOUT_MS: value } }),
      /canonical base-10 positive integer/,
    );
  }

  await assert.rejects(
    readBoundedJsonFile(path.join(root, 'docs/core.md'), null),
    (error) => error instanceof InputContractError && !(error instanceof TypeError),
  );
  await assert.rejects(
    readBoundedJsonFile(null, { label: 'fixture', maxBytes: 1024 }),
    (error) => error instanceof InputContractError && !(error instanceof TypeError),
  );
  assert.throws(
    () => parseSemDiff({ changes: [] }, { mode: 'working', from: 'unexpected' }),
    /sem diff source contains unknown field: from/,
  );
  assert.throws(
    () => runSemDiff({ repositoryRoot: root, from: ' \u202e\t', to: 'head' }),
    /non-empty string containing visible text/,
  );
});

test('normalized sem evidence rejects unknown model fields', async () => {
  const root = await fixture();
  const project = { id: 'core', root: 'packages/core' };
  const analysisMutations = [
    (value) => { value.extra = true; },
    (value) => { value.entities[0].extra = true; },
    (value) => { value.impacts[0].extra = true; },
    (value) => { value.impacts[0].entity.extra = true; },
  ];
  for (const mutate of analysisMutations) {
    const value = structuredClone(analysis(root));
    mutate(value);
    assert.throws(
      () => assertSemProjectAnalysisIntegrity({
        repositoryRoot: root,
        project,
        analysis: value,
      }),
      /contains unknown field: extra/,
    );
  }

  const changeMutations = [
    (value) => { value.extra = true; },
    (value) => { value.changes[0].extra = true; },
    (value) => { value.binaryChanges[0].extra = true; },
  ];
  for (const mutate of changeMutations) {
    const value = {
      source: { mode: 'working' },
      changes: [{
        entityId: coreEntity().id,
        changeType: 'modified',
        filePath: coreEntity().file,
      }],
      binaryChanges: [{ filePath: 'docs/core.md', status: 'modified' }],
    };
    mutate(value);
    assert.throws(
      () => assertSemChangeSetIntegrity({ repositoryRoot: root, changeSet: value }),
      /contains unknown field: extra/,
    );
  }

  assert.throws(
    () => assertSemProjectAnalysisIntegrity({
      repositoryRoot: root,
      project: { id: ' \u202e\t', root: 'packages/core' },
      analysis: { ...analysis(root), projectId: ' \u202e\t' },
    }),
    /project\.id must be a non-empty string containing visible text/,
  );
});

test('normalized sem evidence rejects duplicate impact relation IDs', async () => {
  const root = await fixture();
  const project = { id: 'core', root: 'packages/core' };
  const related = {
    entityId: 'packages/react/src/view.ts::function::View',
    file: 'packages/react/src/view.ts',
    name: 'View',
    kind: 'function',
  };

  for (const field of ['dependencies', 'dependents', 'tests']) {
    const value = analysis(root);
    value.impacts[0][field] = [related, { ...related }];
    assert.throws(
      () => assertSemProjectAnalysisIntegrity({
        repositoryRoot: root,
        project,
        analysis: value,
      }),
      new RegExp(`sem impact ${field} contains duplicate entity ID`),
    );
  }
});

test('bounds direct and parsed sem project evidence cardinality before traversal', async () => {
  const root = await fixture();
  const project = { id: 'core', root: 'packages/core' };
  const normalizedRelated = {
    entityId: 'packages/core/src/index.ts::function::Dependency',
    file: 'packages/core/src/index.ts',
    name: 'Dependency',
    kind: 'function',
  };
  const providerRelated = {
    entityId: normalizedRelated.entityId,
    file: normalizedRelated.file,
    name: normalizedRelated.name,
    type: normalizedRelated.kind,
  };
  const oversizedRelations = new Array(
    MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT + 1,
  ).fill(normalizedRelated);
  const directAnalysis = analysis(root);
  directAnalysis.impacts[0].dependencies = oversizedRelations;
  assert.throws(
    () => assertSemProjectAnalysisIntegrity({
      repositoryRoot: root,
      project,
      analysis: directAnalysis,
    }),
    new RegExp(`${MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT} aggregate evidence item limit`),
  );

  assert.throws(
    () => parseSemEntities(
      new Array(MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT + 1),
    ),
    new RegExp(`${MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT} aggregate evidence item limit`),
  );
  assert.throws(
    () => parseSemImpact({
      entity: {
        entityId: coreEntity().id,
        file: coreEntity().file,
        name: coreEntity().name,
        type: coreEntity().kind,
      },
      dependencies: new Array(
        MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT + 1,
      ).fill(providerRelated),
      dependents: [],
      tests: [],
    }),
    new RegExp(`${MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT} aggregate evidence item limit`),
  );

  const oversizedImpacts = analysis(root);
  oversizedImpacts.impacts = new Array(
    MAX_SEM_IMPACT_QUERIES_PER_PROJECT + 1,
  ).fill(oversizedImpacts.impacts[0]);
  assert.throws(
    () => assertSemProjectAnalysisIntegrity({
      repositoryRoot: root,
      project,
      analysis: oversizedImpacts,
    }),
    new RegExp(`impacts exceeds ${MAX_SEM_IMPACT_QUERIES_PER_PROJECT} item limit`),
  );

  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [directAnalysis],
  });
  const invalidEvidence = report.findings.find((entry) =>
    entry.code === 'SEM_ANALYSIS_EVIDENCE_INVALID');
  assert.match(
    invalidEvidence?.message ?? '',
    new RegExp(`${MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT} aggregate evidence item limit`),
  );
});

test('bounds aggregate sem evidence across projects before model traversal', async () => {
  const root = await fixture();
  const firstProjectItems = Math.floor(MAX_SEM_EVIDENCE_ITEMS_TOTAL / 2);
  const secondProjectItems = MAX_SEM_EVIDENCE_ITEMS_TOTAL - firstProjectItems + 1;
  const oversizedAnalyses = [
    {
      projectId: 'core',
      root: path.join(root, 'packages/core'),
      entities: new Array(firstProjectItems),
      impacts: [],
    },
    {
      projectId: 'react',
      root: path.join(root, 'packages/react'),
      entities: new Array(secondProjectItems),
      impacts: [],
    },
  ];
  const expected = new RegExp(
    `${MAX_SEM_EVIDENCE_ITEMS_TOTAL} global evidence item limit`,
  );

  assert.throws(
    () => semAnalysisCollectionEvidenceItems(oversizedAnalyses),
    expected,
  );
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: {
      ...registry(),
      analysisProjects: [
        { id: 'core', root: 'packages/core' },
        { id: 'react', root: 'packages/react' },
      ],
    },
    semAnalyses: oversizedAnalyses,
  });
  assert.equal(report.semAnalyses.length, 0);
  const limitFinding = report.findings.find((entry) =>
    entry.code === 'SEM_ANALYSES_EVIDENCE_LIMIT_EXCEEDED');
  assert.match(limitFinding?.message ?? '', expected);

  const mixedReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: {
      ...registry(),
      analysisProjects: [
        { id: 'core', root: 'packages/core' },
        { id: 'react', root: 'packages/react' },
      ],
    },
    semAnalyses: [{
      projectId: 'x'.repeat(MAX_SEM_EVIDENCE_TEXT_CHARS + 1),
      root,
      entities: [],
      impacts: [],
    }, ...oversizedAnalyses],
  });
  assert.equal(mixedReport.semAnalyses.length, 0);
  assert.match(
    mixedReport.findings.find((entry) =>
      entry.code === 'SEM_ANALYSES_EVIDENCE_LIMIT_EXCEEDED')?.message ?? '',
    expected,
  );
});

test('bounds sem evidence text before report construction', async () => {
  const root = await fixture();
  const oversizedText = 'x'.repeat(MAX_SEM_EVIDENCE_TEXT_CHARS + 1);
  const projectIdReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { ...registry(), capabilities: [] },
    semAnalyses: [{
      projectId: oversizedText,
      root: path.join(root, 'packages/core'),
      entities: [],
      impacts: [],
    }],
  });
  assert.deepEqual(projectIdReport.findings.map((entry) => entry.code), [
    'SEM_ANALYSIS_EVIDENCE_INVALID',
  ]);
  assert.match(
    projectIdReport.findings[0]?.message ?? '',
    new RegExp(`${MAX_SEM_EVIDENCE_TEXT_CHARS} character limit`),
  );
  assert.doesNotThrow(() => assertVerificationReport(projectIdReport));

  for (const [projectId, expected] of [
    ['bad\0id', /must not contain null bytes/],
    ['\ud800', /well-formed Unicode/],
    [' \u202e\t', /visible text/],
  ]) {
    const malformedReport = await verifyArchitecture({
      root,
      registryPath: 'architecture/registry.json',
      registry: { ...registry(), capabilities: [] },
      semAnalyses: [{
        projectId,
        root: path.join(root, 'packages/core'),
        entities: [],
        impacts: [],
      }],
    });
    assert.deepEqual(malformedReport.findings.map((entry) => entry.code), [
      'SEM_ANALYSIS_EVIDENCE_INVALID',
    ]);
    assert.match(malformedReport.findings[0]?.message ?? '', expected);
    assert.doesNotThrow(() => assertVerificationReport(malformedReport));
  }

  const changeReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semChanges: {
      source: { mode: 'range', from: oversizedText, to: 'head' },
      changes: [],
    },
  });
  assert.deepEqual(changeReport.findings.map((entry) => entry.code), [
    'SEM_CHANGE_EVIDENCE_INVALID',
  ]);
  assert.equal(changeReport.semChanges, undefined);
  assert.doesNotThrow(() => assertVerificationReport(changeReport));

  assert.throws(
    () => parseSemEntities([{
      file: 'packages/core/src/index.ts',
      name: oversizedText,
      type: 'class',
      start_line: 1,
      end_line: 1,
      parent_id: null,
    }]),
    new RegExp(`${MAX_SEM_EVIDENCE_TEXT_CHARS} character limit`),
  );
  assert.throws(
    () => parseSemImpact({
      entity: {
        entityId: coreEntity().id,
        file: coreEntity().file,
        name: oversizedText,
        type: 'class',
      },
      dependencies: [],
      dependents: [],
      tests: [],
    }),
    new RegExp(`${MAX_SEM_EVIDENCE_TEXT_CHARS} character limit`),
  );
  assert.throws(
    () => parseSemDiff({ changes: [] }, {
      mode: 'range',
      from: oversizedText,
      to: 'head',
    }),
    new RegExp(`${MAX_SEM_EVIDENCE_TEXT_CHARS} character limit`),
  );

  const discardedProviderContent = 'c'.repeat(
    MAX_SEM_EVIDENCE_TEXT_CHARS + 1,
  );
  const parsedDiff = parseSemDiff({
    changes: [{
      entityId: coreEntity().id,
      changeType: 'modified',
      filePath: coreEntity().file,
      beforeContent: discardedProviderContent,
      afterContent: discardedProviderContent,
    }],
  });
  assert.equal(parsedDiff.changes.length, 1);

  const analysisWithUnknownProviderField = analysis(root);
  let unknownAnalysisFieldReads = 0;
  Object.defineProperty(
    analysisWithUnknownProviderField.entities[0],
    'providerContent',
    {
      enumerable: true,
      get() {
        unknownAnalysisFieldReads += 1;
        throw new Error('unknown analysis fields must not be traversed');
      },
    },
  );
  assert.doesNotThrow(() =>
    semAnalysisCollectionEvidenceTextCharacters([
      analysisWithUnknownProviderField,
    ]));
  const unknownAnalysisReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { ...registry(), capabilities: [] },
    semAnalyses: [analysisWithUnknownProviderField],
  });
  assert.equal(unknownAnalysisFieldReads, 0);
  assert.match(
    unknownAnalysisReport.findings[0]?.message ?? '',
    /contains unknown field: providerContent/,
  );

  const changeWithUnknownProviderField = {
    entityId: coreEntity().id,
    changeType: 'modified',
    filePath: coreEntity().file,
  };
  let unknownChangeFieldReads = 0;
  Object.defineProperty(changeWithUnknownProviderField, 'beforeContent', {
    enumerable: true,
    get() {
      unknownChangeFieldReads += 1;
      throw new Error('unknown change fields must not be traversed');
    },
  });
  assert.throws(
    () => assertSemChangeSetIntegrity({
      repositoryRoot: root,
      changeSet: {
        source: { mode: 'working' },
        changes: [changeWithUnknownProviderField],
      },
    }),
    /contains unknown field: beforeContent/,
  );
  assert.equal(unknownChangeFieldReads, 0);

  const aggregateUntrackedFiles = Array.from(
    { length: 2200 },
    (_, index) => `${index}-${'u'.repeat(3980)}.ts`,
  );
  assert.throws(
    () => assertSemChangeSetIntegrity({
      repositoryRoot: root,
      changeSet: {
        source: { mode: 'working' },
        changes: [],
        untrackedFiles: aggregateUntrackedFiles,
      },
    }),
    new RegExp(
      `${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} aggregate text character limit`,
    ),
  );

  const atItemLimit = 'a'.repeat(MAX_SEM_EVIDENCE_TEXT_CHARS);
  const aggregateAnalyses = [{
    projectId: 'core',
    root: path.join(root, 'packages/core'),
    entities: Array.from({ length: 2049 }, () => ({ name: atItemLimit })),
    impacts: [],
  }];
  assert.throws(
    () => semAnalysisCollectionEvidenceTextCharacters(aggregateAnalyses),
    new RegExp(
      `${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} aggregate text character limit`,
    ),
  );
  assert.equal(
    semAnalysisCollectionEvidenceItems(aggregateAnalyses),
    aggregateAnalyses[0].entities.length,
  );
});

test('bounds direct and parsed sem change evidence cardinality before traversal', async () => {
  const root = await fixture();
  const validChange = {
    entityId: 'packages/core/src/index.ts::class::Core',
    changeType: 'modified',
    filePath: 'packages/core/src/index.ts',
  };
  const atLimit = new Array(MAX_SEM_CHANGE_EVIDENCE_ITEMS).fill(validChange);
  const oversized = new Array(MAX_SEM_CHANGE_EVIDENCE_ITEMS + 1).fill(validChange);
  const expected = new RegExp(
    `${MAX_SEM_CHANGE_EVIDENCE_ITEMS} aggregate change evidence item limit`,
  );

  assert.throws(
    () => assertSemChangeSetIntegrity({
      repositoryRoot: root,
      changeSet: {
        source: { mode: 'working' },
        changes: atLimit,
        untrackedFiles: ['docs/core.md'],
      },
    }),
    expected,
  );
  assert.throws(
    () => parseSemDiff({ changes: oversized }),
    expected,
  );

  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semChanges: {
      source: { mode: 'working' },
      changes: oversized,
    },
  });
  assert.equal(report.semChanges, undefined);
  assert.deepEqual(report.findings.map((entry) => entry.code), [
    'SEM_CHANGE_EVIDENCE_INVALID',
  ]);
  assert.match(report.findings[0]?.message ?? '', expected);
});

test('direct verifier requires analysis project roots to be directories', async () => {
  const root = await fixture();
  await writeFile(path.join(root, 'project-file'), 'not a directory\n');
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: {
      schemaVersion: 1,
      analysisProjects: [{ id: 'file-project', root: 'project-file' }],
      capabilities: [],
    },
  });
  assert.deepEqual(report.findings.map((entry) => entry.code), [
    'ANALYSIS_PROJECT_ROOT_NOT_DIRECTORY',
  ]);
});

test('direct verifier uses canonical project scope for internal symlinks', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
  }
  const root = await fixture();
  await symlink(path.join(root, 'packages/core'), path.join(root, 'linked-core'), 'dir');
  const linkedAnalysis = analysis(root);
  linkedAnalysis.projectId = 'core-link';
  linkedAnalysis.root = await realpath(path.join(root, 'packages/core'));
  const linkedRegistry = registry({ project: 'core-link' });
  linkedRegistry.analysisProjects = [{ id: 'core-link', root: 'linked-core' }];

  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: linkedRegistry,
    semAnalyses: [linkedAnalysis],
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{
        id: 'CORE-NO-REACT-PACKAGE',
        project: 'core-link',
        from: 'packages/core',
        disallow: ['react'],
      }],
      impactBoundaries: [{
        id: 'CORE-NO-REACT-IMPACT',
        project: 'core-link',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
        missingEvidenceSeverity: 'error',
      }],
    }],
  });
  assert.equal(report.passed, true);
  assert.deepEqual(report.findings, []);
});

test('reports missing paths and forbidden package dependencies', async () => {
  const root = await fixture();
  await writeFile(path.join(root, 'packages/core/package.json'), JSON.stringify({ name: '@fixture/core', dependencies: { react: '*' } }));
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ testEvidence: ['packages/core/test/missing.test.ts'] }),
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{ id: 'CORE-NO-REACT', from: 'packages/core', disallow: ['react'] }],
    }],
  });
  assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
    'PACKAGE_DEPENDENCY_FORBIDDEN',
    'TEST_PATH_MISSING',
  ]));
  assert.equal(
    report.findings.filter((entry) => entry.code === 'PACKAGE_DEPENDENCY_FORBIDDEN').length,
    1,
  );
  assert.equal(report.summary.errors, 2);
});

test('reports missing required package dependencies', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{
        id: 'CORE-REQUIRES-RUNTIME',
        from: 'packages/core',
        require: ['@fixture/runtime'],
      }],
    }],
  });
  assert.equal(report.passed, false);
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0]?.code, 'PACKAGE_DEPENDENCY_REQUIRED');
  assert.equal(report.findings[0]?.ruleId, 'CORE-REQUIRES-RUNTIME');
});

test('requires document, test, and implementation evidence to be files', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({
      spec: 'docs',
      implementationAnchors: ['packages/core/src::class::Core'],
      testEvidence: ['packages/core/test'],
      publicDocs: ['docs'],
      decisions: ['docs'],
    }),
  });
  assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
    'SPEC_PATH_NOT_FILE',
    'IMPLEMENTATION_PATH_NOT_FILE',
    'TEST_PATH_NOT_FILE',
    'DOCUMENT_PATH_NOT_FILE',
    'DECISION_PATH_NOT_FILE',
  ]));
});

test('package policies report oversized and non-object manifests as input findings', async () => {
  const root = await fixture();
  const policy = {
    schemaVersion: 1,
    packageBoundaries: [{
      id: 'CORE-MANIFEST',
      from: 'packages/core',
      disallow: ['react'],
    }],
  };
  await writeFile(
    path.join(root, 'packages/core/package.json'),
    JSON.stringify({ padding: 'x'.repeat(MAX_PACKAGE_MANIFEST_BYTES) }),
  );
  const oversized = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    policies: [policy],
  });
  assert.equal(oversized.findings[0]?.code, 'PACKAGE_POLICY_INPUT_ERROR');
  assert.match(oversized.findings[0]?.message ?? '', /exceeds 1048576 byte limit/);

  await writeFile(path.join(root, 'packages/core/package.json'), 'null');
  const nonObject = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    policies: [policy],
  });
  assert.equal(nonObject.findings[0]?.code, 'PACKAGE_POLICY_INPUT_ERROR');
  assert.match(nonObject.findings[0]?.message ?? '', /root must be an object/);

  await writeFile(
    path.join(root, 'packages/core/package.json'),
    JSON.stringify({ dependencies: [] }),
  );
  const invalidDependencies = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    policies: [policy],
  });
  assert.equal(invalidDependencies.findings[0]?.code, 'PACKAGE_POLICY_INPUT_ERROR');
  assert.match(invalidDependencies.findings[0]?.message ?? '', /dependencies must be an object/);
});

test('checks forbidden sem dependencies without rejecting valid dependents', async () => {
  const root = await fixture();
  const forbidden = {
    entityId: 'packages/react/src/view.ts::function::View',
    file: 'packages/react/src/view.ts',
    name: 'View',
    kind: 'function',
  };
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['CORE-NO-UI'] }),
    semAnalyses: [analysis(root, [forbidden])],
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'CORE-NO-UI',
        project: 'core',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
      }],
    }],
  });
  assert.equal(report.passed, false);
  assert.equal(report.findings[0]?.code, 'SEM_IMPACT_BOUNDARY_VIOLATION');
});

test('fails closed when an impact policy matches no source entity', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['CORE-NO-MISSING-UI'] }),
    semAnalyses: [analysis(root)],
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'CORE-NO-MISSING-UI',
        project: 'core',
        from: ['packages/core/src/missing/**'],
        disallowDependencies: ['packages/react/**'],
        missingEvidenceSeverity: 'error',
      }],
    }],
  });
  assert.equal(report.passed, false);
  assert.equal(report.findings.length, 1);
  assert.equal(report.findings[0]?.code, 'SEM_IMPACT_SOURCE_MISSING');
  assert.equal(report.findings[0]?.ruleId, 'CORE-NO-MISSING-UI');
});

test('bounds aggregate impact policy relation evaluation', async () => {
  const root = await fixture();
  const dependencies = Array.from(
    { length: MAX_IMPACT_POLICY_EVALUATION_OPERATIONS + 1 },
    (_, index) => ({
      entityId: `packages/core/src/index.ts::function::Dependency${index}`,
      file: 'packages/core/src/index.ts',
      name: `Dependency${index}`,
      kind: 'function',
    }),
  );
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [analysis(root, dependencies)],
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'CORE-NO-REACT',
        project: 'core',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
      }],
    }],
  });

  assert.equal(report.passed, false);
  assert.deepEqual(report.findings.map((entry) => entry.code), [
    'SEM_IMPACT_EVALUATION_LIMIT_EXCEEDED',
  ]);
  assert.match(
    report.findings[0]?.message ?? '',
    new RegExp(`global limit of ${MAX_IMPACT_POLICY_EVALUATION_OPERATIONS} operations`),
  );
});

test('globstar directory segments match both direct and nested policy files', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'packages/core/src/nested'), { recursive: true });
  await writeFile(
    path.join(root, 'packages/core/src/nested/worker.ts'),
    'export function worker() {}\n',
  );
  const dependency = {
    entityId: 'packages/react/src/view.ts::function::View',
    file: 'packages/react/src/view.ts',
    name: 'View',
    kind: 'function',
  };
  const nestedEntity = {
    id: 'packages/core/src/nested/worker.ts::function::worker',
    file: 'packages/core/src/nested/worker.ts',
    name: 'worker',
    kind: 'function',
    startLine: 1,
    endLine: 1,
  };
  const semAnalysis = analysis(root, [dependency]);
  semAnalysis.entities.push(nestedEntity);
  semAnalysis.impacts.push({
    entity: {
      entityId: nestedEntity.id,
      file: nestedEntity.file,
      name: nestedEntity.name,
      kind: nestedEntity.kind,
    },
    dependencies: [dependency],
    dependents: [],
    tests: [],
  });
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['CORE-NO-UI-GLOBSTAR'] }),
    semAnalyses: [semAnalysis],
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'CORE-NO-UI-GLOBSTAR',
        from: ['packages/core/src/**/*.ts'],
        disallowDependencies: ['packages/react/src/**/*.ts'],
        missingEvidenceSeverity: 'error',
      }],
    }],
  });
  assert.equal(report.passed, false);
  assert.deepEqual(report.findings.map((entry) => entry.code), [
    'SEM_IMPACT_BOUNDARY_VIOLATION',
    'SEM_IMPACT_BOUNDARY_VIOLATION',
  ]);
});

test('bounded NFA glob matching preserves the lightweight subset without regex backtracking', () => {
  for (const [value, pattern, expected] of [
    ['src/index.ts', 'src/**/*.ts', true],
    ['src/nested/index.ts', 'src/**/*.ts', true],
    ['src/nested/deep/index.ts', 'src/**/*.ts', true],
    ['src/nested/index.js', 'src/**/*.ts', false],
    ['file.ts', '**/file.ts', true],
    ['nested/file.ts', '**/file.ts', true],
    ['a/b', '*', false],
    ['a/b', '**', true],
    ['src/😀/index.ts', 'src/😀/*.ts', true],
  ]) {
    assert.equal(matchesAny(value, [pattern]), expected, `${pattern} against ${value}`);
  }

  const adversarialPattern = `${'*a'.repeat(500)}b`;
  const startedAt = performance.now();
  assert.equal(matchesAny('a'.repeat(500), [adversarialPattern]), false);
  assert.ok(
    performance.now() - startedAt < 1_000,
    'adversarial wildcard input must complete without catastrophic regex backtracking',
  );
});

test('public glob helpers reject malformed runtime inputs with contract errors', () => {
  assert.equal(globPatternIssue(null), 'glob pattern must be a string');
  assert.throws(() => compileGlobPatterns(null), InputContractError);
  assert.throws(
    () => compileGlobPatterns(['packages/**', 42]),
    /glob patterns must contain only strings/,
  );
  const matches = compileGlobPatterns(['packages/**']);
  assert.throws(() => matches(null), /glob match value must be a string/);
  assert.throws(
    () => matches('a'.repeat(MAX_GLOB_MATCH_VALUE_CHARS + 1)),
    new RegExp(`glob match value exceeds ${MAX_GLOB_MATCH_VALUE_CHARS} character limit`),
  );
  assert.throws(
    () => compileGlobPatterns(['a'.repeat(MAX_GLOB_PATTERN_CHARS + 1)]),
    InputContractError,
  );
  const excessivePatternSet = Array.from(
    { length: Math.floor(
      MAX_GLOB_PATTERN_SET_COMPLEXITY / MAX_GLOB_PATTERN_CHARS,
    ) + 1 },
    (_, index) => `${index}${'a'.repeat(MAX_GLOB_PATTERN_CHARS - 1)}`,
  );
  assert.throws(
    () => compileGlobPatterns(excessivePatternSet),
    new RegExp(
      `glob pattern set exceeds ${MAX_GLOB_PATTERN_SET_COMPLEXITY} character complexity limit`,
    ),
  );
});

test('rejects oversized glob patterns in loaded and direct policies', async () => {
  const root = await fixture();
  const oversizedPattern = 'a'.repeat(MAX_GLOB_PATTERN_CHARS + 1);
  const policy = {
    schemaVersion: 1,
    impactBoundaries: [{
      id: 'CORE-NO-UI',
      project: 'core',
      from: [oversizedPattern],
      disallowDependencies: ['packages/react/**'],
    }],
  };
  const policyPath = path.join(root, 'oversized-policy.json');
  await writeFile(policyPath, JSON.stringify(policy));
  await assert.rejects(
    loadArchitecturePolicySet(policyPath),
    /exceeds 4096 character limit/,
  );

  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['CORE-NO-UI'] }),
    semAnalyses: [analysis(root)],
    policies: [policy],
  });
  assert.equal(report.passed, false);
  assert.equal(report.findings[0]?.code, 'SEM_POLICY_GLOB_INVALID');

  const excessivePatternSet = Array.from(
    { length: Math.floor(
      MAX_GLOB_PATTERN_SET_COMPLEXITY / MAX_GLOB_PATTERN_CHARS,
    ) + 1 },
    (_, index) => `${index}${'a'.repeat(MAX_GLOB_PATTERN_CHARS - 1)}`,
  );
  const excessiveSetPolicy = {
    schemaVersion: 1,
    impactBoundaries: [{
      id: 'EXCESSIVE-GLOB-SET',
      from: excessivePatternSet,
      disallowDependencies: ['packages/react/**'],
    }],
  };
  const excessiveSetPath = path.join(root, 'excessive-set-policy.json');
  await writeFile(excessiveSetPath, JSON.stringify(excessiveSetPolicy));
  await assert.rejects(
    loadArchitecturePolicySet(excessiveSetPath),
    new RegExp(
      `glob pattern set exceeds ${MAX_GLOB_PATTERN_SET_COMPLEXITY} character complexity limit`,
    ),
  );

  const excessiveSetReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [analysis(root)],
    policies: [excessiveSetPolicy],
  });
  assert.equal(excessiveSetReport.passed, false);
  assert.equal(excessiveSetReport.findings[0]?.code, 'SEM_POLICY_GLOB_INVALID');
});

test('does not treat forbidden-path dependents as source dependencies', async () => {
  const root = await fixture();
  const handler = {
    entityId: 'packages/react/src/view.ts::function::View',
    file: 'packages/react/src/view.ts',
    name: 'View',
    kind: 'function',
  };
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['CORE-NO-UI'] }),
    semAnalyses: [analysis(root, [], [handler])],
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'CORE-NO-UI',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
      }],
    }],
  });
  assert.equal(report.passed, true);
  assert.equal(report.findings.length, 0);
});

test('reports absent sem entity anchors', async () => {
  const root = await fixture();
  const semAnalysis = analysis(root);
  semAnalysis.entities = [];
  semAnalysis.impacts = [];
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [semAnalysis],
  });
  assert.equal(report.findings[0]?.code, 'IMPLEMENTATION_ANCHOR_NOT_IN_SEM');
});

test('indexes sem anchors without capability-by-entity rescans', async () => {
  const root = await fixture();
  const entityCount = 64;
  const anchors = Array.from(
    { length: entityCount },
    (_, index) => `packages/core/src/index.ts::class::Entity${index}`,
  );
  let entityIdReads = 0;
  const entities = anchors.map((id, index) => ({
    get id() {
      entityIdReads += 1;
      return id;
    },
    file: 'packages/core/src/index.ts',
    name: `Entity${index}`,
    kind: 'class',
    startLine: 1,
    endLine: 1,
  }));

  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ implementationAnchors: anchors }),
    semAnalyses: [{
      projectId: 'core',
      root: path.join(root, 'packages/core'),
      entities,
      impacts: [],
    }],
  });

  assert.equal(report.passed, true);
  assert.ok(
    entityIdReads <= entityCount * 12,
    `expected indexed anchor lookup, observed ${entityIdReads} entity ID reads`,
  );
});

test('indexes capability finding counts without capability-by-finding rescans', async () => {
  const root = await fixture();
  const capabilityCount = 64;
  let ruleMembershipReads = 0;
  class CountedRules extends Array {
    includes(value) {
      ruleMembershipReads += 1;
      return super.includes(value);
    }
  }
  const capabilities = Array.from({ length: capabilityCount }, (_, index) => {
    const rules = new CountedRules();
    rules.push(`RULE-${index}`);
    return {
      id: `CA-CAP-${index}`,
      status: 'planned',
      project: 'core',
      spec: 'docs/core.md',
      owners: ['packages/core'],
      implementationAnchors: [],
      testEvidence: [],
      publicDocs: [],
      rules,
    };
  });
  const packageBoundaries = Array.from({ length: capabilityCount }, (_, index) => ({
    id: `RULE-${index}`,
    project: 'unknown-project',
    from: 'packages/core',
    disallow: ['never-used'],
  }));

  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: {
      schemaVersion: 1,
      analysisProjects: [{ id: 'core', root: 'packages/core' }],
      capabilities,
    },
    policies: [{ schemaVersion: 1, packageBoundaries }],
    evaluateImpactPolicies: false,
  });

  assert.deepEqual(
    report.capabilities.map((capability) => capability.findings),
    Array.from({ length: capabilityCount }, () => 1),
  );
  assert.ok(
    ruleMembershipReads <= capabilityCount * 2,
    `expected indexed finding aggregation, observed ${ruleMembershipReads} rule membership reads`,
  );
});

test('rejects duplicate top-level entities as invalid direct sem evidence', async () => {
  const root = await fixture();
  const semAnalysis = analysis(root);
  semAnalysis.entities.push(coreEntity());
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [semAnalysis],
  });
  assert.equal(report.findings[0]?.code, 'SEM_ANALYSIS_EVIDENCE_INVALID');
  assert.match(report.findings[0]?.message ?? '', /duplicate top-level ID/);
  assert.equal(report.semAnalyses.length, 0);
});

test('direct verifier reports duplicate capability IDs without emitting an invalid report', async () => {
  const root = await fixture();
  const duplicateRegistry = registry();
  duplicateRegistry.capabilities.push(structuredClone(duplicateRegistry.capabilities[0]));
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: duplicateRegistry,
  });
  assert.equal(report.passed, false);
  assert.equal(report.summary.capabilities, 1);
  assert.deepEqual(report.capabilities.map((capability) => capability.id), ['CA-CORE']);
  assert.ok(report.findings.some((entry) => entry.code === 'CAPABILITY_ID_DUPLICATE'));
  assert.doesNotThrow(() => assertVerificationReport(report));
});

test('rejects the same implementation anchor across capability IDs', async () => {
  const root = await fixture();
  const duplicateRegistry = registry();
  duplicateRegistry.capabilities.push({
    ...structuredClone(duplicateRegistry.capabilities[0]),
    id: 'CA-CORE-ALIAS',
  });
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: duplicateRegistry,
  });
  assert.equal(report.passed, false);
  assert.ok(report.findings.some((entry) => entry.code === 'CAPABILITY_IMPLEMENTATION_DUPLICATE'));
  assert.doesNotThrow(() => assertVerificationReport(report));
});

test('rejects non-canonical top-level IDs as invalid direct sem evidence', async () => {
  const root = await fixture();
  const semAnalysis = analysis(root);
  semAnalysis.entities[0].id = 'packages/core/src/index.ts::class::Fabricated';
  semAnalysis.impacts = [];
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [semAnalysis],
  });
  assert.equal(report.findings[0]?.code, 'SEM_ANALYSIS_EVIDENCE_INVALID');
  assert.match(report.findings[0]?.message ?? '', /expected canonical top-level ID/);
  assert.equal(report.semAnalyses.length, 0);
});

test('direct verifier isolates evidence carrying an incompatible sem version', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semVersion: 'sem 999.0.0',
    semAnalyses: [analysis(root)],
    semChanges: {
      source: { mode: 'working' },
      changes: [{
        entityId: coreEntity().id,
        changeType: 'modified',
        filePath: coreEntity().file,
      }],
    },
  });
  assert.equal(report.passed, false);
  assert.equal(report.semVersion, undefined);
  assert.equal(report.semAnalyses.length, 0);
  assert.equal(report.semChanges, undefined);
  assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
    'CAPABILITY_SEM_ANALYSIS_MISSING',
    'SEM_VERSION_EVIDENCE_INVALID',
  ]));
  assert.match(
    report.findings.find((entry) => entry.code === 'SEM_VERSION_EVIDENCE_INVALID')?.message ?? '',
    /expected sem 0\.21\.0, received "sem 999\.0\.0"/,
  );
});

test('direct verifier omits malformed or fabricated sem analyses from policy evidence', async () => {
  const root = await fixture();
  const malformedDuration = analysis(root);
  malformedDuration.durationMs = -1;
  const fabricatedTarget = analysis(root);
  fabricatedTarget.impacts[0].entity.entityId = 'packages/core/src/index.ts::class::Fabricated';
  const fabricatedLineRange = analysis(root);
  fabricatedLineRange.entities[0].startLine = 999_999;
  fabricatedLineRange.entities[0].endLine = 999_999;

  for (const [semAnalysis, detail] of [
    [malformedDuration, /durationMs must be a non-negative safe integer/],
    [fabricatedTarget, /does not reference a top-level analysis entity/],
    [fabricatedLineRange, /exceeds source file line count/],
  ]) {
    const report = await verifyArchitecture({
      root,
      registryPath: 'architecture/registry.json',
      registry: registry({ rules: ['CORE-NO-UI'] }),
      semAnalyses: [semAnalysis],
      policies: [{
        schemaVersion: 1,
        impactBoundaries: [{
          id: 'CORE-NO-UI',
          project: 'core',
          from: ['packages/core/**'],
          disallowDependencies: ['packages/react/**'],
          missingEvidenceSeverity: 'error',
        }],
      }],
    });
    assert.equal(report.passed, false);
    assert.equal(report.semAnalyses.length, 0);
    assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
      'CAPABILITY_SEM_ANALYSIS_MISSING',
      'SEM_ANALYSIS_EVIDENCE_INVALID',
      'SEM_EVIDENCE_MISSING',
    ]));
    assert.match(
      report.findings.find((entry) => entry.code === 'SEM_ANALYSIS_EVIDENCE_INVALID')?.message ?? '',
      detail,
    );
  }
});

test('direct sem evidence cannot use backslashes to bypass impact policy matching', async () => {
  const root = await fixture();
  const dependency = {
    entityId: 'packages\\react\\src\\view.ts::function::View',
    file: 'packages\\react\\src\\view.ts',
    name: 'View',
    kind: 'function',
  };
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['CORE-NO-UI'] }),
    semAnalyses: [analysis(root, [dependency])],
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'CORE-NO-UI',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
      }],
    }],
  });
  assert.equal(report.passed, false);
  assert.equal(report.semAnalyses.length, 0);
  assert.ok(report.findings.some((entry) =>
    entry.code === 'SEM_ANALYSIS_EVIDENCE_INVALID'
    && entry.message.includes('normalized forward-slash path')));
});

test('parses sem entities and canonical IDs', () => {
  const entities = parseSemEntities([{
    name: 'Core',
    type: 'class',
    start_line: 1,
    end_line: 3,
    start_byte: 0,
    end_byte: 20,
    parent_id: null,
  }], 'packages/core/src/index.ts');
  assert.equal(entities[0]?.id, 'packages/core/src/index.ts::class::Core');

  const jsonProperty = parseSemEntities([{
    name: '$ref',
    type: 'property',
    start_line: 9,
    end_line: 8,
    parent_id: 'schemas/registry.json::/properties/$schema',
  }], 'schemas/registry.json');
  assert.equal(jsonProperty[0]?.startLine, 9);
  assert.equal(jsonProperty[0]?.endLine, 9);

  const jsonArray = parseSemEntities([{
    name: 'enum',
    type: 'array',
    start_line: 87,
    end_line: 86,
    parent_id: 'schemas/registry.json::/properties/status',
  }], 'schemas/registry.json');
  assert.equal(jsonArray[0]?.startLine, 87);
  assert.equal(jsonArray[0]?.endLine, 87);

  const overloadedNestedEntities = parseSemEntities([
    {
      name: 'Scene',
      type: 'type',
      start_line: 19,
      end_line: 19,
      parent_id: 'schemas/three.d.ts::internal_module::THREE',
    },
    {
      name: 'Scene',
      type: 'variable',
      start_line: 35,
      end_line: 35,
      parent_id: 'schemas/three.d.ts::internal_module::THREE',
    },
  ], 'schemas/three.d.ts');
  assert.deepEqual(
    overloadedNestedEntities.map((entity) => entity.id),
    [
      'schemas/three.d.ts::internal_module::THREE::type::Scene',
      'schemas/three.d.ts::internal_module::THREE::variable::Scene',
    ],
  );
});

test('rejects invalid sem source line ranges and rename path types', () => {
  assert.throws(() => parseSemEntities([{
    name: 'Core',
    type: 'class',
    start_line: 0,
    end_line: 3,
    parent_id: null,
  }], 'packages/core/src/index.ts'), /start_line must be at least 1/);
  assert.throws(() => parseSemEntities([{
    name: 'Core',
    type: 'class',
    start_line: 3,
    end_line: 2,
    parent_id: null,
  }], 'packages/core/src/index.ts'), /end_line must be greater than or equal to start_line/);
  assert.throws(() => parseSemEntities([{
    name: 'Core',
    type: 'class',
    start_line: Number.MAX_SAFE_INTEGER + 1,
    end_line: Number.MAX_SAFE_INTEGER + 1,
    parent_id: null,
  }], 'packages/core/src/index.ts'), /start_line must be a safe integer/);
  assert.throws(() => parseSemDiff({
    changes: [{
      entityId: 'packages/core/src/index.ts::class::Core',
      changeType: 'renamed',
      filePath: 'packages/core/src/index.ts',
      oldFilePath: { unexpected: true },
    }],
  }), /oldFilePath must be a non-empty string/);
  assert.throws(() => parseSemDiff({
    changes: [{
      entityId: 'packages/core/src/index.ts::class::Core',
      changeType: 'fabricated',
      filePath: 'packages/core/src/index.ts',
    }],
  }), /changeType is unsupported: fabricated/);
});

test('parses sem impact dependency direction', () => {
  const impact = parseSemImpact({
    entity: { entityId: 'src/a.ts::function::a', file: 'src/a.ts', name: 'a', type: 'function' },
    dependencies: [{ entityId: 'src/b.ts::function::b', file: 'src/b.ts', name: 'b', type: 'function' }],
    dependents: [{ entityId: 'src/c.ts::function::c', file: 'src/c.ts', name: 'c', type: 'function' }],
    tests: [],
  });
  assert.equal(impact.dependencies[0]?.file, 'src/b.ts');
  assert.equal(impact.dependents[0]?.file, 'src/c.ts');
});

test('parses sem diff and maps changed files to capabilities', async () => {
  const root = await fixture();
  const semChanges = parseSemDiff({
    summary: { total: 1 },
    changes: [{
      entityId: 'packages/core/src/index.ts::class::Core',
      changeType: 'modified',
      filePath: 'packages/core/src/index.ts',
      oldFilePath: null,
    }],
    binaryChanges: [{
      filePath: 'docs/core.md',
      status: 'modified',
      oldFilePath: null,
    }],
  });
  assert.deepEqual(semChanges.source, { mode: 'working' });
  assert.deepEqual(semChanges.binaryChanges, [{
    filePath: 'docs/core.md',
    status: 'modified',
  }]);
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semChanges,
  });
  assert.deepEqual(report.semChanges?.affectedCapabilities, ['CA-CORE']);
  assert.deepEqual(report.semChanges?.files, [
    'docs/core.md',
    'packages/core/src/index.ts',
  ]);
  assert.deepEqual(report.semChanges?.semanticFiles, ['packages/core/src/index.ts']);
  assert.deepEqual(report.semChanges?.binaryFiles, ['docs/core.md']);
  assert.deepEqual(report.semChanges?.affectedDocuments, ['docs/core.md']);
  assert.deepEqual(report.semChanges?.affectedTests, ['packages/core/test/core.test.ts']);
  const markdown = renderMarkdownReport(report);
  assert.match(renderConsoleReport(report), /1 semantic, 1 binary, 0 untracked/);
  assert.match(markdown, /Documents to Review/);
  assert.match(markdown, /Binary Files to Review/);
  assert.match(markdown, /docs\/core\.md/);
});

test('indexes changed-file prefixes without capability-by-file rescans', async () => {
  const root = await fixture();
  const itemCount = 64;
  const originalStartsWith = String.prototype.startsWith;
  let startsWithCalls = 0;
  String.prototype.startsWith = function (...args) {
    startsWithCalls += 1;
    return originalStartsWith.apply(this, args);
  };
  let report;
  try {
    report = await verifyArchitecture({
      root,
      registryPath: 'architecture/registry.json',
      registry: {
        schemaVersion: 1,
        analysisProjects: [{ id: 'core', root: 'packages/core' }],
        capabilities: Array.from({ length: itemCount }, (_, index) => ({
          id: `CA-SCOPE-${index}`,
          status: 'planned',
          project: 'core',
          spec: 'packages/core/package.json',
          owners: ['packages/core'],
          implementationAnchors: [],
          testEvidence: [],
          publicDocs: [],
        })),
      },
      semChanges: {
        source: { mode: 'working' },
        changes: [],
        binaryChanges: Array.from({ length: itemCount }, (_, index) => ({
          filePath: `assets/change-${index}.bin`,
          status: 'modified',
        })),
      },
    });
  } finally {
    String.prototype.startsWith = originalStartsWith;
  }

  assert.deepEqual(report.semChanges?.affectedCapabilities, []);
  assert.ok(
    startsWithCalls <= itemCount * 30,
    `expected indexed change scope, observed ${startsWithCalls} prefix comparisons`,
  );
});

test('normalizes authored dot segments when mapping change scope', async () => {
  const root = await fixture();
  await writeFile(path.join(root, 'docs/second.md'), '# Second\n');
  const authoredRegistry = registry({
    spec: 'docs/section/../core.md',
    publicDocs: ['docs/section/../core.md'],
  });
  authoredRegistry.policyFiles = ['architecture/rules/../policy.json'];
  authoredRegistry.capabilities.push({
    id: 'CA-SECOND',
    status: 'planned',
    project: 'core',
    spec: 'docs/second.md',
    owners: ['packages/core'],
    implementationAnchors: [],
    testEvidence: [],
    publicDocs: [],
  });

  const evidenceReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: authoredRegistry,
    semChanges: {
      source: { mode: 'working' },
      changes: [{
        entityId: 'docs/core.md::document::core',
        changeType: 'modified',
        filePath: 'docs/core.md',
      }],
    },
  });
  assert.deepEqual(evidenceReport.semChanges?.affectedCapabilities, ['CA-CORE']);
  assert.deepEqual(evidenceReport.semChanges?.affectedDocuments, ['docs/core.md']);
  assert.doesNotThrow(() => assertVerificationReport(evidenceReport));

  const controlReport = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: authoredRegistry,
    semChanges: {
      source: { mode: 'working' },
      changes: [{
        entityId: 'architecture/policy.json::document::policy',
        changeType: 'modified',
        filePath: 'architecture/policy.json',
      }],
    },
  });
  assert.deepEqual(controlReport.semChanges?.affectedCapabilities, ['CA-CORE', 'CA-SECOND']);
  assert.deepEqual(controlReport.semChanges?.affectedDocuments, [
    'docs/core.md',
    'docs/second.md',
  ]);
  assert.deepEqual(controlReport.semChanges?.affectedTests, [
    'packages/core/test/core.test.ts',
  ]);
  assert.doesNotThrow(() => assertVerificationReport(controlReport));
});

test('direct verifier omits malformed change evidence from report scope', async () => {
  const root = await fixture();
  const validChange = {
    entityId: 'packages/core/src/index.ts::class::Core',
    changeType: 'modified',
    filePath: 'packages/core/src/index.ts',
  };
  const invalidChangeSets = [
    [
      { source: { mode: 'range', from: 'base' }, changes: [] },
      /source\.to must be a non-empty string/,
    ],
    [
      { source: { mode: 'range', from: ' \u202e\t', to: 'head' }, changes: [] },
      /source\.from must be a non-empty string containing visible text/,
    ],
    [
      { source: { mode: 'working', from: 'base' }, changes: [] },
      /source contains unknown field: from/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [{ ...validChange, changeType: 'fabricated' }],
      },
      /changeType is unsupported: fabricated/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [{ ...validChange, entityId: '../outside.ts::class::Outside', filePath: '../outside.ts' }],
      },
      /escapes repository root/,
    ],
    [
      { source: { mode: 'working' }, changes: [validChange], untrackedFiles: ['../outside.ts'] },
      /escapes repository root/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [],
        binaryChanges: [{ filePath: 'docs/core.md', status: 'fabricated' }],
      },
      /binaryChanges\[0\]\.status is unsupported: fabricated/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [],
        binaryChanges: [{ filePath: '../outside.bin', status: 'modified' }],
      },
      /escapes repository root/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [validChange, validChange],
      },
      /entityId is duplicated/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [],
        binaryChanges: [
          { filePath: 'docs/core.md', status: 'modified' },
          { filePath: 'docs/core.md', status: 'modified' },
        ],
      },
      /filePath is duplicated/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [validChange],
        binaryChanges: [{ filePath: validChange.filePath, status: 'modified' }],
      },
      /file cannot be both semantic and binary/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [validChange],
        untrackedFiles: [validChange.filePath],
      },
      /file cannot be both tracked and untracked/,
    ],
    [
      {
        source: { mode: 'working' },
        changes: [],
        untrackedFiles: ['docs/core.md', 'docs/core.md'],
      },
      /untrackedFiles\[1\] is duplicated/,
    ],
  ];
  for (const [semChanges, detail] of invalidChangeSets) {
    const report = await verifyArchitecture({
      root,
      registryPath: 'architecture/registry.json',
      registry: registry(),
      semChanges,
    });
    assert.equal(report.passed, false);
    assert.equal(report.semChanges, undefined);
    assert.deepEqual(report.findings.map((entry) => entry.code), [
      'SEM_CHANGE_EVIDENCE_INVALID',
    ]);
    assert.match(report.findings[0]?.message ?? '', detail);
  }
});

test('runs a reproducible sem commit range without working-tree files', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-range.mjs');
  const argsFile = path.join(root, 'sem-args.json');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(argsFile)}, JSON.stringify(process.argv.slice(2)));
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 1, added: 0, modified: 0, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 1, orphan: 0, total: 0
  },
  changes: [],
  binaryChanges: [{ filePath: 'docs/core.md', status: 'modified' }]
}));
`);
  await chmod(command, 0o755);
  const changes = runSemDiff({
    repositoryRoot: root,
    command,
    from: 'base-sha',
    to: 'head-sha',
  });
  assert.deepEqual(changes.source, { mode: 'range', from: 'base-sha', to: 'head-sha' });
  assert.equal(changes.untrackedFiles, undefined);
  assert.deepEqual(changes.binaryChanges, [{
    filePath: 'docs/core.md',
    status: 'modified',
  }]);
  assert.deepEqual(JSON.parse(await readFile(argsFile, 'utf8')), [
    'diff', '--from', 'base-sha', '--to', 'head-sha', '--format', 'json',
  ]);
});

test('serializes git commit symbol deltas through the history collector', async () => {
  const report = await collectSymbolHistory({
    repositoryRoot: workspaceRoot,
    from: 'HEAD~1',
    to: 'HEAD',
    projects: [
      { id: 'core', root: 'packages/core' },
      // The fixture contains an intentionally ambiguous third-party .d.ts
      // declaration; scope this regression to implementation sources so the
      // history assertion exercises complete snapshots without that collision.
      { id: 'react', root: 'packages/react', fileExtensions: ['.tsx'] },
      { id: 'example', root: 'example', fileExtensions: ['.tsx'] },
      { id: 'architecture-governance', root: 'packages/architecture-governance' },
    ],
  });
  assert.equal(report.contractId, 'context-action/symbol-history-report');
  assert.equal(report.contractVersion, '1.3');
  assert.equal(report.summary.commits, 1);
  assert.ok(report.summary.changes > 0);
  assert.ok(report.summary.snapshotSymbols > 0);
  const change = report.commits[0]?.changes[0];
  assert.ok(change);
  assert.equal(typeof change?.filePath, 'string');
  assert.equal(typeof change?.symbol, 'string');
  const snapshotSymbol = report.commits[0]?.snapshot.symbols[0];
  assert.ok(snapshotSymbol);
  assert.equal(report.commits[0]?.snapshot.contractId, 'context-action/symbol-snapshot');
  assert.equal(report.commits[0]?.snapshot.revision.commit, report.commits[0]?.commit);
  assert.equal(report.commits[0]?.snapshot.projectStatuses.length, 4);
  assert.ok(report.commits[0]?.snapshot.projectStatuses.every((entry) =>
    entry.status === 'analyzed' || entry.status === 'skipped'));
  assert.equal(
    report.commits[0]?.snapshot.projectStatuses.find((entry) => entry.projectId === 'architecture-governance')?.status,
    'analyzed',
  );
  assert.equal(typeof snapshotSymbol?.projectId, 'string');
  assert.equal(typeof snapshotSymbol?.filePath, 'string');
  assert.equal(typeof snapshotSymbol?.symbol, 'string');
});

test('collects a complete current-worktree symbol snapshot', async () => {
  const snapshot = await collectSymbolSnapshot({
    repositoryRoot: workspaceRoot,
    projects: [{ id: 'core', root: 'packages/core' }],
  });
  assert.equal(snapshot.contractId, 'context-action/symbol-snapshot');
  assert.equal(snapshot.contractVersion, '1.1');
  assert.equal(snapshot.projects[0]?.id, 'core');
  assert.ok(snapshot.revision.gitHead);
  assert.ok(snapshot.revision.workingTreeDigest);
  assert.deepEqual(snapshot.projectStatuses, [{
    projectId: 'core',
    root: 'packages/core',
    status: 'analyzed',
  }]);
  assert.ok(snapshot.symbols.length > 0);
  assert.equal(snapshot.symbols[0]?.projectId, 'core');
});

test('resolves analysisProjects from the historical registry for commit snapshots', async (t) => {
  const root = await mkdtemp(path.join(tmpdir(), 'arch-snapshot-history-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  gitRepositoryCommand(root, ['init', '--quiet']);
  gitRepositoryCommand(root, ['config', 'user.email', 'test@example.com']);
  gitRepositoryCommand(root, ['config', 'user.name', 'Architecture Test']);
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await mkdir(path.join(root, 'packages/core/src'), { recursive: true });
  await mkdir(path.join(root, 'packages/legacy/src'), { recursive: true });
  await writeFile(path.join(root, 'packages/core/src/index.ts'), 'export class Core {}\n');
  await writeFile(path.join(root, 'packages/legacy/src/index.ts'), 'export class Legacy {}\n');
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [{ id: 'core', root: 'packages/core' }],
    capabilities: [],
  }));
  gitRepositoryCommand(root, ['add', '.']);
  gitRepositoryCommand(root, ['commit', '--quiet', '-m', 'core registry']);
  const historicalCommit = gitRepositoryCommand(root, ['rev-parse', 'HEAD']);
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [{ id: 'legacy', root: 'packages/legacy' }],
    capabilities: [],
  }));
  gitRepositoryCommand(root, ['add', '.']);
  gitRepositoryCommand(root, ['commit', '--quiet', '-m', 'legacy registry']);

  const command = path.join(root, 'fake-sem-snapshot.mjs');
  await writeFile(command, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem ${SUPPORTED_SEM_VERSION}');
} else {
  const projectRoot = args[1];
  const name = projectRoot.includes('core') ? 'Core' : 'Legacy';
  process.stdout.write(JSON.stringify([{
    name,
    type: 'class',
    file: projectRoot + '/src/index.ts',
    start_line: 1,
    end_line: 1,
  }]));
}
`);
  await chmod(command, 0o755);

  const snapshot = await collectSymbolSnapshot({
    repositoryRoot: root,
    projects: [{ id: 'legacy', root: 'packages/legacy' }],
    registryPath: 'architecture/registry.json',
    commit: historicalCommit,
    command,
  });
  assert.deepEqual(snapshot.projects.map((project) => project.id), ['core']);
  assert.deepEqual(snapshot.projectStatuses, [{
    projectId: 'core',
    root: 'packages/core',
    status: 'analyzed',
  }]);
  assert.equal(snapshot.symbols[0]?.projectId, 'core');
  assert.equal(snapshot.symbols[0]?.name, 'Core');

  gitRepositoryCommand(root, ['rm', '--quiet', 'architecture/registry.json']);
  gitRepositoryCommand(root, ['commit', '--quiet', '-m', 'remove registry']);
  const missingRegistryCommit = gitRepositoryCommand(root, ['rev-parse', 'HEAD']);
  await assert.rejects(
    collectSymbolSnapshot({
      repositoryRoot: root,
      projects: [{ id: 'legacy', root: 'packages/legacy' }],
      registryPath: 'architecture/registry.json',
      commit: missingRegistryCommit,
      command,
    }),
    (error) => error instanceof InputContractError
      && /historical registry path/.test(error.message),
  );
});

test('sem adapter rejects an inconsistent provider diff summary', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-incomplete-diff.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 1, added: 0, modified: 1, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 1
  },
  changes: [],
  binaryChanges: []
}));
`);
  await chmod(command, 0o755);
  assert.throws(
    () => runSemDiff({
      repositoryRoot: root,
      command,
      from: 'base',
      to: 'head',
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'diff');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /changes length is 0, expected summary\.total 1/);
      return true;
    },
  );
});

test('sem adapter accepts the sem 0.21 modified structural overlap', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-overlapping-rename-summary.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 1, added: 0, modified: 1, deleted: 0, moved: 0,
    renamed: 1, reordered: 0, binary: 0, orphan: 0, total: 1
  },
  changes: [{
    entityId: 'docs/core.md::section::Core',
    changeType: 'renamed',
    entityType: 'section',
    filePath: 'docs/core.md'
  }],
  binaryChanges: []
}));
`);
  await chmod(command, 0o755);

  const changes = runSemDiff({
    repositoryRoot: root,
    command,
    from: 'base',
    to: 'head',
  });
  assert.equal(changes.changes.length, 1);
  assert.equal(changes.changes[0]?.changeType, 'renamed');
});

test('sem adapter verifies provider file, orphan, and entity uniqueness summaries', async () => {
  const root = await fixture();
  const validChange = {
    entityId: 'packages/core/src/index.ts::class::Core',
    changeType: 'modified',
    entityType: 'class',
    filePath: 'packages/core/src/index.ts',
  };
  const cases = [
    {
      name: 'file-count',
      output: {
        summary: {
          fileCount: 1, added: 0, modified: 0, deleted: 0, moved: 0,
          renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0,
        },
        changes: [],
        binaryChanges: [],
      },
      detail: /unique changed file count is 0, expected summary\.fileCount 1/,
    },
    {
      name: 'orphan-count',
      output: {
        summary: {
          fileCount: 1, added: 0, modified: 1, deleted: 0, moved: 0,
          renamed: 0, reordered: 0, binary: 0, orphan: 1, total: 1,
        },
        changes: [validChange],
        binaryChanges: [],
      },
      detail: /orphan changes count is 0, expected summary\.orphan 1/,
    },
    {
      name: 'entity-type',
      output: {
        summary: {
          fileCount: 1, added: 0, modified: 1, deleted: 0, moved: 0,
          renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 1,
        },
        changes: [{ ...validChange, entityType: undefined }],
        binaryChanges: [],
      },
      detail: /entityType must be a non-empty string/,
    },
    {
      name: 'duplicate-entity',
      output: {
        summary: {
          fileCount: 1, added: 0, modified: 2, deleted: 0, moved: 0,
          renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 2,
        },
        changes: [validChange, validChange],
        binaryChanges: [],
      },
      detail: /entityId is duplicated/,
    },
    {
      name: 'invalid-modified-overlap',
      output: {
        summary: {
          fileCount: 1, added: 0, modified: 2, deleted: 0, moved: 0,
          renamed: 1, reordered: 0, binary: 0, orphan: 0, total: 1,
        },
        changes: [{ ...validChange, changeType: 'renamed' }],
        binaryChanges: [],
      },
      detail: /summary\.modified 2 must equal exact modified count 0 or sem 0\.21 structural-overlap count 1/,
    },
  ];
  for (const fixtureCase of cases) {
    const command = path.join(root, `sem-${fixtureCase.name}-diff.mjs`);
    await writeFile(command, `#!/usr/bin/env node
process.stdout.write(${JSON.stringify(JSON.stringify(fixtureCase.output))});
`);
    await chmod(command, 0o755);
    assert.throws(
      () => runSemDiff({
        repositoryRoot: root,
        command,
        from: 'base',
        to: 'head',
      }),
      (error) => {
        assert.ok(error instanceof SemExecutionError);
        assert.equal(error.failure.operation, 'diff');
        assert.equal(error.failure.reason, 'invalid-output');
        assert.match(error.failure.detail, fixtureCase.detail);
        return true;
      },
    );
  }
});

test('sem adapter rejects tracked and git-untracked evidence collisions', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-tracked-change.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 1, added: 0, modified: 1, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 1
  },
  changes: [{
    entityId: 'docs/core.md::section::Core',
    changeType: 'modified',
    entityType: 'section',
    filePath: 'docs/core.md'
  }],
  binaryChanges: []
}));
`);
  await chmod(command, 0o755);
  const bin = path.join(root, 'bin');
  await mkdir(bin, { recursive: true });
  const gitCommand = path.join(bin, 'git');
  await writeFile(gitCommand, `#!${process.execPath}
process.stdout.write('docs/core.md\\0');
`);
  await chmod(gitCommand, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}${path.delimiter}${originalPath ?? ''}`;
  try {
    assert.throws(
      () => runSemDiff({ repositoryRoot: root, command }),
      (error) => {
        assert.ok(error instanceof SemExecutionError);
        assert.equal(error.failure.operation, 'diff');
        assert.equal(error.failure.command, 'git');
        assert.equal(error.failure.reason, 'invalid-output');
        assert.match(error.failure.detail, /file cannot be both tracked and untracked/);
        return true;
      },
    );
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test('sem diff shares one output budget with git untracked stderr', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-padded-working-diff.mjs');
  await writeFile(command, `#!${process.execPath}
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 0, added: 0, modified: 0, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0
  },
  changes: [],
  binaryChanges: []
}) + ' '.repeat(650));
`);
  await chmod(command, 0o755);
  const bin = path.join(root, 'bin');
  await mkdir(bin, { recursive: true });
  const gitCommand = path.join(bin, 'git');
  await writeFile(gitCommand, `#!${process.execPath}
process.stderr.write('x'.repeat(400));
`);
  await chmod(gitCommand, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}${path.delimiter}${originalPath ?? ''}`;
  try {
    assert.throws(
      () => runSemDiff({
        repositoryRoot: root,
        command,
        limits: { timeoutMs: 2000, maxOutputBytes: 1024 },
      }),
      (error) => {
        assert.ok(error instanceof SemExecutionError);
        assert.equal(error.failure.operation, 'diff');
        assert.equal(error.failure.command, 'git');
        assert.equal(error.failure.reason, 'output-limit');
        assert.match(error.failure.detail, /sem diff aggregate output/);
        return true;
      },
    );
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test('sem adapter bounds aggregate git-untracked change evidence before path traversal', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-empty-working-diff.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 0, added: 0, modified: 0, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0
  },
  changes: [],
  binaryChanges: []
}));
`);
  await chmod(command, 0o755);
  const bin = path.join(root, 'bin');
  await mkdir(bin, { recursive: true });
  const gitCommand = path.join(bin, 'git');
  await writeFile(gitCommand, `#!${process.execPath}
const files = Array.from(
  { length: ${MAX_SEM_CHANGE_EVIDENCE_ITEMS + 1} },
  (_, index) => \`untracked-\${index}.ts\`,
);
process.stdout.write(\`${'${files.join("\\0")}'}\\0\`);
`);
  await chmod(gitCommand, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}${path.delimiter}${originalPath ?? ''}`;
  try {
    assert.throws(
      () => runSemDiff({ repositoryRoot: root, command }),
      (error) => {
        assert.ok(error instanceof SemExecutionError);
        assert.equal(error.failure.operation, 'diff');
        assert.equal(error.failure.command, 'git');
        assert.equal(error.failure.reason, 'invalid-output');
        assert.match(
          error.failure.detail,
          new RegExp(`${MAX_SEM_CHANGE_EVIDENCE_ITEMS} aggregate change evidence item limit`),
        );
        return true;
      },
    );
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test('sem adapter bounds aggregate git-untracked text before path traversal', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-empty-working-text-diff.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 0, added: 0, modified: 0, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0
  },
  changes: [],
  binaryChanges: []
}));
`);
  await chmod(command, 0o755);
  const bin = path.join(root, 'bin');
  await mkdir(bin, { recursive: true });
  const gitCommand = path.join(bin, 'git');
  await writeFile(gitCommand, `#!${process.execPath}
const files = Array.from(
  { length: 2200 },
  (_, index) => String(index) + '-' + 'u'.repeat(3980) + '.ts',
);
process.stdout.write(files.join('\\0') + '\\0');
`);
  await chmod(gitCommand, 0o755);

  const originalPath = process.env.PATH;
  process.env.PATH = `${bin}${path.delimiter}${originalPath ?? ''}`;
  try {
    assert.throws(
      () => runSemDiff({ repositoryRoot: root, command }),
      (error) => {
        assert.ok(error instanceof SemExecutionError);
        assert.equal(error.failure.operation, 'diff');
        assert.equal(error.failure.command, 'git');
        assert.equal(error.failure.reason, 'invalid-output');
        assert.match(
          error.failure.detail ?? '',
          new RegExp(
            `${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} aggregate text character limit`,
          ),
        );
        return true;
      },
    );
  } finally {
    if (originalPath === undefined) delete process.env.PATH;
    else process.env.PATH = originalPath;
  }
});

test('direct sem diff rejects incomplete or conflicting selections before spawning', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-must-not-run.mjs');
  const marker = path.join(root, 'sem-ran');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(marker)}, 'ran');
process.stdout.write(JSON.stringify({ changes: [] }));
`);
  await chmod(command, 0o755);

  const invalidSelections = [
    [{ from: 'base' }, /from and to must be provided together/],
    [{ to: 'head' }, /from and to must be provided together/],
    [{ staged: true, from: 'base', to: 'head' }, /staged cannot be combined/],
    [{ from: '', to: 'head' }, /from must be a non-empty string/],
    [{ from: 'base', to: '' }, /to must be a non-empty string/],
    [{ from: 'base\0hidden', to: 'head' }, /from must not contain null bytes/],
    [{ from: 'base', to: 'head\0hidden' }, /to must not contain null bytes/],
    [{ from: 'x'.repeat(MAX_SEM_EVIDENCE_TEXT_CHARS + 1), to: 'head' }, /from exceeds 4096 character limit/],
    [{ from: '\ud800', to: 'head' }, /from must contain well-formed Unicode/],
    [{ from: 'base', to: ' \u202e\t' }, /to must be a non-empty string containing visible text/],
    [{ staged: 'yes' }, /staged must be a boolean/],
  ];
  for (const [selection, message] of invalidSelections) {
    assert.throws(
      () => runSemDiff({ repositoryRoot: root, command, ...selection }),
      (error) => {
        assert.ok(error instanceof InputContractError);
        assert.equal(error instanceof SemExecutionError, false);
        assert.match(error.message, message);
        return true;
      },
    );
  }
  await assert.rejects(access(marker), { code: 'ENOENT' });
});

test('direct sem analysis rejects invalid impact patterns before spawning', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-invalid-impact-pattern-must-not-run.mjs');
  const marker = path.join(root, 'sem-invalid-impact-pattern-ran');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(marker)}, 'ran');
process.stdout.write('[]');
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: null,
      command,
    }),
    (error) => {
      assert.ok(error instanceof InputContractError);
      assert.equal(error instanceof SemExecutionError, false);
      assert.match(error.message, /glob patterns must be an array/);
      return true;
    },
  );
  await assert.rejects(access(marker), { code: 'ENOENT' });
});

test('direct sem analysis rejects invalid file extension filters before spawning', async () => {
  const root = await fixture();
  const invalidExtensions = [
    null,
    '.ts',
    [],
    ['ts'],
    ['.ts', '.TS'],
    ['.ts', 1],
    [`.${'a'.repeat(64)}`],
  ];
  for (const fileExtensions of invalidExtensions) {
    assert.throws(
      () => runSemProjectAnalysis({
        repositoryRoot: root,
        project: { id: 'core', root: 'packages/core', fileExtensions },
        impactFromPatterns: [],
      }),
      (error) => {
        assert.ok(error instanceof InputContractError);
        assert.equal(error instanceof SemExecutionError, false);
        return true;
      },
    );
  }

  await assert.rejects(
    collectSymbolSnapshot({
      repositoryRoot: workspaceRoot,
      projects: [{ id: 'core', root: 'packages/core', fileExtensions: ['ts'] }],
    }),
    (error) => error instanceof InputContractError,
  );
});

test('rejects provider entities outside the declared file extension filter', async () => {
  const root = await fixture();
  await writeFile(path.join(root, 'packages/core/src/provider-output.json'), '{}\n');
  const command = path.join(root, 'fake-sem-extension-filter.mjs');
  await writeFile(command, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    file: 'packages/core/src/provider-output.json'
  }]));
}
`);
  await chmod(command, 0o755);
  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core', fileExtensions: ['.ts'] },
      impactFromPatterns: [],
      command,
    }),
    (error) => {
      const detail = error instanceof SemExecutionError
        ? error.failure.detail ?? error.message
        : error.message;
      return /does not match analysis project core fileExtensions/.test(detail);
    },
  );
});

test('treats untracked registry changes as affecting every capability', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semChanges: { source: { mode: 'working' }, changes: [], untrackedFiles: ['architecture/registry.json'] },
  });
  assert.deepEqual(report.semChanges?.affectedCapabilities, ['CA-CORE']);
  assert.deepEqual(report.semChanges?.files, ['architecture/registry.json']);
  assert.deepEqual(report.semChanges?.semanticFiles, []);
  assert.deepEqual(report.semChanges?.binaryFiles, []);
  assert.deepEqual(report.semChanges?.untrackedFiles, ['architecture/registry.json']);
});

test('runs impact by canonical sem entity ID', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-impact.mjs');
  await writeFile(command, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact' && args[1] === '--entity-id' && args[2] === 'packages/core/src/index.ts::class::Core') {
  process.stdout.write(JSON.stringify({
    entity: { entityId: args[2], file: 'packages/core/src/index.ts', name: 'Core', type: 'class' },
    dependencies: [], dependents: [], tests: []
  }));
} else {
  process.stderr.write('unexpected arguments: ' + args.join(' '));
  process.exit(1);
}
`);
  await chmod(command, 0o755);
  const result = runSemProjectAnalysis({
    repositoryRoot: root,
    project: { id: 'core', root: 'packages/core' },
    impactFromPatterns: ['packages/core/**'],
    command,
  });
  assert.equal(result.impacts.length, 1);
  assert.equal(result.impacts[0]?.entity.entityId, coreEntity().id);
});

test('bounds policy-selected impact query fanout before spawning impact commands', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-impact-fanout.mjs');
  const impactMarker = path.join(root, 'impact-was-spawned');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify(Array.from({ length: ${MAX_SEM_IMPACT_QUERIES_PER_PROJECT + 1} }, (_, index) => ({
    name: 'Entity' + index,
    type: 'class',
    start_line: 1,
    end_line: 1,
    parent_id: null,
    file: 'packages/core/src/index.ts'
  }))));
} else if (args[0] === 'impact') {
  writeFileSync(${JSON.stringify(impactMarker)}, 'spawned');
  process.stderr.write('impact command must not be spawned');
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'query-limit');
      assert.equal(
        error.failure.impactTargets,
        MAX_SEM_IMPACT_QUERIES_PER_PROJECT + 1,
      );
      assert.equal(
        error.failure.maxImpactQueries,
        MAX_SEM_IMPACT_QUERIES_PER_PROJECT,
      );
      assert.match(
        error.failure.detail,
        new RegExp(`${MAX_SEM_IMPACT_QUERIES_PER_PROJECT + 1} impact targets exceed the per-project limit of ${MAX_SEM_IMPACT_QUERIES_PER_PROJECT}`),
      );
      return true;
    },
  );
  await assert.rejects(access(impactMarker), { code: 'ENOENT' });
});

test('bounds aggregate impact output across project queries', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-impact-output-budget.mjs');
  const lastImpactTarget = path.join(root, 'last-impact-target.txt');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([
    {
      name: 'Core', type: 'class', start_line: 1, end_line: 1,
      start_byte: 0, end_byte: 20, parent_id: null,
      file: 'packages/core/src/index.ts'
    },
    {
      name: 'Helper', type: 'function', start_line: 1, end_line: 1,
      start_byte: 0, end_byte: 20, parent_id: null,
      file: 'packages/core/src/index.ts'
    }
  ]));
} else if (args[0] === 'impact') {
  const entityId = args[2];
  writeFileSync(${JSON.stringify(lastImpactTarget)}, entityId);
  const helper = entityId.endsWith('::function::Helper');
  process.stdout.write(JSON.stringify({
    entity: {
      entityId,
      file: 'packages/core/src/index.ts',
      name: helper ? 'Helper' : 'Core',
      type: helper ? 'function' : 'class'
    },
    dependencies: [{
      entityId: 'packages/react/src/view.ts::function::View',
      file: 'packages/react/src/view.ts',
      name: 'x'.repeat(1200),
      type: 'function'
    }],
    dependents: [],
    tests: []
  }));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
      limits: { maxOutputBytes: 2048, timeoutMs: 10_000 },
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'output-limit');
      assert.equal(error.failure.maxOutputBytes, 2048);
      assert.match(
        error.failure.detail,
        /sem impact aggregate output for project core exceeds 2048 byte limit/,
      );
      return true;
    },
  );
  assert.equal(
    await readFile(lastImpactTarget, 'utf8'),
    'packages/core/src/index.ts::function::Helper',
  );
});

test('bounds aggregate successful stderr across impact queries', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-impact-stderr-budget.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([
    {
      name: 'Core', type: 'class', start_line: 1, end_line: 1,
      parent_id: null, file: 'packages/core/src/index.ts'
    },
    {
      name: 'Helper', type: 'function', start_line: 1, end_line: 1,
      parent_id: null, file: 'packages/core/src/index.ts'
    }
  ]));
} else if (args[0] === 'impact') {
  const entityId = args[2];
  const helper = entityId.endsWith('::function::Helper');
  process.stderr.write('diagnostic'.repeat(90));
  process.stdout.write(JSON.stringify({
    entity: {
      entityId,
      file: 'packages/core/src/index.ts',
      name: helper ? 'Helper' : 'Core',
      type: helper ? 'function' : 'class'
    },
    dependencies: [],
    dependents: [],
    tests: []
  }));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
      limits: { maxOutputBytes: 1500, timeoutMs: 10_000 },
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'output-limit');
      assert.match(
        error.failure.detail ?? '',
        /sem impact aggregate output for project core exceeds 1500 byte limit/,
      );
      return true;
    },
  );
});

test('bounds aggregate normalized sem evidence across impact queries', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-evidence-budget.mjs');
  const secondImpactRelations = MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT - 4;
  await writeFile(command, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([
    {
      name: 'Core', type: 'class', start_line: 1, end_line: 1,
      start_byte: 0, end_byte: 20, parent_id: null,
      file: 'packages/core/src/index.ts'
    },
    {
      name: 'Other', type: 'class', start_line: 1, end_line: 1,
      start_byte: 0, end_byte: 20, parent_id: null,
      file: 'packages/core/src/index.ts'
    }
  ]));
} else if (args[0] === 'impact') {
  const target = args[2];
  const name = target.endsWith('::Other') ? 'Other' : 'Core';
  const count = name === 'Other' ? ${secondImpactRelations} : 1;
  const dependencies = Array.from({ length: count }, (_, index) => ({
    entityId: 'packages/core/src/index.ts::function::Dependency' + index,
    file: 'packages/core/src/index.ts',
    name: 'Dependency' + index,
    type: 'function'
  }));
  process.stdout.write(JSON.stringify({
    entity: {
      entityId: target,
      file: 'packages/core/src/index.ts',
      name,
      type: 'class'
    },
    dependencies,
    dependents: [],
    tests: []
  }));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(
        error.failure.detail ?? '',
        new RegExp(`${MAX_SEM_EVIDENCE_ITEMS_PER_PROJECT} aggregate evidence item limit`),
      );
      return true;
    },
  );
});

test('bounds aggregate normalized sem evidence text across impact queries', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-evidence-text-budget.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([
    {
      name: 'Core', type: 'class', start_line: 1, end_line: 1,
      parent_id: null, file: 'packages/core/src/index.ts'
    },
    {
      name: 'Other', type: 'class', start_line: 1, end_line: 1,
      parent_id: null, file: 'packages/core/src/index.ts'
    }
  ]));
} else if (args[0] === 'impact') {
  const target = args[2];
  const name = target.endsWith('::Other') ? 'Other' : 'Core';
  const dependencies = Array.from({ length: 1050 }, (_, index) => ({
    entityId: 'packages/core/src/index.ts::function::Dependency' + index,
    file: 'packages/core/src/index.ts',
    name: 'N'.repeat(3990) + String(index).padStart(4, '0'),
    type: 'function'
  }));
  process.stdout.write(JSON.stringify({
    entity: {
      entityId: target,
      file: 'packages/core/src/index.ts',
      name,
      type: 'class'
    },
    dependencies,
    dependents: [],
    tests: []
  }));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(
        error.failure.detail ?? '',
        new RegExp(`${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} aggregate text character limit`),
      );
      return true;
    },
  );
});

test('bounds aggregate impact time across project queries', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-impact-time-budget.mjs');
  const lastImpactTarget = path.join(root, 'last-timed-impact-target.txt');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([
    {
      name: 'Core', type: 'class', start_line: 1, end_line: 1,
      start_byte: 0, end_byte: 20, parent_id: null,
      file: 'packages/core/src/index.ts'
    },
    {
      name: 'Helper', type: 'function', start_line: 1, end_line: 1,
      start_byte: 0, end_byte: 20, parent_id: null,
      file: 'packages/core/src/index.ts'
    }
  ]));
} else if (args[0] === 'impact') {
  const entityId = args[2];
  writeFileSync(${JSON.stringify(lastImpactTarget)}, entityId);
  const helper = entityId.endsWith('::function::Helper');
  Atomics.wait(
    new Int32Array(new SharedArrayBuffer(4)),
    0,
    0,
    helper ? 3000 : 500
  );
  process.stdout.write(JSON.stringify({
    entity: {
      entityId,
      file: 'packages/core/src/index.ts',
      name: helper ? 'Helper' : 'Core',
      type: helper ? 'function' : 'class'
    },
    dependencies: [], dependents: [], tests: []
  }));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
      limits: { maxOutputBytes: 64 * 1024, timeoutMs: 1500 },
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'timeout');
      assert.ok(error.failure.timeoutMs < 1500);
      assert.match(
        error.failure.detail,
        /sem impact aggregate timeout for project core exhausted 1500ms budget/,
      );
      return true;
    },
  );
  assert.equal(
    await readFile(lastImpactTarget, 'utf8'),
    'packages/core/src/index.ts::function::Helper',
  );
});

test('bounds final impact parsing and filesystem validation time', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-impact-post-processing-budget.mjs');
  const impactResponse = path.join(root, 'large-impact-response.json');
  const dependencyCount = 60_000;
  const entityId = 'packages/core/src/index.ts::class::Core';
  await writeFile(impactResponse, JSON.stringify({
    entity: {
      entityId,
      file: 'packages/core/src/index.ts',
      name: 'Core',
      type: 'class',
    },
    dependencies: Array.from({ length: dependencyCount }, (_, index) => ({
      entityId: `packages/core/src/index.ts::function::Dependency${index}`,
      file: 'packages/core/src/index.ts',
      name: `Dependency${index}`,
      type: 'function',
    })),
    dependents: [],
    tests: [],
  }));
  await writeFile(command, `#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    parent_id: null, file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact') {
  process.stdout.write(readFileSync(${JSON.stringify(impactResponse)}));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
      limits: { maxOutputBytes: 32 * 1024 * 1024, timeoutMs: 800 },
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'timeout');
      assert.ok(error.failure.timeoutMs <= 800);
      assert.match(
        error.failure.detail ?? '',
        /sem impact aggregate timeout for project core exhausted 800ms budget.*sem impact command exceeded \d+ms budget after JSON response post-processing/,
      );
      return true;
    },
  );
});

test('bounds entities parsing and filesystem validation time', async () => {
  const root = await fixture();
  const command = path.join(root, 'fake-sem-entities-post-processing-budget.mjs');
  const entitiesResponse = path.join(root, 'large-entities-response.json');
  const entityCount = 60_000;
  await writeFile(entitiesResponse, JSON.stringify(
    Array.from({ length: entityCount }, (_, index) => ({
      name: `Entity${index}`,
      type: 'function',
      start_line: 1,
      end_line: 1,
      parent_id: null,
      file: 'packages/core/src/index.ts',
    })),
  ));
  await writeFile(command, `#!/usr/bin/env node
import { readFileSync } from 'node:fs';
if (process.argv[2] === 'entities') {
  process.stdout.write(readFileSync(${JSON.stringify(entitiesResponse)}));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      command,
      limits: { maxOutputBytes: 32 * 1024 * 1024, timeoutMs: 800 },
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'entities');
      assert.equal(error.failure.reason, 'timeout');
      assert.equal(error.failure.timeoutMs, 800);
      assert.match(
        error.failure.detail ?? '',
        /sem entities command exceeded 800ms budget after JSON response post-processing/,
      );
      return true;
    },
  );
});

test('direct sem adapter executes an internal symlink project by canonical path', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
  }
  const root = await fixture();
  await symlink(path.join(root, 'packages/core'), path.join(root, 'linked-core'), 'dir');
  const argsFile = path.join(root, 'sem-canonical-project-args.json');
  const command = path.join(root, 'sem-canonical-project.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(argsFile)}, JSON.stringify(process.argv.slice(2)));
process.stdout.write(JSON.stringify([{
  name: 'Core', type: 'class', start_line: 1, end_line: 1,
  start_byte: 0, end_byte: 20, parent_id: null,
  file: 'packages/core/src/index.ts'
}]));
`);
  await chmod(command, 0o755);

  const result = runSemProjectAnalysis({
    repositoryRoot: root,
    project: { id: 'core-link', root: 'linked-core' },
    impactFromPatterns: [],
    command,
  });
  assert.equal(result.root, await realpath(path.join(root, 'packages/core')));
  assert.deepEqual(JSON.parse(await readFile(argsFile, 'utf8')), [
    'entities', 'packages/core', '--json',
  ]);
});

test('direct sem adapter rejects a project symlink escape before spawning sem', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
  }
  const root = await fixture();
  const outside = await mkdtemp(path.join(tmpdir(), 'arch-governance-outside-'));
  await writeFile(path.join(outside, 'external.ts'), 'export const external = true;\n');
  await symlink(outside, path.join(root, 'packages/external'), 'dir');

  const marker = path.join(root, 'sem-was-spawned');
  const command = path.join(root, 'must-not-run-direct-sem.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(marker)}, 'spawned');
process.stdout.write('[]');
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'external', root: 'packages/external' },
      impactFromPatterns: [],
      command,
    }),
    /escapes repository root through symbolic link/,
  );
  await assert.rejects(readFile(marker, 'utf8'), { code: 'ENOENT' });
});

test('direct sem adapter rejects entity files that escape through symlinks', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
  }
  const root = await fixture();
  const outside = await mkdtemp(path.join(tmpdir(), 'arch-governance-outside-'));
  const outsideFile = path.join(outside, 'external.ts');
  await writeFile(outsideFile, 'export const external = true;\n');
  await symlink(outsideFile, path.join(root, 'packages/core/src/external.ts'));

  const command = path.join(root, 'sem-symlink-entity.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify([{
  name: 'external', type: 'constant', start_line: 1, end_line: 1,
  start_byte: 0, end_byte: 29, parent_id: null,
  file: 'packages/core/src/external.ts'
}]));
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      command,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'entities');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /escapes repository root through symbolic link/);
      return true;
    },
  );
});

test('sem adapter rejects out-of-project, duplicate, and out-of-source entities', async () => {
  const root = await fixture();
  const outsideProjectCommand = path.join(root, 'sem-outside-project.mjs');
  await writeFile(outsideProjectCommand, `#!/usr/bin/env node
process.stdout.write(JSON.stringify([{
  name: 'View', type: 'function', start_line: 1, end_line: 1,
  start_byte: 0, end_byte: 20, parent_id: null,
  file: 'packages/react/src/view.ts'
}]));
`);
  await chmod(outsideProjectCommand, 0o755);
  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      command: outsideProjectCommand,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'entities');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /outside analysis project core/);
      return true;
    },
  );

  const duplicateCommand = path.join(root, 'sem-duplicate-top-level.mjs');
  await writeFile(duplicateCommand, `#!/usr/bin/env node
const entity = {
  name: 'Core', type: 'class', start_line: 1, end_line: 1,
  start_byte: 0, end_byte: 20, parent_id: null,
  file: 'packages/core/src/index.ts'
};
process.stdout.write(JSON.stringify([entity, entity]));
`);
  await chmod(duplicateCommand, 0o755);
  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      command: duplicateCommand,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /duplicate top-level ID/);
      return true;
    },
  );

  const lineRangeCommand = path.join(root, 'sem-out-of-source-range.mjs');
  await writeFile(lineRangeCommand, `#!/usr/bin/env node
process.stdout.write(JSON.stringify([{
  name: 'Core', type: 'class', start_line: 999999, end_line: 999999,
  start_byte: 0, end_byte: 20, parent_id: null,
  file: 'packages/core/src/index.ts'
}]));
`);
  await chmod(lineRangeCommand, 0o755);
  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      command: lineRangeCommand,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /exceeds source file line count/);
      return true;
    },
  );
});

test('source line validation stops at the required line with bounded memory', async () => {
  const root = await fixture();
  const sourceFile = path.join(root, 'packages/core/src/large.ts');
  await writeFile(
    sourceFile,
    `${'x'.repeat((64 * 1024) - 1)}\r\nexport const second = true;\n`,
  );
  await truncate(sourceFile, 128 * 1024 * 1024);

  const command = path.join(root, 'sem-large-source.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify([{
  name: 'second', type: 'constant', start_line: 2, end_line: 2,
  start_byte: 65537, end_byte: 65564, parent_id: null,
  file: 'packages/core/src/large.ts'
}]));
`);
  await chmod(command, 0o755);

  const probe = path.join(root, 'source-line-memory-probe.mjs');
  const packageEntry = new URL('../dist/index.js', import.meta.url).href;
  await writeFile(probe, `import { runSemProjectAnalysis } from ${JSON.stringify(packageEntry)};
const before = process.resourceUsage().maxRSS;
const analysis = runSemProjectAnalysis({
  repositoryRoot: ${JSON.stringify(root)},
  project: { id: 'core', root: 'packages/core' },
  impactFromPatterns: [],
  command: ${JSON.stringify(command)}
});
const after = process.resourceUsage().maxRSS;
process.stdout.write(JSON.stringify({
  entities: analysis.entities.length,
  maxRssDeltaKiB: after - before
}));
`);
  const result = spawnSync(process.execPath, [probe], {
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.equal(result.status, 0, result.stderr);
  const measurement = JSON.parse(result.stdout);
  assert.equal(measurement.entities, 1);
  assert.ok(
    measurement.maxRssDeltaKiB < 64 * 1024,
    `source line validation increased peak RSS by ${measurement.maxRssDeltaKiB} KiB`,
  );
});

test('sem adapter rejects impact responses for a different target', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-wrong-impact-target.mjs');
  await writeFile(command, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact') {
  process.stdout.write(JSON.stringify({
    entity: {
      entityId: 'packages/core/src/index.ts::class::Other',
      file: 'packages/core/src/index.ts', name: 'Other', type: 'class'
    },
    dependencies: [], dependents: [], tests: []
  }));
}
`);
  await chmod(command, 0o755);
  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /does not match requested target/);
      return true;
    },
  );
});

test('sem adapter rejects duplicate impact relation IDs', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-duplicate-impact-relation.mjs');
  await writeFile(command, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact') {
  const dependency = {
    entityId: 'packages/react/src/view.ts::function::View',
    file: 'packages/react/src/view.ts', name: 'View', type: 'function'
  };
  process.stdout.write(JSON.stringify({
    entity: {
      entityId: 'packages/core/src/index.ts::class::Core',
      file: 'packages/core/src/index.ts', name: 'Core', type: 'class'
    },
    dependencies: [dependency, dependency], dependents: [], tests: []
  }));
}
`);
  await chmod(command, 0o755);

  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: ['packages/core/**'],
      command,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'impact');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /dependencies contains duplicate entity ID/);
      return true;
    },
  );
});

test('sem adapter rejects diff paths outside the repository', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-outside-diff.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 1, added: 0, modified: 1, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 1
  },
  changes: [{
  entityId: '../outside.ts::function::outside',
  changeType: 'modified',
  entityType: 'function',
  filePath: '../outside.ts'
  }],
  binaryChanges: []
}));
`);
  await chmod(command, 0o755);
  assert.throws(
    () => runSemDiff({
      repositoryRoot: root,
      command,
      from: 'base',
      to: 'head',
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'diff');
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /escapes repository root/);
      return true;
    },
  );

  const mismatchedCommand = path.join(root, 'sem-mismatched-diff.mjs');
  await writeFile(mismatchedCommand, `#!/usr/bin/env node
process.stdout.write(JSON.stringify({
  summary: {
    fileCount: 1, added: 0, modified: 1, deleted: 0, moved: 0,
    renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 1
  },
  changes: [{
  entityId: 'packages/react/src/view.ts::function::View',
  changeType: 'modified',
  entityType: 'function',
  filePath: 'packages/core/src/index.ts'
  }],
  binaryChanges: []
}));
`);
  await chmod(mismatchedCommand, 0o755);
  assert.throws(
    () => runSemDiff({
      repositoryRoot: root,
      command: mismatchedCommand,
      from: 'base',
      to: 'head',
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /does not match filePath/);
      return true;
    },
  );
});

test('missing sem evidence follows the configured fail threshold', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['CORE-NO-UI'] }),
    policies: [{
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'CORE-NO-UI',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
      }],
    }],
    failOn: 'warning',
  });
  assert.equal(report.passed, false);
  assert.equal(report.findings[0]?.code, 'SEM_EVIDENCE_MISSING');
});

test('renders capability traceability and sem project counts', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [analysis(root)],
  });
  const markdown = renderMarkdownReport(report);
  assert.match(markdown, /Capability Traceability/);
  assert.match(markdown, /Sem projects: 1/);
});

test('renders untrusted finding text without creating console or Markdown rows', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semAnalyses: [analysis(root)],
  });
  const hostileReport = {
    ...report,
    passed: false,
    summary: { ...report.summary, errors: 1 },
    findings: [{
      code: 'HOSTILE_FINDING',
      severity: 'error',
      ruleId: 'rule|`id`',
      message: 'first line\n| forged | `tick` \\ path \u001b[31mred\u001b[0m \u202e![image](https://invalid.test/x) <details>',
    }],
  };
  const consoleReport = renderConsoleReport(hostileReport);
  const consoleFindingLines = consoleReport
    .split('\n')
    .filter((line) => line.startsWith('[ERROR]'));
  assert.equal(consoleFindingLines.length, 1);
  assert.match(consoleFindingLines[0] ?? '', /first line \| forged \| `tick` \\ path/);
  assert.match(consoleFindingLines[0] ?? '', /red !\[image\]/);
  assert.doesNotMatch(consoleReport, /\u001b|\u202e/u);

  const markdown = renderMarkdownReport(hostileReport);
  const markdownFindingLines = markdown
    .split('\n')
    .filter((line) => line.startsWith('| error |'));
  assert.equal(markdownFindingLines.length, 1);
  assert.match(markdownFindingLines[0] ?? '', /first line/);
  assert.match(markdownFindingLines[0] ?? '', /forged/);
  assert.match(markdownFindingLines[0] ?? '', /``.*!\[image\]\(https:\/\/invalid\.test\/x\) <details>.*``/);
  assert.doesNotMatch(markdown, /\u001b|\u202e/u);
  assert.doesNotMatch(markdown, /\n\| forged \|/);
});

test('report helpers reject provenance that renders as invisible text', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  const invisibleFindingReport = {
    ...report,
    passed: false,
    summary: { ...report.summary, errors: 1 },
    findings: [{
      code: 'INVISIBLE',
      severity: 'error',
      message: ' \u202e\t',
    }],
  };
  assert.throws(
    () => assertVerificationReport(invisibleFindingReport),
    /non-empty string containing visible text/,
  );

  assert.throws(
    () => appendSemExecutionFailure(report, {
      operation: 'version',
      reason: 'spawn',
      command: ' \u202e\t',
      args: ['--version'],
      cwd: root,
      durationMs: 1,
      timeoutMs: 100,
      maxOutputBytes: 1024,
    }),
    /non-empty string containing visible text/,
  );

  const malformedUnicodeReport = {
    ...report,
    passed: false,
    summary: { ...report.summary, errors: 1 },
    findings: [{
      code: 'MALFORMED_UNICODE',
      severity: 'error',
      message: 'broken \ud800 provenance',
    }],
  };
  assert.throws(
    () => assertVerificationReport(malformedUnicodeReport),
    /well-formed Unicode/,
  );
});

test('sem failure truncation preserves Unicode scalar boundaries', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  const command = `${'x'.repeat(MAX_SEM_FAILURE_TEXT_CHARS - 1)}😀`;
  const bounded = appendSemExecutionFailure(report, {
    operation: 'version',
    reason: 'spawn',
    command,
    args: ['--version'],
    cwd: root,
    durationMs: 1,
    timeoutMs: 100,
    maxOutputBytes: 1024,
  });

  assert.equal(bounded.semFailure?.command.isWellFormed(), true);
  assert.match(bounded.semFailure?.command ?? '', /…$/u);
  assert.doesNotThrow(() => assertVerificationReport(bounded));
});

test('report helpers reject malformed reports before rendering or gating', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  assert.doesNotThrow(() => assertVerificationReport(report));

  const malformed = { ...report, findings: null };
  for (const operation of [
    () => assertVerificationReport(malformed),
    () => renderConsoleReport(malformed),
    () => renderMarkdownReport(malformed),
    () => renderJsonReport(malformed),
    () => reportFailsAt(malformed, 'error'),
    () => appendSemExecutionFailure(malformed, {}),
  ]) {
    assert.throws(
      operation,
      (error) => error instanceof InputContractError && !(error instanceof TypeError),
    );
  }

  assert.throws(
    () => assertVerificationReport({
      ...report,
      findings: [{ code: 'INVALID', severity: 'critical', message: 'invalid' }],
    }),
    /report\.findings\[0\]\.severity is unsupported/,
  );
  assert.throws(
    () => assertVerificationReport({ ...report, contractVersion: '9.0' }),
    /report\.contractVersion is unsupported/,
  );
  assert.throws(
    () => reportFailsAt(report, 'fatal'),
    /Report fail threshold is unsupported: "fatal"/,
  );
});

test('report contract bounds external collection cardinality before traversal', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  const oversizedGeneral = new Array(
    MAX_VERIFICATION_REPORT_COLLECTION_ITEMS + 1,
  );
  const oversizedProjects = new Array(
    MAX_VERIFICATION_REPORT_PROJECT_ITEMS + 1,
  );

  assert.throws(
    () => assertVerificationReport({
      ...report,
      findings: oversizedGeneral,
    }),
    new RegExp(
      `report\\.findings exceeds ${MAX_VERIFICATION_REPORT_COLLECTION_ITEMS} item report limit`,
    ),
  );
  assert.throws(
    () => assertVerificationReport({
      ...report,
      semAnalyses: oversizedProjects,
    }),
    new RegExp(
      `report\\.semAnalyses exceeds ${MAX_VERIFICATION_REPORT_PROJECT_ITEMS} item report limit`,
    ),
  );
  assert.throws(
    () => assertVerificationReport({
      ...report,
      semChanges: {
        source: { mode: 'working' },
        entities: 0,
        files: oversizedGeneral,
        semanticFiles: [],
        binaryFiles: [],
        untrackedFiles: [],
        affectedCapabilities: [],
        affectedDocuments: [],
        affectedTests: [],
      },
    }),
    new RegExp(
      `report\\.semChanges\\.files exceeds ${MAX_VERIFICATION_REPORT_COLLECTION_ITEMS} item report limit`,
    ),
  );
});

test('report contract bounds individual and aggregate text before rendering', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  const oversizedItem = {
    ...report,
    passed: false,
    summary: { ...report.summary, errors: 1 },
    findings: [{
      code: 'OVERSIZED_TEXT',
      severity: 'error',
      message: 'x'.repeat(MAX_VERIFICATION_REPORT_TEXT_CHARS + 1),
    }],
  };
  for (const operation of [
    () => assertVerificationReport(oversizedItem),
    () => renderConsoleReport(oversizedItem),
    () => renderMarkdownReport(oversizedItem),
    () => renderJsonReport(oversizedItem),
  ]) {
    assert.throws(
      operation,
      new RegExp(`${MAX_VERIFICATION_REPORT_TEXT_CHARS} character report limit`),
    );
  }

  const findingCount = Math.floor(
    MAX_VERIFICATION_REPORT_TEXT_CHARS_TOTAL
      / MAX_VERIFICATION_REPORT_TEXT_CHARS,
  ) + 1;
  const aggregateText = {
    ...report,
    passed: false,
    summary: { ...report.summary, errors: findingCount },
    findings: Array.from({ length: findingCount }, (_, index) => ({
      code: `AGGREGATE-TEXT-${index}`,
      severity: 'error',
      message: 'x'.repeat(MAX_VERIFICATION_REPORT_TEXT_CHARS),
    })),
  };
  assert.throws(
    () => assertVerificationReport(aggregateText),
    new RegExp(
      `${MAX_VERIFICATION_REPORT_TEXT_CHARS_TOTAL} aggregate text character limit`,
    ),
  );
  assert.throws(
    () => renderJsonReport(aggregateText),
    new RegExp(
      `${MAX_VERIFICATION_REPORT_TEXT_CHARS_TOTAL} aggregate text character limit`,
    ),
  );
});

test('report helpers reject contradictory summaries and gate results', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  const contradictoryReports = [
    [
      {
        ...report,
        summary: { ...report.summary, capabilities: 1 },
      },
      /report\.summary\.capabilities must equal 0/,
    ],
    [
      {
        ...report,
        summary: {
          ...report.summary,
          capabilities: Number.MAX_SAFE_INTEGER + 1,
        },
      },
      /report\.summary\.capabilities must be a safe integer/,
    ],
    [
      {
        ...report,
        summary: { ...report.summary, errors: 1 },
      },
      /report\.summary\.errors must equal 0/,
    ],
    [
      { ...report, passed: false },
      /report\.passed must be true for failOn error/,
    ],
    [
      { ...report, generatedAt: '2026-07-15' },
      /report\.generatedAt must be a canonical UTC ISO timestamp/,
    ],
    [
      { ...report, generatedAt: '2026-02-30T00:00:00.000Z' },
      /report\.generatedAt must be a valid canonical UTC ISO timestamp/,
    ],
    [
      {
        ...report,
        semChanges: {
          source: { mode: 'working' },
          entities: 0,
          files: [],
          semanticFiles: [],
          binaryFiles: [],
          untrackedFiles: ['untracked.ts'],
          affectedCapabilities: [],
          affectedDocuments: [],
          affectedTests: [],
        },
      },
      /categorized files must be a subset of files/,
    ],
  ];
  for (const [contradictory, expected] of contradictoryReports) {
    assert.throws(
      () => assertVerificationReport(contradictory),
      expected,
    );
  }
});

test('report helpers reject contradictory change provenance and cross references', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry(),
    semChanges: {
      source: { mode: 'working' },
      changes: [{
        entityId: 'packages/core/src/index.ts::class::Core',
        changeType: 'modified',
        filePath: 'packages/core/src/index.ts',
      }],
      binaryChanges: [{ filePath: 'docs/core.md', status: 'modified' }],
    },
  });
  const baseChanges = report.semChanges;
  assert.ok(baseChanges);
  const contradictoryReports = [
    [
      {
        ...report,
        semChanges: { ...baseChanges, files: [...baseChanges.files, 'extra.txt'] },
      },
      /files contains uncategorized path: extra\.txt/,
    ],
    [
      {
        ...report,
        semChanges: {
          ...baseChanges,
          semanticFiles: [...baseChanges.semanticFiles, ...baseChanges.binaryFiles],
        },
      },
      /file cannot be both semanticFiles and binaryFiles: docs\/core\.md/,
    ],
    [
      {
        ...report,
        semChanges: {
          ...baseChanges,
          files: [...baseChanges.binaryFiles, ...baseChanges.untrackedFiles],
          semanticFiles: [],
        },
      },
      /entities and semanticFiles must both be empty or both be non-empty/,
    ],
    [
      {
        ...report,
        semChanges: { ...baseChanges, affectedCapabilities: ['UNKNOWN'] },
      },
      /affectedCapabilities references unknown capability: UNKNOWN/,
    ],
    [
      {
        ...report,
        semChanges: {
          ...baseChanges,
          affectedCapabilities: [],
          affectedDocuments: ['docs/core.md'],
        },
      },
      /affected documents or tests require an affected capability/,
    ],
    [
      {
        ...report,
        semChanges: {
          ...baseChanges,
          files: ['/absolute.txt'],
          semanticFiles: ['/absolute.txt'],
          binaryFiles: [],
        },
      },
      /must be a normalized repository-relative file path/,
    ],
    [
      {
        ...report,
        semChanges: {
          ...baseChanges,
          files: ['../outside.txt', ...baseChanges.binaryFiles],
          semanticFiles: ['../outside.txt'],
        },
      },
      /must be a normalized repository-relative file path/,
    ],
    [
      {
        ...report,
        semChanges: {
          ...baseChanges,
          files: ['packages//core.ts', ...baseChanges.binaryFiles],
          semanticFiles: ['packages//core.ts'],
        },
      },
      /must be a normalized repository-relative file path/,
    ],
    [
      {
        ...report,
        passed: false,
        summary: { ...report.summary, errors: report.summary.errors + 1 },
        findings: [{
          code: 'FABRICATED',
          severity: 'error',
          message: 'fabricated',
          capabilityId: 'UNKNOWN',
        }, ...report.findings],
      },
      /findings capabilityId references unknown capability: UNKNOWN/,
    ],
    [
      {
        ...report,
        summary: { ...report.summary, capabilities: 2 },
        capabilities: [...report.capabilities, report.capabilities[0]],
      },
      /capabilities must not contain duplicate id values/,
    ],
    [
      {
        ...report,
        semAnalyses: [
          { projectId: 'core', root, entities: 0, impacts: 0 },
          { projectId: 'core', root, entities: 0, impacts: 0 },
        ],
      },
      /semAnalyses must not contain duplicate projectId values/,
    ],
  ];
  for (const [contradictory, expected] of contradictoryReports) {
    assert.throws(
      () => assertVerificationReport(contradictory),
      expected,
    );
  }
});

test('report helpers reject inconsistent sem failure progress provenance', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  const failure = {
    operation: 'entities',
    reason: 'exit',
    command: '/fixture/sem',
    args: ['entities', '--json'],
    cwd: root,
    durationMs: 1,
    timeoutMs: 100,
    maxOutputBytes: 1024,
    projectId: 'core',
    requestedProjects: ['core'],
    completedProjects: [],
    skippedProjects: [],
  };
  const failureReport = appendSemExecutionFailure(report, failure);
  assert.doesNotThrow(() => assertVerificationReport(failureReport));

  const inconsistentFailures = [
    [
      { ...failureReport.semFailure, completedProjects: undefined },
      /project progress fields must be provided together/,
    ],
    [
      {
        ...failureReport.semFailure,
        requestedProjects: ['core'],
        completedProjects: ['react'],
      },
      /completedProjects must be a subset of requestedProjects: react/,
    ],
    [
      {
        ...failureReport.semFailure,
        completedProjects: ['core'],
        skippedProjects: ['core'],
      },
      /project cannot be both completed and skipped: core/,
    ],
    [
      {
        ...failureReport.semFailure,
        projectId: undefined,
      },
      /project progress is incomplete: core/,
    ],
    [
      {
        ...failureReport.semFailure,
        projectId: undefined,
        completedProjects: ['core'],
      },
      /completedProjects must equal report\.semAnalyses projectId values/,
    ],
  ];
  for (const [semFailure, expected] of inconsistentFailures) {
    assert.throws(
      () => assertVerificationReport({ ...failureReport, semFailure }),
      expected,
    );
  }

  assert.throws(
    () => appendSemExecutionFailure(report, {
      ...failure,
      requestedProjects: ['core', 'react'],
    }),
    /unresolved project must equal projectId/,
  );

  const manyIncompleteProjects = Array.from(
    { length: 10 },
    (_, index) => `project-${index}`,
  );
  assert.throws(
    () => assertVerificationReport({
      ...failureReport,
      semFailure: {
        ...failureReport.semFailure,
        projectId: undefined,
        requestedProjects: manyIncompleteProjects,
        completedProjects: [],
        skippedProjects: [],
      },
    }),
    (error) => {
      assert.match(error.message, /project progress is incomplete/);
      assert.match(error.message, /additional values omitted/);
      assert.doesNotMatch(error.message, /project-8(?:\D|$)/);
      assert.ok(error.message.length < 512, error.message);
      return true;
    },
  );
});

test('rejects capability references to unknown policies', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ rules: ['UNKNOWN-RULE'] }),
  });
  assert.equal(report.findings[0]?.code, 'CAPABILITY_POLICY_UNKNOWN');
  assert.equal(report.capabilities[0]?.findings, 1);
});

test('rejects capability and policy paths outside their declared project', async () => {
  const root = await fixture();
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ owners: ['packages/react'] }),
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{
        id: 'MISOWNED-PACKAGE',
        project: 'core',
        from: 'packages/react',
        disallow: ['react'],
      }],
    }],
  });
  assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
    'CAPABILITY_PROJECT_SCOPE_MISMATCH',
    'PACKAGE_POLICY_SCOPE_MISMATCH',
  ]));
});

test('rejects dot-segment traversal that only appears to belong to a project', async () => {
  const root = await fixture();
  await writeFile(path.join(root, 'packages/react/package.json'), JSON.stringify({
    dependencies: { react: '1.0.0' },
  }));
  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({ owners: ['packages/core/../react'] }),
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{
        id: 'TRAVERSAL-PACKAGE',
        project: 'core',
        from: 'packages/core/../react',
        disallow: ['react'],
      }],
      impactBoundaries: [{
        id: 'TRAVERSAL-IMPACT',
        project: 'core',
        from: ['packages/core/../react/**'],
        disallowDependencies: ['packages/core/**'],
      }],
    }],
    evaluateImpactPolicies: false,
  });
  assert.deepEqual(new Set(report.findings.map((entry) => entry.code)), new Set([
    'CAPABILITY_PROJECT_SCOPE_MISMATCH',
    'PACKAGE_POLICY_SCOPE_MISMATCH',
    'SEM_POLICY_SCOPE_MISMATCH',
  ]));
  assert.doesNotMatch(
    report.findings.map((entry) => entry.code).join(','),
    /PACKAGE_DEPENDENCY_FORBIDDEN/,
  );
});

test('CLI exposes help and stable input-error exit code', () => {
  const cli = path.resolve('dist/cli.js');
  const help = spawnSync(process.execPath, [cli, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0);
  assert.match(help.stdout, /--sem/);
  assert.match(help.stdout, /sem 0\.21\.0 entities/);
  assert.match(help.stdout, /--sem-timeout-ms/);
  assert.match(help.stdout, /--sem-max-output-bytes/);
  assert.match(help.stdout, /--max-snapshot-symbols/);
  assert.match(help.stdout, /--max-history-commits/);
  assert.match(help.stdout, /Value options may be specified once/);

  const invalid = spawnSync(process.execPath, [cli, 'unknown'], { encoding: 'utf8' });
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /Unsupported command/);

  const incompleteRange = spawnSync(process.execPath, [cli, 'check', '--sem', '--from', 'base'], { encoding: 'utf8' });
  assert.equal(incompleteRange.status, 2);
  assert.match(incompleteRange.stderr, /--from and --to/);

  const conflictingModes = spawnSync(process.execPath, [
    cli, 'check', '--sem', '--staged', '--from', 'base', '--to', 'head',
  ], { encoding: 'utf8' });
  assert.equal(conflictingModes.status, 2);
  assert.match(conflictingModes.stderr, /--staged cannot be combined/);

  const oversizedRange = spawnSync(process.execPath, [
    cli,
    'check',
    '--sem',
    '--from',
    'x'.repeat(MAX_SEM_EVIDENCE_TEXT_CHARS + 1),
    '--to',
    'head',
  ], { encoding: 'utf8' });
  assert.equal(oversizedRange.status, 2);
  assert.match(oversizedRange.stderr, /--from exceeds 4096 character limit/);

  const invisibleRange = spawnSync(process.execPath, [
    cli, 'check', '--sem', '--from', 'base', '--to', ' \u202e\t',
  ], { encoding: 'utf8' });
  assert.equal(invisibleRange.status, 2);
  assert.match(invisibleRange.stderr, /--to must contain visible text/);

  const invalidLimit = spawnSync(process.execPath, [
    cli, 'check', '--sem', '--sem-timeout-ms', '0',
  ], { encoding: 'utf8' });
  assert.equal(invalidLimit.status, 2);
  assert.match(invalidLimit.stderr, /positive integer/);

  for (const value of ['1e3', '0x100', '+25', '01']) {
    const nonCanonicalLimit = spawnSync(process.execPath, [
      cli, 'check', '--sem', '--sem-timeout-ms', value,
    ], { encoding: 'utf8' });
    assert.equal(nonCanonicalLimit.status, 2);
    assert.match(nonCanonicalLimit.stderr, /canonical base-10 positive integer/);
  }

  const limitWithoutSem = spawnSync(process.execPath, [
    cli, 'check', '--sem-max-output-bytes', '1024',
  ], { encoding: 'utf8' });
  assert.equal(limitWithoutSem.status, 2);
  assert.match(limitWithoutSem.stderr, /require --sem/);

  const duplicateSingleton = spawnSync(process.execPath, [
    cli, 'check', '--sem', '--from', 'base', '--from', 'other', '--to', 'head',
  ], { encoding: 'utf8' });
  assert.equal(duplicateSingleton.status, 2);
  assert.match(duplicateSingleton.stderr, /Duplicate option is not allowed: --from/);

  const duplicateProject = spawnSync(process.execPath, [
    cli, 'check', '--project', 'core', '--project', 'core',
  ], { encoding: 'utf8' });
  assert.equal(duplicateProject.status, 2);
  assert.match(duplicateProject.stderr, /Duplicate --project values are not allowed/);
});

test('CLI skips SEM command and impact policies when semantic analysis is disabled', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(
    path.join(root, 'architecture/registry.json'),
    JSON.stringify({
      schemaVersion: 1,
      policyFiles: ['architecture/impact-policy.json'],
      capabilities: [],
    }),
  );
  await writeFile(
    path.join(root, 'architecture/impact-policy.json'),
    JSON.stringify({
      schemaVersion: 1,
      impactBoundaries: [{
        id: 'NO-SEM-REGISTRY-CHECK',
        from: ['packages/core/**'],
        disallowDependencies: ['packages/react/**'],
        missingEvidenceSeverity: 'error',
      }],
    }),
  );

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--registry', 'architecture/registry.json',
    '--format', 'json',
  ], {
    encoding: 'utf8',
    env: { ...process.env, SEM_COMMAND: ' \u202e\t' },
  });

  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.passed, true);
  assert.deepEqual(report.findings, []);
});

test('sem adapter classifies output, exit, and invalid JSON failures', async () => {
  const root = await fixture();
  const limits = resolveSemExecutionLimits({
    // Keep provider classification deterministic on slower CI workers; this test is not a timeout test.
    timeoutMs: 3000,
    maxOutputBytes: 1024,
    env: {},
  });

  const overflowCommand = path.join(root, 'sem-overflow.mjs');
  await writeFile(overflowCommand, `#!/usr/bin/env node
process.stdout.write('x'.repeat(4096));
`);
  await chmod(overflowCommand, 0o755);
  let overflow;
  try {
    runSemVersion({ repositoryRoot: root, command: overflowCommand, limits });
  } catch (error) {
    overflow = error;
  }
  assert.ok(overflow instanceof SemExecutionError);
  assert.equal(overflow.failure.operation, 'version');
  assert.equal(overflow.failure.reason, 'output-limit');
  assert.equal(overflow.failure.maxOutputBytes, 1024);

  const combinedOverflowCommand = path.join(root, 'sem-combined-overflow.mjs');
  await writeFile(combinedOverflowCommand, `#!/usr/bin/env node
process.stdout.write('sem ${SUPPORTED_SEM_VERSION}');
process.stderr.write('x'.repeat(1018));
`);
  await chmod(combinedOverflowCommand, 0o755);
  assert.throws(
    () => runSemVersion({
      repositoryRoot: root,
      command: combinedOverflowCommand,
      limits,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.operation, 'version');
      assert.equal(error.failure.reason, 'output-limit');
      assert.equal(error.failure.maxOutputBytes, 1024);
      assert.match(error.failure.detail ?? '', /(?:ENOBUFS|combined output)/);
      return true;
    },
  );

  const exitCommand = path.join(root, 'sem-exit.mjs');
  await writeFile(exitCommand, `#!/usr/bin/env node
process.stderr.write('fixture failure');
process.exit(7);
`);
  await chmod(exitCommand, 0o755);
  let exited;
  try {
    runSemVersion({ repositoryRoot: root, command: exitCommand, limits });
  } catch (error) {
    exited = error;
  }
  assert.ok(exited instanceof SemExecutionError);
  assert.equal(exited.failure.reason, 'exit');
  assert.equal(exited.failure.exitCode, 7);
  assert.equal(exited.failure.stderr, 'fixture failure');

  const largeStderrCommand = path.join(root, 'sem-large-stderr.mjs');
  await writeFile(largeStderrCommand, `#!/usr/bin/env node
process.stderr.write('😀'.repeat(100000));
process.exit(7);
`);
  await chmod(largeStderrCommand, 0o755);
  assert.throws(
    () => runSemVersion({
      repositoryRoot: root,
      command: largeStderrCommand,
      limits: { timeoutMs: 1000, maxOutputBytes: 512 * 1024 },
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.reason, 'exit');
      assert.equal(error.failure.stderr?.isWellFormed(), true);
      assert.equal(error.failure.stderr?.length, MAX_SEM_FAILURE_TEXT_CHARS + 1);
      assert.match(error.failure.stderr ?? '', /…$/u);
      return true;
    },
  );

  const invalidJsonCommand = path.join(root, 'sem-invalid-json.mjs');
  await writeFile(invalidJsonCommand, `#!/usr/bin/env node
process.stdout.write('{');
`);
  await chmod(invalidJsonCommand, 0o755);
  let invalidJson;
  try {
    runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      command: invalidJsonCommand,
      limits,
    });
  } catch (error) {
    invalidJson = error;
  }
  assert.ok(invalidJson instanceof SemExecutionError);
  assert.equal(invalidJson.failure.operation, 'entities');
  assert.equal(invalidJson.failure.reason, 'invalid-json');
  assert.equal(invalidJson.failure.projectId, 'core');

  const invalidUtf8Command = path.join(root, 'sem-invalid-utf8.mjs');
  await writeFile(invalidUtf8Command, `#!/usr/bin/env node
process.stdout.write(Buffer.from([0x73, 0x65, 0x6d, 0x20, 0xc3, 0x28]));
`);
  await chmod(invalidUtf8Command, 0o755);
  let invalidUtf8;
  try {
    runSemVersion({ repositoryRoot: root, command: invalidUtf8Command, limits });
  } catch (error) {
    invalidUtf8 = error;
  }
  assert.ok(invalidUtf8 instanceof SemExecutionError);
  assert.equal(invalidUtf8.failure.operation, 'version');
  assert.equal(invalidUtf8.failure.reason, 'invalid-output');
  assert.match(invalidUtf8.failure.detail, /Invalid UTF-8 in sem stdout/);

  const invalidTextCommand = path.join(root, 'sem-invalid-text.mjs');
  await writeFile(invalidTextCommand, `#!/usr/bin/env node
process.stdout.write(JSON.stringify([{
  file: 'packages/core/src/index.ts',
  name: 'Core\\0hidden',
  type: 'class',
  start_line: 1,
  end_line: 1,
  parent_id: null
}]));
`);
  await chmod(invalidTextCommand, 0o755);
  assert.throws(
    () => runSemProjectAnalysis({
      repositoryRoot: root,
      project: { id: 'core', root: 'packages/core' },
      impactFromPatterns: [],
      command: invalidTextCommand,
      limits,
    }),
    (error) => {
      assert.ok(error instanceof SemExecutionError);
      assert.equal(error.failure.reason, 'invalid-output');
      assert.match(error.failure.detail, /must not contain null bytes/);
      return true;
    },
  );
});

test('sem version includes response post-processing in its command deadline', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-version-post-processing-timeout.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write('sem ${SUPPORTED_SEM_VERSION}');
`);
  await chmod(command, 0o755);

  const originalNow = performance.now.bind(performance);
  let calls = 0;
  performance.now = () => {
    calls += 1;
    return calls >= 4 ? 1001 : 0;
  };
  try {
    assert.throws(
      () => runSemVersion({
        repositoryRoot: root,
        command,
        limits: { timeoutMs: 1000, maxOutputBytes: 1024 },
      }),
      (error) => {
        assert.ok(error instanceof SemExecutionError);
        assert.equal(error.failure.operation, 'version');
        assert.equal(error.failure.reason, 'timeout');
        assert.equal(error.failure.durationMs, 1001);
        assert.match(
          error.failure.detail ?? '',
          /sem version command exceeded 1000ms budget after response post-processing/,
        );
        return true;
      },
    );
  } finally {
    performance.now = originalNow;
  }
});

test('sem adapter rejects invalid command values without leaking Node TypeError', async () => {
  const root = await fixture();
  for (const [command, message] of [
    ['', /must be a non-empty string/],
    [' \u202e\t', /must be a non-empty string containing visible text/],
    ['\0bad', /must not contain null bytes/],
  ]) {
    assert.throws(
      () => runSemVersion({ repositoryRoot: root, command }),
      (error) => {
        assert.ok(error instanceof InputContractError);
        assert.equal(error instanceof TypeError, false);
        assert.match(error.message, message);
        return true;
      },
    );
  }
});

test('architecture registry rejects whitespace-only project identifiers and roots', () => {
  for (const analysisProjects of [
    [{ id: '   ', root: 'packages/core' }],
    [{ id: 'core', root: ' \t' }],
  ]) {
    assert.throws(
      () => parseArchitectureRegistry({ schemaVersion: 1, capabilities: [], analysisProjects }),
      (error) => error instanceof InputContractError
        && /must be a non-empty string/.test(error.message),
    );
  }
});

test('architecture registry accepts explicit Foundation limit overrides', () => {
  const registry = {
    schemaVersion: 1,
    capabilities: [],
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react', fileExtensions: [`.${'a'.repeat(65)}`] },
    ],
  };
  assert.throws(() => parseArchitectureRegistry(registry), InputContractError);
  const raised = parseArchitectureRegistry(registry, {
    maxAnalysisProjects: 2,
    maxAnalysisProjectFileExtensionChars: 80,
  });
  assert.equal(raised.analysisProjects?.length, 2);
  assert.deepEqual(raised.analysisProjects?.[1]?.fileExtensions, [`.${'a'.repeat(65)}`]);
});

test('sem version rejects oversized output before provenance construction', async () => {
  const root = await fixture();
  const command = path.join(root, 'sem-long-version.mjs');
  await writeFile(command, `#!/usr/bin/env node
process.stdout.write('sem ' + 'x'.repeat(10000));
`);
  await chmod(command, 0o755);
  let failure;
  try {
    runSemVersion({
      repositoryRoot: root,
      command,
      limits: { timeoutMs: 1000, maxOutputBytes: 16 * 1024 },
    });
  } catch (error) {
    failure = error;
  }
  assert.ok(failure instanceof SemExecutionError);
  assert.equal(failure.failure.reason, 'invalid-output');
  assert.equal(failure.failure.observedVersion, undefined);
  assert.equal(
    failure.failure.detail,
    `sem --version output exceeds ${MAX_SEM_VERSION_OUTPUT_CHARS} character limit`,
  );
});

test('CLI timeout writes structured sem failure provenance', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  const command = path.join(root, 'sem-timeout.mjs');
  await writeFile(command, `#!/usr/bin/env node
setTimeout(() => process.stdout.write('sem 0.21.0'), 1000);
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--sem-timeout-ms', '25',
    '--format', 'json',
    '--output', 'reports/sem-failure.json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stdout, /Wrote architecture verification report/);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/sem-failure.json'),
    'utf8',
  ));
  assert.equal(report.contractVersion, '2.4');
  assert.equal(report.passed, false);
  assert.equal(report.findings[0].code, 'SEM_EXECUTION_FAILED');
  assert.equal(report.semFailure.operation, 'version');
  assert.equal(report.semFailure.reason, 'timeout');
  assert.equal(report.semFailure.timeoutMs, 25);
  assert.deepEqual(report.semFailure.requestedProjects, ['core']);
  assert.deepEqual(report.semFailure.completedProjects, []);
  assert.deepEqual(report.semFailure.skippedProjects, ['core']);
});

test('CLI writes structured provenance when impact query fanout exceeds its bound', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...registry(),
    policyFiles: ['architecture/impact-policy.json'],
  }));
  await writeFile(path.join(root, 'architecture/impact-policy.json'), JSON.stringify({
    schemaVersion: 1,
    impactBoundaries: [{
      id: 'CORE-IMPACT',
      project: 'core',
      from: ['packages/core/**'],
      disallowDependencies: ['packages/react/**'],
    }],
  }));
  const impactMarker = path.join(root, 'cli-impact-was-spawned');
  const command = path.join(root, 'sem-impact-fanout-cli.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify(Array.from({ length: ${MAX_SEM_IMPACT_QUERIES_PER_PROJECT + 1} }, (_, index) => ({
    name: 'Entity' + index,
    type: 'class',
    start_line: 1,
    end_line: 1,
    parent_id: null,
    file: 'packages/core/src/index.ts'
  }))));
} else if (args[0] === 'impact') {
  writeFileSync(${JSON.stringify(impactMarker)}, 'spawned');
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--format', 'json',
    '--output', 'reports/impact-limit.json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/impact-limit.json'),
    'utf8',
  ));
  assert.equal(report.findings[0].code, 'SEM_EXECUTION_FAILED');
  assert.equal(report.semFailure.operation, 'impact');
  assert.equal(report.semFailure.reason, 'query-limit');
  assert.equal(
    report.semFailure.impactTargets,
    MAX_SEM_IMPACT_QUERIES_PER_PROJECT + 1,
  );
  assert.equal(
    report.semFailure.maxImpactQueries,
    MAX_SEM_IMPACT_QUERIES_PER_PROJECT,
  );
  assert.equal(report.semFailure.projectId, 'core');
  assert.match(report.semFailure.detail, /impact targets exceed the per-project limit/);
  assert.deepEqual(report.semFailure.requestedProjects, ['core']);
  assert.deepEqual(report.semFailure.completedProjects, []);
  assert.deepEqual(report.semFailure.skippedProjects, []);
  await assert.rejects(access(impactMarker), { code: 'ENOENT' });
});

test('CLI rejects unsupported SEM versions before structural analysis', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  const marker = path.join(root, 'entities-was-run');
  const command = path.join(root, 'sem-unsupported-version.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
if (process.argv[2] === '--version') {
  process.stdout.write('sem 0.22.0');
} else {
  writeFileSync(${JSON.stringify(marker)}, 'unexpected');
  process.stdout.write('[]');
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--format', 'json',
    '--output', 'reports/version-failure.json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/version-failure.json'),
    'utf8',
  ));
  assert.equal(report.semVersion, undefined);
  assert.deepEqual(report.semAnalyses, []);
  assert.equal(report.semFailure.operation, 'version');
  assert.equal(report.semFailure.reason, 'invalid-output');
  assert.equal(report.semFailure.observedVersion, '0.22.0');
  assert.equal(report.semFailure.expectedVersion, '0.21.0');
  assert.match(report.semFailure.detail, /expected sem 0\.21\.0/);
  assert.deepEqual(report.semFailure.requestedProjects, ['core']);
  assert.deepEqual(report.semFailure.completedProjects, []);
  assert.deepEqual(report.semFailure.skippedProjects, ['core']);
  await assert.rejects(readFile(marker), /ENOENT/);
});

test('CLI preserves completed SEM analyses when a later project fails', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await mkdir(path.join(root, 'example'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...registry(),
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react' },
      { id: 'example', root: 'example' },
    ],
  }));
  const exampleMarker = path.join(root, 'example-was-run');
  const command = path.join(root, 'sem-partial.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities' && args[1] === 'packages/core') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact') {
  process.stdout.write(JSON.stringify({
    entity: { entityId: args[2], file: 'packages/core/src/index.ts', name: 'Core', type: 'class' },
    dependencies: [], dependents: [], tests: []
  }));
} else if (args[0] === 'entities' && args[1] === 'packages/react') {
  process.stderr.write('react fixture failure');
  process.exit(7);
} else if (args[0] === 'entities' && args[1] === 'example') {
  writeFileSync(${JSON.stringify(exampleMarker)}, 'unexpected');
  process.stdout.write('[]');
} else {
  process.stderr.write('unexpected command');
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--format', 'json',
    '--output', 'reports/partial-failure.json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/partial-failure.json'),
    'utf8',
  ));
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semFailure.projectId, 'react');
  assert.equal(report.semFailure.exitCode, 7);
  assert.deepEqual(report.semFailure.requestedProjects, ['core', 'react', 'example']);
  assert.deepEqual(report.semFailure.completedProjects, ['core']);
  assert.deepEqual(report.semFailure.skippedProjects, ['example']);
  assert.equal(report.findings.some((entry) => entry.code === 'SEM_EXECUTION_FAILED'), true);
  await assert.rejects(readFile(exampleMarker), /ENOENT/);
});

test('CLI stops before adopting a project that exceeds the global sem evidence budget', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...registry(),
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react' },
    ],
  }));
  const command = path.join(root, 'sem-global-evidence-limit.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  const isCore = args[1] === 'packages/core';
  const count = isCore ? ${MAX_SEM_EVIDENCE_ITEMS_TOTAL - 1} : 1;
  const file = isCore
    ? 'packages/core/src/index.ts'
    : 'packages/react/src/view.ts';
  process.stdout.write(JSON.stringify(Array.from({ length: count }, (_, index) => ({
    name: isCore && index === 0 ? 'Core' : 'Entity' + index,
    type: isCore && index === 0 ? 'class' : 'function',
    start_line: 1,
    end_line: 1,
    parent_id: null,
    file,
  }))));
} else if (args[0] === 'impact') {
  process.stdout.write(JSON.stringify({
    entity: { entityId: args[2], file: 'packages/core/src/index.ts', name: 'Core', type: 'class' },
    dependencies: [], dependents: [], tests: []
  }));
} else {
  process.stderr.write('unexpected command');
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--format', 'json',
    '--output', 'reports/global-evidence-limit.json',
  ], {
    encoding: 'utf8',
    timeout: 30_000,
  });
  assert.equal(result.status, 2, result.stderr || result.error?.message);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/global-evidence-limit.json'),
    'utf8',
  ));
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semAnalyses[0].entities, MAX_SEM_EVIDENCE_ITEMS_TOTAL - 1);
  assert.equal(report.semFailure.operation, 'entities');
  assert.equal(report.semFailure.reason, 'invalid-output');
  assert.equal(report.semFailure.projectId, 'react');
  assert.match(
    report.semFailure.detail,
    new RegExp(`${MAX_SEM_EVIDENCE_ITEMS_TOTAL} global evidence item limit`),
  );
  assert.deepEqual(report.semFailure.completedProjects, ['core']);
  assert.deepEqual(report.semFailure.skippedProjects, []);
});

test('CLI stops before adopting a project that exceeds the global sem evidence text budget', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react' },
    ],
    capabilities: [],
  }));
  const command = path.join(root, 'sem-global-evidence-text-limit.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  const isCore = args[1] === 'packages/core';
  const file = isCore
    ? 'packages/core/src/index.ts'
    : 'packages/react/src/view.ts';
  process.stdout.write(JSON.stringify(Array.from({ length: 1100 }, (_, index) => ({
    name: String(index).padStart(5, '0') + 'E'.repeat(1995),
    type: 'class',
    start_line: 1,
    end_line: 1,
    parent_id: null,
    file,
  }))));
} else {
  process.stderr.write('unexpected command');
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--format', 'json',
    '--output', 'reports/global-evidence-text-limit.json',
  ], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 2, result.stderr || result.error?.message);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/global-evidence-text-limit.json'),
    'utf8',
  ));
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semFailure.operation, 'entities');
  assert.equal(report.semFailure.reason, 'invalid-output');
  assert.equal(report.semFailure.projectId, 'react');
  assert.match(
    report.semFailure.detail,
    new RegExp(`${MAX_SEM_EVIDENCE_TEXT_CHARS_TOTAL} global evidence text character limit`),
  );
  assert.deepEqual(report.semFailure.completedProjects, ['core']);
  assert.deepEqual(report.semFailure.skippedProjects, []);
});

test('CLI shares one timeout budget across sem analysis projects', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react' },
    ],
    capabilities: [],
  }));
  const command = path.join(root, 'sem-global-timeout.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  process.stdout.write('[]');
} else {
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--sem-timeout-ms', '2000',
    '--format', 'json',
    '--output', 'reports/global-timeout.json',
  ], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 2, result.stderr || result.error?.message);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/global-timeout.json'),
    'utf8',
  ));
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semFailure.reason, 'timeout');
  assert.equal(report.semFailure.projectId, 'react');
  assert.equal(report.semFailure.timeoutMs, 2000);
  assert.match(report.semFailure.detail, /sem execution aggregate timeout/);
  assert.deepEqual(report.semFailure.completedProjects, ['core']);
});

test('CLI shares one output budget across sem analysis projects', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react' },
    ],
    capabilities: [],
  }));
  const command = path.join(root, 'sem-global-output-limit.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  const project = args[1];
  process.stdout.write(JSON.stringify([{
    name: 'E'.repeat(600),
    type: 'class',
    start_line: 1,
    end_line: 1,
    parent_id: null,
    file: project === 'packages/core'
      ? 'packages/core/src/index.ts'
      : 'packages/react/src/view.ts',
  }]));
} else {
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--sem-max-output-bytes', '1024',
    '--format', 'json',
    '--output', 'reports/global-output-limit.json',
  ], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 2, result.stderr || result.error?.message);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/global-output-limit.json'),
    'utf8',
  ));
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semFailure.reason, 'output-limit');
  assert.equal(report.semFailure.projectId, 'react');
  assert.equal(report.semFailure.maxOutputBytes, 1024);
  assert.match(report.semFailure.detail, /sem execution aggregate output/);
  assert.deepEqual(report.semFailure.completedProjects, ['core']);
});

test('CLI shares one timeout budget across sem version, analyses, and diff', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [{ id: 'core', root: 'packages/core' }],
    capabilities: [],
  }));
  const command = path.join(root, 'sem-global-phase-timeout.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
const delay = args[0] === 'diff' ? 1800 : 300;
await new Promise((resolve) => setTimeout(resolve, delay));
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  process.stdout.write('[]');
} else if (args[0] === 'diff') {
  process.stdout.write(JSON.stringify({
    summary: {
      fileCount: 0, added: 0, modified: 0, deleted: 0, moved: 0,
      renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0
    },
    changes: [], binaryChanges: []
  }));
} else {
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--sem-timeout-ms', '2000',
    '--from', 'base',
    '--to', 'head',
    '--format', 'json',
    '--output', 'reports/global-phase-timeout.json',
  ], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 2, result.stderr || result.error?.message);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/global-phase-timeout.json'),
    'utf8',
  ));
  assert.equal(report.semVersion, `sem ${SUPPORTED_SEM_VERSION}`);
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semChanges, undefined);
  assert.equal(report.semFailure.operation, 'diff');
  assert.equal(report.semFailure.reason, 'timeout');
  assert.equal(report.semFailure.timeoutMs, 2000);
  assert.match(report.semFailure.detail, /sem execution aggregate timeout/);
});

test('CLI shares one output budget across sem version, analyses, and diff', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [{ id: 'core', root: 'packages/core' }],
    capabilities: [],
  }));
  const command = path.join(root, 'sem-global-phase-output.mjs');
  await writeFile(command, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0' + ' '.repeat(250));
} else if (args[0] === 'entities') {
  process.stdout.write('[]' + ' '.repeat(250));
} else if (args[0] === 'diff') {
  process.stdout.write(JSON.stringify({
    summary: {
      fileCount: 0, added: 0, modified: 0, deleted: 0, moved: 0,
      renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0
    },
    changes: [], binaryChanges: []
  }) + ' '.repeat(600));
} else {
  process.exit(9);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--sem-max-output-bytes', '1024',
    '--from', 'base',
    '--to', 'head',
    '--format', 'json',
    '--output', 'reports/global-phase-output.json',
  ], { encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.status, 2, result.stderr || result.error?.message);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/global-phase-output.json'),
    'utf8',
  ));
  assert.equal(report.semVersion, `sem ${SUPPORTED_SEM_VERSION}`);
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semChanges, undefined);
  assert.equal(report.semFailure.operation, 'diff');
  assert.equal(report.semFailure.reason, 'output-limit');
  assert.match(report.semFailure.detail, /sem execution aggregate output/);
});

test('CLI reports git untracked scan failures without discarding SEM analyses', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await mkdir(path.join(root, 'bin'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  const semCommand = path.join(root, 'sem-before-git-failure.mjs');
  await writeFile(semCommand, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact') {
  process.stdout.write(JSON.stringify({
    entity: { entityId: args[2], file: 'packages/core/src/index.ts', name: 'Core', type: 'class' },
    dependencies: [], dependents: [], tests: []
  }));
} else if (args[0] === 'diff') {
  process.stdout.write(JSON.stringify({
    summary: {
      fileCount: 0, added: 0, modified: 0, deleted: 0, moved: 0,
      renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0
    },
    changes: [], binaryChanges: []
  }));
} else {
  process.stderr.write('unexpected command');
  process.exit(9);
}
`);
  await chmod(semCommand, 0o755);
  const gitCommand = path.join(root, 'bin/git');
  await writeFile(gitCommand, `#!${process.execPath}
process.stderr.write('fixture git failure');
process.exit(7);
`);
  await chmod(gitCommand, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--changed',
    '--sem-command', semCommand,
    '--format', 'json',
    '--output', 'reports/git-failure.json',
  ], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH ?? ''}`,
    },
  });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/git-failure.json'),
    'utf8',
  ));
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semChanges, undefined);
  assert.equal(report.semFailure.operation, 'diff');
  assert.equal(report.semFailure.command, 'git');
  assert.deepEqual(
    report.semFailure.args,
    ['ls-files', '--others', '--exclude-standard', '-z'],
  );
  assert.equal(report.semFailure.reason, 'exit');
  assert.equal(report.semFailure.exitCode, 7);
  assert.equal(report.semFailure.stderr, 'fixture git failure');
  assert.match(report.semFailure.detail, /untracked-file scan/);
  assert.deepEqual(report.semFailure.requestedProjects, ['core']);
  assert.deepEqual(report.semFailure.completedProjects, ['core']);
  assert.deepEqual(report.semFailure.skippedProjects, []);
});

test('CLI rejects invalid UTF-8 from the git untracked scan', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await mkdir(path.join(root, 'bin'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
const semCommand = path.join(root, 'sem-before-invalid-git-output.mjs');
  await writeFile(semCommand, `#!${process.execPath}
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact') {
  process.stdout.write(JSON.stringify({
    entity: { entityId: args[2], file: 'packages/core/src/index.ts', name: 'Core', type: 'class' },
    dependencies: [], dependents: [], tests: []
  }));
} else if (args[0] === 'diff') {
  process.stdout.write(JSON.stringify({
    summary: {
      fileCount: 0, added: 0, modified: 0, deleted: 0, moved: 0,
      renamed: 0, reordered: 0, binary: 0, orphan: 0, total: 0
    },
    changes: [], binaryChanges: []
  }));
} else {
  process.exit(9);
}
`);
  await chmod(semCommand, 0o755);
  const gitCommand = path.join(root, 'bin/git');
  await writeFile(gitCommand, `#!${process.execPath}
process.stdout.write(Buffer.from([0xc3, 0x28, 0x00]));
`);
  await chmod(gitCommand, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--changed',
    '--sem-command', semCommand,
    '--format', 'json',
    '--output', 'reports/git-invalid-utf8.json',
  ], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${path.join(root, 'bin')}${path.delimiter}${process.env.PATH ?? ''}`,
    },
  });
  assert.equal(result.status, 2, result.stderr);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/git-invalid-utf8.json'),
    'utf8',
  ));
  assert.deepEqual(report.semAnalyses.map((entry) => entry.projectId), ['core']);
  assert.equal(report.semFailure.operation, 'diff');
  assert.equal(report.semFailure.command, 'git');
  assert.equal(report.semFailure.reason, 'invalid-output');
  assert.match(report.semFailure.detail, /Invalid UTF-8 in git untracked-file scan stdout/);
});

test('CLI runs sem directly and validates an entity anchor', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  const command = path.join(root, 'fake-sem.mjs');
  await writeFile(command, `#!/usr/bin/env node
const args = process.argv.slice(2);
if (args[0] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (args[0] === 'entities') {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
} else if (args[0] === 'impact') {
  process.stdout.write(JSON.stringify({
    entity: { entityId: args[2], file: 'packages/core/src/index.ts', name: 'Core', type: 'class' },
    dependencies: [], dependents: [], tests: []
  }));
} else {
  process.stderr.write('unexpected command');
  process.exit(1);
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--project', 'core',
    '--sem',
    '--sem-command', command,
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.contractVersion, '2.4');
  assert.equal(report.semVersion, 'sem 0.21.0');
  assert.equal(report.semAnalyses[0].entities, 1);
  assert.equal(report.findings.length, 0);
});

test('CLI accepts distinct repeated project selections', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    schemaVersion: 1,
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react' },
    ],
    capabilities: [],
  }));
  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--project', 'core',
    '--project', 'react',
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.passed, true);
  assert.deepEqual(report.semAnalyses, []);
});

test('CLI focused project filters package policies owned by other projects', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...registry(),
    analysisProjects: [
      { id: 'core', root: 'packages/core' },
      { id: 'react', root: 'packages/react' },
    ],
    policyFiles: ['architecture/policies.json'],
  }));
  await writeFile(path.join(root, 'architecture/policies.json'), JSON.stringify({
    schemaVersion: 1,
    packageBoundaries: [{
      id: 'REACT-ONLY',
      project: 'react',
      from: 'packages/react',
      require: ['@fixture/core'],
    }],
  }));

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--project', 'core',
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).findings.length, 0);

  await writeFile(path.join(root, 'architecture/policies.json'), JSON.stringify({
    schemaVersion: 1,
    packageBoundaries: [{
      id: 'TYPO-PROJECT',
      project: 'reaact',
      from: 'packages/react',
      require: ['@fixture/core'],
    }],
  }));
  const invalidProject = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--project', 'core',
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(invalidProject.status, 1, invalidProject.stderr);
  assert.equal(JSON.parse(invalidProject.stdout).findings[0].code, 'PACKAGE_POLICY_PROJECT_UNKNOWN');
});

test('CLI focused project does not hide capabilities with unknown project IDs', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  const baseRegistry = registry();
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...baseRegistry,
    capabilities: [
      ...baseRegistry.capabilities,
      {
        ...baseRegistry.capabilities[0],
        id: 'CA-TYPO-PROJECT',
        project: 'corre',
      },
    ],
  }));

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--project', 'core',
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(
    JSON.parse(result.stdout).findings[0].code,
    'CAPABILITY_ANALYSIS_PROJECT_UNKNOWN',
  );
});

test('CLI semantic preflight rejects policy failures before running sem', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'packages/core/package.json'), JSON.stringify({
    name: '@fixture/core',
    dependencies: { react: '*' },
  }));
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...registry(),
    policyFiles: ['architecture/policies.json'],
  }));
  await writeFile(path.join(root, 'architecture/policies.json'), JSON.stringify({
    schemaVersion: 1,
    packageBoundaries: [{
      id: 'CORE-NO-REACT',
      project: 'core',
      from: 'packages/core',
      disallow: ['react'],
    }],
  }));
  const marker = path.join(root, 'sem-ran');
  const command = path.join(root, 'must-not-run-sem-preflight.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(marker)}, 'ran');
process.stdout.write('[]');
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).findings[0].code, 'PACKAGE_DEPENDENCY_FORBIDDEN');
  await assert.rejects(readFile(marker, 'utf8'));
});

test('CLI materializes the default sem project for a small registry', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  const smallRegistry = registry();
  delete smallRegistry.analysisProjects;
  delete smallRegistry.capabilities[0].project;
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(smallRegistry));
  const command = path.join(root, 'fake-sem-default.mjs');
  await writeFile(command, `#!/usr/bin/env node
if (process.argv[2] === '--version') {
  process.stdout.write('sem 0.21.0');
} else if (process.argv[2] === 'impact') {
  process.stdout.write(JSON.stringify({
    entity: { entityId: process.argv[4], file: 'packages/core/src/index.ts', name: 'Core', type: 'class' },
    dependencies: [], dependents: [], tests: []
  }));
} else {
  process.stdout.write(JSON.stringify([{
    name: 'Core', type: 'class', start_line: 1, end_line: 1,
    start_byte: 0, end_byte: 20, parent_id: null,
    file: 'packages/core/src/index.ts'
  }]));
}
`);
  await chmod(command, 0o755);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--format', 'json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.semAnalyses[0].projectId, 'default');
  assert.equal(report.findings.length, 0);
});

test('CLI rejects repository-scoped paths before sem execution or output writes', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  const cli = path.resolve('dist/cli.js');

  const outputEscape = spawnSync(process.execPath, [
    cli, 'check', '--root', root, '--output', '../escaped-report.md',
  ], { encoding: 'utf8' });
  assert.equal(outputEscape.status, 2);
  assert.match(outputEscape.stderr, /Output path escapes repository root/);
  await assert.rejects(readFile(path.join(root, '..', 'escaped-report.md'), 'utf8'));

  const originalRegistry = await readFile(
    path.join(root, 'architecture/registry.json'),
    'utf8',
  );
  const inputOverwrite = spawnSync(process.execPath, [
    cli,
    'check',
    '--root', root,
    '--output', 'architecture/registry.json',
  ], { encoding: 'utf8' });
  assert.equal(inputOverwrite.status, 2);
  assert.match(inputOverwrite.stderr, /must not overwrite architecture input/);
  assert.equal(
    await readFile(path.join(root, 'architecture/registry.json'), 'utf8'),
    originalRegistry,
  );

  const marker = path.join(root, 'sem-ran');
  const command = path.join(root, 'must-not-run-sem.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(marker)}, 'ran');
process.stdout.write('[]');
`);
  await chmod(command, 0o755);
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...registry(),
    analysisProjects: [{ id: 'core', root: '..' }],
  }));
  const projectEscape = spawnSync(process.execPath, [
    cli, 'check', '--root', root, '--sem', '--sem-command', command,
  ], { encoding: 'utf8' });
  assert.equal(projectEscape.status, 2);
  assert.match(projectEscape.stderr, /Analysis project core root escapes repository root/);
  await assert.rejects(readFile(marker, 'utf8'));
});

test('CLI atomically replaces a validated report and preserves permissions', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await mkdir(path.join(root, 'reports/architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  const outputPath = path.join(root, 'reports/architecture/report.json');
  await writeFile(outputPath, 'stale report');
  if (process.platform !== 'win32') await chmod(outputPath, 0o640);
  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--format', 'json',
    '--output', 'reports/architecture/report.json',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Wrote architecture verification report/);
  const report = JSON.parse(await readFile(
    path.join(root, 'reports/architecture/report.json'),
    'utf8',
  ));
  assert.equal(report.contractVersion, '2.4');
  assert.equal(report.passed, true);
  if (process.platform !== 'win32') {
    assert.equal((await stat(outputPath)).mode & 0o777, 0o640);
  }
  assert.deepEqual(
    (await readdir(path.join(root, 'reports/architecture')))
      .filter((entry) => entry.startsWith('.report.json.') && entry.endsWith('.tmp')),
    [],
  );
});

test('CLI rejects a final output symlink without replacing it', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
    return;
  }
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await mkdir(path.join(root, 'reports'), { recursive: true });
  await writeFile(
    path.join(root, 'architecture/registry.json'),
    JSON.stringify(registry()),
  );
  const target = path.join(root, 'reports/target.json');
  const output = path.join(root, 'reports/report.json');
  await writeFile(target, 'original target\n');
  await symlink(target, output);

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--format', 'json',
    '--output', 'reports/report.json',
  ], { encoding: 'utf8' });

  assert.equal(result.status, 2);
  assert.match(result.stderr, /Output path must not be a symbolic link/);
  assert.equal(await readFile(target, 'utf8'), 'original target\n');
  assert.equal((await lstat(output)).isSymbolicLink(), true);
  assert.deepEqual(
    (await readdir(path.join(root, 'reports')))
      .filter((entry) => entry.startsWith('.report.json.') && entry.endsWith('.tmp')),
    [],
  );
});

test('CLI rejects directory output before creating a temporary report', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await mkdir(path.join(root, 'reports'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));

  const result = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--format', 'json',
    '--output', 'reports',
  ], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(
    result.stderr,
    /Output path must be a file when it already exists/,
  );
  assert.deepEqual(
    (await readdir(root))
      .filter((entry) => entry.startsWith('.reports.') && entry.endsWith('.tmp')),
    [],
  );

  const repositoryDirectory = spawnSync(process.execPath, [
    path.resolve('dist/cli.js'),
    'check',
    '--root', root,
    '--format', 'json',
    '--output', '.',
  ], { encoding: 'utf8' });
  assert.equal(repositoryDirectory.status, 2);
  assert.match(
    repositoryDirectory.stderr,
    /Output path must be a file when it already exists/,
  );
  assert.deepEqual(
    (await readdir(path.dirname(root)))
      .filter((entry) =>
        entry.startsWith(`.${path.basename(root)}.`)
        && entry.endsWith('.tmp')),
    [],
  );
});

test('canonical path checks reject symlink escapes before sem or report writes', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
    return;
  }
  const root = await fixture();
  const outside = await mkdtemp(path.join(tmpdir(), 'arch-governance-outside-'));
  await mkdir(path.join(root, 'architecture'), { recursive: true });
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  const marker = path.join(root, 'sem-ran');
  const command = path.join(root, 'must-not-run-sem-symlink.mjs');
  await writeFile(command, `#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(marker)}, 'ran');
process.stdout.write('[]');
`);
  await chmod(command, 0o755);
  const cli = path.resolve('dist/cli.js');

  await symlink(outside, path.join(root, 'linked-project'), 'dir');
  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify({
    ...registry(),
    analysisProjects: [{ id: 'core', root: 'linked-project' }],
  }));
  const projectResult = spawnSync(process.execPath, [
    cli,
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
  ], { encoding: 'utf8' });
  assert.equal(projectResult.status, 2);
  assert.match(projectResult.stderr, /through symbolic link/);
  await assert.rejects(readFile(marker, 'utf8'));

  await writeFile(path.join(root, 'architecture/registry.json'), JSON.stringify(registry()));
  await symlink(outside, path.join(root, 'reports'), 'dir');
  const outputResult = spawnSync(process.execPath, [
    cli,
    'check',
    '--root', root,
    '--sem',
    '--sem-command', command,
    '--output', 'reports/report.md',
  ], { encoding: 'utf8' });
  assert.equal(outputResult.status, 2);
  assert.match(outputResult.stderr, /through symbolic link/);
  await assert.rejects(readFile(path.join(outside, 'report.md'), 'utf8'));
  await assert.rejects(readFile(marker, 'utf8'));
});

test('verifier reports capability evidence that resolves outside through a symlink', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows symlink creation requires elevated privileges');
    return;
  }
  const root = await fixture();
  const outside = await mkdtemp(path.join(tmpdir(), 'arch-governance-evidence-'));
  const outsideFile = path.join(outside, 'external.ts');
  await writeFile(outsideFile, 'export class External {}\n');
  await symlink(outsideFile, path.join(root, 'packages/core/src/external.ts'));

  const report = await verifyArchitecture({
    root,
    registryPath: 'architecture/registry.json',
    registry: registry({
      implementationAnchors: ['packages/core/src/external.ts::class::External'],
    }),
  });
  assert.equal(report.passed, false);
  assert.ok(report.findings.some((entry) =>
    entry.code === 'IMPLEMENTATION_PATH_MISSING_OUTSIDE_ROOT'));
});
