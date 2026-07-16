import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useEffect } from 'react';
import type { ToolCall } from '../local-agent-plan';
import type { ConfirmationRequest } from '../views/editor-dialogs';
import { BrowserWorkspace } from '../workspace';
import type {
  ToolExecutionOptions,
  ToolExecutionOutcome,
} from './use-tool-execution';

export type WorkspaceKeyboardShortcutsOptions = {
  showSettings: boolean;
  showCreateFile: boolean;
  showRenameFile: boolean;
  confirmationRequest: ConfirmationRequest | null;
  quickOpenOpen: boolean;
  workspaceSearchOpen: boolean;
  running: boolean;
  saving: boolean;
  isStorageReady: boolean;
  hasUnsavedChanges: boolean;
  workspace: BrowserWorkspace;
  executionControllerRef: MutableRefObject<AbortController | null>;
  setQuickOpenOpen: Dispatch<SetStateAction<boolean>>;
  cancelExecution: () => void;
  saveWorkspace: () => Promise<void>;
  executeQuickTool: (
    call: ToolCall,
    options?: ToolExecutionOptions
  ) => Promise<ToolExecutionOutcome>;
};

export function useWorkspaceKeyboardShortcuts({
  showSettings,
  showCreateFile,
  showRenameFile,
  confirmationRequest,
  quickOpenOpen,
  workspaceSearchOpen,
  running,
  saving,
  isStorageReady,
  hasUnsavedChanges,
  workspace,
  executionControllerRef,
  setQuickOpenOpen,
  cancelExecution,
  saveWorkspace,
  executeQuickTool,
}: WorkspaceKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleSaveShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !(event.metaKey || event.ctrlKey) ||
        event.key.toLowerCase() !== 's' ||
        showSettings ||
        showCreateFile ||
        showRenameFile ||
        confirmationRequest ||
        quickOpenOpen ||
        workspaceSearchOpen
      ) {
        return;
      }
      event.preventDefault();
      void saveWorkspace();
    };

    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [
    confirmationRequest,
    quickOpenOpen,
    saveWorkspace,
    showCreateFile,
    showRenameFile,
    showSettings,
    workspaceSearchOpen,
  ]);

  useEffect(() => {
    const handleQuickOpenShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        event.key.toLowerCase() !== 'p' ||
        showSettings ||
        showCreateFile ||
        showRenameFile ||
        confirmationRequest ||
        workspaceSearchOpen
      ) {
        return;
      }
      event.preventDefault();
      setQuickOpenOpen(true);
    };

    window.addEventListener('keydown', handleQuickOpenShortcut);
    return () => window.removeEventListener('keydown', handleQuickOpenShortcut);
  }, [
    confirmationRequest,
    setQuickOpenOpen,
    showCreateFile,
    showRenameFile,
    showSettings,
    workspaceSearchOpen,
  ]);

  useEffect(() => {
    if (
      !running ||
      showSettings ||
      showCreateFile ||
      showRenameFile ||
      confirmationRequest ||
      quickOpenOpen ||
      workspaceSearchOpen
    ) {
      return;
    }
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      cancelExecution();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [
    cancelExecution,
    confirmationRequest,
    quickOpenOpen,
    running,
    showCreateFile,
    showRenameFile,
    showSettings,
    workspaceSearchOpen,
  ]);

  useEffect(() => {
    const handleHistoryShortcut = (event: globalThis.KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        !(event.metaKey || event.ctrlKey) ||
        event.altKey ||
        showSettings ||
        showCreateFile ||
        showRenameFile ||
        confirmationRequest ||
        quickOpenOpen ||
        workspaceSearchOpen ||
        running ||
        executionControllerRef.current ||
        saving ||
        !isStorageReady
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const undo = key === 'z' && !event.shiftKey;
      const redo =
        (key === 'z' && event.shiftKey) || (key === 'y' && !event.shiftKey);
      if (!undo && !redo) return;
      if (undo && !workspace.canUndo() && !hasUnsavedChanges) return;
      if (redo && !workspace.canRedo()) return;

      event.preventDefault();
      void executeQuickTool({
        name: redo ? 'workspace.redo' : 'workspace.undo',
        arguments: { expectedRevision: workspace.getSnapshot().revision },
      });
    };

    window.addEventListener('keydown', handleHistoryShortcut);
    return () => window.removeEventListener('keydown', handleHistoryShortcut);
  }, [
    confirmationRequest,
    executeQuickTool,
    executionControllerRef,
    hasUnsavedChanges,
    isStorageReady,
    quickOpenOpen,
    running,
    saving,
    showCreateFile,
    showRenameFile,
    showSettings,
    workspace,
    workspaceSearchOpen,
  ]);
}
