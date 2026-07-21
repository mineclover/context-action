import { listAllTools } from '@context-action/tool-protocol';
import type { ModelMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  finishLiveEditorAgentTrace,
  recordLiveEditorToolList,
  startLiveEditorAgentTrace,
} from '../../../../lib/live-editor-trace';
import { createBrowserOpenRouterToolRunner } from '../../../../lib/openrouter-ai-sdk';
import { createToolCallSessionId } from '../../../../lib/tool-call-trace';
import { useLiveEditorToolRegistry } from '../LiveEditorToolchain';

interface UseLiveEditorAgentExecutionOptions {
  apiKey: string;
  selectedModel: string;
  prompt: string;
  onPromptConsumed: () => void;
}

export function useLiveEditorAgentExecution({
  apiKey,
  selectedModel,
  prompt,
  onPromptConsumed,
}: UseLiveEditorAgentExecutionOptions) {
  const registry = useLiveEditorToolRegistry();
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const executionControllerRef = useRef<AbortController | null>(null);

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

  useEffect(
    () => () => {
      executionControllerRef.current?.abort();
    },
    []
  );

  const run = useCallback(async () => {
    if (!runner || !selectedModel || !prompt.trim() || loading) return;

    setLoading(true);
    setError('');
    setResult('');
    const controller = new AbortController();
    const sessionId = createToolCallSessionId();
    const agentTrace = startLiveEditorAgentTrace('model', sessionId);
    executionControllerRef.current = controller;
    const messages: ModelMessage[] = [
      {
        role: 'user',
        content: `You are operating a parent-owned live editor. Use editor.getStatus or editor.listFiles to inspect the current workspace before planning mutations. Use the available editor tools when appropriate. Never invent tool results. User request: ${prompt.trim()}`,
      },
    ];

    try {
      const listedTools = listAllTools(registry);
      recordLiveEditorToolList(listedTools.length, 'model', sessionId);
      const response = await runner.generate({
        model: selectedModel,
        messages,
        registry,
        signal: controller.signal,
        sessionId,
      });
      if (controller.signal.aborted) {
        finishLiveEditorAgentTrace(
          agentTrace,
          'cancelled',
          'Execution cancelled.'
        );
        setResult('Execution cancelled. No toolchain success was reported.');
        return;
      }
      const resultText =
        response.text ||
        `Toolchain completed ${response.toolCallCount} editor tool call(s).`;
      finishLiveEditorAgentTrace(agentTrace, 'completed', resultText);
      setResult(resultText);
      onPromptConsumed();
    } catch (requestError) {
      if (controller.signal.aborted) {
        finishLiveEditorAgentTrace(
          agentTrace,
          'cancelled',
          'Execution cancelled.'
        );
        setResult('Execution cancelled. No toolchain success was reported.');
        setError('');
      } else {
        const errorMessage =
          requestError instanceof Error
            ? requestError.message
            : 'AI editor request failed.';
        finishLiveEditorAgentTrace(agentTrace, 'failed', errorMessage);
        setError(errorMessage);
      }
    } finally {
      if (executionControllerRef.current === controller) {
        executionControllerRef.current = null;
      }
      setLoading(false);
    }
  }, [loading, onPromptConsumed, prompt, registry, runner, selectedModel]);

  const cancel = useCallback(() => {
    const controller = executionControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
  }, []);

  return { loading, result, error, run, cancel };
}
