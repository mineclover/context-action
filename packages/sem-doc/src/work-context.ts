import { existsSync, realpathSync } from 'node:fs';
import * as path from 'node:path';

import { createSemAdvisoryEnvelope } from './advisory';
import {
  isDefaultIgnoredCollectionPath,
  isNodeModulesPath,
  MAX_NODE_MODULES_HOPS,
} from './collection-policy';
import type { SemAdvisoryEnvelope, SemAdvisoryRequest } from './contracts';
import {
  type DocumentEntityLookup,
  type DocumentIndex,
  type DocumentLookup,
  indexDocuments,
} from './documents';
import {
  createExecutionProvenance,
  type ExecutionProvenance,
} from './execution-provenance';
import {
  createRepositoryRevisionReader,
  type RepositoryRevision,
  type RepositoryRevisionReaderLike,
  RepositoryStateError,
  sameRepositoryRevision,
} from './revision';
import {
  createSemExecutionBudget,
  MAX_SEM_CLIENT_BUFFER_BYTES,
  MAX_SEM_CLIENT_TIMEOUT_MS,
  SemClient,
  type SemExecutionBudget,
} from './sem-client';
import {
  parseSemContext,
  parseSemImpact,
  type SemContextResult,
  type SemEntity,
  type SemImpactResult,
} from './sem-json';

export const WORK_CONTEXT_SCHEMA = 'sem-doc-work-context.v5' as const;

export const DEFAULT_WORK_CONTEXT_TIMEOUT_MS = 120_000;
export const DEFAULT_WORK_CONTEXT_MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

export interface WorkContextRequest {
  readonly repositoryRoot: string;
  readonly entity: string;
  readonly file?: string;
  readonly docsRoot?: string;
  readonly budget?: number;
  readonly depth?: number;
  readonly noCache?: boolean;
  readonly engineVersion?: string;
  readonly timeoutMs?: number;
  readonly maxOutputBytes?: number;
  /** Stable logical owner recorded in execution provenance. */
  readonly executionOwnerId?: string;
  /** Opt in to SEM's broad include mode and retain only the direct node_modules surface. */
  readonly includeNodeModulesSurface?: boolean;
  /** Optional aggregate budget supplied by a history/composite caller. */
  readonly executionBudget?: SemExecutionBudget;
}

export interface WorkContextDocuments {
  readonly root: string;
  readonly files: number;
  readonly target: DocumentEntityLookup;
  readonly missingReferences: number;
}

export type WorkContextDepth = 1 | 2;

export type WorkContextSymbolRole = 'target' | 'dependency' | 'dependent' | 'test' | 'transitive';

export interface WorkContextSymbol {
  readonly entity: SemEntity;
  readonly hop: 0 | WorkContextDepth;
  readonly roles: readonly WorkContextSymbolRole[];
}

export interface WorkContextSymbolInventory {
  readonly maxHops: WorkContextDepth;
  readonly complete: true;
  readonly entries: readonly WorkContextSymbol[];
}

/** Derives a smaller hop view without issuing another sem query. */
export function selectWorkContextHops(
  inventory: WorkContextSymbolInventory,
  maxHops: WorkContextDepth
): WorkContextSymbolInventory {
  if (maxHops > inventory.maxHops) {
    throw new WorkContextInputError(
      `cannot derive ${maxHops}-hop view from ${inventory.maxHops}-hop inventory`
    );
  }
  return {
    maxHops,
    complete: true,
    entries: inventory.entries.filter(({ hop }) => hop <= maxHops),
  };
}

export interface WorkContextAffectedTests {
  readonly complete: true;
  readonly entries: readonly SemEntity[];
}

/** Execution provenance for the aggregate SEM calls behind a work-context. */
export type WorkContextExecution = ExecutionProvenance;

export interface SemDocWorkContext {
  readonly schemaVersion: typeof WORK_CONTEXT_SCHEMA;
  readonly source: 'sem-doc';
  readonly repositoryRoot: string;
  readonly revision: RepositoryRevision;
  readonly engine: {
    readonly name: 'sem';
    readonly version: string;
  };
  readonly target: {
    readonly query: string;
    readonly file?: string;
    readonly entity: SemImpactResult['entity'];
  };
  readonly sem: {
    readonly impact: SemAdvisoryEnvelope<SemImpactResult>;
    readonly context: SemAdvisoryEnvelope<SemContextResult>;
  };
  readonly execution: WorkContextExecution;
  readonly symbols: WorkContextSymbolInventory;
  readonly affectedTests: WorkContextAffectedTests;
  readonly usageFiles: readonly string[];
  readonly documents: WorkContextDocuments;
}

