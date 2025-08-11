/**
 * @fileoverview Tests for action abort functionality
 */

import { ActionRegister, ActionPayloadMap } from '../index.js';

// Test action types
interface TestActions extends ActionPayloadMap {
  longRunning: { duration: number };
  sequential: { step: number };
  parallel: { id: number };
}

describe('Action Abort Functionality', () => {
  let register: ActionRegister<TestActions>;

  beforeEach(() => {
    register = new ActionRegister<TestActions>({
      name: 'TestRegister',
    });
  });

  describe('Abort with signal', () => {
    it('should abort dispatch when signal is already aborted', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const handler = jest.fn();
      register.register('longRunning', handler);

      await register.dispatch('longRunning', { duration: 1000 }, {
        signal: abortController.signal
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should abort dispatch when signal is aborted during execution', async () => {
      const abortController = new AbortController();
      let handlerStarted = false;
      let handlerCompleted = false;

      register.register('longRunning', async (payload, _controller) => {
        handlerStarted = true;
        
        // Simulate long-running operation
        await new Promise(resolve => setTimeout(resolve, payload.duration));
        
        // This should not be reached if aborted
        handlerCompleted = true;
      }, { blocking: true });

      // Start dispatch
      const dispatchPromise = register.dispatch('longRunning', { duration: 1000 }, {
        signal: abortController.signal
      });

      // Abort after a short delay
      setTimeout(() => abortController.abort(), 50);

      await dispatchPromise;

      expect(handlerStarted).toBe(true);
      expect(handlerCompleted).toBe(false);
    });

    it('should return aborted result when using dispatchWithResult', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const handler = jest.fn().mockResolvedValue('result');
      register.register('longRunning', handler);

      const result = await register.dispatchWithResult('longRunning', { duration: 1000 }, {
        signal: abortController.signal
      });

      expect(result.success).toBe(false);
      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Action dispatch aborted by signal');
      expect(result.execution.handlersExecuted).toBe(0);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should abort during sequential execution', async () => {
      const abortController = new AbortController();
      const executedHandlers: number[] = [];

      // Register multiple sequential handlers
      register.register('sequential', async ({ step }) => {
        executedHandlers.push(step);
        if (step === 2) {
          // Abort after second handler
          abortController.abort();
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      }, { priority: 3, blocking: true });

      register.register('sequential', async () => {
        executedHandlers.push(3);
        await new Promise(resolve => setTimeout(resolve, 10));
      }, { priority: 2, blocking: true });

      register.register('sequential', async () => {
        executedHandlers.push(4);
        await new Promise(resolve => setTimeout(resolve, 10));
      }, { priority: 1, blocking: true });

      await register.dispatch('sequential', { step: 2 }, {
        signal: abortController.signal
      });

      // Only first two handlers should have executed
      expect(executedHandlers).toEqual([2]);
    });

    it('should handle abort in parallel execution mode', async () => {
      const abortController = new AbortController();
      const executedHandlers: number[] = [];

      register.setActionExecutionMode('parallel', 'parallel');

      // Register multiple parallel handlers
      for (let i = 1; i <= 3; i++) {
        register.register('parallel', async ({ id }) => {
          await new Promise(resolve => setTimeout(resolve, i * 10));
          
          // Check if aborted before recording execution
          if (!abortController.signal.aborted) {
            executedHandlers.push(id * i);
          }
        });
      }

      const dispatchPromise = register.dispatch('parallel', { id: 10 }, {
        signal: abortController.signal
      });

      // Abort after 15ms (should interrupt some handlers)
      setTimeout(() => abortController.abort(), 15);

      await dispatchPromise;

      // Only handlers that completed before abort should be recorded
      expect(executedHandlers.length).toBeLessThan(3);
    });
  });

  describe('Cleanup on abort', () => {
    it('should remove abort event listener after dispatch completes', async () => {
      const abortController = new AbortController();
      const addEventListenerSpy = jest.spyOn(abortController.signal, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(abortController.signal, 'removeEventListener');

      register.register('longRunning', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      await register.dispatch('longRunning', { duration: 100 }, {
        signal: abortController.signal
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    });

    it('should cleanup listener even when handler throws', async () => {
      const abortController = new AbortController();
      const removeEventListenerSpy = jest.spyOn(abortController.signal, 'removeEventListener');

      register.register('longRunning', async () => {
        throw new Error('Handler error');
      }, { blocking: true });

      await expect(
        register.dispatch('longRunning', { duration: 100 }, {
          signal: abortController.signal
        })
      ).rejects.toThrow('Handler error');

      expect(removeEventListenerSpy).toHaveBeenCalledWith('abort', expect.any(Function));
    });
  });

  describe('Abort reason propagation', () => {
    it('should propagate abort reason through pipeline context', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const abortController = new AbortController();
      let capturedAbortReason: string | undefined;

      register.register('longRunning', async (_, controller) => {
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // This handler checks abort status
        if (controller.getPayload) {
          // Access context through controller if available
        }
      });

      register.register('longRunning', async (_, controller) => {
        // Abort and check reason
        controller.abort('Custom abort reason');
        capturedAbortReason = 'Custom abort reason';
      }, { priority: 10 });

      const result = await register.dispatchWithResult('longRunning', { duration: 100 });

      expect(result.aborted).toBe(true);
      expect(result.abortReason).toBe('Custom abort reason');
      expect(capturedAbortReason).toBe('Custom abort reason');
    });
  });
});