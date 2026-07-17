import { useCallback } from 'react';
import type { LiveEditorDocumentManager } from '../../../../lib/live-code-editor-bridge';
import type { LiveEditorWorkspaceManager } from '../../../../lib/live-code-editor-workspace';

interface LiveEditorDocumentActionOptions {
  documentManager: LiveEditorDocumentManager;
  workspaceManager: LiveEditorWorkspaceManager;
}

export function useLiveEditorDocumentActions({
  documentManager,
  workspaceManager,
}: LiveEditorDocumentActionOptions) {
  const setSource = useCallback(
    (source: string) => documentManager.update({ source }),
    [documentManager]
  );

  const setScenario = useCallback(
    (scenario: string) => documentManager.update({ scenario }),
    [documentManager]
  );

  const resetSource = useCallback(() => {
    const file = documentManager.getSnapshot().file;
    documentManager.update({
      source: workspaceManager.getInitialSource(file),
    });
  }, [documentManager, workspaceManager]);

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
    },
    preview: {
      markError: documentManager.markError,
      markRendered: documentManager.markRendered,
    },
  };
}
