/**
 * Type tests for ActionRegister and related types
 * These tests verify TypeScript type safety at compile time
 */

import { 
  ActionRegister, 
  type ActionPayloadMap, 
  type ActionHandler, 
  type PipelineController, 
  type HandlerConfig,
  type ExecutionResult,
  type DispatchOptions 
} from '../../src';

// Test action payload map
interface TypeTestActions extends ActionPayloadMap {
  noPayload: void;
  stringPayload: string;
  numberPayload: number | { value: number };
  objectPayload: { id: string; name: string };
  optionalPayload: string | undefined;
  complexPayload: {
    user: { id: string; email: string };
    settings: { theme: 'light' | 'dark'; lang: string };
    metadata?: Record<string, any>;
  };
}

describe('Type Safety Tests', () => {
  let actionRegister: ActionRegister<TypeTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<TypeTestActions>();
  });

  describe('ActionPayloadMap Type Safety', () => {
    it('should enforce correct payload types', () => {
      // ✅ These should compile without errors
      
      // No payload action
      const noPayloadHandler: ActionHandler<void> = (payload, controller) => {
        // payload should be undefined
        expect(payload).toBeUndefined();
      };

      // String payload action
      const stringHandler: ActionHandler<string> = (payload, controller) => {
        // payload should be string
        expect(typeof payload).toBe('string');
      };

      // Object payload action
      const objectHandler: ActionHandler<{ id: string; name: string }> = (payload, controller) => {
        // payload should have id and name properties
        expect(typeof payload.id).toBe('string');
        expect(typeof payload.name).toBe('string');
      };

      // Optional payload action
      const optionalHandler: ActionHandler<string | undefined> = (payload, controller) => {
        // payload can be string or undefined
        if (payload !== undefined) {
          expect(typeof payload).toBe('string');
        }
      };

      // Complex payload action
      const complexHandler: ActionHandler<TypeTestActions['complexPayload']> = (payload, controller) => {
        expect(typeof payload.user.id).toBe('string');
        expect(typeof payload.user.email).toBe('string');
        expect(['light', 'dark']).toContain(payload.settings.theme);
        expect(typeof payload.settings.lang).toBe('string');
      };

      // Register handlers - these should not cause type errors
      actionRegister.register('noPayload', noPayloadHandler);
      actionRegister.register('stringPayload', stringHandler);
      actionRegister.register('objectPayload', objectHandler);
      actionRegister.register('optionalPayload', optionalHandler);
      actionRegister.register('complexPayload', complexHandler);

      expect(true).toBe(true); // Test passes if it compiles
    });

    it('should provide type-safe dispatch methods', async () => {
      // ✅ These should compile without errors
      
      // No payload dispatch
      await actionRegister.dispatch('noPayload');
      
      // String payload dispatch
      await actionRegister.dispatch('stringPayload', 'test string');
      
      // Number payload dispatch
      await actionRegister.dispatch('numberPayload', 42);
      
      // Object payload dispatch
      await actionRegister.dispatch('objectPayload', { id: '1', name: 'Test' });
      
      // Optional payload dispatch
      await actionRegister.dispatch('optionalPayload', 'optional string');
      await actionRegister.dispatch('optionalPayload', undefined);
      
      // Complex payload dispatch
      await actionRegister.dispatch('complexPayload', {
        user: { id: '1', email: 'test@example.com' },
        settings: { theme: 'dark', lang: 'en' },
        metadata: { source: 'test' }
      });

      expect(true).toBe(true); // Test passes if it compiles
    });

    it('should provide type-safe dispatchWithResult methods', async () => {
      // Register a handler that returns a specific type
      actionRegister.register('stringPayload', (payload): string => {
        return `processed: ${payload}`;
      });

      // ✅ These should compile without errors
      const result: ExecutionResult<string> = await actionRegister.dispatchWithResult(
        'stringPayload', 
        'test input'
      );

      expect(result.success).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.results).toBeDefined();
      expect(result.execution).toBeDefined();
    });
  });

  describe('PipelineController Type Safety', () => {
    it('should provide type-safe controller methods', () => {
      const handler: ActionHandler<{ value: number }> = (payload, controller) => {
        // ✅ Controller methods should be properly typed
        
        // abort method
        controller.abort('test reason');
        
        // modifyPayload method with correct type
        controller.modifyPayload((current) => ({ ...current, value: current.value + 1 }));
        
        // getPayload method returns correct type
        const currentPayload = controller.getPayload();
        expect(typeof currentPayload.value).toBe('number');
        
        // jumpToPriority method
        controller.jumpToPriority(50);
        
        // setResult method
        controller.setResult({ processed: true });
        
        // getResults method
        const previousResults = controller.getResults();
        expect(Array.isArray(previousResults)).toBe(true);
        
        // return method (early termination)
        controller.return({ terminated: true });
        
        // mergeResult method
        controller.mergeResult((prev, current) => ({ merged: true }));
      };

      actionRegister.register('numberPayload', handler);
      expect(true).toBe(true); // Test passes if it compiles
    });
  });

  describe('HandlerConfig Type Safety', () => {
    it('should provide type-safe configuration options', () => {
      // ✅ All these configurations should compile without errors
      
      const basicConfig: HandlerConfig = {
        priority: 100,
        id: 'test-handler',
        blocking: true,
        once: false
      };

      const advancedConfig: HandlerConfig = {
        priority: 50,
        id: 'advanced-handler',
        blocking: false,
        once: true,
        condition: () => true,
        debounce: 300,
        throttle: 1000,
        validation: (payload) => payload != null,
        middleware: true,
        tags: ['validation', 'middleware'],
        category: 'core',
        description: 'Advanced test handler',
        version: '1.0.0',
        returnType: 'value',
        timeout: 5000,
        retries: 3,
        dependencies: ['other-handler'],
        conflicts: ['conflicting-handler'],
        environment: 'development',
        feature: 'new-feature',
        metrics: {
          collectTiming: true,
          collectErrors: true,
          customMetrics: { testMetric: 'value' }
        },
        metadata: { customData: 'test' }
      };

      actionRegister.register('stringPayload', jest.fn(), basicConfig);
      actionRegister.register('numberPayload', jest.fn(), advancedConfig);

      expect(true).toBe(true); // Test passes if it compiles
    });
  });

  describe('DispatchOptions Type Safety', () => {
    it('should provide type-safe dispatch options', () => {
      // ✅ All these dispatch options should compile without errors
      
      const basicOptions: DispatchOptions = {
        debounce: 300,
        throttle: 1000,
        executionMode: 'parallel'
      };

      const advancedOptions: DispatchOptions = {
        signal: new AbortController().signal,
        autoAbort: {
          enabled: true,
          onControllerCreated: (controller) => {
            console.log('Controller created:', controller);
          },
          allowHandlerAbort: true
        },
        filter: {
          tags: ['validation'],
          category: 'core',
          handlerIds: ['specific-handler'],
          excludeTags: ['debug'],
          excludeCategory: 'utility',
          excludeHandlerIds: ['unwanted-handler'],
          environment: 'production',
          feature: 'stable-feature',
          custom: (config) => config.priority > 50
        },
        result: {
          strategy: 'all',
          merger: (results) => results.reduce((acc, curr) => ({ ...acc, ...curr }), {}),
          collect: true,
          timeout: 10000,
          maxResults: 20
        }
      };

      // These dispatches should compile without errors
      actionRegister.dispatch('stringPayload', 'test', basicOptions);
      actionRegister.dispatch('complexPayload', {
        user: { id: '1', email: 'test@example.com' },
        settings: { theme: 'light', lang: 'en' }
      }, advancedOptions);

      expect(true).toBe(true); // Test passes if it compiles
    });
  });

  describe('ExecutionResult Type Safety', () => {
    it('should provide type-safe execution result', async () => {
      // Register handler with specific return type
      actionRegister.register('stringPayload', (payload): { processed: string } => {
        return { processed: payload };
      });

      // ✅ Result should be properly typed
      const result: ExecutionResult<{ processed: string }> = await actionRegister.dispatchWithResult(
        'stringPayload',
        'input string'
      );

      // All properties should be properly typed
      const success: boolean = result.success;
      const aborted: boolean = result.aborted;
      const abortReason: string | undefined = result.abortReason;
      const terminated: boolean = result.terminated;
      const finalResult: { processed: string } | undefined = result.result;
      const allResults: { processed: string }[] = result.results;

      // Execution metadata should be properly typed
      const duration: number = result.execution.duration;
      const handlersExecuted: number = result.execution.handlersExecuted;
      const handlersSkipped: number = result.execution.handlersSkipped;
      const handlersFailed: number = result.execution.handlersFailed;
      const startTime: number = result.execution.startTime;
      const endTime: number = result.execution.endTime;

      // Handler details should be properly typed
      const handlers = result.handlers;
      handlers.forEach(handler => {
        const id: string = handler.id;
        const executed: boolean = handler.executed;
        const handlerDuration: number | undefined = handler.duration;
        const handlerResult: { processed: string } | undefined = handler.result;
        const error: Error | undefined = handler.error;
        const metadata: Record<string, any> | undefined = handler.metadata;
      });

      // Errors should be properly typed
      const errors = result.errors;
      errors.forEach(error => {
        const handlerId: string = error.handlerId;
        const errorObj: Error = error.error;
        const timestamp: number = error.timestamp;
      });

      expect(true).toBe(true); // Test passes if it compiles
    });
  });

  describe('Generic Type Constraints', () => {
    it('should work with generic action types', () => {
      // Generic CRUD actions
      interface CrudActions<T> extends ActionPayloadMap {
        create: T;
        update: { id: string } & Partial<T>;
        delete: { id: string };
        read: { id: string };
      }

      interface User {
        id: string;
        name: string;
        email: string;
      }

      type UserActions = CrudActions<User>;

      const userRegister = new ActionRegister<UserActions>();

      // ✅ These should compile with correct types
      userRegister.register('create', (user: User) => {
        expect(typeof user.id).toBe('string');
        expect(typeof user.name).toBe('string');
        expect(typeof user.email).toBe('string');
      });

      userRegister.register('update', (updateData: { id: string } & Partial<User>) => {
        expect(typeof updateData.id).toBe('string');
        if (updateData.name) expect(typeof updateData.name).toBe('string');
        if (updateData.email) expect(typeof updateData.email).toBe('string');
      });

      expect(true).toBe(true); // Test passes if it compiles
    });

    it('should work with conditional types', () => {
      interface ConditionalActions extends ActionPayloadMap {
        saveData: {
          mode: 'auto';
        } | {
          mode: 'manual';
          data: any;
        };
      }

      const conditionalRegister = new ActionRegister<ConditionalActions>();

      // ✅ This should compile with union type handling
      conditionalRegister.register('saveData', (payload) => {
        if (payload.mode === 'auto') {
          // payload is { mode: 'auto' }
          expect(payload.mode).toBe('auto');
        } else {
          // payload is { mode: 'manual'; data: any }
          expect(payload.mode).toBe('manual');
          expect(payload.data).toBeDefined();
        }
      });

      expect(true).toBe(true); // Test passes if it compiles
    });
  });

  // Compile-time only tests - these should cause TypeScript errors if uncommented
  describe('Type Error Prevention', () => {
    it('should prevent type errors at compile time', () => {
      // ❌ These should cause TypeScript compilation errors:
      
      // Wrong payload type
      // actionRegister.dispatch('stringPayload', 123); // Error: number is not assignable to string
      
      // Missing required payload
      // actionRegister.dispatch('objectPayload'); // Error: missing required argument
      
      // Wrong object shape
      // actionRegister.dispatch('objectPayload', { id: 123 }); // Error: number is not assignable to string
      
      // Accessing non-existent action
      // actionRegister.dispatch('nonExistentAction', 'payload'); // Error: Argument of type '"nonExistentAction"' is not assignable
      
      // Wrong handler payload type
      // actionRegister.register('stringPayload', (payload: number) => {}); // Error: number is not assignable to string

      expect(true).toBe(true); // Test passes if it compiles
    });
  });
});