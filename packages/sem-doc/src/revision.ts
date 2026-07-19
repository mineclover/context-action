import * as path from 'node:path';

import type { RepositoryRevision } from '@context-action/sem-foundation-contracts';
import {
  RepositoryRevisionReader as FoundationRepositoryRevisionReader,
} from '@context-action/sem-foundation-repository';

export type { RepositoryRevision } from '@context-action/sem-foundation-contracts';

export interface RepositoryRevisionReaderLike {
  read(cwd: string): RepositoryRevision;
}

export {
  RepositoryStateError,
  sameRepositoryRevision,
} from '@context-action/sem-foundation-repository';

/** Captures the on-disk Git state through the shared Foundation repository runtime. */
export const RepositoryRevisionReader = FoundationRepositoryRevisionReader;

export function createRepositoryRevisionReader(gitBinary = 'git'): RepositoryRevisionReaderLike {
  return new FoundationRepositoryRevisionReader(gitBinary);
}

/** Resolves a command invocation directory to the canonical Git worktree root. */
export function resolveRepositoryRoot(cwd: string): string {
  return createRepositoryRevisionReader().read(path.resolve(cwd)).repositoryRoot;
}
