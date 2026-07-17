import path from 'node:path';
import type { VerificationReport } from './contracts.js';
import {
  assertKnownFields,
  boundedDiagnosticList,
  toInputContractError,
} from './diagnostics.js';
import { InputContractError } from './errors.js';
import {
  MAX_SEM_FAILURE_COLLECTION_ITEMS,
  MAX_SEM_FAILURE_TEXT_CHARS,
  SUPPORTED_SEM_VERSION,
} from './sem.js';
import { hasVisibleText, isWellFormedText } from './text.js';

const severities = new Set(['error', 'warning', 'info']);
const capabilityStatuses = new Set([
  'planned',
  'implemented',
  'verified',
  'deprecated',
]);
const semOperations = new Set(['version', 'entities', 'impact', 'diff']);
const semFailureReasons = new Set([
  'spawn',
  'timeout',
  'output-limit',
  'query-limit',
  'exit',
  'invalid-json',
  'invalid-output',
]);
const canonicalTimestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const MAX_VERIFICATION_REPORT_COLLECTION_ITEMS = 65_536;
export const MAX_VERIFICATION_REPORT_PROJECT_ITEMS = MAX_SEM_FAILURE_COLLECTION_ITEMS;
export const MAX_VERIFICATION_REPORT_TEXT_CHARS = 16_384;
export const MAX_VERIFICATION_REPORT_TEXT_CHARS_TOTAL = 8 * 1024 * 1024;
export const MAX_VERIFICATION_REPORT_RENDER_BYTES = 64 * 1024 * 1024;

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function knownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
  label: string,
): void {
  assertKnownFields(value, allowed, label);
}

function assertNoJsonSerializationHook(value: object): void {
  let current: object | null = value;
  let depth = 0;
  while (current !== null) {
    if (depth >= 32) {
      throw new InputContractError(
        'report container prototype chain exceeds 32 levels',
      );
    }
    let descriptor: PropertyDescriptor | undefined;
    let prototype: object | null;
    try {
      descriptor = Object.getOwnPropertyDescriptor(current, 'toJSON');
      prototype = Object.getPrototypeOf(current) as object | null;
    } catch {
      throw new InputContractError(
        'report serialization metadata must be inspectable',
      );
    }
    if (descriptor !== undefined) {
      throw new InputContractError(
        'report must not define toJSON serialization hooks',
      );
    }
    current = prototype;
    depth += 1;
  }
}

function nonEmptyString(value: unknown, label: string): string {
  if (typeof value === 'string' && !isWellFormedText(value)) {
    throw new InputContractError(`${label} must contain well-formed Unicode`);
  }
  if (
    typeof value !== 'string'
    || value.length === 0
    || !hasVisibleText(value)
  ) {
    throw new InputContractError(
      `${label} must be a non-empty string containing visible text`,
    );
  }
  if (value.length > MAX_VERIFICATION_REPORT_TEXT_CHARS) {
    throw new InputContractError(
      `${label} exceeds ${MAX_VERIFICATION_REPORT_TEXT_CHARS} character report limit`,
    );
  }
  return value;
}

