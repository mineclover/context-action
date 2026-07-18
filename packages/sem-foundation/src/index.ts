export const SEM_ADVISORY_SCHEMA = 'sem-advisory.v1' as const;
export const MAX_ANALYSIS_PROJECT_FILE_EXTENSION_CHARS = 64;
/** Maximum number of repository-scoped analysis projects in one contract. */
export const MAX_ANALYSIS_PROJECTS = 4096;
/** Maximum number of explicit source extensions on one analysis project. */
export const MAX_ANALYSIS_PROJECT_FILE_EXTENSIONS = 32;
/** Maximum number of symbols in one complete materialized snapshot. */
export const MAX_SYMBOL_SNAPSHOT_ENTRIES = 65_536;

export type SemFoundationLimitValue = number | 'unbounded';

export interface SemFoundationLimitOptions {
  readonly maxAnalysisProjects?: SemFoundationLimitValue;
  readonly maxAnalysisProjectFileExtensions?: SemFoundationLimitValue;
  readonly maxAnalysisProjectFileExtensionChars?: SemFoundationLimitValue;
  readonly maxSymbolSnapshotEntries?: SemFoundationLimitValue;
}

export interface SemFoundationLimits {
  readonly maxAnalysisProjects: number;
  readonly maxAnalysisProjectFileExtensions: number;
  readonly maxAnalysisProjectFileExtensionChars: number;
  readonly maxSymbolSnapshotEntries: number;
}

export const DEFAULT_SEM_FOUNDATION_LIMITS: SemFoundationLimits = Object.freeze({
  maxAnalysisProjects: MAX_ANALYSIS_PROJECTS,
  maxAnalysisProjectFileExtensions: MAX_ANALYSIS_PROJECT_FILE_EXTENSIONS,
  maxAnalysisProjectFileExtensionChars: MAX_ANALYSIS_PROJECT_FILE_EXTENSION_CHARS,
  maxSymbolSnapshotEntries: MAX_SYMBOL_SNAPSHOT_ENTRIES,
});

/** Resolves caller-provided contract limits without imposing a second hidden ceiling. */
export function resolveSemFoundationLimits(
  options: SemFoundationLimitOptions = {},
): SemFoundationLimits {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('sem foundation limit options must be an object');
  }
  return {
    maxAnalysisProjects: positiveLimit(
      options.maxAnalysisProjects,
      DEFAULT_SEM_FOUNDATION_LIMITS.maxAnalysisProjects,
      'maxAnalysisProjects',
    ),
    maxAnalysisProjectFileExtensions: positiveLimit(
      options.maxAnalysisProjectFileExtensions,
      DEFAULT_SEM_FOUNDATION_LIMITS.maxAnalysisProjectFileExtensions,
      'maxAnalysisProjectFileExtensions',
    ),
    maxAnalysisProjectFileExtensionChars: positiveLimit(
      options.maxAnalysisProjectFileExtensionChars,
      DEFAULT_SEM_FOUNDATION_LIMITS.maxAnalysisProjectFileExtensionChars,
      'maxAnalysisProjectFileExtensionChars',
    ),
    maxSymbolSnapshotEntries: positiveLimit(
      options.maxSymbolSnapshotEntries,
      DEFAULT_SEM_FOUNDATION_LIMITS.maxSymbolSnapshotEntries,
      'maxSymbolSnapshotEntries',
    ),
  };
}

/** Locale-independent ordering for serialized contract data. */
export function compareStableText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export interface SemEntityRecord {
  readonly id?: string;
  readonly parentId?: string;
  readonly name: string;
  readonly type: string;
  readonly file: string;
  readonly startLine?: number;
  readonly endLine?: number;
  readonly depth?: number;
}

export interface NormalizedSemEntity {
  readonly id: string;
  readonly parentId?: string;
  readonly name: string;
  readonly type: string;
  readonly file: string;
  readonly startLine?: number;
  readonly endLine?: number;
  readonly depth?: number;
}

export interface SemRevisionProvenance {
  readonly gitHead?: string;
  readonly commit?: string;
  readonly workingTreeDigest?: string;
}