export interface WorkContextServiceOptions {
  readonly client?: SemClient;
  readonly revisionReader?: RepositoryRevisionReaderLike;
}

export class WorkContextInputError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'WorkContextInputError';
  }
}

/** Composes sem impact/context with TSDoc document definitions and backlinks. */
export class WorkContextService {
  private readonly client: SemClient;
  private readonly revisionReader: RepositoryRevisionReaderLike;

  public constructor(options: WorkContextServiceOptions = {}) {
    this.client = options.client ?? new SemClient();
    this.revisionReader = options.revisionReader ?? createRepositoryRevisionReader();
  }

  public analyze(request: WorkContextRequest): SemDocWorkContext {
    const startedAt = Date.now();
    const entity = nonEmpty(request.entity, 'entity');
    validateNonNegativeInteger(request.budget, 'budget');
    validatePositiveInteger(request.timeoutMs, 'timeoutMs', MAX_SEM_CLIENT_TIMEOUT_MS);
    validatePositiveInteger(
      request.maxOutputBytes,
      'maxOutputBytes',
      MAX_SEM_CLIENT_BUFFER_BYTES,
    );
    validateOptionalBoolean(request.includeNodeModulesSurface, 'includeNodeModulesSurface');
    const depth = workContextDepth(request.depth);
    const revision = this.revisionReader.read(path.resolve(request.repositoryRoot));
    const repositoryRoot = revision.repositoryRoot;
    const file =
      request.file === undefined
        ? undefined
        : repositoryRelativePath(repositoryRoot, request.file, 'file');
    const docsRoot = repositoryPath(repositoryRoot, request.docsRoot ?? 'managed', 'docs-root');
    if (request.executionBudget !== undefined && (request.timeoutMs !== undefined || request.maxOutputBytes !== undefined)) {
      throw new WorkContextInputError('executionBudget cannot be combined with timeoutMs or maxOutputBytes');
    }
    const budget = request.executionBudget ?? createSemExecutionBudget({
        timeoutMs: request.timeoutMs ?? DEFAULT_WORK_CONTEXT_TIMEOUT_MS,
        maxOutputBytes: request.maxOutputBytes ?? DEFAULT_WORK_CONTEXT_MAX_OUTPUT_BYTES,
      });
    const engineVersion = (
      request.engineVersion ?? this.client.version({ cwd: repositoryRoot, budget })
    ).trim();
    if (engineVersion.length === 0 || engineVersion === 'unknown') {
      throw new WorkContextInputError('sem version is required for provenance');
    }
    const normalizedRequest: WorkContextRequest = {
      ...request,
      repositoryRoot,
      entity,
      ...(file === undefined ? {} : { file }),
      docsRoot,
      depth,
    };
    const impactArgs = buildImpactArgs(normalizedRequest);
    const contextArgs = buildContextArgs(normalizedRequest);
    const impact = filterImpactDependencyBoundary(parseSemImpact(
      this.client.runJson('impact', impactArgs, { cwd: repositoryRoot, budget })
    ));
    if (impact.testsTruncated) {
      throw new WorkContextInputError(
        'sem impact truncated the test entity list; complete affected-test evidence is required'
      );
    }
    const context = filterContextDependencyBoundary(parseSemContext(
      this.client.runJson('context', contextArgs, { cwd: repositoryRoot, budget })
    ));
    validateReportedEntity(impact.entity, repositoryRoot, file);
    const symbols = buildSymbolInventory(impact, depth);
    const documentIndex = indexDocuments(docsRoot);
    const target = documentIndex.lookupEntity(impact.entity);
    const after = this.revisionReader.read(repositoryRoot);
    if (!sameRepositoryRevision(revision, after)) {
      throw new RepositoryStateError(
        `Repository changed while sem analysis was running: ${revision.workingTreeDigest} -> ${after.workingTreeDigest}`
      );
    }
    return {
      schemaVersion: WORK_CONTEXT_SCHEMA,
      source: 'sem-doc',
      repositoryRoot,
      revision,
      engine: { name: 'sem', version: engineVersion },
      target: {
        query: entity,
        ...(file === undefined ? {} : { file }),
        entity: impact.entity,
      },
      sem: {
        impact: createSemAdvisoryEnvelope(
          advisoryRequest('impact', impactArgs, repositoryRoot, revision, engineVersion),
          impact
        ),
        context: createSemAdvisoryEnvelope(
          advisoryRequest('context', contextArgs, repositoryRoot, revision, engineVersion),
          context
        ),
      },
      execution: {
        ...createExecutionProvenance({
          phase: 'work-context',
          ownerId: request.executionOwnerId ?? 'sem-doc',
          state: 'completed',
          timeoutMs: budget.timeoutMs,
          maxOutputBytes: budget.maxOutputBytes,
          usedOutputBytes: budget.usedOutputBytes,
          elapsedMs: Math.max(0, Date.now() - startedAt),
        }),
      },
      symbols,
      affectedTests: buildAffectedTests(
        impact.tests.filter((entity) => !isNodeModulesPath(entity.file)),
      ),
      usageFiles: uniqueFiles(impact.dependents.map((entity) => entity.file)),
      documents: {
        root: docsRoot,
        files: documentIndex.files,
        target,
        missingReferences: documentIndex.missingReferences.length,
      },
    };
  }
}

