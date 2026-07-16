import type { KeyboardEvent, RefObject } from 'react';
import type { WorkspaceFile } from '../workspace';
import { FileIcon } from './file-icon';

export type WorkspaceEditorToolbarProps = {
  files: readonly WorkspaceFile[];
  activeFile: WorkspaceFile;
  activePath: string;
  dirtyPaths: ReadonlySet<string>;
  editorTabsRef: RefObject<HTMLDivElement | null>;
  isStorageReady: boolean;
  running: boolean;
  saving: boolean;
  hasUnsavedChanges: boolean;
  hasUnpersistedEditorDrafts: boolean;
  hasWritableFolder: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canDelete: boolean;
  canRevert: boolean;
  revision: number;
  workspaceSearchOpen: boolean;
  workspaceSearchTriggerRef: RefObject<HTMLButtonElement | null>;
  onOpenFile: (path: string) => void;
  onTabKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => void;
  onQuickOpen: () => void;
  onToggleSearch: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onRename: () => void;
  onDelete: () => void;
  onRevert: () => void;
  onDownload: () => void;
  onSave: () => void;
};

export function WorkspaceEditorToolbar({
  files,
  activeFile,
  activePath,
  dirtyPaths,
  editorTabsRef,
  isStorageReady,
  running,
  saving,
  hasUnsavedChanges,
  hasUnpersistedEditorDrafts,
  hasWritableFolder,
  canUndo,
  canRedo,
  canDelete,
  canRevert,
  revision,
  workspaceSearchOpen,
  workspaceSearchTriggerRef,
  onOpenFile,
  onTabKeyDown,
  onQuickOpen,
  onToggleSearch,
  onUndo,
  onRedo,
  onRename,
  onDelete,
  onRevert,
  onDownload,
  onSave,
}: WorkspaceEditorToolbarProps) {
  return (
    <div className="editor-toolbar">
      <div
        aria-label="Open workspace files"
        className="editor-tabs"
        ref={editorTabsRef}
        role="tablist"
      >
        {files.map((file, index) => (
          <button
            aria-selected={file.path === activePath}
            aria-controls="workspace-source-panel"
            className={`editor-tab ${file.path === activePath ? 'editor-tab-active' : ''}`}
            disabled={!isStorageReady || running}
            id={`workspace-tab-${index}`}
            key={file.path}
            onClick={() => onOpenFile(file.path)}
            onKeyDown={(event) => onTabKeyDown(event, index)}
            role="tab"
            tabIndex={file.path === activePath ? 0 : -1}
            type="button"
          >
            <FileIcon file={file} />
            {file.path}
            {dirtyPaths.has(file.path) ? (
              <span
                aria-label="Unsaved changes"
                className="tab-dirty-dot"
                title="Unsaved changes"
              >
                •
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <div className="editor-controls">
        <button
          aria-keyshortcuts="Control+P Meta+P"
          aria-label="Quick open workspace file"
          className="editor-action"
          disabled={!isStorageReady || running}
          onClick={onQuickOpen}
          title="Quick open a workspace file (⌘/Ctrl+P)"
          type="button"
        >
          Quick open
        </button>
        <button
          aria-keyshortcuts="Control+Shift+F Meta+Shift+F"
          aria-label={
            workspaceSearchOpen ? 'Close workspace search' : 'Search workspace'
          }
          aria-controls="workspace-search-panel"
          aria-expanded={workspaceSearchOpen}
          className={`editor-action editor-search ${workspaceSearchOpen ? 'editor-search-active' : ''}`}
          disabled={!isStorageReady || running}
          onClick={onToggleSearch}
          ref={workspaceSearchTriggerRef}
          title="Search all workspace files (⌘/Ctrl+Shift+F)"
          type="button"
        >
          {workspaceSearchOpen ? 'Close search' : 'Search'}
        </button>
        <button
          aria-label="Undo last edit"
          aria-keyshortcuts="Control+Z Meta+Z"
          className="editor-action"
          disabled={!isStorageReady || running || !canUndo}
          onClick={onUndo}
          title="Undo through workspace.undo"
          type="button"
        >
          ↶ Undo
        </button>
        <button
          aria-label="Redo last edit"
          aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y"
          className="editor-action"
          disabled={!isStorageReady || running || !canRedo}
          onClick={onRedo}
          title="Redo through workspace.redo"
          type="button"
        >
          ↷ Redo
        </button>
        <button
          aria-label={`Rename ${activeFile.path}`}
          className="editor-action"
          disabled={!isStorageReady || running}
          onClick={onRename}
          title="Rename the active file through workspace.renameFile"
          type="button"
        >
          Rename
        </button>
        <button
          aria-label={`Delete ${activeFile.path}`}
          className="editor-delete"
          disabled={!isStorageReady || running || !canDelete}
          onClick={onDelete}
          title="Delete the active file through workspace.deleteFile"
          type="button"
        >
          Delete
        </button>
        <button
          aria-label={`Revert ${activeFile.path}`}
          className="editor-revert"
          disabled={!isStorageReady || running || !canRevert}
          onClick={onRevert}
          title="Discard active file changes through workspace.revertFile"
          type="button"
        >
          Revert
        </button>
        <button
          aria-label={`Download ${activeFile.path}`}
          className="editor-download"
          disabled={!isStorageReady || running}
          onClick={onDownload}
          title="Download the active source or Blob asset"
          type="button"
        >
          Download
        </button>
        <button
          aria-keyshortcuts="Control+S Meta+S"
          className="editor-save"
          disabled={
            !isStorageReady ||
            running ||
            saving ||
            !hasUnsavedChanges ||
            hasUnpersistedEditorDrafts
          }
          onClick={onSave}
          title={
            hasUnpersistedEditorDrafts
              ? 'Syncing the editor draft before saving'
              : hasWritableFolder
                ? 'Write dirty files to the selected folder and IndexedDB'
                : 'Mark the current browser workspace checkpoint as saved'
          }
          type="button"
        >
          {saving
            ? 'Saving…'
            : hasUnpersistedEditorDrafts
              ? 'Syncing…'
              : hasWritableFolder
                ? 'Save to folder'
                : 'Save'}
        </button>
        <span
          aria-live="polite"
          className={`save-status ${hasUnsavedChanges ? 'save-status-dirty' : ''}`}
          role="status"
        >
          <span className="status-dot" />
          {hasUnsavedChanges ? 'Unsaved changes' : 'Saved'}
        </span>
        <span className="revision-label">revision {revision}</span>
      </div>
    </div>
  );
}
