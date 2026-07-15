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
  getStoredOpenRouterApiKey,
  saveOpenRouterApiKey,
} from '../../../lib/openrouter-api-key';
import {
  formatModelName,
  getFreeModelsWithTools,
  type OpenRouterModel,
} from '../../../lib/openrouter-models';
import styles from './LiveCodeEditorPage.module.css';
import { useLiveEditorToolRegistry } from './LiveEditorToolchain';

export function LiveEditorAIToolbar() {
  const registry = useLiveEditorToolRegistry();
  const trace = useSyncExternalStore(
    liveEditorTraceStore.subscribe,
    liveEditorTraceStore.getSnapshot,
    liveEditorTraceStore.getSnapshot
  );
  const [apiKey, setApiKey] = useState(getStoredOpenRouterApiKey);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [localCallResult, setLocalCallResult] = useState('');
  const [localOpenResult, setLocalOpenResult] = useState('');
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
    executionControllerRef.current = controller;
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: `You are operating a parent-owned live editor. Use the available editor tools when appropriate. Never invent tool results. User request: ${prompt.trim()}`,
      },
    ];

    try {
      const response = await runner.generate({
        model: selectedModel,
        messages,
        registry,
        signal: controller.signal,
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

  const inspectRegistry = async () => {
    const result = await registry.callTool(
      {
        id: `local-inspection-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'editor.listFiles',
          arguments: {},
        },
      },
      { context: { source: 'local' } }
    );
    setLocalCallResult(
      result.isError
        ? (result.error?.message ?? 'Local tools/call failed.')
        : JSON.stringify(result.structuredContent)
    );
  };

  const openWorkspaceFile = async () => {
    try {
      const result = await registry.callTool(
        {
          id: `local-open-file-${Date.now()}`,
          method: 'tools/call',
          params: {
            name: 'editor.openFile',
            arguments: { path: 'script.js' },
          },
        },
        { context: { source: 'local' } }
      );
      setLocalOpenResult(
        result.isError
          ? (result.error?.message ?? 'Local editor.openFile failed.')
          : JSON.stringify(result.structuredContent)
      );
    } catch (error) {
      setLocalOpenResult(
        error instanceof Error ? error.message : 'Local editor.openFile failed.'
      );
    }
  };

  const runLocalMutation = async () => {
    const result = await registry.callTool(
      {
        id: `local-mutation-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'editor.setScenario',
          arguments: { scenario: 'invalid' },
        },
      },
      { context: { source: 'local' } }
    );
    setLocalMutationResult(
      result.isError
        ? (result.error?.message ?? 'Local mutation failed.')
        : JSON.stringify(result.structuredContent)
    );
  };

  const runModelShapedCall = async () => {
    const result = await registry.executeModelToolCall(
      {
        id: `model-shaped-${Date.now()}`,
        name: 'editor.setScenario',
        arguments: { scenario: 'blocked' },
      },
      { context: { source: 'model' } }
    );
    setModelShapedResult(
      result.isError
        ? (result.error?.message ?? 'Model-shaped call failed.')
        : JSON.stringify(result.structuredContent)
    );
  };

  const runLocalPatch = async () => {
    const documentResult = await registry.callTool(
      {
        id: `local-patch-read-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'editor.getDocument',
          arguments: {},
        },
      },
      { context: { source: 'local' } }
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

    const patchResult = await registry.callTool(
      {
        id: `local-patch-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'editor.applyPatch',
          arguments: {
            search: line,
            replace: `${line}  `,
            occurrence: 'first',
            expectedRevision: revision,
          },
        },
      },
      { context: { source: 'local' } }
    );
    setLocalPatchResult(
      patchResult.isError
        ? (patchResult.error?.message ?? 'Local patch failed.')
        : JSON.stringify(patchResult.structuredContent)
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
            onChange={(event) =>
              setApiKey(saveOpenRouterApiKey(event.target.value))
            }
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
        {localOpenResult && (
          <code className={styles.localCallResult}>{localOpenResult}</code>
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
                  title={`toolCallId: ${entry.id}`}
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
