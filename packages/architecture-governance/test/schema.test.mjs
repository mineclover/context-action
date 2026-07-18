import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  appendSemExecutionFailure,
  assertVerificationReport,
  InputContractError,
  loadArchitecturePolicySet,
  loadArchitectureRegistry,
  MAX_ARCHITECTURE_COLLECTION_ITEMS,
  MAX_ARCHITECTURE_JSON_BYTES,
  MAX_ARCHITECTURE_REFERENCE_ITEMS,
  MAX_ARCHITECTURE_TEXT_CHARS,
  MAX_ARCHITECTURE_TEXT_CHARS_TOTAL,
  MAX_DIAGNOSTIC_LIST_ITEMS,
  MAX_GLOB_PATTERN_SET_COMPLEXITY,
  MAX_SEM_FAILURE_COLLECTION_ITEMS,
  MAX_SEM_FAILURE_INPUT_TEXT_CHARS,
  MAX_SEM_FAILURE_INPUT_TEXT_CHARS_TOTAL,
  MAX_SEM_FAILURE_TEXT_CHARS,
  MAX_SEM_FAILURE_TEXT_CHARS_TOTAL,
  MAX_VERIFICATION_REPORT_COLLECTION_ITEMS,
  MAX_VERIFICATION_REPORT_PROJECT_ITEMS,
  MAX_VERIFICATION_REPORT_TEXT_CHARS,
  parseArchitecturePolicySet,
  parseArchitectureRegistry,
  renderConsoleReport,
  renderMarkdownReport,
  verifyArchitecture,
} from '../dist/index.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repositoryRoot = path.resolve(packageRoot, '../..');
const registryPath = path.join(repositoryRoot, 'architecture/registry.json');
const packagePolicyPath = path.join(
  repositoryRoot,
  'architecture/rules/package-boundaries.json',
);
const impactPolicyPath = path.join(
  repositoryRoot,
  'architecture/rules/impact-boundaries.json',
);