/** Repository-scoped analysis unit shared by SEM snapshot consumers. */
export interface AnalysisProject {
  readonly id: string;
  /** Repository-relative project root. `.` denotes the repository root. */
  readonly root: string;
  /** Optional source extensions forwarded to SEM; omitted means SEM defaults. */
  readonly fileExtensions?: readonly string[];
}

/** A commit record emitted by a bounded Git history query. */
export interface GitCommitRecord {
  readonly commit: string;
  readonly parent: string;
  readonly subject: string;
}

/** A reproducible view of a repository's current or materialized state. */
export interface RepositoryRevision {
  readonly repositoryRoot: string;
  readonly gitHead: string;
  readonly workingTreeDigest: string;
}

export function normalizeAnalysisProject(
  project: AnalysisProject,
  label = 'analysis project',
  options?: SemFoundationLimitOptions,
): AnalysisProject {
  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    throw new TypeError(`${label} must be an object`);
  }
  const id = nonEmptyText(project.id, `${label}.id`);
  const normalizedRoot = normalizeRepositoryPath(project.root);
  const limits = resolveSemFoundationLimits(options);
  const fileExtensions = project.fileExtensions === undefined
    ? undefined
    : normalizeFileExtensions(project.fileExtensions, `${label}.fileExtensions`, limits);
  return {
    id,
    root: normalizedRoot.length === 0 ? '.' : normalizedRoot,
    ...(fileExtensions === undefined ? {} : { fileExtensions }),
  };
}

export function normalizeAnalysisProjects(
  projects: readonly AnalysisProject[],
  label = 'analysisProjects',
  options?: SemFoundationLimitOptions,
): readonly AnalysisProject[] {
  if (!Array.isArray(projects) || projects.length === 0) {
    throw new TypeError(`${label} must contain at least one project`);
  }
  const limits = resolveSemFoundationLimits(options);
  if (projects.length > limits.maxAnalysisProjects) {
    throw new TypeError(`${label} exceeds ${limits.maxAnalysisProjects} projects`);
  }
  const normalized = projects.map((project, index) =>
    normalizeAnalysisProject(project, `${label}[${index}]`, limits));
  if (new Set(normalized.map((project) => project.id)).size !== normalized.length) {
    throw new TypeError(`${label} must not contain duplicate project IDs`);
  }
  return normalized;
}

export function resolveAnalysisProjects(
  projects?: readonly AnalysisProject[],
  options?: SemFoundationLimitOptions,
): readonly AnalysisProject[] {
  return projects === undefined
    ? [{ id: 'default', root: '.' }]
    : normalizeAnalysisProjects(projects, 'analysisProjects', options);
}

export interface SemAdvisoryEnvelope<TPayload> {
  readonly schemaVersion: typeof SEM_ADVISORY_SCHEMA;
  readonly source: 'sem';
  readonly command: string;
  readonly args: readonly string[];
  readonly repositoryRoot: string;
  readonly revision: SemRevisionProvenance;
  readonly engine: {
    readonly name: 'sem';
    readonly version: string;
  };
  readonly payload: TPayload;
}

