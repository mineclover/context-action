import { describe, expect, it, vi } from 'vitest';
import { createElementBinding } from '../../src/element.js';
import { createPublicFacade } from '../../src/facade/create-public-facade.js';

class Probe extends HTMLElement {
  input: unknown = 'default';
  other: unknown = 'untouched';
  dispose = vi.fn();
  #count = 0;
  get count() { return this.#count; }
  set count(value: number) {
    if (!Number.isFinite(value)) throw new RangeError('invalid count');
    this.#count = value;
    this.dispatchEvent(new CustomEvent('changed', { detail: value }));
  }
}
customElements.define('dom-binding-probe', Probe);

interface Props {
  input?: unknown;
  other?: unknown;
  count?: number;
  changed?: ((event: CustomEvent<number>) => void) | EventListenerObject | undefined;
}
const config = { properties: ['input', 'other', 'count'] as const, events: { changed: 'changed' } };

describe('framework-neutral element binding', () => {
  it('captures synchronous setter events with latest handlers and unchanged defaults', () => {
    const host = new Probe();
    const binding = createElementBinding<Props>(host, config);
    const first = vi.fn();
    binding.update({ changed: first });
    expect(host.input).toBe('default');
    binding.update({ count: 1, changed: first });
    expect(first.mock.calls[0]![0].detail).toBe(1);
    const second = vi.fn();
    binding.update({ count: 2, changed: second });
    expect(first).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0]![0].detail).toBe(2);
    binding.dispose();
  });

  it('owns only attempted inputs, releases omitted properties once, and never owns the renderer', () => {
    const host = new Probe();
    const binding = createElementBinding<Props>(host, config);
    const input = { count: 1 };
    binding.update({ input });
    expect(host.input).toBe(input);
    expect(host.hasAttribute('input')).toBe(false);
    binding.update({});
    expect(host.input).toBeUndefined();
    host.input = 'other owner';
    binding.update({});
    expect(host.input).toBe('other owner');
    expect(host.other).toBe('untouched');
    binding.update({ other: undefined });
    expect(host.other).toBeUndefined();
    binding.dispose(); binding.dispose();
    expect(host.dispose).not.toHaveBeenCalled();
    expect(host.input).toBe('other owner');
    expect(binding.disposed).toBe(true);
    expect(() => binding.update({})).toThrow(/disposed/);
  });

  it('reuses handlers, preserves object receivers, and supports replayable disconnect', () => {
    const host = new Probe();
    const binding = createElementBinding<Props>(host, config);
    const receiver = { calls: 0, handleEvent() { this.calls++; } };
    binding.update({ input: 'owned', changed: receiver });
    const add = vi.spyOn(host, 'addEventListener');
    const remove = vi.spyOn(host, 'removeEventListener');
    binding.updateEvents({ changed: receiver });
    expect(add).not.toHaveBeenCalled();
    binding.disconnectEvents(); binding.disconnectEvents();
    expect(remove).toHaveBeenCalledTimes(1);
    host.dispatchEvent(new Event('changed'));
    expect(receiver.calls).toBe(0);
    binding.updateEvents({ changed: receiver });
    host.dispatchEvent(new Event('changed'));
    expect(receiver.calls).toBe(1);
    binding.updateProperties({}); // ownership survived event disconnection
    expect(host.input).toBeUndefined();
    binding.updateEvents({});
    host.dispatchEvent(new Event('changed'));
    expect(receiver.calls).toBe(1);
    binding.dispose();
  });

  it('stops subsequent writes when an event disposes the binding reentrantly', () => {
    const host = new Probe();
    const binding = createElementBinding<Props>(host, { properties: ['count', 'other'], events: config.events });
    const changed = vi.fn(() => binding.dispose());
    binding.update({ count: 1, other: 'must not apply', changed });
    expect(host.count).toBe(1);
    expect(host.other).toBe('untouched');
    host.dispatchEvent(new Event('changed'));
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('rejects nested updates rather than silently overwriting an in-progress snapshot', () => {
    const host = new Probe();
    const binding = createElementBinding<Props>(host, config);
    binding.update({ count: 1, changed: () => {
      expect(() => binding.update({ input: 'nested' })).toThrow(/already in progress/);
    } });
    binding.update({ input: 'next' });
    expect(host.input).toBe('next');
    binding.dispose();
  });

  it('does not assign values read from a getter that disposes the binding', () => {
    const host = new Probe();
    const binding = createElementBinding<Props>(host, config);
    binding.update({ get input() { binding.dispose(); return 'must not apply'; } });
    expect(host.input).toBe('default');
  });

  it('removes a listener when a customized event target disposes during registration', () => {
    const host = new Probe();
    const binding = createElementBinding<Props>(host, config);
    const add = host.addEventListener.bind(host);
    vi.spyOn(host, 'addEventListener').mockImplementationOnce((...args) => {
      add(...args);
      binding.dispose();
    });
    const changed = vi.fn();
    binding.update({ changed, input: 'must not apply' });
    host.dispatchEvent(new Event('changed'));
    expect(changed).not.toHaveBeenCalled();
    expect(host.input).toBe('default');
  });

  it('preserves explicit assignment policies, best-effort omission, and per-target isolation', () => {
    const first = new Probe(); const second = new Probe();
    const strict = createElementBinding<Props>(first, config, { assignmentErrors: 'throw' });
    const loose = createElementBinding<Props>(second, config);
    strict.update({ count: 3 });
    expect(() => strict.update({ count: Number.NaN })).toThrow(RangeError);
    loose.update({ count: Number.NaN });
    expect([first.count, second.count]).toEqual([3, 0]);
    strict.update({}); // undefined setter rejection must not escape cleanup
    expect(first.count).toBe(3);
    strict.dispose(); loose.dispose();
  });

  it('captures configuration and cleans listener additions that fail', () => {
    const host = new Probe();
    const properties: (keyof Props)[] = ['input'];
    const events = { changed: 'changed' };
    const binding = createElementBinding<Props>(host, { properties, events });
    properties.length = 0; events.changed = 'wrong';
    const changed = vi.fn();
    binding.update({ input: 'captured', changed });
    host.dispatchEvent(new Event('changed'));
    expect(host.input).toBe('captured');
    expect(changed).toHaveBeenCalledTimes(1);
    binding.dispose();
    const failing = createElementBinding<Props>(host, config);
    vi.spyOn(host, 'addEventListener').mockImplementationOnce(() => { throw new Error('registration failed'); });
    expect(() => failing.update({ changed })).toThrow(/registration failed/);
    failing.update({ changed });
    host.dispatchEvent(new Event('changed'));
    expect(changed).toHaveBeenCalledTimes(2);
    failing.dispose();
  });
});

describe('object facade implementation', () => {
  it('works with plain objects, follows target replacement, and binds private receivers', () => {
    class Target {
      #count = 0;
      get count() { return this.#count; }
      increment() { return ++this.#count; }
    }
    let target: Target | null = new Target();
    const handle = createPublicFacade<Target, readonly ['count', 'increment']>(['count', 'increment'])(() => target);
    const captured = handle.increment;
    expect(captured).toBe(handle.increment);
    expect(captured()).toBe(1);
    target = new Target();
    expect(handle.increment()).toBe(1);
    target = null;
    expect(() => handle.increment()).toThrow(/not available/);
    expect(captured()).toBe(2); // bound captures deliberately are NOT revoked
    expect(Object.isFrozen(handle)).toBe(true);
    const plain = { value: 1 };
    const projected = createPublicFacade<typeof plain, readonly ['value']>(['value'])(() => plain);
    projected.value = 2;
    expect(plain.value).toBe(2);
  });
});