async function json(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function schemas() {
  return {
    registry: await json(path.join(packageRoot, 'schemas/architecture-registry.schema.json')),
    policy: await json(path.join(packageRoot, 'schemas/policy-set.schema.json')),
    report: await json(path.join(packageRoot, 'schemas/verification-report.schema.json')),
    snapshot: await json(path.join(packageRoot, 'schemas/symbol-snapshot.schema.json')),
    history: await json(path.join(packageRoot, 'schemas/symbol-history.schema.json')),
    snapshotDiff: await json(path.join(packageRoot, 'schemas/symbol-snapshot-diff.schema.json')),
    contextManifest: await json(path.join(packageRoot, 'schemas/context-manifest.schema.json')),
    contextScope: await json(path.join(packageRoot, 'schemas/context-scope.schema.json')),
  };
}

function validator() {
  return new Ajv2020({ allErrors: true, strict: true, validateFormats: false });
}

test('package export map exposes every published schema asset', async () => {
  const subpaths = [
    'architecture-registry',
    'policy-set',
    'verification-report',
    'symbol-snapshot',
    'symbol-history',
    'symbol-snapshot-diff',
    'context-manifest',
    'context-scope',
  ];
  for (const subpath of subpaths) {
    const url = import.meta.resolve(
      `@context-action/architecture-governance/schemas/${subpath}`,
    );
    const source = await readFile(fileURLToPath(url), 'utf8');
    assert.doesNotThrow(() => JSON.parse(source));
  }
});

test('published JSON Schemas compile and accept repository contracts', async () => {
  const schema = await schemas();
  const ajv = validator();
  for (const contract of Object.values(schema)) {
    assert.equal(ajv.validateSchema(contract), true, JSON.stringify(ajv.errors));
  }

  const validateRegistry = ajv.compile(schema.registry);
  const validatePolicy = ajv.compile(schema.policy);
  const validateSnapshot = ajv.compile(schema.snapshot);
  const validateHistory = ajv.compile(schema.history);
  const validateSnapshotDiff = ajv.compile(schema.snapshotDiff);
  const validateContextManifest = ajv.compile(schema.contextManifest);
  const validateContextScope = ajv.compile(schema.contextScope);
  assert.equal(validateRegistry(await json(registryPath)), true, JSON.stringify(validateRegistry.errors));
  assert.equal(validatePolicy(await json(packagePolicyPath)), true, JSON.stringify(validatePolicy.errors));
  assert.equal(validatePolicy(await json(impactPolicyPath)), true, JSON.stringify(validatePolicy.errors));
  assert.equal(validateSnapshot({
    contractId: 'context-action/symbol-snapshot',
    contractVersion: '1.1',
    repositoryRoot: repositoryRoot,
    revision: { gitHead: 'a'.repeat(40) },
    projects: [{ id: 'core', root: 'packages/core' }],
    projectStatuses: [{ projectId: 'core', root: 'packages/core', status: 'analyzed' }],
    symbols: [{
      projectId: 'core',
      entityId: 'src/index.ts::function::main',
      filePath: 'src/index.ts',
      symbol: 'function::main',
      kind: 'function',
      name: 'main',
      startLine: 1,
      endLine: 2,
    }],
  }), true, JSON.stringify(validateSnapshot.errors));
  assert.equal(validateHistory({
    contractId: 'context-action/symbol-history-report',
    contractVersion: '1.3',
    generatedAt: new Date().toISOString(),
    repositoryRoot,
    range: { from: 'a'.repeat(40), to: 'b'.repeat(40) },
    commits: [],
    summary: {
      commits: 0,
      changes: 0,
      snapshotSymbols: 0,
      added: 0,
      modified: 0,
      deleted: 0,
      moved: 0,
      renamed: 0,
      reordered: 0,
    },
  }), true, JSON.stringify(validateHistory.errors));
  assert.equal(validateSnapshotDiff({
    contractId: 'context-action/symbol-snapshot-diff',
    contractVersion: '1.0',
    generatedAt: new Date().toISOString(),
    beforeRevision: 'base',
    afterRevision: 'next',
    added: [],
    removed: [],
    modified: [],
  }), true, JSON.stringify(validateSnapshotDiff.errors));
  const ref = {
    projectId: 'core',
    filePath: 'src/index.ts',
    entityId: 'src/index.ts::function::main',
  };
  const manifest = {
    schemaVersion: 1,
    revision: { gitHead: 'a'.repeat(40) },
    contexts: [{
      id: 'main-screen',
      kind: 'screen',
      anchors: [{ role: 'root', symbol: ref }],
      declaredEdges: [{ id: 'main-renders-view', from: ref, to: ref, kind: 'renders' }],
    }],
  };
  assert.equal(validateContextManifest(manifest), true, JSON.stringify(validateContextManifest.errors));
  assert.equal(validateContextScope({
    contractId: 'context-action/context-scope',
    contractVersion: '1.0',
    context: { id: 'main-screen', kind: 'screen' },
    source: {
      snapshot: {
        contractId: 'context-action/symbol-snapshot',
        contractVersion: '1.1',
        revision: { gitHead: 'a'.repeat(40) },
      },
      manifest: { path: 'architecture/contexts.json', contentDigest: 'a'.repeat(64) },
    },
    anchors: [{ role: 'root', symbol: ref }],
    nodes: [ref],
    edges: [{
      from: '4:core|12:src/index.ts|28:src/index.ts::function::main',
      to: '4:core|12:src/index.ts|28:src/index.ts::function::main',
      kind: 'renders',
      evidence: { provider: 'manifest', declarationId: 'main-renders-view' },
    }],
    groups: [{
      id: 'context:main-screen',
      kind: 'context',
      label: 'main-screen',
      memberNodeKeys: ['4:core|12:src/index.ts|28:src/index.ts::function::main'],
    }],
    status: {
      kind: 'complete',
      appliedLimits: { maxDepth: 2, maxNodes: 10, maxEdges: 10, maxGroups: 10 },
    },
  }), true, JSON.stringify(validateContextScope.errors));
});

test('policy schema bounds glob patterns consistently with the runtime loader', async () => {
  const schema = await schemas();
  assert.equal(
    schema.policy.$defs.globPatternSet.maxItems,
    MAX_GLOB_PATTERN_SET_COMPLEXITY,
  );
  const validatePolicy = validator().compile(schema.policy);
  const invalid = {
    schemaVersion: 1,
    impactBoundaries: [{
      id: 'OVERSIZED-GLOB',
      from: ['a'.repeat(4097)],
      disallowDependencies: ['packages/react/**'],
    }],
  };
  assert.equal(validatePolicy(invalid), false);
  assert.ok(validatePolicy.errors?.some((error) => error.keyword === 'maxLength'));
});

test('architecture schemas and runtime bound authored collection cardinality', async () => {
  const schema = await schemas();
  assert.equal(
    schema.registry.properties.analysisProjects.maxItems,
    MAX_ARCHITECTURE_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.registry.properties.policyFiles.maxItems,
    MAX_ARCHITECTURE_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.registry.properties.capabilities.maxItems,
    MAX_ARCHITECTURE_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.registry.$defs.stringSet.maxItems,
    MAX_ARCHITECTURE_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.policy.properties.packageBoundaries.maxItems,
    MAX_ARCHITECTURE_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.policy.properties.impactBoundaries.maxItems,
    MAX_ARCHITECTURE_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.policy.$defs.nonEmptyStringSet.maxItems,
    MAX_ARCHITECTURE_COLLECTION_ITEMS,
  );

  const policyFiles = Array.from(
    { length: MAX_ARCHITECTURE_COLLECTION_ITEMS + 1 },
    (_, index) => `architecture/rules/${index}.json`,
  );
  const oversizedRegistry = {
    schemaVersion: 1,
    policyFiles,
    capabilities: [],
  };
  const packageBoundaries = Array.from(
    { length: MAX_ARCHITECTURE_COLLECTION_ITEMS + 1 },
    (_, index) => ({
      id: `RULE-${index}`,
      from: 'packages/core',
      disallow: [`dependency-${index}`],
    }),
  );
  const oversizedPolicy = { schemaVersion: 1, packageBoundaries };
  const validateRegistry = validator().compile(schema.registry);
  const validatePolicy = validator().compile(schema.policy);
  assert.equal(validateRegistry(oversizedRegistry), false);
  assert.ok(validateRegistry.errors?.some((error) => error.keyword === 'maxItems'));
  assert.equal(validatePolicy(oversizedPolicy), false);
  assert.ok(validatePolicy.errors?.some((error) => error.keyword === 'maxItems'));
  assert.throws(
    () => parseArchitectureRegistry(oversizedRegistry),
    new RegExp(`policyFiles exceeds ${MAX_ARCHITECTURE_COLLECTION_ITEMS} item limit`),
  );
  assert.throws(
    () => parseArchitecturePolicySet(oversizedPolicy),
    new RegExp(`packageBoundaries exceeds ${MAX_ARCHITECTURE_COLLECTION_ITEMS} item limit`),
  );

  const aggregateRegistry = {
    schemaVersion: 1,
    capabilities: Array.from({ length: 17 }, (_, capabilityIndex) => ({
      id: `CA-LIMIT-${capabilityIndex}`,
      status: 'planned',
      spec: `docs/${capabilityIndex}.md`,
      owners: Array.from(
        { length: 1024 },
        (_, ownerIndex) => `packages/${capabilityIndex}/${ownerIndex}`,
      ),
      implementationAnchors: [],
      testEvidence: [],
      publicDocs: [],
    })),
  };
  assert.throws(
    () => parseArchitectureRegistry(aggregateRegistry),
    new RegExp(`${MAX_ARCHITECTURE_REFERENCE_ITEMS} aggregate reference item limit`),
  );

  const aggregatePolicy = {
    schemaVersion: 1,
    packageBoundaries: Array.from({ length: 5 }, (_, ruleIndex) => ({
      id: `AGGREGATE-${ruleIndex}`,
      from: 'packages/core',
      disallow: Array.from(
        { length: MAX_ARCHITECTURE_COLLECTION_ITEMS },
        (_, dependencyIndex) => `dependency-${ruleIndex}-${dependencyIndex}`,
      ),
    })),
  };
  assert.throws(
    () => parseArchitecturePolicySet(aggregatePolicy),
    new RegExp(`${MAX_ARCHITECTURE_REFERENCE_ITEMS} aggregate reference item limit`),
  );
});

test('architecture schemas and runtime bound authored text', async () => {
  const schema = await schemas();
  assert.equal(
    schema.registry.$defs.nonEmptyString.maxLength,
    MAX_ARCHITECTURE_TEXT_CHARS,
  );
  assert.equal(
    schema.registry.$defs.project.properties.id.maxLength,
    MAX_ARCHITECTURE_TEXT_CHARS,
  );
  assert.equal(
    schema.registry.$defs.capability.properties.id.maxLength,
    MAX_ARCHITECTURE_TEXT_CHARS,
  );
  assert.equal(
    schema.policy.$defs.nonEmptyString.maxLength,
    MAX_ARCHITECTURE_TEXT_CHARS,
  );

  const oversizedId = `CA-${'A'.repeat(MAX_ARCHITECTURE_TEXT_CHARS)}`;
  const oversizedRegistry = {
    schemaVersion: 1,
    capabilities: [{
      id: oversizedId,
      status: 'planned',
      spec: 'docs/spec.md',
      owners: [],
      implementationAnchors: [],
      testEvidence: [],
      publicDocs: [],
    }],
  };
  const oversizedPolicy = {
    schemaVersion: 1,
    packageBoundaries: [{
      id: 'R'.repeat(MAX_ARCHITECTURE_TEXT_CHARS + 1),
      from: 'packages/core',
      disallow: ['react'],
    }],
  };
  const validateRegistry = validator().compile(schema.registry);
  const validatePolicy = validator().compile(schema.policy);
  assert.equal(validateRegistry(oversizedRegistry), false);
  assert.ok(validateRegistry.errors?.some((error) => error.keyword === 'maxLength'));
  assert.equal(validatePolicy(oversizedPolicy), false);
  assert.ok(validatePolicy.errors?.some((error) => error.keyword === 'maxLength'));
  assert.throws(
    () => parseArchitectureRegistry(oversizedRegistry),
    new RegExp(`${MAX_ARCHITECTURE_TEXT_CHARS} character limit`),
  );
  assert.throws(
    () => parseArchitecturePolicySet(oversizedPolicy),
    new RegExp(`${MAX_ARCHITECTURE_TEXT_CHARS} character limit`),
  );

  const aggregateEntries = Array.from({ length: 2050 }, (_, index) => {
    const prefix = `docs/${index}/`;
    return `${prefix}${'x'.repeat(2048 - prefix.length)}`;
  });
  assert.ok(
    aggregateEntries.reduce((total, entry) => total + entry.length, 0)
      > MAX_ARCHITECTURE_TEXT_CHARS_TOTAL,
  );
  assert.throws(
    () => parseArchitectureRegistry({
      schemaVersion: 1,
      capabilities: [{
        id: 'CA-TEXT-BUDGET',
        status: 'planned',
        spec: 'docs/spec.md',
        owners: [],
        implementationAnchors: [],
        testEvidence: [],
        publicDocs: aggregateEntries,
      }],
    }),
    new RegExp(`${MAX_ARCHITECTURE_TEXT_CHARS_TOTAL} aggregate text character limit`),
  );
});

test('report schema and runtime bound external collection cardinality', async () => {
  const schema = await schemas();
  assert.equal(
    schema.report.properties.capabilities.maxItems,
    MAX_VERIFICATION_REPORT_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.report.properties.findings.maxItems,
    MAX_VERIFICATION_REPORT_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.report.properties.semAnalyses.maxItems,
    MAX_VERIFICATION_REPORT_PROJECT_ITEMS,
  );
  assert.equal(
    schema.report.$defs.repositoryPathSet.maxItems,
    MAX_VERIFICATION_REPORT_COLLECTION_ITEMS,
  );
  assert.equal(
    schema.report.$defs.semFailure.properties.args.maxItems,
    MAX_VERIFICATION_REPORT_PROJECT_ITEMS,
  );
  assert.equal(
    schema.report.$defs.nonEmptyString.maxLength,
    MAX_VERIFICATION_REPORT_TEXT_CHARS,
  );

  const oversizedFindings = new Array(
    MAX_VERIFICATION_REPORT_COLLECTION_ITEMS + 1,
  ).fill({ code: 'EXTERNAL', severity: 'error', message: 'external finding' });
  const report = {
    contractId: 'context-action/architecture-verification-report',
    contractVersion: '2.4',
    generatedAt: '2026-07-15T00:00:00.000Z',
    repositoryRoot: '/fixture',
    registryPath: 'architecture/registry.json',
    failOn: 'error',
    passed: false,
    summary: {
      capabilities: 0,
      errors: oversizedFindings.length,
      warnings: 0,
      info: 0,
    },
    capabilities: [],
    findings: oversizedFindings,
    semAnalyses: [],
  };
  const validate = validator().compile(schema.report);
  assert.equal(validate(report), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'maxItems'));
  assert.throws(
    () => assertVerificationReport(report),
    new RegExp(
      `${MAX_VERIFICATION_REPORT_COLLECTION_ITEMS} item report limit`,
    ),
  );

  const oversizedTextReport = {
    ...report,
    summary: { ...report.summary, errors: 1 },
    findings: [{
      code: 'OVERSIZED_TEXT',
      severity: 'error',
      message: 'x'.repeat(MAX_VERIFICATION_REPORT_TEXT_CHARS + 1),
    }],
  };
  assert.equal(validate(oversizedTextReport), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'maxLength'));
});

