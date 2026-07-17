import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, realpathSync } from 'node:fs';
import * as path from 'node:path';

import { foundationRevisionReader } from './sem-foundation';

export interface RepositoryRevision {
  readonly repositoryRoot: string;
  readonly gitHead: string;
  readonly workingTreeDigest: string;
}

export interface RepositoryRevisionReaderLike {
  read(cwd: string): RepositoryRevision;
}

export function sameRepositoryRevision(
  left: RepositoryRevision,
  right: RepositoryRevision
): boolean {
  return (
    left.repositoryRoot === right.repositoryRoot &&
    left.gitHead === right.gitHead &&
    left.workingTreeDigest === right.workingTreeDigest
  );
}

export class RepositoryStateError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'RepositoryStateError';
  }
}

/** Captures the on-disk Git state used to qualify a sem analysis result. */
export class RepositoryRevisionReader {
  public constructor(private readonly gitBinary = 'git') {}

  public read(cwd: string): RepositoryRevision {
    const repositoryRoot = this.runGit(['rev-parse', '--show-toplevel'], cwd).trim();
    if (repositoryRoot.length === 0) {
      throw new RepositoryStateError(`Not a Git repository: ${cwd}`);
    }
    const root = realpathSync(repositoryRoot);
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
            `untracked path escapes the repository through a symlink: ${relativePath}`
          );
        }
        digest.update(readFileSync(canonicalPath));
      } catch (error) {
        if (error instanceof RepositoryStateError) throw error;
        digest.update('<unreadable>');
      }
    }
    return {
      repositoryRoot: root,
      gitHead,
      workingTreeDigest: digest.digest('hex'),
    };
  }

  private runGit(args: readonly string[], cwd: string): string {
    try {
      return this.execute(args, cwd);
    } catch (error) {
      if (args[0] === 'rev-parse') {
        throw new RepositoryStateError(`Git command failed in ${cwd}`);
      }
      throw error;
    }
  }

  private execute(args: readonly string[], cwd: string): string {
    const result = spawnSync(this.gitBinary, args, {
      cwd,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    if (result.error) {
      throw new RepositoryStateError(`Failed to execute Git: ${result.error.message}`);
    }
    if (result.status !== 0) {
      const detail = typeof result.stderr === 'string' ? result.stderr.trim() : '';
      throw new RepositoryStateError(
        `Git command failed with status ${String(result.status)}${detail ? `: ${detail}` : ''}`,
      );
    }
    return result.stdout ?? '';
  }
}

function isUnbornHeadError(error: unknown): boolean {
  if (!(error instanceof RepositoryStateError)) return false;
  const detail = error.message.toLowerCase();
  return detail.includes('needed a single revision')
    || detail.includes("ambiguous argument 'head'")
    || detail.includes('unknown revision')
    || detail.includes('bad object head');
}

/** Uses the shared Foundation repository reader when it is installed, with the local fallback otherwise. */
export function createRepositoryRevisionReader(gitBinary = 'git'): RepositoryRevisionReaderLike {
  return gitBinary === 'git'
    ? (foundationRevisionReader() ?? new RepositoryRevisionReader(gitBinary))
    : new RepositoryRevisionReader(gitBinary);
}

/** Resolves a command invocation directory to the canonical Git worktree root. */
export function resolveRepositoryRoot(cwd: string): string {
  return createRepositoryRevisionReader().read(path.resolve(cwd)).repositoryRoot;
}

function isWithinRoot(root: string, candidate: string): boolean {
  const relative = path.relative(root, candidate);
  return relative.length === 0 || (!relative.startsWith('..') && !path.isAbsolute(relative));
}
