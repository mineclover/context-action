import type { ModelMessage } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  finishLiveWebCodingAgentTrace,
  startLiveWebCodingAgentTrace,
} from '../../../../lib/live-web-coding-trace';
import { createBrowserOpenRouterToolRunner } from '../../../../lib/openrouter-ai-sdk';
import { createToolCallSessionId } from '../../../../lib/tool-call-trace';
import { formatToolResultText } from '../../../../lib/tool-result-format';
import {
  planLocalWebToolCalls,
  WEB_CODING_SYSTEM_PROMPT,
} from '../business/live-web-coding-agent';
import {
  type LiveWebCodingToolActions,
  revisionGuardedWebTools,
} from './useLiveWebCodingToolActions';

export type LiveWebCodingMessage = {
  role: 'user' | 'assistant';
  text: string;
  tools?: string[];
};

function getWorkspaceRevision(value: unknown): number | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const revision = (value as { revision?: unknown }).revision;
  return typeof revision === 'number' ? revision : undefined;
}

async function runLocalPrompt(
  toolActions: LiveWebCodingToolActions,
  prompt: string,
  signal: AbortSignal,
  sessionId: string
): Promise<{ toolNames: string[]; response: string; failed: boolean }> {
  toolActions.listTools('local', sessionId);
  const calls = planLocalWebToolCalls(prompt);
  const toolNames: string[] = [];
  let plannedRevision: number | undefined;

  const workspaceResult = await toolActions.executeAgentToolCall(
    'web.getWorkspace',
    {},
    { sessionId, signal }
  );
  if (workspaceResult.isError) {
    return {
      toolNames: ['web.getWorkspace'],
      response: formatToolResultText(
        workspaceResult,
        'Local web.getWorkspace failed.'
      ),
      failed: true,
    };
  }
  plannedRevision = getWorkspaceRevision(workspaceResult.structuredContent);

  for (const call of calls) {
    if (signal.aborted) throw new Error('Execution cancelled.');
    const argumentsValue =
      revisionGuardedWebTools.has(call.name) &&
      call.arguments.expectedRevision === undefined &&
      plannedRevision !== undefined
        ? { ...call.arguments, expectedRevision: plannedRevision }
        : call.arguments;
    const result = await toolActions.executeAgentToolCall(
      call.name,
      argumentsValue,
      { sessionId, signal }
    );
    if (signal.aborted) throw new Error('Execution cancelled.');
    toolNames.push(call.name);
    if (result.isError) {
      return {
        toolNames,
        response: formatToolResultText(result, 'Web tool failed.'),
        failed: true,
      };
    }
    if (revisionGuardedWebTools.has(call.name)) {
      const nextWorkspace = await toolActions.executeAgentToolCall(
        'web.getWorkspace',
        {},
        { sessionId, signal }
      );
      if (!nextWorkspace.isError) {
        plannedRevision = getWorkspaceRevision(nextWorkspace.structuredContent);
      }
    }
  }

  return {
    toolNames,
    response: `로컬 demo agent가 ${toolNames.join(', ')}를 호출하고 preview 동기화를 기다렸습니다.`,
    failed: false,
  };
}

export function useLiveWebCodingAgentExecution({
  apiKey,
  selectedModel,
  toolActions,
  onPromptConsumed,
}: {
  apiKey: string;
  selectedModel: string;
  toolActions: LiveWebCodingToolActions;
  onPromptConsumed: () => void;
}) {
  const [messages, setMessages] = useState<LiveWebCodingMessage[]>([]);
  const [modelMessages, setModelMessages] = useState<ModelMessage[]>([
    { role: 'system', content: WEB_CODING_SYSTEM_PROMPT },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const run = useCallback(
    async (prompt: string) => {
      const nextPrompt = prompt.trim();
      if (!nextPrompt || loading) return;

      const controller = new AbortController();
      const sessionId = createToolCallSessionId();
      const agentSource = runner && selectedModel ? 'model' : 'local';
      const agentTrace = startLiveWebCodingAgentTrace(agentSource, sessionId);
      let agentSummary = '';
      let agentStatus: 'completed' | 'failed' = 'completed';
      executionControllerRef.current = controller;
      setLoading(true);
      setError('');
      setMessages((current) => [
        ...current,
        { role: 'user', text: nextPrompt },
      ]);

      try {
        if (runner && selectedModel) {
          toolActions.listTools('model', sessionId);
          const requestMessages: ModelMessage[] = [
            ...modelMessages,
            { role: 'user', content: nextPrompt },
          ];
          const response = await runner.generate({
            model: selectedModel,
            messages: requestMessages,
            registry: toolActions.registry,
            signal: controller.signal,
            sessionId,
          });
          if (controller.signal.aborted) {
            throw new Error('Execution cancelled.');
          }
          const responseText =
            response.text ||
            `AI tool loop completed ${response.toolCallCount} call(s).`;
          setMessages((current) => [
            ...current,
            {
              role: 'assistant',
              text: responseText,
              tools: [`OpenRouter · ${response.toolCallCount} tool call(s)`],
            },
          ]);
          setModelMessages([...requestMessages, ...response.responseMessages]);
          agentSummary = responseText;
        } else {
          const local = await runLocalPrompt(
            toolActions,
            nextPrompt,
            controller.signal,
            sessionId
          );
          setMessages((current) => [
            ...current,
            { role: 'assistant', text: local.response, tools: local.toolNames },
          ]);
          agentSummary = local.response;
          agentStatus = local.failed ? 'failed' : 'completed';
        }
        if (controller.signal.aborted) {
          throw new Error('Execution cancelled.');
        }
        finishLiveWebCodingAgentTrace(
          agentTrace,
          agentStatus,
          agentSummary || 'Agent request completed.'
        );
        if (agentStatus === 'completed') onPromptConsumed();
      } catch (requestError) {
        if (controller.signal.aborted) {
          finishLiveWebCodingAgentTrace(
            agentTrace,
            'cancelled',
            'Execution cancelled.'
          );
          setMessages((current) => [
            ...current,
            {
              role: 'assistant',
              text: 'Execution cancelled. No toolchain success was reported.',
            },
          ]);
          setError('');
        } else {
          const errorMessage =
            requestError instanceof Error
              ? requestError.message
              : 'Realtime web coding request failed.';
          finishLiveWebCodingAgentTrace(agentTrace, 'failed', errorMessage);
          setError(errorMessage);
        }
      } finally {
        if (executionControllerRef.current === controller) {
          executionControllerRef.current = null;
        }
        setLoading(false);
      }
    },
    [
      loading,
      modelMessages,
      onPromptConsumed,
      runner,
      selectedModel,
      toolActions,
    ]
  );

  const cancel = useCallback(() => {
    const controller = executionControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
  }, []);

  const appendAssistantMessage = useCallback(
    (message: LiveWebCodingMessage) => {
      setMessages((current) => [...current, message]);
    },
    []
  );

  const resetConversation = useCallback(() => {
    setMessages([]);
    setModelMessages([{ role: 'system', content: WEB_CODING_SYSTEM_PROMPT }]);
    setError('');
  }, []);

  return {
    messages,
    loading,
    error,
    run,
    cancel,
    appendAssistantMessage,
    resetConversation,
  };
}
