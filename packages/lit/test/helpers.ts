import type { ReactiveController, ReactiveControllerHost } from 'lit';
import type { ReadableStore } from '../src/types.js';

/**
 * Mock implementation of Lit's ReactiveControllerHost for testing.
 */
export class MockReactiveControllerHost implements ReactiveControllerHost {
  readonly controllers: ReactiveController[] = [];
  requestUpdateCount = 0;

  addController(controller: ReactiveController): void {
    this.controllers.push(controller);
  }

  removeController(controller: ReactiveController): void {
    const index = this.controllers.indexOf(controller);
    if (index !== -1) {
      this.controllers.splice(index, 1);
    }
  }

  requestUpdate(): void {
    this.requestUpdateCount++;
  }

  get updateComplete(): Promise<boolean> {
    return Promise.resolve(true);
  }

  // Testing lifecycle dispatchers
  connected(): void {
    for (const controller of [...this.controllers]) {
      controller.hostConnected?.();
    }
  }

  disconnected(): void {
    for (const controller of [...this.controllers]) {
      controller.hostDisconnected?.();
    }
  }

  update(): void {
    for (const controller of [...this.controllers]) {
      controller.hostUpdate?.();
    }
  }

  updated(): void {
    for (const controller of [...this.controllers]) {
      controller.hostUpdated?.();
    }
  }

  resetStats(): void {
    this.requestUpdateCount = 0;
  }
}

/**
 * Observable mock store tracking listener registrations for leak verification.
 */
export interface MockStore<T> extends ReadableStore<T> {
  setValue(next: T): void;
  update(updater: (prev: T) => T): void;
  readonly listenerCount: number;
}

/**
 * Creates a mock ReadableStore with an observable listener count.
 */
export function createMockStore<T>(initialValue: T): MockStore<T> {
  let currentValue = initialValue;
  const listeners = new Set<() => void>();

  return {
    getValue(): T {
      return currentValue;
    },
    getSnapshot(): T {
      return currentValue;
    },
    setValue(next: T): void {
      currentValue = next;
      for (const listener of Array.from(listeners)) {
        listener();
      }
    },
    update(updater: (prev: T) => T): void {
      this.setValue(updater(currentValue));
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get listenerCount(): number {
      return listeners.size;
    },
  };
}

/**
 * Creates a deferred promise with manual resolve/reject handles.
 */
export function createDeferred<T = void>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
