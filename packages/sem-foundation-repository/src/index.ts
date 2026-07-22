import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  type AnalysisProject,
  type GitCommitRecord,
  normalizeAnalysisProjects,
  type RepositoryRevision,
  type SemFoundationLimitOptions,
} from '@context-action/sem-foundation-contracts';

export const DEFAULT_GIT_MAX_BUFFER_BYTES = 16 * 1024 * 1024;
export const MAX_GIT_HISTORY_COMMITS = 512;

export { MAX_ANALYSIS_PROJECTS } from '@context-action/sem-foundation-contracts';

export interface GitRuntimeOptions {
  readonly gitBinary?: string;
  readonly maxBufferBytes?: number;
}

export class RepositoryCommandError extends Error {
  public constructor(
    message: string,
    public readonly command: readonly string[],
    public readonly cwd: string,
    public readonly status?: number | null,
    public readonly stderr?: string,
  ) {
    super(message);
    this.name = 'RepositoryCommandError';
  }
}

export class RepositoryStateError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'RepositoryStateError';
  }
}

export class RepositoryRevisionReader {
  private readonly gitBinary: string;
  private readonly maxBufferBytes: number;

  public constructor(options: GitRuntimeOptions | string = {}) {
    const normalized = typeof options === 'string' ? { gitBinary: options } : options;
    this.gitBinary = nonEmptyText(normalized.gitBinary ?? 'git', 'gitBinary');
    this.maxBufferBytes = positiveInteger(
      normalized.maxBufferBytes ?? DEFAULT_GIT_MAX_BUFFER_BYTES,
      'maxBufferBytes',
    );
  }

  public read(cwd: string): RepositoryRevision {
    const root = this.resolveRepositoryRoot(cwd);
    let gitHead = 'UNBORN';
    try {
      gitHead = this.execute(['rev-parse', 'HEAD'], root).trim() || 'UNBORN';
    } catch (error) {
      if (!isUnbornHeadError(error)) throw error;
    }
    const trackedDiff = gitHead === 'UNBORN'
      ? [
        this.execute(['diff', '--no-ext-diff', '--binary', '--cached', '--'], root),
        this.execute(['diff', '--no-ext-diff', '--binary', '--'], root),
      ].join('\0')
      : this.execute(['diff', '--no-ext-diff', '--binary', 'HEAD', '--'], root);
    const untracked = this.execute(['ls-files', '--others', '--exclude-standard', '-z'], root);
    const digest = createHash('sha256');
    digest.update(trackedDiff);
    for (const relativePath of untracked.split('\0').filter(Boolean).sort()) {
      const absolutePath = path.resolve(root, relativePath);
      if (!isWithinRoot(root, absolutePath)) continue;
      digest.update(relativePath);
      digest.update('\0');
      try {
        const canonicalPath = realpathSync(absolutePath);
        if (!isWithinRoot(root, canonicalPath)) {
          throw new RepositoryStateError(
            `untracked path escapes the repository through a symlink: ${relativePath}`,
          );
        }
        digest.update(readFileSync(canonicalPath));
      } catch (error) {
        if (error instanceof RepositoryStateError) throw error;
        digest.update('<unreadable>');
      }
    }
    return { repositoryRoot: root, gitHead, workingTreeDigest: digest.digest('hex') };
  }

  /** Resolves the Git root without inspecting the current worktree contents. */
  public resolveRepositoryRoot(cwd: string): string {
    const repositoryRoot = this.runGit(['rev-parse', '--show-toplevel'], cwd).trim();
    if (repositoryRoot.length === 0) throw new RepositoryStateError(`Not a Git repository: ${cwd}`);
    return canonicalDirectory(repositoryRoot, 'Git repository root');
  }

  private runGit(args: readonly string[], cwd: string): string {
    let output: string;
    try {
      output = this.execute(args, cwd);
    } catch (error) {
      if (args[0] === 'rev-parse') {
        throw new RepositoryStateError(`Git command failed in ${cwd}`);
      }
      throw error;
    }
    if (output.length === 0 && args[0] === 'rev-parse') {
      throw new RepositoryStateError(`Git command failed in ${cwd}`);
    }
    return output;
  }

