/**
 * Validation Integration Tests
 *
 * Tests for ActionValidationError and ActionRegister schema validation:
 * - ActionValidationError class functionality
 * - ActionRegister + schema validation integration
 * - Validation modes (strict, warn, silent)
 * - isActionValidationError type guard
 */

import { z } from 'zod';
import {
  ActionRegister,
  ActionValidationError,
  isActionValidationError,
  defineAction,
  createActionSchema,
  type ActionPayloadMap,
} from '../../src';

describe('ActionValidationError', () => {
  describe('constructor', () => {
    it('should create error with action name and zodError', () => {
      const zodSchema = z.object({
        id: z.string().min(1),
      });

      const result = zodSchema.safeParse({ id: '' });
      if (!result.success) {
        const error = new ActionValidationError('testAction', result.error);

        expect(error.name).toBe('ActionValidationError');
        expect(error.action).toBe('testAction');
        expect(error.message).toContain('testAction');
        expect(error.message).toContain('validation failed');
      }
    });

    it('should handle non-Zod error gracefully', () => {
      const error = new ActionValidationError('testAction', { message: 'Custom error' });

      expect(error.name).toBe('ActionValidationError');
      expect(error.action).toBe('testAction');
      expect(error.message).toContain('Custom error');
    });

    it('should handle null zodError', () => {
      const error = new ActionValidationError('testAction', null);

      expect(error.name).toBe('ActionValidationError');
      expect(error.message).toContain('Validation failed');
    });
  });

  describe('issues getter', () => {
    it('should return issues array from zodError', () => {
      const zodSchema = z.object({
        name: z.string().min(2),
        age: z.number().positive(),
      });

      const result = zodSchema.safeParse({ name: 'a', age: -1 });
      if (!result.success) {
        const error = new ActionValidationError('testAction', result.error);

        expect(error.issues.length).toBeGreaterThan(0);
        expect(error.issues[0]).toHaveProperty('message');
        expect(error.issues[0]).toHaveProperty('path');
      }
    });

    it('should return empty array for non-Zod error', () => {
      const error = new ActionValidationError('testAction', { message: 'not a zod error' });

      expect(error.issues).toEqual([]);
    });
  });

  describe('firstError getter', () => {
    it('should return first error message', () => {
      const zodSchema = z.object({
        name: z.string().min(5),
      });

      const result = zodSchema.safeParse({ name: 'ab' });
      if (!result.success) {
        const error = new ActionValidationError('testAction', result.error);

        expect(error.firstError).toBeDefined();
        expect(typeof error.firstError).toBe('string');
      }
    });

    it('should return undefined when no issues', () => {
      const error = new ActionValidationError('testAction', null);

      expect(error.firstError).toBeUndefined();
    });
  });

  describe('errorPaths getter', () => {
    it('should return array of error paths', () => {
      const zodSchema = z.object({
        user: z.object({
          name: z.string().min(1),
        }),
      });

      const result = zodSchema.safeParse({ user: { name: '' } });
      if (!result.success) {
        const error = new ActionValidationError('testAction', result.error);

        expect(error.errorPaths).toContain('user.name');
      }
    });
  });

  describe('formattedErrors getter', () => {
    it('should return formatted errors object', () => {
      const zodSchema = z.object({
        email: z.string().email(),
      });

      const result = zodSchema.safeParse({ email: 'invalid' });
      if (!result.success) {
        const error = new ActionValidationError('testAction', result.error);

        expect(error.formattedErrors).toBeDefined();
      }
    });

    it('should return empty object for non-Zod error', () => {
      const error = new ActionValidationError('testAction', null);

      expect(error.formattedErrors).toEqual({});
    });
  });

  describe('flattenedErrors getter', () => {
    it('should return flattened errors structure', () => {
      const zodSchema = z.object({
        field: z.string(),
      });

      const result = zodSchema.safeParse({});
      if (!result.success) {
        const error = new ActionValidationError('testAction', result.error);
        const flattened = error.flattenedErrors as { fieldErrors: Record<string, string[]> };

        expect(flattened).toHaveProperty('fieldErrors');
      }
    });

    it('should return default structure for non-Zod error', () => {
      const error = new ActionValidationError('testAction', null);

      expect(error.flattenedErrors).toEqual({ fieldErrors: {}, formErrors: [] });
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const zodSchema = z.object({
        id: z.string(),
      });

      const result = zodSchema.safeParse({ id: 123 });
      if (!result.success) {
        const error = new ActionValidationError('testAction', result.error);
        const json = error.toJSON();

        expect(json.name).toBe('ActionValidationError');
        expect(json.action).toBe('testAction');
        expect(json.message).toBeDefined();
        expect(json.issues).toBeDefined();
      }
    });
  });
});

describe('isActionValidationError', () => {
  it('should return true for ActionValidationError', () => {
    const error = new ActionValidationError('test', null);

    expect(isActionValidationError(error)).toBe(true);
  });

  it('should return false for regular Error', () => {
    const error = new Error('regular error');

    expect(isActionValidationError(error)).toBe(false);
  });

  it('should return false for non-Error objects', () => {
    expect(isActionValidationError(null)).toBe(false);
    expect(isActionValidationError(undefined)).toBe(false);
    expect(isActionValidationError({ message: 'not an error' })).toBe(false);
  });
});

