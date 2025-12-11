/**
 * Execute Verification Tests
 *
 * Verifies that schema validation works correctly during action execution:
 * - Valid payloads are executed
 * - Invalid payloads are rejected before handler execution
 * - Handler receives validated data
 * - Result collection works with schema validation
 */

import { z } from 'zod';
import {
  ActionRegister,
  defineAction,
  createActionSchema,
  ActionValidationError,
  type ActionPayloadMap,
} from '../../src';

describe('Execute with Schema Validation', () => {
  interface UserActions extends ActionPayloadMap {
    updateUser: { id: string; name: string; email?: string };
    createItem: { title: string; count: number };
  }

  const actionSchema = createActionSchema({
    updateUser: defineAction(
      {
        name: 'updateUser',
        description: 'Update user profile',
        parameters: z.object({
          id: z.string().min(1, 'ID is required'),
          name: z.string().min(2, 'Name must be at least 2 characters').max(50),
          email: z.string().email().optional(),
        }),
      },
      z
    ),
    createItem: defineAction(
      {
        name: 'createItem',
        description: 'Create a new item',
        parameters: z.object({
          title: z.string().min(1),
          count: z.number().int().positive(),
        }),
      },
      z
    ),
  });

  let register: ActionRegister<UserActions>;
  let executionLog: Array<{ action: string; payload: unknown }>;

  beforeEach(() => {
    executionLog = [];
    register = new ActionRegister<UserActions>({
      registry: {
        schema: actionSchema,
        validationMode: 'strict',
      },
    });
  });

  afterEach(() => {
    register.destroy();
  });

  describe('valid payload execution', () => {
    it('should execute handler with valid payload', async () => {
      register.register('updateUser', (payload) => {
        executionLog.push({ action: 'updateUser', payload });
        return { processed: true };
      });

      await register.dispatch('updateUser', {
        id: '123',
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(executionLog).toHaveLength(1);
      expect(executionLog[0]).toEqual({
        action: 'updateUser',
        payload: { id: '123', name: 'John Doe', email: 'john@example.com' },
      });
    });

    it('should execute handler without optional fields', async () => {
      register.register('updateUser', (payload) => {
        executionLog.push({ action: 'updateUser', payload });
      });

      await register.dispatch('updateUser', {
        id: '456',
        name: 'Jane',
      });

      expect(executionLog).toHaveLength(1);
      expect(executionLog[0].payload).toEqual({ id: '456', name: 'Jane' });
    });

    it('should collect results from executed handlers', async () => {
      register.register('createItem', () => ({ itemId: 'item-1' }));
      register.register('createItem', () => ({ logged: true }), { priority: 5 });

      const result = await register.dispatchWithResult(
        'createItem',
        { title: 'Test Item', count: 5 },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toContainEqual({ itemId: 'item-1' });
      expect(result.results).toContainEqual({ logged: true });
    });

    it('should execute multiple handlers in priority order', async () => {
      const order: number[] = [];

      register.register('updateUser', () => { order.push(1); }, { priority: 10 });
      register.register('updateUser', () => { order.push(2); }, { priority: 5 });
      register.register('updateUser', () => { order.push(3); }, { priority: 15 });

      await register.dispatch('updateUser', { id: '1', name: 'Test' });

      expect(order).toEqual([3, 1, 2]); // Higher priority first
    });
  });

  describe('invalid payload rejection', () => {
    it('should not execute handler when payload is invalid', async () => {
      register.register('updateUser', (payload) => {
        executionLog.push({ action: 'updateUser', payload });
      });

      await expect(
        register.dispatch('updateUser', { id: '', name: 'John' })
      ).rejects.toThrow(ActionValidationError);

      expect(executionLog).toHaveLength(0); // Handler should not be called
    });

    it('should reject payload with wrong type', async () => {
      register.register('createItem', (payload) => {
        executionLog.push({ action: 'createItem', payload });
      });

      await expect(
        register.dispatch('createItem', { title: 'Test', count: 'not a number' as unknown as number })
      ).rejects.toThrow(ActionValidationError);

      expect(executionLog).toHaveLength(0);
    });

    it('should reject payload with negative number when positive required', async () => {
      register.register('createItem', jest.fn());

      await expect(
        register.dispatch('createItem', { title: 'Test', count: -5 })
      ).rejects.toThrow(ActionValidationError);
    });

    it('should reject payload with invalid email format', async () => {
      register.register('updateUser', jest.fn());

      await expect(
        register.dispatch('updateUser', {
          id: '123',
          name: 'John',
          email: 'invalid-email',
        })
      ).rejects.toThrow(ActionValidationError);
    });
  });

  describe('async handler execution', () => {
    it('should work with async handlers and valid payload', async () => {
      register.register('updateUser', async (payload) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        executionLog.push({ action: 'updateUser', payload });
        return { async: true };
      });

      await register.dispatch('updateUser', { id: '789', name: 'Async User' });

      expect(executionLog).toHaveLength(1);
      expect(executionLog[0].payload).toEqual({ id: '789', name: 'Async User' });
    });

    it('should reject invalid payload before async handler starts', async () => {
      let handlerStarted = false;

      register.register('updateUser', async () => {
        handlerStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      await expect(
        register.dispatch('updateUser', { id: '', name: 'X' })
      ).rejects.toThrow(ActionValidationError);

      expect(handlerStarted).toBe(false);
    });
  });

  describe('tool chain format verification', () => {
    it('should generate correct MCP format', () => {
      const mcp = actionSchema.updateUser.toMCP();

      expect(mcp.name).toBe('updateUser');
      expect(mcp.description).toBe('Update user profile');
      expect(mcp.inputSchema.type).toBe('object');
      expect(mcp.inputSchema.properties).toHaveProperty('id');
      expect(mcp.inputSchema.properties).toHaveProperty('name');
      expect(mcp.inputSchema.properties).toHaveProperty('email');
      expect(mcp.inputSchema.required).toContain('id');
      expect(mcp.inputSchema.required).toContain('name');
      expect(mcp.inputSchema.required).not.toContain('email');
    });

    it('should generate correct OpenAI format', () => {
      const openai = actionSchema.createItem.toOpenAI();

      expect(openai.type).toBe('function');
      expect(openai.function.name).toBe('createItem');
      expect(openai.function.description).toBe('Create a new item');
      expect(openai.function.parameters.type).toBe('object');
      expect(openai.function.parameters.properties).toHaveProperty('title');
      expect(openai.function.parameters.properties).toHaveProperty('count');
    });

    it('should generate correct Anthropic format', () => {
      const anthropic = actionSchema.updateUser.toAnthropic();

      expect(anthropic.name).toBe('updateUser');
      expect(anthropic.description).toBe('Update user profile');
      expect(anthropic.input_schema.type).toBe('object');
    });
  });

  describe('edge cases', () => {
    it('should handle empty optional fields correctly', async () => {
      register.register('updateUser', (payload) => {
        executionLog.push({ action: 'updateUser', payload });
      });

      // email is optional, so undefined should be fine
      await register.dispatch('updateUser', { id: '123', name: 'Test' });

      expect(executionLog).toHaveLength(1);
    });

    it('should validate before each dispatch', async () => {
      register.register('updateUser', jest.fn());

      // First dispatch - valid
      await register.dispatch('updateUser', { id: '1', name: 'Valid' });

      // Second dispatch - invalid (should still validate)
      await expect(
        register.dispatch('updateUser', { id: '', name: 'Invalid' })
      ).rejects.toThrow(ActionValidationError);

      // Third dispatch - valid again
      await register.dispatch('updateUser', { id: '2', name: 'Valid Again' });
    });
  });
});
