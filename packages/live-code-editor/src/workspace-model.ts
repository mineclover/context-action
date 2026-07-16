import type { WorkspaceFile } from './index';
import { WorkspaceToolError } from './workspace-errors';

export const MAX_TEXT_SOURCE_LENGTH = 80_000;

const languageByWorkspaceExtension: Record<string, string> = {
  '.css': 'css',
  '.htm': 'html',
  '.html': 'html',
  '.js': 'javascript',
  '.json': 'json',
  '.mjs': 'javascript',
  '.md': 'markdown',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.txt': 'text',
};

const binaryWorkspaceExtensions = new Set([
  '.avif',
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.otf',
  '.png',
  '.svg',
  '.ttf',
  '.wasm',
  '.webp',
  '.woff',
  '.woff2',
]);

function createWorkspaceInputError(
  message: string,
  details: Record<string, unknown>
): WorkspaceToolError {
  return new WorkspaceToolError(message, {
    code: 'WORKSPACE_PATH_INVALID',
    retryable: false,
    details,
  });
}

export function normalizeWorkspacePath(path: string): string {
  if (path.includes('\0')) {
    throw createWorkspaceInputError('Workspace path cannot contain NUL.', {
      path,
      reason: 'nul',
    });
  }
  const segments = path.replaceAll('\\', '/').split('/');
  if (segments.some((segment) => segment === '..')) {
    throw createWorkspaceInputError(
      'Workspace path cannot traverse a parent directory.',
      { path, reason: 'parent-traversal' }
    );
  }
  const normalized = segments.filter(
    (segment) => segment.length > 0 && segment !== '.'
  );
  if (normalized.length === 0) {
    throw createWorkspaceInputError('Workspace path is required.', {
      path,
      reason: 'empty',
    });
  }
  return normalized.join('/');
}

export function assertWorkspaceTextSourceLength(
  source: string,
  label = 'Workspace text source'
): void {
  if (source.length > MAX_TEXT_SOURCE_LENGTH) {
    throw new WorkspaceToolError(
      `${label} exceeds the ${MAX_TEXT_SOURCE_LENGTH.toLocaleString('en-US')} character limit.`,
      {
        code: 'WORKSPACE_SOURCE_LIMIT',
        retryable: false,
        details: { limit: MAX_TEXT_SOURCE_LENGTH },
      }
    );
  }
}

export function languageForWorkspacePath(path: string): string {
  const extension = `.${path.split('.').pop()?.toLowerCase() ?? ''}`;
  return languageByWorkspaceExtension[extension] ?? 'text';
}

export function isBinaryWorkspacePath(path: string): boolean {
  const extension = `.${path.split('.').pop()?.toLowerCase() ?? ''}`;
  return binaryWorkspaceExtensions.has(extension);
}

export function mimeTypeForWorkspaceLanguage(language: string): string {
  switch (language) {
    case 'html':
      return 'text/html';
    case 'css':
      return 'text/css';
    case 'javascript':
      return 'text/javascript';
    case 'json':
      return 'application/json';
    case 'markdown':
      return 'text/markdown';
    default:
      return 'text/plain';
  }
}

export function selectWorkspaceActivePath(
  files: readonly WorkspaceFile[]
): string {
  return (
    files.find((file) => file.path === 'index.html')?.path ??
    files.find((file) => file.language === 'html')?.path ??
    files.find((file) => file.kind !== 'asset')?.path ??
    files[0]?.path ??
    'index.html'
  );
}
