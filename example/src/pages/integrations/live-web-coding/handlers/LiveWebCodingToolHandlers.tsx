import type { ReactNode } from 'react';
import { LiveEditorDocumentManager } from '../../../../lib/live-code-editor-bridge';
import { normalizeWorkspacePath } from '../../../../lib/live-code-editor-filesystem';
import { LiveEditorWorkspaceRepository } from '../../../../lib/live-code-editor-storage';
import { LiveEditorWorkspaceManager } from '../../../../lib/live-code-editor-workspace';
import { applyLiveEditorTextPatch } from '../../../../lib/live-editor-text-patch';
import {
  createLiveWorkspaceMutationResult,
  createLiveWorkspaceResultContext,
} from '../../../../lib/live-tool-result-contract';
import { useLiveWebCodingToolHandler } from '../LiveWebCodingToolchain';

export const LIVE_WEB_WORKSPACE_ID = 'live-web-coding-demo';

const themeTokens = {
  violet: { accent: '#6d5dfc', soft: '#eeedff' },
  emerald: { accent: '#0f9f78', soft: '#e7f8f2' },
  amber: { accent: '#d97706', soft: '#fff4dc' },
  rose: { accent: '#e0527a', soft: '#ffedf2' },
  sky: { accent: '#0b83c6', soft: '#e8f6ff' },
} as const;

