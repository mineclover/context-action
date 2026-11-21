import { useCallback } from 'react';
import {
  useHeadlessDocumentControls,
  useHeadlessSessionStore,
  useHeadlessWorkspaceDispatch,
} from '../contexts/HeadlessDiContexts';

export function useHeadlessDiActions() {
  const dispatch = useHeadlessWorkspaceDispatch();
  const viewLocalStore = useHeadlessSessionStore('viewLocal');
  const controls = useHeadlessDocumentControls('document');

  const updateTitle = useCallback(
    async (title: string) => {
      await dispatch('updateTitle', { title, source: 'react' });
    },
    [dispatch]
  );

  const appendBullet = useCallback(
    async (text: string) => {
      await dispatch('appendBullet', { text, source: 'react' });
    },
    [dispatch]
  );

  const publishSnapshot = useCallback(async () => {
    await dispatch('publishSnapshot', { source: 'react' });
  }, [dispatch]);

  const resetWorkspace = useCallback(async () => {
    await dispatch('resetWorkspace');
  }, [dispatch]);

  const setViewFilterTag = useCallback(
    (filterTag: 'all' | 'react' | 'headless') => {
      viewLocalStore.update((draft) => {
        draft.filterTag = filterTag;
        return undefined;
      });
    },
    [viewLocalStore]
  );

  return {
    updateTitle,
    appendBullet,
    publishSnapshot,
    resetWorkspace,
    setViewFilterTag,
    undoDocument: controls.undo,
    redoDocument: controls.redo,
  };
}
