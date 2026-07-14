import type { ModelMessage } from 'ai';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [apiKey, setApiKey] = useState(getStoredOpenRouterApiKey);
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [localCallResult, setLocalCallResult] = useState('');
  const [localMutationResult, setLocalMutationResult] = useState('');
  const [modelShapedResult, setModelShapedResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

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
      });
      setResult(
        response.text ||
          `Toolchain completed ${response.toolCallCount} editor tool call(s).`
      );
      setPrompt('');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'AI editor request failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const inspectRegistry = async () => {
    const result = await registry.callTool(
      {
        id: `local-inspection-${Date.now()}`,
        method: 'tools/call',
        params: {
          name: 'editor.getDocument',
          arguments: {},
        },
      },
      { context: { source: 'local' } }
    );
    setLocalCallResult(
      result.isError
        ? result.error?.message ?? 'Local tools/call failed.'
        : JSON.stringify(result.structuredContent)
    );
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
        ? result.error?.message ?? 'Local mutation failed.'
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
        ? result.error?.message ?? 'Model-shaped call failed.'
        : JSON.stringify(result.structuredContent)
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
            onChange={(event) => setApiKey(saveOpenRouterApiKey(event.target.value))}
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
          Run local tools/call
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
          onClick={() => void runModelShapedCall()}
        >
          Run model-shaped call (no network)
        </button>
        {localCallResult && (
          <code className={styles.localCallResult}>{localCallResult}</code>
        )}
        {localMutationResult && (
          <code className={styles.localCallResult}>{localMutationResult}</code>
        )}
        {modelShapedResult && (
          <code className={styles.localCallResult}>{modelShapedResult}</code>
        )}
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
          type="submit"
          disabled={!apiKey || !selectedModel || loading || !prompt.trim()}
        >
          {loading ? 'Calling tools…' : 'Run editor toolchain'}
        </button>
      </form>
      {result && <p className={styles.aiResult}>{result}</p>}
      {error && <p className={styles.aiError}>{error}</p>}
    </section>
  );
}
