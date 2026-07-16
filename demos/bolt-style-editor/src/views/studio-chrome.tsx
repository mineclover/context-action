export type StudioTopbarProps = {
  rootName: string;
  agentLabel: string;
  storageLabel: string;
  storageError?: string;
  storageErrorLabel: string | null;
  showFolderSync: boolean;
  restoreState: string;
  folderLinkUnavailable: boolean;
  permission: string;
  permissionLabel: string;
  toolCount: number;
  onOpenSettings: () => void;
};

export function StudioTopbar({
  rootName,
  agentLabel,
  storageLabel,
  storageError,
  storageErrorLabel,
  showFolderSync,
  restoreState,
  folderLinkUnavailable,
  permission,
  permissionLabel,
  toolCount,
  onOpenSettings,
}: StudioTopbarProps) {
  return (
    <header className="studio-topbar">
      <div className="brand-lockup">
        <span className="brand-mark">✦</span>
        <span>Context-Action</span>
        <span className="brand-divider">/</span>
        <strong>Web Studio</strong>
      </div>
      <div className="topbar-center">
        <span className="workspace-name">{rootName}</span>
        <span className="mode-chip">
          <span className="status-dot" />
          {agentLabel}
        </span>
        <span className="storage-chip" title={storageError ?? undefined}>
          {storageLabel}
        </span>
        {storageErrorLabel ? (
          <span
            aria-label={`${storageErrorLabel}: ${storageError}`}
            className="storage-error-chip"
            role="status"
            title={storageError}
          >
            {storageErrorLabel}
          </span>
        ) : null}
        {showFolderSync ? (
          <span
            className={`folder-sync-chip folder-sync-${permission} folder-sync-restore-${restoreState}`}
            title={
              restoreState === 'restoring'
                ? 'Restoring the persisted folder connection'
                : folderLinkUnavailable
                  ? 'The browser workspace is available; open the folder again to reconnect'
                  : 'Writable folder permission status'
            }
          >
            {permissionLabel}
          </span>
        ) : null}
        <span className="contract-chip">tools/list · {toolCount}</span>
      </div>
      <div className="topbar-actions">
        <button
          aria-label="Open OpenRouter settings"
          className="settings-trigger"
          onClick={() => onOpenSettings()}
          type="button"
        >
          ⚙ Settings
        </button>
        <a
          href="https://github.com/mineclover/context-action"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        <a
          href="https://mineclover.github.io/context-action/example/integrations/live-web-coding"
          target="_blank"
          rel="noreferrer"
        >
          Full demo ↗
        </a>
        <a
          href="https://mineclover.github.io/context-action/example/catalog/integrations/mcp-function-calling"
          target="_blank"
          rel="noreferrer"
        >
          MCP catalog ↗
        </a>
      </div>
    </header>
  );
}

export type StudioStatusBarProps = {
  statusTone: string;
  status: string;
  providerStatusLabel: string;
  persistenceLabel: string;
};

export function StudioStatusBar({
  statusTone,
  status,
  providerStatusLabel,
  persistenceLabel,
}: StudioStatusBarProps) {
  return (
    <footer className="studio-statusbar">
      <span className={`statusbar-state statusbar-state-${statusTone}`}>
        <span className="status-dot" /> {status}
      </span>
      <span>{providerStatusLabel}</span>
      <span>{persistenceLabel}</span>
      <span className="statusbar-spacer" />
      <span>HTML · CSS · JS</span>
    </footer>
  );
}