export function renderWorkContextText(report: SemDocWorkContext): string {
  const impact = report.sem.impact.payload;
  const context = report.sem.context.payload;
  const lines = [
    `Work Context: ${impact.entity.name}`,
    `Entity: ${impact.entity.type} ${impact.entity.name} (${impact.entity.file})`,
    `Revision: ${report.revision.gitHead} / ${report.revision.workingTreeDigest.slice(0, 12)}`,
    '',
    'Impact',
    `  Dependencies: ${impact.dependencies.length}`,
    `  Dependents: ${impact.dependents.length}`,
    `  Affected tests: ${impact.tests.length}`,
    `  Transitive impact: ${impact.impact.total}`,
    '',
    `Symbols (${report.symbols.entries.length}, complete through ${report.symbols.maxHops} hop${report.symbols.maxHops === 1 ? '' : 's'})`,
    ...report.symbols.entries.map(
      ({ entity, hop, roles }) =>
        `  [${hop}] ${entity.type} ${entity.name} (${entity.file}) — ${roles.join(', ')}`
    ),
    '',
    `Affected Tests (${report.affectedTests.entries.length}, complete; hop only when listed above)`,
    ...report.affectedTests.entries.map(
      (entity) => `  ${entity.type} ${entity.name} (${entity.file})`
    ),
    '',
    `Usage Files (${report.usageFiles.length})`,
    ...report.usageFiles.map((file) => `  ${file}`),
    '',
    'Context Content',
    `  Entries: ${context.entries.length}`,
    `  Tokens: ${context.totalTokens}/${context.budget}`,
    `  Content truncated: ${context.truncated ? 'yes' : 'no'}`,
    '',
    'Documents',
    `  Binding: ${report.documents.target.status}`,
    ...(report.documents.target.symbol === undefined
      ? []
      : [`  Checkpoint: [[${report.documents.target.symbol}]]`]),
    `  Definitions: ${report.documents.target.definitions.length}`,
    `  Backlinks: ${report.documents.target.backlinks.length}`,
    `  Missing references in index: ${report.documents.missingReferences}`,
    `  Same-name binding candidates: ${report.documents.target.candidates.length}`,
  ];
  for (const definition of report.documents.target.definitions) {
    lines.push(`  Definition: ${definition.documentPath}:${definition.line}`);
  }
  for (const backlink of report.documents.target.backlinks) {
    lines.push(`  Backlink: ${backlink}`);
  }
  for (const candidate of report.documents.target.candidates) {
    lines.push(
      `  Same-name candidate: ${candidate.documentPath} -> ${candidate.entity?.id ?? 'unbound'}`
    );
  }
  return `${lines.join('\n')}\n`;
}

