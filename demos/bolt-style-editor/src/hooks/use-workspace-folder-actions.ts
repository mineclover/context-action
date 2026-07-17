import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { ToolCall } from '../local-agent-plan';
import type { ConfirmationRequest } from '../views/editor-dialogs';
import { BrowserWorkspace } from '../workspace';
import { WorkspaceToolError } from '../workspace-errors';
import type {
  ImportedFolder,
  WorkspaceFileSystemAdapter,
} from '../workspace-filesystem';
import type {
  EditorMessage,
  ToolExecutionOptions,
  ToolExecutionOutcome,
} from './use-tool-execution';

export type WorkspaceFolderActionsOptions = {
  workspace: BrowserWorkspace;
  fileSystemAdapter: WorkspaceFileSystemAdapter;
  folderInputRef: MutableRefObject<HTMLInputElement | null>;
  isStorageReady: boolean;
  hasWritableFolder: boolean;
  hasUnsavedChanges: boolean;
  running: boolean;
  requestConfirmation: (request: ConfirmationRequest) => Promise<boolean>;
  executeQuickTool: (
    call: ToolCall,
    options?: ToolExecutionOptions
  ) => Promise<ToolExecutionOutcome>;
  setMessages: Dispatch<SetStateAction<EditorMessage[]>>;
  setEditorDrafts: Dispatch<SetStateAction<Record<string, string>>>;
};

function thrownErrorText(error: unknown, fallback: string): string {
  if (error instanceof WorkspaceToolError) {
    const details =
      error.details === undefined
        ? ''
        : `\n${JSON.stringify(error.details, null, 2)}`;
    return `[${error.code}] ${error.message}${details}`;
  }
  return error instanceof Error ? error.message : fallback;
}

export function useWorkspaceFolderActions({
  workspace,
  fileSystemAdapter,
  folderInputRef,
  isStorageReady,
  hasWritableFolder,
  hasUnsavedChanges,
  running,
  requestConfirmation,
  executeQuickTool,
  setMessages,
  setEditorDrafts,
}: WorkspaceFolderActionsOptions) {
  const [openingFolder, setOpeningFolder] = useState(false);

  const refreshPreview = () => {
    if (!isStorageReady) return;
    void executeQuickTool({ name: 'preview.refresh', arguments: {} });
  };

  useEffect(() => {
    folderInputRef.current?.setAttribute('webkitdirectory', '');
  }, []);

  const importFolder = async (imported: ImportedFolder, verb = 'Opened') => {
    await workspace.importFolder(imported);
    setEditorDrafts({});
    const skippedPreview = imported.skipped.slice(0, 3).join(' · ');
    const skippedOverflow = imported.skipped.length - 3;
    const skippedMessage = imported.skipped.length
      ? ` Skipped ${imported.skipped.length} unsupported, oversized, or invalid file(s).${skippedPreview ? ` ${skippedPreview}${skippedOverflow > 0 ? ` · +${skippedOverflow} more` : ''}` : ''}`
      : '';
    const syncMessage = fileSystemAdapter.hasWritableFolder
      ? ' Folder sync is enabled for Save.'
      : ' Changes are saved to the browser workspace.';
    setMessages((current) => [
      ...current,
      {
        role: 'assistant',
        text: `${verb} ${imported.rootName} with ${imported.files.length} file(s).${syncMessage}${skippedMessage}`,
      },
    ]);
  };

  const handleFolderInput = async (fileList: FileList | null) => {
    if (!fileList) return;
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Open selected folder?',
        message:
          'Unsaved browser workspace changes will be discarded before the selected folder is opened.',
        confirmLabel: 'Open folder',
        tone: 'warning',
      }))
    ) {
      if (folderInputRef.current) folderInputRef.current.value = '';
      return;
    }
    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.importFileList(fileList));
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          tone: 'error',
          text: thrownErrorText(error, 'Folder import failed.'),
        },
      ]);
    } finally {
      setOpeningFolder(false);
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleOpenFolder = async () => {
    if (openingFolder || !isStorageReady) return;
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Open a new folder?',
        message:
          'Unsaved browser workspace changes will be discarded before the new folder is opened.',
        confirmLabel: 'Open folder',
        tone: 'warning',
      }))
    ) {
      return;
    }
    const picker = (
      window as Window & {
        showDirectoryPicker?: unknown;
      }
    ).showDirectoryPicker;
    if (!picker) {
      folderInputRef.current?.click();
      return;
    }

    setOpeningFolder(true);
    try {
      await importFolder(await fileSystemAdapter.pickFolder());
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          tone: 'error',
          text: thrownErrorText(error, 'Folder import failed.'),
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleReloadFolder = async () => {
    if (openingFolder || !isStorageReady || !hasWritableFolder) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Reload connected folder?',
        message:
          'The browser workspace will be replaced with the connected folder contents. Unsaved changes will be discarded.',
        confirmLabel: 'Reload folder',
        tone: 'warning',
      }))
    ) {
      return;
    }

    setOpeningFolder(true);
    try {
      setEditorDrafts({});
      await executeQuickTool(
        {
          name: 'workspace.reloadFolder',
          arguments: {
            expectedRevision: workspace.getSnapshot().revision,
          },
        },
        { skipDraftFlush: true }
      );
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          tone: 'error',
          text: thrownErrorText(error, 'Folder reload failed.'),
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const handleDisconnectFolder = async () => {
    if (openingFolder || !isStorageReady || !hasWritableFolder) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Disconnect folder?',
        message:
          'The folder connection will be removed. Current changes will remain only in the browser workspace.',
        confirmLabel: 'Disconnect',
        tone: 'warning',
      }))
    ) {
      return;
    }

    await executeQuickTool({
      name: 'workspace.disconnectFolder',
      arguments: {},
    });
  };

  const handleGrantFolderAccess = async () => {
    if (openingFolder || !isStorageReady || !hasWritableFolder) return;
    setOpeningFolder(true);
    try {
      const permission = await fileSystemAdapter.requestWritePermission();
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            permission === 'granted'
              ? 'Write access restored for the connected folder.'
              : `Folder write access is ${permission}. Use the browser permission prompt to continue saving.`,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            error instanceof Error
              ? error.message
              : 'Folder permission request failed.',
        },
      ]);
    } finally {
      setOpeningFolder(false);
    }
  };

  const resetDemoWorkspace = async () => {
    if (running || !isStorageReady || hasWritableFolder) {
      return;
    }
    if (
      hasUnsavedChanges &&
      !(await requestConfirmation({
        title: 'Reset demo workspace?',
        message:
          'The browser workspace will return to the demo seed. Current changes will be discarded.',
        confirmLabel: 'Reset workspace',
        tone: 'danger',
      }))
    ) {
      return;
    }

    setEditorDrafts({});
    await executeQuickTool(
      {
        name: 'workspace.reset',
        arguments: { expectedRevision: workspace.getSnapshot().revision },
      },
      { skipDraftFlush: true }
    );
  };
  return {
    openingFolder,
    refreshPreview,
    handleFolderInput,
    handleOpenFolder,
    handleReloadFolder,
    handleDisconnectFolder,
    handleGrantFolderAccess,
    resetDemoWorkspace,
  };
}