export function normalizeRepositoryPath(value: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) {
    throw new TypeError('repository path must be non-empty text without null bytes');
  }
  const normalized = value.replaceAll('\\', '/');
  const segments: string[] = [];
  for (const segment of normalized.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (segments.length === 0) throw new TypeError(`repository path escapes its root: ${value}`);
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

export function canonicalEntityId(entity: SemEntityRecord): string {
  if (typeof entity.id === 'string' && entity.id.length > 0) return entity.id;
  const file = normalizeRepositoryPath(entity.file);
  const parentId = entity.parentId;
  return parentId === undefined
    ? `${file}::${entity.type}::${entity.name}`
    : `${parentId}::${entity.name}`;
}

export function normalizeSemEntity(entity: SemEntityRecord): NormalizedSemEntity {
  const id = canonicalEntityId(entity);
  const file = normalizeRepositoryPath(entity.file);
  const startLine = optionalPositiveInteger(entity.startLine, 'startLine');
  const endLine = optionalPositiveInteger(entity.endLine, 'endLine');
  if (startLine !== undefined && endLine !== undefined && endLine < startLine) {
    throw new TypeError('endLine must not precede startLine');
  }
  return {
    id,
    ...(entity.parentId === undefined ? {} : { parentId: entity.parentId }),
    name: nonEmptyText(entity.name, 'name'),
    type: nonEmptyText(entity.type, 'type'),
    file,
    ...(startLine === undefined ? {} : { startLine }),
    ...(endLine === undefined ? {} : { endLine }),
    ...(entity.depth === undefined ? {} : { depth: nonNegativeInteger(entity.depth, 'depth') }),
  };
}

export function entitySymbol(entityId: string, filePath?: string): string {
  const separator = entityId.indexOf('::');
  if (separator >= 0) return entityId.slice(separator + 2);
  if (filePath !== undefined && entityId.startsWith(`${filePath}::`)) {
    return entityId.slice(filePath.length + 2);
  }
  return entityId;
}

/**
 * Converts a SEM entity into the shared complete-snapshot entry.
 *
 * This is deliberately policy-neutral: consumers still decide whether the
 * resulting entry belongs to a work-context report, an architecture history,
 * or another derived view.
 */
export function createSymbolSnapshotEntry(
  entity: SemEntityRecord,
  projectId: string,
): SymbolSnapshotEntry {
  const normalizedProjectId = nonEmptyText(projectId, 'projectId');
  const normalized = normalizeSemEntity(entity);
  const startLine = normalized.startLine;
  const endLine = normalized.endLine;
  if (startLine === undefined || endLine === undefined) {
    throw new TypeError('SEM entity must include startLine and endLine for a complete snapshot');
  }
  if (endLine < startLine) {
    throw new TypeError('SEM entity endLine must not precede startLine');
  }
  return {
    projectId: normalizedProjectId,
    entityId: normalized.id,
    filePath: normalized.file,
    symbol: entitySymbol(normalized.id, normalized.file),
    kind: normalized.type,
    name: normalized.name,
    startLine,
    endLine,
    ...(normalized.parentId === undefined ? {} : { parentId: normalized.parentId }),
  };
}

/** A stable serialized symbol entry used by context-boundary consumers. */
export interface SymbolSetEntry {
  readonly projectId: string;
  readonly entityId: string;
  readonly filePath: string;
  readonly symbol: string;
  readonly kind: string;
}

/** Canonical identity tuple shared by snapshots and derived context views. */
export interface SymbolRef {
  readonly projectId: string;
  readonly filePath: string;
  readonly entityId: string;
}

/** Stable wire-contract identifier for a complete symbol snapshot. */
export const SYMBOL_SNAPSHOT_CONTRACT_ID = 'context-action/symbol-snapshot' as const;
export const SYMBOL_SNAPSHOT_CONTRACT_VERSION = '1.1' as const;

/** A symbol entry with the source evidence needed to reproduce a snapshot. */
export interface SymbolSnapshotEntry extends SymbolSetEntry {
  readonly name: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly parentId?: string;
}

export interface SymbolSnapshotRevision {
  readonly commit?: string;
  readonly gitHead?: string;
  readonly workingTreeDigest?: string;
}

/** Provenance for each declared analysis project in a snapshot. */
export interface SymbolSnapshotProjectStatus {
  readonly projectId: string;
  readonly root: string;
  readonly status: 'analyzed' | 'skipped';
  readonly reason?: 'missing-at-revision';
}

/** A complete, repository-relative symbol inventory for one revision. */
export interface SymbolSnapshot {
  readonly contractId: typeof SYMBOL_SNAPSHOT_CONTRACT_ID;
  readonly contractVersion: typeof SYMBOL_SNAPSHOT_CONTRACT_VERSION;
  readonly repositoryRoot: string;
  readonly revision: SymbolSnapshotRevision;
  readonly projects: readonly AnalysisProject[];
  readonly projectStatuses: readonly SymbolSnapshotProjectStatus[];
  readonly symbols: readonly SymbolSnapshotEntry[];
}

export interface SymbolContext {
  readonly id: string;
  readonly symbols: readonly SymbolSetEntry[];
}

export interface SymbolContextComparison {
  readonly leftContextId: string;
  readonly rightContextId: string;
  readonly intersection: readonly SymbolSetEntry[];
  readonly onlyLeft: readonly SymbolSetEntry[];
  readonly onlyRight: readonly SymbolSetEntry[];
}

export interface SymbolSnapshotModification {
  readonly before: SymbolSnapshotEntry;
  readonly after: SymbolSnapshotEntry;
}

/** Set diff for two complete snapshots. The first argument is the before state. */
export interface SymbolSnapshotDiff {
  readonly added: readonly SymbolSnapshotEntry[];
  readonly removed: readonly SymbolSnapshotEntry[];
  readonly modified: readonly SymbolSnapshotModification[];
}

/** Returns the repository/project-qualified identity used for set operations. */
export function symbolSetKey(entry: SymbolSetEntry): string {
  return `${entry.projectId}\0${normalizeRepositoryPath(entry.filePath)}\0${entry.entityId}`;
}

/** Returns a JSON-safe deterministic key for a canonical symbol identity tuple. */
export function symbolRefKey(ref: SymbolRef): string {
  return [ref.projectId, normalizeRepositoryPath(ref.filePath), ref.entityId]
    .map((value) => `${value.length}:${value}`)
    .join('|');
}

/** Compares two serialized symbol contexts without interpreting runtime call semantics. */
export function compareSymbolContexts(
  left: SymbolContext,
  right: SymbolContext,
): SymbolContextComparison {
  const leftEntries = normalizeSymbolEntries(left.symbols);
  const rightEntries = normalizeSymbolEntries(right.symbols);
  const leftByKey = new Map(leftEntries.map((entry) => [symbolSetKey(entry), entry]));
  const rightByKey = new Map(rightEntries.map((entry) => [symbolSetKey(entry), entry]));
  const intersection = leftEntries.filter((entry) => rightByKey.has(symbolSetKey(entry)));
  const onlyLeft = leftEntries.filter((entry) => !rightByKey.has(symbolSetKey(entry)));
  const onlyRight = rightEntries.filter((entry) => !leftByKey.has(symbolSetKey(entry)));
  return {
    leftContextId: left.id,
    rightContextId: right.id,
    intersection,
    onlyLeft,
    onlyRight,
  };
}

/** Compares complete symbol inventories by their stable project/file/entity identity. */
export function diffSymbolSnapshots(
  before: SymbolSnapshot,
  after: SymbolSnapshot,
): SymbolSnapshotDiff {
  const beforeEntries = normalizeSymbolSnapshotEntries(before.symbols);
  const afterEntries = normalizeSymbolSnapshotEntries(after.symbols);
  const beforeByKey = new Map(beforeEntries.map((entry) => [symbolSetKey(entry), entry]));
  const afterByKey = new Map(afterEntries.map((entry) => [symbolSetKey(entry), entry]));
  const added = afterEntries.filter((entry) => !beforeByKey.has(symbolSetKey(entry)));
  const removed = beforeEntries.filter((entry) => !afterByKey.has(symbolSetKey(entry)));
  const modified = afterEntries
    .filter((entry) => {
      const previous = beforeByKey.get(symbolSetKey(entry));
      return previous !== undefined && !sameSymbolSnapshotEntry(previous, entry);
    })
    .map((afterEntry) => ({
      before: beforeByKey.get(symbolSetKey(afterEntry))!,
      after: afterEntry,
    }));
  return { added, removed, modified };
}

function normalizeSymbolEntries(entries: readonly SymbolSetEntry[]): SymbolSetEntry[] {
  if (!Array.isArray(entries)) throw new TypeError('symbol context symbols must be an array');
  const unique = new Map<string, SymbolSetEntry>();
  for (const rawEntry of entries) {
    const entry = normalizeSymbolEntry(rawEntry);
    const key = symbolSetKey(entry);
    const previous = unique.get(key);
    if (previous && (
      previous.projectId !== entry.projectId
      || previous.filePath !== entry.filePath
      || previous.entityId !== entry.entityId
      || previous.symbol !== entry.symbol
      || previous.kind !== entry.kind
    )) {
      throw new TypeError(`symbol context contains conflicting entries for ${key}`);
    }
    unique.set(key, entry);
  }
  return [...unique.values()].sort((left, right) =>
    compareStableText(symbolSetKey(left), symbolSetKey(right)));
}

/** Normalizes, deduplicates, and deterministically sorts complete snapshot entries. */
export function normalizeSymbolSnapshotEntries(
  entries: readonly SymbolSnapshotEntry[],
  options?: SemFoundationLimitOptions,
): readonly SymbolSnapshotEntry[] {
  if (!Array.isArray(entries)) throw new TypeError('symbol snapshot symbols must be an array');
  const limits = resolveSemFoundationLimits(options);
  if (entries.length > limits.maxSymbolSnapshotEntries) {
    throw new TypeError(
      `symbol snapshot symbols exceeds ${limits.maxSymbolSnapshotEntries} entries`,
    );
  }
  const unique = new Map<string, SymbolSnapshotEntry>();
  for (const rawEntry of entries) {
    const entry = normalizeSymbolSnapshotEntry(rawEntry);
    const key = symbolSetKey(entry);
    const previous = unique.get(key);
    if (previous && !sameSymbolSnapshotEntry(previous, entry)) {
      throw new TypeError(`symbol snapshot contains conflicting entries for ${key}`);
    }
    unique.set(key, entry);
  }
  return [...unique.values()].sort((left, right) =>
    compareStableText(
      `${symbolSetKey(left)}\0${left.name}\0${left.startLine}`,
      `${symbolSetKey(right)}\0${right.name}\0${right.startLine}`,
    ));
}

/** Creates a validated complete symbol snapshot with deterministic symbol ordering. */
export function createSymbolSnapshot(options: {
  readonly repositoryRoot: string;
  readonly revision: SymbolSnapshotRevision;
  readonly projects: readonly AnalysisProject[];
  readonly projectStatuses?: readonly SymbolSnapshotProjectStatus[];
  readonly symbols: readonly SymbolSnapshotEntry[];
  readonly limits?: SemFoundationLimitOptions;
}): SymbolSnapshot {
  if (!options || typeof options !== 'object' || Array.isArray(options)) {
    throw new TypeError('symbol snapshot options must be an object');
  }
  const limits = resolveSemFoundationLimits(options.limits);
  const repositoryRoot = nonEmptyText(options.repositoryRoot, 'symbol snapshot repositoryRoot');
  const revision = normalizeSymbolSnapshotRevision(options.revision);
  const projects = normalizeAnalysisProjects(options.projects, 'symbol snapshot projects', limits);
  const projectStatuses = normalizeSymbolSnapshotProjectStatuses(
    projects,
    options.projectStatuses,
  );
  const symbols = normalizeSymbolSnapshotEntries(options.symbols, limits);
  return {
    contractId: SYMBOL_SNAPSHOT_CONTRACT_ID,
    contractVersion: SYMBOL_SNAPSHOT_CONTRACT_VERSION,
    repositoryRoot,
    revision,
    projects,
    projectStatuses,
    symbols,
  };
}

/** Parses an untrusted JSON value as a complete symbol snapshot. */
export function parseSymbolSnapshot(
  value: unknown,
  label = 'symbol snapshot',
  options?: SemFoundationLimitOptions,
): SymbolSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  const input = value as Record<string, unknown>;
  if (input.contractId !== SYMBOL_SNAPSHOT_CONTRACT_ID) {
    throw new TypeError(`${label}.contractId must be ${SYMBOL_SNAPSHOT_CONTRACT_ID}`);
  }
  if (input.contractVersion !== SYMBOL_SNAPSHOT_CONTRACT_VERSION) {
    throw new TypeError(`${label}.contractVersion must be ${SYMBOL_SNAPSHOT_CONTRACT_VERSION}`);
  }
  if (!Array.isArray(input.projects)) throw new TypeError(`${label}.projects must be an array`);
  if (!Array.isArray(input.projectStatuses)) {
    throw new TypeError(`${label}.projectStatuses must be an array`);
  }
  if (!Array.isArray(input.symbols)) throw new TypeError(`${label}.symbols must be an array`);
  return createSymbolSnapshot({
    repositoryRoot: nonEmptyText(input.repositoryRoot as string, `${label}.repositoryRoot`),
    revision: input.revision as SymbolSnapshotRevision,
    projects: input.projects as AnalysisProject[],
    projectStatuses: input.projectStatuses as SymbolSnapshotProjectStatus[],
    symbols: input.symbols as SymbolSnapshotEntry[],
    limits: options,
  });
}

