import { describe, expect, it, vi } from 'vitest';
import { ActionRegister, type DispatchOptions } from '@context-action/core';
import { ActionController } from '../src/action-controller.js';
import { MockReactiveControllerHost, createDeferred } from './helpers.js';

interface StressActions {
  voidNoop: void;
  asyncTask: { id: number; delayMs?: number };
  fastTask: { id: number };
  nestedTask: { depth: number; maxDepth: number };
  failingTask: { id: number; errorMsg: string };
  calcResult: { id: number };
}

interface StressResults {
  calcResult: { id: number; done: boolean };
}

describe('ActionController Adversarial Stress Tests', () => {
  describe('Dimension 1: Concurrent Action Dispatches & Update Coalescing', () => {
    it('executes 100 concurrent dispatches and triggers requestUpdate strictly twice (0 -> 1 and 1 -> 0)', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      const deferreds = Array.from({ length: 100 }, () => createDeferred<void>());
      const executionCount = { count: 0 };

      register.register('asyncTask', async (payload) => {
        executionCount.count++;
        await deferreds[payload.id]!.promise;
      });

      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
      expect(host.requestUpdateCount).toBe(0);

      // Launch 100 concurrent dispatches
      const dispatchPromises = deferreds.map((_, index) =>
        controller.dispatch('asyncTask', { id: index })
      );

      // Immediately after launching all 100:
      // Active count should be 100
      expect(controller.isPending).toBe(true);
      expect(controller.activeCount).toBe(100);
      // requestUpdate() should have fired EXACTLY ONCE on the 0 -> 1 transition
      expect(host.requestUpdateCount).toBe(1);

      // Resolve the first 99 deferreds in random/scattered order
      for (let i = 0; i < 99; i++) {
        deferreds[i]!.resolve();
      }

      // Allow microtasks to process
      await Promise.all(dispatchPromises.slice(0, 99));

      // With 1 dispatch still in flight:
      expect(controller.isPending).toBe(true);
      expect(controller.activeCount).toBe(1);
      // requestUpdate() must STILL BE EXACTLY 1 (no intermediate updates!)
      expect(host.requestUpdateCount).toBe(1);

      // Now resolve the final dispatch
      deferreds[99]!.resolve();
      await dispatchPromises[99];

      // After all 100 have settled:
      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
      // requestUpdate() must have fired EXACTLY ONCE MORE on the 1 -> 0 transition (Total = 2)
      expect(host.requestUpdateCount).toBe(2);
      expect(executionCount.count).toBe(100);
    });

    it('coalesces staggered overlapping waves of dispatches into a single 0 -> 1 and 1 -> 0 pair', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      const wave1 = Array.from({ length: 20 }, () => createDeferred<void>());
      const wave2 = Array.from({ length: 20 }, () => createDeferred<void>());
      const wave3 = Array.from({ length: 20 }, () => createDeferred<void>());

      register.register('asyncTask', async (payload) => {
        if (payload.id < 20) await wave1[payload.id]!.promise;
        else if (payload.id < 40) await wave2[payload.id - 20]!.promise;
        else await wave3[payload.id - 40]!.promise;
      });

      // Wave 1 starts
      const pWave1 = wave1.map((_, i) => controller.dispatch('asyncTask', { id: i }));
      expect(host.requestUpdateCount).toBe(1);
      expect(controller.activeCount).toBe(20);

      // Wave 2 starts while Wave 1 is running
      const pWave2 = wave2.map((_, i) => controller.dispatch('asyncTask', { id: i + 20 }));
      expect(host.requestUpdateCount).toBe(1);
      expect(controller.activeCount).toBe(40);

      // Resolve wave 1 completely
      wave1.forEach((d) => d.resolve());
      await Promise.all(pWave1);
      // 20 still running from wave 2; host.requestUpdateCount must remain 1
      expect(host.requestUpdateCount).toBe(1);
      expect(controller.activeCount).toBe(20);

      // Wave 3 starts while Wave 2 is still running
      const pWave3 = wave3.map((_, i) => controller.dispatch('asyncTask', { id: i + 40 }));
      expect(host.requestUpdateCount).toBe(1);
      expect(controller.activeCount).toBe(40);

      // Resolve wave 2 completely
      wave2.forEach((d) => d.resolve());
      await Promise.all(pWave2);
      expect(host.requestUpdateCount).toBe(1);
      expect(controller.activeCount).toBe(20);

      // Resolve wave 3 completely
      wave3.forEach((d) => d.resolve());
      await Promise.all(pWave3);

      // All settled: requestUpdateCount must be 2
      expect(host.requestUpdateCount).toBe(2);
      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
    });

    it('handles 50 disjoint sequential dispatches with exactly 50 discrete (0 -> 1 -> 0) update cycles', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('fastTask', async () => {
        // fast async tick
        await Promise.resolve();
      });

      for (let i = 0; i < 50; i++) {
        const promise = controller.dispatch('fastTask', { id: i });
        expect(controller.isPending).toBe(true);
        expect(host.requestUpdateCount).toBe(i * 2 + 1);
        await promise;
        expect(controller.isPending).toBe(false);
        expect(host.requestUpdateCount).toBe(i * 2 + 2);
      }

      expect(host.requestUpdateCount).toBe(100);
      expect(controller.activeCount).toBe(0);
    });

    it('coalesces deeply nested recursive dispatches cleanly without UI thrashing', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('nestedTask', async (payload) => {
        if (payload.depth < payload.maxDepth) {
          // Recursive dispatch via controller
          await controller.dispatch('nestedTask', {
            depth: payload.depth + 1,
            maxDepth: payload.maxDepth,
          });
        }
      });

      // Dispatch depth of 10
      await controller.dispatch('nestedTask', { depth: 1, maxDepth: 10 });

      // Entire recursion should have only 1 start and 1 finish
      expect(host.requestUpdateCount).toBe(2);
      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
    });

    it('coalesces concurrent mix of dispatch and dispatchWithResult', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);
      const d1 = createDeferred<void>();
      const d2 = createDeferred<void>();

      register.register('asyncTask', async () => {
        await d1.promise;
      });

      register.registerResult('calcResult', async (payload) => {
        await d2.promise;
        return { id: payload.id, done: true };
      });

      const p1 = controller.dispatch('asyncTask', { id: 1 });
      const p2 = controller.dispatchWithResult('calcResult', { id: 2 });

      expect(controller.activeCount).toBe(2);
      expect(host.requestUpdateCount).toBe(1);

      d1.resolve();
      await p1;
      expect(controller.activeCount).toBe(1);
      expect(host.requestUpdateCount).toBe(1);

      d2.resolve();
      const res2 = await p2;
      expect(res2.result).toEqual({ id: 2, done: true });
      expect(controller.activeCount).toBe(0);
      expect(host.requestUpdateCount).toBe(2);
    });
  });

  describe('Dimension 2: In-Flight Abort on hostDisconnected', () => {
    it('aborts 50 concurrent in-flight dispatches simultaneously on hostDisconnected without unhandled errors', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('asyncTask', async (_payload, pipelineCtrl) => {
        return new Promise<void>((_resolve, reject) => {
          if (pipelineCtrl.signal?.aborted) {
            reject(new Error('Already aborted'));
            return;
          }
          pipelineCtrl.signal?.addEventListener('abort', () => {
            reject(pipelineCtrl.signal?.reason ?? new Error('Aborted by signal'));
          });
        });
      });

      host.connected();

      // Launch 50 concurrent dispatches
      const dispatchPromises = Array.from({ length: 50 }, (_, i) =>
        controller.dispatch('asyncTask', { id: i })
      );

      expect(controller.isPending).toBe(true);
      expect(controller.activeCount).toBe(50);
      expect(host.requestUpdateCount).toBe(1);

      // Disconnect host
      host.disconnected();

      // All 50 promises should reject with AbortError
      const results = await Promise.allSettled(dispatchPromises);
      expect(results.length).toBe(50);
      for (const res of results) {
        expect(res.status).toBe('rejected');
        if (res.status === 'rejected') {
          expect(res.reason).toBeInstanceOf(DOMException);
          expect(res.reason.name).toBe('AbortError');
          expect(res.reason.message).toContain('Host disconnected');
        }
      }

      // Controller must cleanly settle to idle state
      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
      // requestUpdate was called on 0 -> 1, and again on 50 -> 0!
      expect(host.requestUpdateCount).toBe(2);
    });

    it('is idempotent when hostDisconnected() is called repeatedly during pending operations', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('asyncTask', async (_payload, pipelineCtrl) => {
        return new Promise<void>((_resolve, reject) => {
          pipelineCtrl.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        });
      });

      host.connected();
      const p = controller.dispatch('asyncTask', { id: 1 });

      // Call hostDisconnected multiple times
      host.disconnected();
      host.disconnected();
      host.disconnected();

      await expect(p).rejects.toThrow();
      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
    });

    it('rejects new dispatches immediately if host is currently disconnected', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);
      const handlerSpy = vi.fn();

      register.register('voidNoop', handlerSpy);

      host.connected();
      host.disconnected();

      // Dispatching while disconnected
      const promise = controller.dispatch('voidNoop');
      await expect(promise).rejects.toThrow('Host disconnected');

      // The handler should NOT have executed or should have been aborted
      expect(controller.isPending).toBe(false);
      expect(controller.activeCount).toBe(0);
    });
  });

  describe('Dimension 3: Rapid Abort / Dispatch Interleaving', () => {
    it('maintains perfect activeCount integrity across 50 rapid connect -> dispatch -> disconnect -> reconnect cycles', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('asyncTask', async (_payload, pipelineCtrl) => {
        return new Promise<void>((resolve, reject) => {
          if (pipelineCtrl.signal?.aborted) {
            return reject(new DOMException('Aborted', 'AbortError'));
          }
          pipelineCtrl.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
          // Timeout to avoid forever dangling if not aborted
          setTimeout(() => resolve(), 50);
        });
      });

      for (let i = 0; i < 50; i++) {
        host.connected();
        const p = controller.dispatch('asyncTask', { id: i });
        expect(controller.isPending).toBe(true);

        // Immediate disconnect to abort
        host.disconnected();

        // Must reject cleanly
        await expect(p).rejects.toThrow();

        // Must return to 0
        expect(controller.activeCount).toBe(0);
        expect(controller.isPending).toBe(false);
      }

      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
    });

    it('supports rapid manual controller.abort() calls interleaved with dispatches', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('asyncTask', async (_payload, pipelineCtrl) => {
        return new Promise<void>((resolve, reject) => {
          if (pipelineCtrl.signal?.aborted) {
            return reject(new DOMException('Manual abort', 'AbortError'));
          }
          pipelineCtrl.signal?.addEventListener('abort', () => {
            reject(new DOMException('Manual abort', 'AbortError'));
          });
          setTimeout(() => resolve(), 30);
        });
      });

      for (let i = 0; i < 30; i++) {
        const p1 = controller.dispatch('asyncTask', { id: i });
        const p2 = controller.dispatch('asyncTask', { id: i + 100 });
        expect(controller.activeCount).toBe(2);

        controller.abort(new DOMException(`Manual abort ${i}`, 'AbortError'));

        await expect(p1).rejects.toThrow(`Manual abort ${i}`);
        await expect(p2).rejects.toThrow(`Manual abort ${i}`);

        expect(controller.activeCount).toBe(0);
        expect(controller.isPending).toBe(false);

        // Next dispatch immediately after abort succeeds once controller resets
        const pNext = controller.dispatch('asyncTask', { id: i + 200 });
        expect(controller.activeCount).toBe(1);
        controller.abort();
        await expect(pNext).rejects.toThrow();
        expect(controller.activeCount).toBe(0);
      }
    });

    it('handles out-of-order settlement where an aborted dispatch settles after re-connection and next dispatch', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      const d1 = createDeferred<void>();
      const d2 = createDeferred<void>();

      register.register('asyncTask', async (payload, pipelineCtrl) => {
        if (payload.id === 1) {
          // Delayed resolution/rejection on signal abort
          return new Promise<void>((_resolve, reject) => {
            pipelineCtrl.signal?.addEventListener('abort', async () => {
              // Wait for deferred d1 before rejecting to simulate delayed unroll
              await d1.promise;
              reject(new DOMException('Delayed abort 1', 'AbortError'));
            });
          });
        }
        if (payload.id === 2) {
          await d2.promise;
        }
      });

      host.connected();
      const p1 = controller.dispatch('asyncTask', { id: 1 });
      expect(controller.activeCount).toBe(1);

      // Disconnect host -> triggers abort on p1
      host.disconnected();

      // Immediately reconnect host before p1 settles!
      host.connected();

      // Launch p2 on the newly connected host
      const p2 = controller.dispatch('asyncTask', { id: 2 });
      // Both p1 (not yet unrolled) and p2 are in-flight
      expect(controller.activeCount).toBe(2);

      // Now resolve d1 to let p1 finish unrolling
      d1.resolve();
      await expect(p1).rejects.toThrow('Host disconnected');
      // activeCount drops to 1 because p2 is still running
      expect(controller.activeCount).toBe(1);
      expect(controller.isPending).toBe(true);

      // Now resolve d2 to let p2 finish
      d2.resolve();
      await p2;

      // Everything settled
      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
    });
  });

  describe('Dimension 4: Error Handling & Fault Resilience', () => {
    it('restores pending count and triggers requestUpdate when handlers fail with fatal errors', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register(
        'failingTask',
        async (payload) => {
          throw new Error(payload.errorMsg);
        },
        { errorPolicy: 'fatal' },
      );

      const p1 = controller.dispatch('failingTask', { id: 1, errorMsg: 'Fatal Error 1' });
      const p2 = controller.dispatch('failingTask', { id: 2, errorMsg: 'Fatal Error 2' });

      expect(controller.activeCount).toBe(2);
      expect(host.requestUpdateCount).toBe(1);

      await expect(p1).rejects.toThrow('Fatal Error 1');
      await expect(p2).rejects.toThrow('Fatal Error 2');

      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
      expect(host.requestUpdateCount).toBe(2);
    });

    it('preserves activeCount stability when host has multiple controllers attached', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const ctrl1 = new ActionController(host, register);
      const ctrl2 = new ActionController(host, register);

      expect(host.controllers.length).toBe(2);

      register.register('fastTask', async () => {
        await Promise.resolve();
      });

      await Promise.all([
        ctrl1.dispatch('fastTask', { id: 1 }),
        ctrl2.dispatch('fastTask', { id: 2 }),
      ]);

      expect(ctrl1.activeCount).toBe(0);
      expect(ctrl2.activeCount).toBe(0);
    });

    it('handles pre-aborted caller signal cleanly without corrupting activeCount', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      const preAborted = AbortSignal.abort(new DOMException('Already cancelled', 'AbortError'));

      const p = controller.dispatch('fastTask', { id: 1 }, { signal: preAborted });
      await expect(p).rejects.toThrow('Already cancelled');

      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
      // requestUpdate should have fired 0 -> 1 and 1 -> 0
      expect(host.requestUpdateCount).toBe(2);
    });

    it('survives synchronous re-entrant dispatch inside host.requestUpdate()', async () => {
      let isFirstUpdate = true;
      let reentrantDispatched = false;

      class ReentrantHost extends MockReactiveControllerHost {
        override requestUpdate(): void {
          super.requestUpdate();
          if (isFirstUpdate) {
            isFirstUpdate = false;
            reentrantDispatched = true;
            // Synchronously dispatch another action inside requestUpdate
            controller.dispatch('fastTask', { id: 99 });
          }
        }
      }

      const host = new ReentrantHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('fastTask', async () => {
        await Promise.resolve();
      });

      await controller.dispatch('fastTask', { id: 1 });

      expect(reentrantDispatched).toBe(true);
      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
    });
  });

  describe('Dimension 5: Chaotic Fuzzing & High-Concurrency Interleaving', () => {
    it('survives 200 chaotic dispatches with random delays, user aborts, and handler errors with zero activeCount drift', async () => {
      const host = new MockReactiveControllerHost();
      const register = new ActionRegister<StressActions, StressResults>();
      const controller = new ActionController(host, register);

      register.register('asyncTask', async (payload, pipelineCtrl) => {
        return new Promise<void>((resolve, reject) => {
          if (pipelineCtrl.signal?.aborted) {
            return reject(pipelineCtrl.signal.reason);
          }
          const timer = setTimeout(() => {
            if (payload.id % 7 === 0) {
              reject(new Error(`Random failure ${payload.id}`));
            } else {
              resolve();
            }
          }, (payload.id % 5) * 3);

          pipelineCtrl.signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(pipelineCtrl.signal?.reason);
          });
        });
      }, { errorPolicy: 'fatal' });

      host.connected();

      const promises: Promise<void>[] = [];
      const userAbortControllers: AbortController[] = [];

      for (let i = 0; i < 200; i++) {
        let options: DispatchOptions | undefined;
        if (i % 3 === 0) {
          const userAc = new AbortController();
          userAbortControllers.push(userAc);
          options = { signal: userAc.signal };
        }

        const p = options
          ? controller.dispatch('asyncTask', { id: i }, options)
          : controller.dispatch('asyncTask', { id: i });
        promises.push(p);

        // Abort some user signals immediately or shortly
        if (i % 6 === 0 && userAbortControllers.length > 0) {
          const lastAc = userAbortControllers[userAbortControllers.length - 1];
          lastAc?.abort(new DOMException('User random cancel', 'AbortError'));
        }
      }

      // Settle all dispatches
      await Promise.allSettled(promises);

      // Verify strict invariants
      expect(controller.activeCount).toBe(0);
      expect(controller.isPending).toBe(false);
    });
  });
});
