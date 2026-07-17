import { useEffect, useState } from 'react';
import type { WorkspaceFileChange, WorkspaceVersion } from '../version-diff';

export type VersionDiffDialogProps = {
  version: WorkspaceVersion;
  previousVersion?: WorkspaceVersion;
  onClose: () => void;
};

function fileChangeLabel(change: WorkspaceFileChange): string {
  switch (change.kind) {
    case 'added':
      return 'A';
    case 'removed':
      return 'D';
    case 'renamed':
      return 'R';
    default:
      return 'M';
  }
}

export function VersionDiffDialog({
  version,
  previousVersion,
  onClose,
}: VersionDiffDialogProps) {
  const [selectedPath, setSelectedPath] = useState(
    version.change.files[0]?.path ?? ''
  );
  useEffect(() => {
    setSelectedPath(version.change.files[0]?.path ?? '');
  }, [version]);
  const selectedChange = version.change.files.find(
    (change) => change.path === selectedPath
  );

  return (
    <div className="version-diff-backdrop" role="presentation">
      <section
        aria-describedby="version-diff-description"
        aria-labelledby="version-diff-title"
        aria-modal="true"
        className="version-diff-dialog"
        role="dialog"
      >
        <div className="version-diff-heading">
          <div>
            <span className="panel-label">Version feedback</span>
            <h2 id="version-diff-title">Revision {version.revision} diff</h2>
          </div>
          <button
            aria-label="Close version diff"
            className="version-diff-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p id="version-diff-description" className="version-diff-summary">
          Compared with revision{' '}
          {previousVersion?.revision ?? 'the initial snapshot'} ·{' '}
          {version.change.files.length} file(s) · +{version.change.additions} /
          −{version.change.deletions} lines
        </p>
        {version.change.files.length ? (
          <div className="version-diff-layout">
            <nav aria-label="Changed files" className="version-file-list">
              {version.change.files.map((change) => (
                <button
                  aria-current={
                    change.path === selectedPath ? 'true' : undefined
                  }
                  className={`version-file-button ${change.path === selectedPath ? 'version-file-button-active' : ''}`}
                  key={`${change.kind}-${change.path}`}
                  onClick={() => setSelectedPath(change.path)}
                  type="button"
                >
                  <span
                    className={`version-file-kind version-file-kind-${change.kind}`}
                  >
                    {fileChangeLabel(change)}
                  </span>
                  <span>{change.path}</span>
                  <small>
                    +{change.additions} / −{change.deletions}
                  </small>
                </button>
              ))}
            </nav>
            <div className="version-diff-code-wrap">
              {selectedChange ? (
                <>
                  <div className="version-diff-file-heading">
                    <strong>{selectedChange.path}</strong>
                    <span>{selectedChange.kind}</span>
                  </div>
                  <div
                    aria-label={`Diff for ${selectedChange.path}`}
                    className="version-diff-code"
                    role="region"
                  >
                    {selectedChange.diff.map((line, index) => (
                      <div
                        className={`version-diff-line version-diff-line-${line.kind}`}
                        key={`${index}-${line.kind}`}
                      >
                        <span className="version-diff-marker">
                          {line.kind === 'added'
                            ? '+'
                            : line.kind === 'removed'
                              ? '−'
                              : ' '}
                        </span>
                        <span className="version-diff-number">
                          {line.oldLine ?? ''}
                        </span>
                        <span className="version-diff-number">
                          {line.newLine ?? ''}
                        </span>
                        <code>{line.text || ' '}</code>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="version-empty">
            No file content changes were captured for this revision.
          </p>
        )}
        <div className="version-diff-footer">
          <span>
            Workspace revision is observable and reversible with Undo.
          </span>
          <button className="version-diff-done" onClick={onClose} type="button">
            Done
          </button>
        </div>
      </section>
    </div>
  );
}
