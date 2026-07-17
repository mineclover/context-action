import type { RefObject } from 'react';
import type { PreviewDiagnostic } from '../preview-document';
import type { PreviewSnapshot } from '../workspace';

export type PreviewPanelProps = {
  preview: PreviewSnapshot;
  diagnostics: readonly PreviewDiagnostic[];
  previewStatusLabel: string;
  rootName: string;
  activePath: string;
  revision: number;
  previewDocument: string;
  refreshToken: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  refreshDisabled: boolean;
  onOpenFile: (path: string) => void;
  onRefresh: () => void;
};

export function PreviewPanel({
  preview,
  diagnostics,
  previewStatusLabel,
  rootName,
  activePath,
  revision,
  previewDocument,
  refreshToken,
  iframeRef,
  refreshDisabled,
  onOpenFile,
  onRefresh,
}: PreviewPanelProps) {
  return (
    <aside className="preview-panel">
      <div className="preview-toolbar">
        <div>
          <span className="panel-label">Preview</span>
          <strong>localhost · sandbox</strong>
        </div>
        <span
          aria-live="polite"
          className={`preview-status preview-status-${preview.status}`}
          role="status"
        >
          <span className="status-dot" /> {previewStatusLabel}
        </span>
      </div>
      <div className="browser-frame">
        <div className="browser-chrome">
          <div className="browser-dots">
            <span />
            <span />
            <span />
          </div>
          <div className="address-bar">
            preview://{rootName}/{activePath}
          </div>
          <button
            aria-label="Refresh preview"
            className="refresh-button"
            disabled={refreshDisabled}
            onClick={onRefresh}
            title="Reload the current workspace revision"
            type="button"
          >
            ↻
          </button>
        </div>
        <iframe
          className="preview-iframe"
          ref={iframeRef}
          sandbox="allow-scripts"
          srcDoc={previewDocument}
          title="Live generated web preview"
          key={refreshToken}
        />
      </div>
      {preview.status === 'error' ? (
        <div
          aria-label="Preview runtime error"
          aria-live="assertive"
          className="preview-error-panel"
          role="alert"
        >
          <div className="preview-error-heading">
            <strong>Preview runtime error</strong>
            <button
              aria-label="Refresh preview after runtime error"
              className="preview-error-refresh"
              disabled={refreshDisabled}
              onClick={onRefresh}
              type="button"
            >
              Refresh
            </button>
          </div>
          <code>{preview.message ?? 'The preview failed to load.'}</code>
        </div>
      ) : null}
      {diagnostics.length ? (
        <section
          aria-label="Preview diagnostics"
          aria-live="polite"
          className="preview-diagnostics"
        >
          <div className="preview-diagnostics-heading">
            <strong>Preview diagnostics</strong>
            <span>{diagnostics.length}</span>
          </div>
          <ul>
            {diagnostics.slice(0, 6).map((diagnostic) => (
              <li
                key={`${diagnostic.kind}:${diagnostic.sourcePath}:${diagnostic.requestedPath}`}
              >
                <button
                  aria-label={`Open ${diagnostic.sourcePath} in editor`}
                  className="preview-diagnostic-source"
                  disabled={refreshDisabled}
                  onClick={() => void onOpenFile(diagnostic.sourcePath)}
                  type="button"
                >
                  {diagnostic.sourcePath}
                </button>
                <span>{diagnostic.message}</span>
              </li>
            ))}
          </ul>
          {diagnostics.length > 6 ? (
            <small>+{diagnostics.length - 6} more diagnostic(s)</small>
          ) : null}
        </section>
      ) : null}
      <div className="preview-footer">
        <div>
          <span className="panel-label">Runtime</span>
          <strong>Parent registry → iframe</strong>
        </div>
        <div className={`sync-row sync-row-${preview.status}`}>
          <span className="status-dot" /> revision {revision}{' '}
          {preview.status === 'synced'
            ? 'acknowledged'
            : preview.status === 'error'
              ? (preview.message ?? 'failed')
              : 'pending acknowledgement'}
        </div>
      </div>
    </aside>
  );
}
