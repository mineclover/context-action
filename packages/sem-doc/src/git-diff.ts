import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import * as path from 'node:path';

import {
  createRepositoryRevisionReader,
  type RepositoryRevision,
  type RepositoryRevisionReaderLike,
  sameRepositoryRevision,
} from './revision';

export const GIT_DIFF_SCHEMA = 'sem-doc-git-diff.v1' as const;
export const DEFAULT_GIT_DIFF_MAX_BUFFER_BYTES = 64 * 1024 * 1024;
export const MAX_GIT_DIFF_BUFFER_BYTES = 1024 * 1024 * 1024;
export const MAX_GIT_DIFF_CONTEXT_LINES = 4096;
export const MAX_GIT_DIFF_PATHS = 4096;
export const MAX_GIT_DIFF_PATH_CHARS = 4096;
export const MAX_GIT_DIFF_EXACT_LINES = 20_000;

export type GitDiffChange =
  | 'added'
  | 'modified'
  | 'deleted'
  | 'renamed'
  | 'copied'
  | 'type-changed'
  | 'unmerged'
  | 'untracked';

export type GitDiffLineKind = 'context' | 'added' | 'deleted';

export interface GitDiffLine {
  readonly kind: GitDiffLineKind;
  readonly content: string;
  readonly oldLine?: number;
  readonly newLine?: number;
}

export interface GitDiffHunk {
  readonly oldStartLine: number;
  readonly oldLineCount: number;
  readonly newStartLine: number;
  readonly newLineCount: number;
  readonly lines: readonly GitDiffLine[];
}

export interface GitDiffFile {
  readonly path: string;
  readonly previousPath?: string;
  readonly change: GitDiffChange;
  readonly binary: boolean;
  readonly precision: 'exact' | 'coarse' | 'binary';
  readonly additions: number;
  readonly deletions: number;
  readonly hunks: readonly GitDiffHunk[];
}

export interface GitDiffSummary {
  readonly files: number;
  readonly additions: number;
  readonly deletions: number;
  readonly binaryFiles: number;
  readonly coarseFiles: number;
  readonly added: number;
  readonly modified: number;
  readonly deleted: number;
  readonly renamed: number;
  readonly copied: number;
  readonly unmerged: number;
  readonly untracked: number;
}

export interface GitDiffRequest {
  readonly repositoryRoot: string;
  readonly paths?: readonly string[];
  /** Compare HEAD with the index instead of HEAD with the working tree. */
  readonly staged?: boolean;
  /** Include untracked files in a working-tree diff. Defaults to true. */
  readonly includeUntracked?: boolean;
  /** Number of unchanged lines to retain around each hunk. Defaults to 3. */
  readonly contextLines?: number;
}

export interface GitDiffReport {
  readonly schemaVersion: typeof GIT_DIFF_SCHEMA;
  readonly source: 'git';
  readonly repositoryRoot: string;
  readonly base: 'HEAD';
  readonly scope: 'working-tree' | 'staged';
  readonly includeUntracked: boolean;
  readonly contextLines: number;
  readonly revision: RepositoryRevision;
  readonly files: readonly GitDiffFile[];
  readonly summary: GitDiffSummary;
}

export interface GitDiffServiceOptions {
  readonly gitBinary?: string;
  readonly maxBufferBytes?: number;
  readonly revisionReader?: RepositoryRevisionReaderLike;
}

interface GitStatusRecord {
  readonly status: string;
  readonly path: string;
  readonly previousPath?: string;
}

interface DiffOperation {
  readonly kind: 'equal' | 'added' | 'deleted';
  readonly oldIndex?: number;
  readonly newIndex?: number;
}

interface AnnotatedDiffLine {
  readonly kind: GitDiffLineKind;
  readonly content: string;
  readonly oldLine?: number;
  readonly newLine?: number;
}

/** Raised when Git cannot provide a trustworthy diff. */
export class GitDiffError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'GitDiffError';
  }
}

/** Produces a revision-pinned, Git-based diff without delegating diff semantics to sem. */
export class GitDiffService {
  private readonly gitBinary: string;
  private readonly maxBufferBytes: number;
  private readonly revisionReader: RepositoryRevisionReaderLike;

