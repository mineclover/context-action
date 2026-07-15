import type { WorkspaceFile } from './workspace';

export type FileTreeEntry =
  | {
      kind: 'directory';
      name: string;
      path: string;
      children: FileTreeEntry[];
    }
  | {
      kind: 'file';
      name: string;
      path: string;
      file: WorkspaceFile;
    };

export function buildFileTree(
  files: readonly WorkspaceFile[]
): FileTreeEntry[] {
  const root: FileTreeEntry[] = [];

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean);
    if (segments.length === 0) continue;
    let children = root;
    const directorySegments = segments.slice(0, -1);

    directorySegments.forEach((segment, index) => {
      const path = directorySegments.slice(0, index + 1).join('/');
      const existing = children.find(
        (entry) => entry.kind === 'directory' && entry.path === path
      );
      if (existing?.kind === 'directory') {
        children = existing.children;
        return;
      }
      const directory: FileTreeEntry = {
        kind: 'directory',
        name: segment,
        path,
        children: [],
      };
      children.push(directory);
      children = directory.children;
    });

    children.push({
      kind: 'file',
      name: segments[segments.length - 1],
      path: file.path,
      file,
    });
  }

  const sortEntries = (entries: FileTreeEntry[]): FileTreeEntry[] =>
    entries
      .map((entry) =>
        entry.kind === 'directory'
          ? { ...entry, children: sortEntries(entry.children) }
          : entry
      )
      .sort((left, right) => {
        if (left.kind !== right.kind) return left.kind === 'directory' ? -1 : 1;
        return left.name.localeCompare(right.name);
      });

  return sortEntries(root);
}

export function collectDirectoryPaths(
  entries: readonly FileTreeEntry[]
): string[] {
  return entries.flatMap((entry) =>
    entry.kind === 'directory'
      ? [entry.path, ...collectDirectoryPaths(entry.children)]
      : []
  );
}