test('verified impact policies fail closed when SEM evidence is missing', async () => {
  const registry = await loadArchitectureRegistry(registryPath);
  const impactPolicies = await loadArchitecturePolicySet(impactPolicyPath);
  const impactsById = new Map(
    (impactPolicies.impactBoundaries ?? []).map((rule) => [rule.id, rule]),
  );
  const verifiedImpactRuleIds = registry.capabilities
    .filter((capability) => capability.status === 'verified')
    .flatMap((capability) => capability.rules ?? [])
    .filter((ruleId) => impactsById.has(ruleId));
  assert.ok(verifiedImpactRuleIds.length > 0);
  for (const ruleId of verifiedImpactRuleIds) {
    assert.equal(impactsById.get(ruleId)?.missingEvidenceSeverity, 'error');
  }
});

test('generated reports conform to the versioned report schema', async () => {
  const schema = await schemas();
  const registry = await loadArchitectureRegistry(registryPath);
  const policies = await Promise.all([
    loadArchitecturePolicySet(packagePolicyPath),
    loadArchitecturePolicySet(impactPolicyPath),
  ]);
  const report = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: 'architecture/registry.json',
    registry,
    policies,
    semVersion: 'sem 0.21.0',
    semChanges: {
      source: { mode: 'range', from: 'base', to: 'head' },
      changes: [],
      untrackedFiles: [],
    },
  });
  const validate = validator().compile(schema.report);
  assert.equal(validate(report), true, JSON.stringify(validate.errors));
  const oldContractReport = { ...report, contractVersion: '2.2' };
  assert.equal(validate(oldContractReport), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'const'));
  const { binaryFiles: _binaryFiles, ...changeWithoutBinaryProvenance } = report.semChanges;
  assert.equal(validate({
    ...report,
    semChanges: changeWithoutBinaryProvenance,
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'required'));
  assert.equal(validate({
    ...report,
    semChanges: {
      ...report.semChanges,
      files: ['/absolute.ts'],
      semanticFiles: ['/absolute.ts'],
    },
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'pattern'));
  for (const nonCanonicalPath of [
    'packages//core.ts',
    'packages/core.ts/',
    '../outside.ts',
  ]) {
    assert.equal(validate({
      ...report,
      semChanges: {
        ...report.semChanges,
        files: [nonCanonicalPath],
        semanticFiles: [nonCanonicalPath],
      },
    }), false);
    assert.ok(validate.errors?.some((error) => error.keyword === 'pattern'));
  }
  assert.equal(validate({
    ...report,
    summary: {
      ...report.summary,
      capabilities: Number.MAX_SAFE_INTEGER + 1,
    },
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'maximum'));
  const invalidTimestampReport = { ...report, generatedAt: '2026-07-15' };
  assert.equal(validate(invalidTimestampReport), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'pattern'));
  const incompatibleVersionReport = { ...report, semVersion: 'sem 999.0.0' };
  assert.equal(validate(incompatibleVersionReport), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'const'));
  assert.equal(validate({
    ...report,
    passed: false,
    summary: { ...report.summary, errors: 1 },
    findings: [{ code: 'INVISIBLE', severity: 'error', message: ' \u202e\t' }],
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'pattern'));
  assert.equal(validate({
    ...report,
    passed: false,
    summary: { ...report.summary, errors: 1 },
    findings: [{
      code: 'MALFORMED_UNICODE',
      severity: 'error',
      message: 'broken \ud800 provenance',
    }],
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'pattern'));
  assert.equal(validate({
    ...report,
    capabilities: [report.capabilities[0], report.capabilities[0]],
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'uniqueItems'));
  const repeatedAnalysis = {
    projectId: 'core',
    root: repositoryRoot,
    entities: 0,
    impacts: 0,
  };
  assert.equal(validate({
    ...report,
    semAnalyses: [repeatedAnalysis, repeatedAnalysis],
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'uniqueItems'));

  const rootProvenanceReport = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: repositoryRoot,
    registry: { schemaVersion: 1, capabilities: [] },
  });
  assert.equal(rootProvenanceReport.registryPath, '.');
  assert.equal(
    validate(rootProvenanceReport),
    true,
    JSON.stringify(validate.errors),
  );

  const invalidDiscriminatorReport = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: 'architecture/registry.json',
    failOn: 'fatal',
    registry: { schemaVersion: 2, capabilities: [] },
    policies: [{ schemaVersion: 2 }],
  });
  assert.equal(invalidDiscriminatorReport.failOn, 'error');
  assert.equal(invalidDiscriminatorReport.passed, false);
  assert.equal(
    validate(invalidDiscriminatorReport),
    true,
    JSON.stringify(validate.errors),
  );

  const invalidEnumReport = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: 'architecture/registry.json',
    registry: {
      schemaVersion: 1,
      capabilities: [{
        id: 'CA-INVALID-ENUM',
        status: 'done',
        spec: 'architecture/README.md',
        owners: ['architecture'],
        implementationAnchors: [],
        testEvidence: [],
        publicDocs: [],
      }],
    },
    policies: [{
      schemaVersion: 1,
      packageBoundaries: [{
        id: 'INVALID-SEVERITY',
        from: 'packages/core',
        disallow: [],
        severity: 'critical',
      }],
    }],
  });
  assert.equal(invalidEnumReport.passed, false);
  assert.equal(invalidEnumReport.capabilities[0].status, 'planned');
  assert.equal(
    validate(invalidEnumReport),
    true,
    JSON.stringify(validate.errors),
  );

  const malformedDirectInputReport = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: null },
    policies: [null],
    semAnalyses: {},
    evaluateImpactPolicies: 'no',
  });
  assert.equal(malformedDirectInputReport.passed, false);
  assert.equal(malformedDirectInputReport.summary.capabilities, 0);
  assert.equal(
    validate(malformedDirectInputReport),
    true,
    JSON.stringify(validate.errors),
  );

  const invalidAnalysisReport = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: 'architecture/registry.json',
    registry,
    policies,
    semAnalyses: [{
      projectId: 'core',
      root: path.join(repositoryRoot, 'packages/core'),
      entities: [],
      impacts: [],
      durationMs: -1,
    }],
  });
  assert.equal(invalidAnalysisReport.semAnalyses.length, 0);
  assert.ok(invalidAnalysisReport.findings.some((entry) =>
    entry.code === 'SEM_ANALYSIS_EVIDENCE_INVALID'));
  assert.equal(
    validate(invalidAnalysisReport),
    true,
    JSON.stringify(validate.errors),
  );

  const invalidChangeReport = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: 'architecture/registry.json',
    registry,
    semChanges: {
      source: { mode: 'working', from: 'unexpected' },
      changes: [],
    },
  });
  assert.equal(invalidChangeReport.semChanges, undefined);
  assert.ok(invalidChangeReport.findings.some((entry) =>
    entry.code === 'SEM_CHANGE_EVIDENCE_INVALID'));
  assert.equal(
    validate(invalidChangeReport),
    true,
    JSON.stringify(validate.errors),
  );

  const failureReport = appendSemExecutionFailure(report, {
    operation: 'impact',
    reason: 'timeout',
    command: '/fixture/sem',
    args: ['impact', '--entity-id', 'fixture::function::run', '--json'],
    cwd: repositoryRoot,
    durationMs: 25,
    timeoutMs: 25,
    maxOutputBytes: 1024,
    projectId: 'example',
    requestedProjects: ['core', 'react', 'example'],
    completedProjects: [],
    skippedProjects: ['core', 'react'],
    signal: 'SIGKILL',
  });
  assert.equal(validate(failureReport), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...failureReport, passed: true }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'const'));
  const {
    completedProjects: _completedProjects,
    ...partialProgressFailure
  } = failureReport.semFailure;
  assert.equal(validate({
    ...failureReport,
    semFailure: partialProgressFailure,
  }), false);
  assert.ok(validate.errors?.some((error) => error.keyword === 'dependentRequired'));
  assert.match(renderMarkdownReport(failureReport), /## SEM Execution Failure/);
  assert.match(renderMarkdownReport(failureReport), /Reason: `timeout`/);
  assert.match(renderMarkdownReport(failureReport), /Completed projects: none/);
  assert.match(renderMarkdownReport(failureReport), /Skipped projects: `core`, `react`/);

  const queryLimitReport = appendSemExecutionFailure(report, {
    operation: 'impact',
    reason: 'query-limit',
    command: '/fixture/sem',
    args: ['impact', '--entity-id', 'fixture::function::run', '--json'],
    cwd: repositoryRoot,
    durationMs: 12,
    timeoutMs: 25,
    maxOutputBytes: 1024,
    impactTargets: 257,
    maxImpactQueries: 256,
  });
  assert.equal(validate(queryLimitReport), true, JSON.stringify(validate.errors));
  assert.match(renderConsoleReport(queryLimitReport), /257 targets \| maximum 256/);
  assert.match(renderMarkdownReport(queryLimitReport), /Impact targets: 257/);
  assert.match(renderMarkdownReport(queryLimitReport), /Impact query limit: 256/);
  assert.equal(validate({
    ...queryLimitReport,
    semFailure: {
      ...queryLimitReport.semFailure,
      maxImpactQueries: undefined,
    },
  }), false);

  const versionFailureReport = appendSemExecutionFailure(report, {
    operation: 'version',
    reason: 'invalid-output',
    command: '/fixture/sem',
    args: ['--version'],
    cwd: repositoryRoot,
    durationMs: 4,
    timeoutMs: 25,
    maxOutputBytes: 1024,
    expectedVersion: '0.21.0',
    observedVersion: '0.22.0',
    detail: 'Unsupported sem version',
  });
  assert.equal(validate(versionFailureReport), true, JSON.stringify(validate.errors));
  assert.match(renderMarkdownReport(versionFailureReport), /Observed version: `0.22.0`/);
  assert.match(renderMarkdownReport(versionFailureReport), /Expected version: `0.21.0`/);

  const boundedFailureReport = appendSemExecutionFailure(report, {
    operation: 'version',
    reason: 'invalid-output',
    command: `/fixture/${'s'.repeat(5000)}`,
    args: ['--version', 'a'.repeat(5000)],
    cwd: `/fixture/${'c'.repeat(5000)}`,
    durationMs: 4,
    timeoutMs: 25,
    maxOutputBytes: 8192,
    observedVersion: 'v'.repeat(5000),
    detail: 'd'.repeat(5000),
  });
  assert.equal(validate(boundedFailureReport), true, JSON.stringify(validate.errors));
  assert.equal(boundedFailureReport.semFailure?.detail?.length, 4097);
  assert.equal(boundedFailureReport.semFailure?.args[1]?.length, 4097);
});

