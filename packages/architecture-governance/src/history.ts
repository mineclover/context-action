import path from 'node:path';
import {
  compareStableText,
  compareSymbolContexts,
  createSymbolSnapshotEntry,
  createSymbolSnapshot,
  diffSymbolSnapshots,
  entitySymbol,
  type SymbolSnapshotEntry as FoundationSymbolSnapshotEntry,
  MAX_SYMBOL_SNAPSHOT_ENTRIES,
  normalizeAnalysisProjects,
  parseSymbolSnapshot,
  resolveSemFoundationLimits,
  type SemFoundationLimitOptions,
  type SemFoundationLimitValue,
  type SymbolContext,
  type SymbolContextComparison,
  type SymbolSetEntry,
  type SymbolSnapshot,
  type SymbolSnapshotDiff,
  type SymbolSnapshotProjectStatus,
} from '@sem-foundation/contracts';
import {
  analyzeHistoricalProjects,
  GitHistoryReader,
  GitWorktreeManager,
  MAX_GIT_HISTORY_COMMITS,
  RepositoryRevisionReader,
  RepositoryStateError,
  sameRepositoryRevision,
} from '@sem-foundation/repository';
import type {
  ArchitectureProject,
  SemChange,
  SemEntity,
  SemExecutionLimits,
  SemProjectAnalysis,
} from './contracts.js';
import { InputContractError } from './errors.js';
import { loadArchitectureRegistry } from './input.js';
import {
  canonicalRepositoryRoot,
  requireExistingRepositoryPath,
} from './paths.js';
import {
  MAX_SEM_EVIDENCE_TEXT_CHARS,
  resolveSemCommand,
  resolveSemExecutionLimits,
  runSemDiff,
  runSemProjectAnalysis,
  runSemVersion,
  type SemAggregateOutputBudget,
  SemExecutionError,
} from './sem.js';
import { hasVisibleText, isWellFormedText } from './text.js';

export const MAX_SYMBOL_HISTORY_COMMITS = MAX_GIT_HISTORY_COMMITS;
export const MAX_SYMBOL_HISTORY_CHANGES = 65_536;
export const MAX_SYMBOL_HISTORY_SNAPSHOT_SYMBOLS = MAX_SYMBOL_SNAPSHOT_ENTRIES;

export interface SymbolHistoryChange {
  changeType: SemChange['changeType'];
  entityId: string;
  filePath: string;
  symbol: string;
  oldFilePath?: string;
}

export interface SymbolHistoryCommit {
  commit: string;
  parent: string;
  subject: string;
  changes: SymbolHistoryChange[];
  snapshot: SymbolHistorySnapshot;
}

export type SymbolSnapshotEntry = FoundationSymbolSnapshotEntry;
export type SymbolHistorySnapshot = SymbolSnapshot;

export interface SymbolHistoryReport {
  contractId: 'context-action/symbol-history-report';
  contractVersion: '1.3';
  generatedAt: string;
  repositoryRoot: string;
  range: { from: string; to: string };
  commits: SymbolHistoryCommit[];
  summary: {
    commits: number;
    changes: number;
    snapshotSymbols: number;
    added: number;
    modified: number;
    deleted: number;
    moved: number;
    renamed: number;
    reordered: number;
  };
}

export interface SymbolContextComparisonReport extends SymbolContextComparison {
  contractId: 'context-action/symbol-context-comparison';
  contractVersion: '1.0';
  generatedAt: string;
}

export interface SymbolSnapshotDiffReport extends SymbolSnapshotDiff {
  contractId: 'context-action/symbol-snapshot-diff';
  contractVersion: '1.0';
  generatedAt: string;
  beforeRevision: string;
  afterRevision: string;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InputContractError(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string, max = MAX_SEM_EVIDENCE_TEXT_CHARS): string {
  if (
    typeof value !== 'string'
    || value.length === 0
    || value.length > max
    || value.includes('\0')
    || !isWellFormedText(value)
    || !hasVisibleText(value)
  ) {
    throw new InputContractError(`${label} must be visible, well-formed text within ${max} characters`);
  }
  return value;
}

function positiveInteger(value: unknown, label: string): number {
  if (value === 'unbounded') return Number.MAX_SAFE_INTEGER;
  if (!Number.isSafeInteger(value) || (value as number) <= 0) {
    throw new InputContractError(`${label} must be a positive safe integer`);
  }
  return value as number;
}

function foundationLimits(
  value: unknown,
  label: string,
): SemFoundationLimitOptions {
  try {
    return resolveSemFoundationLimits(value as SemFoundationLimitOptions | undefined);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new InputContractError(`${label}: ${error.message}`);
    }
    throw error;
  }
}