function normalizeSymbolSnapshotProjectStatuses(
  projects: readonly AnalysisProject[],
  statuses: readonly SymbolSnapshotProjectStatus[] | undefined,
): readonly SymbolSnapshotProjectStatus[] {
  const expected = new Map(projects.map((project) => [project.id, project]));
  const source = statuses ?? projects.map((project) => ({
    projectId: project.id,
    root: project.root,
    status: 'analyzed' as const,
  }));
  if (!Array.isArray(source)) throw new TypeError('symbol snapshot projectStatuses must be an array');
  const normalized = source.map((raw, index) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new TypeError(`symbol snapshot projectStatuses[${index}] must be an object`);
    }
    const input = raw as Record<string, unknown>;
    const projectId = nonEmptyText(input.projectId as string, `symbol snapshot projectStatuses[${index}].projectId`);
    const project = expected.get(projectId);
    if (!project) throw new TypeError(`symbol snapshot projectStatuses references unknown project: ${projectId}`);
    const root = normalizeRepositoryPath(nonEmptyText(input.root as string, `symbol snapshot projectStatuses[${index}].root`)) || '.';
    if (root !== project.root) {
      throw new TypeError(`symbol snapshot projectStatuses[${index}].root must match project ${projectId}`);
    }
    const status = input.status;
    if (status !== 'analyzed' && status !== 'skipped') {
      throw new TypeError(`symbol snapshot projectStatuses[${index}].status must be analyzed or skipped`);
    }
    const reason = input.reason === undefined
      ? undefined
      : input.reason === 'missing-at-revision' ? input.reason : undefined;
    if (input.reason !== undefined && reason === undefined) {
      throw new TypeError(`symbol snapshot projectStatuses[${index}].reason is unsupported`);
    }
    if (status === 'skipped' && reason === undefined) {
      throw new TypeError(`symbol snapshot projectStatuses[${index}].reason is required for skipped projects`);
    }
    if (status === 'analyzed' && reason !== undefined) {
      throw new TypeError(`symbol snapshot projectStatuses[${index}].reason is only valid for skipped projects`);
    }
    return {
      projectId,
      root,
      status,
      ...(reason === undefined ? {} : { reason }),
    } satisfies SymbolSnapshotProjectStatus;
  });
  if (new Set(normalized.map((entry) => entry.projectId)).size !== normalized.length) {
    throw new TypeError('symbol snapshot projectStatuses must not contain duplicate project IDs');
  }
  if (normalized.length !== projects.length) {
    throw new TypeError('symbol snapshot projectStatuses must cover every declared project');
  }
  return [...normalized].sort((left, right) =>
    compareStableText(left.projectId, right.projectId));
}

