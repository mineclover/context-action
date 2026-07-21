import { toToolCallRequest } from '@context-action/tool-protocol';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { runLocalAgent } from '../actions/run-local-agent';
import type { BoltStyleRegistry } from '../bolt-style-tool-context';
import type { ToolCall } from '../local-agent-plan';
import {
  OpenRouterRequestError,
  type OpenRouterRetryEvent,
  type OpenRouterSettings,
  runOpenRouterAgent,
} from '../openrouter';
import { denyPendingToolApprovals } from '../tool-approval';
import { getToolErrorRecovery } from '../tool-error-recovery';
import { formatToolResultText } from '../tool-result-utils';
import { throwIfAborted } from '../tool-runtime-utils';
import {
  createToolSessionId,
  finishAgentTrace,
  startAgentTrace,
} from '../tool-trace';
import {
  buildWorkspaceChangeSummary,
  captureWorkspaceVersion,
  formatWorkspaceChangeFeedback,
} from '../version-diff';
import { BrowserWorkspace } from '../workspace';
import type { WorkspaceFileSystemAdapter } from '../workspace-filesystem';

export type EditorMessage = {
  role: 'user' | 'assistant';
  text: string;
  tools?: string[];
  tone?: 'error' | 'cancelled';
  retryPrompt?: string;
  retryLabel?: string;
  retryTool?: ToolCall;
  localRetryPrompt?: string;
  folderAction?: 'reconnect' | 'grant';
  previewAction?: boolean;
  openSettings?: boolean;
};

export type ToolExecutionOutcome = {
  ok: boolean;
  message?: string;
};

export type ToolExecutionOptions = {
  announce?: boolean;
  skipDraftFlush?: boolean;
};

export type AgentExecutionOptions = {
  forceLocal?: boolean;
};

export type EditorDraftFlushRef = MutableRefObject<
  (() => Promise<boolean>) | null
>;

function shouldOpenProviderSettings(error: unknown): boolean {
  if (!(error instanceof OpenRouterRequestError)) return false;
  return (
    error.code === 'OPENROUTER_CONFIGURATION_ERROR' ||
    error.code === 'OPENROUTER_AUTHENTICATION_FAILED' ||
    error.code === 'OPENROUTER_ACCESS_DENIED' ||
    error.code === 'OPENROUTER_INVALID_RESPONSE'
  );
}