function historyProjects(
  value: unknown,
  contractLimits?: SemFoundationLimitOptions,
): ArchitectureProject[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new InputContractError('symbol history options.projects must contain at least one project');
  }
  const projects = value.map((entry, index) => {
    const project = record(entry, `symbol history options.projects[${index}]`);
    return {
      id: text(project.id, `symbol history options.projects[${index}].id`),
      root: text(project.root, `symbol history options.projects[${index}].root`),
      ...(project.fileExtensions === undefined ? {} : {
        fileExtensions: project.fileExtensions as string[],
      }),
    };
  });
  try {
    return [...normalizeAnalysisProjects(projects, 'symbol history options.projects', contractLimits)];
  } catch (error) {
    if (error instanceof TypeError) {
      throw new InputContractError(error.message);
    }
    throw error;
  }
}

async function projectsAtHistoricalRevision(options: {
  worktreeRoot: string;
  registryPath: string;
  contractLimits?: SemFoundationLimitOptions;
}): Promise<ArchitectureProject[]> {
  const candidate = path.resolve(options.worktreeRoot, options.registryPath);
  const relative = path.relative(options.worktreeRoot, candidate);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new InputContractError(
      `historical registry path escapes the worktree: ${options.registryPath}`,
    );
  }
  const registryFile = await requireExistingRepositoryPath(
    options.worktreeRoot,
    options.registryPath,
    'Historical registry path',
    'file',
  );
  const registry = await loadArchitectureRegistry(registryFile, options.contractLimits);
  return historyProjects(
    registry.analysisProjects ?? [{ id: 'default', root: '.' }],
    options.contractLimits,
  );
}

function serializeChange(change: SemChange): SymbolHistoryChange {
  return {
    changeType: change.changeType,
    entityId: change.entityId,
    filePath: change.filePath,
    symbol: entitySymbol(change.entityId, change.filePath),
    ...(change.oldFilePath === undefined ? {} : { oldFilePath: change.oldFilePath }),
  };
}

function createSnapshotFromAnalyses(options: {
  repositoryRoot: string;
  revision: SymbolSnapshot['revision'];
  projects: ArchitectureProject[];
  analyses: readonly { project: ArchitectureProject; value: SemProjectAnalysis }[];
  projectStatuses?: readonly SymbolSnapshotProjectStatus[];
  contractLimits?: SemFoundationLimitOptions;
}): SymbolSnapshot {
  const contractLimits = resolveSemFoundationLimits(options.contractLimits);
  const entities = options.analyses.flatMap(({ project, value }) =>
    value.entities.map((entity) => ({ entity, projectId: project.id })));
  const uniqueEntities = new Map<string, { entity: SemEntity; projectId: string }>();
  for (const entry of entities) {
    const key = `${entry.projectId}\0${entry.entity.file}\0${entry.entity.id}`;
    const previous = uniqueEntities.get(key);
    if (!previous) {
      uniqueEntities.set(key, entry);
      continue;
    }
    if (
      previous.entity.file !== entry.entity.file
      || previous.entity.id !== entry.entity.id
      || previous.entity.name !== entry.entity.name
      || previous.entity.parentId !== entry.entity.parentId
    ) {
      throw new InputContractError(`conflicting symbol evidence for ${key}`);
    }
    if (previous.entity.kind !== entry.entity.kind) {
      throw new InputContractError(
        `symbol identity collision for ${key}: kinds ${previous.entity.kind} and ${entry.entity.kind}`,
      );
    }
    uniqueEntities.set(key, {
      projectId: previous.projectId,
      entity: {
        ...previous.entity,
        startLine: Math.min(previous.entity.startLine, entry.entity.startLine),
        endLine: Math.max(previous.entity.endLine, entry.entity.endLine),
      },
    });
  }
  if (uniqueEntities.size > contractLimits.maxSymbolSnapshotEntries) {
    throw new InputContractError(
      `symbol snapshot exceeds ${contractLimits.maxSymbolSnapshotEntries} symbols`,
    );
  }
  const symbols = [...uniqueEntities.values()]
    .map(({ entity, projectId }) => createSymbolSnapshotEntry({
      id: entity.id,
      parentId: entity.parentId,
      name: entity.name,
      type: entity.kind,
      file: entity.file,
      startLine: entity.startLine,
      endLine: entity.endLine,
    }, projectId));
  return createSymbolSnapshot({
    repositoryRoot: options.repositoryRoot,
    revision: options.revision,
    projects: options.projects,
    ...(options.projectStatuses === undefined ? {} : { projectStatuses: options.projectStatuses }),
    symbols,
    limits: contractLimits,
  });
}

