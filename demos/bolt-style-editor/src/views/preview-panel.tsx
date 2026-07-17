import { type RefObject, useEffect, useRef, useState } from 'react';
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
  exportDisabled: boolean;
  onOpenFile: (path: string) => void;
  onExport: () => void;
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
  exportDisabled,
  onOpenFile,
  onExport,
  onRefresh,
}: PreviewPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsFullscreen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('preview-fullscreen-open');
    window.requestAnimationFrame(() => fullscreenButtonRef.current?.focus());
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('preview-fullscreen-open');
    };
  }, [isFullscreen]);

  return (
    <aside
      aria-label="Live generated web preview"
      aria-modal={isFullscreen || undefined}
      className={`preview-panel ${isFullscreen ? 'preview-panel-fullscreen' : ''}`}
      role={isFullscreen ? 'dialog' : undefined}
    >
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
          <div className="preview-chrome-actions">
            <button
              aria-label="Export preview HTML"
              className="preview-action-button"
              disabled={exportDisabled}
              onClick={onExport}
              title="Download the current preview as a standalone HTML file"
              type="button"
            >
              Export
            </button>
            <button
              aria-label={
                isFullscreen
                  ? 'Exit preview full screen'
                  : 'Open preview full screen'
              }
              aria-pressed={isFullscreen}
              className="preview-action-button"
              onClick={() => setIsFullscreen((current) => !current)}
              ref={fullscreenButtonRef}
              title={
                isFullscreen
                  ? 'Return to the editor layout (Esc)'
                  : 'View the preview in a full-screen panel'
              }
              type="button"
            >
              {isFullscreen ? 'Exit' : 'Full screen'}
            </button>
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
