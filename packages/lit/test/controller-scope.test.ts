import { describe, expect, it, vi } from 'vitest';
import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { ControllerScope } from '../src/controller-scope.js';
import { StoreController } from '../src/store-controller.js';
import { MockReactiveControllerHost, createMockStore } from './helpers.js';

function createMockController(name: string, order: string[]): ReactiveController {
  return {
    hostConnected() {
      order.push(`${name}:connected`);
    },
    hostDisconnected() {
      order.push(`${name}:disconnected`);
    },
  };
}

describe('ControllerScope', () => {
  it('registers itself with the host and reports its live entry count', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host);

    expect(host.controllers).toContain(scope);
    expect(scope.disposed).toBe(false);
    expect(scope.size).toBe(0);

    scope.addCleanup(() => {});
    expect(scope.size).toBe(1);

    scope.dispose();
    expect(scope.size).toBe(0);
    expect(scope.disposed).toBe(true);
  });

  it('validates the host', () => {
    expect(() => new ControllerScope(null as never)).toThrow(TypeError);
  });

  it('disposes controllers and cleanups in LIFO order so children release before providers', () => {
    const host = new MockReactiveControllerHost();
    const order: string[] = [];
    const scope = new ControllerScope(host);

    scope.add(createMockController('provider', order));
    scope.add(createMockController('child', order));
    scope.addCleanup(() => order.push('child-cleanup'));
    scope.addCleanup(() => order.push('provider-cleanup'));

    scope.dispose();

    expect(order).toEqual([
      'provider-cleanup',
      'child-cleanup',
      'child:disconnected',
      'provider:disconnected',
    ]);
  });

  it('invokes the Lit lifecycle and an explicit dispose() when both exist', () => {
    const host = new MockReactiveControllerHost();
    const order: string[] = [];
    const controller = {
      hostDisconnected: vi.fn(() => order.push('lifecycle')),
      dispose: vi.fn(() => order.push('dispose')),
    };

    new ControllerScope(host).add(controller);
    const scope = host.controllers[0] as ControllerScope;
    scope.dispose();

    expect(controller.hostDisconnected).toHaveBeenCalledTimes(1);
    expect(controller.dispose).toHaveBeenCalledTimes(1);
    expect(order).toEqual(['lifecycle', 'dispose']);
  });

  it('wraps even a single cleanup failure in AggregateError', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host);
    const error = new Error('only failure');
    scope.addCleanup(() => {
      throw error;
    });

    let captured: unknown;
    try {
      scope.dispose();
    } catch (caught) {
      captured = caught;
    }

    expect(captured).toBeInstanceOf(AggregateError);
    expect((captured as AggregateError).errors).toEqual([error]);
  });

  it('continues cleanup after failures and aggregates every error', () => {
    const host = new MockReactiveControllerHost();
    const order: string[] = [];
    const scope = new ControllerScope(host);

    const first = new Error('provider failed');
    const second = new Error('child failed');

    scope.addCleanup(() => {
      order.push('provider-cleanup');
      throw first;
    });
    scope.addCleanup(() => order.push('child-cleanup'));
    scope.addCleanup(() => {
      order.push('child-teardown');
      throw second;
    });

    let captured: unknown;
    try {
      scope.dispose();
    } catch (error) {
      captured = error;
    }

    expect(order).toEqual(['child-teardown', 'child-cleanup', 'provider-cleanup']);
    expect(captured).toBeInstanceOf(AggregateError);
    expect((captured as AggregateError).errors).toEqual([second, first]);
    expect(scope.disposed).toBe(true);
  });

  it('is idempotent and disposes late registrations immediately', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host);
    const cleanup = vi.fn();
    const controller = createMockController('late', []);

    scope.dispose();
    scope.dispose();

    scope.addCleanup(cleanup);
    scope.add(controller);

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(scope.size).toBe(0);
  });

  it('does not auto-dispose by default', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host);
    const cleanup = vi.fn();
    scope.addCleanup(cleanup);

    host.disconnected();

    expect(scope.disposed).toBe(false);
    expect(cleanup).not.toHaveBeenCalled();

    scope.dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('auto-disposes on hostDisconnected when enabled', () => {
    const host = new MockReactiveControllerHost();
    const order: string[] = [];
    const scope = new ControllerScope(host, { autoDisposeOnDisconnect: true });

    scope.addCleanup(() => order.push('cleanup'));
    scope.add(createMockController('part', order));

    host.connected();
    host.disconnected();

    expect(scope.disposed).toBe(true);
    expect(order).toEqual(['part:disconnected', 'cleanup']);
  });

  it('accepts the disposeOnDisconnect alias', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host, { disposeOnDisconnect: true });

    host.disconnected();
    expect(scope.disposed).toBe(true);
  });

  it('accepts the autoDispose alias', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host, { autoDispose: true });

    host.disconnected();
    expect(scope.disposed).toBe(true);
  });

  it('treats reconnection as a new scope instead of reviving a disposed one', () => {
    const host = new MockReactiveControllerHost();
    const first = new ControllerScope(host, { autoDisposeOnDisconnect: true });
    const firstCleanup = vi.fn();
    first.addCleanup(firstCleanup);

    host.connected();
    host.disconnected();

    expect(first.disposed).toBe(true);
    expect(firstCleanup).toHaveBeenCalledTimes(1);

    // Owners create a fresh scope; the old scope stays terminal.
    const second = new ControllerScope(host, { autoDisposeOnDisconnect: true });
    const secondCleanup = vi.fn();
    second.addCleanup(secondCleanup);

    host.connected();
    expect(first.disposed).toBe(true);
    expect(second.disposed).toBe(false);

    host.disconnected();
    expect(second.disposed).toBe(true);
    expect(secondCleanup).toHaveBeenCalledTimes(1);

    // Reusing the disposed scope must not resurrect or duplicate cleanup.
    first.addCleanup(firstCleanup);
    expect(firstCleanup).toHaveBeenCalledTimes(2);
  });

  it('disposes nested controller scopes before their parent cleanup', () => {
    const host = new MockReactiveControllerHost();
    const order: string[] = [];
    const outer = new ControllerScope(host);
    const inner = new ControllerScope(host);

    outer.addCleanup(() => order.push('outer-cleanup'));
    inner.addCleanup(() => order.push('inner-cleanup'));
    outer.add(inner);

    outer.dispose();

    expect(order).toEqual(['inner-cleanup', 'outer-cleanup']);
    expect(inner.disposed).toBe(true);
    expect(outer.disposed).toBe(true);
  });

  it('propagates late registration failures immediately', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host);
    scope.dispose();

    const failure = new Error('late cleanup failed');
    expect(() => scope.addCleanup(() => {
      throw failure;
    })).toThrow(failure);
  });

  it('validates controller and cleanup inputs', () => {
    const host = new MockReactiveControllerHost();
    const scope = new ControllerScope(host);

    expect(() => scope.add(null as never)).toThrow(TypeError);
    expect(() => scope.addCleanup(null as never)).toThrow(TypeError);
  });

  it('disposes a real StoreController subscription and prevents reconnect leakage', () => {
    const host = new MockReactiveControllerHost();
    const store = createMockStore(0);
    const controller = new StoreController(host, store);
    const scope = new ControllerScope(host);

    host.connected();
    expect(store.listenerCount).toBe(1);

    scope.add(controller);
    scope.dispose();

    expect(store.listenerCount).toBe(0);
    expect(host.controllers).not.toContain(controller);
    expect(host.controllers).not.toContain(scope);
  });

  it('does not skip sibling controllers when auto-disposing inside hostDisconnected', async () => {
    // Lit iterates its controller array by index. Removing the scope
    // synchronously from hostDisconnected would shift the next controller into
    // the current index and skip it.
    class IndexIteratingHost implements ReactiveControllerHost {
      readonly controllers: ReactiveController[] = [];

      addController(controller: ReactiveController): void {
        this.controllers.push(controller);
      }

      removeController(controller: ReactiveController): void {
        const index = this.controllers.indexOf(controller);
        if (index !== -1) this.controllers.splice(index, 1);
      }

      requestUpdate(): void {}

      get updateComplete(): Promise<boolean> {
        return Promise.resolve(true);
      }

      disconnected(): void {
        for (let index = 0; index < this.controllers.length; index++) {
          this.controllers[index]!.hostDisconnected?.();
        }
      }
    }

    const host = new IndexIteratingHost();
    const order: string[] = [];
    const scope = new ControllerScope(host, { autoDisposeOnDisconnect: true });
    scope.addCleanup(() => order.push('scope-cleanup'));

    host.addController(createMockController('sibling-a', order));
    host.addController(createMockController('sibling-b', order));

    host.disconnected();

    expect(order).toEqual([
      'scope-cleanup',
      'sibling-a:disconnected',
      'sibling-b:disconnected',
    ]);

    await Promise.resolve();
    expect(host.controllers).not.toContain(scope);
  });
});
