/**
 * @fileoverview ToolContext Tests
 *
 * Tests for createToolContext - the unified tool registry for LLM integration.
 */

import React, { useCallback } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import { createToolContext } from '../../src';
import {
  createMockDurableOperationBackend,
  createMockDurableOperationStore,
} from '../../../tool-durable-operations/__tests__/support/mock-durable-operation-store';
import {
  defineAction,
  createActionSchema,
  createToolCallFingerprint,
  createToolObservabilityPolicy,
  createToolOperationKey,
  isToolCallRequest,
  isToolListRequest,
  TOOL_CALL_ERROR_CODES,
  toToolCallRequest,
  toToolListRequest,
  type ToolCallRequest,
  type ToolCallResult,
  type ToolExecutionProvenance,
  type ToolListRequest,
} from '@context-action/tool-protocol';

describe('createToolContext', () => {
  // Create a test schema
  const testSchema = createActionSchema({
    searchProducts: defineAction({
      name: 'searchProducts',
      description: 'Search for products in the catalog',
      parameters: z.object({
        query: z.string().min(1),
        category: z.enum(['electronics', 'clothing', 'home']).optional(),
        maxResults: z.number().int().positive().default(10),
      }),
    }, z),

    addToCart: defineAction({
      name: 'addToCart',
      description: 'Add a product to the shopping cart',
      parameters: z.object({
        productId: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    }, z),

    checkout: defineAction({
      name: 'checkout',
      description: 'Process checkout',
      parameters: z.object({
        paymentMethod: z.enum(['credit_card', 'paypal', 'crypto']),
        shippingAddress: z.object({
          street: z.string(),
          city: z.string(),
          country: z.string(),
        }),
      }),
    }, z),
  });

  const {
    Provider: ToolProvider,
    useToolDispatch,
    useToolHandler,
    useToolRegistry,
    useToolDispatchWithResult,
    useActionRegister,
  } = createToolContext('TestTools', {
    schema: testSchema,
    validationMode: 'strict',
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ToolProvider>{children}</ToolProvider>
  );

  describe('Provider and Context', () => {
    it('should provide context to children', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });
      expect(result.current).toBeDefined();
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useToolDispatch());
      }).toThrow(/must be used within a TestTools ToolContext Provider/);

      consoleSpy.mockRestore();
    });

    it('should destroy the action register when the provider unmounts', async () => {
      const { result, unmount } = renderHook(() => useActionRegister(), { wrapper });
      const register = result.current;
      expect(register).not.toBeNull();

      const destroySpy = jest.spyOn(register!, 'destroyAsync');

      unmount();

      await waitFor(() => expect(destroySpy).toHaveBeenCalledTimes(1));
    });

    it('should preserve handlers through StrictMode replay and clean up once', async () => {
      const handler = jest.fn();
      const handlerCleanup = jest.fn();
      const strictWrapper = ({ children }: { children: React.ReactNode }) => (
        <React.StrictMode>
          <ToolProvider>{children}</ToolProvider>
        </React.StrictMode>
      );

      const { result, unmount } = renderHook(() => {
        useToolHandler('addToCart', useCallback(handler, []), { cleanup: handlerCleanup });
        return {
          dispatch: useToolDispatch(),
          register: useActionRegister(),
        };
      }, { wrapper: strictWrapper });

      const destroySpy = jest.spyOn(result.current.register!, 'destroyAsync');
      await act(async () => {});
      expect(handlerCleanup).not.toHaveBeenCalled();
      expect(destroySpy).not.toHaveBeenCalled();

      await act(async () => {
        await result.current.dispatch('addToCart', { productId: 'one', quantity: 1 });
      });
      expect(handler).toHaveBeenCalledTimes(1);

      unmount();
      await waitFor(() => {
        expect(handlerCleanup).toHaveBeenCalledTimes(1);
        expect(destroySpy).toHaveBeenCalledTimes(1);
      });
    });

    it('should replace a tool handler when its lifecycle config changes', async () => {
      const handler = jest.fn();
      const firstCleanup = jest.fn();
      const secondCleanup = jest.fn();

      const { result, rerender, unmount } = renderHook(
        ({ cleanup }: { cleanup: () => void }) => {
          useToolHandler('addToCart', useCallback(handler, []), {
            id: 'configurable-tool-handler',
            cleanup,
          });
          return useActionRegister();
        },
        {
          wrapper,
          initialProps: { cleanup: firstCleanup },
        }
      );

      expect(result.current?.getHandlerCount('addToCart')).toBe(1);

      rerender({ cleanup: secondCleanup });

      expect(firstCleanup).toHaveBeenCalledTimes(1);
      expect(result.current?.getHandlerCount('addToCart')).toBe(1);

      unmount();
      await waitFor(() => expect(secondCleanup).toHaveBeenCalledTimes(1));
    });

    it('should reject active and queued tool dispatches before cleanup', async () => {
      const events: string[] = [];
      const handlerCleanup = jest.fn();
      let releaseFirst!: () => void;
      let markFirstStarted!: () => void;
      const firstStarted = new Promise<void>(resolve => { markFirstStarted = resolve; });
      const gate = new Promise<void>(resolve => { releaseFirst = resolve; });

      const { result, unmount } = renderHook(() => {
        useToolHandler('addToCart', useCallback(async ({ productId }) => {
          events.push(`start:${productId}`);
          if (productId === 'first') {
            markFirstStarted();
            await gate;
          }
          events.push(`finish:${productId}`);
        }, []), { cleanup: handlerCleanup });
        return {
          dispatch: useToolDispatch(),
          register: useActionRegister(),
        };
      }, { wrapper });

      const destroySpy = jest.spyOn(result.current.register!, 'destroyAsync');
      const first = result.current.dispatch(
        'addToCart',
        { productId: 'first', quantity: 1 }
      ).catch(error => error as Error);
      await firstStarted;
      const second = result.current.dispatch(
        'addToCart',
        { productId: 'second', quantity: 1 }
      ).catch(error => error as Error);

      unmount();
      await expect(first).resolves.toMatchObject({ name: 'AbortError' });
      await expect(second).resolves.toMatchObject({ name: 'AbortError' });
      expect(events).toEqual(['start:first']);
      expect(handlerCleanup).not.toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalledTimes(1);

      releaseFirst();
      await waitFor(() => {
        expect(handlerCleanup).toHaveBeenCalledTimes(1);
        expect(destroySpy).toHaveBeenCalledTimes(1);
      });
      expect(events).toEqual(['start:first', 'finish:first']);
    });
  });

  describe('useToolRegistry', () => {
    it('should return registry with all tools', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      expect(result.current.getToolNames()).toEqual([
        'searchProducts',
        'addToCart',
        'checkout',
      ]);
    });

    it('should get individual tool', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const searchTool = result.current.getTool('searchProducts');
      expect(searchTool.name).toBe('searchProducts');
      expect(searchTool.description).toBe('Search for products in the catalog');
    });

    it('should check if tool exists', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      expect(result.current.hasTool('searchProducts')).toBe(true);
      expect(result.current.hasTool('nonExistent')).toBe(false);
    });

    it('should throw when getting non-existent tool', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      expect(() => {
        result.current.getTool('nonExistent' as keyof typeof testSchema);
      }).toThrow(/Tool "nonExistent" not found/);
    });
  });

  describe('Standard tool protocol management', () => {
    it('exposes the canonical model-call to tools/call adapter', () => {
      expect(
        toToolCallRequest({
          id: 'model-call-1',
          name: 'searchProducts',
          arguments: { query: 'laptop' },
        })
      ).toEqual({
        id: 'model-call-1',
        method: 'tools/call',
        params: {
          name: 'searchProducts',
          arguments: { query: 'laptop' },
        },
      });
    });

    it('exposes the canonical tools/list request adapter with cursor support', () => {
      expect(toToolListRequest()).toEqual({ method: 'tools/list' });
      expect(toToolListRequest({ cursor: 'offset:2' })).toEqual({
        method: 'tools/list',
        params: { cursor: 'offset:2' },
      });
    });

    it('rejects malformed runtime protocol requests before execution', async () => {
      expect(isToolListRequest({ method: 'tools/call' })).toBe(false);
      expect(
        isToolCallRequest({
          method: 'tools/call',
          params: { name: 'searchProducts', arguments: [] },
        })
      ).toBe(false);

      const handler = jest.fn();
      const { result } = renderHook(
        () => {
          useToolHandler('searchProducts', useCallback(handler, []));
          return useToolRegistry();
        },
        { wrapper }
      );
      const malformedCall = {
        method: 'tools/list',
        params: { name: 'searchProducts', arguments: {} },
      } as unknown as ToolCallRequest;
      const callResult = await act(async () =>
        result.current.callTool(malformedCall)
      );

      expect(callResult).toMatchObject({
        isError: true,
        error: { code: 'TOOL_VALIDATION_FAILED' },
      });
      expect(handler).not.toHaveBeenCalled();
      expect(() =>
        result.current.listTools({ method: 'tools/call' } as unknown as ToolListRequest)
      ).toThrow('Invalid tools/list request.');
      expect(() =>
        result.current.listTools(null as unknown as ToolListRequest)
      ).toThrow('Invalid tools/list request.');
    });

    it('should expose tools/list definitions through the registry', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const listed = result.current.listTools({ method: 'tools/list' });

      expect(listed.tools.map((tool) => tool.name)).toEqual([
        'searchProducts',
        'addToCart',
        'checkout',
      ]);
      expect(result.current.getToolDefinition('searchProducts')).toMatchObject({
        name: 'searchProducts',
        inputSchema: expect.objectContaining({ type: 'object' }),
      });
    });

    it('should paginate canonical tools/list discovery without truncating provider exports', () => {
      const PaginatedTools = createToolContext('PaginatedTools', {
        schema: testSchema,
        toolListPageSize: 2,
      });
      const paginatedWrapper = ({ children }: { children: React.ReactNode }) => (
        <PaginatedTools.Provider>{children}</PaginatedTools.Provider>
      );
      const { result } = renderHook(
        () => PaginatedTools.useToolRegistry(),
        { wrapper: paginatedWrapper }
      );

      const firstPage = result.current.listTools({ method: 'tools/list' });
      expect(firstPage.tools.map((tool) => tool.name)).toEqual([
        'searchProducts',
        'addToCart',
      ]);
      expect(firstPage.nextCursor).toBe('offset:2');

      const secondPage = result.current.listTools({
        method: 'tools/list',
        params: { cursor: firstPage.nextCursor },
      });
      expect(secondPage.tools.map((tool) => tool.name)).toEqual(['checkout']);
      expect(secondPage.nextCursor).toBeUndefined();
      expect(result.current.toMCP()).toHaveLength(3);
      expect(result.current.toOpenAI()).toHaveLength(3);
    });

    it('should execute tools/call and return structured tool result', async () => {
      const handler = jest.fn().mockResolvedValue({ items: ['product-1'] });
      const { result } = renderHook(
        () => {
          useToolHandler('searchProducts', useCallback(handler, []));
          return useToolRegistry();
        },
        { wrapper }
      );

      const toolResult = await act(async () =>
        result.current.callTool({
          method: 'tools/call',
          params: {
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          },
        })
      );

      expect(toolResult).toMatchObject({
        structuredContent: { items: ['product-1'] },
        content: [{ type: 'text' }],
      });
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'laptop' }),
        expect.any(Object)
      );
    });

    it('should expose additive execution provenance on lifecycle events', async () => {
      const events: Array<{ type: string; provenance: ToolExecutionProvenance }> = [];
      const provenanceContext = createToolContext('ProvenanceTools', {
        schema: testSchema,
        executionOwnerId: 'audit-worker',
        onToolCall: event => events.push({ type: event.type, provenance: event.provenance }),
      });
      const provenanceWrapper = ({ children }: { children: React.ReactNode }) => (
        <provenanceContext.Provider>{children}</provenanceContext.Provider>
      );
      const { result } = renderHook(
        () => {
          provenanceContext.useToolHandler(
            'searchProducts',
            useCallback(async () => ({ text: 'ok' }), [])
          );
          return provenanceContext.useToolRegistry();
        },
        { wrapper: provenanceWrapper }
      );

      await act(async () => result.current.callTool({
        method: 'tools/call',
        id: 'provenance-1',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      }));

      expect(events).toHaveLength(2);
      expect(events[0]).toMatchObject({
        type: 'started',
        provenance: {
          phase: 'tool-call',
          ownerId: 'audit-worker',
          state: 'pending',
          usedOutputBytes: 0,
        },
      });
      expect(events[1]).toMatchObject({
        type: 'completed',
        provenance: {
          phase: 'tool-call',
          ownerId: 'audit-worker',
          state: 'completed',
        },
      });
      expect(events[1]!.provenance.elapsedMs).toEqual(expect.any(Number));
      expect(events[1]!.provenance.usedOutputBytes).toBeGreaterThan(0);
    });

    it('should connect discovery, model calls, canonical tools/call, and results', async () => {
      const lifecycleRequests: string[] = [];
      const protocolContext = createToolContext('ProtocolFlowTools', {
        schema: testSchema,
        onToolCall: (event) => {
          lifecycleRequests.push(`${event.type}:${event.request.method}`);
        },
      });
      const protocolWrapper = ({ children }: { children: React.ReactNode }) => (
        <protocolContext.Provider>{children}</protocolContext.Provider>
      );
      const handler = jest.fn().mockResolvedValue({ items: ['product-1'] });
      const { result } = renderHook(
        () => {
          protocolContext.useToolHandler(
            'searchProducts',
            useCallback(handler, [])
          );
          return protocolContext.useToolRegistry();
        },
        { wrapper: protocolWrapper }
      );

      const discovery = result.current.listTools(toToolListRequest());
      const discoveredTool = discovery.tools.find(
        (tool) => tool.name === 'searchProducts'
      );
      expect(discoveredTool).toBeDefined();

      const toolResult = await act(async () =>
        result.current.executeModelToolCall({
          id: 'protocol-flow-1',
          name: discoveredTool!.name,
          arguments: { query: 'laptop' },
        })
      );

      expect(toolResult).toMatchObject({
        toolCallId: 'protocol-flow-1',
        structuredContent: { items: ['product-1'] },
        content: [{ type: 'text' }],
      });
      expect(lifecycleRequests).toEqual([
        'started:tools/call',
        'completed:tools/call',
      ]);
    });

    it('should keep direct palette and model calls on one policy/result boundary', async () => {
      const policyDecisions: string[] = [];
      const lifecycleRequests: string[] = [];
      const policyParityContext = createToolContext('PolicyParityTools', {
        schema: testSchema,
        onToolCall: (event) => {
          lifecycleRequests.push(`${event.type}:${event.request.method}`);
        },
        toolPolicy: ({ context }) => {
          policyDecisions.push(`${context?.source}:${context?.mode}`);
          return context?.mode === 'direct' ? 'allow' : 'deny';
        },
      });
      const policyParityWrapper = ({ children }: { children: React.ReactNode }) => (
        <policyParityContext.Provider>{children}</policyParityContext.Provider>
      );
      const handler = jest.fn().mockResolvedValue({ items: ['product-1'] });
      const { result } = renderHook(
        () => {
          policyParityContext.useToolHandler(
            'searchProducts',
            useCallback(handler, [])
          );
          return policyParityContext.useToolRegistry();
        },
        { wrapper: policyParityWrapper }
      );

      const directResult = await act(async () =>
        result.current.callTool(
          toToolCallRequest({
            id: 'palette-call-1',
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          }),
          {
            context: {
              source: 'local',
              mode: 'direct',
            },
          }
        )
      );
      const modelResult = await act(async () =>
        result.current.executeModelToolCall(
          {
            id: 'model-call-1',
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          },
          {
            context: {
              source: 'model',
              mode: 'agent',
            },
          }
        )
      );

      expect(directResult).toMatchObject({
        toolCallId: 'palette-call-1',
        structuredContent: { items: ['product-1'] },
      });
      expect(modelResult).toMatchObject({
        isError: true,
        toolCallId: 'model-call-1',
        error: { code: 'TOOL_POLICY_DENIED' },
      });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(policyDecisions).toEqual([
        'local:direct',
        'model:agent',
      ]);
      expect(lifecycleRequests).toEqual([
        'started:tools/call',
        'completed:tools/call',
        'started:tools/call',
        'failed:tools/call',
      ]);
    });

    it('should validate structured handler output against the tool contract', async () => {
      const outputSchema = createActionSchema({
        getStatus: defineAction({
          name: 'getStatus',
          parameters: z.object({}),
          outputSchema: z.object({
            ready: z.boolean(),
          }),
        }, z),
      });
      const OutputTools = createToolContext('OutputTools', {
        schema: outputSchema,
      });
      const outputWrapper = ({ children }: { children: React.ReactNode }) => (
        <OutputTools.Provider>{children}</OutputTools.Provider>
      );
      const { result } = renderHook(
        () => {
          OutputTools.useToolHandler(
            'getStatus',
            useCallback(async () => ({ ready: 'yes' }), [])
          );
          return OutputTools.useToolRegistry();
        },
        { wrapper: outputWrapper }
      );

      const toolResult = await act(async () =>
        result.current.callTool({
          method: 'tools/call',
          id: 'output-check',
          params: { name: 'getStatus', arguments: {} },
        })
      );

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'output-check',
        error: {
          code: 'TOOL_OUTPUT_VALIDATION_FAILED',
          details: { issues: expect.any(Array) },
        },
      });
    });

    it('should reject invalid tools/call arguments before policy and handlers', async () => {
      const policy = jest.fn().mockReturnValue('allow');
      const handler = jest.fn();
      const ValidationTools = createToolContext('CallValidationTools', {
        schema: testSchema,
        toolPolicy: policy,
      });
      const validationWrapper = ({ children }: { children: React.ReactNode }) => (
        <ValidationTools.Provider>{children}</ValidationTools.Provider>
      );
      const { result } = renderHook(
        () => {
          ValidationTools.useToolHandler('searchProducts', useCallback(handler, []));
          return ValidationTools.useToolRegistry();
        },
        { wrapper: validationWrapper }
      );

      const toolResult = await act(async () =>
        result.current.callTool({
          method: 'tools/call',
          id: 'invalid-call',
          params: {
            name: 'searchProducts',
            arguments: { query: '' },
          },
        })
      );

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'invalid-call',
        error: {
          code: 'TOOL_VALIDATION_FAILED',
          details: { issues: expect.any(Array) },
        },
      });
      expect(policy).not.toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should preserve a blocking handler error in the tools/call result', async () => {
      const handler = jest.fn().mockRejectedValue(new Error('workspace conflict'));
      const { result } = renderHook(
        () => {
          useToolHandler('searchProducts', useCallback(handler, []), {
            blocking: true,
          });
          return useToolRegistry();
        },
        { wrapper }
      );

      const toolResult = await act(async () =>
        result.current.callTool({
          method: 'tools/call',
          params: {
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          },
        })
      );

      expect(toolResult.isError).toBe(true);
      expect(toolResult.error).toMatchObject({
        code: 'TOOL_EXECUTION_FAILED',
        message: 'workspace conflict',
        details: { message: 'workspace conflict' },
      });
      expect(toolResult.content[0]).toEqual({
        type: 'text',
        text: 'workspace conflict',
      });
    });

    it('should preserve structured metadata from a blocking handler error', async () => {
      const handlerError = Object.assign(new Error('stale revision'), {
        code: 'WORKSPACE_REVISION_CONFLICT',
        retryable: true,
        details: { expectedRevision: 3, currentRevision: 4 },
      });
      const handler = jest.fn().mockRejectedValue(handlerError);
      const { result } = renderHook(
        () => {
          useToolHandler('searchProducts', useCallback(handler, []), {
            blocking: true,
          });
          return useToolRegistry();
        },
        { wrapper }
      );

      const toolResult = await act(async () =>
        result.current.callTool({
          method: 'tools/call',
          params: {
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          },
        })
      );

      expect(toolResult.error).toMatchObject({
        code: 'WORKSPACE_REVISION_CONFLICT',
        retryable: true,
        details: { expectedRevision: 3, currentRevision: 4 },
      });
    });

    it('should normalize model tool calls and return MCP-style errors', async () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const toolResult = await act(async () =>
        result.current.executeModelToolCall({
          id: 'call-1',
          name: 'unknownTool',
          arguments: {},
        })
      );

      expect(toolResult.isError).toBe(true);
      expect(toolResult.content[0]).toMatchObject({
        type: 'text',
        text: expect.stringMatching(/unknownTool/),
      });
      expect(toolResult.toolCallId).toBe('call-1');
      expect(toolResult.error).toMatchObject({ code: 'TOOL_NOT_FOUND' });
    });

    it('should reject prototype names instead of treating them as tools', async () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      expect(result.current.hasTool('toString')).toBe(false);
      const toolResult = await act(async () =>
        result.current.executeModelToolCall({ name: 'toString', arguments: {} })
      );

      expect(toolResult.isError).toBe(true);
      expect(toolResult.error).toMatchObject({ code: 'TOOL_NOT_FOUND' });
    });

    it('should preserve call identity and default model execution to agent mode', async () => {
      const events: string[] = [];
      const contexts: Array<{
        source?: string;
        mode?: string;
        sessionId?: string;
        revision?: string | number;
      }> = [];
      const observedContext = createToolContext('ObservedTools', {
        schema: testSchema,
        onToolCall: event => {
          events.push(`${event.type}:${event.name}`);
          contexts.push(event.context ?? {});
        },
      });
      const observedWrapper = ({ children }: { children: React.ReactNode }) => (
        <observedContext.Provider>{children}</observedContext.Provider>
      );
      const handler = jest.fn().mockResolvedValue({ ok: true });
      const { result } = renderHook(
        () => {
          observedContext.useToolHandler('searchProducts', useCallback(handler, []));
          return observedContext.useToolRegistry();
        },
        { wrapper: observedWrapper }
      );

      const toolResult = await act(async () =>
        result.current.executeModelToolCall({
          id: 'call-observed',
          name: 'searchProducts',
          arguments: { query: 'laptop' },
        }, {
          context: {
            sessionId: 'session-observed',
            revision: 7,
          },
        })
      );

      expect(toolResult.toolCallId).toBe('call-observed');
      expect(events).toEqual(['started:searchProducts', 'completed:searchProducts']);
      expect(contexts).toEqual([
        {
          source: 'model',
          mode: 'agent',
          sessionId: 'session-observed',
          revision: 7,
        },
        {
          source: 'model',
          mode: 'agent',
          sessionId: 'session-observed',
          revision: 7,
        },
      ]);
    });

    it('should preserve an explicit source when normalizing a model call', async () => {
      const contexts: Array<{ source?: string; provider?: string }> = [];
      const observedContext = createToolContext('SourceAwareTools', {
        schema: testSchema,
        onToolCall: (event) => {
          contexts.push({
            source: event.context?.source,
            provider:
              typeof event.context?.metadata?.provider === 'string'
                ? event.context.metadata.provider
                : undefined,
          });
        },
      });
      const observedWrapper = ({ children }: { children: React.ReactNode }) => (
        <observedContext.Provider>{children}</observedContext.Provider>
      );
      const { result } = renderHook(
        () => {
          observedContext.useToolHandler(
            'searchProducts',
            useCallback(async () => ({ ok: true }), [])
          );
          return observedContext.useToolRegistry();
        },
        { wrapper: observedWrapper }
      );

      await act(async () =>
        result.current.executeModelToolCall(
          {
            id: 'local-call',
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          },
          {
            context: {
              source: 'local',
              metadata: { provider: 'local-fallback' },
            },
          }
        )
      );

      expect(contexts).toEqual([
        { source: 'local', provider: 'local-fallback' },
        { source: 'local', provider: 'local-fallback' },
      ]);
    });

    it('includes the canonical tools/call request in lifecycle events', async () => {
      const requests: Array<{
        type: string;
        name: string;
        arguments?: Record<string, unknown>;
      }> = [];
      const observedContext = createToolContext('ObservedRequestTools', {
        schema: testSchema,
        onToolCall: event =>
          requests.push({
            type: event.type,
            name: event.name,
            arguments: event.request.params.arguments,
          }),
      });
      const observedWrapper = ({ children }: { children: React.ReactNode }) => (
        <observedContext.Provider>{children}</observedContext.Provider>
      );
      const { result } = renderHook(
        () => {
          observedContext.useToolHandler(
            'searchProducts',
            useCallback(async () => ({ ok: true }), [])
          );
          return observedContext.useToolRegistry();
        },
        { wrapper: observedWrapper }
      );

      await act(async () =>
        result.current.callTool({
          method: 'tools/call',
          id: 'request-1',
          params: {
            name: 'searchProducts',
            arguments: { query: 'keyboard' },
          },
        })
      );

      expect(requests).toEqual([
        {
          type: 'started',
          name: 'searchProducts',
          arguments: { query: 'keyboard' },
        },
        {
          type: 'completed',
          name: 'searchProducts',
          arguments: { query: 'keyboard' },
        },
      ]);
    });

    it('should enforce an execution allowlist and policy decision', async () => {
      const policyContext = createToolContext('PolicyTools', {
        schema: testSchema,
        allowedToolNames: ['searchProducts', 'checkout'],
        toolPolicy: ({ request }) =>
          request.params.name === 'searchProducts' ? 'allow' : 'deny',
      });
      const policyWrapper = ({ children }: { children: React.ReactNode }) => (
        <policyContext.Provider>{children}</policyContext.Provider>
      );
      const { result } = renderHook(() => policyContext.useToolRegistry(), {
        wrapper: policyWrapper,
      });

      expect(result.current.getToolNames()).toEqual(['searchProducts', 'checkout']);
      expect(result.current.listTools().tools.map((tool) => tool.name)).toEqual([
        'searchProducts',
        'checkout',
      ]);
      const denied = await act(async () =>
        result.current.executeModelToolCall({
          name: 'checkout',
          arguments: {
            paymentMethod: 'credit_card',
            shippingAddress: {
              street: '1 Main St',
              city: 'Seoul',
              country: 'KR',
            },
          },
        })
      );

      expect(denied.isError).toBe(true);
      expect(denied.error).toMatchObject({ code: 'TOOL_POLICY_DENIED' });

      expect(() => result.current.toMCPFiltered(['addToCart'])).toThrow(
        /not available in registry/
      );
      expect(() => result.current.toOpenAIFiltered(['addToCart'])).toThrow(
        /not available in registry/
      );
      expect(() => result.current.toAnthropicFiltered(['addToCart'])).toThrow(
        /not available in registry/
      );
    });

    it('should cancel a policy wait when the tool call signal aborts', async () => {
      const policyContext = createToolContext('AbortPolicyTools', {
        schema: testSchema,
        toolPolicy: ({ signal }) =>
          new Promise((resolve, reject) => {
            if (!signal) {
              resolve('allow');
              return;
            }
            signal.addEventListener(
              'abort',
              () => reject(new Error('policy wait cancelled')),
              { once: true }
            );
          }),
      });
      const policyWrapper = ({ children }: { children: React.ReactNode }) => (
        <policyContext.Provider>{children}</policyContext.Provider>
      );
      const { result } = renderHook(() => policyContext.useToolRegistry(), {
        wrapper: policyWrapper,
      });
      const controller = new AbortController();
      const pendingCall = result.current.callTool(
        {
          method: 'tools/call',
          id: 'abort-policy',
          params: {
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          },
        },
        { signal: controller.signal }
      );

      controller.abort();
      const toolResult = await act(async () => pendingCall);

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'abort-policy',
        error: { code: 'TOOL_CANCELLED', retryable: true },
      });
    });

    it('should use the same cancellation result when a handler is running', async () => {
      const events: Array<{ type: string; provenance: ToolExecutionProvenance }> = [];
      const cancellationContext = createToolContext('AbortHandlerTools', {
        schema: testSchema,
        onToolCall: event => events.push({ type: event.type, provenance: event.provenance }),
      });
      const cancellationWrapper = ({ children }: { children: React.ReactNode }) => (
        <cancellationContext.Provider>{children}</cancellationContext.Provider>
      );
      const { result } = renderHook(
        () => {
          cancellationContext.useToolHandler(
            'searchProducts',
            useCallback(async (_payload, controller) => {
              await new Promise<void>((resolve) => {
                if (controller.signal?.aborted) {
                  resolve();
                  return;
                }
                controller.signal?.addEventListener('abort', () => resolve(), {
                  once: true,
                });
              });
            }, [])
          );
          return cancellationContext.useToolRegistry();
        },
        { wrapper: cancellationWrapper }
      );
      const controller = new AbortController();
      const pendingCall = result.current.executeModelToolCall(
        {
          id: 'abort-handler',
          name: 'searchProducts',
          arguments: { query: 'laptop' },
        },
        { signal: controller.signal }
      );

      controller.abort();
      const toolResult = await act(async () => pendingCall);

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'abort-handler',
        error: { code: 'TOOL_CANCELLED', retryable: true },
      });
      expect(events[events.length - 1]).toMatchObject({
        type: 'failed',
        provenance: { state: 'cancelled' },
      });
    });

    it('should return a canonical error for invalid tool-call timeout options', async () => {
      const handler = jest.fn();
      const timeoutContext = createToolContext('InvalidTimeoutTools', {
        schema: testSchema,
      });
      const timeoutWrapper = ({ children }: { children: React.ReactNode }) => (
        <timeoutContext.Provider>{children}</timeoutContext.Provider>
      );
      const { result } = renderHook(
        () => {
          timeoutContext.useToolHandler('searchProducts', useCallback(handler, []));
          return timeoutContext.useToolRegistry();
        },
        { wrapper: timeoutWrapper }
      );

      const toolResult = await act(async () =>
        result.current.callTool(
          {
            method: 'tools/call',
            id: 'invalid-timeout',
            params: { name: 'searchProducts', arguments: { query: 'laptop' } },
          },
          { timeout: -1 }
        )
      );

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'invalid-timeout',
        error: { code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS, retryable: false },
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should return a canonical error for an invalid per-call provenance owner', async () => {
      const ownerContext = createToolContext('InvalidOwnerTools', { schema: testSchema });
      const ownerWrapper = ({ children }: { children: React.ReactNode }) => (
        <ownerContext.Provider>{children}</ownerContext.Provider>
      );
      const { result } = renderHook(() => ownerContext.useToolRegistry(), {
        wrapper: ownerWrapper,
      });

      const toolResult = await act(async () => result.current.callTool(
        {
          method: 'tools/call',
          id: 'invalid-owner',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { executionOwnerId: ' '.repeat(2) }
      ));

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'invalid-owner',
        error: { code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS, retryable: false },
      });
    });

    it('should time out policy evaluation and expose an aborted policy signal', async () => {
      let policySignal: AbortSignal | undefined;
      const timeoutContext = createToolContext('TimeoutPolicyTools', {
        schema: testSchema,
        toolPolicy: ({ signal }) => new Promise(resolve => {
          policySignal = signal;
          signal?.addEventListener('abort', () => resolve('allow'), { once: true });
        }),
      });
      const timeoutWrapper = ({ children }: { children: React.ReactNode }) => (
        <timeoutContext.Provider>{children}</timeoutContext.Provider>
      );
      const { result } = renderHook(() => timeoutContext.useToolRegistry(), {
        wrapper: timeoutWrapper,
      });

      const toolResult = await act(async () =>
        result.current.callTool(
          {
            method: 'tools/call',
            id: 'policy-timeout',
            params: { name: 'searchProducts', arguments: { query: 'laptop' } },
          },
          { timeout: 10 }
        )
      );

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'policy-timeout',
        error: {
          code: TOOL_CALL_ERROR_CODES.TIMEOUT,
          retryable: true,
          details: { timeoutMs: 10 },
        },
      });
      expect(policySignal?.aborted).toBe(true);
    });

    it('should time out a running handler without waiting for an ignored signal', async () => {
      const events: Array<{ type: string; provenance: ToolExecutionProvenance }> = [];
      const timeoutContext = createToolContext('TimeoutHandlerTools', {
        schema: testSchema,
        onToolCall: event => events.push({ type: event.type, provenance: event.provenance }),
      });
      const timeoutWrapper = ({ children }: { children: React.ReactNode }) => (
        <timeoutContext.Provider>{children}</timeoutContext.Provider>
      );
      const { result, unmount } = renderHook(
        () => {
          timeoutContext.useToolHandler(
            'searchProducts',
            useCallback(async () => {
              await new Promise(resolve => setTimeout(resolve, 40));
              return { completedAfterTimeout: true };
            }, [])
          );
          return timeoutContext.useToolRegistry();
        },
        { wrapper: timeoutWrapper }
      );

      const toolResult = await act(async () =>
        result.current.callTool(
          {
            method: 'tools/call',
            id: 'handler-timeout',
            params: { name: 'searchProducts', arguments: { query: 'laptop' } },
          },
          { timeout: 10 }
        )
      );

      expect(toolResult).toMatchObject({
        isError: true,
        toolCallId: 'handler-timeout',
        error: {
          code: TOOL_CALL_ERROR_CODES.TIMEOUT,
          retryable: true,
          details: { timeoutMs: 10 },
        },
      });
      expect(events[events.length - 1]).toMatchObject({
        type: 'failed',
        provenance: {
          state: 'unknown',
          timeoutMs: 10,
        },
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      unmount();
    });

    it('should enforce an optional output budget and retain measured usage in provenance', async () => {
      const events: Array<{ type: string; provenance: ToolExecutionProvenance }> = [];
      const outputBackend = createMockDurableOperationBackend<ToolCallResult>();
      const outputStore = createMockDurableOperationStore(outputBackend, 'output-budget-owner');
      const outputContext = createToolContext('OutputBudgetTools', {
        schema: testSchema,
        executionOwnerId: 'output-budget-owner',
        durableOperationStore: outputStore,
        durableOperationOwnerId: 'output-budget-owner',
        onToolCall: event => events.push({ type: event.type, provenance: event.provenance }),
      });
      const outputWrapper = ({ children }: { children: React.ReactNode }) => (
        <outputContext.Provider>{children}</outputContext.Provider>
      );
      const { result } = renderHook(
        () => {
          outputContext.useToolHandler(
            'searchProducts',
            useCallback(async () => ({ text: 'x'.repeat(128) }), [])
          );
          return outputContext.useToolRegistry();
        },
        { wrapper: outputWrapper }
      );

      const toolResult = await act(async () => result.current.callTool(
        {
          method: 'tools/call',
          id: 'output-budget',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { maxOutputBytes: 16, idempotencyKey: 'output-budget-operation' }
      ));

      expect(toolResult).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.OUTPUT_LIMIT_EXCEEDED,
          details: { maxOutputBytes: 16 },
        },
      });
      expect(events[events.length - 1]).toMatchObject({
        type: 'failed',
        provenance: {
          ownerId: 'output-budget-owner',
          state: 'failed',
          maxOutputBytes: 16,
        },
      });
      expect(events[events.length - 1]!.provenance.usedOutputBytes).toBeGreaterThan(16);
      await expect(
        result.current.getOperationStatus('searchProducts', 'output-budget-operation')
      ).resolves.toMatchObject({
        state: 'failed',
        result: { error: { code: TOOL_CALL_ERROR_CODES.OUTPUT_LIMIT_EXCEEDED } },
      });
    });

    it('should share a timed-out mutation with a retry using the same idempotency key', async () => {
      let markStarted!: () => void;
      let releaseHandler!: () => void;
      const started = new Promise<void>(resolve => {
        markStarted = resolve;
      });
      const handler = jest.fn(async () => {
        markStarted();
        await new Promise<void>(resolve => {
          releaseHandler = resolve;
        });
        return { saved: true };
      });
      const idempotentContext = createToolContext('IdempotentTools', {
        schema: testSchema,
      });
      const idempotentWrapper = ({ children }: { children: React.ReactNode }) => (
        <idempotentContext.Provider>{children}</idempotentContext.Provider>
      );
      const { result, unmount } = renderHook(
        () => {
          idempotentContext.useToolHandler('searchProducts', useCallback(handler, []));
          return idempotentContext.useToolRegistry();
        },
        { wrapper: idempotentWrapper }
      );
      const request = {
        method: 'tools/call' as const,
        id: 'idempotent-first',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      };

      const firstPending = result.current.callTool(request, {
        timeout: 10,
        idempotencyKey: 'save-operation-1',
      });
      await started;
      const first = await act(async () => firstPending);

      expect(first).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.TIMEOUT,
          details: { executionState: 'detached' },
        },
      });

      const replayPending = result.current.callTool(
        { ...request, id: 'idempotent-retry' },
        { timeout: 100, idempotencyKey: 'save-operation-1' }
      );
      expect(handler).toHaveBeenCalledTimes(1);
      releaseHandler();
      const replay = await act(async () => replayPending);

      expect(replay).toMatchObject({
        toolCallId: 'idempotent-retry',
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
          retryable: true,
        },
      });
      expect(handler).toHaveBeenCalledTimes(1);

      const conflict = await result.current.callTool(
        {
          ...request,
          id: 'idempotent-conflict',
          params: { name: 'searchProducts', arguments: { query: 'tablet' } },
        },
        { idempotencyKey: 'save-operation-1' }
      );
      expect(conflict).toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_CONFLICT, retryable: false },
      });
      expect(handler).toHaveBeenCalledTimes(1);
      unmount();
    });

    it('should reject malformed idempotency keys before invoking a handler', async () => {
      const handler = jest.fn();
      const invalidKeyContext = createToolContext('InvalidIdempotencyTools', {
        schema: testSchema,
      });
      const invalidKeyWrapper = ({ children }: { children: React.ReactNode }) => (
        <invalidKeyContext.Provider>{children}</invalidKeyContext.Provider>
      );
      const { result } = renderHook(
        () => {
          invalidKeyContext.useToolHandler('searchProducts', useCallback(handler, []));
          return invalidKeyContext.useToolRegistry();
        },
        { wrapper: invalidKeyWrapper }
      );

      const response = await result.current.callTool(
        {
          method: 'tools/call',
          id: 'invalid-idempotency',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: '' }
      );

      expect(response).toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS, retryable: false },
      });
      expect(handler).not.toHaveBeenCalled();
    });

    it('should replay a durable result after a provider restart and expose status', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const storeA = createMockDurableOperationStore(backend, 'process-a');
      const firstContext = createToolContext('DurableToolsA', {
        schema: testSchema,
        durableOperationStore: storeA,
        durableOperationOwnerId: 'process-a',
      });
      const firstHandler = jest.fn(async () => ({ saved: true }));
      const firstWrapper = ({ children }: { children: React.ReactNode }) => (
        <firstContext.Provider>{children}</firstContext.Provider>
      );
      const firstHook = renderHook(
        () => {
          firstContext.useToolHandler('searchProducts', useCallback(firstHandler, []));
          return firstContext.useToolRegistry();
        },
        { wrapper: firstWrapper }
      );
      const request = {
        method: 'tools/call' as const,
        id: 'durable-first',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      };

      const firstResult = await firstHook.result.current.callTool(request, {
        idempotencyKey: 'durable-save-1',
      });
      expect(firstResult).toMatchObject({
        structuredContent: { saved: true },
      });
      expect(firstHandler).toHaveBeenCalledTimes(1);
      await expect(
        firstHook.result.current.getOperationStatus('searchProducts', 'durable-save-1')
      ).resolves.toMatchObject({ state: 'completed', result: { structuredContent: { saved: true } } });
      firstHook.unmount();

      const storeB = createMockDurableOperationStore(backend, 'process-b');
      const restartedContext = createToolContext('DurableToolsB', {
        schema: testSchema,
        durableOperationStore: storeB,
        durableOperationOwnerId: 'process-b',
      });
      const replayHandler = jest.fn(async () => ({ shouldNotRun: true }));
      const restartedWrapper = ({ children }: { children: React.ReactNode }) => (
        <restartedContext.Provider>{children}</restartedContext.Provider>
      );
      const restartedHook = renderHook(
        () => {
          restartedContext.useToolHandler('searchProducts', useCallback(replayHandler, []));
          return restartedContext.useToolRegistry();
        },
        { wrapper: restartedWrapper }
      );

      const replay = await restartedHook.result.current.callTool(
        { ...request, id: 'durable-replay' },
        { idempotencyKey: 'durable-save-1' }
      );
      expect(replay).toMatchObject({
        toolCallId: 'durable-replay',
        structuredContent: { saved: true },
      });
      expect(replayHandler).not.toHaveBeenCalled();
      restartedHook.unmount();
    });

    it('retains an ambiguous handler result for later durable recovery', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const store = createMockDurableOperationStore(backend, 'process-a');
      const context = createToolContext('DurableUnknownResultTools', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'process-a',
      });
      const handler = jest.fn(async () => {
        const error = new Error('saveAll stopped after a partial write') as Error & {
          code: string;
          retryable: boolean;
          details: { outcome: 'unknown'; plannedPaths: string[] };
        };
        Object.assign(error, {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN,
          retryable: true,
          details: {
            outcome: 'unknown',
            plannedPaths: ['index.html', 'styles.css'],
            source: 'secret source must not enter durable diagnostics',
            credentials: { token: 'secret-token' },
          },
        });
        throw error;
      });
      const unknownWrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler(
            'searchProducts',
            useCallback(handler, []),
            { blocking: true }
          );
          return context.useToolRegistry();
        },
        { wrapper: unknownWrapper }
      );

      const response = await hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-unknown-result',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-save-unknown-result' }
      );
      expect(response).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN,
          details: {
            outcome: 'unknown',
            plannedPaths: ['index.html', 'styles.css'],
          },
        },
      });

      await expect(
        hook.result.current.getOperationStatus(
          'searchProducts',
          'durable-save-unknown-result'
        )
      ).resolves.toMatchObject({
        state: 'unknown',
        result: {
          error: {
            code: TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN,
            details: {
              plannedPaths: ['index.html', 'styles.css'],
              source: '[source redacted]',
              credentials: { token: '[token redacted]' },
            },
          },
        },
      });
      const durableRecord = await hook.result.current.getOperationStatus(
        'searchProducts',
        'durable-save-unknown-result'
      );
      expect(durableRecord?.result?.content).toEqual([
        {
          type: 'text',
          text: 'Tool execution diagnostic retained in redacted form.',
        },
      ]);
      expect(durableRecord?.result).not.toHaveProperty('structuredContent');
      expect(JSON.stringify(durableRecord)).not.toContain('secret source');
      expect(JSON.stringify(durableRecord)).not.toContain('secret-token');
      hook.unmount();
    });

    it('redacts known error terminal results before durable persistence', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const store = createMockDurableOperationStore(backend, 'failed-owner');
      const context = createToolContext('DurableFailedResultTools', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'failed-owner',
        durableDiagnosticPolicy: createToolObservabilityPolicy({ maxStringLength: 4 }),
      });
      const handler = jest.fn(async () => {
        const error = new Error('handler message contains secret source') as Error & {
          code: string;
          details: Record<string, unknown>;
        };
        Object.assign(error, {
          code: 'WORKSPACE_KNOWN_FAILURE',
          details: {
            path: 'abcdefghij',
            source: 'secret source must not enter failed records',
            token: 'secret-token',
          },
        });
        throw error;
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler(
            'searchProducts',
            useCallback(handler, []),
            { blocking: true }
          );
          return context.useToolRegistry();
        },
        { wrapper }
      );

      await hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-failed-result',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-save-known-failure' }
      );

      const record = await hook.result.current.getOperationStatus(
        'searchProducts',
        'durable-save-known-failure'
      );
      expect(record?.state).toBe('failed');
      expect(record?.result?.error).toMatchObject({
        code: 'WORKSPACE_KNOWN_FAILURE',
        message: 'Tool execution diagnostic retained in redacted form.',
        details: {
          path: 'abcd… [truncated]',
          source: '[source redacted]',
          token: '[token redacted]',
        },
      });
      expect(JSON.stringify(record)).not.toContain('secret source');
      expect(JSON.stringify(record)).not.toContain('secret-token');
      hook.unmount();
    });

    it('returns pending and unknown durable states without invoking a handler', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const ownerStore = createMockDurableOperationStore(backend, 'owner');
      const operationKey = createToolOperationKey('searchProducts', 'durable-save-2');
      const fingerprint = createToolCallFingerprint('searchProducts', { query: 'laptop' });
      await ownerStore.claim(operationKey, fingerprint, 'owner', { leaseMs: 60_000 });

      const recoveryStore = createMockDurableOperationStore(backend, 'recovery');
      const recoveryContext = createToolContext('DurableRecoveryTools', {
        schema: testSchema,
        durableOperationStore: recoveryStore,
        durableOperationOwnerId: 'recovery',
      });
      const handler = jest.fn(async () => ({ shouldNotRun: true }));
      const recoveryWrapper = ({ children }: { children: React.ReactNode }) => (
        <recoveryContext.Provider>{children}</recoveryContext.Provider>
      );
      const hook = renderHook(
        () => {
          recoveryContext.useToolHandler('searchProducts', useCallback(handler, []));
          return recoveryContext.useToolRegistry();
        },
        { wrapper: recoveryWrapper }
      );
      const request = {
        method: 'tools/call' as const,
        id: 'durable-pending',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      };

      await expect(hook.result.current.callTool(request, {
        idempotencyKey: 'durable-save-2',
      })).resolves.toMatchObject({
        error: { code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_PENDING, retryable: true },
      });
      expect(handler).not.toHaveBeenCalled();

      await ownerStore.markUnknown(operationKey, 'owner', 'worker crashed after write');
      await expect(hook.result.current.callTool(
        { ...request, id: 'durable-unknown' },
        { idempotencyKey: 'durable-save-2' }
      )).resolves.toMatchObject({
        error: { code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN, retryable: false },
      });
      expect(handler).not.toHaveBeenCalled();
      hook.unmount();
    });

    it('returns a retryable store error when the durable terminal transition fails', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(backend, 'process-a');
      const failingStore = {
        ...baseStore,
        complete: async () => {
          throw new Error('durable write unavailable');
        },
      };
      const context = createToolContext('DurableTransitionFailureTools', {
        schema: testSchema,
        durableOperationStore: failingStore,
        durableOperationOwnerId: 'process-a',
      });
      const handler = jest.fn(async () => ({ saved: true }));
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper }
      );

      await expect(hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-transition-failure',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-save-transition-failure' }
      )).resolves.toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_STORE_FAILED,
          retryable: true,
        },
      });
      expect(handler).toHaveBeenCalledTimes(1);
      hook.unmount();
    });

    it('records a domain-confirmed reconciliation without invoking the handler', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const ownerStore = createMockDurableOperationStore(backend, 'owner');
      const operationKey = createToolOperationKey('searchProducts', 'durable-save-reconcile');
      const fingerprint = createToolCallFingerprint('searchProducts', { query: 'laptop' });
      await ownerStore.claim(operationKey, fingerprint, 'owner');
      await ownerStore.markUnknown(operationKey, 'owner', 'provider disconnected after write');

      const recoveryStore = createMockDurableOperationStore(backend, 'recovery');
      const context = createToolContext('DurableReconcileTools', {
        schema: testSchema,
        durableOperationStore: recoveryStore,
        durableOperationOwnerId: 'recovery',
      });
      const handler = jest.fn(async () => ({ shouldNotRun: true }));
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper }
      );

      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile',
        { state: 'completed', result: { content: [], structuredContent: { saved: true } } }
      )).resolves.toMatchObject({
        state: 'completed',
        reconciledBy: 'recovery',
      });

      await expect(hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-reconcile-replay',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-save-reconcile' }
      )).resolves.toMatchObject({
        toolCallId: 'durable-reconcile-replay',
        structuredContent: { saved: true },
      });
      expect(handler).not.toHaveBeenCalled();
      hook.unmount();
    });

    it('runs a domain recovery resolver only for unknown records and uses the observed revision', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const ownerStore = createMockDurableOperationStore(backend, 'owner');
      const operationKey = createToolOperationKey('searchProducts', 'durable-save-recover');
      const fingerprint = createToolCallFingerprint('searchProducts', { query: 'laptop' });
      await ownerStore.claim(operationKey, fingerprint, 'owner');
      await ownerStore.markUnknown(operationKey, 'owner', 'worker crashed after provider write');

      const recoveryStore = createMockDurableOperationStore(backend, 'recovery');
      const context = createToolContext('DurableRecoveryCommandTools', {
        schema: testSchema,
        durableOperationStore: recoveryStore,
        durableOperationOwnerId: 'recovery',
      });
      const handler = jest.fn(async () => ({ shouldNotRun: true }));
      const resolver = jest.fn(async (record) => {
        expect(record.state).toBe('unknown');
        expect(record.revision).toBe(2);
        return {
          state: 'completed' as const,
          result: { content: [], structuredContent: { recovered: true } },
        };
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper }
      );

      await expect(hook.result.current.recoverOperation(
        'searchProducts',
        'durable-save-recover',
        resolver
      )).resolves.toMatchObject({
        state: 'completed',
        revision: 3,
        reconciledBy: 'recovery',
        result: { structuredContent: { recovered: true } },
      });
      expect(resolver).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();

      await expect(hook.result.current.recoverOperation(
        'searchProducts',
        'durable-save-recover',
        resolver
      )).resolves.toMatchObject({ state: 'completed', revision: 3 });
      expect(resolver).toHaveBeenCalledTimes(1);

      const staleKey = createToolOperationKey('searchProducts', 'durable-save-stale');
      await ownerStore.claim(staleKey, fingerprint, 'owner');
      await ownerStore.markUnknown(staleKey, 'owner', 'worker crashed before acknowledgement');
      const staleResolver = jest.fn(async () => {
        const current = await backend.read(staleKey);
        await backend.compareAndSet(staleKey, current!.revision, {
          ...current!,
          revision: current!.revision + 1,
          updatedAt: current!.updatedAt + 1,
          reason: 'another recovery decision is being recorded',
        });
        return {
          state: 'completed' as const,
          result: { content: [], structuredContent: { recovered: true } },
        };
      });
      await expect(hook.result.current.recoverOperation(
        'searchProducts',
        'durable-save-stale',
        staleResolver
      )).rejects.toThrow('revision is stale');
      await expect(hook.result.current.getOperationStatus(
        'searchProducts',
        'durable-save-stale'
      )).resolves.toMatchObject({
        state: 'unknown',
        revision: 3,
        reason: 'another recovery decision is being recorded',
      });

      hook.unmount();
    });
  });

  describe('Tool Format Export - toMCP', () => {
    it('should export all tools as MCP format', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const mcpTools = result.current.toMCP();

      expect(mcpTools).toHaveLength(3);
      expect(mcpTools[0]).toMatchObject({
        name: 'searchProducts',
        description: 'Search for products in the catalog',
        inputSchema: expect.objectContaining({
          type: 'object',
          properties: expect.any(Object),
        }),
      });
    });

    it('should export filtered tools as MCP format', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const mcpTools = result.current.toMCPFiltered(['searchProducts', 'addToCart']);

      expect(mcpTools).toHaveLength(2);
      expect(mcpTools.map((t) => t.name)).toEqual(['searchProducts', 'addToCart']);
    });
  });

  describe('Tool Format Export - toOpenAI', () => {
    it('should export all tools as OpenAI format', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const openaiTools = result.current.toOpenAI();

      expect(openaiTools).toHaveLength(3);
      expect(openaiTools[0]).toMatchObject({
        type: 'function',
        function: {
          name: 'searchProducts',
          description: 'Search for products in the catalog',
          parameters: expect.objectContaining({
            type: 'object',
          }),
        },
      });
      expect(openaiTools[0]?.function.parameters).toEqual(
        result.current.getToolDefinition('searchProducts')?.inputSchema
      );
    });

    it('should export filtered tools as OpenAI format', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const openaiTools = result.current.toOpenAIFiltered(['checkout']);

      expect(openaiTools).toHaveLength(1);
      expect(openaiTools[0]?.function.name).toBe('checkout');
    });
  });

  describe('Tool Format Export - toAnthropic', () => {
    it('should export all tools as Anthropic format', () => {
      const { result } = renderHook(() => useToolRegistry(), { wrapper });

      const anthropicTools = result.current.toAnthropic();

      expect(anthropicTools).toHaveLength(3);
      expect(anthropicTools[0]).toMatchObject({
        name: 'searchProducts',
        description: 'Search for products in the catalog',
        input_schema: expect.objectContaining({
          type: 'object',
        }),
      });
      expect(anthropicTools[0]?.input_schema).toEqual(
        result.current.getToolDefinition('searchProducts')?.inputSchema
      );
    });
  });

  describe('useToolHandler and useToolDispatch', () => {
    it('should register and execute tool handler', async () => {
      const handlerMock = jest.fn().mockResolvedValue({ results: ['product1', 'product2'] });

      const { result: dispatchResult } = renderHook(
        () => {
          const dispatch = useToolDispatch();

          useToolHandler(
            'searchProducts',
            useCallback(handlerMock, [])
          );

          return dispatch;
        },
        { wrapper }
      );

      await act(async () => {
        await dispatchResult.current('searchProducts', {
          query: 'laptop',
          category: 'electronics',
          maxResults: 5,
        });
      });

      expect(handlerMock).toHaveBeenCalledWith(
        expect.objectContaining({
          query: 'laptop',
          category: 'electronics',
          maxResults: 5,
        }),
        expect.any(Object) // PipelineController
      );
    });

    it('should validate payload before dispatch', async () => {
      const handlerMock = jest.fn();

      const { result: dispatchResult } = renderHook(
        () => {
          const dispatch = useToolDispatch();

          useToolHandler(
            'searchProducts',
            useCallback(handlerMock, [])
          );

          return dispatch;
        },
        { wrapper }
      );

      // Empty query should fail validation
      await expect(
        act(async () => {
          await dispatchResult.current('searchProducts', {
            query: '', // Invalid: min length 1
            maxResults: 10,
          });
        })
      ).rejects.toThrow();

      expect(handlerMock).not.toHaveBeenCalled();
    });

    it('should handle multiple handlers with priority', async () => {
      const callOrder: string[] = [];

      const { result: dispatchResult } = renderHook(
        () => {
          const dispatch = useToolDispatch();

          useToolHandler(
            'addToCart',
            useCallback(async () => {
              callOrder.push('handler1');
            }, []),
            { priority: 1, id: 'handler1' }
          );

          useToolHandler(
            'addToCart',
            useCallback(async () => {
              callOrder.push('handler2');
            }, []),
            { priority: 10, id: 'handler2' } // Higher priority, runs first
          );

          return dispatch;
        },
        { wrapper }
      );

      await act(async () => {
        await dispatchResult.current('addToCart', {
          productId: 'prod-123',
          quantity: 2,
        });
      });

      expect(callOrder).toEqual(['handler2', 'handler1']);
    });
  });

  describe('useToolDispatchWithResult', () => {
    it('should preserve a typed handler result for AI tool adapters', async () => {
      const { result: dispatchResult } = renderHook(
        () => {
          const { dispatchWithResult } = useToolDispatchWithResult();

          useToolHandler(
            'searchProducts',
            useCallback(async ({ query }) => ({ query, source: 'catalog' as const }), []),
            { blocking: true }
          );

          return dispatchWithResult;
        },
        { wrapper }
      );

      let executionResult: Awaited<ReturnType<typeof dispatchResult.current>>;

      await act(async () => {
        executionResult = await dispatchResult.current('searchProducts', {
          query: 'laptop',
          maxResults: 10,
        });
      });

      expect(executionResult!.result).toEqual({ query: 'laptop', source: 'catalog' });
    });

    it('should return execution result', async () => {
      const handlerMock = jest.fn().mockResolvedValue({ items: ['item1'] });

      const { result: dispatchResult } = renderHook(
        () => {
          const { dispatchWithResult } = useToolDispatchWithResult();

          useToolHandler(
            'searchProducts',
            useCallback(handlerMock, [])
          );

          return dispatchWithResult;
        },
        { wrapper }
      );

      let executionResult: Awaited<ReturnType<typeof dispatchResult.current>>;

      await act(async () => {
        executionResult = await dispatchResult.current('searchProducts', {
          query: 'laptop',
          maxResults: 10,
        });
      });

      expect(executionResult!).toMatchObject({
        validationPassed: true,
      });
      // Execution should have succeeded
      expect(executionResult!.aborted).toBeFalsy();
    });

    it('should validate exactly once and derive validation metadata from core', async () => {
      let validationCalls = 0;
      const countedSchema = createActionSchema({
        counted: defineAction({
          name: 'counted',
          parameters: z.object({
            value: z.string().refine(value => {
              validationCalls++;
              return value.length > 0;
            }),
          }),
        }, z),
      });
      const CountedTools = createToolContext('CountedTools', {
        schema: countedSchema,
        validationMode: 'warn',
      });
      const handler = jest.fn();

      const { result } = renderHook(() => {
        CountedTools.useToolHandler('counted', useCallback(handler, []));
        return CountedTools.useToolDispatchWithResult().dispatchWithResult;
      }, {
        wrapper: ({ children }) => <CountedTools.Provider>{children}</CountedTools.Provider>,
      });

      let executionResult: Awaited<ReturnType<typeof result.current>>;
      await act(async () => {
        executionResult = await result.current('counted', { value: 'valid' });
      });

      expect(validationCalls).toBe(1);
      expect(executionResult!).toMatchObject({
        validationPassed: true,
        validation: { passed: true, errors: [] },
      });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support abortAll', async () => {
      const { result } = renderHook(
        () => {
          const tools = useToolDispatchWithResult();

          useToolHandler(
            'searchProducts',
            useCallback(async () => {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }, [])
          );

          return tools;
        },
        { wrapper }
      );

      // Start dispatch but don't await
      const promise = act(async () => {
        result.current.dispatch('searchProducts', {
          query: 'test',
          maxResults: 10,
        });
      });

      // Abort immediately
      act(() => {
        result.current.abortAll();
      });

      await promise;
      // Should complete without hanging
    });
  });

  describe('useActionRegister', () => {
    it('should provide access to raw ActionRegister', () => {
      const { result } = renderHook(() => useActionRegister(), { wrapper });

      expect(result.current).toBeDefined();
      expect(typeof result.current?.dispatch).toBe('function');
      expect(typeof result.current?.register).toBe('function');
    });
  });

  describe('Handler cleanup', () => {
    it('should unregister handler on unmount', async () => {
      const handlerMock = jest.fn();

      const { unmount, result: dispatchResult } = renderHook(
        () => {
          const dispatch = useToolDispatch();

          useToolHandler(
            'addToCart',
            useCallback(handlerMock, [])
          );

          return dispatch;
        },
        { wrapper }
      );

      // First dispatch should work
      await act(async () => {
        await dispatchResult.current('addToCart', {
          productId: 'prod-123',
          quantity: 1,
        });
      });

      expect(handlerMock).toHaveBeenCalledTimes(1);

      // Unmount the hook
      unmount();

      // Get a fresh dispatch from a new hook
      const { result: newDispatchResult } = renderHook(
        () => useToolDispatch(),
        { wrapper }
      );

      // Dispatch again - handler should be unregistered
      await act(async () => {
        await newDispatchResult.current('addToCart', {
          productId: 'prod-456',
          quantity: 2,
        });
      });

      // Handler should not have been called again
      expect(handlerMock).toHaveBeenCalledTimes(1);
    });
  });
});