test('sem failure helpers reject report-schema-invalid provenance', async () => {
  const report = await verifyArchitecture({
    root: repositoryRoot,
    registryPath: 'architecture/registry.json',
    registry: { schemaVersion: 1, capabilities: [] },
  });
  const validFailure = {
    operation: 'version',
    reason: 'spawn',
    command: '/fixture/sem',
    args: ['--version'],
    cwd: repositoryRoot,
    durationMs: 0,
    timeoutMs: 1,
    maxOutputBytes: 1,
  };
  const invalidCases = [
    [{ args: [] }, /sem failure args must contain at least 1 value/],
    [{ command: '' }, /sem failure command must be a non-empty string/],
    [{ durationMs: -1 }, /sem failure durationMs must be a safe integer/],
    [{ durationMs: 0.5 }, /sem failure durationMs must be a safe integer/],
    [{ timeoutMs: 0 }, /sem failure timeoutMs must be a safe integer/],
    [{ maxOutputBytes: 0 }, /sem failure maxOutputBytes must be a safe integer/],
    [{ exitCode: 0.5 }, /sem failure exitCode must be a safe integer/],
    [{ operation: 'unknown' }, /sem failure operation is unsupported/],
    [{ reason: 'unknown' }, /sem failure reason is unsupported/],
    [
      {
        reason: 'query-limit',
        operation: 'entities',
        impactTargets: 2,
        maxImpactQueries: 1,
      },
      /query-limit failure operation must be impact/,
    ],
    [
      { reason: 'query-limit', operation: 'impact' },
      /sem failure impactTargets must be a safe integer/,
    ],
    [
      {
        reason: 'query-limit',
        operation: 'impact',
        impactTargets: 1,
        maxImpactQueries: 1,
      },
      /impactTargets must exceed maxImpactQueries/,
    ],
    [
      { impactTargets: 2, maxImpactQueries: 1 },
      /require reason query-limit/,
    ],
    [{ requestedProjects: [''] }, /sem failure requestedProjects\[0\] must be a non-empty string/],
    [
      { requestedProjects: ['core'] },
      /sem failure project progress fields must be provided together/,
    ],
    [
      {
        requestedProjects: ['core'],
        completedProjects: ['react'],
        skippedProjects: [],
      },
      /completedProjects must be a subset of requestedProjects: react/,
    ],
    [
      {
        requestedProjects: ['core'],
        completedProjects: ['core'],
        skippedProjects: ['core'],
      },
      /project cannot be both completed and skipped: core/,
    ],
    [
      {
        requestedProjects: ['core'],
        completedProjects: [],
        skippedProjects: [],
      },
      /project progress is incomplete: core/,
    ],
  ];
  for (const [overrides, expected] of invalidCases) {
    assert.throws(
      () => appendSemExecutionFailure(report, { ...validFailure, ...overrides }),
      expected,
    );
  }

  const sharedPrefix = 'p'.repeat(MAX_SEM_FAILURE_TEXT_CHARS);
  assert.throws(
    () => appendSemExecutionFailure(report, {
      ...validFailure,
      requestedProjects: [`${sharedPrefix}a`, `${sharedPrefix}b`],
      completedProjects: [`${sharedPrefix}a`],
      skippedProjects: [`${sharedPrefix}b`],
    }),
    /project cannot be both completed and skipped/,
  );

  assert.throws(
    () => appendSemExecutionFailure(report, {
      ...validFailure,
      args: new Array(MAX_SEM_FAILURE_COLLECTION_ITEMS + 1),
    }),
    new RegExp(
      `sem failure args exceeds ${MAX_SEM_FAILURE_COLLECTION_ITEMS} item limit`,
    ),
  );

  assert.throws(
    () => appendSemExecutionFailure(report, {
      ...validFailure,
      detail: `${'x'.repeat(MAX_SEM_FAILURE_INPUT_TEXT_CHARS)}\ud800`,
    }),
    new RegExp(
      `sem failure detail exceeds ${MAX_SEM_FAILURE_INPUT_TEXT_CHARS} input character limit`,
    ),
  );

  const maximumInputItem = 'x'.repeat(MAX_SEM_FAILURE_INPUT_TEXT_CHARS);
  const aggregateInputArgs = new Array(
    Math.floor(
      MAX_SEM_FAILURE_INPUT_TEXT_CHARS_TOTAL
        / MAX_SEM_FAILURE_INPUT_TEXT_CHARS,
    ) + 1,
  ).fill(maximumInputItem);
  assert.throws(
    () => appendSemExecutionFailure(report, {
      ...validFailure,
      args: aggregateInputArgs,
    }),
    new RegExp(
      `sem failure input exceeds ${MAX_SEM_FAILURE_INPUT_TEXT_CHARS_TOTAL} aggregate text character limit`,
    ),
  );

  const aggregateArgs = Array.from(
    {
      length: Math.floor(
        MAX_SEM_FAILURE_TEXT_CHARS_TOTAL / (MAX_SEM_FAILURE_TEXT_CHARS + 1),
      ) + 1,
    },
    () => 'x'.repeat(MAX_SEM_FAILURE_TEXT_CHARS + 1),
  );
  assert.throws(
    () => appendSemExecutionFailure(report, {
      ...validFailure,
      args: aggregateArgs,
    }),
    new RegExp(
      `${MAX_SEM_FAILURE_TEXT_CHARS_TOTAL} aggregate text character limit`,
    ),
  );

  const incompleteProjects = Array.from(
    { length: MAX_DIAGNOSTIC_LIST_ITEMS + 2 },
    (_, index) => `project-${index}`,
  );
  assert.throws(
    () => appendSemExecutionFailure(report, {
      ...validFailure,
      requestedProjects: incompleteProjects,
      completedProjects: [],
      skippedProjects: [],
    }),
    (error) => {
      assert.match(error.message, /project progress is incomplete/);
      assert.match(error.message, /additional values omitted/);
      assert.doesNotMatch(error.message, /project-8(?:\D|$)/);
      assert.ok(error.message.length < 512, error.message);
      return true;
    },
  );

  let extensionReads = 0;
  const extendedFailure = { ...validFailure };
  Object.defineProperty(extendedFailure, 'providerContent', {
    enumerable: true,
    get() {
      extensionReads += 1;
      return 'untrusted';
    },
  });
  assert.throws(
    () => appendSemExecutionFailure(report, extendedFailure),
    /sem failure contains unknown field: providerContent/,
  );
  assert.equal(extensionReads, 0);
});