function escapeHtml(value: string): string {
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

function serializeWorkspace(manager: LiveEditorWorkspaceManager) {
  const snapshot = manager.getSnapshot();
  return {
    ...createLiveWorkspaceResultContext(snapshot),
    files: snapshot.files.map((file) => ({
      path: file.path,
      isText: file.isText,
      size: file.size,
    })),
  };
}

function assertExpectedWebRevision(
  manager: LiveEditorWorkspaceManager,
  expectedRevision?: number
): void {
  if (expectedRevision === undefined) return;
  const currentRevision = manager.getSnapshot().revision;
  if (expectedRevision !== currentRevision) {
    throw new Error(
      `Workspace revision mismatch: expected ${expectedRevision}, current ${currentRevision}. Re-read the workspace before applying the mutation.`
    );
  }
}

export function LiveWebCodingToolHandlers({
  manager,
  documentManager,
  repository,
  children,
}: {
  manager: LiveEditorWorkspaceManager;
  documentManager: LiveEditorDocumentManager;
  repository: LiveEditorWorkspaceRepository;
  children: ReactNode;
}) {
  const updateFileAndWait = async (
    path: string,
    source: string,
    options?: { expectedRevision?: number; signal?: AbortSignal }
  ) => {
    if (options?.signal?.aborted)
      throw new Error('Workspace update cancelled.');
    assertExpectedWebRevision(manager, options?.expectedRevision);
    const normalizedPath = normalizeWorkspacePath(path);
    const current = manager
      .getSnapshot()
      .files.find((file) => file.path === normalizedPath);
    if (current && !current.isText) {
      throw new Error(
        `${normalizedPath} is binary and cannot be edited as text.`
      );
    }

    const nextWorkspace = manager.updateFile(normalizedPath, source);
    await repository.saveTextFile(
      LIVE_WEB_WORKSPACE_ID,
      normalizedPath,
      source,
      current?.mimeType
    );
    if (options?.signal?.aborted)
      throw new Error('Workspace update cancelled.');
    const activeDocument = documentManager.getSnapshot();
    const nextDocument = documentManager.update(
      activeDocument.file === normalizedPath ? { source } : {}
    );
    const preview = await documentManager.waitForRendered(
      nextDocument.revision,
      2_000,
      options?.signal
    );
    return createLiveWorkspaceMutationResult(
      nextWorkspace,
      normalizedPath,
      preview
    );
  };

  useLiveWebCodingToolHandler('web.getWorkspace', () =>
    serializeWorkspace(manager)
  );

  useLiveWebCodingToolHandler('web.readFile', ({ path }) => {
    const file = manager
      .getSnapshot()
      .files.find(
        (candidate) => candidate.path === normalizeWorkspacePath(path)
      );
    if (!file) throw new Error(`Workspace file not found: ${path}`);
    if (!file.isText)
      throw new Error(`${path} is binary and cannot be read as text.`);
    return {
      path: file.path,
      source: file.source,
      revision: manager.getSnapshot().revision,
    };
  });

  useLiveWebCodingToolHandler<'web.writeFile', unknown>(
    'web.writeFile',
    ({ path, source, expectedRevision }, controller) =>
      updateFileAndWait(path, source, {
        expectedRevision,
        signal: controller.signal,
      })
  );

  useLiveWebCodingToolHandler<'web.applyPatch', unknown>(
    'web.applyPatch',
    async (
      { path, search, replace, occurrence, expectedRevision },
      controller
    ) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const normalizedPath = normalizeWorkspacePath(path);
      const file = manager
        .getSnapshot()
        .files.find((candidate) => candidate.path === normalizedPath);
      if (!file) throw new Error(`Workspace file not found: ${normalizedPath}`);
      if (!file.isText)
        throw new Error(
          `${normalizedPath} is binary and cannot be patched as text.`
        );
      const patch = applyLiveEditorTextPatch(
        file.source,
        search,
        replace,
        occurrence
      );
      if (patch.source.length > 100_000) {
        throw new Error('Patched source exceeds the 100,000 character limit.');
      }
      return {
        replacements: patch.replacements,
        ...(await updateFileAndWait(normalizedPath, patch.source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler<'web.setTheme', unknown>(
    'web.setTheme',
    async ({ theme, expectedRevision }, controller) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const cssFile = manager
        .getSnapshot()
        .files.find((file) => file.path === 'style.css');
      if (!cssFile) throw new Error('style.css is required for theme changes.');
      const tokens = themeTokens[theme];
      if (!/--accent:\s*#[0-9a-f]+;/i.test(cssFile.source)) {
        throw new Error('style.css does not expose an --accent token.');
      }
      if (!/--accent-soft:\s*#[0-9a-f]+;/i.test(cssFile.source)) {
        throw new Error('style.css does not expose an --accent-soft token.');
      }
      const source = cssFile.source
        .replace(/--accent:\s*#[0-9a-f]+;/i, `--accent: ${tokens.accent};`)
        .replace(
          /--accent-soft:\s*#[0-9a-f]+;/i,
          `--accent-soft: ${tokens.soft};`
        );
      return {
        theme,
        ...(await updateFileAndWait('style.css', source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler<'web.addFeature', unknown>(
    'web.addFeature',
    async ({ title, description, expectedRevision }, controller) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const htmlFile = manager
        .getSnapshot()
        .files.find((file) => file.path === 'index.html');
      if (!htmlFile)
        throw new Error('index.html is required for feature cards.');
      if (
        !/<section\s+id="feature-grid"\s+class="feature-grid">[\s\S]*?<\/section>/i.test(
          htmlFile.source
        )
      ) {
        throw new Error(
          'index.html does not expose the feature-grid insertion target.'
        );
      }
      const card = `<article class="feature-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(description)}</span></article>`;
      const source = htmlFile.source.replace(
        /(<section\s+id="feature-grid"\s+class="feature-grid">[\s\S]*?)(<\/section>)/i,
        `$1${card}$2`
      );
      return {
        title,
        ...(await updateFileAndWait('index.html', source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler<'web.updateHero', unknown>(
    'web.updateHero',
    async ({ title, subtitle, expectedRevision }, controller) => {
      assertExpectedWebRevision(manager, expectedRevision);
      const htmlFile = manager
        .getSnapshot()
        .files.find((file) => file.path === 'index.html');
      if (!htmlFile)
        throw new Error('index.html is required for hero changes.');
      if (
        !/<h1\b[^>]*id="hero-title"[^>]*>[\s\S]*?<\/h1>/i.test(htmlFile.source)
      ) {
        throw new Error('index.html does not expose a hero title target.');
      }
      if (
        !/<p\b[^>]*id="hero-subtitle"[^>]*>[\s\S]*?<\/p>/i.test(htmlFile.source)
      ) {
        throw new Error('index.html does not expose a hero subtitle target.');
      }
      const source = htmlFile.source
        .replace(
          /(<h1\b[^>]*id="hero-title"[^>]*>)[\s\S]*?(<\/h1>)/i,
          `$1${escapeHtml(title)}$2`
        )
        .replace(
          /(<p\b[^>]*id="hero-subtitle"[^>]*>)[\s\S]*?(<\/p>)/i,
          `$1${escapeHtml(subtitle)}$2`
        );
      return {
        title,
        ...(await updateFileAndWait('index.html', source, {
          expectedRevision,
          signal: controller.signal,
        })),
      };
    }
  );

  useLiveWebCodingToolHandler('web.runPreview', () => ({
    workspace: serializeWorkspace(manager),
    preview: documentManager.getPreviewStatus(),
  }));

  return <>{children}</>;
}
