import { useCallback } from 'react';
import type {
  LiveEditorDocument,
  LiveEditorDocumentManager,
} from '../../../../lib/live-code-editor-bridge';
import type { LiveEditorWorkspaceManager } from '../../../../lib/live-code-editor-workspace';

interface LiveEditorDocumentActionOptions {
  documentManager: LiveEditorDocumentManager;
  workspaceManager: LiveEditorWorkspaceManager;
}

export function useLiveEditorDocumentActions({
  documentManager,
  workspaceManager,
}: LiveEditorDocumentActionOptions) {
  const updateDocument = useCallback(
    (patch: Partial<LiveEditorDocument>) => documentManager.update(patch),
    [documentManager]
  );

  const setSource = useCallback(
    (source: string) => updateDocument({ source }),
    [updateDocument]
  );

  const setScenario = useCallback(
    (scenario: string) => updateDocument({ scenario }),
    [updateDocument]
  );

  const resetSource = useCallback(() => {
    const file = documentManager.getSnapshot().file;
    updateDocument({
      source: workspaceManager.getInitialSource(file),
    });
  }, [documentManager, updateDocument, workspaceManager]);

  const getResetSource = useCallback(
    () => workspaceManager.getInitialSource(documentManager.getSnapshot().file),
    [documentManager, workspaceManager]
  );

  return {
    commands: {
      getResetSource,
      resetSource,
      setScenario,
      setSource,
      updateDocument,
    },
    preview: {
      markError: documentManager.markError,
      markRendered: documentManager.markRendered,
    },
  };
}