function assertReportTextBudget(value: Record<string, unknown>): void {
  const active = new WeakSet<object>();
  const stack: Array<{ value: unknown; exit: boolean }> = [
    { value, exit: false },
  ];
  let textCharacters = 0;
  while (stack.length > 0) {
    const frame = stack.pop()!;
    if (typeof frame.value === 'string') {
      if (frame.value.length > MAX_VERIFICATION_REPORT_TEXT_CHARS) {
        throw new InputContractError(
          `report string exceeds ${MAX_VERIFICATION_REPORT_TEXT_CHARS} character report limit`,
        );
      }
      if (
        frame.value.length
        > MAX_VERIFICATION_REPORT_TEXT_CHARS_TOTAL - textCharacters
      ) {
        throw new InputContractError(
          `report exceeds ${MAX_VERIFICATION_REPORT_TEXT_CHARS_TOTAL} aggregate text character limit`,
        );
      }
      textCharacters += frame.value.length;
      continue;
    }
    if (frame.value === null || typeof frame.value !== 'object') continue;
    const objectValue = frame.value as object;
    if (frame.exit) {
      active.delete(objectValue);
      continue;
    }
    assertNoJsonSerializationHook(objectValue);
    if (active.has(objectValue)) {
      throw new InputContractError('report must not contain cyclic object references');
    }
    active.add(objectValue);
    stack.push({ value: frame.value, exit: true });
    const entries = Array.isArray(frame.value)
      ? frame.value
      : Object.values(frame.value as Record<string, unknown>);
    for (let index = entries.length - 1; index >= 0; index -= 1) {
      stack.push({ value: entries[index], exit: false });
    }
  }
}

function boundedFailureString(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (result.length > MAX_SEM_FAILURE_TEXT_CHARS + 1) {
    throw new InputContractError(
      `${label} exceeds ${MAX_SEM_FAILURE_TEXT_CHARS + 1} character report limit`,
    );
  }
  return result;
}

function canonicalTimestamp(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  if (!canonicalTimestampPattern.test(result)) {
    throw new InputContractError(
      `${label} must be a canonical UTC ISO timestamp`,
    );
  }
  const timestamp = Date.parse(result);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString() !== result) {
    throw new InputContractError(
      `${label} must be a valid canonical UTC ISO timestamp`,
    );
  }
  return result;
}

function integer(value: unknown, label: string, minimum = 0): number {
  if (!Number.isSafeInteger(value) || (value as number) < minimum) {
    throw new InputContractError(`${label} must be a safe integer greater than or equal to ${minimum}`);
  }
  return value as number;
}

function enumeration(value: unknown, allowed: Set<string>, label: string): string {
  if (typeof value !== 'string' || !allowed.has(value)) {
    throw new InputContractError(`${label} is unsupported`);
  }
  return value;
}

function stringArray(
  value: unknown,
  label: string,
  item: (entry: unknown, itemLabel: string) => string = nonEmptyString,
  minItems = 0,
  maxItems = MAX_VERIFICATION_REPORT_COLLECTION_ITEMS,
): string[] {
  if (!Array.isArray(value) || value.length < minItems) {
    throw new InputContractError(`${label} must be an array with at least ${minItems} item${minItems === 1 ? '' : 's'}`);
  }
  if (value.length > maxItems) {
    throw new InputContractError(`${label} exceeds ${maxItems} item report limit`);
  }
  return value.map((entry, index) => item(entry, `${label}[${index}]`));
}

function stringSet(
  value: unknown,
  label: string,
  item: (entry: unknown, itemLabel: string) => string = nonEmptyString,
  minItems = 0,
  maxItems = MAX_VERIFICATION_REPORT_COLLECTION_ITEMS,
): string[] {
  const result = stringArray(value, label, item, minItems, maxItems);
  if (new Set(result).size !== result.length) {
    throw new InputContractError(`${label} must not contain duplicate values`);
  }
  return result;
}

function optionalNonEmptyString(value: unknown, label: string): void {
  if (value !== undefined) nonEmptyString(value, label);
}

function repositoryPath(value: unknown, label: string): string {
  const result = nonEmptyString(value, label);
  const segments = result.split('/');
  if (
    result.includes('\0')
    || result.includes('\\')
    || path.posix.isAbsolute(result)
    || path.win32.isAbsolute(result)
    || result === '.'
    || segments.some((segment) => segment === '.' || segment === '..')
    || path.posix.normalize(result) !== result
  ) {
    throw new InputContractError(`${label} must be a normalized repository-relative file path`);
  }
  return result;
}