test('loaders reject unknown fields and empty boundary definitions', async () => {
  const registry = await json(registryPath);
  registry.capabilities[0].publicDoc = registry.capabilities[0].publicDocs;
  const schema = await schemas();
  const validateRegistry = validator().compile(schema.registry);
  assert.equal(validateRegistry(registry), false);

  const invalidPolicy = {
    schemaVersion: 1,
    packageBoundaries: [{ id: 'EMPTY', from: 'packages/core' }],
  };
  const duplicateRegistry = await json(registryPath);
  duplicateRegistry.capabilities[0].owners.push(
    duplicateRegistry.capabilities[0].owners[0],
  );
  const emptyFieldsPolicy = {
    schemaVersion: 1,
    packageBoundaries: [{
      id: 'EMPTY-FIELDS',
      from: 'packages/core',
      disallow: ['react'],
      dependencyFields: [],
    }],
  };
  const emptyProjectsRegistry = await json(registryPath);
  emptyProjectsRegistry.analysisProjects = [];
  const emptyPolicy = { schemaVersion: 1 };
  const emptyPackageRulesPolicy = {
    schemaVersion: 1,
    packageBoundaries: [],
  };
  const validatePolicy = validator().compile(schema.policy);
  assert.equal(validatePolicy(invalidPolicy), false);
  assert.equal(validateRegistry(emptyProjectsRegistry), false);
  assert.equal(validatePolicy(emptyPolicy), false);
  assert.equal(validatePolicy(emptyPackageRulesPolicy), false);

  const directory = await mkdtemp(path.join(tmpdir(), 'architecture-contracts-'));
  const invalidRegistryPath = path.join(directory, 'registry.json');
  const duplicateRegistryPath = path.join(directory, 'duplicate-registry.json');
  const invalidPolicyPath = path.join(directory, 'policy.json');
  const emptyFieldsPolicyPath = path.join(directory, 'empty-fields-policy.json');
  const emptyProjectsRegistryPath = path.join(directory, 'empty-projects-registry.json');
  const emptyPolicyPath = path.join(directory, 'empty-policy.json');
  const emptyPackageRulesPolicyPath = path.join(directory, 'empty-package-rules-policy.json');
  await writeFile(invalidRegistryPath, JSON.stringify(registry));
  await writeFile(duplicateRegistryPath, JSON.stringify(duplicateRegistry));
  await writeFile(invalidPolicyPath, JSON.stringify(invalidPolicy));
  await writeFile(emptyFieldsPolicyPath, JSON.stringify(emptyFieldsPolicy));
  await writeFile(emptyProjectsRegistryPath, JSON.stringify(emptyProjectsRegistry));
  await writeFile(emptyPolicyPath, JSON.stringify(emptyPolicy));
  await writeFile(emptyPackageRulesPolicyPath, JSON.stringify(emptyPackageRulesPolicy));
  await assert.rejects(
    loadArchitectureRegistry(invalidRegistryPath),
    /unknown field: publicDoc/,
  );
  await assert.rejects(
    loadArchitecturePolicySet(invalidPolicyPath),
    /requires disallow or require/,
  );
  await assert.rejects(
    loadArchitectureRegistry(duplicateRegistryPath),
    /must not contain duplicate values/,
  );
  await assert.rejects(
    loadArchitecturePolicySet(emptyFieldsPolicyPath),
    /must contain at least one value/,
  );
  await assert.rejects(
    loadArchitectureRegistry(emptyProjectsRegistryPath),
    /analysisProjects must contain at least one project/,
  );
  await assert.rejects(
    loadArchitecturePolicySet(emptyPolicyPath),
    /must declare packageBoundaries or impactBoundaries/,
  );
  await assert.rejects(
    loadArchitecturePolicySet(emptyPackageRulesPolicyPath),
    /packageBoundaries must contain at least one rule/,
  );
});

