import { foundationNormalizeRepositoryPath } from './sem-foundation';

/** Directory names skipped by document/source collection. */
export const DEFAULT_COLLECTION_IGNORED_DIRECTORIES = [
  '.git',
  'node_modules',
  'dist',
  '.test-dist',
  '.reports',
] as const;

/** External dependency surface is visible, but its transitive internals are not collected. */
export const NODE_MODULES_DIRECTORY = 'node_modules' as const;

/** Maximum graph hop admitted from a package boundary into node_modules. */
export const MAX_NODE_MODULES_HOPS = 1 as const;

export function isNodeModulesPath(filePath: string): boolean {
  const normalized = foundationNormalizeRepositoryPath(filePath);
  return normalized.split('/').includes(NODE_MODULES_DIRECTORY);
}

/**
 * Returns true for the default source-collection directories that remain
 * excluded even when node_modules surface collection is explicitly enabled.
 */
export function isDefaultIgnoredCollectionPath(filePath: string): boolean {
  const normalized = foundationNormalizeRepositoryPath(filePath);
  return normalized
    .split('/')
    .some((segment) =>
      segment !== NODE_MODULES_DIRECTORY
      && isIgnoredCollectionDirectory(segment, DEFAULT_COLLECTION_IGNORED_DIRECTORIES));
}

export function isIgnoredCollectionDirectory(
  directoryName: string,
  ignoredDirectories: readonly string[] | ReadonlySet<string> = DEFAULT_COLLECTION_IGNORED_DIRECTORIES,
): boolean {
  return ignoredDirectories instanceof Set
    ? ignoredDirectories.has(directoryName)
    : (ignoredDirectories as readonly string[]).includes(directoryName);
}