describe('createToolContext with validation modes', () => {
  const simpleSchema = createActionSchema({
    testAction: defineAction({
      name: 'testAction',
      parameters: z.object({
        value: z.string().min(5),
      }),
    }, z),
  });

  describe('warn mode', () => {
    it('should log warning but continue execution', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const handlerMock = jest.fn();

      const { Provider, useToolDispatch, useToolHandler } = createToolContext('WarnTools', {
        schema: simpleSchema,
        validationMode: 'warn',
      });

      const { result } = renderHook(
        () => {
          const dispatch = useToolDispatch();
          useToolHandler('testAction', useCallback(handlerMock, []));
          return dispatch;
        },
        { wrapper: ({ children }) => <Provider>{children}</Provider> }
      );

      await act(async () => {
        await result.current('testAction', { value: 'ab' }); // Too short
      });

      expect(consoleSpy).toHaveBeenCalled();
      expect(handlerMock).toHaveBeenCalled(); // Handler still runs

      consoleSpy.mockRestore();
    });

    it('should report failed validation from dispatchWithResult', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const handlerMock = jest.fn();

      const { Provider, useToolDispatchWithResult, useToolHandler } = createToolContext(
        'WarnResultTools',
        { schema: simpleSchema, validationMode: 'warn' }
      );

      const { result } = renderHook(
        () => {
          const { dispatchWithResult } = useToolDispatchWithResult();
          useToolHandler('testAction', useCallback(handlerMock, []));
          return dispatchWithResult;
        },
        { wrapper: ({ children }) => <Provider>{children}</Provider> }
      );

      let executionResult: Awaited<ReturnType<typeof result.current>>;
      await act(async () => {
        executionResult = await result.current('testAction', { value: 'ab' });
      });

      expect(executionResult!).toMatchObject({
        success: true,
        validationPassed: false,
        validationErrors: expect.any(Array),
      });
      expect(handlerMock).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('silent mode', () => {
    it('should not log and continue execution', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const handlerMock = jest.fn();

      const { Provider, useToolDispatch, useToolHandler } = createToolContext('SilentTools', {
        schema: simpleSchema,
        validationMode: 'silent',
      });

      const { result } = renderHook(
        () => {
          const dispatch = useToolDispatch();
          useToolHandler('testAction', useCallback(handlerMock, []));
          return dispatch;
        },
        { wrapper: ({ children }) => <Provider>{children}</Provider> }
      );

      await act(async () => {
        await result.current('testAction', { value: 'ab' }); // Too short
      });

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(handlerMock).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});

describe('createToolContext type inference', () => {
  it('should infer correct types from schema', () => {
    const typedSchema = createActionSchema({
      createUser: defineAction({
        name: 'createUser',
        parameters: z.object({
          name: z.string(),
          email: z.string().email(),
          age: z.number().optional(),
        }),
      }, z),
    });

    const { useToolDispatch, useToolHandler } = createToolContext('TypedTools', {
      schema: typedSchema,
    });

    // This test primarily checks TypeScript compilation
    // If it compiles, the types are correct
    const TestComponent = () => {
      const dispatch = useToolDispatch();

      useToolHandler('createUser', useCallback(async (payload) => {
        // TypeScript should know payload type
        const name: string = payload.name;
        const email: string = payload.email;
        const age: number | undefined = payload.age;
        console.log(name, email, age);
      }, []));

      // This should type-check correctly
      dispatch('createUser', { name: 'John', email: 'john@example.com' });

      return null;
    };

    expect(TestComponent).toBeDefined();
  });
});
