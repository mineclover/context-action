import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useEffect, useRef } from 'react';
import type { ToolCall } from '../local-agent-plan';
import type { WorkspaceFile } from '../workspace';
import { BrowserWorkspace } from '../workspace';
import type {
  EditorDraftFlushRef,
  EditorMessage,
  ToolExecutionOptions,
  ToolExecutionOutcome,
} from './use-tool-execution';

export type WorkspaceEditorActionsOptions = {
  workspace: BrowserWorkspace;
  snapshotRevision: number;
  activeFile: WorkspaceFile;
  isStorageReady: boolean;
  hasWritableFolder: boolean;
  canDeleteActiveFile: boolean;
  canRevertActiveFile: boolean;
  running: boolean;
  saving: boolean;
  editorDraftsRef: MutableRefObject<Record<string, string>>;
  setEditorDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  setMessages: Dispatch<SetStateAction<EditorMessage[]>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  flushEditorDraftsRef: EditorDraftFlushRef;
  requestConfirmation: (request: {
    title: string;
    message: string;
    confirmLabel: string;
    tone: 'warning' | 'danger';
  }) => Promise<boolean>;
  executeQuickTool: (
    call: ToolCall,
    options?: ToolExecutionOptions
  ) => Promise<ToolExecutionOutcome>;
};

export function useWorkspaceEditorActions({
  workspace,
  snapshotRevision,
  activeFile,
  isStorageReady,
  hasWritableFolder,
  canDeleteActiveFile,
  canRevertActiveFile,
  running,
  saving,
  editorDraftsRef,
  setEditorDrafts,
  setMessages,
  setSaving,
  flushEditorDraftsRef,
  requestConfirmation,
  executeQuickTool,
}: WorkspaceEditorActionsOptions) {
  const editorDraftTimerRef = useRef<number | null>(null);
  const editorDraftFlushRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    return () => {
      if (editorDraftTimerRef.current !== null) {
        window.clearTimeout(editorDraftTimerRef.current);
      }
    };
  }, []);

  const flushEditorDrafts = async (): Promise<boolean> => {
    if (editorDraftTimerRef.current !== null) {
      window.clearTimeout(editorDraftTimerRef.current);
      editorDraftTimerRef.current = null;
    }
    if (editorDraftFlushRef.current) return editorDraftFlushRef.current;

    const promise = (async () => {
      let allFlushed = true;
      const drafts = Object.entries(editorDraftsRef.current);
      for (const [path, source] of drafts) {
        if (editorDraftsRef.current[path] !== source) continue;
        const file = workspace
          .getSnapshot()
          .files.find((candidate) => candidate.path === path);
        if (!file || file.kind === 'asset' || file.source === source) {
          setEditorDrafts((current) => {
            if (current[path] !== source) return current;
            const next = { ...current };
            delete next[path];
            return next;
          });
          continue;
        }

        const outcome = await executeQuickTool(
          {
            name: 'workspace.writeFile',
            arguments: {
              path,
              source,
              expectedRevision: workspace.getSnapshot().revision,
            },
          },
          { announce: false, skipDraftFlush: true }
        );
        if (!outcome.ok) {
          allFlushed = false;
          continue;
        }
        setEditorDrafts((current) => {
          if (current[path] !== source) return current;
          const next = { ...current };
          delete next[path];
          return next;
        });
      }
      return allFlushed;
    })();
    const trackedPromise = promise.finally(() => {
      if (editorDraftFlushRef.current === trackedPromise) {
        editorDraftFlushRef.current = null;
      }
    });
    editorDraftFlushRef.current = trackedPromise;
    return trackedPromise;
  };
  flushEditorDraftsRef.current = flushEditorDrafts;

  const updateEditorDraft = (path: string, source: string) => {
    setEditorDrafts((current) => {
      if (current[path] === source) return current;
      return { ...current, [path]: source };
    });
    if (editorDraftTimerRef.current !== null) {
      window.clearTimeout(editorDraftTimerRef.current);
    }
    editorDraftTimerRef.current = window.setTimeout(() => {
      editorDraftTimerRef.current = null;
      void flushEditorDrafts();
    }, 650);
  };

  const createWorkspaceFile = (path: string, source: string) =>
    executeQuickTool({
      name: 'workspace.createFile',
      arguments: { path, source, expectedRevision: snapshotRevision },
    });

  const openWorkspaceFile = (path: string) =>
    executeQuickTool({
      name: 'workspace.openFile',
      arguments: { path },
    });

  const renameWorkspaceFile = (fromPath: string, toPath: string) =>
    executeQuickTool({
      name: 'workspace.renameFile',
      arguments: {
        fromPath,
        toPath,
        expectedRevision: snapshotRevision,
      },
    });

  const deleteActiveFile = async () => {
    if (!canDeleteActiveFile || running) return;
    if (
      !(await requestConfirmation({
        title: 'Delete active file?',
        message: `${activeFile.path} will be removed from this browser workspace. This action can be recovered with Undo during this session.`,
        confirmLabel: 'Delete file',
        tone: 'danger',
      }))
    ) {
      return;
    }
    await executeQuickTool({
      name: 'workspace.deleteFile',
      arguments: {
        path: activeFile.path,
        expectedRevision: snapshotRevision,
      },
    });
  };

  const revertActiveFile = async () => {
    if (!canRevertActiveFile || running) return;
    if (
      !(await requestConfirmation({
        title: 'Revert active file?',
        message: `Unsaved changes in ${activeFile.path} will be discarded. Undo can restore this session's edit.`,
        confirmLabel: 'Revert file',
        tone: 'warning',
      }))
    ) {
      return;
    }
    await executeQuickTool({
      name: 'workspace.revertFile',
      arguments: {
        path: activeFile.path,
        expectedRevision: snapshotRevision,
      },
    });
  };

  const saveWorkspace = async () => {
    if (saving || running || !isStorageReady) return;
    if (!(await flushEditorDrafts()) || !workspace.isDirty()) return;
    setSaving(true);
    try {
      await executeQuickTool(
        hasWritableFolder
          ? {
              name: 'workspace.saveAll',
              arguments: {
                expectedRevision: workspace.getSnapshot().revision,
              },
            }
          : {
              name: 'workspace.saveCheckpoint',
              arguments: { expectedRevision: workspace.getSnapshot().revision },
            }
      );
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: error instanceof Error ? error.message : 'Save failed.',
        },
      ]);
    } finally {
      setSaving(false);
    }
  };

  const downloadActiveFile = () => {
    void executeQuickTool({
      name: 'workspace.downloadFile',
      arguments: { path: activeFile.path },
    });
  };

  return {
    flushEditorDrafts,
    updateEditorDraft,
    createWorkspaceFile,
    openWorkspaceFile,
    renameWorkspaceFile,
    deleteActiveFile,
    revertActiveFile,
    saveWorkspace,
    downloadActiveFile,
  };
}