  private execute(args: readonly string[], cwd: string): string {
    const result = spawnSync(this.gitBinary, [...args], {
      cwd,
      encoding: 'utf8',
      maxBuffer: this.maxBufferBytes,
      windowsHide: true,
    });
    if (result.error) {
      throw new RepositoryCommandError(
        `Failed to execute Git: ${result.error.message}`,
        args,
        cwd,
        result.status,
        result.stderr,
      );
    }
    if (result.status !== 0) {
      throw new RepositoryCommandError(
        `Git command failed with status ${String(result.status)}`,
        args,
        cwd,
        result.status,
        result.stderr,
      );
    }
    return result.stdout ?? '';
  }
}

export function sameRepositoryRevision(
  left: RepositoryRevision,
  right: RepositoryRevision,
): boolean {
  return (
    left.repositoryRoot === right.repositoryRoot
    && left.gitHead === right.gitHead
    && left.workingTreeDigest === right.workingTreeDigest
  );
}

export interface GitHistoryRangeOptions extends GitRuntimeOptions {
  readonly repositoryRoot: string;
  readonly from: string;
  readonly to: string;
  readonly firstParent?: boolean;
  readonly maxCommits?: number;
}

export class GitHistoryReader {
  private readonly gitBinary: string;
  private readonly maxBufferBytes: number;

  public constructor(options: GitRuntimeOptions = {}) {
    this.gitBinary = nonEmptyText(options.gitBinary ?? 'git', 'gitBinary');
    this.maxBufferBytes = positiveInteger(
      options.maxBufferBytes ?? DEFAULT_GIT_MAX_BUFFER_BYTES,
      'maxBufferBytes',
    );
  }

  public listRange(options: GitHistoryRangeOptions): readonly GitCommitRecord[] {
    const repositoryRoot = canonicalDirectory(options.repositoryRoot, 'Git repository root');
    const from = visibleText(options.from, 'Git history from');
    const to = visibleText(options.to, 'Git history to');
    const maxCommits = positiveInteger(options.maxCommits ?? MAX_GIT_HISTORY_COMMITS, 'maxCommits');
    const args = [
      'log',
      ...(options.firstParent === false ? [] : ['--first-parent']),
      '--reverse',
      '--format=%H%x00%P%x00%s%x00',
      `${from}..${to}`,
    ];
    const output = this.execute(args, repositoryRoot);
    const commits: GitCommitRecord[] = [];
    for (const line of output.split('\n').filter((value) => value.length > 0)) {
      const fields = line.split('\0');
      if (fields.length !== 4 || fields[3] !== '') {
        throw new RepositoryStateError('Git history output has an incomplete commit record');
      }
      const commit = gitObjectId(fields[0], `Git history commit ${commits.length}.commit`);
      const parent = gitObjectId(
        fields[1]?.split(' ')[0],
        `Git history commit ${commits.length}.parent`,
      );
      const subject = boundedText(fields[2], `Git history commit ${commits.length}.subject`);
      commits.push({ commit, parent, subject });
      if (commits.length > maxCommits) {
        throw new RepositoryStateError(`Git history exceeds ${maxCommits} commit limit; narrow the range`);
      }
    }
    return commits;
  }

  private execute(args: readonly string[], cwd: string): string {
    const result = spawnSync(this.gitBinary, [...args], {
      cwd,
      encoding: 'utf8',
      maxBuffer: this.maxBufferBytes,
      windowsHide: true,
    });
    if (result.error) {
      throw new RepositoryCommandError(
        `Failed to execute Git history: ${result.error.message}`,
        args,
        cwd,
        result.status,
        result.stderr,
      );
    }
    if (result.status !== 0) {
      throw new RepositoryCommandError(
        `Git history command failed with status ${String(result.status)}`,
        args,
        cwd,
        result.status,
        result.stderr,
      );
    }
    return result.stdout ?? '';
  }
}

export type HistoricalWorktreeCallback<T> = (worktreeRoot: string) => Promise<T> | T;

export class GitWorktreeManager {
  private readonly repositoryRoot: string;
  private readonly gitBinary: string;
  private readonly maxBufferBytes: number;

