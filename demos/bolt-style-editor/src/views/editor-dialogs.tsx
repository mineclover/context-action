import { type FormEvent, useEffect, useRef, useState } from 'react';
import type { ToolExecutionOutcome } from '../hooks/use-tool-execution';
import {
  DEFAULT_OPENROUTER_SETTINGS,
  type OpenRouterSettings,
} from '../openrouter';
import { MAX_TEXT_SOURCE_LENGTH } from '../workspace';

export type ConfirmationRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  tone?: 'danger' | 'warning';
};

export function useModalDialog<T extends HTMLElement>(onClose: () => void) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousActiveElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    const focusableSelector =
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';
    const getFocusableElements = () =>
      Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));

    getFocusableElements()[0]?.focus();
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (!focusableElements.length) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      if (previousActiveElement?.isConnected) previousActiveElement.focus();
    };
  }, []);

  return dialogRef;
}

export function ConfirmationDialog({
  request,
  onResolve,
}: {
  request: ConfirmationRequest;
  onResolve: (confirmed: boolean) => void;
}) {
  const dialogRef = useModalDialog<HTMLElement>(() => onResolve(false));
  const tone = request.tone ?? 'warning';

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onResolve(false);
      }}
      role="presentation"
    >
      <section
        aria-describedby="confirmation-dialog-message"
        aria-labelledby="confirmation-dialog-title"
        aria-modal="true"
        className={`settings-dialog confirmation-dialog confirmation-dialog-${tone}`}
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Confirm action</span>
            <h2 id="confirmation-dialog-title">{request.title}</h2>
          </div>
          <button
            aria-label="Close confirmation dialog"
            className="settings-close"
            onClick={() => onResolve(false)}
            type="button"
          >
            ×
          </button>
        </div>
        <p
          className="confirmation-dialog-message"
          id="confirmation-dialog-message"
        >
          {request.message}
        </p>
        <div className="confirmation-actions">
          <button
            className="settings-cancel"
            onClick={() => onResolve(false)}
            type="button"
          >
            Cancel
          </button>
          <button
            className={`confirmation-confirm confirmation-confirm-${tone}`}
            onClick={() => onResolve(true)}
            type="button"
          >
            {request.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function OpenRouterSettingsDialog({
  initialSettings,
  onClose,
  onSave,
}: {
  initialSettings: OpenRouterSettings;
  onClose: () => void;
  onSave: (settings: OpenRouterSettings) => void;
}) {
  const [draft, setDraft] = useState(initialSettings);
  const [showKey, setShowKey] = useState(false);
  const dialogRef = useModalDialog<HTMLElement>(onClose);

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="openrouter-settings-title"
        aria-modal="true"
        className="settings-dialog"
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Provider settings</span>
            <h2 id="openrouter-settings-title">OpenRouter API</h2>
          </div>
          <button
            aria-label="Close OpenRouter settings"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <p className="settings-intro">
          Save a user-owned key for direct browser requests. The local agent
          remains available when no key is configured.
        </p>

        <label className="settings-field">
          <span>OpenRouter API key</span>
          <div className="secret-input-wrap">
            <input
              autoFocus
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  apiKey: event.target.value,
                }))
              }
              placeholder="sk-or-v1-…"
              type={showKey ? 'text' : 'password'}
              value={draft.apiKey}
            />
            <button
              className="reveal-button"
              onClick={() => setShowKey((current) => !current)}
              type="button"
            >
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>

        <label className="settings-field">
          <span>Model ID</span>
          <input
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                model: event.target.value,
              }))
            }
            placeholder="openai/gpt-4o-mini"
            value={draft.model}
          />
        </label>

        <label className="settings-field">
          <span>Chat completions endpoint</span>
          <input
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                endpoint: event.target.value,
              }))
            }
            value={draft.endpoint}
          />
        </label>

        <div className="settings-note">
          <span className="status-dot" />
          Stored in this browser origin and sent directly to the configured
          endpoint. The API key uses the shared
          <code>context-action.openrouter.api-key</code> entry and is reused by
          the example OpenRouter demos on this origin. Model and endpoint
          settings remain standalone-specific. It is not committed to the
          repository.
        </div>

        <div className="settings-actions">
          <button
            className="settings-reset"
            onClick={() =>
              setDraft({
                ...DEFAULT_OPENROUTER_SETTINGS,
                apiKey: '',
              })
            }
            type="button"
          >
            Clear key
          </button>
          <div>
            <button className="settings-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="settings-save"
              onClick={() => {
                onSave(draft);
                onClose();
              }}
              type="button"
            >
              Save settings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function CreateWorkspaceFileDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (path: string, source: string) => Promise<ToolExecutionOutcome>;
}) {
  const [path, setPath] = useState('notes.md');
  const [source, setSource] = useState('# New workspace file\n');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dialogRef = useModalDialog<HTMLFormElement>(onClose);
  const sourceLengthLabel = `${source.length.toLocaleString('en-US')} / ${MAX_TEXT_SOURCE_LENGTH.toLocaleString('en-US')} chars`;
  const sourceExceedsLimit = source.length > MAX_TEXT_SOURCE_LENGTH;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !path.trim()) return;
    if (sourceExceedsLimit) {
      setErrorMessage(
        `Initial source exceeds the ${MAX_TEXT_SOURCE_LENGTH.toLocaleString('en-US')} character limit.`
      );
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const outcome = await onCreate(path, source);
      if (outcome.ok) onClose();
      else setErrorMessage(outcome.message?.trim() || 'File creation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <form
        aria-labelledby="create-file-title"
        aria-modal="true"
        className="settings-dialog create-file-dialog"
        onSubmit={(event) => void handleSubmit(event)}
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Workspace</span>
            <h2 id="create-file-title">New file</h2>
          </div>
          <button
            aria-label="Close new file dialog"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="settings-intro">
          Create a text file in the browser workspace. The new file becomes the
          active tab and is included in the next folder save.
        </p>
        <label className="settings-field">
          <span>File path</span>
          <input
            autoFocus
            aria-label="New file path"
            onChange={(event) => setPath(event.target.value)}
            placeholder="src/notes.md"
            value={path}
          />
        </label>
        <label className="settings-field">
          <span>Initial source</span>
          <textarea
            aria-label="Initial file source"
            aria-describedby="create-file-source-count"
            className="create-file-source"
            maxLength={MAX_TEXT_SOURCE_LENGTH}
            onChange={(event) => setSource(event.target.value)}
            rows={8}
            value={source}
          />
          <span
            aria-live="polite"
            className={`create-file-source-count ${sourceExceedsLimit ? 'create-file-source-count-warning' : ''}`}
            id="create-file-source-count"
            role="status"
          >
            {sourceLengthLabel}
          </span>
        </label>
        {errorMessage ? (
          <p className="create-file-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="settings-note">
          <span className="status-dot" />
          Text files only · paths are normalized by workspace.createFile ·
          source is limited to 80,000 characters.
        </div>
        <div className="settings-actions">
          <span />
          <div>
            <button className="settings-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="settings-save"
              disabled={submitting || !path.trim() || sourceExceedsLimit}
              type="submit"
            >
              {submitting ? 'Creating…' : 'Create file'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function RenameWorkspaceFileDialog({
  initialPath,
  onClose,
  onRename,
}: {
  initialPath: string;
  onClose: () => void;
  onRename: (fromPath: string, toPath: string) => Promise<ToolExecutionOutcome>;
}) {
  const filename = initialPath.split('/').pop() ?? initialPath;
  const [toPath, setToPath] = useState(`renamed-${filename}`);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const dialogRef = useModalDialog<HTMLFormElement>(onClose);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !toPath.trim()) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const outcome = await onRename(initialPath, toPath);
      if (outcome.ok) onClose();
      else setErrorMessage(outcome.message?.trim() || 'Rename failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="settings-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <form
        aria-labelledby="rename-file-title"
        aria-modal="true"
        className="settings-dialog create-file-dialog"
        onSubmit={(event) => void handleSubmit(event)}
        ref={dialogRef}
        role="dialog"
      >
        <div className="settings-heading">
          <div>
            <span className="panel-label">Workspace</span>
            <h2 id="rename-file-title">Rename file</h2>
          </div>
          <button
            aria-label="Close rename file dialog"
            className="settings-close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <p className="settings-intro">
          Rename the active file while preserving its source. A folder save
          writes the new path and removes the old path when appropriate.
        </p>
        <div className="rename-file-from">
          <span>Current path</span>
          <code>{initialPath}</code>
        </div>
        <label className="settings-field">
          <span>New file path</span>
          <input
            autoFocus
            aria-label="New file path"
            onChange={(event) => setToPath(event.target.value)}
            placeholder="src/page.html"
            value={toPath}
          />
        </label>
        {errorMessage ? (
          <p className="create-file-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <div className="settings-note">
          <span className="status-dot" />
          Existing paths are rejected · preview files keep their supported type.
        </div>
        <div className="settings-actions">
          <span />
          <div>
            <button className="settings-cancel" onClick={onClose} type="button">
              Cancel
            </button>
            <button
              className="settings-save"
              disabled={submitting || !toPath.trim()}
              type="submit"
            >
              {submitting ? 'Renaming…' : 'Rename file'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
