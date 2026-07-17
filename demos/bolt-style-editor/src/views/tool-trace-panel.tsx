import type { ToolTraceEntry } from '../tool-trace';

export type ToolTracePanelProps = {
  traceEntries: readonly ToolTraceEntry[];
  traceSessionFilter: string;
  traceSessionOptions: readonly { value: string; label: string }[];
  running: boolean;
  showAllTrace: boolean;
  formatTraceId: (id: string) => string;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onTraceSessionFilterChange: (value: string) => void;
  onToggleShowAll: () => void;
};

export function ToolTracePanel({
  traceEntries,
  traceSessionFilter,
  traceSessionOptions,
  running,
  showAllTrace,
  formatTraceId,
  onClear,
  onCopy,
  onDownload,
  onTraceSessionFilterChange,
  onToggleShowAll,
}: ToolTracePanelProps) {
  return (
    <div className="trace-section">
      <div className="sidebar-section-heading">
        <span>Execution trace</span>
        <span className="trace-heading-actions">
          {traceSessionOptions.length > 1 ? (
            <label className="trace-session-filter">
              <span className="sr-only">Filter execution trace session</span>
              <select
                aria-label="Filter execution trace session"
                onChange={(event) =>
                  onTraceSessionFilterChange(event.target.value)
                }
                value={traceSessionFilter}
              >
                <option value="all">All sessions</option>
                {traceSessionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            aria-label="Clear execution trace"
            className="trace-clear-button"
            disabled={!traceEntries.length || running}
            onClick={onClear}
            title={
              running
                ? 'Finish the current execution before clearing the trace'
                : 'Clear execution trace'
            }
            type="button"
          >
            Clear
          </button>
          <button
            aria-label="Copy execution trace"
            className="trace-copy-button"
            disabled={!traceEntries.length || running}
            onClick={onCopy}
            type="button"
          >
            Copy
          </button>
          <button
            aria-label="Download execution trace"
            className="trace-copy-button"
            disabled={!traceEntries.length || running}
            onClick={onDownload}
            type="button"
          >
            Download
          </button>
          {traceEntries.length > 8 ? (
            <button
              aria-controls="trace-list"
              aria-expanded={showAllTrace}
              aria-label={
                showAllTrace
                  ? 'Show recent execution trace'
                  : 'Show all execution trace'
              }
              className="trace-copy-button"
              onClick={onToggleShowAll}
              type="button"
            >
              {showAllTrace ? 'Recent' : 'All'}
            </button>
          ) : null}
          <span className="count-badge">{traceEntries.length}</span>
        </span>
      </div>
      <div
        aria-label="Tool execution trace"
        aria-live="polite"
        className="trace-list"
        id="trace-list"
        role="log"
      >
        {traceEntries.length ? (
          traceEntries
            .slice(0, showAllTrace ? traceEntries.length : 8)
            .map((entry) => (
              <div
                className={`trace-row trace-row-${entry.status}`}
                data-session-id={entry.sessionId}
                key={entry.id}
                title={
                  entry.kind === 'call'
                    ? `${entry.toolCallId ? `toolCallId ${entry.toolCallId}` : `traceId ${entry.id}`} · traceId ${entry.id}${entry.sessionId ? ` · sessionId ${entry.sessionId}` : ''}`
                    : entry.kind === 'agent'
                      ? `agent request · ${entry.source}${entry.sessionId ? ` · sessionId ${entry.sessionId}` : ''}`
                      : 'tools/list discovery'
                }
              >
                <span className="trace-mark" aria-hidden="true">
                  {entry.status === 'running'
                    ? '…'
                    : entry.status === 'failed'
                      ? '!'
                      : entry.status === 'cancelled'
                        ? '↶'
                        : '✓'}
                </span>
                <span className="trace-copy">
                  <strong>{entry.name}</strong>
                  <small>
                    {entry.kind === 'discovery'
                      ? [
                          entry.method,
                          entry.summary,
                          entry.sessionId
                            ? `session ${formatTraceId(entry.sessionId)}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')
                      : [
                          entry.kind === 'agent'
                            ? entry.method
                            : entry.toolCallId
                              ? `call ${formatTraceId(entry.toolCallId)}`
                              : formatTraceId(entry.id),
                          entry.source,
                          entry.mode ? `mode ${entry.mode}` : null,
                          entry.sessionId
                            ? `session ${formatTraceId(entry.sessionId)}`
                            : null,
                          `${entry.durationMs ?? 0}ms`,
                          entry.retryable === true
                            ? 'retryable'
                            : entry.retryable === false
                              ? 'terminal'
                              : null,
                          entry.summary,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                  </small>
                  {entry.kind === 'call' &&
                  (entry.argumentsText || entry.resultText) ? (
                    <details className="trace-details">
                      <summary>Inspect tools/call</summary>
                      <div className="trace-detail-block">
                        <span>arguments</span>
                        <pre>{entry.argumentsText ?? '{}'}</pre>
                      </div>
                      {entry.resultText ? (
                        <div className="trace-detail-block">
                          <span>tool result</span>
                          <pre>{entry.resultText}</pre>
                        </div>
                      ) : null}
                    </details>
                  ) : null}
                </span>
              </div>
            ))
        ) : (
          <div className="trace-empty">
            tools/list ready · waiting for a call
          </div>
        )}
      </div>
    </div>
  );
}
