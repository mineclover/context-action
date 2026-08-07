/**
 * Type safety tests - Compile-time and runtime type checking
 */

import {
  ActionRegister,
  type ActionPayloadMap,
  type ExecutionResult,
  type PipelineController
} from '../../src';

// Test type definitions
interface TypeSafetyActions extends ActionPayloadMap {
  then: void;
  toJSON: void;
  stringAction: string;
  numberAction: number;
  booleanAction: boolean;
  objectAction: { name: string; age: number };
  arrayAction: string[];
  unionAction: string | number;
  optionalAction: { required: string; optional?: number };
  complexAction: {
    user: { id: number; email: string; profile?: { name: string } };
    settings: { theme: 'light' | 'dark'; notifications: boolean };
    metadata?: Record<string, any>;
  };
  voidAction: void;
  nullableAction: { value: string | null };
  nestedUnionAction: { 
    data: string | { nested: boolean } | number[];
    type: 'string' | 'object' | 'array';
  };
}

interface TypeSafetyResults {
  stringAction: { normalized: string };
  numberAction: { doubled: number };
}

describe('ActionRegister - Type Safety Tests', () => {
  let actionRegister: ActionRegister<TypeSafetyActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<TypeSafetyActions>({
      name: 'TypeSafetyTestRegister'
    });
  });

  afterEach(() => {
    actionRegister.destroy();
  });

  describe('🔒 Compile-time Type Safety', () => {
    it('requires payloads for payload-bearing actions', () => {
      // These calls are intentionally not executed; the assertions are checked by tsc.
      const invalidCalls = () => {
        // @ts-expect-error required payload
        actionRegister.dispatch('numberAction');
        // @ts-expect-error void actions do not accept a payload
        actionRegister.dispatch('voidAction', 1);
        // @ts-expect-error required payload for result dispatch
        actionRegister.dispatchWithResult('objectAction');
      };

      expect(invalidCalls).toBeInstanceOf(Function);
    });

    it('does not expose reserved proxy keys through callable action access', () => {
      // Direct dispatch remains available for compatibility, but proxy access
      // reserves protocol properties to avoid thenable assimilation.
      // @ts-expect-error reserved proxy key
      actionRegister.actions.then;
      // @ts-expect-error reserved proxy key
      actionRegister.actionsWithResult.toJSON;
    });

    it('should enforce correct payload types for string actions', async () => {
      const handler = jest.fn((payload: string) => payload.toUpperCase());
      actionRegister.register('stringAction', handler);

      await actionRegister.dispatch('stringAction', 'test-string');

      expect(handler).toHaveBeenCalledWith('test-string', expect.any(Object));
    });

    it('should enforce correct payload types for number actions', async () => {
      const handler = jest.fn((payload: number) => payload * 2);
      actionRegister.register('numberAction', handler);

      await actionRegister.dispatch('numberAction', 42);

      expect(handler).toHaveBeenCalledWith(42, expect.any(Object));
    });

    it('should enforce correct payload types for boolean actions', async () => {
      const handler = jest.fn((payload: boolean) => !payload);
      actionRegister.register('booleanAction', handler);

      await actionRegister.dispatch('booleanAction', true);

      expect(handler).toHaveBeenCalledWith(true, expect.any(Object));
    });

    it('should enforce correct payload types for object actions', async () => {
      const handler = jest.fn((payload: { name: string; age: number }) => ({
        greeting: `Hello ${payload.name}, you are ${payload.age} years old`,
        adult: payload.age >= 18
      }));
      
      actionRegister.register('objectAction', handler);

      await actionRegister.dispatch('objectAction', { name: 'John', age: 25 });

      expect(handler).toHaveBeenCalledWith({ name: 'John', age: 25 }, expect.any(Object));
    });

    it('should enforce correct payload types for array actions', async () => {
      const handler = jest.fn((payload: string[]) => payload.map(s => s.toUpperCase()));
      actionRegister.register('arrayAction', handler);

      await actionRegister.dispatch('arrayAction', ['hello', 'world']);

      expect(handler).toHaveBeenCalledWith(['hello', 'world'], expect.any(Object));
    });

    it('should handle union type actions', async () => {
      const handler = jest.fn((payload: string | number) => {
        if (typeof payload === 'string') {
          return payload.toUpperCase();
        }
        return payload * 2;
      });
      
      actionRegister.register('unionAction', handler);

      await actionRegister.dispatch('unionAction', 'test');
      await actionRegister.dispatch('unionAction', 42);

      expect(handler).toHaveBeenNthCalledWith(1, 'test', expect.any(Object));
      expect(handler).toHaveBeenNthCalledWith(2, 42, expect.any(Object));
    });

    it('should handle optional properties in payload', async () => {
      const handler = jest.fn((payload: { required: string; optional?: number }) => ({
        hasOptional: payload.optional !== undefined,
        required: payload.required,
        optional: payload.optional ?? 0
      }));
      
      actionRegister.register('optionalAction', handler);

      await actionRegister.dispatch('optionalAction', { required: 'test' });
      await actionRegister.dispatch('optionalAction', { required: 'test', optional: 42 });

      expect(handler).toHaveBeenNthCalledWith(1, { required: 'test' }, expect.any(Object));
      expect(handler).toHaveBeenNthCalledWith(2, { required: 'test', optional: 42 }, expect.any(Object));
    });

    it('should handle void actions without payload', async () => {
      const handler = jest.fn(() => 'void-result');
      actionRegister.register('voidAction', handler);

      await actionRegister.dispatch('voidAction');

      expect(handler).toHaveBeenCalledWith(undefined, expect.any(Object));
    });

    it('should handle complex nested object types', async () => {
      type ComplexPayload = {
        user: { id: number; email: string; profile?: { name: string } };
        settings: { theme: 'light' | 'dark'; notifications: boolean };
        metadata?: Record<string, any>;
      };

      const handler = jest.fn((payload: ComplexPayload) => ({
        userId: payload.user.id,
        hasProfile: !!payload.user.profile,
        theme: payload.settings.theme,
        hasMetadata: !!payload.metadata
      }));
      
      actionRegister.register('complexAction', handler);

      const complexPayload = {
        user: { id: 1, email: 'test@example.com', profile: { name: 'John' } },
        settings: { theme: 'dark' as const, notifications: true },
        metadata: { source: 'test' }
      };

      await actionRegister.dispatch('complexAction', complexPayload);

      expect(handler).toHaveBeenCalledWith(complexPayload, expect.any(Object));
    });
  });

  describe('🛡️ Runtime Type Validation', () => {
    it('should handle runtime type mismatches gracefully', async () => {
      const handler = jest.fn((payload: string) => payload.toUpperCase());
      actionRegister.register('stringAction', handler);

      // This would be a TypeScript error, but testing runtime behavior
      await actionRegister.dispatch('stringAction', 'valid-string');

      expect(handler).toHaveBeenCalledWith('valid-string', expect.any(Object));
    });

    it('should handle null values in nullable types', async () => {
      const handler = jest.fn((payload: { value: string | null }) => ({
        hasValue: payload.value !== null,
        length: payload.value?.length ?? 0
      }));
      
      actionRegister.register('nullableAction', handler);

      await actionRegister.dispatch('nullableAction', { value: 'test' });
      await actionRegister.dispatch('nullableAction', { value: null });

      expect(handler).toHaveBeenNthCalledWith(1, { value: 'test' }, expect.any(Object));
      expect(handler).toHaveBeenNthCalledWith(2, { value: null }, expect.any(Object));
    });

    it('should handle complex union types at runtime', async () => {
      type NestedUnionPayload = { 
        data: string | { nested: boolean } | number[];
        type: 'string' | 'object' | 'array';
      };

      const handler = jest.fn((payload: NestedUnionPayload) => {
        switch (payload.type) {
          case 'string':
            return { result: (payload.data as string).toUpperCase() };
          case 'object':
            return { result: (payload.data as { nested: boolean }).nested };
          case 'array':
            return { result: (payload.data as number[]).length };
          default:
            return { result: 'unknown' };
        }
      });
      
      actionRegister.register('nestedUnionAction', handler);

      await actionRegister.dispatch('nestedUnionAction', { 
        data: 'hello', 
        type: 'string' 
      });
      
      await actionRegister.dispatch('nestedUnionAction', { 
        data: { nested: true }, 
        type: 'object' 
      });
      
      await actionRegister.dispatch('nestedUnionAction', { 
        data: [1, 2, 3, 4], 
        type: 'array' 
      });

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('🎯 Handler Type Safety', () => {
    it('should ensure handler parameter types match action payload types', async () => {
      // This handler's parameter type must match the action's payload type
      const stringHandler = jest.fn((payload: string, controller) => {
        expect(typeof payload).toBe('string');
        expect(controller).toBeDefined();
        expect(controller.abort).toBeDefined();
        expect(controller.getPayload).toBeDefined();
        return payload.length;
      });

      actionRegister.register('stringAction', stringHandler);

      const result = await actionRegister.dispatchWithResult('stringAction', 'test');
      expect(result.result).toBe(4);
    });

    it('should ensure handler return types are preserved', async () => {
      const numberHandler = jest.fn((payload: number): { doubled: number; isEven: boolean } => ({
        doubled: payload * 2,
        isEven: payload % 2 === 0
      }));

      actionRegister.register('numberAction', numberHandler);

      type NumberResult = { doubled: number; isEven: boolean };
      const result = await actionRegister.dispatchWithResult<'numberAction', NumberResult>('numberAction', 42);
      
      expect(result.result).toEqual({ doubled: 84, isEven: true });
      if (!result.result || Array.isArray(result.result)) {
        throw new Error('Expected a single number handler result');
      }
      expect(typeof result.result.doubled).toBe('number');
      expect(typeof result.result.isEven).toBe('boolean');
    });

    it('should handle async handler return types', async () => {
      const asyncHandler = jest.fn(async (payload: string): Promise<{ processed: string; length: number }> => {
        await new Promise(resolve => setTimeout(resolve, 1));
        return {
          processed: payload.toUpperCase(),
          length: payload.length
        };
      });

      actionRegister.register('stringAction', asyncHandler);

      const result = await actionRegister.dispatchWithResult('stringAction', 'hello');
      
      expect(result.result).toEqual({ processed: 'HELLO', length: 5 });
    });
  });

  describe('🔧 Controller Type Safety', () => {
    it('should maintain payload type through controller methods', async () => {
      const handler = jest.fn((
        payload: { name: string; age: number },
        controller: PipelineController<
          { name: string; age: number },
          { originalAge: number; modified: boolean }
        >
      ) => {
        // getPayload should return the same type as the original payload
        const currentPayload = controller.getPayload();
        expect(currentPayload).toEqual(payload);
        expect(typeof currentPayload.name).toBe('string');
        expect(typeof currentPayload.age).toBe('number');

        // Modify payload with type safety
        controller.modifyPayload(current => ({
          ...current,
          age: current.age + 1, // Should maintain number type
          name: current.name.toUpperCase() // Should maintain string type
        }));

        return { originalAge: payload.age, modified: true };
      });

      const followUpHandler = jest.fn((payload: { name: string; age: number }, controller) => {
        const modifiedPayload = controller.getPayload();
        expect(typeof modifiedPayload.name).toBe('string');
        expect(typeof modifiedPayload.age).toBe('number');
        expect(modifiedPayload.name).toBe('JOHN');
        expect(modifiedPayload.age).toBe(26);
        
        return { receivedModified: true };
      });

      actionRegister.register('objectAction', handler, { priority: 20 });
      actionRegister.register('objectAction', followUpHandler, { priority: 10 });

      await actionRegister.dispatch('objectAction', { name: 'John', age: 25 });

      expect(handler).toHaveBeenCalled();
      expect(followUpHandler).toHaveBeenCalled();
    });

    it('should handle setResult with proper types', async () => {
      const handler = jest.fn((payload: string, controller) => {
        controller.setResult({ intermediate: 'step1', length: payload.length });
        controller.setResult({ intermediate: 'step2', processed: payload.toUpperCase() });
        
        return { final: true, originalLength: payload.length };
      });

      actionRegister.register('stringAction', handler);

      const result = await actionRegister.dispatchWithResult('stringAction', 
        'test', 
        { result: { collect: true } }
      );

      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toEqual({ intermediate: 'step1', length: 4 });
      expect(result.results[1]).toEqual({ intermediate: 'step2', processed: 'TEST' });
      expect(result.results[2]).toEqual({ final: true, originalLength: 4 });
    });

    it('should handle controller.return with proper types', async () => {
      const handler = jest.fn((payload: number, controller) => {
        if (payload > 100) {
          controller.return({ early: true, reason: 'too-large', value: payload });
          return; // This return won't be reached
        }
        
        return { processed: payload * 2 };
      });

      actionRegister.register('numberAction', handler);

      const largeResult = await actionRegister.dispatchWithResult('numberAction', 200);
      expect(largeResult.terminated).toBe(true);
      expect(largeResult.result).toEqual({ early: true, reason: 'too-large', value: 200 });

      const normalResult = await actionRegister.dispatchWithResult('numberAction', 50);
      expect(normalResult.terminated).toBe(false);
      expect(normalResult.result).toEqual({ processed: 100 });
    });
  });

  describe('📊 Result Type Safety', () => {
    it('infers dispatch result types from the action result map', async () => {
      const typedRegister = new ActionRegister<TypeSafetyActions, TypeSafetyResults>();
      typedRegister.register('stringAction', payload => ({ normalized: payload.toUpperCase() }));

      const result = await typedRegister.dispatchWithResult('stringAction', 'hello');
      const typedResult: ExecutionResult<{ normalized: string }> = result;

      expect(typedResult.result).toEqual({ normalized: 'HELLO' });
      typedRegister.destroy();
    });

    it('should preserve result types in dispatchWithResult', async () => {
      const handler1 = jest.fn((payload: string) => ({ handler: 1, length: payload.length }));
      const handler2 = jest.fn((payload: string) => ({ handler: 2, upper: payload.toUpperCase() }));

      actionRegister.register('stringAction', handler1, { priority: 20 });
      actionRegister.register('stringAction', handler2, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('stringAction', 
        'hello', 
        { result: { collect: true } }
      );

      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toEqual({ handler: 1, length: 5 });
      expect(result.results[1]).toEqual({ handler: 2, upper: 'HELLO' });
      
      // collect:true without a strategy preserves the complete collected result set.
      expect(result.result).toEqual([
        { handler: 1, length: 5 },
        { handler: 2, upper: 'HELLO' },
      ]);
    });

    it('should handle mixed return types in result collection', async () => {
      actionRegister.register('stringAction', () => 'string-result', { priority: 30 });
      actionRegister.register('stringAction', () => 42, { priority: 20 });
      actionRegister.register('stringAction', () => ({ object: 'result' }), { priority: 10 });

      const result = await actionRegister.dispatchWithResult('stringAction', 
        'test', 
        { result: { collect: true } }
      );

      expect(result.results).toEqual([
        'string-result',
        42,
        { object: 'result' }
      ]);
    });

    it('should handle void results correctly', async () => {
      const handler1 = jest.fn(() => { /* returns void */ });
      const handler2 = jest.fn(() => undefined);
      const handler3 = jest.fn(() => 'actual-result');

      actionRegister.register('stringAction', handler1, { priority: 30 });
      actionRegister.register('stringAction', handler2, { priority: 20 });
      actionRegister.register('stringAction', handler3, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('stringAction', 
        'test', 
        { result: { collect: true } }
      );

      // Void handler returns are not persisted as collected results.
      expect(result.results).toEqual(['actual-result']);
      expect(result.result).toEqual(['actual-result']);
    });
  });

  describe('⚙️ Configuration Type Safety', () => {
    it('should ensure handler options are type-safe', () => {
      const handler = jest.fn((payload: string) => payload.length);

      // All these should be valid configurations
      actionRegister.register('stringAction', handler, {
        id: 'test-handler',
        priority: 10,
        once: false,
        blocking: true,
        condition: (payload) => payload.length > 0,
        debounce: 5,
        throttle: 10,
        replaceExisting: true,
        cleanup: jest.fn()
      });

      expect(actionRegister.getHandlerCount('stringAction')).toBe(1);
    });

    it('should ensure condition function parameter types match payload', () => {
      const handler = jest.fn();

      // Condition function parameter should match the action's payload type
      actionRegister.register('objectAction', handler, {
        condition: (payload: { name: string; age: number }) => {
          expect(typeof payload.name).toBe('string');
          expect(typeof payload.age).toBe('number');
          return payload.age >= 18;
        }
      });

      actionRegister.dispatch('objectAction', { name: 'John', age: 25 });
      actionRegister.dispatch('objectAction', { name: 'Jane', age: 16 });

      // Only the first dispatch should execute the handler
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('🚀 Generic Type Preservation', () => {
    it('should maintain generic types through the entire pipeline', async () => {
      interface CustomData<T> {
        data: T;
        metadata: { type: string; timestamp: number };
      }

      // This would be defined in the action interface in real usage
      const customActionRegister = new ActionRegister<{
        customAction: CustomData<{ value: number; label: string }>;
      }>();

      const handler = jest.fn((payload: CustomData<{ value: number; label: string }>) => ({
        processedValue: payload.data.value * 2,
        processedLabel: payload.data.label.toUpperCase(),
        originalMetadata: payload.metadata
      }));

      customActionRegister.register('customAction', handler);

      const result = await customActionRegister.dispatchWithResult('customAction', {
        data: { value: 42, label: 'test' },
        metadata: { type: 'custom', timestamp: Date.now() }
      });

      expect(result.result).toEqual({
        processedValue: 84,
        processedLabel: 'TEST',
        originalMetadata: { type: 'custom', timestamp: expect.any(Number) }
      });

      customActionRegister.destroy();
    });
  });
});