function validateSummary(value: unknown): void {
  const summary = record(value, 'report.summary');
  knownKeys(summary, ['capabilities', 'errors', 'warnings', 'info'], 'report.summary');
  integer(summary.capabilities, 'report.summary.capabilities');
  integer(summary.errors, 'report.summary.errors');
  integer(summary.warnings, 'report.summary.warnings');
  integer(summary.info, 'report.summary.info');
}

function validateCapabilities(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new InputContractError('report.capabilities must be an array');
  }
  if (value.length > MAX_VERIFICATION_REPORT_COLLECTION_ITEMS) {
    throw new InputContractError(
      `report.capabilities exceeds ${MAX_VERIFICATION_REPORT_COLLECTION_ITEMS} item report limit`,
    );
  }
  for (const [index, entry] of value.entries()) {
    const capability = record(entry, `report.capabilities[${index}]`);
    knownKeys(capability, [
      'id',
      'status',
      'findings',
      'implementationAnchors',
      'testEvidence',
      'publicDocs',
    ], `report.capabilities[${index}]`);
    nonEmptyString(capability.id, `report.capabilities[${index}].id`);
    enumeration(
      capability.status,
      capabilityStatuses,
      `report.capabilities[${index}].status`,
    );
    integer(capability.findings, `report.capabilities[${index}].findings`);
    integer(
      capability.implementationAnchors,
      `report.capabilities[${index}].implementationAnchors`,
    );
    integer(capability.testEvidence, `report.capabilities[${index}].testEvidence`);
    integer(capability.publicDocs, `report.capabilities[${index}].publicDocs`);
  }
}

function validateFindings(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new InputContractError('report.findings must be an array');
  }
  if (value.length > MAX_VERIFICATION_REPORT_COLLECTION_ITEMS) {
    throw new InputContractError(
      `report.findings exceeds ${MAX_VERIFICATION_REPORT_COLLECTION_ITEMS} item report limit`,
    );
  }
  for (const [index, entry] of value.entries()) {
    const finding = record(entry, `report.findings[${index}]`);
    knownKeys(finding, [
      'code',
      'severity',
      'message',
      'capabilityId',
      'ruleId',
      'path',
    ], `report.findings[${index}]`);
    nonEmptyString(finding.code, `report.findings[${index}].code`);
    enumeration(finding.severity, severities, `report.findings[${index}].severity`);
    nonEmptyString(finding.message, `report.findings[${index}].message`);
    optionalNonEmptyString(finding.capabilityId, `report.findings[${index}].capabilityId`);
    optionalNonEmptyString(finding.ruleId, `report.findings[${index}].ruleId`);
    optionalNonEmptyString(finding.path, `report.findings[${index}].path`);
  }
}

function validateSemAnalyses(value: unknown): void {
  if (!Array.isArray(value)) {
    throw new InputContractError('report.semAnalyses must be an array');
  }
  if (value.length > MAX_VERIFICATION_REPORT_PROJECT_ITEMS) {
    throw new InputContractError(
      `report.semAnalyses exceeds ${MAX_VERIFICATION_REPORT_PROJECT_ITEMS} item report limit`,
    );
  }
  for (const [index, entry] of value.entries()) {
    const analysis = record(entry, `report.semAnalyses[${index}]`);
    knownKeys(
      analysis,
      ['projectId', 'root', 'entities', 'impacts', 'durationMs'],
      `report.semAnalyses[${index}]`,
    );
    nonEmptyString(analysis.projectId, `report.semAnalyses[${index}].projectId`);
    nonEmptyString(analysis.root, `report.semAnalyses[${index}].root`);
    integer(analysis.entities, `report.semAnalyses[${index}].entities`);
    integer(analysis.impacts, `report.semAnalyses[${index}].impacts`);
    if (analysis.durationMs !== undefined) {
      integer(analysis.durationMs, `report.semAnalyses[${index}].durationMs`);
    }
  }
}

