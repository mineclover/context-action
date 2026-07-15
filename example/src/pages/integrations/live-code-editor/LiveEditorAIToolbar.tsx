import type { ModelMessage } from 'ai';
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import {
  clearLiveEditorTrace,
  formatLiveEditorTraceId,
  liveEditorTraceStore,
} from '../../../lib/live-editor-trace';
import { createBrowserOpenRouterToolRunner } from '../../../lib/openrouter-ai-sdk';
import {
  saveOpenRouterApiKey,
  useStoredOpenRouterApiKey,
} from '../../../lib/openrouter-api-key';
import {
  formatModelName,
  getFreeModelsWithTools,
  type OpenRouterModel,
} from '../../../lib/openrouter-models';
import { createToolCallSessionId } from '../../../lib/tool-call-trace';
import styles from './LiveCodeEditorPage.module.css';
import { useLiveEditorToolRegistry } from './LiveEditorToolchain';

function formatLocalToolResult(
  result: {
    readonly content?: readonly {
      readonly type: string;
      readonly text?: string;
    }[];
    readonly error?: { readonly message?: string };
    readonly isError?: boolean;
    readonly structuredContent?: unknown;
  },
  fallback: string
): string {
  if (result.error?.message || result.isError) {
    return result.error?.message ?? fallback;
  }
  if (result.structuredContent !== undefined) {
    return JSON.stringify(result.structuredContent);
  }
  const text = result.content
    ?.filter((item) => item.type === 'text' && item.text)
    .map((item) => item.text)
    .join('\n');
  return text || fallback;
}

