/**
 * @fileoverview ToolContext Tests
 *
 * Tests for createToolContext - the unified tool registry for LLM integration.
 */

import React, { startTransition, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { render, renderHook, act, waitFor } from '@testing-library/react';
import { z } from 'zod';
import {
  createToolContext,
  type DirectToolCallOptions,
  type ToolCallFunction,
  type ToolRegistry,
} from '../../src/tools';
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
  type ModelToolCall,
  type ToolCallRequest,
  type ToolCallResult,
  type ToolExecutionProvenance,
  type ToolListRequest,
  type ToolManagementInterface,
} from '@context-action/tool-protocol';
import type { DurableOperationStore } from '@context-action/tool-durable-operations';

type ActivityBoundaryComponent = React.ExoticComponent<{
  children?: React.ReactNode;
  mode: 'visible' | 'hidden';
}>;

const ActivityBoundary = (React as unknown as {
  Activity?: ActivityBoundaryComponent;
}).Activity;
const activityTest = ActivityBoundary ? it : it.skip;

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

async function settleWithin<T>(promise: Promise<T>, timeoutMs = 500): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`Promise did not settle within ${timeoutMs}ms.`)),
          timeoutMs
        );
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

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
    useToolCall,
    useToolHandler,
    useToolResultHandler,
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

    it('exports the canonical direct-call types from the source barrel', () => {
      const options: DirectToolCallOptions = { timeout: 1 };
      const call: ToolCallFunction<{ ping: { id: string } }> = async () => ({ content: [] });

      expect(options.timeout).toBe(1);
      expect(typeof call).toBe('function');
    });

    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useToolDispatch());
      }).toThrow(/must be used within a TestTools ToolContext Provider/);

      consoleSpy.mockRestore();
    });

    it('routes direct UI calls through the canonical policy and lifecycle boundary', async () => {
      const policy = jest.fn().mockReturnValue('allow');
      const events: Array<{ type: string; source?: string; mode?: string }> = [];
      const DirectTools = createToolContext('DirectTools', {
        schema: testSchema,
        toolPolicy: policy,
        onToolCall: event => events.push({
          type: event.type,
          source: event.context?.source,
          mode: event.context?.mode,
        }),
      });
      const directWrapper = ({ children }: { children: React.ReactNode }) => (
        <DirectTools.Provider>{children}</DirectTools.Provider>
      );
      const handler = jest.fn(async ({ query, maxResults }: { query: string; maxResults: number }) => ({
        query,
        maxResults,
      }));

      const { result } = renderHook(() => {
        DirectTools.useToolHandler('searchProducts', handler, { blocking: true });
        return DirectTools.useToolCall();
      }, { wrapper: directWrapper });

      const toolResult = await act(async () => result.current(
        'searchProducts',
        { query: 'laptop' },
        { toolCallId: 'direct-ui-call' }
      ));

      expect(toolResult).toMatchObject({
        toolCallId: 'direct-ui-call',
        structuredContent: { query: 'laptop', maxResults: 10 },
      });
      expect(policy).toHaveBeenCalledWith(expect.objectContaining({
        request: expect.objectContaining({
          id: 'direct-ui-call',
          method: 'tools/call',
          params: {
            name: 'searchProducts',
            arguments: { query: 'laptop' },
          },
        }),
        context: expect.objectContaining({ source: 'local', mode: 'direct' }),
      }));
      expect(events).toEqual([
        { type: 'started', source: 'local', mode: 'direct' },
        { type: 'completed', source: 'local', mode: 'direct' },
      ]);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'laptop', maxResults: 10 }),
        expect.any(Object),
      );
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

    it('runs a shared cleanup function once for every tool handler registration', async () => {
      const sharedCleanup = jest.fn();

      const { unmount } = renderHook(() => {
        useToolHandler('searchProducts', () => {}, { cleanup: sharedCleanup });
        useToolHandler('addToCart', () => {}, { cleanup: sharedCleanup });
      }, { wrapper });

      unmount();

      await waitFor(() => expect(sharedCleanup).toHaveBeenCalledTimes(2));
    });

    activityTest('preserves ToolProvider resources while an Activity is hidden', async () => {
      const Activity = ActivityBoundary!;
      const handler = jest.fn();
      let dispatch: ReturnType<typeof useToolDispatch> | undefined;
      let currentRegister: ReturnType<typeof useActionRegister> = null;

      function Consumer() {
        useToolHandler('addToCart', handler);
        dispatch = useToolDispatch();
        currentRegister = useActionRegister();
        return null;
      }

      const tree = (mode: 'visible' | 'hidden') => (
        <Activity mode={mode}>
          <ToolProvider>
            <Consumer />
          </ToolProvider>
        </Activity>
      );

      const view = render(tree('visible'));
      await waitFor(() => expect(currentRegister?.getHandlerCount('addToCart')).toBe(1));

      const firstRegister = currentRegister!;
      const destroySpy = jest.spyOn(firstRegister, 'destroyAsync');

      await act(async () => {
        view.rerender(tree('hidden'));
        await Promise.resolve();
      });
      expect(destroySpy).not.toHaveBeenCalled();

      await act(async () => {
        view.rerender(tree('visible'));
        await Promise.resolve();
      });
      await waitFor(() => {
        expect(currentRegister).toBe(firstRegister);
        expect(currentRegister?.getHandlerCount('addToCart')).toBe(1);
      });

      await act(async () => {
        await dispatch?.('addToCart', { productId: 'one', quantity: 1 });
      });
      expect(handler).toHaveBeenCalledTimes(1);

      await act(async () => {
        view.unmount();
        await Promise.resolve();
      });
      expect(destroySpy).toHaveBeenCalledTimes(1);
    });

    activityTest('supports tool dispatch from passive effects during Activity reveal', async () => {
      const Activity = ActivityBoundary!;
      const handler = jest.fn();
      const dispatchErrors: unknown[] = [];

      function Consumer() {
        useToolHandler('addToCart', handler);
        const dispatch = useToolDispatch();
        React.useEffect(() => {
          void dispatch('addToCart', { productId: 'one', quantity: 1 })
            .catch(error => dispatchErrors.push(error));
        }, [dispatch]);
        return null;
      }

      const tree = (mode: 'visible' | 'hidden') => (
        <Activity mode={mode}>
          <ToolProvider>
            <Consumer />
          </ToolProvider>
        </Activity>
      );

      const view = render(tree('visible'));
      await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

      await act(async () => {
        view.rerender(tree('hidden'));
        await Promise.resolve();
      });
      await act(async () => {
        view.rerender(tree('visible'));
        await Promise.resolve();
      });

      await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));
      expect(dispatchErrors).toEqual([]);
    });

    activityTest('supports tool dispatch from layout effects during Activity reveal', async () => {
      const Activity = ActivityBoundary!;
      const handler = jest.fn();
      const dispatchErrors: unknown[] = [];
      let layoutSetups = 0;

      function Consumer() {
        useToolHandler('addToCart', handler);
        const dispatch = useToolDispatch();
        React.useLayoutEffect(() => {
          layoutSetups += 1;
          try {
            void dispatch('addToCart', { productId: 'one', quantity: 1 })
              .catch(error => dispatchErrors.push(error));
          } catch (error) {
            dispatchErrors.push(error);
          }
        }, [dispatch]);
        return null;
      }

      const child = (
        <ToolProvider>
          <Consumer />
        </ToolProvider>
      );
      const tree = (mode: 'visible' | 'hidden') => (
        <Activity mode={mode}>{child}</Activity>
      );

      const view = render(tree('visible'));
      await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

      await act(async () => {
        view.rerender(tree('hidden'));
        await Promise.resolve();
      });
      await act(async () => {
        view.rerender(tree('visible'));
        await Promise.resolve();
      });

      await waitFor(() => expect(handler).toHaveBeenCalledTimes(2));
      expect(layoutSetups).toBe(2);
      expect(dispatchErrors).toEqual([]);
    });

    it('does not publish a tool handler from an abandoned suspended transition', async () => {
      const calls: string[] = [];
      const renders: string[] = [];
      const suspendedForever = new Promise<never>(() => {});
      let dispatch: ReturnType<typeof useToolDispatch> | undefined;
      let markSuspendedRender!: () => void;
      const suspendedRender = new Promise<void>(resolve => {
        markSuspendedRender = resolve;
      });

      function DispatchProbe() {
        dispatch = useToolDispatch();
        return null;
      }

      function Handler({ label, suspend }: { label: string; suspend?: boolean }) {
        useToolHandler('addToCart', () => {
          calls.push(label);
        });
        renders.push(label);

        if (suspend) {
          markSuspendedRender();
          throw suspendedForever;
        }
        return null;
      }

      const committedTree = (
        <ToolProvider>
          <DispatchProbe />
          <React.Suspense fallback={null}>
            <Handler label="committed" />
          </React.Suspense>
        </ToolProvider>
      );
      const suspendedTree = (
        <ToolProvider>
          <DispatchProbe />
          <React.Suspense fallback={null}>
            <Handler label="abandoned" suspend />
          </React.Suspense>
        </ToolProvider>
      );
      const container = document.createElement('div');
      document.body.appendChild(container);
      const root = createRoot(container);

      try {
        await act(async () => {
          root.render(committedTree);
        });

        await act(async () => {
          startTransition(() => root.render(suspendedTree));
        });
        await suspendedRender;

        // A higher-priority render of the current element abandons the
        // suspended tree without rendering the committed Handler again.
        await act(async () => {
          root.render(committedTree);
        });
        expect(renders).toEqual(['committed', 'abandoned']);

        await act(async () => {
          await dispatch?.('addToCart', { productId: 'one', quantity: 1 });
        });
        expect(calls).toEqual(['committed']);
      } finally {
        await act(async () => {
          root.unmount();
        });
        container.remove();
      }
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

      await waitFor(() => expect(firstCleanup).toHaveBeenCalledTimes(1));
      expect(result.current?.getHandlerCount('addToCart')).toBe(1);

      unmount();
      await waitFor(() => expect(secondCleanup).toHaveBeenCalledTimes(1));
    });

    it('runs config-replacement cleanup outside the insertion commit phase', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      const hook = renderHook(
        ({ priority }: { priority: number }) => {
          const [cleanupCount, setCleanupCount] = React.useState(0);
          const cleanup = useCallback(() => {
            setCleanupCount(count => count + 1);
          }, []);
          useToolHandler('addToCart', () => {}, {
            id: 'stateful-cleanup-tool-handler',
            priority,
            cleanup,
          });
          return cleanupCount;
        },
        {
          wrapper,
          initialProps: { priority: 0 },
        }
      );

      try {
        hook.rerender({ priority: 1 });
        await waitFor(() => expect(hook.result.current).toBe(1));
        expect(consoleError.mock.calls.flat().join(' ')).not.toMatch(
          /useInsertionEffect must not schedule updates/i
        );
      } finally {
        hook.unmount();
        await act(async () => {
          await Promise.resolve();
        });
        consoleError.mockRestore();
      }
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

    it('passes strict parsed defaults and transforms to the handler', async () => {
      const normalizedSchema = createActionSchema({
        normalizeSearch: defineAction({
          name: 'normalizeSearch',
          description: 'Normalize a search request.',
          parameters: z.object({
            query: z.string().trim(),
            maxResults: z.number().int().positive().default(10),
          }),
        }, z),
      });
      const normalizedContext = createToolContext('NormalizedTools', {
        schema: normalizedSchema,
      });
      const normalizedWrapper = ({ children }: { children: React.ReactNode }) => (
        <normalizedContext.Provider>{children}</normalizedContext.Provider>
      );
      const handler = jest.fn(async (payload: { query: string; maxResults: number }) => payload);
      const { result } = renderHook(
        () => {
          normalizedContext.useToolHandler(
            'normalizeSearch',
            useCallback(handler, [])
          );
          return normalizedContext.useToolRegistry();
        },
        { wrapper: normalizedWrapper }
      );

      const toolResult = await act(async () => result.current.callTool({
        method: 'tools/call',
        id: 'normalized-input',
        params: { name: 'normalizeSearch', arguments: { query: '  laptop  ' } },
      }));

      expect(handler).toHaveBeenCalledWith(
        { query: 'laptop', maxResults: 10 },
        expect.any(Object)
      );
      expect(toolResult).toMatchObject({
        structuredContent: { query: 'laptop', maxResults: 10 },
      });
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

    it('infers explicit result-handler output from the action output schema', async () => {
      const outputSchema = createActionSchema({
        getStatus: defineAction({
          name: 'getStatus',
          parameters: z.object({}),
          outputSchema: z.object({ ready: z.boolean() }),
        }, z),
      });
      const OutputTools = createToolContext('TypedOutputTools', {
        schema: outputSchema,
      });
      const outputWrapper = ({ children }: { children: React.ReactNode }) => (
        <OutputTools.Provider>{children}</OutputTools.Provider>
      );
      const { result } = renderHook(
        () => {
          const call = OutputTools.useToolCall();
          OutputTools.useToolResultHandler(
            'getStatus',
            useCallback((_payload, resultController) => {
              const firstResult: { ready: boolean } | undefined = resultController.getResults()[0];
              expect(firstResult).toBeUndefined();
              return { ready: true };
            }, [])
          );
          return call;
        },
        { wrapper: outputWrapper }
      );

      const toolResult = await result.current('getStatus', {});
      const structuredContent: { ready: boolean } | undefined = toolResult.structuredContent;
      expect(structuredContent).toEqual({ ready: true });
      expect(toolResult).toMatchObject({
        structuredContent: { ready: true },
      });
    });

    it('infers schema input defaults and output from direct registry calls', async () => {
      const typedSchema = createActionSchema({
        search: defineAction({
          name: 'search',
          parameters: z.object({
            query: z.string(),
            maxResults: z.number().int().positive().default(10),
          }),
          outputSchema: z.object({
            query: z.string(),
            maxResults: z.number(),
          }),
        }, z),
      });
      const TypedRegistryTools = createToolContext('TypedRegistryTools', {
        schema: typedSchema,
      });
      const typedRegistryWrapper = ({ children }: { children: React.ReactNode }) => (
        <TypedRegistryTools.Provider>{children}</TypedRegistryTools.Provider>
      );
      const { result } = renderHook(
        () => {
          TypedRegistryTools.useToolResultHandler(
            'search',
            useCallback(({ query, maxResults }) => ({ query, maxResults }), [])
          );
          return TypedRegistryTools.useToolRegistry();
        },
        { wrapper: typedRegistryWrapper }
      );

      // Compile-time compatibility checks: schema-aware overloads must retain
      // the broad manager contract used by transport adapters.
      const typedRegistry: ToolRegistry<typeof typedSchema> = result.current;
      const manager: ToolManagementInterface = typedRegistry;
      const assertDynamicOverloads = async (
        registry: ToolRegistry<typeof typedSchema>,
        request: ToolCallRequest,
        modelCall: ModelToolCall,
      ): Promise<void> => {
        const canonicalResult = await registry.callTool(request);
        const modelResult = await registry.executeModelToolCall(modelCall);
        type IsExactly<Left, Right> = (
          <T>() => T extends Left ? 1 : 2
        ) extends (
          <T>() => T extends Right ? 1 : 2
        ) ? true : false;
        type Assert<T extends true> = T;
        type CanonicalCallUsesBroadResult = Assert<
          IsExactly<typeof canonicalResult, ToolCallResult>
        >;
        type ModelCallUsesBroadResult = Assert<
          IsExactly<typeof modelResult, ToolCallResult>
        >;
        const broadCanonicalResult: ToolCallResult = canonicalResult;
        const broadModelResult: ToolCallResult = modelResult;
        const assertCanonical: CanonicalCallUsesBroadResult = true;
        const assertModel: ModelCallUsesBroadResult = true;
        void broadCanonicalResult;
        void broadModelResult;
        void assertCanonical;
        void assertModel;
      };
      void manager;
      void assertDynamicOverloads;

      const toolResult = await act(async () => result.current.callTool({
        method: 'tools/call',
        id: 'typed-registry-search',
        params: {
          name: 'search',
          // z.input permits this defaulted field to be omitted at the boundary.
          arguments: { query: 'laptop' },
        },
      }));
      const structuredContent: { query: string; maxResults: number } | undefined =
        toolResult.structuredContent;

      expect(structuredContent).toEqual({ query: 'laptop', maxResults: 10 });
      expect(toolResult).toMatchObject({
        structuredContent: { query: 'laptop', maxResults: 10 },
      });

      const modelResult = await act(async () => result.current.executeModelToolCall({
        id: 'typed-registry-model-search',
        name: 'search',
        // The same unparsed input contract applies before model-call normalization.
        arguments: { query: 'headphones' },
      }));
      const modelStructuredContent: { query: string; maxResults: number } | undefined =
        modelResult.structuredContent;

      expect(modelStructuredContent).toEqual({ query: 'headphones', maxResults: 10 });
      expect(modelResult).toMatchObject({
        structuredContent: { query: 'headphones', maxResults: 10 },
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

    it('snapshots schema and allowlist membership for discovery and execution', async () => {
      const mutableSchema = { ...testSchema };
      const mutableAllowedToolNames = ['searchProducts'];
      const snapshotContext = createToolContext('SnapshotTools', {
        schema: mutableSchema,
        allowedToolNames: mutableAllowedToolNames,
      });
      delete (mutableSchema as Partial<typeof mutableSchema>).searchProducts;
      Object.assign(mutableSchema as Record<string, unknown>, {
        runtimeAdded: testSchema.addToCart,
      });
      mutableAllowedToolNames.length = 0;
      mutableAllowedToolNames.push('addToCart');

      const handler = jest.fn(async () => ({ source: 'snapshot' }));
      const snapshotWrapper = ({ children }: { children: React.ReactNode }) => (
        <snapshotContext.Provider>{children}</snapshotContext.Provider>
      );
      const { result } = renderHook(
        () => {
          snapshotContext.useToolHandler('searchProducts', useCallback(handler, []));
          return snapshotContext.useToolRegistry();
        },
        { wrapper: snapshotWrapper }
      );

      expect(result.current.getToolNames()).toEqual(['searchProducts']);
      const callerOwnedNames = result.current.getToolNames();
      callerOwnedNames.push('addToCart');
      expect(result.current.getToolNames()).toEqual(['searchProducts']);
      expect(result.current.listTools().tools.map((tool) => tool.name)).toEqual(['searchProducts']);
      expect(result.current.getToolDefinition('addToCart')).toBeUndefined();

      const allowedResult = await act(async () => result.current.callTool({
        method: 'tools/call',
        id: 'snapshot-allowed',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      }));
      expect(allowedResult).toMatchObject({ structuredContent: { source: 'snapshot' } });
      expect(handler).toHaveBeenCalledTimes(1);

      const blockedResult = await act(async () => result.current.callTool({
        method: 'tools/call',
        id: 'snapshot-blocked',
        params: { name: 'addToCart', arguments: { productId: 'item-1', quantity: 1 } },
      }));
      expect(blockedResult).toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.NOT_ALLOWED },
      });

      const addedResult = await act(async () => result.current.callTool({
        method: 'tools/call',
        id: 'snapshot-added',
        params: { name: 'runtimeAdded', arguments: { productId: 'item-1', quantity: 1 } },
      }));
      expect(addedResult).toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.NOT_FOUND },
      });
    });

    it('runs canonical interaction only after validation and a policy ask', async () => {
      const interaction = jest.fn(async () => 'approved' as const);
      const policy = jest.fn(() => 'ask' as const);
      const InteractionTools = createToolContext('InteractionTools', {
        schema: testSchema,
        toolPolicy: policy,
      });
      const interactionWrapper = ({ children }: { children: React.ReactNode }) => (
        <InteractionTools.Provider>{children}</InteractionTools.Provider>
      );
      const handler = jest.fn(() => ({ ok: true }));
      const { result } = renderHook(() => {
        InteractionTools.useToolHandler('searchProducts', handler, { blocking: true });
        return InteractionTools.useToolRegistry();
      }, { wrapper: interactionWrapper });

      const malformed = await act(async () => result.current.executeModelToolCall({
        name: 'searchProducts', arguments: { query: '' },
      }, { interaction }));
      expect(malformed.error?.code).toBe(TOOL_CALL_ERROR_CODES.VALIDATION_FAILED);
      expect(interaction).not.toHaveBeenCalled();

      const approved = await act(async () => result.current.executeModelToolCall({
        name: 'searchProducts', arguments: { query: 'laptop', maxResults: 1 },
      }, { interaction }));
      expect(approved.isError).toBeFalsy();
      expect(interaction).toHaveBeenCalledWith(expect.objectContaining({
        kind: 'approval', definition: expect.objectContaining({ name: 'searchProducts' }),
      }));
      expect(handler).toHaveBeenCalledTimes(1);
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

    it('aborts an ignored policy wait and finishes provider cleanup on unmount', async () => {
      const policyStarted = createDeferred<void>();
      const policyNever = createDeferred<'allow'>();
      const policyContext = createToolContext('UnmountPolicyTools', {
        schema: testSchema,
        toolPolicy: () => {
          policyStarted.resolve();
          return policyNever.promise;
        },
      });
      const cleanup = jest.fn();
      const handler = jest.fn();
      const policyWrapper = ({ children }: { children: React.ReactNode }) => (
        <policyContext.Provider>{children}</policyContext.Provider>
      );
      const hook = renderHook(
        () => {
          policyContext.useToolHandler(
            'searchProducts',
            useCallback(handler, []),
            { cleanup }
          );
          return policyContext.useToolRegistry();
        },
        { wrapper: policyWrapper }
      );

      const pending = hook.result.current.callTool({
        method: 'tools/call',
        id: 'unmount-policy',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      });
      await policyStarted.promise;
      act(() => hook.unmount());

      await expect(settleWithin(pending)).resolves.toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
          retryable: true,
          details: { executionState: 'detached' },
        },
      });
      await waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
      expect(handler).not.toHaveBeenCalled();
    });

    it('aborts an ignored interaction wait and finishes provider cleanup on unmount', async () => {
      const interactionStarted = createDeferred<void>();
      const interactionNever = createDeferred<'approved'>();
      const interactionContext = createToolContext('UnmountInteractionTools', {
        schema: testSchema,
        toolPolicy: () => 'ask',
      });
      const cleanup = jest.fn();
      const handler = jest.fn();
      const interactionWrapper = ({ children }: { children: React.ReactNode }) => (
        <interactionContext.Provider>{children}</interactionContext.Provider>
      );
      const hook = renderHook(
        () => {
          interactionContext.useToolHandler(
            'searchProducts',
            useCallback(handler, []),
            { cleanup }
          );
          return interactionContext.useToolRegistry();
        },
        { wrapper: interactionWrapper }
      );

      const pending = hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'unmount-interaction',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        {
          interaction: () => {
            interactionStarted.resolve();
            return interactionNever.promise;
          },
        }
      );
      await interactionStarted.promise;
      act(() => hook.unmount());

      await expect(settleWithin(pending)).resolves.toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
          retryable: true,
          details: { executionState: 'detached' },
        },
      });
      await waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
      expect(handler).not.toHaveBeenCalled();
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

      for (const timeout of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, 2_147_483_648]) {
        const toolResult = await act(async () =>
          result.current.callTool(
            {
              method: 'tools/call',
              id: `invalid-timeout-${String(timeout)}`,
              params: { name: 'searchProducts', arguments: { query: 'laptop' } },
            },
            { timeout }
          )
        );

        expect(toolResult).toMatchObject({
          isError: true,
          toolCallId: `invalid-timeout-${String(timeout)}`,
          error: { code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS, retryable: false },
        });
      }
      expect(handler).not.toHaveBeenCalled();
    });

    it('keeps zero timeout valid and rejects invalid values before lifecycle events or timers', async () => {
      jest.useFakeTimers();
      try {
        const events: string[] = [];
        const handler = jest.fn(async () => ({ ok: true }));
        const timeoutContext = createToolContext('TimeoutBoundaryTools', {
          schema: testSchema,
          onToolCall: event => events.push(event.type),
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

        const zeroResult = await result.current.callTool(
          {
            method: 'tools/call',
            id: 'zero-timeout',
            params: { name: 'searchProducts', arguments: { query: 'laptop' } },
          },
          { timeout: 0 }
        );
        expect(zeroResult).toMatchObject({ structuredContent: { ok: true } });
        expect(events).toEqual(['started', 'completed']);

        events.length = 0;
        for (const timeout of [0.5, Number.MAX_SAFE_INTEGER + 1, 2_147_483_648]) {
          const toolResult = await result.current.callTool(
            {
              method: 'tools/call',
              id: `invalid-preflight-${String(timeout)}`,
              params: { name: 'searchProducts', arguments: { query: 'laptop' } },
            },
            { timeout }
          );
          expect(toolResult).toMatchObject({
            isError: true,
            error: { code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS },
          });
        }
        expect(events).toEqual([]);
        expect(jest.getTimerCount()).toBe(0);
        expect(handler).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
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

    it('cleans an allocated timeout when later per-call option validation fails', async () => {
      jest.useFakeTimers();
      try {
        const optionsContext = createToolContext('InvalidOptionsTimerTools', {
          schema: testSchema,
        });
        const optionsWrapper = ({ children }: { children: React.ReactNode }) => (
          <optionsContext.Provider>{children}</optionsContext.Provider>
        );
        const hook = renderHook(() => optionsContext.useToolRegistry(), {
          wrapper: optionsWrapper,
        });
        expect(jest.getTimerCount()).toBe(0);

        const toolResult = await hook.result.current.callTool(
          {
            method: 'tools/call',
            id: 'invalid-options-timer',
            params: { name: 'searchProducts', arguments: { query: 'laptop' } },
          },
          { timeout: 60_000, maxOutputBytes: 0 }
        );

        expect(toolResult).toMatchObject({
          isError: true,
          toolCallId: 'invalid-options-timer',
          error: { code: TOOL_CALL_ERROR_CODES.INVALID_OPTIONS, retryable: false },
        });
        expect(jest.getTimerCount()).toBe(0);
        hook.unmount();
      } finally {
        jest.clearAllTimers();
        jest.useRealTimers();
      }
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
      const baseStoreA = createMockDurableOperationStore(backend, 'process-a');
      const completeTransition = jest.fn(baseStoreA.complete);
      const storeA = { ...baseStoreA, complete: completeTransition };
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
      expect(completeTransition).toHaveBeenCalledWith(
        expect.any(String),
        'process-a',
        expect.objectContaining({ structuredContent: { saved: true } }),
        expect.objectContaining({ incarnation: expect.any(String), revision: 1 })
      );
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

    it('marks a timed-out durable owner unknown before its lease can be reclaimed', async () => {
      let now = 100;
      let markStarted!: () => void;
      let releaseHandler!: () => void;
      const started = new Promise<void>(resolve => {
        markStarted = resolve;
      });
      const handlerGate = new Promise<void>(resolve => {
        releaseHandler = resolve;
      });
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStoreA = createMockDurableOperationStore(
        backend,
        'timeout-owner-a',
        () => now
      );
      const completeA = jest.fn(baseStoreA.complete);
      const markUnknownA = jest.fn(baseStoreA.markUnknown);
      const storeA = {
        ...baseStoreA,
        complete: completeA,
        markUnknown: markUnknownA,
      };
      const firstContext = createToolContext('DurableTimeoutOwnerA', {
        schema: testSchema,
        durableOperationStore: storeA,
        durableOperationOwnerId: 'timeout-owner-a',
        durableOperationLeaseMs: 20,
      });
      const firstHandler = jest.fn(async () => {
        markStarted();
        await handlerGate;
        return { savedAfterTimeout: true };
      });
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
        id: 'durable-timeout-first',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      };

      const firstPending = firstHook.result.current.callTool(request, {
        timeout: 10,
        idempotencyKey: 'durable-timeout-operation',
      });
      await started;
      const firstResult = await act(async () => firstPending);

      expect(firstResult).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.TIMEOUT,
          retryable: true,
          details: { executionState: 'detached' },
        },
      });
      const operationKey = createToolOperationKey(
        'searchProducts',
        'durable-timeout-operation'
      );
      await expect(storeA.get(operationKey)).resolves.toMatchObject({
        ownerId: 'timeout-owner-a',
        revision: 2,
        state: 'unknown',
        result: { error: { code: TOOL_CALL_ERROR_CODES.TIMEOUT } },
      });
      expect(markUnknownA).toHaveBeenCalledWith(
        operationKey,
        'timeout-owner-a',
        expect.any(String),
        expect.objectContaining({
          error: expect.objectContaining({ code: TOOL_CALL_ERROR_CODES.TIMEOUT }),
        }),
        expect.objectContaining({ incarnation: expect.any(String), revision: 1 })
      );

      now = 121;
      const storeB = createMockDurableOperationStore(
        backend,
        'timeout-owner-b',
        () => now
      );
      const secondContext = createToolContext('DurableTimeoutOwnerB', {
        schema: testSchema,
        durableOperationStore: storeB,
        durableOperationOwnerId: 'timeout-owner-b',
        durableOperationLeaseMs: 20,
      });
      const secondHandler = jest.fn(async () => ({ duplicateWrite: true }));
      const secondWrapper = ({ children }: { children: React.ReactNode }) => (
        <secondContext.Provider>{children}</secondContext.Provider>
      );
      const secondHook = renderHook(
        () => {
          secondContext.useToolHandler('searchProducts', useCallback(secondHandler, []));
          return secondContext.useToolRegistry();
        },
        { wrapper: secondWrapper }
      );

      await expect(secondHook.result.current.callTool(
        { ...request, id: 'durable-timeout-reclaim' },
        { idempotencyKey: 'durable-timeout-operation' }
      )).resolves.toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN, retryable: false },
      });
      expect(secondHandler).not.toHaveBeenCalled();

      const ownerReplay = firstHook.result.current.callTool(
        { ...request, id: 'durable-timeout-owner-replay' },
        { idempotencyKey: 'durable-timeout-operation' }
      );
      releaseHandler();
      await ownerReplay;
      await expect(storeA.get(operationKey)).resolves.toMatchObject({
        ownerId: 'timeout-owner-a',
        revision: 2,
        state: 'unknown',
      });
      expect(completeA).not.toHaveBeenCalled();
      expect(firstHandler).toHaveBeenCalledTimes(1);
      secondHook.unmount();
      firstHook.unmount();
    });

    it('marks a durable in-flight handler unknown when its provider unmounts', async () => {
      let markStarted!: () => void;
      let releaseHandler!: () => void;
      const started = new Promise<void>(resolve => {
        markStarted = resolve;
      });
      const handlerGate = new Promise<void>(resolve => {
        releaseHandler = resolve;
      });
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(backend, 'unmount-owner');
      const complete = jest.fn(baseStore.complete);
      const markUnknown = jest.fn(baseStore.markUnknown);
      const store = { ...baseStore, complete, markUnknown };
      const context = createToolContext('DurableUnmountOwner', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'unmount-owner',
      });
      const handler = jest.fn(async () => {
        markStarted();
        await handlerGate;
        return { savedAfterUnmount: true };
      });
      const durableWrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper: durableWrapper }
      );
      const operationKey = createToolOperationKey(
        'searchProducts',
        'durable-unmount-operation'
      );
      const pending = hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-unmount-call',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-unmount-operation' }
      );
      await started;

      act(() => hook.unmount());
      const result = await pending;

      expect(result).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
          retryable: true,
          details: { executionState: 'detached' },
        },
      });
      await expect(store.get(operationKey)).resolves.toMatchObject({
        ownerId: 'unmount-owner',
        revision: 2,
        state: 'unknown',
        result: { error: { code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED } },
      });
      expect(markUnknown).toHaveBeenCalledWith(
        operationKey,
        'unmount-owner',
        expect.any(String),
        expect.objectContaining({
          error: expect.objectContaining({
            code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
          }),
        }),
        expect.objectContaining({ incarnation: expect.any(String), revision: 1 })
      );

      releaseHandler();
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      await expect(store.get(operationKey)).resolves.toMatchObject({
        ownerId: 'unmount-owner',
        revision: 2,
        state: 'unknown',
      });
      expect(complete).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('fails closed when an abort-to-unknown transition rejects', async () => {
      const handlerStarted = createDeferred<void>();
      const handlerGate = createDeferred<void>();
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(backend, 'reject-owner');
      const markUnknown = jest.fn(async () => {
        throw new Error('unknown transition unavailable');
      });
      const store = { ...baseStore, markUnknown };
      const context = createToolContext('DurableAbortReject', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'reject-owner',
        durableOperationLeaseMs: 20,
      });
      const handler = jest.fn(async () => {
        handlerStarted.resolve();
        await handlerGate.promise;
        return { lateWrite: true };
      });
      const durableWrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper: durableWrapper }
      );

      const pending = hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-abort-reject',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-abort-reject', timeout: 10 }
      );
      await handlerStarted.promise;

      let response: ToolCallResult;
      try {
        response = await settleWithin(pending);
      } finally {
        handlerGate.resolve();
        hook.unmount();
      }
      expect(response).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_STORE_FAILED,
          retryable: true,
          details: {
            operationKey: createToolOperationKey(
              'searchProducts',
              'durable-abort-reject'
            ),
            automaticRetrySafe: false,
            persistenceState: 'uncertain',
          },
        },
      });
      expect(markUnknown).toHaveBeenCalledTimes(1);
    });

    it('bounds a hung abort-to-unknown transition and reports uncertain persistence', async () => {
      const handlerStarted = createDeferred<void>();
      const handlerGate = createDeferred<void>();
      const neverMarkUnknown = createDeferred<never>();
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(backend, 'hung-unknown-owner');
      const markUnknown = jest.fn(() => neverMarkUnknown.promise);
      const store = { ...baseStore, markUnknown };
      const context = createToolContext('DurableAbortHang', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'hung-unknown-owner',
        durableOperationLeaseMs: 20,
      });
      const handler = jest.fn(async () => {
        handlerStarted.resolve();
        await handlerGate.promise;
        return { lateWrite: true };
      });
      const durableWrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper: durableWrapper }
      );

      const pending = hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-abort-hang',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-abort-hang', timeout: 10 }
      );
      await handlerStarted.promise;

      let response: ToolCallResult;
      try {
        response = await settleWithin(pending);
      } finally {
        handlerGate.resolve();
        hook.unmount();
      }
      expect(response).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_STORE_FAILED,
          retryable: true,
          details: {
            operationKey: createToolOperationKey(
              'searchProducts',
              'durable-abort-hang'
            ),
            automaticRetrySafe: false,
            persistenceState: 'uncertain',
          },
        },
      });
      expect(markUnknown).toHaveBeenCalledTimes(1);
    });

    it('races a hung terminal write with abort persistence and clears local replay state', async () => {
      let now = 100;
      const terminalStarted = createDeferred<void>();
      const neverComplete = createDeferred<never>();
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(
        backend,
        'terminal-hang-owner',
        () => now
      );
      const complete = jest.fn(() => {
        terminalStarted.resolve();
        return neverComplete.promise;
      });
      const markUnknown = jest.fn(baseStore.markUnknown);
      const store = { ...baseStore, complete, markUnknown };
      const context = createToolContext('DurableTerminalHang', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'terminal-hang-owner',
        durableOperationLeaseMs: 20,
      });
      const handler = jest.fn(async () => ({ saved: true }));
      const durableWrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper: durableWrapper }
      );
      const request = {
        method: 'tools/call' as const,
        id: 'durable-terminal-hang-first',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      };

      const firstPending = hook.result.current.callTool(request, {
        idempotencyKey: 'durable-terminal-hang',
        timeout: 10,
      });
      await terminalStarted.promise;
      const first = await settleWithin(firstPending);

      expect(first).toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.TIMEOUT, retryable: true },
      });
      const operationKey = createToolOperationKey(
        'searchProducts',
        'durable-terminal-hang'
      );
      await expect(store.get(operationKey)).resolves.toMatchObject({
        state: 'unknown',
        revision: 2,
      });

      const sameProviderRetry = await settleWithin(
        hook.result.current.callTool(
          { ...request, id: 'durable-terminal-hang-retry' },
          { idempotencyKey: 'durable-terminal-hang' }
        )
      );
      expect(sameProviderRetry).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN,
          // A retryable timeout does not make automatic mutation re-execution safe.
          retryable: false,
        },
      });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(complete).toHaveBeenCalledTimes(1);
      expect(markUnknown).toHaveBeenCalledTimes(1);

      now = 121;
      const recoveryStore = createMockDurableOperationStore(
        backend,
        'terminal-hang-recovery',
        () => now
      );
      await expect(recoveryStore.claim(
        operationKey,
        createToolCallFingerprint('searchProducts', { query: 'laptop' }),
        'terminal-hang-recovery',
        { leaseMs: 20 }
      )).resolves.toMatchObject({ status: 'unknown' });
      hook.unmount();
    });

    it('settles provider unmount while claim is hung and marks a late owner claim unknown', async () => {
      const claimStarted = createDeferred<void>();
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(
        backend,
        'late-claim-owner',
        () => 100
      );
      type Claim = Awaited<ReturnType<typeof baseStore.claim>>;
      const claimGate = createDeferred<Claim>();
      const lateUnknownStarted = createDeferred<void>();
      const lateUnknownCompleted = createDeferred<void>();
      let capturedClaimArgs: Parameters<typeof baseStore.claim> | undefined;
      const claim = jest.fn((...args: Parameters<typeof baseStore.claim>) => {
        capturedClaimArgs = args;
        claimStarted.resolve();
        return claimGate.promise;
      });
      const markUnknown = jest.fn(async (
        ...args: Parameters<typeof baseStore.markUnknown>
      ) => {
        lateUnknownStarted.resolve();
        try {
          return await baseStore.markUnknown(...args);
        } finally {
          lateUnknownCompleted.resolve();
        }
      });
      const store = { ...baseStore, claim, markUnknown };
      const context = createToolContext('DurableLateClaimUnmount', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'late-claim-owner',
        durableOperationLeaseMs: 20,
      });
      const handler = jest.fn(async () => ({ shouldNotRun: true }));
      const cleanup = jest.fn();
      const durableWrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler(
            'searchProducts',
            useCallback(handler, []),
            { cleanup }
          );
          return context.useToolRegistry();
        },
        { wrapper: durableWrapper }
      );
      const pending = hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-late-claim',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-late-claim' }
      );
      await claimStarted.promise;

      act(() => hook.unmount());
      const response = await settleWithin(pending);
      expect(response).toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_ABORTED,
          retryable: true,
          details: { executionState: 'detached' },
        },
      });
      await waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));

      const ownerClaim = await baseStore.claim(...capturedClaimArgs!);
      claimGate.resolve(ownerClaim);
      await settleWithin(lateUnknownStarted.promise);
      await settleWithin(lateUnknownCompleted.promise);
      const operationKey = createToolOperationKey('searchProducts', 'durable-late-claim');
      await expect(store.get(operationKey)).resolves.toMatchObject({
        state: 'unknown',
        revision: 2,
      });
      expect(markUnknown).toHaveBeenCalledTimes(1);
      expect(handler).not.toHaveBeenCalled();
    });

    it('accepts a successful terminal CAS when the competing abort CAS is stale', async () => {
      const completeResponseGate = createDeferred<void>();
      const terminalCommitted = createDeferred<void>();
      const abortAttempted = createDeferred<void>();
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(backend, 'terminal-winner');
      const complete = jest.fn(async (...args: Parameters<typeof baseStore.complete>) => {
        const record = await baseStore.complete(...args);
        terminalCommitted.resolve();
        await completeResponseGate.promise;
        return record;
      });
      const markUnknown = jest.fn(async (...args: Parameters<typeof baseStore.markUnknown>) => {
        await terminalCommitted.promise;
        abortAttempted.resolve();
        return baseStore.markUnknown(...args);
      });
      const store = { ...baseStore, complete, markUnknown };
      const context = createToolContext('DurableTerminalWinner', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'terminal-winner',
        durableOperationLeaseMs: 50,
      });
      const handler = jest.fn(async () => ({ saved: true }));
      const durableWrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(
        () => {
          context.useToolHandler('searchProducts', useCallback(handler, []));
          return context.useToolRegistry();
        },
        { wrapper: durableWrapper }
      );

      const pending = hook.result.current.callTool(
        {
          method: 'tools/call',
          id: 'durable-terminal-winner',
          params: { name: 'searchProducts', arguments: { query: 'laptop' } },
        },
        { idempotencyKey: 'durable-terminal-winner', timeout: 10 }
      );
      await abortAttempted.promise;
      completeResponseGate.resolve();
      const response = await settleWithin(pending);

      expect(response).toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.TIMEOUT, retryable: true },
      });
      await expect(store.get(
        createToolOperationKey('searchProducts', 'durable-terminal-winner')
      )).resolves.toMatchObject({ state: 'completed', revision: 2 });
      expect(complete).toHaveBeenCalledTimes(1);
      expect(markUnknown).toHaveBeenCalledTimes(1);
      hook.unmount();
    });

    it('normalizes a shared promise when an ambiguous terminal unknown CAS wins an abort race', async () => {
      const terminalResponseGate = createDeferred<void>();
      const terminalCommitted = createDeferred<void>();
      const abortAttempted = createDeferred<void>();
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const baseStore = createMockDurableOperationStore(backend, 'ambiguous-winner');
      let markUnknownCalls = 0;
      const markUnknown = jest.fn(async (...args: Parameters<typeof baseStore.markUnknown>) => {
        markUnknownCalls += 1;
        if (markUnknownCalls === 1) {
          const record = await baseStore.markUnknown(...args);
          terminalCommitted.resolve();
          await terminalResponseGate.promise;
          return record;
        }
        await terminalCommitted.promise;
        abortAttempted.resolve();
        return baseStore.markUnknown(...args);
      });
      const store = { ...baseStore, markUnknown };
      const context = createToolContext('DurableAmbiguousWinner', {
        schema: testSchema,
        durableOperationStore: store,
        durableOperationOwnerId: 'ambiguous-winner',
        durableOperationLeaseMs: 50,
      });
      const handler = jest.fn(async () => {
        const error = new Error('mutation outcome is unknown') as Error & {
          code: string;
          retryable: boolean;
        };
        Object.assign(error, {
          code: TOOL_CALL_ERROR_CODES.EXECUTION_UNKNOWN,
          retryable: true,
        });
        throw error;
      });
      const durableWrapper = ({ children }: { children: React.ReactNode }) => (
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
        { wrapper: durableWrapper }
      );
      const request = {
        method: 'tools/call' as const,
        id: 'ambiguous-winner-first',
        params: { name: 'searchProducts', arguments: { query: 'laptop' } },
      };

      const firstPending = hook.result.current.callTool(request, {
        idempotencyKey: 'ambiguous-winner',
        timeout: 10,
      });
      const sharedFollower = hook.result.current.callTool(
        { ...request, id: 'ambiguous-winner-follower' },
        { idempotencyKey: 'ambiguous-winner' }
      );
      await abortAttempted.promise;
      terminalResponseGate.resolve();

      await expect(settleWithin(firstPending)).resolves.toMatchObject({
        isError: true,
        error: { code: TOOL_CALL_ERROR_CODES.TIMEOUT, retryable: true },
      });
      await expect(settleWithin(sharedFollower)).resolves.toMatchObject({
        isError: true,
        error: {
          code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN,
          retryable: false,
        },
      });
      await expect(store.get(
        createToolOperationKey('searchProducts', 'ambiguous-winner')
      )).resolves.toMatchObject({ state: 'unknown', revision: 2 });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(markUnknown).toHaveBeenCalledTimes(2);
      hook.unmount();
    });

    it('rejects a legacy durable store without fencing capability', () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const fencedStore = createMockDurableOperationStore(backend, 'legacy-owner');
      const { fencingCapability: _fencingCapability, ...legacyStore } = fencedStore;

      expect(() => createToolContext('LegacyDurableTools', {
        schema: testSchema,
        durableOperationStore:
          legacyStore as unknown as DurableOperationStore<ToolCallResult>,
        durableOperationOwnerId: 'legacy-owner',
      })).toThrow('incarnation-revision fencing capability');
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
      const ownerClaim = await ownerStore.claim(
        operationKey,
        fingerprint,
        'owner',
        { leaseMs: 60_000 }
      );

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

      await ownerStore.markUnknown(
        operationKey,
        'owner',
        'worker crashed after write',
        undefined,
        ownerClaim.fence
      );
      await expect(hook.result.current.callTool(
        { ...request, id: 'durable-unknown' },
        { idempotencyKey: 'durable-save-2' }
      )).resolves.toMatchObject({
        error: { code: TOOL_CALL_ERROR_CODES.IDEMPOTENCY_UNKNOWN, retryable: false },
      });
      expect(handler).not.toHaveBeenCalled();
      hook.unmount();
    });

    it('reports uncertain persistence when the durable terminal transition fails', async () => {
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
          details: {
            operationKey: createToolOperationKey(
              'searchProducts',
              'durable-save-transition-failure'
            ),
            persistenceState: 'uncertain',
            automaticRetrySafe: false,
          },
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
      const ownerClaim = await ownerStore.claim(operationKey, fingerprint, 'owner');
      const unknown = await ownerStore.markUnknown(
        operationKey,
        'owner',
        'provider disconnected after write',
        undefined,
        ownerClaim.fence
      );

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
        { state: 'completed', result: { content: [], structuredContent: { saved: true } } },
        undefined,
        { incarnation: unknown.incarnation, revision: unknown.revision }
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

      const compatibleKey = createToolOperationKey(
        'searchProducts',
        'durable-save-reconcile-compatible'
      );
      const compatibleClaim = await ownerStore.claim(
        compatibleKey,
        fingerprint,
        'owner'
      );
      const compatibleUnknown = await ownerStore.markUnknown(
        compatibleKey,
        'owner',
        'legacy caller observed an unknown outcome',
        undefined,
        compatibleClaim.fence
      );
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-compatible',
        { state: 'failed', reason: 'domain query rejected the write' }
      )).rejects.toThrow('fifth-argument fence');
      const compatibleObserved = await hook.result.current.getOperationStatus(
        'searchProducts',
        'durable-save-reconcile-compatible'
      );
      expect(compatibleObserved).toMatchObject({ state: 'unknown' });
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-compatible',
        { state: 'failed', reason: 'domain query rejected the write' }
      )).rejects.toThrow('omitted and numeric legacy fences fail closed');
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-compatible',
        { state: 'failed', reason: 'domain query rejected the write' },
        undefined,
        {
          incarnation: compatibleObserved?.incarnation ?? compatibleUnknown.incarnation,
          revision: compatibleObserved?.revision ?? compatibleUnknown.revision,
        }
      )).resolves.toMatchObject({
        state: 'failed',
        reconciledBy: 'recovery',
      });

      const revisionKey = createToolOperationKey(
        'searchProducts',
        'durable-save-reconcile-revision'
      );
      const revisionClaim = await ownerStore.claim(revisionKey, fingerprint, 'owner');
      const revisionUnknown = await ownerStore.markUnknown(
        revisionKey,
        'owner',
        'revision-compatible caller observed an unknown outcome',
        undefined,
        revisionClaim.fence
      );
      await expect(hook.result.current.getOperationStatus(
        'searchProducts',
        'durable-save-reconcile-revision'
      )).resolves.toMatchObject({ state: 'unknown' });
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-revision',
        { state: 'failed', reason: 'domain query rejected the write' },
        undefined,
        revisionUnknown.revision - 1
      )).rejects.toThrow('omitted and numeric legacy fences fail closed');
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-revision',
        { state: 'failed', reason: 'domain query rejected the write' },
        undefined,
        revisionUnknown.revision
      )).rejects.toThrow('omitted and numeric legacy fences fail closed');
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-revision',
        { state: 'failed', reason: 'domain query rejected the write' },
        undefined,
        {
          incarnation: revisionUnknown.incarnation,
          revision: revisionUnknown.revision,
        }
      )).resolves.toMatchObject({ state: 'failed' });
      expect(handler).not.toHaveBeenCalled();
      hook.unmount();
    });

    it('rejects legacy reconciliation after a poller observes a recreated ABA incarnation', async () => {
      let now = 1_000;
      let incarnation = 0;
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const storeOptions = {
        retentionMs: 0,
        createIncarnation: () => `tool-reconcile-incarnation-${++incarnation}`,
      };
      const ownerStore = createMockDurableOperationStore(
        backend,
        'owner',
        () => now,
        storeOptions
      );
      const recoveryStore = createMockDurableOperationStore(
        backend,
        'recovery',
        () => now,
        storeOptions
      );
      const operationKey = createToolOperationKey(
        'searchProducts',
        'durable-save-reconcile-aba'
      );
      const fingerprint = createToolCallFingerprint('searchProducts', { query: 'laptop' });
      const firstClaim = await ownerStore.claim(operationKey, fingerprint, 'owner');
      const firstUnknown = await ownerStore.markUnknown(
        operationKey,
        'owner',
        'first incarnation outcome is unknown',
        undefined,
        firstClaim.fence
      );
      const context = createToolContext('DurableReconcileAbaTools', {
        schema: testSchema,
        durableOperationStore: recoveryStore,
        durableOperationOwnerId: 'recovery',
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <context.Provider>{children}</context.Provider>
      );
      const hook = renderHook(() => context.useToolRegistry(), { wrapper });

      await expect(hook.result.current.getOperationStatus(
        'searchProducts',
        'durable-save-reconcile-aba'
      )).resolves.toMatchObject({
        incarnation: firstUnknown.incarnation,
        revision: firstUnknown.revision,
      });
      await ownerStore.resolveUnknown(
        operationKey,
        'first-reconciler',
        { state: 'failed', reason: 'first incarnation was rejected' },
        { incarnation: firstUnknown.incarnation, revision: firstUnknown.revision }
      );
      now = 1_001;
      await expect(ownerStore.prune(now)).resolves.toBe(1);
      const secondClaim = await ownerStore.claim(operationKey, fingerprint, 'owner');
      const secondUnknown = await ownerStore.markUnknown(
        operationKey,
        'owner',
        'second incarnation outcome is unknown',
        undefined,
        secondClaim.fence
      );
      expect(secondUnknown.revision).toBe(firstUnknown.revision);
      expect(secondUnknown.incarnation).not.toBe(firstUnknown.incarnation);

      // A second poller observes incarnation B in the same registry after the
      // first caller made its domain decision from incarnation A. Legacy
      // reconciliation must not borrow that newer observation as its fence.
      await expect(hook.result.current.getOperationStatus(
        'searchProducts',
        'durable-save-reconcile-aba'
      )).resolves.toMatchObject({
        incarnation: secondUnknown.incarnation,
        revision: secondUnknown.revision,
      });

      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-aba',
        { state: 'completed', result: { content: [], structuredContent: { stale: true } } }
      )).rejects.toThrow('omitted and numeric legacy fences fail closed');
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-aba',
        { state: 'completed', result: { content: [], structuredContent: { stale: true } } },
        undefined,
        firstUnknown.revision
      )).rejects.toThrow('omitted and numeric legacy fences fail closed');
      await expect(hook.result.current.reconcileOperation(
        'searchProducts',
        'durable-save-reconcile-aba',
        { state: 'completed', result: { content: [], structuredContent: { stale: true } } },
        undefined,
        { incarnation: firstUnknown.incarnation, revision: firstUnknown.revision }
      )).rejects.toThrow('fence is stale');
      await expect(recoveryStore.get(operationKey)).resolves.toMatchObject({
        state: 'unknown',
        incarnation: secondUnknown.incarnation,
        revision: secondUnknown.revision,
      });
      hook.unmount();
    });

    it('runs a domain recovery resolver only for unknown records and uses the observed fence', async () => {
      const backend = createMockDurableOperationBackend<ToolCallResult>();
      const ownerStore = createMockDurableOperationStore(backend, 'owner');
      const operationKey = createToolOperationKey('searchProducts', 'durable-save-recover');
      const fingerprint = createToolCallFingerprint('searchProducts', { query: 'laptop' });
      const ownerClaim = await ownerStore.claim(operationKey, fingerprint, 'owner');
      await ownerStore.markUnknown(
        operationKey,
        'owner',
        'worker crashed after provider write',
        undefined,
        ownerClaim.fence
      );

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
      const staleClaim = await ownerStore.claim(staleKey, fingerprint, 'owner');
      await ownerStore.markUnknown(
        staleKey,
        'owner',
        'worker crashed before acknowledgement',
        undefined,
        staleClaim.fence
      );
      const staleResolver = jest.fn(async () => {
        const current = await backend.read(staleKey);
        await backend.compareAndSet(staleKey, {
          incarnation: current!.incarnation,
          revision: current!.revision,
        }, {
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
      )).rejects.toThrow('fence is stale');
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
    it('registers result handlers in core\'s explicit result phase', async () => {
      let controller: unknown;
      const { result: callResult } = renderHook(
        () => {
          const call = useToolCall();
          useToolResultHandler(
            'searchProducts',
            useCallback((payload, resultController) => {
              controller = resultController;
              return { query: payload.query, phase: 'result' };
            }, [])
          );
          return call;
        },
        { wrapper }
      );

      const toolResult = await callResult.current('searchProducts', {
        query: 'laptop',
        maxResults: 10,
      });

      expect(toolResult).toMatchObject({
        structuredContent: { query: 'laptop', phase: 'result' },
      });
      expect(controller).toEqual(expect.objectContaining({
        abort: expect.any(Function),
        setResult: expect.any(Function),
        mergeResult: expect.any(Function),
      }));
      expect((controller as { modifyPayload?: unknown }).modifyPayload).toBeUndefined();
    });

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