function normalizeSymbolSnapshotEntry(entry: SymbolSnapshotEntry): SymbolSnapshotEntry {
  const base = normalizeSymbolEntry(entry);
  const name = nonEmptyText(entry.name, 'symbol snapshot name');
  const startLine = positiveInteger(entry.startLine, 'symbol snapshot startLine');
  const endLine = positiveInteger(entry.endLine, 'symbol snapshot endLine');
  if (endLine < startLine) throw new TypeError('symbol snapshot endLine must not precede startLine');
  const parentId = entry.parentId === undefined
    ? undefined
    : nonEmptyText(entry.parentId, 'symbol snapshot parentId');
  return {
    ...base,
    name,
    startLine,
    endLine,
    ...(parentId === undefined ? {} : { parentId }),
  };
}

function sameSymbolSnapshotEntry(left: SymbolSnapshotEntry, right: SymbolSnapshotEntry): boolean {
  return left.projectId === right.projectId
    && left.entityId === right.entityId
    && left.filePath === right.filePath
    && left.symbol === right.symbol
    && left.kind === right.kind
    && left.name === right.name
    && left.startLine === right.startLine
    && left.endLine === right.endLine
    && left.parentId === right.parentId;
}

function normalizeSymbolSnapshotRevision(value: SymbolSnapshotRevision): SymbolSnapshotRevision {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('symbol snapshot revision must be an object');
  }
  const input = value as Record<string, unknown>;
  const revision: SymbolSnapshotRevision = {
    ...(input.commit === undefined ? {} : { commit: nonEmptyText(input.commit as string, 'symbol snapshot revision.commit') }),
    ...(input.gitHead === undefined ? {} : { gitHead: nonEmptyText(input.gitHead as string, 'symbol snapshot revision.gitHead') }),
    ...(input.workingTreeDigest === undefined ? {} : { workingTreeDigest: nonEmptyText(input.workingTreeDigest as string, 'symbol snapshot revision.workingTreeDigest') }),
  };
  if (Object.keys(revision).length === 0) {
    throw new TypeError('symbol snapshot revision must identify a commit or working tree');
  }
  return revision;
}