function validateSymbolUsages(value: unknown): void {
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    throw new InputContractError('report.symbolUsages must be an array');
  }
  if (value.length > MAX_VERIFICATION_REPORT_COLLECTION_ITEMS) {
    throw new InputContractError(
      `report.symbolUsages exceeds ${MAX_VERIFICATION_REPORT_COLLECTION_ITEMS} item report limit`,
    );
  }
  for (const [index, entry] of value.entries()) {
    const usage = record(entry, `report.symbolUsages[${index}]`);
    knownKeys(
      usage,
      ['capabilityId', 'anchor', 'projectId', 'definition', 'usageFiles'],
      `report.symbolUsages[${index}]`,
    );
    nonEmptyString(usage.capabilityId, `report.symbolUsages[${index}].capabilityId`);
    nonEmptyString(usage.anchor, `report.symbolUsages[${index}].anchor`);
    nonEmptyString(usage.projectId, `report.symbolUsages[${index}].projectId`);
    const definition = record(
      usage.definition,
      `report.symbolUsages[${index}].definition`,
    );
    knownKeys(
      definition,
      ['file', 'startLine', 'endLine'],
      `report.symbolUsages[${index}].definition`,
    );
    repositoryPath(
      definition.file,
      `report.symbolUsages[${index}].definition.file`,
    );
    integer(
      definition.startLine,
      `report.symbolUsages[${index}].definition.startLine`,
      1,
    );
    integer(
      definition.endLine,
      `report.symbolUsages[${index}].definition.endLine`,
      1,
    );
    if ((definition.endLine as number) < (definition.startLine as number)) {
      throw new InputContractError(
        `report.symbolUsages[${index}].definition.endLine must be greater than or equal to startLine`,
      );
    }
    stringSet(
      usage.usageFiles,
      `report.symbolUsages[${index}].usageFiles`,
      repositoryPath,
    );
  }
}

function validateSemFailure(value: unknown): void {
  if (value === undefined) return;
  const failure = record(value, 'report.semFailure');
  knownKeys(failure, [
    'operation',
    'reason',
    'command',
    'args',
    'cwd',
    'durationMs',
    'timeoutMs',
    'maxOutputBytes',
    'impactTargets',
    'maxImpactQueries',
    'projectId',
    'requestedProjects',
    'completedProjects',
    'skippedProjects',
    'expectedVersion',
    'observedVersion',
    'exitCode',
    'signal',
    'stderr',
    'detail',
  ], 'report.semFailure');
  enumeration(failure.operation, semOperations, 'report.semFailure.operation');
  enumeration(failure.reason, semFailureReasons, 'report.semFailure.reason');
  boundedFailureString(failure.command, 'report.semFailure.command');
  stringArray(
    failure.args,
    'report.semFailure.args',
    boundedFailureString,
    1,
    MAX_VERIFICATION_REPORT_PROJECT_ITEMS,
  );
  boundedFailureString(failure.cwd, 'report.semFailure.cwd');
  integer(failure.durationMs, 'report.semFailure.durationMs');
  integer(failure.timeoutMs, 'report.semFailure.timeoutMs', 1);
  integer(failure.maxOutputBytes, 'report.semFailure.maxOutputBytes', 1);
  const hasQueryLimitFields = failure.impactTargets !== undefined
    || failure.maxImpactQueries !== undefined;
  if (failure.reason === 'query-limit') {
    if (failure.operation !== 'impact') {
      throw new InputContractError(
        'report.semFailure query-limit operation must be impact',
      );
    }
    integer(failure.impactTargets, 'report.semFailure.impactTargets', 1);
    integer(failure.maxImpactQueries, 'report.semFailure.maxImpactQueries', 1);
    if ((failure.impactTargets as number) <= (failure.maxImpactQueries as number)) {
      throw new InputContractError(
        'report.semFailure impactTargets must exceed maxImpactQueries',
      );
    }
  } else if (hasQueryLimitFields) {
    throw new InputContractError(
      'report.semFailure impactTargets and maxImpactQueries require reason query-limit',
    );
  }
  for (const field of [
    'projectId',
    'expectedVersion',
    'observedVersion',
    'signal',
    'stderr',
    'detail',
  ] as const) {
    if (failure[field] !== undefined) {
      boundedFailureString(failure[field], `report.semFailure.${field}`);
    }
  }
  for (const field of [
    'requestedProjects',
    'completedProjects',
    'skippedProjects',
  ] as const) {
    if (failure[field] !== undefined) {
      stringSet(
        failure[field],
        `report.semFailure.${field}`,
        boundedFailureString,
        0,
        MAX_VERIFICATION_REPORT_PROJECT_ITEMS,
      );
    }
  }
  if (failure.exitCode !== undefined) {
    if (!Number.isSafeInteger(failure.exitCode)) {
      throw new InputContractError('report.semFailure.exitCode must be a safe integer');
    }
  }
}

