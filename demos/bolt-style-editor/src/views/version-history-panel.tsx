import type { WorkspaceVersion } from '../version-diff';

export type VersionHistoryPanelProps = {
  versions: readonly WorkspaceVersion[];
  isStorageReady: boolean;
  onOpenDiff: (versionId: string) => void;
};

function changeLabel(version: WorkspaceVersion): string {
  if (!version.change.files.length) return 'Initial workspace snapshot';
  return `${version.change.files.length} file(s) · +${version.change.additions} / −${version.change.deletions} lines`;
}

export function VersionHistoryPanel({
  versions,
  isStorageReady,
  onOpenDiff,
}: VersionHistoryPanelProps) {
  const latestVersion = versions.at(-1);
  const recentVersions = versions.slice(-4).reverse();

  return (
    <section
      aria-label="Workspace version history"
      className="version-history-section"
    >
      <div className="sidebar-section-heading">
        <span>Version history</span>
        <span className="count-badge">{versions.length}</span>
      </div>
      {latestVersion ? (
        <div className="version-latest-card">
          <div className="version-card-heading">
            <strong>Latest feedback</strong>
            <span>rev {latestVersion.revision}</span>
          </div>
          <p>{changeLabel(latestVersion)}</p>
          <button
            aria-label="View latest workspace diff"
            className="version-diff-button"
            disabled={!isStorageReady || !latestVersion.change.files.length}
            onClick={() => onOpenDiff(latestVersion.id)}
            type="button"
          >
            View diff
          </button>
        </div>
      ) : (
        <p className="version-empty">Capturing the first workspace revision…</p>
      )}
      <div aria-label="Recent workspace revisions" className="version-list">
        {recentVersions.map((version) => (
          <button
            aria-label={`Open revision ${version.revision} diff`}
            className="version-row"
            disabled={!isStorageReady || !version.change.files.length}
            key={version.id}
            onClick={() => onOpenDiff(version.id)}
            type="button"
          >
            <span className="version-row-mark">{version.revision}</span>
            <span className="version-row-copy">
              <strong>{version.activePath}</strong>
              <small>{changeLabel(version)}</small>
            </span>
            <span className="version-row-arrow">›</span>
          </button>
        ))}
      </div>
    </section>
  );
}