  public constructor(options: GitDiffServiceOptions = {}) {
    const gitBinary = options.gitBinary ?? 'git';
    if (typeof gitBinary !== 'string' || gitBinary.trim().length === 0) {
      throw new GitDiffError('gitBinary must be non-empty text');
    }
    this.gitBinary = gitBinary.trim();
    this.maxBufferBytes = boundedPositiveInteger(
      options.maxBufferBytes ?? DEFAULT_GIT_DIFF_MAX_BUFFER_BYTES,
      'maxBufferBytes',
      MAX_GIT_DIFF_BUFFER_BYTES,
    );
    this.revisionReader = options.revisionReader ?? createRepositoryRevisionReader(this.gitBinary);
  }

  public analyze(request: GitDiffRequest): GitDiffReport {
    const staged = request.staged === true;
    const includeUntracked = request.includeUntracked ?? !staged;
    const contextLines = request.contextLines ?? 3;
    if (
      !Number.isSafeInteger(contextLines)
      || contextLines < 0
      || contextLines > MAX_GIT_DIFF_CONTEXT_LINES
    ) {
      throw new GitDiffError(
        `contextLines must be an integer between 0 and ${MAX_GIT_DIFF_CONTEXT_LINES}`,
      );
    }

    if (request.paths !== undefined && !Array.isArray(request.paths)) {
      throw new GitDiffError('paths must be an array');
    }
    if (request.paths !== undefined && request.paths.length > MAX_GIT_DIFF_PATHS) {
      throw new GitDiffError(`paths exceeds ${MAX_GIT_DIFF_PATHS} items`);
    }
    const initialRevision = this.revisionReader.read(path.resolve(request.repositoryRoot));
    const repositoryRoot = initialRevision.repositoryRoot;
    const paths = normalizePaths(repositoryRoot, request.paths ?? []);
    const statuses = this.readTrackedStatuses(repositoryRoot, staged, paths, initialRevision.gitHead);
    const untracked = includeUntracked
      ? this.readUntrackedPaths(repositoryRoot, paths).map((filePath) => ({
          status: '??',
          path: filePath,
        }))
      : [];
    const files = [...statuses, ...untracked].map((status) =>
      this.buildFile(repositoryRoot, status, staged, contextLines, initialRevision.gitHead)
    );
    const finalRevision = this.revisionReader.read(repositoryRoot);
    if (!sameRepositoryRevision(initialRevision, finalRevision)) {
      throw new GitDiffError(
        `Repository changed while Git diff was running: ${initialRevision.workingTreeDigest} -> ${finalRevision.workingTreeDigest}`
      );
    }

    return {
      schemaVersion: GIT_DIFF_SCHEMA,
      source: 'git',
      repositoryRoot,
      base: 'HEAD',
      scope: staged ? 'staged' : 'working-tree',
      includeUntracked,
      contextLines,
      revision: finalRevision,
      files,
      summary: summarize(files),
    };
  }

  private readTrackedStatuses(
    repositoryRoot: string,
    staged: boolean,
    paths: readonly string[],
    gitHead: string,
  ): readonly GitStatusRecord[] {
    const baseArgs = ['diff', '--name-status', '-z', '--find-renames'];
    const outputs = gitHead === 'UNBORN'
      ? staged
        ? [this.runGit([...baseArgs, '--cached', '--', ...paths], repositoryRoot)]
        : [
          // An unborn repository has no HEAD to diff against.  The index and
          // worktree are separate sources, so merge both views and let the
          // worktree view win when a path appears in both.
          this.runGit([...baseArgs, '--cached', '--', ...paths], repositoryRoot),
          this.runGit([...baseArgs, '--', ...paths], repositoryRoot),
        ]
      : [
        this.runGit([
          ...baseArgs,
          ...(staged ? ['--cached'] : []),
          'HEAD',
          '--',
          ...paths,
        ], repositoryRoot),
      ];
    const parsed = outputs.flatMap((output) => this.parseTrackedStatusOutput(output));
    const byPath = new Map<string, GitStatusRecord>();
    for (const record of parsed) byPath.set(record.path, record);
    return [...byPath.values()];
  }