function validateChangeSource(value: unknown): void {
  const source = record(value, 'report.semChanges.source');
  if (source.mode === 'working' || source.mode === 'staged') {
    knownKeys(source, ['mode'], 'report.semChanges.source');
    return;
  }
  if (source.mode === 'range') {
    knownKeys(source, ['mode', 'from', 'to'], 'report.semChanges.source');
    nonEmptyString(source.from, 'report.semChanges.source.from');
    nonEmptyString(source.to, 'report.semChanges.source.to');
    return;
  }
  throw new InputContractError('report.semChanges.source.mode is unsupported');
}

function validateSemChanges(value: unknown): void {
  if (value === undefined) return;
  const changes = record(value, 'report.semChanges');
  knownKeys(changes, [
    'source',
    'entities',
    'files',
    'semanticFiles',
    'binaryFiles',
    'untrackedFiles',
    'affectedCapabilities',
    'affectedDocuments',
    'affectedTests',
  ], 'report.semChanges');
  validateChangeSource(changes.source);
  integer(changes.entities, 'report.semChanges.entities');
  for (const field of [
    'files',
    'semanticFiles',
    'binaryFiles',
    'untrackedFiles',
    'affectedDocuments',
    'affectedTests',
  ] as const) {
    stringSet(changes[field], `report.semChanges.${field}`, repositoryPath);
  }
  stringSet(
    changes.affectedCapabilities,
    'report.semChanges.affectedCapabilities',
  );
}

