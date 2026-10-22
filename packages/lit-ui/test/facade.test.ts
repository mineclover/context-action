import { describe, expect, it, vi } from 'vitest';
import { createElementFacade } from '../src/facade.js';

class FacadeProbeElement extends HTMLElement {
  #count = 0;

  get count(): number {
    return this.#count;
  }

  set count(value: number) {
    this.#count = value;
  }

  get readOnly(): string {
    return 'fixed';
  }

  increment(): number {
    this.#count += 1;
    return this.#count;
  }
}

if (!customElements.get('facade-probe-element')) {
  customElements.define('facade-probe-element', FacadeProbeElement);
}

type ProbeHandle = Pick<FacadeProbeElement, 'count' | 'increment' | 'readOnly'>;

describe('createElementFacade', () => {
  it('throws when accessed before the element is mounted', () => {
    const createHandle = createElementFacade<
      FacadeProbeElement,
      readonly ['count', 'increment', 'readOnly']
    >(['count', 'increment', 'readOnly']);
    const handle = createHandle(() => null);

    expect(() => handle.count).toThrow(/not mounted/);
    expect(() => handle.increment()).toThrow(/not mounted/);
    expect(() => {
      handle.count = 1;
    }).toThrow(/not mounted/);
  });

  it('projects getters, setters, and methods onto a frozen facade', () => {
    const element = new FacadeProbeElement();
    const createHandle = createElementFacade<
      FacadeProbeElement,
      readonly ['count', 'increment', 'readOnly']
    >(['count', 'increment', 'readOnly']);
    const handle: ProbeHandle = createHandle(() => element);

    expect(Object.isFrozen(handle)).toBe(true);
    expect(handle.count).toBe(0);
    expect(handle.increment()).toBe(1);
    expect(handle.count).toBe(1);

    handle.count = 5;
    expect(element.count).toBe(5);
    expect(handle.readOnly).toBe('fixed');
  });

  it('binds methods to the live element and caches identical function identities', () => {
    const element = new FacadeProbeElement();
    const createHandle = createElementFacade<
      FacadeProbeElement,
      readonly ['increment', 'count', 'increment']
    >(['increment', 'count', 'increment'] as const);
    const handle = createHandle(() => element);

    const first = handle.increment;
    const second = handle.increment;
    expect(first).toBe(second);

    const unbound = element.increment;
    expect(() => unbound()).toThrow(TypeError);

    expect(first()).toBe(1);
    expect(handle.count).toBe(1);
  });

  it('rejects writes to read-only properties', () => {
    const element = new FacadeProbeElement();
    const createHandle = createElementFacade<
      FacadeProbeElement,
      readonly ['readOnly']
    >(['readOnly']);
    const handle = createHandle(() => element);

    expect(() => {
      (handle as unknown as { readOnly: string }).readOnly = 'changed';
    }).toThrow(TypeError);
    expect(handle.readOnly).toBe('fixed');
  });

  it('does not retain a detached element through the facade', () => {
    let element: FacadeProbeElement | null = new FacadeProbeElement();
    const createHandle = createElementFacade<
      FacadeProbeElement,
      readonly ['increment']
    >(['increment']);
    const handle = createHandle(() => element);
    const increment = handle.increment;
    expect(increment()).toBe(1);

    element = null;
    expect(() => handle.increment()).toThrow(/not mounted/);
  });

  it('keeps the bound method identity stable across reads but refreshes when the method changes', () => {
    const element = new FacadeProbeElement();
    const createHandle = createElementFacade<
      FacadeProbeElement,
      readonly ['increment']
    >(['increment']);
    const handle = createHandle(() => element);

    const first = handle.increment;
    const replacement = vi.fn(() => 99);
    element.increment = replacement as never;
    const second = handle.increment;

    expect(second).not.toBe(first);
    expect(second()).toBe(99);
    expect(replacement).toHaveBeenCalledTimes(1);
  });
});
