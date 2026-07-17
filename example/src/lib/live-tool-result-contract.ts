import { z } from 'zod';
import type { LiveEditorPreviewStatus } from './live-code-editor-bridge';
import type { LiveEditorWorkspaceSnapshot } from './live-code-editor-workspace';

/**
 * The preview acknowledgement shared by the browser editor and realtime
 * web-coding tool catalogs.
 *
 * A preview revision may be -1 before the iframe has acknowledged its first
 * render, so the result contract intentionally accepts any integer here.
 */
export const livePreviewStatusSchema = z.object({
  state: z.enum(['pending', 'rendered', 'timeout', 'error']),
  revision: z.number().int(),
  message: z.string().optional(),
});

export type LivePreviewStatusResult = z.infer<typeof livePreviewStatusSchema>;

export type LiveWorkspaceResultContext = {
  readonly activePath: string;
  readonly rootName: string;
  readonly revision: number;
};

export function createLiveWorkspaceResultContext(
  snapshot: Pick<
    LiveEditorWorkspaceSnapshot,
    'activePath' | 'rootName' | 'revision'
  >
): LiveWorkspaceResultContext {
  return {
    activePath: snapshot.activePath,
    rootName: snapshot.rootName,
    revision: snapshot.revision,
  };
}

export type LiveEditorResultContext = {
  readonly activePath: string;
  readonly workspaceRevision: number;
  readonly documentRevision: number;
};

export function createLiveEditorResultContext(
  workspace: Pick<LiveEditorWorkspaceSnapshot, 'activePath' | 'revision'>,
  documentRevision: number
): LiveEditorResultContext {
  return {
    activePath: workspace.activePath,
    workspaceRevision: workspace.revision,
    documentRevision,
  };
}

export function createLiveWorkspaceMutationResult(
  snapshot: Pick<LiveEditorWorkspaceSnapshot, 'activePath' | 'revision'>,
  path: string,
  preview: LiveEditorPreviewStatus
) {
  return {
    path,
    activePath: snapshot.activePath,
    revision: snapshot.revision,
    preview,
  };
}