function validateReportInvariants(report: VerificationReport): void {
  const expectedSummary = {
    capabilities: report.capabilities.length,
    errors: report.findings.filter((entry) => entry.severity === 'error').length,
    warnings: report.findings.filter((entry) => entry.severity === 'warning').length,
    info: report.findings.filter((entry) => entry.severity === 'info').length,
  };
  for (const field of [
    'capabilities',
    'errors',
    'warnings',
    'info',
  ] as const) {
    if (report.summary[field] !== expectedSummary[field]) {
      throw new InputContractError(
        `report.summary.${field} must equal ${expectedSummary[field]} derived from report content`,
      );
    }
  }

  const severityRank: Record<VerificationReport['failOn'], number> = {
    info: 0,
    warning: 1,
    error: 2,
  };
  const expectedPassed = !report.findings.some((entry) =>
    severityRank[entry.severity] >= severityRank[report.failOn]);
  if (report.passed !== expectedPassed) {
    throw new InputContractError(
      `report.passed must be ${expectedPassed} for failOn ${report.failOn}`,
    );
  }

  if (report.semChanges) {
    const changedFiles = new Set(report.semChanges.files);
    const categorizedFiles = new Set([
      ...report.semChanges.semanticFiles,
      ...report.semChanges.binaryFiles,
      ...report.semChanges.untrackedFiles,
    ]);
    const uncategorizedFile = report.semChanges.files.find((file) =>
      !categorizedFiles.has(file));
    if (uncategorizedFile !== undefined) {
      throw new InputContractError(
        `report.semChanges.files contains uncategorized path: ${uncategorizedFile}`,
      );
    }
    const missingFile = [...categorizedFiles].find((file) => !changedFiles.has(file));
    if (missingFile !== undefined) {
      throw new InputContractError(
        `report.semChanges categorized files must be a subset of files: ${missingFile}`,
      );
    }
    const categorizedByFile = new Map<string, string>();
    for (const [category, files] of [
      ['semanticFiles', report.semChanges.semanticFiles],
      ['binaryFiles', report.semChanges.binaryFiles],
      ['untrackedFiles', report.semChanges.untrackedFiles],
    ] as const) {
      for (const file of files) {
        const previousCategory = categorizedByFile.get(file);
        if (previousCategory !== undefined) {
          throw new InputContractError(
            `report.semChanges file cannot be both ${previousCategory} and ${category}: ${file}`,
          );
        }
        categorizedByFile.set(file, category);
      }
    }
    if (
      (report.semChanges.entities === 0) !== (report.semChanges.semanticFiles.length === 0)
    ) {
      throw new InputContractError(
        'report.semChanges.entities and semanticFiles must both be empty or both be non-empty',
      );
    }
    const capabilityIds = new Set(report.capabilities.map((entry) => entry.id));
    const unknownAffectedCapability = report.semChanges.affectedCapabilities.find((id) =>
      !capabilityIds.has(id));
    if (unknownAffectedCapability !== undefined) {
      throw new InputContractError(
        `report.semChanges.affectedCapabilities references unknown capability: ${unknownAffectedCapability}`,
      );
    }
    if (
      report.semChanges.affectedCapabilities.length === 0
      && (
        report.semChanges.affectedDocuments.length > 0
        || report.semChanges.affectedTests.length > 0
      )
    ) {
      throw new InputContractError(
        'report.semChanges affected documents or tests require an affected capability',
      );
    }
  }

  const capabilityIds = new Set(report.capabilities.map((entry) => entry.id));
  if (capabilityIds.size !== report.capabilities.length) {
    throw new InputContractError(
      'report.capabilities must not contain duplicate id values',
    );
  }
  const unknownFindingCapability = report.findings.find((entry) =>
    entry.capabilityId !== undefined && !capabilityIds.has(entry.capabilityId));
  if (unknownFindingCapability?.capabilityId !== undefined) {
    throw new InputContractError(
      `report.findings capabilityId references unknown capability: ${unknownFindingCapability.capabilityId}`,
    );
  }
  if (report.symbolUsages !== undefined) {
    const usageKeys = new Set<string>();
    for (const usage of report.symbolUsages) {
      if (!capabilityIds.has(usage.capabilityId)) {
        throw new InputContractError(
          `report.symbolUsages references unknown capability: ${usage.capabilityId}`,
        );
      }
      const key = `${usage.capabilityId}\0${usage.projectId}\0${usage.anchor}`;
      if (usageKeys.has(key)) {
        throw new InputContractError(
          `report.symbolUsages must not contain duplicate symbol records: ${usage.anchor}`,
        );
      }
      usageKeys.add(key);
    }
  }

  const analysisProjectIds = report.semAnalyses.map((analysis) => analysis.projectId);
  if (new Set(analysisProjectIds).size !== analysisProjectIds.length) {
    throw new InputContractError('report.semAnalyses must not contain duplicate projectId values');
  }

  if (!report.semFailure) return;
  if (!report.findings.some((entry) =>
    entry.code === 'SEM_EXECUTION_FAILED' && entry.severity === 'error')) {
    throw new InputContractError(
      'report.semFailure requires an error SEM_EXECUTION_FAILED finding',
    );
  }

  const progress = [
    report.semFailure.requestedProjects,
    report.semFailure.completedProjects,
    report.semFailure.skippedProjects,
  ];
  const progressFields = progress.filter((value) => value !== undefined).length;
  if (progressFields !== 0 && progressFields !== progress.length) {
    throw new InputContractError(
      'report.semFailure project progress fields must be provided together',
    );
  }
  if (progressFields === 0) return;

  const requested = new Set(report.semFailure.requestedProjects ?? []);
  const completed = new Set(report.semFailure.completedProjects ?? []);
  const skipped = new Set(report.semFailure.skippedProjects ?? []);
  for (const projectId of completed) {
    if (!requested.has(projectId)) {
      throw new InputContractError(
        `report.semFailure.completedProjects must be a subset of requestedProjects: ${projectId}`,
      );
    }
    if (skipped.has(projectId)) {
      throw new InputContractError(
        `report.semFailure project cannot be both completed and skipped: ${projectId}`,
      );
    }
  }
  for (const projectId of skipped) {
    if (!requested.has(projectId)) {
      throw new InputContractError(
        `report.semFailure.skippedProjects must be a subset of requestedProjects: ${projectId}`,
      );
    }
  }
  const unresolved = [...requested].filter((projectId) =>
    !completed.has(projectId) && !skipped.has(projectId));
  if (report.semFailure.projectId) {
    if (
      unresolved.length !== 1
      || unresolved[0] !== report.semFailure.projectId
    ) {
      throw new InputContractError(
        'report.semFailure unresolved project must equal projectId',
      );
    }
  } else if (unresolved.length > 0) {
    throw new InputContractError(
      `report.semFailure project progress is incomplete: ${boundedDiagnosticList(unresolved)}`,
    );
  }
  const missingCompletedAnalysis = report.semAnalyses.find((analysis) =>
    !completed.has(analysis.projectId));
  const missingAnalysis = [...completed].find((projectId) =>
    !analysisProjectIds.includes(projectId));
  if (missingCompletedAnalysis !== undefined || missingAnalysis !== undefined) {
    throw new InputContractError(
      'report.semFailure.completedProjects must equal report.semAnalyses projectId values',
    );
  }
}