  public constructor(repositoryRoot: string, options: GitRuntimeOptions = {}) {
    this.repositoryRoot = canonicalDirectory(repositoryRoot, 'Git repository root');
    this.gitBinary = nonEmptyText(options.gitBinary ?? 'git', 'gitBinary');
    this.maxBufferBytes = positiveInteger(
      options.maxBufferBytes ?? DEFAULT_GIT_MAX_BUFFER_BYTES,
      'maxBufferBytes',
    );
  }

  /** Resolves a user-supplied Git ref to a full commit object ID. */
  public resolveCommit(ref: string): string {
    const value = visibleText(ref, 'Git commit ref');
    const args = ['rev-parse', '--verify', `${value}^{commit}`];
    const result = spawnSync(this.gitBinary, args, {
      cwd: this.repositoryRoot,
      encoding: 'utf8',
      maxBuffer: this.maxBufferBytes,
      windowsHide: true,
    });
    if (result.error) {
      throw new RepositoryCommandError(
        `Failed to resolve Git commit ref: ${result.error.message}`,
        args,
        this.repositoryRoot,
        result.status,
        result.stderr,
      );
    }
    if (result.status !== 0) {
      throw new RepositoryCommandError(
        `Git commit ref could not be resolved: ${value}`,
        args,
        this.repositoryRoot,
        result.status,
        result.stderr,
      );
    }
    const resolved = (result.stdout ?? '').trim();
    return gitObjectId(resolved, `Git commit ref ${value}`);
  }

  public async withCommit<T>(commit: string, callback: HistoricalWorktreeCallback<T>): Promise<T> {
    const resolvedCommit = this.resolveCommit(commit);
    const results = await this.withCommitRange([{
      commit: resolvedCommit,
      parent: resolvedCommit,
      subject: 'single-commit',
    }], (_record, worktreeRoot) => callback(worktreeRoot));
    return results[0]!;
  }

  public async withCommitRange<T>(
    commits: readonly GitCommitRecord[],
    callback: (commit: GitCommitRecord, worktreeRoot: string) => Promise<T> | T,
    maxCommits = MAX_GIT_HISTORY_COMMITS,
  ): Promise<readonly T[]> {
    if (commits.length === 0) return [];
    const limit = positiveInteger(maxCommits, 'maxCommits');
    if (commits.length > limit) {
      throw new RepositoryStateError(`worktree range exceeds ${limit} commits`);
    }
    for (const [index, commit] of commits.entries()) {
      gitObjectId(commit.commit, `worktree commit ${index}.commit`);
      gitObjectId(commit.parent, `worktree commit ${index}.parent`);
      boundedText(commit.subject, `worktree commit ${index}.subject`);
    }
    const results: T[] = [];
    for (const commit of commits) {
      const worktreeRoot = mkdtempSync(path.join(os.tmpdir(), 'sem-foundation-worktree-'));
      let attached = false;
      try {
        this.runGit(['worktree', 'add', '--detach', worktreeRoot, commit.commit], this.repositoryRoot);
        attached = true;
        results.push(await callback(commit, worktreeRoot));
      } finally {
        try {
          if (attached) {
            this.runGit(['worktree', 'remove', '--force', worktreeRoot], this.repositoryRoot);
          }
        } finally {
          rmSync(worktreeRoot, { recursive: true, force: true });
        }
      }
    }
    return results;
  }

  private runGit(args: readonly string[], cwd: string): void {
    // Historical worktrees are analysis sandboxes. Do not execute repository
    // hooks while creating or removing them: hooks can mutate the checkout,
    // require unavailable tooling, or perform expensive work unrelated to the
    // requested snapshot. The hook path is disabled at the Git process level
    // rather than relying on a particular hook manager (for example Husky).
    const hooklessArgs = ['-c', `core.hooksPath=${process.platform === 'win32' ? 'NUL' : '/dev/null'}`, ...args];
    const result = spawnSync(this.gitBinary, hooklessArgs, {
      cwd,
      encoding: 'utf8',
      maxBuffer: this.maxBufferBytes,
      windowsHide: true,
    });
    if (result.error) {
      throw new RepositoryCommandError(
        `Failed to execute Git worktree command: ${result.error.message}`,
        hooklessArgs,
        cwd,
        result.status,
        result.stderr,
      );
    }
    if (result.status !== 0) {
      throw new RepositoryCommandError(
        `Git worktree command failed with status ${String(result.status)}`,
        hooklessArgs,
        cwd,
        result.status,
        result.stderr,
      );
    }
  }
}

