import type { WorkspaceFile, WorkspaceSnapshot } from './workspace';

export type WorkspaceVersionFile = {
  readonly path: string;
  readonly language: string;
  readonly kind: 'text' | 'asset';
  readonly source: string;
  readonly renamedFrom?: string;
};

export type VersionDiffLine = {
  readonly kind: 'context' | 'added' | 'removed';
  readonly oldLine?: number;
  readonly newLine?: number;
  readonly text: string;
};

export type WorkspaceFileChange = {
  readonly path: string;
  readonly kind: 'added' | 'removed' | 'modified' | 'renamed';
  readonly before?: WorkspaceVersionFile;
  readonly after?: WorkspaceVersionFile;
  readonly additions: number;
  readonly deletions: number;
  readonly diff: readonly VersionDiffLine[];
};

export type WorkspaceChangeSummary = {
  readonly files: readonly WorkspaceFileChange[];
  readonly additions: number;
  readonly deletions: number;
};

export type WorkspaceVersion = {
  readonly id: string;
  readonly revision: number;
  readonly activePath: string;
  readonly files: readonly WorkspaceVersionFile[];
  readonly capturedAt: number;
  readonly change: WorkspaceChangeSummary;
};

const MAX_DIFF_MATRIX_CELLS = 250_000;

function splitSource(source: string): string[] {
  return source.split('\n');
}

function lineCount(source: string): number {
  return source.length === 0 ? 0 : splitSource(source).length;
}

function fileForVersion(file: WorkspaceFile): WorkspaceVersionFile {
  return {
    path: file.path,
    language: file.language,
    kind: file.kind === 'asset' ? 'asset' : 'text',
    source: file.source,
    ...(file.renamedFrom ? { renamedFrom: file.renamedFrom } : {}),
  };
}

function emptyChangeSummary(): WorkspaceChangeSummary {
  return { files: [], additions: 0, deletions: 0 };
}

function coarseDiff(before: string, after: string): readonly VersionDiffLine[] {
  const rows: VersionDiffLine[] = [];
  if (before) {
    rows.push({
      kind: 'removed',
      text: `[${lineCount(before)} lines removed]`,
    });
  }
  if (after) {
    rows.push({ kind: 'added', text: `[${lineCount(after)} lines added]` });
  }
  return rows;
}

/** Build a bounded line diff suitable for rendering in the browser. */
export function buildVersionLineDiff(
  before: string,
  after: string
): readonly VersionDiffLine[] {
  if (before === after) {
    return splitSource(after).map((text, index) => ({
      kind: 'context' as const,
      oldLine: index + 1,
      newLine: index + 1,
      text,
    }));
  }

  const oldLines = splitSource(before);
  const newLines = splitSource(after);
  if (oldLines.length * newLines.length > MAX_DIFF_MATRIX_CELLS) {
    return coarseDiff(before, after);
  }

  const lcs = Array.from(
    { length: oldLines.length + 1 },
    () => new Uint32Array(newLines.length + 1)
  );
  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      lcs[oldIndex]![newIndex] =
        oldLines[oldIndex] === newLines[newIndex]
          ? lcs[oldIndex + 1]![newIndex + 1]! + 1
          : Math.max(
              lcs[oldIndex + 1]![newIndex]!,
              lcs[oldIndex]![newIndex + 1]!
            );
    }
  }

  const rows: VersionDiffLine[] = [];
  let oldIndex = 0;
  let newIndex = 0;
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (
      oldIndex < oldLines.length &&
      newIndex < newLines.length &&
      oldLines[oldIndex] === newLines[newIndex]
    ) {
      rows.push({
        kind: 'context',
        oldLine: oldIndex + 1,
        newLine: newIndex + 1,
        text: oldLines[oldIndex]!,
      });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }
    if (
      oldIndex < oldLines.length &&
      (newIndex >= newLines.length ||
        lcs[oldIndex + 1]![newIndex]! >= lcs[oldIndex]![newIndex + 1]!)
    ) {
      rows.push({
        kind: 'removed',
        oldLine: oldIndex + 1,
        text: oldLines[oldIndex]!,
      });
      oldIndex += 1;
      continue;
    }
    rows.push({
      kind: 'added',
      newLine: newIndex + 1,
      text: newLines[newIndex]!,
    });
    newIndex += 1;
  }
  return rows;
}

function changeForFile(
  before: WorkspaceVersionFile | undefined,
  after: WorkspaceVersionFile | undefined,
  kind: WorkspaceFileChange['kind'],
  path: string
): WorkspaceFileChange {
  const diff = buildVersionLineDiff(before?.source ?? '', after?.source ?? '');
  return {
    path,
    kind,
    ...(before ? { before } : {}),
    ...(after ? { after } : {}),
    additions: diff.filter((line) => line.kind === 'added').length,
    deletions: diff.filter((line) => line.kind === 'removed').length,
    diff,
  };
}

export function buildWorkspaceChangeSummary(
  beforeFiles: readonly WorkspaceVersionFile[],
  afterFiles: readonly WorkspaceVersionFile[]
): WorkspaceChangeSummary {
  const beforeByPath = new Map(beforeFiles.map((file) => [file.path, file]));
  const afterByPath = new Map(afterFiles.map((file) => [file.path, file]));
  const changes: WorkspaceFileChange[] = [];
  const renamedBeforePaths = new Set<string>();

  for (const after of afterFiles) {
    if (beforeByPath.has(after.path)) continue;
    const renamedFrom = after.renamedFrom
      ? beforeByPath.get(after.renamedFrom)
      : undefined;
    if (renamedFrom) {
      renamedBeforePaths.add(renamedFrom.path);
      changes.push(changeForFile(renamedFrom, after, 'renamed', after.path));
    } else {
      changes.push(changeForFile(undefined, after, 'added', after.path));
    }
  }

  for (const before of beforeFiles) {
    if (renamedBeforePaths.has(before.path) || afterByPath.has(before.path)) {
      continue;
    }
    changes.push(changeForFile(before, undefined, 'removed', before.path));
  }

  for (const after of afterFiles) {
    const before = beforeByPath.get(after.path);
    if (!before || before.source === after.source) continue;
    changes.push(changeForFile(before, after, 'modified', after.path));
  }

  const additions = changes.reduce(
    (total, change) => total + change.additions,
    0
  );
  const deletions = changes.reduce(
    (total, change) => total + change.deletions,
    0
  );
  return { files: changes, additions, deletions };
}

export function captureWorkspaceVersion(
  snapshot: WorkspaceSnapshot,
  previousVersion?: WorkspaceVersion
): WorkspaceVersion {
  const files = snapshot.files.map(fileForVersion);
  return {
    id: `revision-${snapshot.revision}-${snapshot.files.length}`,
    revision: snapshot.revision,
    activePath: snapshot.activePath,
    files,
    capturedAt: Date.now(),
    change: previousVersion
      ? buildWorkspaceChangeSummary(previousVersion.files, files)
      : emptyChangeSummary(),
  };
}

export function formatWorkspaceChangeFeedback(
  change: WorkspaceChangeSummary
): string {
  if (!change.files.length) return '';
  const fileLabels = change.files
    .slice(0, 3)
    .map((file) => `${file.kind} ${file.path}`)
    .join(', ');
  const overflow =
    change.files.length > 3 ? ` +${change.files.length - 3} more` : '';
  return `Changed ${change.files.length} file(s) · +${change.additions} / −${change.deletions}: ${fileLabels}${overflow}.`;
}