function buildImpactArgs(request: WorkContextRequest): readonly string[] {
  return [
    request.entity,
    ...(request.file === undefined ? [] : ['--file', request.file]),
    ...(request.depth === undefined ? [] : ['--depth', String(request.depth)]),
    ...(request.includeNodeModulesSurface === true ? ['--no-default-excludes'] : []),
    ...(request.noCache === true ? ['--no-cache'] : []),
    '--json',
  ];
}

/**
 * Keep a package's directly referenced surface visible while preventing the
 * bounded work-context inventory from descending into package internals.
 * SEM reports transitive entities with an explicit depth; direct dependency
 * and dependent arrays remain available as surface evidence. The total is
 * rewritten to describe the collected projection rather than rows discarded
 * at the package boundary.
 */
function filterImpactDependencyBoundary(impact: SemImpactResult): SemImpactResult {
  const entities = impact.impact.entities.filter((entity) =>
    isAdmittedSourceEntity(entity) &&
    (!isNodeModulesPath(entity.file) || entity.depth <= MAX_NODE_MODULES_HOPS),
  );
  return {
    ...impact,
    dependencies: impact.dependencies.filter(isAdmittedSourceEntity),
    dependents: impact.dependents.filter(isAdmittedSourceEntity),
    tests: impact.tests.filter(isAdmittedSourceEntity),
    impact: {
      ...impact.impact,
      total: entities.length,
      entities,
    },
  };
}

function filterContextDependencyBoundary(context: SemContextResult): SemContextResult {
  const entries = context.entries.filter((entry) =>
    isAdmittedSourceEntity(entry) &&
    (!isNodeModulesPath(entry.file) || isDirectContextRole(entry.role)),
  );
  return {
    ...context,
    totalTokens: entries.reduce((total, entry) => total + entry.tokens, 0),
    entries,
  };
}

function isAdmittedSourceEntity(entity: Pick<SemEntity, 'file'>): boolean {
  return !isDefaultIgnoredCollectionPath(entity.file);
}

function isDirectContextRole(role: string): boolean {
  return role === 'target' || role === 'direct_dependency' || role === 'direct_dependent';
}

function nonEmpty(value: string, name: string): string {
  const normalized = value.trim();
  if (normalized.length === 0) throw new WorkContextInputError(`${name} must not be empty`);
  return normalized;
}

function validateNonNegativeInteger(value: number | undefined, name: string): void {
  if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
    throw new WorkContextInputError(`${name} must be a non-negative integer`);
  }
}

function validatePositiveInteger(value: number | undefined, name: string, maximum: number): void {
  if (
    value !== undefined
    && (!Number.isSafeInteger(value) || value <= 0 || value > maximum)
  ) {
    throw new WorkContextInputError(
      `${name} must be a safe integer between 1 and ${maximum}`,
    );
  }
}

function validateOptionalBoolean(value: boolean | undefined, name: string): void {
  if (value !== undefined && typeof value !== 'boolean') {
    throw new WorkContextInputError(`${name} must be a boolean`);
  }
}

function workContextDepth(value: number | undefined): WorkContextDepth {
  const depth = value ?? 2;
  if (depth !== 1 && depth !== 2) {
    throw new WorkContextInputError('depth must be either 1 or 2');
  }
  return depth;
}

function buildSymbolInventory(
  impact: SemImpactResult,
  maxHops: WorkContextDepth
): WorkContextSymbolInventory {
  const symbols = new Map<
    string,
    { entity: SemEntity; hop: 0 | WorkContextDepth; roles: Set<WorkContextSymbolRole> }
  >();
  const add = (entity: SemEntity, hop: number, role: WorkContextSymbolRole): void => {
    if (hop > maxHops) return;
    const boundedHop = Math.max(0, Math.min(maxHops, hop)) as 0 | WorkContextDepth;
    const key = symbolKey(entity);
    const existing = symbols.get(key);
    if (existing) {
      existing.hop = Math.min(existing.hop, boundedHop) as 0 | WorkContextDepth;
      existing.roles.add(role);
      return;
    }
    symbols.set(key, { entity, hop: boundedHop, roles: new Set([role]) });
  };

  add(impact.entity, 0, 'target');
  for (const entity of impact.dependencies) add(entity, 1, 'dependency');
  for (const entity of impact.dependents) add(entity, 1, 'dependent');
  for (const entity of impact.impact.entities) {
    add(entity, entity.depth, 'transitive');
  }
  const testKeys = new Set(impact.tests.map(symbolKey));
  for (const symbol of symbols.values()) {
    if (testKeys.has(symbolKey(symbol.entity))) symbol.roles.add('test');
  }

  const roleOrder: readonly WorkContextSymbolRole[] = [
    'target',
    'dependency',
    'dependent',
    'test',
    'transitive',
  ];
  const entries = [...symbols.values()]
    .map(({ entity, hop, roles }) => ({
      entity,
      hop,
      roles: roleOrder.filter((role) => roles.has(role)),
    }))
    .sort(
      (left, right) =>
        left.hop - right.hop ||
        roleOrder.indexOf(left.roles[0] ?? 'transitive') -
          roleOrder.indexOf(right.roles[0] ?? 'transitive') ||
        compareText(left.entity.name, right.entity.name) ||
        compareText(left.entity.type, right.entity.type) ||
        compareText(left.entity.file, right.entity.file)
    );
  return { maxHops, complete: true, entries };
}