export type MissingProjectPolicy = 'skip' | 'error';

export interface HistoricalProjectAnalysisContext {
  readonly commit: string;
  readonly worktreeRoot: string;
  readonly project: AnalysisProject;
  readonly projectRoot: string;
}

export interface HistoricalProjectAnalysisResult<T> {
  readonly project: AnalysisProject;
  readonly projectRoot: string;
  readonly value: T;
}

export async function analyzeHistoricalProjects<T>(options: {
  readonly commit: string;
  readonly worktreeRoot: string;
  readonly projects: readonly AnalysisProject[];
  readonly limits?: SemFoundationLimitOptions;
  readonly missingProject?: MissingProjectPolicy;
  readonly analyze: (context: HistoricalProjectAnalysisContext) => Promise<T> | T;
}): Promise<readonly HistoricalProjectAnalysisResult<T>[]> {
  const worktreeRoot = canonicalDirectory(options.worktreeRoot, 'historical worktree root');
  const commit = gitObjectId(options.commit, 'historical project commit');
  const projects = normalizeAnalysisProjects(options.projects, 'analysisProjects', options.limits);
  const missingProject = options.missingProject ?? 'skip';
  const results: HistoricalProjectAnalysisResult<T>[] = [];
  for (const project of projects) {
    const candidate = path.resolve(worktreeRoot, project.root);
    if (!isWithinRoot(worktreeRoot, candidate)) {
      throw new RepositoryStateError(`analysis project ${project.id} escapes the historical worktree`);
    }
    if (!existsSync(candidate)) {
      if (missingProject === 'error') {
        throw new RepositoryStateError(`analysis project ${project.id} root does not exist: ${project.root}`);
      }
      continue;
    }
    const projectRoot = canonicalDirectory(candidate, `analysis project ${project.id} root`);
    if (!isWithinRoot(worktreeRoot, projectRoot)) {
      throw new RepositoryStateError(`analysis project ${project.id} resolves outside the historical worktree`);
    }
    const value = await options.analyze({ commit, worktreeRoot, project, projectRoot });
    results.push({ project, projectRoot, value });
  }
  return results;
}

function canonicalDirectory(value: string, label: string): string {
  const candidate = realpathSync(value);
  if (!statSync(candidate).isDirectory()) throw new RepositoryStateError(`${label} must be a directory`);
  return candidate;
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function nonEmptyText(value: string, label: string): string {
  if (typeof value !== 'string' || value.length === 0 || value.includes('\0')) {
    throw new TypeError(`${label} must be non-empty text without null bytes`);
  }
  return value;
}

function visibleText(value: string, label: string): string {
  const normalized = nonEmptyText(value, label).trim();
  if (normalized.length === 0) throw new TypeError(`${label} must contain visible text`);
  return normalized;
}

function boundedText(value: string | undefined, label: string): string {
  const result = visibleText(value ?? '', label);
  if (result.length > 4096) throw new RepositoryStateError(`${label} exceeds 4096 characters`);
  return result;
}

function gitObjectId(value: string | undefined, label: string): string {
  const result = visibleText(value ?? '', label);
  if (!/^[0-9a-f]{7,64}$/u.test(result)) throw new RepositoryStateError(`${label} is not a Git object id`);
  return result;
}

function isUnbornHeadError(error: unknown): boolean {
  if (!(error instanceof RepositoryCommandError)) return false;
  const detail = (error.stderr ?? '').toLowerCase();
  return detail.includes('needed a single revision')
    || detail.includes("ambiguous argument 'head'")
    || detail.includes('unknown revision')
    || detail.includes('bad object head');
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError(`${label} must be a positive safe integer`);
  return value;
}
