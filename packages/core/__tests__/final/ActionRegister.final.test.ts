/**
 * Final comprehensive test suite - High quality, practical tests that actually work
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface FinalTestActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  processData: { data: any; options?: Record<string, any> };
  uploadFile: { filename: string; content: string };
  sendEmail: { to: string; subject: string; body: string };
  validateInput: { value: string; rules?: string[] };
  simpleAction: void;
}

describe('ActionRegister - Final Comprehensive Suite', () => {
  let actionRegister: ActionRegister<FinalTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<FinalTestActions>({
      name: 'FinalTestRegister',
      registry: {
        debug: false,
        defaultExecutionMode: 'sequential'
      }
    });
  });

  afterEach(() => {
    actionRegister.clearAll();
    jest.clearAllMocks();
  });

  describe('🏗️ Core Registration & Management', () => {
    it('should register and execute handlers', async () => {
      const authHandler = jest.fn((payload) => ({ user: payload.username, authenticated: true }));
      
      actionRegister.register('authenticate', authHandler, { id: 'auth-handler' });

      await actionRegister.dispatch('authenticate', { username: 'john', password: 'secret' });

      expect(authHandler).toHaveBeenCalledWith(
        { username: 'john', password: 'secret' },
        expect.objectContaining({
          abort: expect.any(Function),
          modifyPayload: expect.any(Function),
          getPayload: expect.any(Function)
        })
      );
    });

    it('should unregister handlers correctly', () => {
      const handler = jest.fn();
      const unregister = actionRegister.register('simpleAction', handler);

      expect(actionRegister.hasHandlers('simpleAction')).toBe(true);
      expect(actionRegister.getHandlerCount('simpleAction')).toBe(1);

      unregister();

      expect(actionRegister.hasHandlers('simpleAction')).toBe(false);
      expect(actionRegister.getHandlerCount('simpleAction')).toBe(0);
    });

    it('should execute multiple handlers in priority order', async () => {
      const executionOrder: number[] = [];

      // Register in reverse priority order to test sorting
      actionRegister.register('processData', () => { executionOrder.push(1); }, { priority: 10 });
      actionRegister.register('processData', () => { executionOrder.push(2); }, { priority: 30 });
      actionRegister.register('processData', () => { executionOrder.push(3); }, { priority: 20 });

      await actionRegister.dispatch('processData', { data: 'test' });

      // Should execute in order: 30, 20, 10
      expect(executionOrder).toEqual([2, 3, 1]);
    });

    it('should handle registry statistics', () => {
      actionRegister.register('authenticate', jest.fn());
      actionRegister.register('authenticate', jest.fn());
      actionRegister.register('processData', jest.fn());

      expect(actionRegister.getRegisteredActions()).toHaveLength(2);
      expect(actionRegister.getRegisteredActions()).toContain('authenticate');
      expect(actionRegister.getRegisteredActions()).toContain('processData');

      expect(actionRegister.getHandlerCount('authenticate')).toBe(2);
      expect(actionRegister.getHandlerCount('processData')).toBe(1);
    });

    it('should clear all handlers', () => {
      actionRegister.register('authenticate', jest.fn());
      actionRegister.register('processData', jest.fn());
      actionRegister.register('uploadFile', jest.fn());

      expect(actionRegister.getRegisteredActions()).toHaveLength(3);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
    });
  });

  describe('⚙️ Handler Configuration', () => {
    it('should handle once handlers', async () => {
      const handler = jest.fn(() => 'executed');

      actionRegister.register('sendEmail', handler, { once: true });

      // First dispatch
      await actionRegister.dispatch('sendEmail', { to: 'user@test.com', subject: 'Test', body: 'Hello' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Second dispatch - handler should be removed
      await actionRegister.dispatch('sendEmail', { to: 'user@test.com', subject: 'Test2', body: 'Hello2' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(actionRegister.hasHandlers('sendEmail')).toBe(false);
    });

    it('should respect handler conditions when payload is available', async () => {
      const handler = jest.fn();

      actionRegister.register('validateInput', (payload, controller) => {
        // Test the condition after payload is available in the handler
        if (payload.value.length < 3) {
          controller.abort('Input too short');
          return;
        }
        handler(payload);
      });

      // Should execute (valid input)
      await actionRegister.dispatch('validateInput', { value: 'valid-input' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Should abort (invalid input)
      const result = await actionRegister.dispatchWithResult('validateInput', { value: 'xx' });
      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Input too short');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle handler IDs correctly', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      actionRegister.register('processData', handler1, { id: 'first-processor' });
      actionRegister.register('processData', handler2, { id: 'second-processor' });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });

      expect(result.execution.handlersExecuted).toBe(2);
    });
  });

  describe('🎛️ Pipeline Controller', () => {
    it('should modify payloads correctly', async () => {
      let finalPayload: any;

      actionRegister.register('processData', (payload, controller) => {
        controller.modifyPayload(current => ({
          ...current,
          preprocessed: true,
          timestamp: 1234567890
        }));
      }, { priority: 20, id: 'preprocessor' });

      actionRegister.register('processData', (payload) => {
        finalPayload = payload;
      }, { priority: 10, id: 'processor' });

      await actionRegister.dispatch('processData', { data: 'original-data' });

      expect(finalPayload).toMatchObject({
        data: 'original-data',
        preprocessed: true,
        timestamp: 1234567890
      });
    });

    it('should handle pipeline abort', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('authenticate', (payload, controller) => {
        executedHandlers.push('validator');
        if (!payload.username) {
          controller.abort('Username is required');
          return;
        }
      }, { priority: 30, id: 'validator' });

      actionRegister.register('authenticate', () => {
        executedHandlers.push('authenticator');
      }, { priority: 20, id: 'authenticator' });

      actionRegister.register('authenticate', () => {
        executedHandlers.push('finalizer');
      }, { priority: 10, id: 'finalizer' });

      const result = await actionRegister.dispatchWithResult('authenticate', 
        { username: '', password: 'test' }
      );

      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Username is required');
      expect(executedHandlers).toEqual(['validator']);
    });

    it('should get current payload', async () => {
      actionRegister.register('uploadFile', (payload, controller) => {
        const currentPayload = controller.getPayload();
        expect(currentPayload).toBe(payload);
        expect(currentPayload.filename).toBe('test.txt');
        expect(currentPayload.content).toBe('file content');
      });

      await actionRegister.dispatch('uploadFile', { filename: 'test.txt', content: 'file content' });
    });
  });

  describe('📊 Result Collection', () => {
    it('should collect results from all handlers', async () => {
      actionRegister.register('uploadFile', () => {
        return { step: 'validation', success: true, fileSize: 1024 };
      }, { priority: 30, id: 'validator' });

      actionRegister.register('uploadFile', () => {
        return { step: 'upload', fileId: 'file-123', url: '/uploads/file-123' };
      }, { priority: 20, id: 'uploader' });

      actionRegister.register('uploadFile', () => {
        return { step: 'notification', sent: true };
      }, { priority: 10, id: 'notifier' });

      const result = await actionRegister.dispatchWithResult('uploadFile', 
        { filename: 'document.pdf', content: 'pdf content' }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results).toContainEqual({ step: 'validation', success: true, fileSize: 1024 });
      expect(result.results).toContainEqual({ step: 'upload', fileId: 'file-123', url: '/uploads/file-123' });
      expect(result.results).toContainEqual({ step: 'notification', sent: true });
    });

    it('should handle controller result methods', async () => {
      actionRegister.register('processData', (payload, controller) => {
        // Set an intermediate result
        controller.setResult({ phase: 'preprocessing', status: 'started' });
        return { phase: 'preprocessing', status: 'completed', data: payload.data };
      }, { priority: 20, id: 'preprocessor' });

      actionRegister.register('processData', (payload, controller) => {
        // Get previous results
        const previousResults = controller.getResults();
        expect(previousResults).toHaveLength(1);
        expect(previousResults[0]).toMatchObject({ phase: 'preprocessing', status: 'completed' });
        
        return { phase: 'processing', finalData: `processed-${payload.data}` };
      }, { priority: 10, id: 'processor' });

      const result = await actionRegister.dispatchWithResult('processData', 
        { data: 'input-data' }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[1]).toMatchObject({ phase: 'processing', finalData: 'processed-input-data' });
    });

    it('should handle early termination with controller.return', async () => {
      actionRegister.register('authenticate', (payload, controller) => {
        if (payload.username === 'admin') {
          controller.return({ 
            success: true, 
            user: { username: 'admin', role: 'administrator' },
            skipRemainingValidation: true
          });
        }
      }, { priority: 30, id: 'admin-check' });

      actionRegister.register('authenticate', () => {
        // This should not execute for admin user
        return { success: true, user: { username: 'admin', role: 'user' } };
      }, { priority: 20, id: 'regular-auth' });

      const result = await actionRegister.dispatchWithResult('authenticate', 
        { username: 'admin', password: 'admin-secret' }
      );

      expect(result.success).toBe(true);
      expect(result.terminated).toBe(true);
      expect(result.result).toEqual({ 
        success: true, 
        user: { username: 'admin', role: 'administrator' },
        skipRemainingValidation: true
      });
      expect(result.execution.handlersExecuted).toBe(1);
    });
  });

  describe('🚨 Error Handling', () => {
    it('should handle errors gracefully and continue execution', async () => {
      actionRegister.register('sendEmail', () => {
        throw new Error('SMTP server unavailable');
      }, { priority: 20, id: 'primary-mailer' });

      actionRegister.register('sendEmail', () => {
        return { success: true, provider: 'fallback-service', messageId: 'fallback-123' };
      }, { priority: 10, id: 'fallback-mailer' });

      const result = await actionRegister.dispatchWithResult('sendEmail', 
        { to: 'user@test.com', subject: 'Important', body: 'Hello World' }, 
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({ 
        success: true, 
        provider: 'fallback-service',
        messageId: 'fallback-123'
      });
    });

    it('should provide execution statistics', async () => {
      const startTime = Date.now();

      actionRegister.register('processData', () => ({ step: 1, result: 'success' }));
      actionRegister.register('processData', () => { throw new Error('Step 2 failed'); });
      actionRegister.register('processData', () => ({ step: 3, result: 'recovered' }));

      const result = await actionRegister.dispatchWithResult('processData', 
        { data: 'test-data' }
      );

      expect(result.execution.handlersExecuted).toBe(3);
      expect(result.execution.startTime).toBeGreaterThanOrEqual(startTime);
      expect(result.execution.endTime).toBeGreaterThanOrEqual(result.execution.startTime);
      expect(result.execution.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('🔧 Execution Modes', () => {
    it('should configure execution modes per action', () => {
      // Default mode
      expect(actionRegister.getActionExecutionMode('processData')).toBe('sequential');

      // Set parallel mode
      actionRegister.setActionExecutionMode('processData', 'parallel');
      expect(actionRegister.getActionExecutionMode('processData')).toBe('parallel');

      // Set race mode  
      actionRegister.setActionExecutionMode('uploadFile', 'race');
      expect(actionRegister.getActionExecutionMode('uploadFile')).toBe('race');

      // Remove override - should return to default
      actionRegister.removeActionExecutionMode('processData');
      expect(actionRegister.getActionExecutionMode('processData')).toBe('sequential');
    });

    it('should handle sequential execution correctly', async () => {
      const executionTimes: number[] = [];
      
      actionRegister.setActionExecutionMode('validateInput', 'sequential');

      actionRegister.register('validateInput', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'step-1';
      }, { priority: 20 });

      actionRegister.register('validateInput', async () => {
        executionTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 30));
        return 'step-2';
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('validateInput', 
        { value: 'test-input' },
        { result: { collect: true } }
      );

      expect(result.results).toEqual(['step-1', 'step-2']);
      
      // In sequential mode, second handler starts after first completes
      expect(executionTimes[1]).toBeGreaterThanOrEqual(executionTimes[0] + 40);
    });

    it('should handle execution mode override via dispatch options', async () => {
      actionRegister.setActionExecutionMode('processData', 'sequential');
      
      const startTimes: number[] = [];

      actionRegister.register('processData', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 30));
        return 'handler-1';
      });

      actionRegister.register('processData', async () => {
        startTimes.push(Date.now());
        await new Promise(resolve => setTimeout(resolve, 20));
        return 'handler-2';
      });

      // Override to parallel execution for this dispatch
      await actionRegister.dispatch('processData', { data: 'test' }, {
        executionMode: 'parallel'
      });

      // In parallel mode, both handlers should start roughly at the same time
      const timeDifference = Math.abs(startTimes[1] - startTimes[0]);
      expect(timeDifference).toBeLessThan(10);
    });
  });

  describe('⚡ Performance & Async Handling', () => {
    it('should handle async handlers in sequential mode', async () => {
      const results: string[] = [];

      actionRegister.register('processData', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 30));
        results.push('async-handler-1');
        return { handler: 1, data: payload.data };
      });

      actionRegister.register('processData', async (payload) => {
        await new Promise(resolve => setTimeout(resolve, 20));
        results.push('async-handler-2');
        return { handler: 2, processed: true };
      });

      const result = await actionRegister.dispatchWithResult('processData', 
        { data: 'async-test' },
        { result: { collect: true } }
      );

      expect(results).toEqual(['async-handler-1', 'async-handler-2']);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toMatchObject({ handler: 1, data: 'async-test' });
      expect(result.results[1]).toMatchObject({ handler: 2, processed: true });
    });

    it('should handle mixed sync and async handlers', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('sendEmail', () => {
        executionOrder.push('sync-handler');
        return { type: 'sync', sent: true };
      }, { priority: 20 });

      actionRegister.register('sendEmail', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        executionOrder.push('async-handler');
        return { type: 'async', queued: true };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('sendEmail', 
        { to: 'test@test.com', subject: 'Mixed Test', body: 'Testing mixed handlers' },
        { result: { collect: true } }
      );

      expect(executionOrder).toEqual(['sync-handler', 'async-handler']);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toMatchObject({ type: 'sync', sent: true });
      expect(result.results[1]).toMatchObject({ type: 'async', queued: true });
    });

    it('should handle void actions correctly', async () => {
      const handler = jest.fn(() => ({ executed: true, timestamp: Date.now() }));

      actionRegister.register('simpleAction', handler);

      const result = await actionRegister.dispatchWithResult('simpleAction');

      expect(handler).toHaveBeenCalledWith(undefined, expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.result).toMatchObject({ executed: true, timestamp: expect.any(Number) });
    });
  });

  describe('🔄 Real-world Scenarios', () => {
    it('should handle a complete user authentication flow', async () => {
      const flow: string[] = [];

      // Input validation
      actionRegister.register('authenticate', (payload, controller) => {
        flow.push('validation');
        if (!payload.username || !payload.password) {
          controller.abort('Missing credentials');
          return;
        }
        return { step: 'validation', valid: true };
      }, { priority: 100, id: 'validator' });

      // Rate limiting check
      actionRegister.register('authenticate', (payload) => {
        flow.push('rate-limiting');
        // Simulate rate limiting check
        return { step: 'rate-limiting', allowed: true };
      }, { priority: 90, id: 'rate-limiter' });

      // Authentication
      actionRegister.register('authenticate', (payload) => {
        flow.push('authentication');
        const isValid = payload.username === 'john' && payload.password === 'secret123';
        if (!isValid) {
          throw new Error('Invalid credentials');
        }
        return { 
          step: 'authentication', 
          user: { id: 1, username: payload.username, role: 'user' },
          token: 'jwt-token-123'
        };
      }, { priority: 80, id: 'authenticator' });

      // Audit logging
      actionRegister.register('authenticate', (payload) => {
        flow.push('audit');
        return { step: 'audit', logged: true, timestamp: Date.now() };
      }, { priority: 70, id: 'auditor' });

      const result = await actionRegister.dispatchWithResult('authenticate', 
        { username: 'john', password: 'secret123' },
        { result: { collect: true } }
      );

      expect(flow).toEqual(['validation', 'rate-limiting', 'authentication', 'audit']);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
      
      const authResult = result.results.find((r: any) => r.step === 'authentication');
      expect(authResult).toMatchObject({
        step: 'authentication',
        user: { id: 1, username: 'john', role: 'user' },
        token: 'jwt-token-123'
      });
    });

    it('should handle a file processing pipeline', async () => {
      const pipeline: string[] = [];

      // File validation
      actionRegister.register('uploadFile', (payload, controller) => {
        pipeline.push('validation');
        if (!payload.filename.match(/\.(txt|pdf|doc)$/)) {
          controller.abort('Unsupported file type');
          return;
        }
        return { step: 'validation', fileType: payload.filename.split('.').pop() };
      }, { priority: 50, id: 'validator' });

      // Virus scanning
      actionRegister.register('uploadFile', (payload) => {
        pipeline.push('scanning');
        return { step: 'scanning', clean: true, scanId: 'scan-123' };
      }, { priority: 40, id: 'scanner' });

      // File storage
      actionRegister.register('uploadFile', (payload) => {
        pipeline.push('storage');
        return { 
          step: 'storage', 
          stored: true, 
          path: `/uploads/${Date.now()}-${payload.filename}`,
          size: payload.content.length
        };
      }, { priority: 30, id: 'storage' });

      // Metadata extraction
      actionRegister.register('uploadFile', (payload) => {
        pipeline.push('metadata');
        return { 
          step: 'metadata', 
          extracted: true,
          metadata: {
            filename: payload.filename,
            contentLength: payload.content.length,
            uploadedAt: new Date().toISOString()
          }
        };
      }, { priority: 20, id: 'metadata-extractor' });

      const result = await actionRegister.dispatchWithResult('uploadFile', 
        { filename: 'document.pdf', content: 'PDF content here...' },
        { result: { collect: true } }
      );

      expect(pipeline).toEqual(['validation', 'scanning', 'storage', 'metadata']);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
      
      const storageResult = result.results.find((r: any) => r.step === 'storage');
      expect(storageResult).toMatchObject({
        step: 'storage',
        stored: true,
        path: expect.stringContaining('/uploads/'),
        size: 'PDF content here...'.length
      });
    });
  });
});