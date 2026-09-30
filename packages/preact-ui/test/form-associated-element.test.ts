import { afterEach, describe, expect, it, vi } from 'vitest';
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
});