  private parseTrackedStatusOutput(output: Buffer): readonly GitStatusRecord[] {
    const fields = output.toString('utf8').split('\0');
    const records: GitStatusRecord[] = [];
    for (let index = 0; index < fields.length; ) {
      const status = fields[index++];
      if (!status) continue;
      const previousPath =
        status.startsWith('R') || status.startsWith('C') ? fields[index++] : undefined;
      const filePath = fields[index++];
      if (!filePath) throw new GitDiffError(`Git returned an incomplete diff record for ${status}`);
      records.push({
        status,
        path: filePath,
        ...(previousPath === undefined ? {} : { previousPath }),
      });
    }
    return records;
  }

  private readUntrackedPaths(repositoryRoot: string, paths: readonly string[]): readonly string[] {
    const output = this.runGit(
      ['ls-files', '--others', '--exclude-standard', '-z', '--', ...paths],
      repositoryRoot
    );
    return output
      .toString('utf8')
      .split('\0')
      .filter((filePath) => filePath.length > 0)
      .filter((filePath) => matchesRequestedPath(filePath, paths));
  }

  private buildFile(
    repositoryRoot: string,
    status: GitStatusRecord,
    staged: boolean,
    contextLines: number,
    gitHead: string,
  ): GitDiffFile {
    const change = changeForStatus(status.status);
    const oldPath = status.previousPath ?? status.path;
    const oldContent =
      gitHead === 'UNBORN' || change === 'added' || change === 'untracked'
        ? Buffer.alloc(0)
        : this.readGitContent(repositoryRoot, `HEAD:${oldPath}`);
    const newContent =
      change === 'deleted'
        ? Buffer.alloc(0)
        : staged
          ? this.readGitContent(repositoryRoot, `:${status.path}`)
          : this.readWorkingTreeContent(repositoryRoot, status.path);
    const binary = isBinary(oldContent) || isBinary(newContent);
    if (binary) {
      return {
        path: status.path,
        ...(status.previousPath === undefined ? {} : { previousPath: status.previousPath }),
        change,
        binary: true,
        precision: 'binary',
        additions: 0,
        deletions: 0,
        hunks: [],
      };
    }

    const oldLines = splitLines(oldContent.toString('utf8'));
    const newLines = splitLines(newContent.toString('utf8'));
    const exact = oldLines.length + newLines.length <= MAX_GIT_DIFF_EXACT_LINES;
    const operations = exact ? diffLines(oldLines, newLines) : coarseDiff(oldLines, newLines);
    const hunks = createHunks(operations, oldLines, newLines, contextLines);
    const additions = operations.filter((operation) => operation.kind === 'added').length;
    const deletions = operations.filter((operation) => operation.kind === 'deleted').length;
    return {
      path: status.path,
      ...(status.previousPath === undefined ? {} : { previousPath: status.previousPath }),
      change,
      binary: false,
      precision: exact ? 'exact' : 'coarse',
      additions,
      deletions,
      hunks,
    };
  }

