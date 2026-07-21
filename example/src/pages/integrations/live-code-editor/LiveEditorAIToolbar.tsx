import { type FormEvent, useEffect, useMemo, useState } from 'react';
import type { WorkspaceFileSystemAdapter } from '../../../lib/live-code-editor-filesystem';
import { formatLiveEditorTraceId } from '../../../lib/live-editor-trace';
import { formatModelName } from '../../../lib/openrouter-models';
import {
  ALL_TOOL_TRACE_SESSIONS,
  filterToolTraceEntries,
  getToolTraceSessionOptions,
} from '../../../lib/tool-call-trace';
import { useLiveEditorAgentExecution } from './actions/useLiveEditorAgentExecution';
import { useLiveEditorProviderSettings } from './actions/useLiveEditorProviderSettings';
import { useLiveEditorToolActions } from './actions/useLiveEditorToolActions';
import { useLiveEditorTraceActions } from './actions/useLiveEditorTraceActions';
import { useLiveEditorTrace } from './hooks/useLiveEditorObservables';
import styles from './LiveCodeEditorPage.module.css';

export function LiveEditorAIToolbar({
  filesystemAdapter,
  onRecoveredPaths,
}: {
  readonly filesystemAdapter: WorkspaceFileSystemAdapter;
  readonly onRecoveredPaths?: (paths: readonly string[]) => void;
}) {
  const trace = useLiveEditorTrace();
  const providerSettings = useLiveEditorProviderSettings();
  const traceActions = useLiveEditorTraceActions(trace);
  const [traceSessionFilter, setTraceSessionFilter] = useState(
    ALL_TOOL_TRACE_SESSIONS
  );
  const traceSessionOptions = useMemo(
    () => getToolTraceSessionOptions(trace),
    [trace]
  );
  const visibleTrace = useMemo(
    () => filterToolTraceEntries(trace, traceSessionFilter),
    [trace, traceSessionFilter]
  );
  useEffect(() => {
    if (
      traceSessionFilter !== ALL_TOOL_TRACE_SESSIONS &&
      !traceSessionOptions.some((option) => option.value === traceSessionFilter)
    ) {
      setTraceSessionFilter(ALL_TOOL_TRACE_SESSIONS);
    }
  }, [traceSessionFilter, traceSessionOptions]);
  const [prompt, setPrompt] = useState('');
  const toolActions = useLiveEditorToolActions({
    filesystemAdapter,
    onRecoveredPaths,
  });
  const agentExecution = useLiveEditorAgentExecution({
    apiKey: providerSettings.apiKey,
    selectedModel: providerSettings.selectedModel,
    prompt,
    onPromptConsumed: () => setPrompt(''),
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void agentExecution.run();
  };

  const { results, commands, toolDefinitions } = toolActions;
  const displayError =
    providerSettings.error || traceActions.error || agentExecution.error;

  return (
    <section className={styles.aiToolbar} aria-label="AI editor toolchain">
      <div className={styles.aiToolbarHeader}>
        <div>
          <span className={styles.aiToolbarEyebrow}>Model tool call</span>
          <h2>Ask the parent-owned editor registry</h2>
        </div>
        <span className={styles.aiToolbarContract}>
          tools/list → model → tools/call → iframe result
        </span>
      </div>
      <div className={styles.aiToolbarControls}>
        <label>
          <span>OpenRouter key</span>
          <input
            type="password"
            value={providerSettings.apiKey}
            placeholder="sk-or-..."
            onChange={(event) =>
              providerSettings.commands.saveApiKey(event.target.value)
            }
          />
        </label>
        <label>
          <span>Tool-capable model</span>
          <select
            value={providerSettings.selectedModel}
            disabled={
              providerSettings.loadingModels ||
              providerSettings.models.length === 0
            }
            onChange={(event) =>
              providerSettings.commands.selectModel(event.target.value)
            }
          >
            <option value="">
              {providerSettings.loadingModels
                ? 'Loading models…'
                : 'Select a model'}
            </option>
            {providerSettings.models.map((model) => (
              <option key={model.id} value={model.id}>
                {formatModelName(model)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.registryInspector}>
        <div>
          <strong>tools/list</strong>
          <span>{toolDefinitions.length} editor tools registered</span>
        </div>
        <div className={styles.registryToolNames}>
          {toolDefinitions.map((tool) => (
            <code key={tool.name}>{tool.name}</code>
          ))}
        </div>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.inspectEditorStatus()}
        >
          Run local tools/call · editor.getStatus
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.inspectRegistry()}
        >
          Run local tools/call · editor.listFiles
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.openWorkspaceFile()}
        >
          Run local editor.openFile · script.js
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.saveActiveWorkspaceFile()}
        >
          Run local editor.saveFile · active path
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.saveAllWorkspaceFiles()}
        >
          Run local editor.saveAll · dirty paths
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.recoverLastSave()}
        >
          Recover last editor.saveFile from folder
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.runLocalMutation()}
        >
          Run local mutation + iframe acknowledgement
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.runLocalPatch()}
        >
          Run local editor.applyPatch + acknowledgement
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.runModelShapedCall()}
        >
          Run model-shaped call (no network)
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void commands.runModelShapedSave()}
        >
          Run model-shaped save · approval
        </button>
        {results.localCallResult && (
          <code className={styles.localCallResult}>
            {results.localCallResult}
          </code>
        )}
        {results.localStatusResult && (
          <code className={styles.localCallResult}>
            {results.localStatusResult}
          </code>
        )}
        {results.localOpenResult && (
          <code className={styles.localCallResult}>
            {results.localOpenResult}
          </code>
        )}
        {results.localSaveResult && (
          <code className={styles.localCallResult}>
            {results.localSaveResult}
          </code>
        )}
        {results.localSaveAllResult && (
          <code className={styles.localCallResult}>
            {results.localSaveAllResult}
          </code>
        )}
        {results.localSaveRecoveryResult && (
          <code className={styles.localCallResult}>
            {results.localSaveRecoveryResult}
          </code>
        )}
        {results.localMutationResult && (
          <code className={styles.localCallResult}>
            {results.localMutationResult}
          </code>
        )}
        {results.localPatchResult && (
          <code className={styles.localCallResult}>
            {results.localPatchResult}
          </code>
        )}
        {results.modelShapedResult && (
          <code className={styles.localCallResult}>
            {results.modelShapedResult}
          </code>
        )}
        {results.modelSaveResult && (
          <code className={styles.localCallResult}>
            {results.modelSaveResult}
          </code>
        )}
        <div className={styles.tracePanel} aria-label="Editor execution trace">
          <div className={styles.traceHeader}>
            <strong>Execution trace</strong>
            <div className={styles.traceHeaderActions}>
              {traceSessionOptions.length > 1 ? (
                <label className={styles.traceSessionFilter}>
                  <span className={styles.visuallyHidden}>
                    Filter execution trace session
                  </span>
                  <select
                    aria-label="Filter execution trace session"
                    value={traceSessionFilter}
                    onChange={(event) =>
                      setTraceSessionFilter(event.target.value)
                    }
                  >
                    {traceSessionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
              <button
                type="button"
                className={styles.traceClearButton}
                aria-label="Clear editor execution trace"
                disabled={!trace.length}
                onClick={traceActions.commands.clear}
              >
                Clear
              </button>
              <button
                type="button"
                className={styles.traceClearButton}
                aria-label="Copy editor execution trace"
                disabled={!trace.length}
                onClick={() => void traceActions.commands.copy()}
              >
                {traceActions.traceCopied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                className={styles.traceClearButton}
                aria-label="Download editor execution trace"
                disabled={!trace.length}
                onClick={traceActions.commands.download}
              >
                Download
              </button>
              <span>
                {visibleTrace.length}/{trace.length} recent events
              </span>
            </div>
          </div>
          {trace.length === 0 ? (
            <span className={styles.traceEmpty}>
              tools/list → waiting for a tools/call event
            </span>
          ) : visibleTrace.length === 0 ? (
            <span className={styles.traceEmpty}>
              No events in the selected session.
            </span>
          ) : (
            <div className={styles.traceRows}>
              {visibleTrace.slice(0, 8).map((entry) => (
                <div
                  className={`${styles.traceRow} ${
                    entry.status === 'failed'
                      ? styles.traceRowFailed
                      : entry.status === 'running'
                        ? styles.traceRowRunning
                        : entry.status === 'cancelled'
                          ? styles.traceRowCancelled
                          : ''
                  }`}
                  data-session-id={entry.sessionId}
                  key={entry.id}
                  title={`toolCallId: ${entry.id}${entry.sessionId ? ` · sessionId: ${entry.sessionId}` : ''}`}
                >
                  <span aria-hidden="true">
                    {entry.status === 'failed' || entry.status === 'cancelled'
                      ? '×'
                      : entry.status === 'running'
                        ? '…'
                        : '✓'}
                  </span>
                  <code>{entry.name}</code>
                  <span>
                    {entry.method}
                    {entry.mode ? ` · ${entry.mode}` : ''} ·{' '}
                    {formatLiveEditorTraceId(entry.id)} · {entry.source}
                    {entry.sessionId
                      ? ` · ${formatLiveEditorTraceId(entry.sessionId)}`
                      : ''}
                    {entry.durationMs !== undefined
                      ? ` · ${entry.durationMs}ms`
                      : ''}
                    {entry.summary ? ` · ${entry.summary}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <form className={styles.aiPromptForm} onSubmit={submit}>
        <input
          aria-label="Editor AI request"
          value={prompt}
          placeholder="예: 현재 문서의 scenario를 invalid로 바꿔줘"
          disabled={
            !providerSettings.apiKey ||
            !providerSettings.selectedModel ||
            agentExecution.loading
          }
          onChange={(event) => setPrompt(event.target.value)}
        />
        <button
          className={agentExecution.loading ? styles.aiCancelButton : undefined}
          type={agentExecution.loading ? 'button' : 'submit'}
          disabled={
            agentExecution.loading
              ? false
              : !providerSettings.apiKey ||
                !providerSettings.selectedModel ||
                !prompt.trim()
          }
          onClick={agentExecution.loading ? agentExecution.cancel : undefined}
        >
          {agentExecution.loading
            ? 'Cancel editor toolchain'
            : 'Run editor toolchain'}
        </button>
      </form>
      {agentExecution.result && (
        <p className={styles.aiResult}>{agentExecution.result}</p>
      )}
      {displayError && <p className={styles.aiError}>{displayError}</p>}
    </section>
  );
}