async function collectCommitSnapshot(options: {
  repositoryRoot: string;
  worktreeRoot: string;
  commit: string;
  projects: ArchitectureProject[];
  command?: string;
  limits?: Partial<SemExecutionLimits>;
  contractLimits?: SemFoundationLimitOptions;
  aggregateOutputBudget: SemAggregateOutputBudget;
  nextLimits?: (operation: 'entities', args: string[]) => SemExecutionLimits;
}): Promise<SymbolHistorySnapshot> {
  const analyses = await analyzeHistoricalProjects({
    commit: options.commit,
    worktreeRoot: options.worktreeRoot,
    projects: options.projects,
    limits: options.contractLimits,
    missingProject: 'skip',
    analyze: ({ project }) => {
      const args = ['entities', project.root, '--json'];
      const value = runSemProjectAnalysis({
        repositoryRoot: options.worktreeRoot,
        project,
        impactFromPatterns: [],
          ...(options.command === undefined ? {} : { command: options.command }),
        ...(options.nextLimits
          ? { limits: options.nextLimits('entities', args) }
          : options.limits === undefined ? {} : { limits: options.limits }),
        aggregateOutputBudget: options.aggregateOutputBudget,
      });
      if (options.nextLimits) options.nextLimits('entities', args);
      return value;
    },
  });
  const analyzedProjects = new Set(analyses.map(({ project }) => project.id));
  const projectStatuses = options.projects.map((project) => analyzedProjects.has(project.id)
    ? { projectId: project.id, root: project.root, status: 'analyzed' as const }
    : { projectId: project.id, root: project.root, status: 'skipped' as const, reason: 'missing-at-revision' as const });
  return createSnapshotFromAnalyses({
    repositoryRoot: options.repositoryRoot,
    revision: { commit: options.commit },
    projects: options.projects,
    analyses,
    projectStatuses,
    contractLimits: options.contractLimits,
  });
}

