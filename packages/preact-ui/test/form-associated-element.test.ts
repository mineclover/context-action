import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'preact';
import { signal } from '@preact/signals';
import { definePreactElement } from '../src/custom-element.js';

describe('Form-Associated Custom Elements (FACE)', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('declares static formAssociated and provides standard form properties', () => {
    const FaceTag = definePreactElement({
      tagName: 'test-face-input',
      formAssociated: true,
      setup(_element, _context) {
        return {
          view: () => null,
          getInput: () => undefined,
        };
      },
    });

    expect((FaceTag as any).formAssociated).toBe(true);

    const el = new FaceTag() as any;
    el.setAttribute('name', 'customerEmail');
    expect(el.name).toBe('customerEmail');
    expect(el.type).toBe('test-face-input');
    expect(typeof el.checkValidity).toBe('function');
    expect(typeof el.reportValidity).toBe('function');
    expect(typeof el.setCustomValidity).toBe('function');
  });

  it('dispatches onFormReset when form is reset', () => {
    const countSignal = signal(5);
    const onReset = vi.fn(() => {
      countSignal.value = 1;
    });

    const StepperTag = definePreactElement({
      tagName: 'test-stepper-face',
      formAssociated: true,
      setup(_element, context) {
        context.setFormValue(String(countSignal.value));
        return {
          view: () => null,
          getInput: () => countSignal.value,
          onFormReset: onReset,
        };
      },
    });

    const stepper = new StepperTag() as any;
    document.body.append(stepper);

    expect(countSignal.value).toBe(5);

    // Trigger formResetCallback
    stepper.formResetCallback();

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(countSignal.value).toBe(1);
  });

  it('handles formDisabledCallback and formStateRestoreCallback', () => {
    const onDisabled = vi.fn();
    const onRestore = vi.fn();

    const FaceTag = definePreactElement({
      tagName: 'test-face-callbacks',
      formAssociated: true,
      setup() {
        return {
          view: () => null,
          getInput: () => undefined,
          onFormDisabled: onDisabled,
          onFormStateRestore: onRestore,
        };
      },
    });

    const el = new FaceTag() as any;
    el.formDisabledCallback(true);
    expect(onDisabled).toHaveBeenCalledWith(true);

    el.formStateRestoreCallback('saved-val', 'restore');
    expect(onRestore).toHaveBeenCalledWith('saved-val', 'restore');
  });

  it('safely invokes setFormValue and setValidity without throwing', () => {
    let capturedContext: any;
    const FaceTag = definePreactElement({
      tagName: 'test-face-safe-calls',
      formAssociated: true,
      setup(_element, context) {
        capturedContext = context;
        return {
          view: () => null,
          getInput: () => undefined,
        };
      },
    });

    const el = new FaceTag() as any;
    document.body.append(el);

    expect(() => capturedContext.setFormValue('test-val')).not.toThrow();
    expect(() => capturedContext.setValidity({ valueMissing: true }, 'Please fill')).not.toThrow();
    expect(() => el.setCustomValidity('Invalid value')).not.toThrow();
  });

  it('treats dispose as terminal and rejects tag collisions', () => {
    const tag = 'test-face-terminal';
    let destroyed = 0;
    const FaceTag = definePreactElement({
      tagName: tag,
      setup() {
        return {
          view: () => null,
          getInput: () => undefined,
          onDestroy() { destroyed += 1; },
        };
      },
    });
    const element = new FaceTag() as HTMLElement & { dispose(): void };
    document.body.append(element);
    element.dispose();
    element.dispose();
    document.body.append(element);
    expect(destroyed).toBe(1);
    expect(element.shadowRoot?.querySelector('div')?.childNodes.length).toBe(0);
    expect(() => definePreactElement({ tagName: tag, setup: () => ({ view: () => null, getInput: () => undefined }) })).toThrow('already registered');
  });

  it('ignores attribute and form callbacks after terminal disposal', () => {
    const onAttributeChange = vi.fn();
    const onFormReset = vi.fn();
    const onFormDisabled = vi.fn();
    const onFormStateRestore = vi.fn();
    const FaceTag = definePreactElement({
      tagName: 'test-face-terminal-callbacks',
      observedAttributes: ['state'],
      formAssociated: true,
      setup() {
        return {
          view: () => null,
          getInput: () => undefined,
          onAttributeChange,
          onFormReset,
          onFormDisabled,
          onFormStateRestore,
        };
      },
    });

    const element = new FaceTag() as any;
    document.body.append(element);
    element.dispose();

    // Browsers may still deliver queued custom-element/form callbacks after
    // a host has explicitly disposed the element. They must not revive the
    // renderer or call adapter-owned lifecycle resources.
    element.attributeChangedCallback('state', null, 'late');
    element.formResetCallback();
    element.formDisabledCallback(true);
    element.formStateRestoreCallback('saved', 'restore');
    element.updateInput();

    expect(onAttributeChange).not.toHaveBeenCalled();
    expect(onFormReset).not.toHaveBeenCalled();
    expect(onFormDisabled).not.toHaveBeenCalled();
    expect(onFormStateRestore).not.toHaveBeenCalled();
    expect(element.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);
  });

  it('does not mount when onConnect disposes the element reentrantly', () => {
    const events: string[] = [];
    let reads = 0;
    const FaceTag = definePreactElement({
      tagName: 'test-face-connect-dispose',
      setup(owner) {
        return {
          view: () => h('span', null, 'should-not-mount'),
          getInput: () => {
            reads += 1;
            return undefined;
          },
          onConnect() {
            events.push('connect');
            (owner as HTMLElement & { dispose(): void }).dispose();
          },
          onDisconnect() { events.push('disconnect'); },
          onDestroy() { events.push('destroy'); },
        };
      },
    });

    const element = new FaceTag() as any;
    document.body.append(element);

    expect(events).toEqual(['connect', 'disconnect', 'destroy']);
    expect(reads).toBe(0);
    expect(element.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);
  });

  it('does not start a session when an upgraded property disposes the element', () => {
    const tag = 'test-face-upgrade-dispose';
    const element = document.createElement(tag) as HTMLElement & {
      value: string;
      dispose(): void;
    };
    element.value = 'pre-upgrade';

    let reads = 0;
    const FaceTag = definePreactElement({
      tagName: tag,
      upgradeProperties: ['value'],
      setup(owner) {
        Object.defineProperty(owner, 'value', {
          configurable: true,
          get: () => 'live',
          set: () => (owner as HTMLElement & { dispose(): void }).dispose(),
        });
        return {
          view: () => h('span', null, 'should-not-mount'),
          getInput: () => {
            reads += 1;
            return undefined;
          },
        };
      },
    });

    expect(FaceTag).toBeDefined();
    document.body.append(element);

    expect(reads).toBe(0);
    expect(element.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);
  });

  it('does not mount after onConnect disconnects and reconnects reentrantly', () => {
    const events: string[] = [];
    let firstConnection = true;
    let element: (HTMLElement & { dispose(): void }) | undefined;
    const FaceTag = definePreactElement({
      tagName: 'test-face-connect-disconnect',
      setup(owner) {
        element = owner as HTMLElement & { dispose(): void };
        return {
          view: ({ input }: { input: string }) => h('span', null, input),
          getInput: () => 'mounted',
          onConnect() {
            events.push('connect');
            if (firstConnection) {
              firstConnection = false;
              element?.remove();
            }
          },
          onDisconnect() { events.push('disconnect'); },
        };
      },
    });

    const instance = new FaceTag() as any;
    element = instance;
    document.body.append(instance);
    expect(events).toEqual(['connect', 'disconnect']);
    expect(instance.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);

    document.body.append(instance);
    expect(events).toEqual(['connect', 'disconnect', 'connect']);
    expect(instance.shadowRoot?.textContent).toBe('mounted');
  });

  it('does not mount when getInput disposes the element reentrantly', () => {
    const events: string[] = [];
    let reads = 0;
    const FaceTag = definePreactElement({
      tagName: 'test-face-input-dispose',
      setup(owner) {
        return {
          view: () => h('span', null, 'should-not-mount'),
          getInput: () => {
            reads += 1;
            (owner as HTMLElement & { dispose(): void }).dispose();
            return undefined;
          },
          onConnect() { events.push('connect'); },
          onDisconnect() { events.push('disconnect'); },
          onDestroy() { events.push('destroy'); },
        };
      },
    });

    const element = new FaceTag() as any;
    document.body.append(element);

    expect(events).toEqual(['connect', 'disconnect', 'destroy']);
    expect(reads).toBe(1);
    expect(element.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);
  });

  it('creates and releases a connection session on every reconnect', () => {
    const events: string[] = [];
    const FaceTag = definePreactElement({
      tagName: 'test-face-session',
      setup() {
        return {
          view: () => null,
          getInput: () => undefined,
          onConnect() { events.push('connect'); },
          onDisconnect() { events.push('disconnect'); },
        };
      },
    });
    const element = new FaceTag() as HTMLElement & { dispose(): void };
    document.body.append(element);
    element.remove();
    document.body.append(element);
    element.dispose();
    expect(events).toEqual(['connect', 'disconnect', 'connect', 'disconnect']);
  });

  it('terminates the connection session when updateInput rendering fails', () => {
    let label = 'ready';
    const events: string[] = [];
    const FailureTag = definePreactElement({
      tagName: 'test-face-update-failure',
      setup() {
        return {
          view: ({ input }: { input: { label: string } }) => {
            if (input.label === 'fail') throw new Error('custom element render failed');
            return h('span', null, input.label);
          },
          getInput: () => ({ label }),
          onConnect() { events.push('connect'); },
          onDisconnect() { events.push('disconnect'); },
        };
      },
    });

    const element = new FailureTag() as HTMLElement & { updateInput(): void };
    document.body.append(element);
    label = 'fail';

    expect(() => element.updateInput()).toThrow('custom element render failed');
    expect(events).toEqual(['connect', 'disconnect']);
    expect(element.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);

    // The failed update leaves no stale mount/session. A later reconnect can
    // claim the same root and render exactly one replacement child.
    label = 'recovered';
    element.remove();
    document.body.append(element);
    expect(events).toEqual(['connect', 'disconnect', 'connect']);
    expect(element.shadowRoot?.textContent).toBe('recovered');
    element.remove();
  });

  it('uses the same failed-session cleanup for observed attribute updates', () => {
    let label = 'ready';
    const events: string[] = [];
    const FailureTag = definePreactElement({
      tagName: 'test-face-attribute-failure',
      observedAttributes: ['state'],
      setup() {
        return {
          view: ({ input }: { input: { label: string } }) => {
            if (input.label === 'fail') throw new Error('attribute render failed');
            return h('span', null, input.label);
          },
          getInput: () => ({ label }),
          onConnect() { events.push('connect'); },
          onDisconnect() { events.push('disconnect'); },
          onAttributeChange(_name, _oldValue, newValue) {
            label = newValue ?? 'ready';
          },
        };
      },
    });

    const element = new FailureTag();
    document.body.append(element);
    label = 'fail';

    // Invoke the lifecycle callback directly so the test can inspect the
    // synchronous error; browsers report custom-element callback exceptions
    // through their error event instead of propagating from setAttribute().
    expect(() => (element as any).attributeChangedCallback('state', null, 'fail'))
      .toThrow('attribute render failed');
    expect(events).toEqual(['connect', 'disconnect']);
    expect(element.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);
  });

  it('runs permanent destruction even when disconnect cleanup fails', () => {
    let disconnects = 0;
    let destroys = 0;
    const FailureTag = definePreactElement({
      tagName: 'test-face-dispose-failure',
      setup() {
        return {
          view: () => h('span', null, 'ready'),
          getInput: () => undefined,
          onDisconnect() {
            disconnects += 1;
            throw new Error('disconnect failed');
          },
          onDestroy() {
            destroys += 1;
            throw new Error('destroy failed');
          },
        };
      },
    });

    const element = new FailureTag() as HTMLElement & { dispose(): void };
    document.body.append(element);

    expect(() => element.dispose()).toThrow(AggregateError);
    expect(disconnects).toBe(1);
    expect(destroys).toBe(1);
    expect(element.shadowRoot?.querySelector('div')?.childNodes).toHaveLength(0);

    // dispose is terminal and idempotent even when the first cleanup reports
    // multiple failures.
    expect(() => element.dispose()).not.toThrow();
    element.remove();
    expect(disconnects).toBe(1);
    expect(destroys).toBe(1);
  });
});
