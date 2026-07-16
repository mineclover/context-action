/**
 * @fileoverview ToolContext Tests
 *
 * Tests for createToolContext - the unified tool registry for LLM integration.
 */

import React, { useCallback } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import {
  createToolContext,
  defineAction,
  createActionSchema,
  toToolCallRequest,
  toToolListRequest,
} from '../../src';

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
      expect(toolResult.content[0]?.text).toBe('workspace conflict');
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
      expect(toolResult.content[0]?.text).toMatch(/unknownTool/);
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

    it('should preserve call identity and emit lifecycle events', async () => {
      const events: string[] = [];
      const contexts: Array<{
        source?: string;
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
        { source: 'model', sessionId: 'session-observed', revision: 7 },
        { source: 'model', sessionId: 'session-observed', revision: 7 },
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
      const cancellationContext = createToolContext('AbortHandlerTools', {
        schema: testSchema,
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
