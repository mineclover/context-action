import { describe, expect, it, vi } from 'vitest';
import {
  createDismissLayer,
  createElementBinding,
  createPointerGestureSession,
  createRovingFocusController,
  createSyncActionPipeline,
  toReactPartProps,
  type DismissReason,
} from '../../src/element.js';
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

  it('binds declarative attributes and CSS custom properties with omission cleanup', () => {
    interface PartProps {
      role?: string;
      expanded?: boolean;
      hidden?: boolean | null;
      hitSize?: string;
      left?: string;
      changed?: () => void;
    }
    const host = new Probe();
    host.setAttribute('data-external', 'keep');
    host.style.setProperty('--external-var', '1px');

    const binding = createElementBinding<PartProps>(host, {
      attributes: {
        role: 'role',
        expanded: 'aria-expanded',
        hidden: 'hidden',
      },
      styles: {
        hitSize: '--editor-handle-hit-size',
        left: 'left',
      },
      events: {
        changed: 'changed',
      },
    });

    binding.update({
      role: 'slider',
      expanded: true,
      hidden: false,
      hitSize: '28px',
      left: '100%',
    });
    expect(host.getAttribute('role')).toBe('slider');
    expect(host.getAttribute('aria-expanded')).toBe('');
    expect(host.hasAttribute('hidden')).toBe(false);
    expect(host.style.getPropertyValue('--editor-handle-hit-size')).toBe('28px');
    expect(host.style.left).toBe('100%');
    expect(host.getAttribute('data-external')).toBe('keep');
    expect(host.style.getPropertyValue('--external-var')).toBe('1px');

    // Omission clears owned attributes/styles once without overriding subsequent external edits
    binding.update({ role: 'button', hitSize: '' });
    expect(host.getAttribute('role')).toBe('button');
    expect(host.hasAttribute('aria-expanded')).toBe(false);
    expect(host.style.getPropertyValue('--editor-handle-hit-size')).toBe('');
    expect(host.style.left).toBe('');

    host.style.left = '50%';
    binding.update({});
    expect(host.style.left).toBe('50%');
    expect(host.hasAttribute('role')).toBe(false);

    // Reentrant disposal inside an attribute getter prevents writing subsequent styles
    binding.update({
      get role() {
        binding.dispose();
        return 'gridcell';
      },
      hitSize: '40px',
    });
    expect(host.hasAttribute('role')).toBe(false);
    expect(host.style.getPropertyValue('--editor-handle-hit-size')).toBe('');
  });

  it('projects headless snapshots with toReactPartProps', () => {
    interface Snap {
      role?: string;
      tabIndex?: number;
      cls?: string;
      disabled?: boolean;
      hidden?: boolean;
      hitSize?: string;
      minWidth?: string;
      onKeyDown?: () => void;
    }
    const onKeyDown = vi.fn();
    const projected = toReactPartProps<Snap>(
      {
        role: 'slider',
        tabIndex: 0,
        cls: 'handle',
        disabled: true,
        hidden: false,
        hitSize: '28px',
        minWidth: '16px',
        onKeyDown,
      },
      {
        attributes: {
          role: 'role',
          tabIndex: 'tabindex',
          cls: 'class',
          disabled: 'aria-disabled',
          hidden: 'hidden',
        },
        styles: {
          hitSize: '--editor-handle-hit-size',
          minWidth: 'min-width',
        },
        events: {
          onKeyDown: 'keydown',
        },
      },
    );

    expect(projected).toEqual({
      role: 'slider',
      tabIndex: 0,
      className: 'handle',
      'aria-disabled': '',
      style: {
        '--editor-handle-hit-size': '28px',
        minWidth: '16px',
      },
      onKeyDown,
    });
  });

  it('executes createSyncActionPipeline guards, modifiers, handlers, observers, and once hooks', () => {
    const pipeline = createSyncActionPipeline<{ move: { delta: number; blocked?: boolean } }>('test-ui');
    const trace: string[] = [];

    pipeline.registerGuard(
      'move',
      (payload, controller) => {
        trace.push(`guard-high:${payload.delta}`);
        if (payload.blocked) controller.abort('locked');
      },
      { priority: 100 },
    );
    pipeline.registerGuard(
      'move',
      (_payload, controller) => {
        trace.push('guard-clamp');
        controller.modifyPayload(prev => ({ ...prev, delta: Math.min(prev.delta, 10) }));
      },
      { priority: 50 },
    );
    pipeline.register('move', payload => {
      trace.push(`exec:${payload.delta}`);
      return payload.delta * 2;
    });
    pipeline.registerObserver('move', (_p, meta) => trace.push(`obs-success:${meta.result}`), {
      when: 'success',
    });
    pipeline.registerObserver('move', (_p, meta) => trace.push(`obs-failure:${meta.abortReason}`), {
      when: 'failure',
    });
    pipeline.registerObserver('move', (_p, meta) => trace.push(`obs-always:${meta.aborted}`), {
      when: 'always',
      once: true,
    });

    const ok = pipeline.dispatch('move', { delta: 25 });
    expect(ok.success).toBe(true);
    expect(ok.payload.delta).toBe(10);
    expect(ok.result).toBe(20);
    expect(trace).toEqual(['guard-high:25', 'guard-clamp', 'exec:10', 'obs-success:20', 'obs-always:false']);

    trace.length = 0;
    const blocked = pipeline.dispatch('move', { delta: 5, blocked: true });
    expect(blocked.aborted).toBe(true);
    expect(blocked.abortReason).toBe('locked');
    expect(trace).toEqual(['guard-high:5', 'obs-failure:locked']);
  });

  it('retains once observers whose when filter did not match', () => {
    const pipeline = createSyncActionPipeline<{ submit: { ok: boolean } }>('once-filter');
    const calls: string[] = [];

    pipeline.registerGuard('submit', (payload, controller) => {
      if (!payload.ok) controller.abort('validation failed');
    });
    pipeline.register('submit', () => 'done');
    pipeline.registerObserver('submit', (_payload, meta) => {
      calls.push(`success:${String(meta.result)}`);
    }, { when: 'success', once: true });

    const aborted = pipeline.dispatch('submit', { ok: false });
    expect(aborted.aborted).toBe(true);
    expect(calls).toEqual([]);

    const succeeded = pipeline.dispatch('submit', { ok: true });
    expect(succeeded.success).toBe(true);
    expect(calls).toEqual(['success:done']);

    const secondSuccess = pipeline.dispatch('submit', { ok: true });
    expect(secondSuccess.success).toBe(true);
    expect(calls).toEqual(['success:done']);
  });

  it('navigates items with createRovingFocusController while skipping disabled items', () => {
    let activeId = 'tab-1';
    const roving = createRovingFocusController({
      orientation: 'horizontal',
      loop: true,
      getItems: () => [
        { id: 'tab-1' },
        { id: 'tab-2', disabled: true },
        { id: 'tab-3' },
      ],
      getActiveId: () => activeId,
      onFocusChange: nextId => {
        activeId = nextId;
      },
    });

    expect([roving.getTabIndex('tab-1'), roving.getTabIndex('tab-2'), roving.getTabIndex('tab-3')]).toEqual([0, -1, -1]);
    const next = roving.handleKeyDown('tab-1', { key: 'ArrowRight' });
    expect(next).toBe('tab-3');
    expect(activeId).toBe('tab-3');

    const wrapped = roving.handleKeyDown('tab-3', { key: 'ArrowRight' });
    expect(wrapped).toBe('tab-1');
    expect(roving.handleKeyDown('tab-1', { key: 'End' })).toBe('tab-3');
    expect(roving.handleKeyDown('tab-3', { key: 'Home' })).toBe('tab-1');

    const noLoop = createRovingFocusController({
      orientation: 'vertical',
      loop: false,
      getItems: () => [{ id: 'a' }, { id: 'b' }],
      getActiveId: () => 'b',
    });
    expect(noLoop.handleKeyDown('b', { key: 'ArrowDown' })).toBe('b');
    expect(noLoop.handleKeyDown('b', { key: 'ArrowRight' })).toBeNull();
  });

  it('tracks capture, modifiers, commit, guard rejection, and Escape cancel in createPointerGestureSession', () => {
    const events: string[] = [];
    const target = {
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    };

    let rejectStart = true;
    const session = createPointerGestureSession({
      onStart: snap => {
        events.push(`start:${snap.startX},${snap.startY}`);
        return !rejectStart;
      },
      onMove: snap => events.push(`move:${snap.deltaX},${snap.deltaY}:shift=${snap.modifiers.shiftKey}`),
      onCommit: snap => events.push(`commit:${snap.deltaX},${snap.deltaY}`),
      onCancel: (_snap, reason) => events.push(`cancel:${reason}`),
    });

    expect(session.start({ pointerId: 1, button: 0, clientX: 10, clientY: 20, currentTarget: target })).toBe(false);
    expect(session.isActive()).toBe(false);

    rejectStart = false;
    expect(session.start({ pointerId: 2, button: 0, clientX: 10, clientY: 20, currentTarget: target })).toBe(true);
    expect(target.setPointerCapture).toHaveBeenCalledWith(2);
    expect(session.move({ pointerId: 2, clientX: 35, clientY: 5, shiftKey: true })).toBe(true);
    expect(session.commit({ pointerId: 2, clientX: 40, clientY: 10 })).toBe(true);
    expect(target.releasePointerCapture).toHaveBeenCalledWith(2);
    expect(session.isActive()).toBe(false);
    expect(events).toEqual([
      'start:10,20',
      'start:10,20',
      'move:25,-15:shift=true',
      'commit:30,-10',
    ]);

    events.length = 0;
    expect(session.start({ pointerId: 3, clientX: 0, clientY: 0, currentTarget: target })).toBe(true);
    expect(session.handleKeyDown({ key: 'Escape' })).toBe(true);
    expect(session.isActive()).toBe(false);
    expect(target.releasePointerCapture).toHaveBeenCalledWith(3);
    expect(events).toEqual(['start:0,0', 'cancel:escape']);
  });

  it('supports virtual aria-activedescendant, null-start navigation, and label typeahead in createRovingFocusController', () => {
    let activeId: string | null = null;
    const roving = createRovingFocusController({
      orientation: 'vertical',
      loop: true,
      typeahead: true,
      typeaheadTimeoutMs: 500,
      getItems: () => [
        { id: 'new', label: 'New File' },
        { id: 'save', label: 'Save' },
        { id: 'share', label: 'Share' },
        { id: 'locked', label: 'Secret', disabled: true },
        { id: 'del', label: 'Delete' },
      ],
      getActiveId: () => activeId,
      onFocusChange: nextId => {
        activeId = nextId;
      },
    });

    expect(roving.getActiveDescendant('opt-')).toBeUndefined();
    expect(roving.handleKeyDown(null, { key: 'ArrowDown' })).toBe('new');
    expect(roving.getActiveDescendant('opt-')).toBe('opt-new');

    activeId = null;
    expect(roving.handleKeyDown(null, { key: 'ArrowUp' })).toBe('del');
    expect(roving.getActiveDescendant('opt-')).toBe('opt-del');

    // Fresh 's' jumps to 'save', repeated 's' cycles to 'share' (skipping disabled 'Secret')
    expect(roving.handleKeyDown(activeId, { key: 's' })).toBe('save');
    expect(roving.handleKeyDown(activeId, { key: 's' })).toBe('share');

    // Reset typeahead, then type multi-character prefix 'de' -> 'del'
    roving.resetTypeahead();
    expect(roving.handleKeyDown(activeId, { key: 'd' })).toBe('del');
    expect(roving.handleKeyDown(activeId, { key: 'e' })).toBe('del');

    // Control key combos and unmatched chars do not hijack navigation
    expect(roving.handleKeyDown(activeId, { key: 's', ctrlKey: true })).toBeNull();
    expect(roving.handleKeyDown(activeId, { key: 'z' })).toBeNull();
    expect(roving.move('first')).toBe('new');
  });

  it('coordinates LIFO escape and outside-pointer dismissal across stacked createDismissLayer instances', () => {
    const outerEl = document.createElement('div');
    const innerInput = document.createElement('input');
    const innerPopup = document.createElement('ul');
    const outsideEl = document.createElement('button');
    outerEl.append(innerInput, innerPopup);
    document.body.append(outerEl, outsideEl);

    const outerDismiss = vi.fn<(reason: DismissReason) => void>();
    const innerDismiss = vi.fn<(reason: DismissReason) => void>();

    const outer = createDismissLayer({
      enabled: true,
      getContainers: () => [outerEl],
      onDismiss: reason => outerDismiss(reason),
    });
    const inner = createDismissLayer({
      enabled: true,
      getContainers: () => [innerInput, innerPopup],
      onDismiss: reason => innerDismiss(reason),
    });

    expect(outer.active).toBe(true);
    expect(outer.isTopMost).toBe(false);
    expect(inner.active).toBe(true);
    expect(inner.isTopMost).toBe(true);

    // Click inside inner input -> neither layer dismisses
    innerInput.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(innerDismiss).not.toHaveBeenCalled();
    expect(outerDismiss).not.toHaveBeenCalled();

    // Click inside outer container (outside inner) -> only top-most inner dismisses
    outerEl.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(innerDismiss).toHaveBeenCalledTimes(1);
    expect(innerDismiss).toHaveBeenLastCalledWith('outside-pointer');
    expect(outerDismiss).not.toHaveBeenCalled();

    // Escape while both active -> only top-most inner dismisses
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(innerDismiss).toHaveBeenCalledTimes(2);
    expect(innerDismiss).toHaveBeenLastCalledWith('escape');
    expect(outerDismiss).not.toHaveBeenCalled();

    // Deactivate inner -> outer becomes top-most and receives next outside click + Escape
    inner.deactivate();
    expect(outer.isTopMost).toBe(true);

    outsideEl.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, cancelable: true }));
    expect(outerDismiss).toHaveBeenCalledTimes(1);
    expect(outerDismiss).toHaveBeenLastCalledWith('outside-pointer');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    expect(outerDismiss).toHaveBeenCalledTimes(2);
    expect(outerDismiss).toHaveBeenLastCalledWith('escape');

    inner.dispose();
    outer.dispose();
    outerEl.remove();
    outsideEl.remove();
    expect(outer.active).toBe(false);
    expect(outer.isTopMost).toBe(false);
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