export async function collectSymbolHistory(options: {
  repositoryRoot: string;
  from: string;
  to: string;
  projects?: ArchitectureProject[];
  /** Repository-relative registry path used to resolve analysisProjects per commit. */
  registryPath?: string;
  command?: string;
  limits?: Partial<SemExecutionLimits>;
  contractLimits?: SemFoundationLimitOptions;
  maxChanges?: SemFoundationLimitValue;
  maxCommits?: SemFoundationLimitValue;
}): Promise<SymbolHistoryReport> {
  const input = record(options as unknown, 'symbol history options');
  const repositoryPath = await canonicalRepositoryRoot(
    text(input.repositoryRoot, 'symbol history options.repositoryRoot'),
  );
  const repositoryRoot = new RepositoryRevisionReader().resolveRepositoryRoot(repositoryPath);
  const from = text(input.from, 'symbol history options.from');
  const to = text(input.to, 'symbol history options.to');
  const maxCommits = input.maxCommits === undefined
    ? MAX_SYMBOL_HISTORY_COMMITS
    : positiveInteger(input.maxCommits, 'symbol history options.maxCommits');
  const maxChanges = input.maxChanges === undefined
    ? MAX_SYMBOL_HISTORY_CHANGES
    : positiveInteger(input.maxChanges, 'symbol history options.maxChanges');
  const contractLimits = foundationLimits(
    input.contractLimits,
    'symbol history options.contractLimits',
  );
  const command = input.command === undefined ? undefined : text(input.command, 'symbol history options.command');
  const projects = input.projects === undefined
    ? [{ id: 'symbol-history', root: '.' }]
    : historyProjects(input.projects, contractLimits);
  const registryPath = input.registryPath === undefined
    ? undefined
    : text(input.registryPath, 'symbol history options.registryPath');
  const limits = input.limits as Partial<SemExecutionLimits> | undefined;
  const resolvedLimits = resolveSemExecutionLimits(limits);
  const commandPath = resolveSemCommand(command);
  const startedAt = performance.now();
  const nextLimits = (operation: 'version' | 'diff' | 'entities', args: string[], detail: string): SemExecutionLimits => {
    const durationMs = Math.ceil(performance.now() - startedAt);
    const timeoutMs = resolvedLimits.timeoutMs - durationMs;
    if (timeoutMs <= 0) {
      throw new SemExecutionError({
        operation,
        reason: 'timeout',
        command: commandPath,
        args,
        cwd: repositoryRoot,
        durationMs,
        ...resolvedLimits,
        detail: `symbol history aggregate timeout exhausted ${resolvedLimits.timeoutMs}ms ${detail}`,
      });
    }
    return { ...resolvedLimits, timeoutMs };
  };
  const aggregateOutputBudget: SemAggregateOutputBudget = {
    label: 'symbol history aggregate output',
    limitBytes: resolvedLimits.maxOutputBytes,
    usedBytes: 0,
  };
  const commits = new GitHistoryReader().listRange({
    repositoryRoot,
    from,
    to,
    maxCommits,
  });
  if (command !== undefined || limits !== undefined || commits.length > 0) {
    runSemVersion({
      repositoryRoot,
      command: commandPath,
      limits: nextLimits('version', ['--version'], 'before sem version'),
      aggregateOutputBudget,
    });
  }
  const summary = {
    commits: commits.length,
    changes: 0,
    snapshotSymbols: 0,
    added: 0,
    modified: 0,
    deleted: 0,
    moved: 0,
    renamed: 0,
    reordered: 0,
  };
  const reportCommits = await new GitWorktreeManager(repositoryRoot).withCommitRange(
    commits,
    async (commit, worktreeRoot): Promise<SymbolHistoryCommit> => {
      const commitProjects = registryPath === undefined
        ? projects
        : await projectsAtHistoricalRevision({
          worktreeRoot,
          registryPath,
          contractLimits,
        });
      const changeSet = runSemDiff({
        repositoryRoot,
        command: commandPath,
        from: commit.parent,
        to: commit.commit,
        limits: nextLimits('diff', ['diff', '--from', commit.parent, '--to', commit.commit, '--format', 'json'], `before diff ${commit.commit}`),
        aggregateOutputBudget,
      });
      const changes = changeSet.changes
        .map(serializeChange)
        .sort((left, right) => compareStableText(
          `${left.filePath}\0${left.symbol}\0${left.changeType}`,
          `${right.filePath}\0${right.symbol}\0${right.changeType}`,
        ));
      if (summary.changes + changes.length > maxChanges) {
        throw new InputContractError(
          `symbol history exceeds ${maxChanges} total symbol changes`,
        );
      }
      const snapshot = await collectCommitSnapshot({
        repositoryRoot,
        worktreeRoot,
        commit: commit.commit,
        projects: commitProjects,
        ...(command === undefined ? {} : { command }),
        ...(limits === undefined ? {} : { limits }),
        contractLimits,
        nextLimits: (operation, args) => nextLimits(operation, args, `before snapshot ${commit.commit}`),
        aggregateOutputBudget,
      });
      summary.changes += changes.length;
      summary.snapshotSymbols += snapshot.symbols.length;
      for (const change of changes) summary[change.changeType] += 1;
      return { ...commit, changes, snapshot };
    },
    maxCommits,
  );
  return {
    contractId: 'context-action/symbol-history-report',
    contractVersion: '1.3',
    generatedAt: new Date().toISOString(),
    repositoryRoot: path.posix.normalize(repositoryRoot.replace(/\\/gu, '/')),
    range: { from, to },
    commits: [...reportCommits],
    summary,
  };
}

