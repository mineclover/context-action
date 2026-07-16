import type { WorkspaceFile } from '../workspace';
import { CodeEditor, type WorkspaceSearchFocusRequest } from './code-editor';

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export type WorkspaceSourcePanelProps = {
  activeFile: WorkspaceFile;
  activeTabId: string;
  disabled: boolean;
  source: string;
  focusRequest?: WorkspaceSearchFocusRequest;
  onFocusRequestConsumed: () => void;
  onOpenWorkspaceSearch: () => void;
  onBlur: () => void;
  onChange: (source: string) => void;
};

export function WorkspaceSourcePanel({
  activeFile,
  activeTabId,
  disabled,
  source,
  focusRequest,
  onFocusRequestConsumed,
  onOpenWorkspaceSearch,
  onBlur,
  onChange,
}: WorkspaceSourcePanelProps) {
  return (
    <section
      aria-label="Workspace source"
      aria-labelledby={activeTabId}
      className="code-editor"
      id="workspace-source-panel"
      role="tabpanel"
      tabIndex={0}
    >
      {activeFile.kind === 'asset' ? (
        <>
          <div className="code-header">
            <span>{activeFile.language}</span>
            <span>preview asset · read-only</span>
          </div>
          <div className="asset-placeholder">
            <div className="asset-placeholder-icon">◇</div>
            <strong>{activeFile.path}</strong>
            <span>
              {activeFile.mimeType ?? 'binary asset'} ·{' '}
              {formatFileSize(activeFile.blob?.size ?? 0)}
            </span>
            <p>
              This Blob is preserved in the browser workspace and available to
              the sandbox preview. Binary assets are not edited as text.
            </p>
          </div>
        </>
      ) : (
        <CodeEditor
          disabled={disabled}
          file={activeFile}
          focusRequest={focusRequest}
          onFocusRequestConsumed={onFocusRequestConsumed}
          onOpenWorkspaceSearch={onOpenWorkspaceSearch}
          onBlur={onBlur}
          onChange={onChange}
          source={source}
        />
      )}
    </section>
  );
}
