import {
  listAllTools,
  type ToolListResult,
  toToolCallRequest,
} from '@context-action/tool-protocol';
import { useCallback, useMemo } from 'react';
import { recordLiveWebCodingToolList } from '../../../../lib/live-web-coding-trace';
import { createToolCallSessionId } from '../../../../lib/tool-call-trace';
import {
  useLiveWebCodingToolRegistry,
  type WebToolRegistry,
} from '../LiveWebCodingToolchain';

type ToolCallSource = 'local' | 'model';

export const revisionGuardedWebTools = new Set([
  'web.writeFile',
  'web.applyPatch',
  'web.setTheme',
  'web.addFeature',
  'web.updateHero',
]);

export type LiveWebCodingToolResult = Awaited<
  ReturnType<WebToolRegistry['callTool']>
>;

interface DirectToolOptions {
  expectedRevision?: number;
  sessionId?: string;
  signal?: AbortSignal;
}

interface AgentToolOptions {
  sessionId?: string;
  signal?: AbortSignal;
}

export function useLiveWebCodingToolActions({
  workspaceRevision,
}: {
  workspaceRevision: number;
}) {
  const registry = useLiveWebCodingToolRegistry();

  const toolDefinitions = useMemo(() => listAllTools(registry), [registry]);

  const listTools = useCallback(
    (source: ToolCallSource, sessionId?: string) => {
      const tools = listAllTools(registry);
      const result = { tools } satisfies ToolListResult;
      recordLiveWebCodingToolList(result.tools.length, source, sessionId);
      return result;
    },
    [registry]
  );

  const callDirectTool = useCallback(
    (
      name: string,
      argumentsValue: Record<string, unknown>,
      options: DirectToolOptions = {}
    ) => {
      const sessionId = options.sessionId ?? createToolCallSessionId();
      listTools('local', sessionId);
      const guardedArguments =
        revisionGuardedWebTools.has(name) &&
        argumentsValue.expectedRevision === undefined &&
        options.expectedRevision === undefined
          ? { ...argumentsValue, expectedRevision: workspaceRevision }
          : options.expectedRevision !== undefined &&
              argumentsValue.expectedRevision === undefined
            ? {
                ...argumentsValue,
                expectedRevision: options.expectedRevision,
              }
            : argumentsValue;

      return registry.callTool(
        toToolCallRequest({
          id: `palette-${Date.now()}-${name}`,
          name,
          arguments: guardedArguments,
        }),
        {
          context: { source: 'local', mode: 'direct', sessionId },
          signal: options.signal,
        }
      );
    },
    [listTools, registry, workspaceRevision]
  );

  const executeAgentToolCall = useCallback(
    (
      name: string,
      argumentsValue: Record<string, unknown>,
      options: AgentToolOptions = {}
    ) => {
      const sessionId = options.sessionId ?? createToolCallSessionId();
      return registry.executeModelToolCall(
        {
          id: `local-model-${Date.now()}-${name}`,
          name,
          arguments: argumentsValue,
        },
        {
          context: {
            source: 'local',
            mode: 'agent',
            sessionId,
            metadata: { provider: 'local-fallback' },
          },
          signal: options.signal,
        }
      );
    },
    [registry]
  );

  return {
    registry,
    toolDefinitions,
    listTools,
    callDirectTool,
    executeAgentToolCall,
  } satisfies {
    registry: WebToolRegistry;
    toolDefinitions: ReturnType<WebToolRegistry['listTools']>['tools'];
    listTools: (
      source: ToolCallSource,
      sessionId?: string
    ) => ReturnType<WebToolRegistry['listTools']>;
    callDirectTool: (
      name: string,
      argumentsValue: Record<string, unknown>,
      options?: DirectToolOptions
    ) => Promise<LiveWebCodingToolResult>;
    executeAgentToolCall: (
      name: string,
      argumentsValue: Record<string, unknown>,
      options?: AgentToolOptions
    ) => Promise<LiveWebCodingToolResult>;
  };
}

export type LiveWebCodingToolActions = ReturnType<
  typeof useLiveWebCodingToolActions
>;