/** Collects one complete symbol snapshot from the current worktree or a Git commit. */
export async function collectSymbolSnapshot(options: {
  repositoryRoot: string;
  projects?: ArchitectureProject[];
  /** Repository-relative registry path used to resolve analysisProjects at a historical commit. */
  registryPath?: string;
  commit?: string;
  command?: string;
  limits?: Partial<SemExecutionLimits>;
  contractLimits?: SemFoundationLimitOptions;
}): Promise<SymbolSnapshot> {
  const input = record(options as unknown, 'symbol snapshot options');
  const repositoryPath = await canonicalRepositoryRoot(
    text(input.repositoryRoot, 'symbol snapshot options.repositoryRoot'),
  );
  const repositoryReader = new RepositoryRevisionReader();
  const repositoryRoot = repositoryReader.resolveRepositoryRoot(repositoryPath);
  const contractLimits = foundationLimits(
    input.contractLimits,
    'symbol snapshot options.contractLimits',
  );
  const projects = input.projects === undefined
    ? [{ id: 'symbol-snapshot', root: '.' }]
    : historyProjects(input.projects, contractLimits);
  const registryPath = input.registryPath === undefined
    ? undefined
    : text(input.registryPath, 'symbol snapshot options.registryPath');
  const commit = input.commit === undefined
    ? undefined
    : text(input.commit, 'symbol snapshot options.commit');
  const command = input.command === undefined
    ? undefined
    : text(input.command, 'symbol snapshot options.command');
  const limits = input.limits as Partial<SemExecutionLimits> | undefined;
  const resolvedLimits = resolveSemExecutionLimits(limits);
  const commandPath = resolveSemCommand(command);
  const startedAt = performance.now();
  const aggregateOutputBudget: SemAggregateOutputBudget = {
    label: 'symbol snapshot aggregate output',
    limitBytes: resolvedLimits.maxOutputBytes,
    usedBytes: 0,
  };
  const nextLimits = (operation: 'version' | 'entities', args: string[], detail: string): SemExecutionLimits => {
    const durationMs = Math.ceil(performance.now() - startedAt);
    const timeoutMs = resolvedLimits.timeoutMs - durationMs;
    if (timeoutMs <= 0) {
      throw new SemExecutionError({
        operation,
        reason: 'timeout',
        command: commandPath,
        args,
        cwd: repositoryRoot,
        durationMs,
        ...resolvedLimits,
        detail: `symbol snapshot aggregate timeout exhausted ${resolvedLimits.timeoutMs}ms ${detail}`,
      });
    }
    return { ...resolvedLimits, timeoutMs };
  };

  runSemVersion({
    repositoryRoot,
    command: commandPath,
    limits: nextLimits('version', ['--version'], 'before sem version'),
    aggregateOutputBudget,
  });

  const analyzeProject = (
    analysisRoot: string,
    project: ArchitectureProject,
  ): SemProjectAnalysis => {
    const args = ['entities', project.root, '--json'];
    return runSemProjectAnalysis({
      repositoryRoot: analysisRoot,
      project,
      impactFromPatterns: [],
      ...(command === undefined ? {} : { command }),
      limits: nextLimits('entities', args, `before snapshot ${project.id}`),
      aggregateOutputBudget,
    });
  };

  const collectAt = async (
    analysisRoot: string,
    revision: SymbolSnapshot['revision'],
    projectsToAnalyze: readonly ArchitectureProject[] = projects,
    projectStatuses?: readonly SymbolSnapshotProjectStatus[],
  ): Promise<SymbolSnapshot> => {
    const analyses = projectsToAnalyze.map((project) => ({
      project,
      value: analyzeProject(analysisRoot, project),
    }));
    return createSnapshotFromAnalyses({
      repositoryRoot,
      revision,
      projects,
      ...(projectStatuses === undefined ? {} : { projectStatuses }),
      analyses,
      contractLimits,
    });
  };

  if (commit !== undefined) {
    const worktreeManager = new GitWorktreeManager(repositoryRoot);
    const resolvedCommit = worktreeManager.resolveCommit(commit);
    return worktreeManager.withCommit(resolvedCommit, async (worktreeRoot) => {
      const commitProjects = registryPath === undefined
        ? projects
        : await projectsAtHistoricalRevision({
          worktreeRoot,
          registryPath,
          contractLimits,
        });
      const analyses = await analyzeHistoricalProjects({
        commit: resolvedCommit,
        worktreeRoot,
        projects: commitProjects,
        limits: contractLimits,
        missingProject: 'skip',
        analyze: ({ project }) => analyzeProject(worktreeRoot, project),
      });
      const analyzedProjects = new Set(analyses.map(({ project }) => project.id));
      const projectStatuses = commitProjects.map((project) => analyzedProjects.has(project.id)
        ? { projectId: project.id, root: project.root, status: 'analyzed' as const }
        : { projectId: project.id, root: project.root, status: 'skipped' as const, reason: 'missing-at-revision' as const });
      return createSnapshotFromAnalyses({
        repositoryRoot,
        revision: { commit: resolvedCommit },
        projects: commitProjects,
        projectStatuses,
        analyses,
        contractLimits,
      });
    });
  }
  const revision = repositoryReader.read(repositoryRoot);
  const snapshot = await collectAt(repositoryRoot, {
    gitHead: revision.gitHead,
    workingTreeDigest: revision.workingTreeDigest,
  });
  const finalRevision = repositoryReader.read(repositoryRoot);
  if (!sameRepositoryRevision(revision, finalRevision)) {
    throw new RepositoryStateError(
      `Repository changed while symbol snapshot was collected: ${revision.workingTreeDigest} -> ${finalRevision.workingTreeDigest}`,
    );
  }
  return snapshot;
}