  private readWorkingTreeContent(repositoryRoot: string, filePath: string): Buffer {
    const absolutePath = path.resolve(repositoryRoot, filePath);
    if (!isWithinRoot(repositoryRoot, absolutePath) || !existsSync(absolutePath)) {
      return Buffer.alloc(0);
    }
    try {
      const canonicalPath = realpathSync(absolutePath);
      if (!isWithinRoot(repositoryRoot, canonicalPath)) {
        throw new GitDiffError(
          `working-tree path escapes the repository through a symlink: ${filePath}`
        );
      }
      return readFileSync(canonicalPath);
    } catch (error) {
      if (error instanceof GitDiffError) throw error;
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        return Buffer.alloc(0);
      }
      throw new GitDiffError(
        `Failed to read working-tree path ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private readGitContent(repositoryRoot: string, revisionPath: string): Buffer {
    const result = spawnSync(this.gitBinary, ['show', revisionPath], {
      cwd: repositoryRoot,
      encoding: 'buffer',
      maxBuffer: this.maxBufferBytes,
    });
    if (result.error) {
      throw new GitDiffError(`Failed to read Git content: ${result.error.message}`);
    }
    if (result.status !== 0) {
      const detail = (result.stderr ?? Buffer.alloc(0)).toString('utf8').trim();
      throw new GitDiffError(
        `Git show failed for ${revisionPath}: ${detail || `exit ${String(result.status)}`}`,
      );
    }
    return result.stdout ?? Buffer.alloc(0);
  }

  private runGit(args: readonly string[], repositoryRoot: string): Buffer {
    const result = spawnSync(this.gitBinary, [...args], {
      cwd: repositoryRoot,
      encoding: 'buffer',
      maxBuffer: this.maxBufferBytes,
    });
    if (result.error) throw new GitDiffError(`Failed to execute Git: ${result.error.message}`);
    if (result.status !== 0) {
      const detail = (result.stderr ?? Buffer.alloc(0)).toString('utf8').trim();
      throw new GitDiffError(`Git diff failed: ${detail || `exit ${String(result.status)}`}`);
    }
    return result.stdout ?? Buffer.alloc(0);
  }
}

export function renderGitDiffText(report: GitDiffReport): string {
  const lines = [
    `Git Diff: ${report.repositoryRoot}`,
    `Revision: ${report.revision.gitHead} / ${report.revision.workingTreeDigest.slice(0, 12)}`,
    `Files: ${report.summary.files} (+${report.summary.additions} -${report.summary.deletions})`,
    '',
  ];
  for (const file of report.files) {
    const label =
      file.previousPath === undefined ? file.path : `${file.previousPath} -> ${file.path}`;
    lines.push(`${file.change}: ${label} (+${file.additions} -${file.deletions})`);
    if (file.binary) {
      lines.push('  Binary file');
      continue;
    }
    for (const hunk of file.hunks) {
      lines.push(
        `@@ -${formatRange(hunk.oldStartLine, hunk.oldLineCount)} +${formatRange(hunk.newStartLine, hunk.newLineCount)} @@`
      );
      for (const diffLine of hunk.lines) {
        const prefix = diffLine.kind === 'added' ? '+' : diffLine.kind === 'deleted' ? '-' : ' ';
        lines.push(`${prefix}${diffLine.content}`);
      }
    }
  }
  return `${lines.join('\n')}\n`;
}

function changeForStatus(status: string): GitDiffChange {
  if (status === '??') return 'untracked';
  switch (status[0]) {
    case 'A':
      return 'added';
    case 'D':
      return 'deleted';
    case 'R':
      return 'renamed';
    case 'C':
      return 'copied';
    case 'T':
      return 'type-changed';
    case 'U':
      return 'unmerged';
    default:
      return 'modified';
  }
}

function normalizePaths(root: string, paths: readonly string[]): readonly string[] {
  if (paths.length > MAX_GIT_DIFF_PATHS) {
    throw new GitDiffError(`paths exceeds ${MAX_GIT_DIFF_PATHS} items`);
  }
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const value of paths) {
    if (
      typeof value !== 'string'
      || value.includes('\0')
      || value.length > MAX_GIT_DIFF_PATH_CHARS
    ) {
      throw new GitDiffError(
        `Diff path must be text within ${MAX_GIT_DIFF_PATH_CHARS} characters`,
      );
    }
    if (value === '.') continue;
    const absolute = path.resolve(root, value);
    if (!isWithinRoot(root, absolute) || absolute === root) {
      throw new GitDiffError(`Diff path must be inside the repository root: ${value}`);
    }
    const relative = path.relative(root, absolute).split(path.sep).join('/');
    if (relative.length > 0 && !seen.has(relative)) {
      seen.add(relative);
      normalized.push(relative);
    }
  }
  return normalized;
}

function boundedPositiveInteger(value: number, label: string, maximum: number): number {
  if (!Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new GitDiffError(`${label} must be a safe integer between 1 and ${maximum}`);
  }
  return value;
}

function matchesRequestedPath(filePath: string, paths: readonly string[]): boolean {
  return (
    paths.length === 0 ||
    paths.some((requested) => filePath === requested || filePath.startsWith(`${requested}/`))
  );
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function isBinary(content: Buffer): boolean {
  return content.includes(0);
}

function splitLines(content: string): readonly string[] {
  if (content.length === 0) return [];
  const lines = content.split('\n').map((line) => (line.endsWith('\r') ? line.slice(0, -1) : line));
  if (content.endsWith('\n')) lines.pop();
  return lines;
}

function diffLines(
  oldLines: readonly string[],
  newLines: readonly string[]
): readonly DiffOperation[] {
  const max = oldLines.length + newLines.length;
  const trace: Array<Map<number, number>> = [];
  const frontier = new Map<number, number>([[1, 0]]);
  for (let distance = 0; distance <= max; distance += 1) {
    trace.push(new Map(frontier));
    for (let diagonal = -distance; diagonal <= distance; diagonal += 2) {
      const down = frontier.get(diagonal + 1) ?? 0;
      const right = (frontier.get(diagonal - 1) ?? 0) + 1;
      let oldIndex =
        diagonal === -distance || (diagonal !== distance && down > right) ? down : right;
      let newIndex = oldIndex - diagonal;
      while (
        oldIndex < oldLines.length &&
        newIndex < newLines.length &&
        oldLines[oldIndex] === newLines[newIndex]
      ) {
        oldIndex += 1;
        newIndex += 1;
      }
      frontier.set(diagonal, oldIndex);
      if (oldIndex >= oldLines.length && newIndex >= newLines.length) {
        return backtrack(trace, oldLines.length, newLines.length);
      }
    }
  }
  throw new GitDiffError('Git diff algorithm did not converge');
}

function backtrack(
  trace: readonly Map<number, number>[],
  oldLength: number,
  newLength: number
): readonly DiffOperation[] {
  const operations: DiffOperation[] = [];
  let oldIndex = oldLength;
  let newIndex = newLength;
  for (let distance = trace.length - 1; distance > 0; distance -= 1) {
    const frontier = trace[distance] ?? new Map<number, number>();
    const diagonal = oldIndex - newIndex;
    const down = frontier.get(diagonal + 1) ?? 0;
    const right = frontier.get(diagonal - 1) ?? 0;
    const previousDiagonal =
      diagonal === -distance || (diagonal !== distance && down > right)
        ? diagonal + 1
        : diagonal - 1;
    const previousOldIndex = frontier.get(previousDiagonal) ?? 0;
    const previousNewIndex = previousOldIndex - previousDiagonal;
    while (oldIndex > previousOldIndex && newIndex > previousNewIndex) {
      oldIndex -= 1;
      newIndex -= 1;
      operations.push({ kind: 'equal', oldIndex, newIndex });
    }
    if (oldIndex === previousOldIndex) {
      newIndex -= 1;
      operations.push({ kind: 'added', newIndex });
    } else {
      oldIndex -= 1;
      operations.push({ kind: 'deleted', oldIndex });
    }
  }
  while (oldIndex > 0 && newIndex > 0) {
    oldIndex -= 1;
    newIndex -= 1;
    operations.push({ kind: 'equal', oldIndex, newIndex });
  }
  while (oldIndex > 0) {
    oldIndex -= 1;
    operations.push({ kind: 'deleted', oldIndex });
  }
  while (newIndex > 0) {
    newIndex -= 1;
    operations.push({ kind: 'added', newIndex });
  }
  return operations.reverse();
}

function coarseDiff(
  oldLines: readonly string[],
  newLines: readonly string[]
): readonly DiffOperation[] {
  let prefix = 0;
  while (
    prefix < oldLines.length &&
    prefix < newLines.length &&
    oldLines[prefix] === newLines[prefix]
  ) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < oldLines.length - prefix &&
    suffix < newLines.length - prefix &&
    oldLines[oldLines.length - suffix - 1] === newLines[newLines.length - suffix - 1]
  ) {
    suffix += 1;
  }
  const operations: DiffOperation[] = [];
  for (let index = 0; index < prefix; index += 1)
    operations.push({ kind: 'equal', oldIndex: index, newIndex: index });
  for (let index = prefix; index < oldLines.length - suffix; index += 1)
    operations.push({ kind: 'deleted', oldIndex: index });
  for (let index = prefix; index < newLines.length - suffix; index += 1)
    operations.push({ kind: 'added', newIndex: index });
  for (let offset = suffix; offset > 0; offset -= 1) {
    const oldIndex = oldLines.length - offset;
    const newIndex = newLines.length - offset;
    operations.push({ kind: 'equal', oldIndex, newIndex });
  }
  return operations;
}

function createHunks(
  operations: readonly DiffOperation[],
  oldLines: readonly string[],
  newLines: readonly string[],
  contextLines: number
): readonly GitDiffHunk[] {
  const annotated = operations.map((operation) => {
    if (operation.kind === 'equal') {
      return {
        kind: 'context',
        content: oldLines[operation.oldIndex ?? 0] ?? '',
        oldLine: (operation.oldIndex ?? 0) + 1,
        newLine: (operation.newIndex ?? 0) + 1,
      } satisfies AnnotatedDiffLine;
    }
    if (operation.kind === 'deleted') {
      return {
        kind: 'deleted',
        content: oldLines[operation.oldIndex ?? 0] ?? '',
        oldLine: (operation.oldIndex ?? 0) + 1,
      } satisfies AnnotatedDiffLine;
    }
    return {
      kind: 'added',
      content: newLines[operation.newIndex ?? 0] ?? '',
      newLine: (operation.newIndex ?? 0) + 1,
    } satisfies AnnotatedDiffLine;
  });
  const changed = annotated
    .map((line, index) => (line.kind === 'context' ? -1 : index))
    .filter((index) => index >= 0);
  const hunks: GitDiffHunk[] = [];
  for (let index = 0; index < changed.length; ) {
    const firstChange = changed[index] ?? 0;
    let lastChange = firstChange;
    index += 1;
    while (index < changed.length && (changed[index] ?? 0) <= lastChange + contextLines * 2 + 1) {
      lastChange = changed[index] ?? lastChange;
      index += 1;
    }
    const start = Math.max(0, firstChange - contextLines);
    const end = Math.min(annotated.length, lastChange + contextLines + 1);
    const lines = annotated.slice(start, end);
    const oldStartLine = countOldLines(annotated, start) + 1;
    const newStartLine = countNewLines(annotated, start) + 1;
    hunks.push({
      oldStartLine,
      oldLineCount: lines.filter((line) => line.oldLine !== undefined).length,
      newStartLine,
      newLineCount: lines.filter((line) => line.newLine !== undefined).length,
      lines,
    });
  }
  return hunks;
}

function countOldLines(lines: readonly AnnotatedDiffLine[], end: number): number {
  return lines.slice(0, end).filter((line) => line.oldLine !== undefined).length;
}

function countNewLines(lines: readonly AnnotatedDiffLine[], end: number): number {
  return lines.slice(0, end).filter((line) => line.newLine !== undefined).length;
}

function formatRange(start: number, count: number): string {
  return count === 1 ? String(start) : `${start},${count}`;
}

function summarize(files: readonly GitDiffFile[]): GitDiffSummary {
  const summary: GitDiffSummary = {
    files: files.length,
    additions: files.reduce((total, file) => total + file.additions, 0),
    deletions: files.reduce((total, file) => total + file.deletions, 0),
    binaryFiles: files.filter((file) => file.binary).length,
    coarseFiles: files.filter((file) => file.precision === 'coarse').length,
    added: files.filter((file) => file.change === 'added').length,
    modified: files.filter((file) => file.change === 'modified').length,
    deleted: files.filter((file) => file.change === 'deleted').length,
    renamed: files.filter((file) => file.change === 'renamed').length,
    copied: files.filter((file) => file.change === 'copied').length,
    unmerged: files.filter((file) => file.change === 'unmerged').length,
    untracked: files.filter((file) => file.change === 'untracked').length,
  };
  return summary;
}
