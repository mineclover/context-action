import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'preact';
import { createElementFacade, definePreactElement } from '../src/index.js';
import type { ExposeContract, ReservedElementKey } from '../src/index.js';

let sequence = 0;
const nextTag = (name: string) => `expose-contract-${name}-${++sequence}`;

describe('definePreactElement expose contract', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  afterEach(() => {
    container.remove();
  });

  it('replays a pre-upgrade value through a prototype setter that expose does not redefine', () => {
    const tagName = nextTag('prototype-setter');
    const pending = document.createElement(tagName) as HTMLElement & { name: string };
    // Assigned before definition: becomes an own data property that would
    // otherwise shadow ManagedPreactElement's `name` accessor forever.
    pending.name = 'alpha';
    container.append(pending);

    definePreactElement<{ ready: boolean }>({
      tagName,
      upgradeProperties: ['name'],
      setup() {
        return {
          view: () => h('span', null, 'ready'),
          getInput: () => ({ ready: true }),
        };
      },
    });

    expect(Object.getOwnPropertyDescriptor(pending, 'name')).toBeUndefined();
    expect(pending.getAttribute('name')).toBe('alpha');
    expect(pending.name).toBe('alpha');

    pending.name = 'beta';
    expect(pending.getAttribute('name')).toBe('beta');
    (pending as unknown as { dispose(): void }).dispose();
  });

  it('rejects reserved members at the type level', () => {
    type Valid = ExposeContract<{ value: number; focusItem(): boolean }>;
    const valid: Valid = { value: 1, focusItem: () => true };
    expect(valid.value).toBe(1);

    const reservedKeys: ReservedElementKey[] = ['dispose', 'updateInput', 'name', 'focus', 'shadowRoot'];
    expect(reservedKeys).toHaveLength(5);
  });

  it('throws before installing any member and releases setup resources when expose redefines reserved members', () => {
    const onDestroy = vi.fn();
    const tagName = nextTag('reserved');

    // @ts-expect-error `dispose` and `focus` are reserved element members.
    const Reserved = definePreactElement<{ ok: boolean }, { safe: number; dispose(): void; focus(): void }>({
      tagName,
      setup() {
        return {
          view: () => h('span', null, 'never'),
          getInput: () => ({ ok: true }),
          expose: {
            safe: 1,
            dispose() {},
            focus() {},
          },
          onDestroy,
        };
      },
    });

    expect(() => new Reserved()).toThrow(
      new TypeError(`${tagName} expose cannot redefine reserved element member(s): dispose, focus`),
    );
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('rejects expose members that would overwrite setup-owned instance accessors', () => {
    const onDestroy = vi.fn();
    const tagName = nextTag('setup-accessor');
    const Element = definePreactElement<{ ok: boolean }, { value: number }>({
      tagName,
      setup(element) {
        Object.defineProperty(element, 'value', {
          configurable: true,
          get: () => 1,
          set: () => undefined,
        });
        return {
          view: () => h('span', null, 'never'),
          getInput: () => ({ ok: true }),
          expose: { value: 2 },
          onDestroy,
        };
      },
    });

    expect(() => new Element()).toThrow(
      new TypeError(`${tagName} expose cannot redefine reserved element member(s): value`),
    );
    expect(onDestroy).toHaveBeenCalledTimes(1);
  });

  it('aggregates the reserved-member error with an onDestroy failure', () => {
    const tagName = nextTag('reserved-cleanup');
    const cleanupError = new Error('cleanup failed');

    // @ts-expect-error `updateInput` is a reserved element member.
    const Reserved = definePreactElement<{ ok: boolean }, { updateInput(): void }>({
      tagName,
      setup() {
        return {
          view: () => h('span', null, 'never'),
          getInput: () => ({ ok: true }),
          expose: { updateInput() {} },
          onDestroy() {
            throw cleanupError;
          },
        };
      },
    });

    let caught: unknown;
    try {
      new Reserved();
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(AggregateError);
    const errors = (caught as AggregateError).errors;
    expect(errors[0]).toBeInstanceOf(TypeError);
    expect(errors[1]).toBe(cleanupError);
  });
});

describe('createElementFacade method identity', () => {
  class FacadeTarget extends HTMLElement {
    count = 0;
    increment(): number {
      this.count += 1;
      return this.count;
    }
  }
  const tagName = nextTag('facade-target');
  customElements.define(tagName, FacadeTarget);

  it('returns a stable bound method until the element or method changes', () => {
    const first = new FacadeTarget();
    const second = new FacadeTarget();
    let current: FacadeTarget | null = first;
    const facade = createElementFacade<FacadeTarget, readonly ['increment', 'count']>([
      'increment',
      'count',
    ])(() => current);

    const incrementA = facade.increment;
    expect(facade.increment).toBe(incrementA);
    expect(incrementA()).toBe(1);
    expect(first.count).toBe(1);

    current = second;
    const incrementB = facade.increment;
    expect(incrementB).not.toBe(incrementA);
    expect(incrementB()).toBe(1);
    expect(second.count).toBe(1);
    expect(first.count).toBe(1);

    // Switching back reuses the cached binding for the first element.
    current = first;
    expect(facade.increment).toBe(incrementA);

    // An instance-level override invalidates the cached binding.
    first.increment = function override(this: FacadeTarget) {
      this.count += 10;
      return this.count;
    };
    const overridden = facade.increment;
    expect(overridden).not.toBe(incrementA);
    expect(overridden()).toBe(11);
  });
});