export function useToolExecution({
  registry,
  workspace,
  fileSystemAdapter,
  openRouterSettings,
  setMessages,
  clearPrompt,
  formatToolSuccessMessage,
}: {
  registry: BoltStyleRegistry;
  workspace: BrowserWorkspace;
  fileSystemAdapter: WorkspaceFileSystemAdapter;
  openRouterSettings: OpenRouterSettings;
  setMessages: Dispatch<SetStateAction<EditorMessage[]>>;
  clearPrompt: () => void;
  formatToolSuccessMessage: (
    name: string,
    result: { structuredContent?: unknown }
  ) => string;
}): {
  running: boolean;
  activeAgentMode: 'local' | 'openrouter' | null;
  providerRetry: OpenRouterRetryEvent | null;
  executionControllerRef: MutableRefObject<AbortController | null>;
  flushEditorDraftsRef: EditorDraftFlushRef;
  executePrompt: (
    value: string,
    options?: AgentExecutionOptions
  ) => Promise<void>;
  executeQuickTool: (
    call: ToolCall,
    options?: ToolExecutionOptions
  ) => Promise<ToolExecutionOutcome>;
  cancelExecution: () => void;
} {
  const [running, setRunning] = useState(false);
  const [activeAgentMode, setActiveAgentMode] = useState<
    'local' | 'openrouter' | null
  >(null);
  const [providerRetry, setProviderRetry] =
    useState<OpenRouterRetryEvent | null>(null);
  const executionControllerRef = useRef<AbortController | null>(null);
  const executionInFlightRef = useRef(false);
  const flushEditorDraftsRef = useRef<(() => Promise<boolean>) | null>(null);

  const executeQuickTool = useCallback(
    async (
      call: ToolCall,
      options: ToolExecutionOptions = {}
    ): Promise<ToolExecutionOutcome> => {
      if (running || executionInFlightRef.current) {
        return {
          ok: false,
          message: 'Another tool execution is already running.',
        };
      }
      executionInFlightRef.current = true;
      try {
        if (!options.skipDraftFlush && call.name !== 'workspace.writeFile') {
          const draftsFlushed = await flushEditorDraftsRef.current?.();
          if (draftsFlushed === false) {
            return {
              ok: false,
              message: 'Pending editor changes could not be committed.',
            };
          }
        }
        const controller = new AbortController();
        executionControllerRef.current = controller;
        const sessionId = createToolSessionId();
        setRunning(true);
        try {
          const beforeVersion = captureWorkspaceVersion(
            workspace.getSnapshot()
          );
          const result = await registry.callTool(
            toToolCallRequest({
              id: `palette-${sessionId}`,
              name: call.name,
              arguments: call.arguments,
            }),
            {
              context: { source: 'local', mode: 'direct', sessionId },
              signal: controller.signal,
            }
          );
          throwIfAborted(controller.signal);
          const baseMessage = result.isError
            ? formatToolResultText(result)
            : formatToolSuccessMessage(call.name, result);
          const changeFeedback = result.isError
            ? ''
            : formatWorkspaceChangeFeedback(
                buildWorkspaceChangeSummary(
                  beforeVersion.files,
                  captureWorkspaceVersion(workspace.getSnapshot()).files
                )
              );
          const message = changeFeedback
            ? `${baseMessage}\n\n${changeFeedback}`
            : baseMessage;
          if (options.announce !== false || result.isError) {
            setMessages((current) => [
              ...current,
              {
                role: 'assistant',
                text: message,
                tools: [call.name],
                ...(result.isError
                  ? {
                      tone: 'error' as const,
                      ...getToolErrorRecovery(result.error?.code),
                      ...(result.error?.retryable === false
                        ? {}
                        : { retryTool: call }),
                    }
                  : {}),
              },
            ]);
          }
          return result.isError ? { ok: false, message } : { ok: true };
        } catch (error) {
          const message = controller.signal.aborted
            ? 'Execution cancelled.'
            : error instanceof Error && error.message.trim()
              ? error.message
              : 'Tool execution failed.';
          setMessages((current) => [
            ...current,
            {
              role: 'assistant',
              text: message,
              tools: [call.name],
              tone: controller.signal.aborted ? 'cancelled' : 'error',
              ...(controller.signal.aborted ? {} : { retryTool: call }),
            },
          ]);
          return { ok: false, message };
        } finally {
          if (executionControllerRef.current === controller) {
            executionControllerRef.current = null;
          }
          setRunning(false);
        }
      } finally {
        executionInFlightRef.current = false;
      }
    },
    [formatToolSuccessMessage, registry, running, setMessages, workspace]
  );

  const executePrompt = useCallback(
    async (
      value: string,
      options: AgentExecutionOptions = {}
    ): Promise<void> => {
      const trimmed = value.trim();
      if (!trimmed || running || executionInFlightRef.current) return;
      executionInFlightRef.current = true;
      try {
        const draftsFlushed = await flushEditorDraftsRef.current?.();
        if (draftsFlushed === false) return;
        const useOpenRouter = !options.forceLocal && openRouterSettings.apiKey;
        const controller = new AbortController();
        executionControllerRef.current = controller;
        setProviderRetry(null);
        const agentTrace = startAgentTrace(
          useOpenRouter ? 'openrouter' : 'local'
        );
        clearPrompt();
        setMessages((current) => [...current, { role: 'user', text: trimmed }]);
        setActiveAgentMode(useOpenRouter ? 'openrouter' : 'local');
        setRunning(true);
        try {
          const beforeVersion = captureWorkspaceVersion(
            workspace.getSnapshot()
          );
          const result = useOpenRouter
            ? await runOpenRouterAgent(
                registry,
                trimmed,
                openRouterSettings,
                controller.signal,
                agentTrace.sessionId,
                setProviderRetry
              )
            : await runLocalAgent(
                registry,
                workspace,
                fileSystemAdapter,
                trimmed,
                controller.signal,
                agentTrace.sessionId
              );
          throwIfAborted(controller.signal);
          finishAgentTrace(
            agentTrace,
            result.failed ? 'failed' : 'completed',
            result.failed
              ? `${result.failedTool ?? 'tool call'} failed`
              : `${result.toolNames.length} tool call(s)`
          );
          const changeFeedback = formatWorkspaceChangeFeedback(
            buildWorkspaceChangeSummary(
              beforeVersion.files,
              captureWorkspaceVersion(workspace.getSnapshot()).files
            )
          );
          setMessages((current) => [
            ...current,
            {
              role: 'assistant',
              text: changeFeedback
                ? `${result.response}\n\n${changeFeedback}`
                : result.response,
              tools: result.toolNames,
              ...(result.failed
                ? {
                    tone: 'error' as const,
                    ...(result.retryable === false
                      ? {}
                      : {
                          retryPrompt: trimmed,
                          ...getToolErrorRecovery(result.errorCode, {
                            revisionConflict: result.revisionConflict,
                          }),
                        }),
                  }
                : {}),
            },
          ]);
        } catch (error) {
          finishAgentTrace(
            agentTrace,
            controller.signal.aborted ? 'cancelled' : 'failed',
            controller.signal.aborted
              ? 'cancelled'
              : error instanceof OpenRouterRequestError
                ? error.code
                : 'agent request failed'
          );
          const retryable =
            !(error instanceof OpenRouterRequestError) || error.retryable;
          setMessages((current) => [
            ...current,
            {
              role: 'assistant',
              text: controller.signal.aborted
                ? 'Execution cancelled.'
                : error instanceof Error
                  ? error.message
                  : 'Request failed.',
              tone: controller.signal.aborted ? 'cancelled' : 'error',
              ...(controller.signal.aborted || !retryable
                ? {}
                : { retryPrompt: trimmed }),
              ...(shouldOpenProviderSettings(error)
                ? {
                    openSettings: true,
                    ...(openRouterSettings.apiKey
                      ? { localRetryPrompt: trimmed }
                      : {}),
                  }
                : {}),
            },
          ]);
        } finally {
          if (executionControllerRef.current === controller) {
            executionControllerRef.current = null;
          }
          setProviderRetry(null);
          setActiveAgentMode(null);
          setRunning(false);
        }
      } finally {
        executionInFlightRef.current = false;
      }
    },
    [
      clearPrompt,
      fileSystemAdapter,
      openRouterSettings,
      registry,
      running,
      setMessages,
      workspace,
    ]
  );

  const cancelExecution = useCallback(() => {
    denyPendingToolApprovals();
    const controller = executionControllerRef.current;
    if (controller && !controller.signal.aborted) controller.abort();
  }, []);

  useEffect(() => {
    return () => {
      denyPendingToolApprovals();
      executionControllerRef.current?.abort();
    };
  }, []);

  return {
    running,
    activeAgentMode,
    providerRetry,
    executionControllerRef,
    flushEditorDraftsRef,
    executePrompt,
    executeQuickTool,
    cancelExecution,
  };
}