test('public parsers normalize hostile object access without coercion', () => {
  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      throw new Error('hostile coercion');
    },
  };
  const registry = {};
  Object.defineProperty(registry, 'schemaVersion', {
    enumerable: true,
    get() {
      throw hostile;
    },
  });
  assert.throws(
    () => parseArchitectureRegistry(registry),
    (error) => {
      assert.ok(error instanceof InputContractError);
      assert.equal(
        error.message,
        'Registry validation failed: Non-Error value thrown',
      );
      return true;
    },
  );

  const policy = {};
  Object.defineProperty(policy, 'schemaVersion', {
    enumerable: true,
    get() {
      throw hostile;
    },
  });
  assert.throws(
    () => parseArchitecturePolicySet(policy),
    (error) => {
      assert.ok(error instanceof InputContractError);
      assert.equal(
        error.message,
        'Policy validation failed: Non-Error value thrown',
      );
      return true;
    },
  );
  assert.equal(coercions, 0);
});

test('architecture loaders bound file size and require valid UTF-8', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'architecture-input-limits-'));
  const oversizedPath = path.join(directory, 'oversized-registry.json');
  const invalidJsonPath = path.join(directory, 'invalid-registry.json');
  const invalidUtf8Path = path.join(directory, 'invalid-utf8-policy.json');
  await writeFile(
    oversizedPath,
    JSON.stringify({ padding: 'x'.repeat(MAX_ARCHITECTURE_JSON_BYTES) }),
  );
  await writeFile(
    invalidJsonPath,
    '{"schemaVersion":1,',
  );
  await writeFile(
    invalidUtf8Path,
    Buffer.concat([
      Buffer.from('{"schemaVersion":1,"impactBoundaries":[],"$schema":"'),
      Buffer.from([0xff]),
      Buffer.from('"}'),
    ]),
  );

  await assert.rejects(
    loadArchitectureRegistry(oversizedPath),
    new RegExp(`exceeds ${MAX_ARCHITECTURE_JSON_BYTES} byte limit`),
  );
  await assert.rejects(
    loadArchitectureRegistry(invalidJsonPath),
    /Invalid JSON in architecture registry/,
  );
  await assert.rejects(
    loadArchitecturePolicySet(invalidUtf8Path),
    /Invalid UTF-8 in architecture policy set/,
  );
});