function normalizeSymbolEntry(entry: SymbolSetEntry): SymbolSetEntry {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new TypeError('symbol context entry must be an object');
  }
  const filePath = normalizeRepositoryPath(nonEmptyText(entry.filePath, 'symbol filePath'));
  return {
    projectId: nonEmptyText(entry.projectId, 'symbol projectId'),
    entityId: nonEmptyText(entry.entityId, 'symbol entityId'),
    filePath: filePath.length === 0 ? '.' : filePath,
    symbol: nonEmptyText(entry.symbol, 'symbol symbol'),
    kind: nonEmptyText(entry.kind, 'symbol kind'),
  };
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
  return value;
}

function nonEmptyText(value: string, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) {
    throw new TypeError(`${label} must be non-empty text without null bytes`);
  }
  return value;
}

function optionalPositiveInteger(value: number | undefined, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
  return value;
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative safe integer`);
  }
  return value;
}

function normalizeFileExtensions(
  value: readonly string[],
  label: string,
  limits: SemFoundationLimits,
): readonly string[] {
  if (
    !Array.isArray(value)
    || value.length === 0
    || value.length > limits.maxAnalysisProjectFileExtensions
  ) {
    throw new TypeError(
      `${label} must contain between 1 and ${limits.maxAnalysisProjectFileExtensions} extensions`,
    );
  }
  const normalized = value.map((extension, index) => {
    const text = nonEmptyText(extension, `${label}[${index}]`).trim().toLowerCase();
    if (
      text.length > limits.maxAnalysisProjectFileExtensionChars
      || !/^\.[a-z0-9][a-z0-9._-]*$/u.test(text)
    ) {
      throw new TypeError(`${label}[${index}] must be a dot-prefixed file extension`);
    }
    return text;
  });
  if (new Set(normalized).size !== normalized.length) {
    throw new TypeError(`${label} must not contain duplicate extensions`);
  }
  return [...normalized].sort();
}

/** Normalizes one analysis project's extension filter for parser adapters. */
export function normalizeAnalysisProjectFileExtensions(
  value: readonly string[],
  label = 'analysis project.fileExtensions',
  options?: SemFoundationLimitOptions,
): readonly string[] {
  return normalizeFileExtensions(value, label, resolveSemFoundationLimits(options));
}

function positiveLimit(
  value: SemFoundationLimitValue | undefined,
  fallback: number,
  label: string,
): number {
  if (value === 'unbounded') return Number.MAX_SAFE_INTEGER;
  const result = value ?? fallback;
  if (!Number.isSafeInteger(result) || result <= 0) {
    throw new TypeError(`${label} must be a positive safe integer`);
  }
  return result;
}
