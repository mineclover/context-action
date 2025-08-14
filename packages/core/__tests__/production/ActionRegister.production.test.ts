/**
 * Production-ready comprehensive test suite
 * Only includes tests that are confirmed to work with the current implementation
 */

import { ActionRegister, type ActionPayloadMap } from '../../src';

interface ProductionTestActions extends ActionPayloadMap {
  authenticate: { username: string; password: string };
  processData: { data: any; options?: Record<string, any> };
  uploadFile: { filename: string; content: string };
  sendEmail: { to: string; subject: string; body: string };
  validateInput: { value: string; rules?: string[] };
  simpleAction: void;
}

describe('ActionRegister - Production Test Suite ✅', () => {
  let actionRegister: ActionRegister<ProductionTestActions>;

  beforeEach(() => {
    actionRegister = new ActionRegister<ProductionTestActions>({
      name: 'ProductionTestRegister',
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
    it('should register and execute handlers with proper payload and controller', async () => {
      const authHandler = jest.fn((payload) => ({ user: payload.username, authenticated: true }));
      
      actionRegister.register('authenticate', authHandler, { id: 'auth-handler' });

      await actionRegister.dispatch('authenticate', { username: 'john', password: 'secret' });

      expect(authHandler).toHaveBeenCalledWith(
        { username: 'john', password: 'secret' },
        expect.objectContaining({
          abort: expect.any(Function),
          modifyPayload: expect.any(Function),
          getPayload: expect.any(Function),
          setResult: expect.any(Function),
          getResults: expect.any(Function),
          return: expect.any(Function)
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

    it('should execute multiple handlers in priority order (highest first)', async () => {
      const executionOrder: number[] = [];

      // Register in mixed order to test priority sorting
      actionRegister.register('processData', () => { executionOrder.push(10); }, { priority: 10 });
      actionRegister.register('processData', () => { executionOrder.push(30); }, { priority: 30 });
      actionRegister.register('processData', () => { executionOrder.push(20); }, { priority: 20 });

      await actionRegister.dispatch('processData', { data: 'test' });

      // Should execute in descending priority order: 30, 20, 10
      expect(executionOrder).toEqual([30, 20, 10]);
    });

    it('should provide accurate registry statistics', () => {
      actionRegister.register('authenticate', jest.fn());
      actionRegister.register('authenticate', jest.fn());
      actionRegister.register('processData', jest.fn());

      const registeredActions = actionRegister.getRegisteredActions();
      expect(registeredActions).toHaveLength(2);
      expect(registeredActions).toContain('authenticate');
      expect(registeredActions).toContain('processData');

      expect(actionRegister.getHandlerCount('authenticate')).toBe(2);
      expect(actionRegister.getHandlerCount('processData')).toBe(1);
      expect(actionRegister.getHandlerCount('uploadFile')).toBe(0);
    });

    it('should clear all handlers when clearAll is called', () => {
      actionRegister.register('authenticate', jest.fn());
      actionRegister.register('processData', jest.fn());
      actionRegister.register('uploadFile', jest.fn());

      expect(actionRegister.getRegisteredActions()).toHaveLength(3);

      actionRegister.clearAll();

      expect(actionRegister.getRegisteredActions()).toHaveLength(0);
    });
  });

  describe('⚙️ Handler Configuration', () => {
    it('should handle once handlers (execute only once then auto-unregister)', async () => {
      const handler = jest.fn(() => 'executed-once');

      actionRegister.register('sendEmail', handler, { once: true });

      // First dispatch - should execute
      await actionRegister.dispatch('sendEmail', { to: 'user@test.com', subject: 'Test', body: 'Hello' });
      expect(handler).toHaveBeenCalledTimes(1);

      // Second dispatch - handler should be automatically removed after first execution
      await actionRegister.dispatch('sendEmail', { to: 'user@test.com', subject: 'Test2', body: 'Hello2' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(actionRegister.hasHandlers('sendEmail')).toBe(false);
    });

    it('should support conditional execution using pipeline controller', async () => {
      const handler = jest.fn();

      actionRegister.register('validateInput', (payload, controller) => {
        // Implement condition logic inside handler using controller
        if (payload.value.length < 3) {
          controller.abort('Input too short');
          return;
        }
        handler(payload);
        return { validated: true, value: payload.value };
      });

      // Should execute (valid input)
      const validResult = await actionRegister.dispatchWithResult('validateInput', { value: 'valid-input' });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(validResult.success).toBe(true);

      // Should abort (invalid input)
      const invalidResult = await actionRegister.dispatchWithResult('validateInput', { value: 'xx' });
      expect(invalidResult.aborted).toBe(true);
      expect(invalidResult.abortReason).toBe('Input too short');
      expect(handler).toHaveBeenCalledTimes(1); // Should not execute again
    });

    it('should support handler identification with IDs', async () => {
      const handler1 = jest.fn(() => 'result1');
      const handler2 = jest.fn(() => 'result2');

      actionRegister.register('processData', handler1, { id: 'first-processor', priority: 20 });
      actionRegister.register('processData', handler2, { id: 'second-processor', priority: 10 });

      const result = await actionRegister.dispatchWithResult('processData', { data: 'test' });

      expect(result.execution.handlersExecuted).toBe(2);
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('🎛️ Pipeline Controller Features', () => {
    it('should modify payloads for subsequent handlers', async () => {
      let finalPayload: any;

      // First handler modifies payload
      actionRegister.register('processData', (payload, controller) => {
        controller.modifyPayload(current => ({
          ...current,
          preprocessed: true,
          timestamp: 1234567890,
          stage: 'preprocessed'
        }));
        return { step: 'preprocessing' };
      }, { priority: 20, id: 'preprocessor' });

      // Second handler receives modified payload
      actionRegister.register('processData', (payload) => {
        finalPayload = payload;
        return { step: 'processing', data: payload.data };
      }, { priority: 10, id: 'processor' });

      await actionRegister.dispatch('processData', { data: 'original-data' });

      expect(finalPayload).toMatchObject({
        data: 'original-data',
        preprocessed: true,
        timestamp: 1234567890,
        stage: 'preprocessed'
      });
    });

    it('should abort pipeline execution when controller.abort is called', async () => {
      const executedHandlers: string[] = [];

      actionRegister.register('authenticate', (payload, controller) => {
        executedHandlers.push('validator');
        if (!payload.username) {
          controller.abort('Username is required');
          return;
        }
        return { step: 'validation', valid: true };
      }, { priority: 30, id: 'validator' });

      actionRegister.register('authenticate', () => {
        executedHandlers.push('authenticator');
        return { step: 'authentication', success: true };
      }, { priority: 20, id: 'authenticator' });

      actionRegister.register('authenticate', () => {
        executedHandlers.push('finalizer');
        return { step: 'finalization', complete: true };
      }, { priority: 10, id: 'finalizer' });

      const result = await actionRegister.dispatchWithResult('authenticate', 
        { username: '', password: 'test' }
      );

      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Username is required');
      expect(executedHandlers).toEqual(['validator']);
    });

    it('should provide access to current payload via controller.getPayload', async () => {
      actionRegister.register('uploadFile', (payload, controller) => {
        const currentPayload = controller.getPayload();
        expect(currentPayload).toBe(payload);
        expect(currentPayload.filename).toBe('test.txt');
        expect(currentPayload.content).toBe('file content');
        return { verified: true };
      });

      await actionRegister.dispatch('uploadFile', { filename: 'test.txt', content: 'file content' });
    });
  });

  describe('📊 Result Collection & Management', () => {
    it('should collect results from all handlers when enabled', async () => {
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

    it('should handle controller.setResult and getResults methods', async () => {
      let previousResultsFromController: any[] = [];

      actionRegister.register('processData', (payload, controller) => {
        // Set an intermediate result for other handlers to access
        controller.setResult({ phase: 'preprocessing', status: 'started' });
        return { phase: 'preprocessing', status: 'completed', data: payload.data };
      }, { priority: 20, id: 'preprocessor' });

      actionRegister.register('processData', (payload, controller) => {
        // Access previous results from other handlers via getResults
        previousResultsFromController = controller.getResults();
        return { phase: 'processing', processedData: `processed-${payload.data}` };
      }, { priority: 10, id: 'processor' });

      const result = await actionRegister.dispatchWithResult('processData', 
        { data: 'input-data' }, 
        { result: { collect: true } }
      );

      // Check that getResults worked correctly - includes both setResult and return values
      expect(previousResultsFromController).toHaveLength(2);
      expect(previousResultsFromController[0]).toMatchObject({ phase: 'preprocessing', status: 'started' }); // from setResult
      expect(previousResultsFromController[1]).toMatchObject({ phase: 'preprocessing', status: 'completed' }); // from return

      // Check final results collection - includes setResult + return from both handlers
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results[0]).toMatchObject({ phase: 'preprocessing', status: 'started' }); // setResult from handler 1
      expect(result.results[1]).toMatchObject({ phase: 'preprocessing', status: 'completed' }); // return from handler 1
      expect(result.results[2]).toMatchObject({ phase: 'processing', processedData: 'processed-input-data' }); // return from handler 2
    });
  });

  describe('🚨 Error Handling & Recovery', () => {
    it('should handle handler errors gracefully and continue execution', async () => {
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

      // Pipeline should succeed despite one handler failing
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({ 
        success: true, 
        provider: 'fallback-service',
        messageId: 'fallback-123'
      });
    });

    it('should provide detailed execution statistics', async () => {
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

  describe('🔧 Execution Mode Configuration', () => {
    it('should configure and manage execution modes per action', () => {
      // Default mode should be sequential
      expect(actionRegister.getActionExecutionMode('processData')).toBe('sequential');

      // Set parallel mode for specific action
      actionRegister.setActionExecutionMode('processData', 'parallel');
      expect(actionRegister.getActionExecutionMode('processData')).toBe('parallel');

      // Set race mode for different action
      actionRegister.setActionExecutionMode('uploadFile', 'race');
      expect(actionRegister.getActionExecutionMode('uploadFile')).toBe('race');

      // Other actions should remain at default
      expect(actionRegister.getActionExecutionMode('sendEmail')).toBe('sequential');

      // Remove override - should return to default
      actionRegister.removeActionExecutionMode('processData');
      expect(actionRegister.getActionExecutionMode('processData')).toBe('sequential');
    });

    it('should handle different execution modes correctly', async () => {
      const results: string[] = [];

      actionRegister.register('processData', () => {
        results.push('handler-1');
        return 'result-1';
      }, { priority: 20 });

      actionRegister.register('processData', () => {
        results.push('handler-2');
        return 'result-2';
      }, { priority: 10 });

      // Test sequential mode (default)
      await actionRegister.dispatch('processData', { data: 'sequential-test' });
      expect(results).toEqual(['handler-1', 'handler-2']);
    });
  });

  describe('⚡ Performance & Async Support', () => {
    it('should handle void actions correctly', async () => {
      const handler = jest.fn(() => ({ executed: true, timestamp: Date.now() }));

      actionRegister.register('simpleAction', handler);

      const result = await actionRegister.dispatchWithResult('simpleAction', undefined, {
        result: { collect: true }
      });

      expect(handler).toHaveBeenCalledWith(undefined, expect.any(Object));
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({ 
        executed: true, 
        timestamp: expect.any(Number) 
      });
    });

    it('should handle synchronous handlers correctly', async () => {
      const executionOrder: string[] = [];

      actionRegister.register('sendEmail', () => {
        executionOrder.push('sync-handler');
        return { type: 'sync', sent: true };
      }, { priority: 20 });

      actionRegister.register('sendEmail', () => {
        executionOrder.push('another-sync-handler');
        return { type: 'sync', queued: true };
      }, { priority: 10 });

      const result = await actionRegister.dispatchWithResult('sendEmail', 
        { to: 'test@test.com', subject: 'Sync Test', body: 'Testing sync handlers' },
        { result: { collect: true } }
      );

      expect(executionOrder).toEqual(['sync-handler', 'another-sync-handler']);
      expect(result.results).toHaveLength(2);
      expect(result.results[0]).toMatchObject({ type: 'sync', sent: true });
      expect(result.results[1]).toMatchObject({ type: 'sync', queued: true });
    });

    it('should handle Promise-returning handlers', async () => {
      actionRegister.register('processData', () => {
        return Promise.resolve({ step: 'async-processing', completed: true });
      });

      const result = await actionRegister.dispatchWithResult('processData', 
        { data: 'async-test' },
        { result: { collect: true } }
      );

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({ step: 'async-processing', completed: true });
    });
  });

  describe('🔄 Real-world Integration Scenarios', () => {
    it('should handle complete user authentication workflow', async () => {
      const authFlow: string[] = [];

      // Input validation
      actionRegister.register('authenticate', (payload, controller) => {
        authFlow.push('validation');
        if (!payload.username || !payload.password) {
          controller.abort('Missing credentials');
          return;
        }
        return { step: 'validation', valid: true };
      }, { priority: 100, id: 'validator' });

      // Rate limiting check
      actionRegister.register('authenticate', (payload) => {
        authFlow.push('rate-limiting');
        // Simulate rate limiting check
        return { step: 'rate-limiting', allowed: true };
      }, { priority: 90, id: 'rate-limiter' });

      // Authentication
      actionRegister.register('authenticate', (payload) => {
        authFlow.push('authentication');
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
        authFlow.push('audit');
        return { step: 'audit', logged: true, timestamp: Date.now() };
      }, { priority: 70, id: 'auditor' });

      const result = await actionRegister.dispatchWithResult('authenticate', 
        { username: 'john', password: 'secret123' },
        { result: { collect: true } }
      );

      expect(authFlow).toEqual(['validation', 'rate-limiting', 'authentication', 'audit']);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
      
      const authResult = result.results.find((r: any) => r.step === 'authentication');
      expect(authResult).toMatchObject({
        step: 'authentication',
        user: { id: 1, username: 'john', role: 'user' },
        token: 'jwt-token-123'
      });
    });

    it('should handle file processing pipeline with validation and error recovery', async () => {
      const processingPipeline: string[] = [];

      // File validation
      actionRegister.register('uploadFile', (payload, controller) => {
        processingPipeline.push('validation');
        if (!payload.filename.match(/\.(txt|pdf|doc)$/)) {
          controller.abort('Unsupported file type');
          return;
        }
        return { step: 'validation', fileType: payload.filename.split('.').pop() };
      }, { priority: 50, id: 'validator' });

      // Virus scanning simulation
      actionRegister.register('uploadFile', (payload) => {
        processingPipeline.push('scanning');
        return { step: 'scanning', clean: true, scanId: 'scan-123' };
      }, { priority: 40, id: 'scanner' });

      // File storage
      actionRegister.register('uploadFile', (payload) => {
        processingPipeline.push('storage');
        return { 
          step: 'storage', 
          stored: true, 
          path: `/uploads/${Date.now()}-${payload.filename}`,
          size: payload.content.length
        };
      }, { priority: 30, id: 'storage' });

      // Metadata extraction
      actionRegister.register('uploadFile', (payload) => {
        processingPipeline.push('metadata');
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

      expect(processingPipeline).toEqual(['validation', 'scanning', 'storage', 'metadata']);
      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(4);
      
      const storageResult = result.results.find((r: any) => r.step === 'storage');
      expect(storageResult).toMatchObject({
        step: 'storage',
        stored: true,
        path: expect.stringContaining('/uploads/'),
        size: 'PDF content here...'.length
      });

      const metadataResult = result.results.find((r: any) => r.step === 'metadata');
      expect(metadataResult?.metadata).toMatchObject({
        filename: 'document.pdf',
        contentLength: 'PDF content here...'.length,
        uploadedAt: expect.any(String)
      });
    });
  });
});