import type { ReactNode, RefObject } from 'react';
import type { FileSystemPermissionStatus } from '../workspace-filesystem';

export type WorkspaceExplorerPanelProps = {
  rootName: string;
  isStorageReady: boolean;
  openingFolder: boolean;
  running: boolean;
  hasWritableFolder: boolean;
  folderPermissionNeedsAction: boolean;
  folderPermission: FileSystemPermissionStatus;
  folderInputRef: RefObject<HTMLInputElement | null>;
  fileTree: ReactNode;
  onCreateFile: () => void;
  onResetWorkspace: () => void;
  onGrantFolderAccess: () => void;
  onReloadFolder: () => void;
  onDisconnectFolder: () => void;
  onOpenFolder: () => void;
  onFolderInputChange: (files: FileList | null) => void;
};

export function WorkspaceExplorerPanel({
  rootName,
  isStorageReady,
  openingFolder,
  running,
  hasWritableFolder,
  folderPermissionNeedsAction,
  folderPermission,
  folderInputRef,
  fileTree,
  onCreateFile,
  onResetWorkspace,
  onGrantFolderAccess,
  onReloadFolder,
  onDisconnectFolder,
  onOpenFolder,
  onFolderInputChange,
}: WorkspaceExplorerPanelProps) {
  return (
    <>
      <div className="explorer-heading">
        <div className="panel-label">Explorer</div>
        <div className="explorer-actions">
          <button
            aria-label="Create new workspace file"
            className="new-file-button"
            disabled={openingFolder || !isStorageReady || running}
            onClick={() => onCreateFile()}
            title="Create a new text file"
            type="button"
          >
            + New
          </button>
          <button
            aria-label="Reset browser demo workspace"
            className="reset-workspace-button"
            disabled={
              openingFolder || !isStorageReady || running || hasWritableFolder
            }
            onClick={() => onResetWorkspace()}
            title="Restore the browser workspace to the demo seed"
            type="button"
          >
            Reset
          </button>
          {hasWritableFolder ? (
            <>
              {folderPermissionNeedsAction ? (
                <button
                  aria-label="Grant connected folder write access"
                  className="grant-folder-button"
                  disabled={openingFolder || !isStorageReady || running}
                  onClick={() => onGrantFolderAccess()}
                  title="Request write permission for the connected folder"
                  type="button"
                >
                  {folderPermission === 'denied'
                    ? 'Retry access'
                    : 'Grant access'}
                </button>
              ) : null}
              <button
                aria-label="Reload connected workspace folder"
                className="refresh-folder-button"
                disabled={openingFolder || !isStorageReady || running}
                onClick={() => onReloadFolder()}
                title="Re-read files from the connected folder"
                type="button"
              >
                {openingFolder ? 'Reloading…' : 'Reload'}
              </button>
              <button
                aria-label="Disconnect linked workspace folder"
                className="disconnect-folder-button"
                disabled={openingFolder || !isStorageReady || running}
                onClick={() => onDisconnectFolder()}
                title="Keep the browser workspace but stop local folder sync"
                type="button"
              >
                Disconnect
              </button>
            </>
          ) : null}
          <button
            className="open-folder-button"
            disabled={openingFolder || !isStorageReady || running}
            onClick={() => onOpenFolder()}
            type="button"
          >
            {openingFolder ? 'Opening…' : 'Open'}
          </button>
        </div>
        <input
          ref={folderInputRef}
          accept=".avif,.css,.gif,.htm,.html,.ico,.jpeg,.jpg,.js,.json,.mjs,.md,.otf,.png,.svg,.ts,.tsx,.ttf,.txt,.wasm,.webp,.woff,.woff2"
          aria-label="Choose workspace folder"
          className="folder-input"
          multiple
          onChange={(event) => void onFolderInputChange(event.target.files)}
          type="file"
        />
      </div>
      <div className="tree-root">
        <span>⌄</span> {rootName}
      </div>
      {fileTree}
    </>
  );
}