test('bounded JSON reader rejects FIFOs without blocking', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Windows does not provide POSIX FIFOs');
    return;
  }
  const directory = await mkdtemp(path.join(tmpdir(), 'architecture-input-fifo-'));
  const fifoPath = path.join(directory, 'registry.fifo');
  const created = spawnSync('mkfifo', [fifoPath], { encoding: 'utf8' });
  if (created.status !== 0) {
    t.skip(`mkfifo is unavailable: ${created.stderr}`);
    return;
  }
  const moduleUrl = pathToFileURL(path.resolve('dist/index.js')).href;
  const script = `
import { readBoundedJsonFile } from ${JSON.stringify(moduleUrl)};
try {
  await readBoundedJsonFile(${JSON.stringify(fifoPath)}, {
    label: 'architecture registry FIFO',
    maxBytes: 1024,
  });
  process.exitCode = 3;
} catch (error) {
  process.stderr.write(String(error?.message ?? error));
}
`;
  const result = spawnSync(process.execPath, [
    '--input-type=module',
    '--eval',
    script,
  ], {
    encoding: 'utf8',
    timeout: 2000,
  });

  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /architecture registry FIFO must be a file/);
});

test('architecture text contracts reject escaped lone surrogates and null bytes', async () => {
  const schema = await schemas();
  const validateRegistry = validator().compile(schema.registry);
  const validatePolicy = validator().compile(schema.policy);
  const malformedRegistry = await json(registryPath);
  malformedRegistry.capabilities[0].publicDocs = [
    `docs/${String.fromCharCode(0xd800)}.md`,
  ];
  const malformedPolicy = await json(impactPolicyPath);
  malformedPolicy.impactBoundaries[0].from = ['packages/core/\0**'];

  assert.equal(validateRegistry(malformedRegistry), false);
  assert.equal(validatePolicy(malformedPolicy), false);
  assert.throws(
    () => parseArchitectureRegistry(malformedRegistry),
    /must contain well-formed Unicode/,
  );
  assert.throws(
    () => parseArchitecturePolicySet(malformedPolicy),
    /must not contain null bytes/,
  );

  const directory = await mkdtemp(path.join(tmpdir(), 'architecture-text-contracts-'));
  const registryFile = path.join(directory, 'escaped-surrogate-registry.json');
  const policyFile = path.join(directory, 'escaped-null-policy.json');
  await writeFile(registryFile, JSON.stringify(malformedRegistry));
  await writeFile(policyFile, JSON.stringify(malformedPolicy));
  await assert.rejects(
    loadArchitectureRegistry(registryFile),
    /must contain well-formed Unicode/,
  );
  await assert.rejects(
    loadArchitecturePolicySet(policyFile),
    /must not contain null bytes/,
  );

  const validAstralPolicy = await json(impactPolicyPath);
  validAstralPolicy.impactBoundaries[0].from = ['packages/😀/**'];
  assert.equal(validatePolicy(validAstralPolicy), true, JSON.stringify(validatePolicy.errors));
  assert.doesNotThrow(() => parseArchitecturePolicySet(validAstralPolicy));
});
