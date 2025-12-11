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
