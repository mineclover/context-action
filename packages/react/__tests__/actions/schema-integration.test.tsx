/**
 * @fileoverview Tests for Zod Schema Integration with React ActionContext
 *
 * Tests that verify:
 * - Re-exports from @context-action/core work correctly
 * - ActionContext with schema option works
 * - Validation in React component context
 * - Error handling with ActionValidationError
 */

import { renderHook, act } from '@testing-library/react';
import React, { useCallback, useState } from 'react';
import { z } from 'zod';
import {
  createActionContext,
  defineAction,
  createActionSchema,
  createActionFactory,
  ActionValidationError,
  isActionValidationError,
  zodToJsonSchema,
} from '@context-action/react';
import type {
  ActionPayloadMap,
  UnifiedAction,
  ActionSchemaMap,
  InferActionPayloadMap,
  JSONSchema,
  MCPToolDefinition,
  OpenAIToolDefinition,
  AnthropicToolDefinition,
} from '@context-action/react';

describe('Schema Integration with React', () => {
  describe('Re-exports from @context-action/core', () => {
    it('should export defineAction', () => {
      expect(defineAction).toBeDefined();
      expect(typeof defineAction).toBe('function');
    });

    it('should export createActionSchema', () => {
      expect(createActionSchema).toBeDefined();
      expect(typeof createActionSchema).toBe('function');
    });

    it('should export createActionFactory', () => {
      expect(createActionFactory).toBeDefined();
      expect(typeof createActionFactory).toBe('function');
    });

    it('should export ActionValidationError', () => {
      expect(ActionValidationError).toBeDefined();
      const error = new ActionValidationError('test', null);
      expect(error).toBeInstanceOf(ActionValidationError);
    });

    it('should export isActionValidationError', () => {
      expect(isActionValidationError).toBeDefined();
      expect(typeof isActionValidationError).toBe('function');
    });

    it('should export zodToJsonSchema', () => {
      expect(zodToJsonSchema).toBeDefined();
      expect(typeof zodToJsonSchema).toBe('function');
    });
  });

  describe('defineAction in React context', () => {
    it('should create action with Zod schema', () => {
      const action = defineAction(
        {
          name: 'reactAction',
          description: 'Test action for React',
          parameters: z.object({
            value: z.string(),
            count: z.number(),
          }),
        },
        z
      );

      expect(action.name).toBe('reactAction');
      expect(action.description).toBe('Test action for React');
      expect(action.validate).toBeDefined();
      expect(action.safeParse).toBeDefined();
      expect(action.toMCP).toBeDefined();
      expect(action.toOpenAI).toBeDefined();
      expect(action.toAnthropic).toBeDefined();
    });

    it('should work with createActionFactory', () => {
      const define = createActionFactory(z);

      const action = define({
        name: 'factoryAction',
        parameters: z.object({ data: z.string() }),
      });

      expect(action.name).toBe('factoryAction');
      expect(action.validate({ data: 'test' })).toEqual({ data: 'test' });
    });
  });

  describe('ActionContext with schema option', () => {
    interface UserActions extends ActionPayloadMap {
      updateUser: { id: string; name: string };
      deleteUser: { id: string };
    }

    const userSchema = createActionSchema({
      updateUser: defineAction(
        {
          name: 'updateUser',
          parameters: z.object({
            id: z.string().min(1),
            name: z.string().min(2).max(50),
          }),
        },
        z
      ),
      deleteUser: defineAction(
        {
          name: 'deleteUser',
          parameters: z.object({
            id: z.string().uuid(),
          }),
        },
        z
      ),
    });

    it('should create ActionContext with schema', () => {
      const UserContext = createActionContext<UserActions>('User', {
        schema: userSchema,
      });

      expect(UserContext.Provider).toBeDefined();
      expect(UserContext.useActionDispatch).toBeDefined();
    });

    it('should validate payload on dispatch - valid payload', async () => {
      const UserContext = createActionContext<UserActions>('User', {
        schema: userSchema,
        registry: {
          validationMode: 'strict',
        },
      });

      let receivedPayload: UserActions['updateUser'] | null = null;

      function TestComponent() {
        const dispatch = UserContext.useActionDispatch();

        UserContext.useActionHandler(
          'updateUser',
          useCallback((payload) => {
            receivedPayload = payload;
          }, [])
        );

        return { dispatch };
      }

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContext.Provider>{children}</UserContext.Provider>
      );

      const { result } = renderHook(() => TestComponent(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.dispatch('updateUser', { id: '123', name: 'John' });
      });

      expect(receivedPayload).toEqual({ id: '123', name: 'John' });
    });

    it('should reject invalid payload on dispatch', async () => {
      const UserContext = createActionContext<UserActions>('User', {
        schema: userSchema,
        registry: {
          validationMode: 'strict',
        },
      });

      let handlerCalled = false;

      function TestComponent() {
        const dispatch = UserContext.useActionDispatch();

        UserContext.useActionHandler(
          'updateUser',
          useCallback(() => {
            handlerCalled = true;
          }, [])
        );

        return { dispatch };
      }

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContext.Provider>{children}</UserContext.Provider>
      );

      const { result } = renderHook(() => TestComponent(), { wrapper: Wrapper });

      await act(async () => {
        try {
          await result.current.dispatch('updateUser', { id: '', name: 'John' });
        } catch (error) {
          expect(isActionValidationError(error)).toBe(true);
          if (isActionValidationError(error)) {
            expect(error.action).toBe('updateUser');
          }
        }
      });

      expect(handlerCalled).toBe(false);
    });

    it('should warn but continue with validationMode warn', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const UserContext = createActionContext<UserActions>('User', {
        schema: userSchema,
        registry: {
          validationMode: 'warn',
        },
      });

      let handlerCalled = false;

      function TestComponent() {
        const dispatch = UserContext.useActionDispatch();

        UserContext.useActionHandler(
          'updateUser',
          useCallback(() => {
            handlerCalled = true;
          }, [])
        );

        return { dispatch };
      }

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <UserContext.Provider>{children}</UserContext.Provider>
      );

      const { result } = renderHook(() => TestComponent(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.dispatch('updateUser', { id: '', name: 'J' });
      });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(handlerCalled).toBe(true);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Error handling in React components', () => {
    interface FormActions extends ActionPayloadMap {
      submitForm: { email: string; message: string };
    }

    const formSchema = createActionSchema({
      submitForm: defineAction(
        {
          name: 'submitForm',
          parameters: z.object({
            email: z.string().email('Invalid email format'),
            message: z.string().min(10, 'Message must be at least 10 characters'),
          }),
        },
        z
      ),
    });

    it('should capture validation errors in component state', async () => {
      const FormContext = createActionContext<FormActions>('Form', {
        schema: formSchema,
      });

      function useFormSubmit() {
        const dispatch = FormContext.useActionDispatch();
        const [error, setError] = useState<ActionValidationError | null>(null);

        FormContext.useActionHandler(
          'submitForm',
          useCallback(() => {
            // Success handler
          }, [])
        );

        const submit = async (data: FormActions['submitForm']) => {
          try {
            setError(null);
            await dispatch('submitForm', data);
          } catch (e) {
            if (isActionValidationError(e)) {
              setError(e);
            }
          }
        };

        return { submit, error };
      }

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormContext.Provider>{children}</FormContext.Provider>
      );

      const { result } = renderHook(() => useFormSubmit(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.submit({ email: 'invalid', message: 'short' });
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.action).toBe('submitForm');
      expect(result.current.error?.issues.length).toBeGreaterThan(0);
    });

    it('should provide error details for form validation', async () => {
      const FormContext = createActionContext<FormActions>('Form', {
        schema: formSchema,
      });

      function useFormWithErrors() {
        const dispatch = FormContext.useActionDispatch();
        const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

        FormContext.useActionHandler('submitForm', useCallback(() => {}, []));

        const submit = async (data: FormActions['submitForm']) => {
          try {
            setFieldErrors({});
            await dispatch('submitForm', data);
            return true;
          } catch (e) {
            if (isActionValidationError(e)) {
              const errors: Record<string, string> = {};
              for (const issue of e.issues) {
                const path = issue.path.join('.');
                errors[path] = issue.message;
              }
              setFieldErrors(errors);
            }
            return false;
          }
        };

        return { submit, fieldErrors };
      }

      const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <FormContext.Provider>{children}</FormContext.Provider>
      );

      const { result } = renderHook(() => useFormWithErrors(), { wrapper: Wrapper });

      await act(async () => {
        await result.current.submit({ email: 'bad-email', message: 'hi' });
      });

      expect(result.current.fieldErrors).toHaveProperty('email');
      expect(result.current.fieldErrors).toHaveProperty('message');
    });
  });

  describe('Tool chain format in React', () => {
    it('should generate tool definitions usable in React apps', () => {
      const action = defineAction(
        {
          name: 'searchProducts',
          description: 'Search for products',
          parameters: z.object({
            query: z.string(),
            limit: z.number().int().positive().default(10),
          }),
        },
        z
      );

      // MCP format for Model Context Protocol
      const mcpTool: MCPToolDefinition = action.toMCP();
      expect(mcpTool.name).toBe('searchProducts');
      expect(mcpTool.inputSchema.type).toBe('object');

      // OpenAI format for function calling
      const openaiTool: OpenAIToolDefinition = action.toOpenAI();
      expect(openaiTool.type).toBe('function');
      expect(openaiTool.function.name).toBe('searchProducts');
      expect(openaiTool.function.parameters).toEqual(mcpTool.inputSchema);

      // Anthropic format for Claude
      const anthropicTool: AnthropicToolDefinition = action.toAnthropic();
      expect(anthropicTool.name).toBe('searchProducts');
      expect(anthropicTool.input_schema.type).toBe('object');
      expect(anthropicTool.input_schema).toEqual(mcpTool.inputSchema);
    });

    it('should allow building tool arrays for LLM providers', () => {
      const schema = createActionSchema({
        search: defineAction(
          {
            name: 'search',
            description: 'Search items',
            parameters: z.object({ query: z.string() }),
          },
          z
        ),
        create: defineAction(
          {
            name: 'create',
            description: 'Create item',
            parameters: z.object({ title: z.string() }),
          },
          z
        ),
      });

      // Build OpenAI tools array
      const openaiTools = Object.values(schema).map((action) =>
        (action as UnifiedAction).toOpenAI()
      );

      expect(openaiTools).toHaveLength(2);
      expect(openaiTools[0]?.type).toBe('function');
      expect(openaiTools[1]?.type).toBe('function');
    });
  });

  describe('Type inference verification', () => {
    it('should infer payload types from schema', () => {
      const schema = createActionSchema({
        action1: defineAction(
          {
            name: 'action1',
            parameters: z.object({
              id: z.number(),
              tags: z.array(z.string()),
            }),
          },
          z
        ),
      });

      type InferredActions = InferActionPayloadMap<typeof schema>;

      // Type-level verification (will fail compilation if types are wrong)
      const payload: InferredActions['action1'] = {
        id: 123,
        tags: ['a', 'b'],
      };

      expect(payload.id).toBe(123);
      expect(payload.tags).toEqual(['a', 'b']);
    });
  });
});