export function renderSymbolHistoryJson(report: SymbolHistoryReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderSymbolSnapshotJson(snapshot: SymbolSnapshot): string {
  return `${JSON.stringify(snapshot, null, 2)}\n`;
}

export function renderSymbolSnapshotConsole(snapshot: SymbolSnapshot): string {
  const revision = snapshot.revision.commit
    ?? snapshot.revision.gitHead
    ?? 'worktree';
  const lines = [
    `Symbol snapshot: ${revision} | ${snapshot.symbols.length} symbols`,
    `Projects: ${snapshot.projectStatuses.map((project) => `${project.projectId} (${project.status}${project.reason ? `:${project.reason}` : ''})`).join(', ')}`,
  ];
  for (const symbol of snapshot.symbols) {
    lines.push(`  [${symbol.projectId}] ${symbol.filePath} :: ${symbol.symbol}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderSymbolSnapshotMarkdown(snapshot: SymbolSnapshot): string {
  const revision = snapshot.revision.commit
    ?? snapshot.revision.gitHead
    ?? 'worktree';
  const lines = [
    '# Symbol Snapshot',
    '',
    `- Revision: \`${revision}\``,
    `- Projects: ${snapshot.projectStatuses.map((project) => `\`${project.projectId}\` (${project.status})`).join(', ')}`,
    `- Symbols: ${snapshot.symbols.length}`,
    '',
    '| Project | File | Symbol | Kind | Lines |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const symbol of snapshot.symbols) {
    lines.push(`| \`${symbol.projectId}\` | \`${symbol.filePath}\` | \`${symbol.symbol}\` | \`${symbol.kind}\` | ${symbol.startLine}-${symbol.endLine} |`);
  }
  return `${lines.join('\n')}\n`;
}

export function parseSymbolContext(value: unknown, label = 'symbol context'): SymbolContext {
  const input = record(value, label);
  const id = text(input.id, `${label}.id`);
  if (!Array.isArray(input.symbols)) {
    throw new InputContractError(`${label}.symbols must be an array`);
  }
  const symbols = input.symbols.map((value, index) => {
    const entry = record(value, `${label}.symbols[${index}]`);
    return {
      projectId: text(entry.projectId, `${label}.symbols[${index}].projectId`),
      entityId: text(entry.entityId, `${label}.symbols[${index}].entityId`),
      filePath: text(entry.filePath, `${label}.symbols[${index}].filePath`),
      symbol: text(entry.symbol, `${label}.symbols[${index}].symbol`),
      kind: text(entry.kind, `${label}.symbols[${index}].kind`),
    } satisfies SymbolSetEntry;
  });
  return { id, symbols };
}