function buildAffectedTests(tests: readonly SemEntity[]): WorkContextAffectedTests {
  const unique = new Map<string, SemEntity>();
  for (const entity of tests) unique.set(symbolKey(entity), entity);
  const entries = [...unique.values()].sort(
    (left, right) =>
      compareText(left.name, right.name) ||
      compareText(left.type, right.type) ||
      compareText(left.file, right.file)
  );
  return { complete: true, entries };
}

function symbolKey(entity: SemEntity): string {
  return (
    entity.id ??
    [entity.file, entity.type, entity.name, entity.startLine ?? '', entity.endLine ?? ''].join('\0')
  );
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function repositoryPath(root: string, value: string, name: string): string {
  const normalized = nonEmpty(value, name);
  const absolute = path.resolve(root, normalized);
  if (!isWithinRoot(root, absolute)) {
    throw new WorkContextInputError(`${name} must be inside the repository root`);
  }
  return assertRealPathWithin(root, absolute, name);
}

function repositoryRelativePath(root: string, value: string, name: string): string {
  const absolute = repositoryPath(root, value, name);
  const relative = path.relative(root, absolute);
  return relative.split(path.sep).join('/');
}

function assertRealPathWithin(root: string, candidate: string, name: string): string {
  if (!existsSync(candidate)) return candidate;
  let resolved: string;
  let canonicalRoot: string;
  try {
    canonicalRoot = realpathSync(root);
    resolved = realpathSync(candidate);
  } catch (error) {
    throw new WorkContextInputError(
      `${name} cannot be resolved: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  if (!isWithinRoot(canonicalRoot, resolved)) {
    throw new WorkContextInputError(`${name} escapes the repository through a symlink`);
  }
  return resolved;
}

function uniqueFiles(files: readonly string[]): readonly string[] {
  return [...new Set(files.map((file) => file.replaceAll('\\', '/')))].sort();
}

function validateReportedEntity(
  entity: SemImpactResult['entity'],
  root: string,
  requestedFile: string | undefined
): void {
  const reportedFile = repositoryRelativePath(root, entity.file, 'sem entity file');
  if (requestedFile !== undefined && reportedFile !== requestedFile) {
    throw new WorkContextInputError(
      `sem resolved ${entity.name} to ${reportedFile}, outside requested file ${requestedFile}`
    );
  }
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function buildContextArgs(request: WorkContextRequest): readonly string[] {
  return [
    request.entity,
    ...(request.file === undefined ? [] : ['--file', request.file]),
    ...(request.budget === undefined ? [] : ['--budget', String(request.budget)]),
    ...(request.depth === undefined ? [] : ['--hops', String(request.depth)]),
    ...(request.includeNodeModulesSurface === true ? ['--no-default-excludes'] : []),
    ...(request.noCache === true ? ['--no-cache'] : []),
    '--json',
  ];
}

function advisoryRequest(
  command: 'impact' | 'context',
  args: readonly string[],
  repositoryRoot: string,
  revision: RepositoryRevision,
  engineVersion: string
): SemAdvisoryRequest {
  return {
    command,
    args,
    repositoryRoot,
    revision,
    engineVersion,
  };
}

export function lookupDocuments(index: DocumentIndex, symbol: string): DocumentLookup {
  return index.lookup(symbol);
}