function validateVerificationReport(
  value: unknown,
): asserts value is VerificationReport {
  const report = record(value, 'report');
  knownKeys(report, [
    'contractId',
    'contractVersion',
    'generatedAt',
    'repositoryRoot',
    'registryPath',
    'failOn',
    'passed',
    'summary',
    'capabilities',
    'findings',
    'symbolUsages',
    'semVersion',
    'semFailure',
    'semAnalyses',
    'semChanges',
  ], 'report');
  if (report.contractId !== 'context-action/architecture-verification-report') {
    throw new InputContractError('report.contractId is unsupported');
  }
  if (report.contractVersion !== '2.4') {
    throw new InputContractError('report.contractVersion is unsupported');
  }
  canonicalTimestamp(report.generatedAt, 'report.generatedAt');
  nonEmptyString(report.repositoryRoot, 'report.repositoryRoot');
  nonEmptyString(report.registryPath, 'report.registryPath');
  enumeration(report.failOn, severities, 'report.failOn');
  if (typeof report.passed !== 'boolean') {
    throw new InputContractError('report.passed must be boolean');
  }
  validateSummary(report.summary);
  validateCapabilities(report.capabilities);
  validateFindings(report.findings);
  validateSymbolUsages(report.symbolUsages);
  if (
    report.semVersion !== undefined
    && report.semVersion !== `sem ${SUPPORTED_SEM_VERSION}`
  ) {
    throw new InputContractError('report.semVersion is unsupported');
  }
  validateSemFailure(report.semFailure);
  validateSemAnalyses(report.semAnalyses);
  validateSemChanges(report.semChanges);
  validateReportInvariants(report as unknown as VerificationReport);
  assertReportTextBudget(report);
}

export function assertVerificationReport(
  value: unknown,
): asserts value is VerificationReport {
  try {
    validateVerificationReport(value);
  } catch (error) {
    throw toInputContractError(error, 'Report validation failed');
  }
}