export function parseSymbolContextDocument(
  value: unknown,
  label = 'symbol context document',
  contractLimits?: SemFoundationLimitOptions,
): SymbolContext {
  const input = record(value, label);
  if (input.contractId === 'context-action/symbol-snapshot') {
    const snapshot = parseSymbolSnapshot(input, label, contractLimits);
    const revision = snapshot.revision.commit
      ?? snapshot.revision.gitHead
      ?? snapshot.revision.workingTreeDigest
      ?? 'unknown';
    return { id: `snapshot:${revision}`, symbols: snapshot.symbols };
  }
  if (Array.isArray(input.symbols)) return parseSymbolContext(input, label);
  if (input.snapshot !== undefined) {
    const snapshot = parseSymbolSnapshot(input.snapshot, `${label}.snapshot`, contractLimits);
    const revision = snapshot.revision.commit
      ?? snapshot.revision.gitHead
      ?? snapshot.revision.workingTreeDigest
      ?? 'unknown';
    return {
      id: `snapshot:${revision}`,
      symbols: snapshot.symbols,
    };
  }
  throw new InputContractError(`${label} must contain symbols or snapshot.symbols`);
}

export function parseSymbolSnapshotDocument(
  value: unknown,
  label = 'symbol snapshot document',
  contractLimits?: SemFoundationLimitOptions,
): SymbolSnapshot {
  const input = record(value, label);
  if (input.contractId === 'context-action/symbol-snapshot') {
    return parseSymbolSnapshot(input, label, contractLimits);
  }
  if (input.snapshot !== undefined) {
    return parseSymbolSnapshot(input.snapshot, `${label}.snapshot`, contractLimits);
  }
  throw new InputContractError(`${label} must be a symbol snapshot document`);
}

function snapshotRevision(snapshot: SymbolSnapshot): string {
  return snapshot.revision.commit
    ?? snapshot.revision.gitHead
    ?? snapshot.revision.workingTreeDigest
    ?? 'unknown';
}

export function createSymbolSnapshotDiffReport(
  before: SymbolSnapshot,
  after: SymbolSnapshot,
): SymbolSnapshotDiffReport {
  if (before.repositoryRoot !== after.repositoryRoot) {
    throw new InputContractError('symbol snapshot diff requires matching repositoryRoot values');
  }
  return {
    contractId: 'context-action/symbol-snapshot-diff',
    contractVersion: '1.0',
    generatedAt: new Date().toISOString(),
    beforeRevision: snapshotRevision(before),
    afterRevision: snapshotRevision(after),
    ...diffSymbolSnapshots(before, after),
  };
}

