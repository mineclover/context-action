import React, { useMemo } from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { useWebMCPToolScope } from '../../src/tools';
import type { ToolDefinition, ToolManagementInterface } from '@context-action/tool-protocol';
import type { WebMCPToolDefinition } from '@context-action/webmcp';

const definition: ToolDefinition = {
  name: 'search',
  description: 'Search the catalog.',
  inputSchema: { type: 'object' },
};

const manager: ToolManagementInterface = {
  listTools: () => ({ tools: [definition] }),
  getToolDefinition: (name) => name === 'search' ? definition : undefined,
  hasTool: (name) => name === 'search',
  callTool: async () => ({ content: [] }),
  executeModelToolCall: async () => ({ content: [] }),
};

describe('useWebMCPToolScope', () => {
  it('registers and disposes the scoped browser tools with the component lifecycle', async () => {
    let registrationSignal: AbortSignal | undefined;
    const { result, unmount } = renderHook(() => {
      const options = useMemo(() => ({
        sessionId: 'react-page',
        toolNames: ['search'],
        document: {
          modelContext: {
            registerTool: async (_tool: unknown, registrationOptions?: { signal?: AbortSignal }) => {
              registrationSignal = registrationOptions?.signal;
            },
          },
        },
      }), []);
      return useWebMCPToolScope(manager, options);
    });

    await waitFor(() => expect(result.current.activeTools).toEqual(['search']));
    expect(result.current.supported).toBe(true);
    unmount();
    expect(registrationSignal?.aborted).toBe(true);
  });

  it('aborts a pending registration immediately when the component unmounts', async () => {
    let registrationSignal: AbortSignal | undefined;
    let releaseRegistration: (() => void) | undefined;
    const registration = new Promise<void>((resolve) => { releaseRegistration = resolve; });
    const { unmount } = renderHook(() => useWebMCPToolScope(manager, {
      sessionId: 'react-page',
      toolNames: ['search'],
      document: {
        modelContext: {
          registerTool: async (_tool: unknown, options?: { signal?: AbortSignal }) => {
            registrationSignal = options?.signal;
            await registration;
          },
        },
      },
    }));

    await waitFor(() => expect(registrationSignal).toBeDefined());
    unmount();
    expect(registrationSignal?.aborted).toBe(true);
    releaseRegistration?.();
    await waitFor(() => expect(registrationSignal?.aborted).toBe(true));
  });

  it('does not re-register when callers pass a fresh options object with unchanged values', async () => {
    const registerTool = jest.fn(async () => {});
    const document = { modelContext: { registerTool } };
    const { result } = renderHook(() => useWebMCPToolScope(manager, {
      sessionId: 'inline-options-page',
      toolNames: ['search'],
      document,
    }));

    await waitFor(() => expect(result.current.activeTools).toEqual(['search']));
    expect(registerTool).toHaveBeenCalledTimes(1);
  });

  it('uses the latest non-serializable execution options without re-registering', async () => {
    const registered: WebMCPToolDefinition[] = [];
    const document = {
      modelContext: { registerTool: async (tool: WebMCPToolDefinition) => { registered.push(tool); } },
    };
    const first = jest.fn();
    const second = jest.fn();
    const { rerender } = renderHook(({ beforeExecute, metadata }) => useWebMCPToolScope(manager, {
      sessionId: 'latest-options',
      toolNames: ['search'],
      document,
      context: { metadata: { payload: metadata } },
      beforeExecute,
    }), {
      initialProps: { beforeExecute: first, metadata: new Map([['version', 1]]) },
    });

    await waitFor(() => expect(registered).toHaveLength(1));
    rerender({ beforeExecute: second, metadata: new Map([['version', 2]]) });
    await registered[0]!.execute({ query: 'coffee' });
    expect(registered).toHaveLength(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
