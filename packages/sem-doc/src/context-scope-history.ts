import { appendFileSync, existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import * as path from 'node:path';

import {
  type GitHistoryRangeOptions,
  GitHistoryReader,
  type GitRuntimeOptions,
  GitWorktreeManager,
} from '@context-action/sem-foundation-repository';

import {
  type ContextScope,
  type ContextScopeKind,
  type ContextScopeOptions,
  createContextScope,
  parseContextScope,
} from './context-scope';
import {
  type ContextScopeDiff,
  diffContextScopes,
} from './context-scope-diff';
import {
  createExecutionProvenance,
  type ExecutionProvenance,
} from './execution-provenance';
import {
  createSemExecutionBudget,
  SemClient,
  type SemExecutionBudget,
} from './sem-client';
import {
  DEFAULT_WORK_CONTEXT_MAX_OUTPUT_BYTES,
  DEFAULT_WORK_CONTEXT_TIMEOUT_MS,
  type WorkContextRequest,
  WorkContextService,
} from './work-context';

export const CONTEXT_SCOPE_HISTORY_SCHEMA = 'sem-doc-context-scope-history.v2' as const;
export const CONTEXT_SCOPE_HISTORY_STREAM_SCHEMA = 'sem-doc-context-scope-history-stream.v1' as const;

export interface ContextScopeHistoryRequest {
  readonly repositoryRoot: string;
  readonly from: string;
  readonly to: string;
  readonly entity: string;
  readonly file?: string;
  readonly docsRoot?: string;
  readonly projectId: string;
  readonly contextId?: string;
  readonly kind?: ContextScopeKind;
  readonly label?: string;
  readonly depth?: 1 | 2;
  readonly budget?: number;
  /** Aggregate history budget. `timeoutMs` is retained as its compatibility alias. */
  readonly timeoutMs?: number;
  /** Aggregate history budget. `maxOutputBytes` is retained as its compatibility alias. */
  readonly maxOutputBytes?: number;
  readonly aggregateTimeoutMs?: number;
  readonly aggregateMaxOutputBytes?: number;
  readonly commitTimeoutMs?: number;
  readonly commitMaxOutputBytes?: number;
  readonly noCache?: boolean;
  /** Opt in to SEM's broad include mode and retain only the direct node_modules surface. */
  readonly includeNodeModulesSurface?: boolean;
  readonly engineVersion?: string;
  /** Stable logical owner recorded in aggregate history provenance. */
  readonly executionOwnerId?: string;
  readonly maxCommits?: number;
  readonly firstParent?: boolean;
  readonly maxNodes?: number;
  readonly maxEdges?: number;
  /** Repository-relative or absolute NDJSON output path for memory-bounded collection. */
  readonly outputPath?: string;
}

export interface ContextScopeHistoryBase {
  readonly commit: string;
  readonly scope: ContextScope;
}

export interface ContextScopeHistoryEntry {
  readonly commit: string;
  readonly parent: string;
  readonly subject: string;
  readonly scope: ContextScope;
  readonly diff: ContextScopeDiff;
}

export interface ContextScopeHistoryStorage {
  readonly mode: 'memory' | 'ndjson';
  readonly path?: string;
  readonly entries: number;
}

export interface ContextScopeHistoryReport {
  readonly schemaVersion: typeof CONTEXT_SCOPE_HISTORY_SCHEMA;
  readonly repositoryRoot: string;
  readonly from: string;
  readonly to: string;
  readonly base: ContextScopeHistoryBase;
  readonly entries: readonly ContextScopeHistoryEntry[];
  readonly storage: ContextScopeHistoryStorage;
  readonly summary: {
    readonly commits: number;
    readonly changedCommits: number;
    readonly addedNodes: number;
    readonly removedNodes: number;
  };
  readonly execution: ExecutionProvenance;
}

interface HistoryStreamBaseRecord {
  readonly schemaVersion: typeof CONTEXT_SCOPE_HISTORY_STREAM_SCHEMA;
  readonly recordType: 'base';
  readonly commit: string;
  readonly scope: ContextScope;
}

interface HistoryStreamEntryRecord {
  readonly schemaVersion: typeof CONTEXT_SCOPE_HISTORY_STREAM_SCHEMA;
  readonly recordType: 'entry';
  readonly commit: string;
  readonly parent: string;
  readonly subject: string;
  readonly scope: ContextScope;
  readonly diff: ContextScopeDiff;
}

export type ContextScopeHistoryStreamRecord = HistoryStreamBaseRecord | HistoryStreamEntryRecord;

export interface ContextScopeHistoryServiceOptions {
  readonly git?: GitRuntimeOptions;
  readonly historyReader?: GitHistoryReader;
  readonly worktreeManager?: GitWorktreeManager;
  readonly workContextServiceFactory?: (worktreeRoot: string) => WorkContextService;
}

/** Materializes one operational scope per commit and computes adjacent diffs. */
export class ContextScopeHistoryService {
  private readonly options: ContextScopeHistoryServiceOptions;

  public constructor(options: ContextScopeHistoryServiceOptions = {}) {
    this.options = options;
  }

  public async analyze(request: ContextScopeHistoryRequest): Promise<ContextScopeHistoryReport> {
    const startedAt = Date.now();
    const repositoryRoot = realpathSync(request.repositoryRoot);
    const historyReader = this.options.historyReader ?? new GitHistoryReader(this.options.git);
    const manager = this.options.worktreeManager
      ?? new GitWorktreeManager(repositoryRoot, this.options.git);
    const aggregateBudget = createSemExecutionBudget({
      timeoutMs: request.aggregateTimeoutMs
        ?? request.timeoutMs
        ?? DEFAULT_WORK_CONTEXT_TIMEOUT_MS,
      maxOutputBytes: request.aggregateMaxOutputBytes
        ?? request.maxOutputBytes
        ?? DEFAULT_WORK_CONTEXT_MAX_OUTPUT_BYTES,
    });
    const commitTimeoutMs = request.commitTimeoutMs
      ?? request.timeoutMs
      ?? DEFAULT_WORK_CONTEXT_TIMEOUT_MS;
    const commitMaxOutputBytes = request.commitMaxOutputBytes
      ?? request.maxOutputBytes
      ?? DEFAULT_WORK_CONTEXT_MAX_OUTPUT_BYTES;
    const outputPath = request.outputPath === undefined
      ? undefined
      : resolveHistoryOutputPath(repositoryRoot, request.outputPath);
    if (outputPath !== undefined) writeFileSync(outputPath, '', 'utf8');

    const baseCommit = manager.resolveCommit(request.from);
    const base = await manager.withCommit(baseCommit, async (worktreeRoot) => ({
      commit: baseCommit,
      scope: await this.analyzeScopeAtCommit(
        request,
        worktreeRoot,
        aggregateBudget,
        commitTimeoutMs,
        commitMaxOutputBytes,
        baseCommit,
        repositoryRoot,
      ),
    }));
    if (outputPath !== undefined) {
      appendHistoryRecord(outputPath, {
        schemaVersion: CONTEXT_SCOPE_HISTORY_STREAM_SCHEMA,
        recordType: 'base',
        commit: base.commit,
        scope: base.scope,
      });
    }

    const range: GitHistoryRangeOptions = {
      repositoryRoot,
      from: request.from,
      to: request.to,
      ...(request.firstParent === undefined ? {} : { firstParent: request.firstParent }),
      ...(request.maxCommits === undefined ? {} : { maxCommits: request.maxCommits }),
    };
    const commits = historyReader.listRange(range);
    let previousScope = base.scope;
    let changedCommits = 0;
    let addedNodes = 0;
    let removedNodes = 0;
    const collectedEntries: ContextScopeHistoryEntry[] = [];
    // Keep only scalar accounting for NDJSON output. The serialized scope and diff
    // are deliberately not retained after appendHistoryRecord() so a long history
    // does not silently become an in-memory snapshot collection.
    let streamedEntries = 0;
    await manager.withCommitRange(commits, async (commit, worktreeRoot) => {
      const scope = await this.analyzeScopeAtCommit(
        request,
        worktreeRoot,
        aggregateBudget,
        commitTimeoutMs,
        commitMaxOutputBytes,
        commit.commit,
        repositoryRoot,
      );
      const diff = diffContextScopes(previousScope, scope);
      previousScope = scope;
      if (hasChanges(diff)) changedCommits += 1;
      addedNodes += diff.summary.addedNodes;
      removedNodes += diff.summary.removedNodes;
      const entry: ContextScopeHistoryEntry = {
        commit: commit.commit,
        parent: commit.parent,
        subject: commit.subject,
        scope,
        diff,
      };
      if (outputPath === undefined) {
        collectedEntries.push(entry);
        return entry;
      }
      const streamEntry: HistoryStreamEntryRecord = {
        schemaVersion: CONTEXT_SCOPE_HISTORY_STREAM_SCHEMA,
        recordType: 'entry',
        commit: entry.commit,
        parent: entry.parent,
        subject: entry.subject,
        scope: entry.scope,
        diff: entry.diff,
      };
      appendHistoryRecord(outputPath, streamEntry);
      streamedEntries += 1;
      return {
        commit: entry.commit,
        parent: entry.parent,
        subject: entry.subject,
        diff: entry.diff,
      };
    }, request.maxCommits);
    return {
      schemaVersion: CONTEXT_SCOPE_HISTORY_SCHEMA,
      repositoryRoot,
      from: request.from,
      to: request.to,
      base,
      entries: outputPath === undefined ? collectedEntries : [],
      storage: outputPath === undefined
        ? { mode: 'memory', entries: collectedEntries.length }
        : {
          mode: 'ndjson',
          path: path.relative(repositoryRoot, outputPath).split(path.sep).join('/'),
          entries: streamedEntries,
        },
      summary: {
        commits: commits.length,
        changedCommits,
        addedNodes,
        removedNodes,
      },
      execution: {
        ...createExecutionProvenance({
          phase: 'context-scope-history',
          ownerId: request.executionOwnerId ?? 'sem-doc-history',
          state: 'completed',
          timeoutMs: aggregateBudget.timeoutMs,
          maxOutputBytes: aggregateBudget.maxOutputBytes,
          usedOutputBytes: aggregateBudget.usedOutputBytes,
          elapsedMs: Math.max(0, Date.now() - startedAt),
        }),
      },
    };
  }

  private async analyzeScopeAtCommit(
    request: ContextScopeHistoryRequest,
    worktreeRoot: string,
    aggregateBudget: SemExecutionBudget,
    commitTimeoutMs: number,
    commitMaxOutputBytes: number,
    commit?: string,
    repositoryRoot?: string,
  ): Promise<ContextScope> {
    const commitBudget = createSemExecutionBudget({
      timeoutMs: commitTimeoutMs,
      maxOutputBytes: commitMaxOutputBytes,
      parent: aggregateBudget,
    });
    const workContextRequest: WorkContextRequest = {
      repositoryRoot: worktreeRoot,
      entity: request.entity,
      ...(request.file === undefined ? {} : { file: request.file }),
      ...(request.docsRoot === undefined ? {} : { docsRoot: request.docsRoot }),
      ...(request.depth === undefined ? {} : { depth: request.depth }),
      ...(request.budget === undefined ? {} : { budget: request.budget }),
      executionBudget: commitBudget,
      ...(request.noCache === undefined ? {} : { noCache: request.noCache }),
      ...(request.includeNodeModulesSurface === undefined
        ? {}
        : { includeNodeModulesSurface: request.includeNodeModulesSurface }),
      ...(request.engineVersion === undefined ? {} : { engineVersion: request.engineVersion }),
      executionOwnerId: request.executionOwnerId ?? 'sem-doc-history',
    };
    const service = this.options.workContextServiceFactory?.(worktreeRoot)
      ?? new WorkContextService({ client: new SemClient() });
    const report = service.analyze(workContextRequest);
    const scope = createContextScope(report, historyScopeOptions(request));
    return commit === undefined || repositoryRoot === undefined
      ? scope
      : normalizeHistoricalScope(scope, repositoryRoot, commit);
  }
}

export function readContextScopeHistoryStream(
  filePath: string,
): readonly ContextScopeHistoryStreamRecord[] {
  const records = readFileSync(filePath, 'utf8')
    .split(/\r?\n/u)
    .filter((line: string) => line.length > 0)
    .map((line: string) => JSON.parse(line) as unknown);
  const parsedRecords = records.map((record: unknown, index: number) => {
    if (!record || typeof record !== 'object' || Array.isArray(record)) {
      throw new TypeError(`history stream record ${index} must be an object`);
    }
    const value = record as Record<string, unknown>;
    if (value.schemaVersion !== CONTEXT_SCOPE_HISTORY_STREAM_SCHEMA) {
      throw new TypeError(`history stream record ${index} has an invalid schemaVersion`);
    }
    if (value.recordType !== 'base' && value.recordType !== 'entry') {
      throw new TypeError(`history stream record ${index} has an invalid recordType`);
    }
    parseContextScope(value.scope);
    if (value.recordType === 'entry'
      && (!('parent' in value) || !('subject' in value) || !('diff' in value))) {
      throw new TypeError(`history stream entry ${index} is incomplete`);
    }
    return record as ContextScopeHistoryStreamRecord;
  });
  if (parsedRecords.length === 0 || parsedRecords[0]?.recordType !== 'base') {
    throw new TypeError('history stream must start with one base record');
  }
  const commits = new Set<string>();
  for (const [index, record] of parsedRecords.entries()) {
    if (commits.has(record.commit)) {
      throw new TypeError(`history stream record ${index} duplicates commit ${record.commit}`);
    }
    commits.add(record.commit);
    if (index > 0 && record.recordType === 'base') {
      throw new TypeError('history stream may contain only one base record');
    }
  }
  return parsedRecords;
}

export function renderContextScopeHistoryText(report: ContextScopeHistoryReport): string {
  return `${[
    `Context Scope History: ${report.repositoryRoot}`,
    `Range: ${report.from}..${report.to}`,
    `Commits: ${report.summary.commits} | Changed: ${report.summary.changedCommits}`,
    `Storage: ${report.storage.mode}${report.storage.path === undefined ? '' : ` (${report.storage.path})`}`,
    ...report.entries.map((entry) => {
      const diff = entry.diff;
      return `  ${entry.commit.slice(0, 12)} ${entry.subject}${diff === undefined ? '' : ` (+${diff.summary.addedNodes}/-${diff.summary.removedNodes} nodes)`}`;
    }),
  ].join('\n')}\n`;
}

function historyScopeOptions(request: ContextScopeHistoryRequest): ContextScopeOptions {
  return {
    projectId: request.projectId,
    ...(request.contextId === undefined ? {} : { contextId: request.contextId }),
    ...(request.kind === undefined ? {} : { kind: request.kind }),
    ...(request.label === undefined ? {} : { label: request.label }),
    ...(request.maxNodes === undefined ? {} : { maxNodes: request.maxNodes }),
    ...(request.maxEdges === undefined ? {} : { maxEdges: request.maxEdges }),
  };
}

function normalizeHistoricalScope(scope: ContextScope, repositoryRoot: string, commit: string): ContextScope {
  return {
    ...scope,
    source: {
      ...scope.source,
      repositoryRoot,
      revision: {
        ...scope.source.revision,
        repositoryRoot,
        gitHead: commit,
      },
      ...(scope.source.workContexts === undefined ? {} : {
        workContexts: scope.source.workContexts.map((source) => ({
          ...source,
          repositoryRoot,
          revision: { ...source.revision, repositoryRoot, gitHead: commit },
        })),
      }),
    },
  };
}

function resolveHistoryOutputPath(repositoryRoot: string, value: string): string {
  const rawCandidate = path.isAbsolute(value)
    ? path.resolve(value)
    : path.resolve(repositoryRoot, value);
  const candidate = path.join(
    realpathSync(path.dirname(rawCandidate)),
    path.basename(rawCandidate),
  );
  const relative = path.relative(repositoryRoot, candidate);
  if (relative.length === 0 || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new TypeError('history outputPath must remain inside the repository');
  }
  if (existsSync(candidate)) {
    const target = realpathSync(candidate);
    const targetRelative = path.relative(repositoryRoot, target);
    if (targetRelative.startsWith('..') || path.isAbsolute(targetRelative)) {
      throw new TypeError('history outputPath symlink target must remain inside the repository');
    }
  }
  return candidate;
}

function appendHistoryRecord(filePath: string, record: ContextScopeHistoryStreamRecord): void {
  appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8');
}

function hasChanges(diff: ContextScopeDiff): boolean {
  return diff.summary.addedNodes > 0 || diff.summary.removedNodes > 0
    || diff.summary.addedEdges > 0 || diff.summary.removedEdges > 0
    || diff.summary.addedGroups > 0 || diff.summary.removedGroups > 0
    || diff.summary.changedGroups > 0;
}
