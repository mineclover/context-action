import type { BrowserWorkspace, WorkspaceFile } from './workspace';
import { WorkspaceToolError } from './workspace-errors';

export const themeTokens = {
  violet: { accent: '#8b5cf6', soft: '#f0eaff' },
  emerald: { accent: '#10b981', soft: '#e7fbf3' },
  amber: { accent: '#f59e0b', soft: '#fff5dc' },
  rose: { accent: '#f43f5e', soft: '#ffedf0' },
} as const;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character] ?? character;
  });
}

export function downloadWorkspaceFile(file: WorkspaceFile): number {
  const blob =
    file.kind === 'asset' && file.blob
      ? file.blob
      : new Blob([file.source], { type: file.mimeType ?? 'text/plain' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = file.path.split('/').pop() ?? file.path;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  window.setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
  return blob.size;
}

export function throwIfAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) return;
  const reason = signal.reason;
  throw reason instanceof Error
    ? reason
    : new DOMException('Execution cancelled.', 'AbortError');
}

export function assertExpectedWorkspaceRevision(
  workspace: BrowserWorkspace,
  expectedRevision?: number
): void {
  if (expectedRevision === undefined) return;
  const currentRevision = workspace.getSnapshot().revision;
  if (expectedRevision !== currentRevision) {
    throw new WorkspaceToolError(
      `Workspace revision mismatch: expected ${expectedRevision}, current ${currentRevision}. Re-read the workspace before applying the mutation.`,
      {
        code: 'WORKSPACE_REVISION_CONFLICT',
        retryable: true,
        details: { expectedRevision, currentRevision },
      }
    );
  }
}

export function applyTextPatch(
  source: string,
  search: string,
  replace: string,
  occurrence: 'first' | 'all'
): { source: string; replacements: number } {
  if (occurrence === 'all') {
    const parts = source.split(search);
    const replacements = parts.length - 1;
    if (!replacements) {
      throw new Error('Patch search text was not found in the file.');
    }
    return { source: parts.join(replace), replacements };
  }

  const index = source.indexOf(search);
  if (index < 0) {
    throw new Error('Patch search text was not found in the file.');
  }
  return {
    source: `${source.slice(0, index)}${replace}${source.slice(index + search.length)}`,
    replacements: 1,
  };
}