export function LiveEditorAIToolbar() {
  const registry = useLiveEditorToolRegistry();
  const callLocalTool = (
    name: string,
    argumentsValue: Record<string, unknown>,
    sessionId = createToolCallSessionId()
  ) =>
    registry.callTool(
      {
        id: `local-${Date.now()}-${name}`,
        method: 'tools/call',
        params: { name, arguments: argumentsValue },
      },
      { context: { source: 'local', sessionId } }
    );
  const trace = useSyncExternalStore(
    liveEditorTraceStore.subscribe,
    liveEditorTraceStore.getSnapshot,
    liveEditorTraceStore.getSnapshot
  );
  const apiKey = useStoredOpenRouterApiKey();
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [localStatusResult, setLocalStatusResult] = useState('');
  const [localCallResult, setLocalCallResult] = useState('');
  const [localOpenResult, setLocalOpenResult] = useState('');
  const [localSaveResult, setLocalSaveResult] = useState('');
  const [localSaveAllResult, setLocalSaveAllResult] = useState('');
  const [localMutationResult, setLocalMutationResult] = useState('');
  const [localPatchResult, setLocalPatchResult] = useState('');
  const [modelShapedResult, setModelShapedResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const executionControllerRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      executionControllerRef.current?.abort();
    },
    []
  );

  useEffect(() => {
    let active = true;
    setLoadingModels(true);
    getFreeModelsWithTools()
      .then((freeModels) => {
        if (!active) return;
        setModels(freeModels);
        setSelectedModel((current) => current || freeModels[0]?.id || '');
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'OpenRouter models could not be loaded.'
          );
        }
      })
      .finally(() => {
        if (active) setLoadingModels(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const runner = useMemo(
    () =>
      apiKey
        ? createBrowserOpenRouterToolRunner({
            apiKey,
            referer: window.location.origin,
          })
        : null,
    [apiKey]
  );

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!runner || !selectedModel || !prompt.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult('');
    const controller = new AbortController();
    const sessionId = createToolCallSessionId();
    executionControllerRef.current = controller;
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: `You are operating a parent-owned live editor. Use editor.getStatus or editor.listFiles to inspect the current workspace before planning mutations. Use the available editor tools when appropriate. Never invent tool results. User request: ${prompt.trim()}`,
      },
    ];

    try {
      const response = await runner.generate({
        model: selectedModel,
        messages,
        registry,
        signal: controller.signal,
        sessionId,
      });
      if (controller.signal.aborted) {
        setResult('Execution cancelled. No toolchain success was reported.');
        return;
      }
      setResult(
        response.text ||
          `Toolchain completed ${response.toolCallCount} editor tool call(s).`
      );
      setPrompt('');
    } catch (requestError) {
      if (controller.signal.aborted) {
        setResult('Execution cancelled. No toolchain success was reported.');
        setError('');
      } else {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'AI editor request failed.'
        );
      }
    } finally {
      if (executionControllerRef.current === controller) {
        executionControllerRef.current = null;
      }
      setLoading(false);
    }
  };

  const cancelExecution = () => {
    const controller = executionControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
  };

  const inspectEditorStatus = async () => {
    const result = await callLocalTool('editor.getStatus', {});
    setLocalStatusResult(
      formatLocalToolResult(result, 'Local editor.getStatus failed.')
    );
  };

  const inspectRegistry = async () => {
    const result = await callLocalTool('editor.listFiles', {});
    setLocalCallResult(
      formatLocalToolResult(result, 'Local tools/call failed.')
    );
  };

  const openWorkspaceFile = async () => {
    try {
      const result = await callLocalTool('editor.openFile', {
        path: 'script.js',
      });
      setLocalOpenResult(
        formatLocalToolResult(result, 'Local editor.openFile failed.')
      );
    } catch (error) {
      setLocalOpenResult(
        error instanceof Error ? error.message : 'Local editor.openFile failed.'
      );
    }
  };

  const saveActiveWorkspaceFile = async () => {
    try {
      const sessionId = createToolCallSessionId();
      const listing = await callLocalTool('editor.listFiles', {}, sessionId);
      if (listing.isError) {
        setLocalSaveResult(
          listing.error?.message ?? 'Could not list workspace files.'
        );
        return;
      }
      const value = listing.structuredContent;
      const activePath =
        value && typeof value === 'object' && 'activePath' in value
          ? value.activePath
          : undefined;
      if (typeof activePath !== 'string' || !activePath) {
        setLocalSaveResult('Workspace did not return an active text path.');
        return;
      }
      const result = await callLocalTool(
        'editor.saveFile',
        { path: activePath },
        sessionId
      );
      setLocalSaveResult(
        formatLocalToolResult(result, 'Local editor.saveFile failed.')
      );
    } catch (error) {
      setLocalSaveResult(
        error instanceof Error ? error.message : 'Local editor.saveFile failed.'
      );
    }
  };

  const saveAllWorkspaceFiles = async () => {
    try {
      const result = await callLocalTool('editor.saveAll', {});
      setLocalSaveAllResult(
        formatLocalToolResult(result, 'Local editor.saveAll failed.')
      );
    } catch (error) {
      setLocalSaveAllResult(
        error instanceof Error ? error.message : 'Local editor.saveAll failed.'
      );
    }
  };

  const runLocalMutation = async () => {
    const result = await callLocalTool('editor.setScenario', {
      scenario: 'invalid',
    });
    setLocalMutationResult(
      formatLocalToolResult(result, 'Local mutation failed.')
    );
  };

  const runModelShapedCall = async () => {
    const sessionId = createToolCallSessionId();
    const result = await registry.executeModelToolCall(
      {
        id: `model-shaped-${Date.now()}`,
        name: 'editor.setScenario',
        arguments: { scenario: 'blocked' },
      },
      { context: { source: 'model', sessionId } }
    );
    setModelShapedResult(
      formatLocalToolResult(result, 'Model-shaped call failed.')
    );
  };

  const runLocalPatch = async () => {
    const sessionId = createToolCallSessionId();
    const documentResult = await callLocalTool(
      'editor.getDocument',
      {},
      sessionId
    );
    if (documentResult.isError) {
      setLocalPatchResult(
        documentResult.error?.message ?? 'Could not read the current document.'
      );
      return;
    }

    const documentValue = documentResult.structuredContent;
    if (!documentValue || typeof documentValue !== 'object') {
      setLocalPatchResult('Current document result was not structured.');
      return;
    }
    const document = documentValue as {
      source?: unknown;
      revision?: unknown;
    };
    const source = typeof document.source === 'string' ? document.source : '';
    const revision =
      typeof document.revision === 'number' ? document.revision : undefined;
    const line = source.split('\n').find((value) => value.trim());
    if (!line || revision === undefined) {
      setLocalPatchResult(
        'Current document does not expose a patchable source.'
      );
      return;
    }

    const patchResult = await callLocalTool(
      'editor.applyPatch',
      {
        search: line,
        replace: `${line}  `,
        occurrence: 'first',
        expectedRevision: revision,
      },
      sessionId
    );
    setLocalPatchResult(
      formatLocalToolResult(patchResult, 'Local patch failed.')
    );
  };

  const toolDefinitions = registry.listTools().tools;

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
            value={apiKey}
            placeholder="sk-or-..."
            onChange={(event) => saveOpenRouterApiKey(event.target.value)}
          />
        </label>
        <label>
          <span>Tool-capable model</span>
          <select
            value={selectedModel}
            disabled={loadingModels || models.length === 0}
            onChange={(event) => setSelectedModel(event.target.value)}
          >
            <option value="">
              {loadingModels ? 'Loading models…' : 'Select a model'}
            </option>
            {models.map((model) => (
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
          onClick={() => void inspectEditorStatus()}
        >
          Run local tools/call · editor.getStatus
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void inspectRegistry()}
        >
          Run local tools/call · editor.listFiles
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void openWorkspaceFile()}
        >
          Run local editor.openFile · script.js
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void saveActiveWorkspaceFile()}
        >
          Run local editor.saveFile · active path
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void saveAllWorkspaceFiles()}
        >
          Run local editor.saveAll · dirty paths
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void runLocalMutation()}
        >
          Run local mutation + iframe acknowledgement
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void runLocalPatch()}
        >
          Run local editor.applyPatch + acknowledgement
        </button>
        <button
          type="button"
          className={styles.localCallButton}
          onClick={() => void runModelShapedCall()}
        >
          Run model-shaped call (no network)
        </button>
        {localCallResult && (
          <code className={styles.localCallResult}>{localCallResult}</code>
        )}
        {localStatusResult && (
          <code className={styles.localCallResult}>{localStatusResult}</code>
        )}
        {localOpenResult && (
          <code className={styles.localCallResult}>{localOpenResult}</code>
        )}
        {localSaveResult && (
          <code className={styles.localCallResult}>{localSaveResult}</code>
        )}
        {localSaveAllResult && (
          <code className={styles.localCallResult}>{localSaveAllResult}</code>
        )}
        {localMutationResult && (
          <code className={styles.localCallResult}>{localMutationResult}</code>
        )}
        {localPatchResult && (
          <code className={styles.localCallResult}>{localPatchResult}</code>
        )}
        {modelShapedResult && (
          <code className={styles.localCallResult}>{modelShapedResult}</code>
        )}
        <div className={styles.tracePanel} aria-label="Editor execution trace">
          <div className={styles.traceHeader}>
            <strong>Execution trace</strong>
            <div className={styles.traceHeaderActions}>
              <button
                type="button"
                className={styles.traceClearButton}
                aria-label="Clear editor execution trace"
                disabled={!trace.length}
                onClick={clearLiveEditorTrace}
              >
                Clear
              </button>
              <span>{trace.length} recent events</span>
            </div>
          </div>
          {trace.length === 0 ? (
            <span className={styles.traceEmpty}>
              tools/list → waiting for a tools/call event
            </span>
          ) : (
            <div className={styles.traceRows}>
              {trace.slice(0, 8).map((entry) => (
                <div
                  className={`${styles.traceRow} ${
                    entry.status === 'failed'
                      ? styles.traceRowFailed
                      : entry.status === 'running'
                        ? styles.traceRowRunning
                        : ''
                  }`}
                  key={entry.id}
                  title={`toolCallId: ${entry.id}${entry.sessionId ? ` · sessionId: ${entry.sessionId}` : ''}`}
                >
                  <span aria-hidden="true">
                    {entry.status === 'failed'
                      ? '×'
                      : entry.status === 'running'
                        ? '…'
                        : '✓'}
                  </span>
                  <code>{entry.name}</code>
                  <span>
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
          disabled={!apiKey || !selectedModel || loading}
          onChange={(event) => setPrompt(event.target.value)}
        />
        <button
          className={loading ? styles.aiCancelButton : undefined}
          type={loading ? 'button' : 'submit'}
          disabled={
            loading ? false : !apiKey || !selectedModel || !prompt.trim()
          }
          onClick={loading ? cancelExecution : undefined}
        >
          {loading ? 'Cancel editor toolchain' : 'Run editor toolchain'}
        </button>
      </form>
      {result && <p className={styles.aiResult}>{result}</p>}
      {error && <p className={styles.aiError}>{error}</p>}
    </section>
  );
}