describe('ActionRegister Schema Validation Integration', () => {
  interface TestActions extends ActionPayloadMap {
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

  describe('strict validation mode', () => {
    let register: ActionRegister<TestActions>;

    beforeEach(() => {
      register = new ActionRegister<TestActions>({
        registry: {
          schema: userSchema,
          validationMode: 'strict',
        },
      });
    });

    afterEach(() => {
      register.destroy();
    });

    it('should allow valid payload', async () => {
      const handler = jest.fn();
      register.register('updateUser', handler);

      await register.dispatch('updateUser', { id: '123', name: 'John' });

      expect(handler).toHaveBeenCalledWith(
        { id: '123', name: 'John' },
        expect.any(Object)
      );
    });

    it('should throw ActionValidationError for invalid payload', async () => {
      const handler = jest.fn();
      register.register('updateUser', handler);

      await expect(
        register.dispatch('updateUser', { id: '', name: 'John' })
      ).rejects.toThrow(ActionValidationError);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should throw ActionValidationError for invalid payload with dispatchWithResult', async () => {
      const handler = jest.fn();
      register.register('updateUser', handler);

      await expect(
        register.dispatchWithResult('updateUser', { id: '', name: 'John' })
      ).rejects.toThrow(ActionValidationError);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should include action name in error', async () => {
      register.register('updateUser', jest.fn());

      try {
        await register.dispatch('updateUser', { id: '', name: 'J' });
        fail('Expected error to be thrown');
      } catch (error) {
        if (isActionValidationError(error)) {
          expect(error.action).toBe('updateUser');
        } else {
          fail('Expected ActionValidationError');
        }
      }
    });
  });

  describe('warn validation mode', () => {
    let register: ActionRegister<TestActions>;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      register = new ActionRegister<TestActions>({
        registry: {
          schema: userSchema,
          validationMode: 'warn',
        },
      });
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      register.destroy();
      consoleWarnSpy.mockRestore();
    });

    it('should log warning but continue execution for invalid payload', async () => {
      const handler = jest.fn();
      register.register('updateUser', handler);

      await register.dispatch('updateUser', { id: '', name: 'John' });

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should log warning but continue dispatchWithResult for invalid payload', async () => {
      const handler = jest.fn();
      register.register('updateUser', handler);

      const result = await register.dispatchWithResult('updateUser', {
        id: '',
        name: 'John',
      });

      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    it('should include action name in warning', async () => {
      register.register('updateUser', jest.fn());

      await register.dispatch('updateUser', { id: '', name: 'J' });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('updateUser'),
        expect.anything()
      );
    });
  });

  describe('silent validation mode', () => {
    let register: ActionRegister<TestActions>;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      register = new ActionRegister<TestActions>({
        registry: {
          schema: userSchema,
          validationMode: 'silent',
        },
      });
      consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    });

    afterEach(() => {
      register.destroy();
      consoleWarnSpy.mockRestore();
    });

    it('should not throw or warn for invalid payload', async () => {
      const handler = jest.fn();
      register.register('updateUser', handler);

      await register.dispatch('updateUser', { id: '', name: 'J' });

      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('validateOnDispatch option', () => {
    it('should skip validation when validateOnDispatch is false', async () => {
      const register = new ActionRegister<TestActions>({
        registry: {
          schema: userSchema,
          validateOnDispatch: false,
          validationMode: 'strict',
        },
      });

      const handler = jest.fn();
      register.register('updateUser', handler);

      // Invalid payload should not throw when validation is disabled
      await register.dispatch('updateUser', { id: '', name: '' });

      expect(handler).toHaveBeenCalled();
      register.destroy();
    });

    it('should skip dispatchWithResult validation when validateOnDispatch is false', async () => {
      const register = new ActionRegister<TestActions>({
        registry: {
          schema: userSchema,
          validateOnDispatch: false,
          validationMode: 'strict',
        },
      });

      const handler = jest.fn();
      register.register('updateUser', handler);

      const result = await register.dispatchWithResult('updateUser', {
        id: '',
        name: '',
      });

      expect(result.success).toBe(true);
      expect(handler).toHaveBeenCalled();
      register.destroy();
    });
  });

  describe('default validation mode', () => {
    it('should default to strict mode when schema is provided', async () => {
      const register = new ActionRegister<TestActions>({
        registry: {
          schema: userSchema,
          // validationMode not specified - should default to strict
        },
      });

      register.register('updateUser', jest.fn());

      await expect(
        register.dispatch('updateUser', { id: '', name: 'John' })
      ).rejects.toThrow(ActionValidationError);

      register.destroy();
    });
  });

  describe('actions without schema', () => {
    interface MixedActions extends ActionPayloadMap {
      withSchema: { value: string };
      withoutSchema: { anyValue: unknown };
    }

    it('should skip validation for actions not in schema', async () => {
      const partialSchema = createActionSchema({
        withSchema: defineAction(
          {
            name: 'withSchema',
            parameters: z.object({
              value: z.string().min(5),
            }),
          },
          z
        ),
      });

      const register = new ActionRegister<MixedActions>({
        registry: {
          schema: partialSchema,
          validationMode: 'strict',
        },
      });

      const handler = jest.fn();
      register.register('withoutSchema', handler);

      // Should not throw even though payload doesn't match any schema
      await register.dispatch('withoutSchema', { anyValue: 123 });

      expect(handler).toHaveBeenCalled();
      register.destroy();
    });
  });

  describe('no schema provided', () => {
    it('should skip validation when no schema is configured', async () => {
      const register = new ActionRegister<TestActions>();

      const handler = jest.fn();
      register.register('updateUser', handler);

      // Should work without validation
      await register.dispatch('updateUser', { id: '', name: '' });

      expect(handler).toHaveBeenCalled();
      register.destroy();
    });
  });
});