export function renderSymbolSnapshotDiffJson(report: SymbolSnapshotDiffReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderSymbolSnapshotDiffConsole(report: SymbolSnapshotDiffReport): string {
  const lines = [
    `Symbol snapshot diff: ${report.beforeRevision} -> ${report.afterRevision}`,
    `Added: ${report.added.length}`,
    `Removed: ${report.removed.length}`,
    `Modified: ${report.modified.length}`,
  ];
  for (const entry of report.added) lines.push(`  + ${entry.filePath} :: ${entry.symbol}`);
  for (const entry of report.removed) lines.push(`  - ${entry.filePath} :: ${entry.symbol}`);
  for (const entry of report.modified) {
    lines.push(`  ~ ${entry.after.filePath} :: ${entry.after.symbol}`);
  }
  return `${lines.join('\n')}\n`;
}

export function renderSymbolSnapshotDiffMarkdown(report: SymbolSnapshotDiffReport): string {
  const lines = [
    '# Symbol Snapshot Diff',
    '',
    `- Before: \`${report.beforeRevision}\``,
    `- After: \`${report.afterRevision}\``,
    `- Added: ${report.added.length}`,
    `- Removed: ${report.removed.length}`,
    `- Modified: ${report.modified.length}`,
    '',
    '| Change | Project | File | Symbol |',
    '| --- | --- | --- | --- |',
  ];
  for (const entry of report.added) {
    lines.push(`| + | \`${entry.projectId}\` | \`${entry.filePath}\` | \`${entry.symbol}\` |`);
  }
  for (const entry of report.removed) {
    lines.push(`| - | \`${entry.projectId}\` | \`${entry.filePath}\` | \`${entry.symbol}\` |`);
  }
  for (const entry of report.modified) {
    lines.push(`| ~ | \`${entry.after.projectId}\` | \`${entry.after.filePath}\` | \`${entry.after.symbol}\` |`);
  }
  return `${lines.join('\n')}\n`;
}

export function createSymbolContextComparisonReport(
  left: SymbolContext,
  right: SymbolContext,
): SymbolContextComparisonReport {
  return {
    contractId: 'context-action/symbol-context-comparison',
    contractVersion: '1.0',
    generatedAt: new Date().toISOString(),
    ...compareSymbolContexts(left, right),
  };
}

export function renderSymbolContextComparisonJson(
  report: SymbolContextComparisonReport,
): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function renderSymbolContextComparisonConsole(
  report: SymbolContextComparisonReport,
): string {
  return `${[
    `Symbol context comparison: ${report.leftContextId} ∩ ${report.rightContextId}`,
    `Intersection: ${report.intersection.length}`,
    `Only left: ${report.onlyLeft.length}`,
    `Only right: ${report.onlyRight.length}`,
    '',
    ...report.intersection.map((entry) => `  ∩ ${entry.filePath} :: ${entry.symbol}`),
  ].join('\n')}\n`;
}

export function renderSymbolContextComparisonMarkdown(
  report: SymbolContextComparisonReport,
): string {
  const lines = [
    '# Symbol Context Comparison',
    '',
    `- Left: \`${report.leftContextId}\``,
    `- Right: \`${report.rightContextId}\``,
    `- Intersection: ${report.intersection.length}`,
    `- Only left: ${report.onlyLeft.length}`,
    `- Only right: ${report.onlyRight.length}`,
    '',
    '| Set | Project | File | Symbol |',
    '| --- | --- | --- | --- |',
  ];
  for (const [set, entries] of [
    ['intersection', report.intersection],
    ['only-left', report.onlyLeft],
    ['only-right', report.onlyRight],
  ] as const) {
    for (const entry of entries) {
      lines.push(`| ${set} | \`${entry.projectId}\` | \`${entry.filePath}\` | \`${entry.symbol}\` |`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function renderSymbolHistoryConsole(report: SymbolHistoryReport): string {
  const lines = [
    `Symbol history: ${report.summary.commits} commits | ${report.summary.changes} changes`,
    `Materialized snapshots: ${report.summary.snapshotSymbols} symbols`,
    `Range: ${report.range.from}..${report.range.to}`,
  ];
  for (const commit of report.commits) {
    lines.push(`${commit.commit} ${commit.subject} | ${commit.changes.length} changes | ${commit.snapshot.symbols.length} snapshot symbols`);
    for (const change of commit.changes) {
      lines.push(`  ${change.changeType} ${change.filePath} :: ${change.symbol}`);
    }
    lines.push('  Snapshot:');
    for (const symbol of commit.snapshot.symbols) {
      lines.push(`    [${symbol.projectId}] ${symbol.filePath} :: ${symbol.symbol}`);
    }
  }
  return `${lines.join('\n')}\n`;
}

export function renderSymbolHistoryMarkdown(report: SymbolHistoryReport): string {
  const lines = [
    '# Architecture Governance Symbol History',
    '',
    `- Range: \`${report.range.from}..${report.range.to}\``,
    `- Commits: ${report.summary.commits}`,
    `- Symbol changes: ${report.summary.changes}`,
    `- Materialized snapshot symbols: ${report.summary.snapshotSymbols}`,
    '',
  ];
  for (const commit of report.commits) {
    lines.push(
      `## ${commit.commit} — ${commit.subject}`,
      '',
      `Snapshot: ${commit.snapshot.symbols.length} symbols`,
      `Projects: ${commit.snapshot.projectStatuses.map((project) => `\`${project.projectId}\` (${project.status})`).join(', ')}`,
      '',
    );
    lines.push('| Project | File | Symbol | Kind | Lines |', '| --- | --- | --- | --- | --- |');
    for (const symbol of commit.snapshot.symbols) {
      lines.push(`| \`${symbol.projectId}\` | \`${symbol.filePath}\` | \`${symbol.symbol}\` | \`${symbol.kind}\` | ${symbol.startLine}-${symbol.endLine} |`);
    }
    lines.push('');
    if (commit.changes.length === 0) {
      lines.push('No semantic symbol changes.', '');
      continue;
    }
    lines.push('| Change | File | Symbol |', '| --- | --- | --- |');
    for (const change of commit.changes) {
      lines.push(`| ${change.changeType} | \`${change.filePath}\` | \`${change.symbol}\` |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
