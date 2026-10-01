import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'preact/test-utils';
import { useLayoutEffect } from 'preact/hooks';
import { signal } from '@preact/signals';
import { createDispatchContext } from '@context-action/preact';
import { createDisposalScope, hydratePreact, mountPreact, mountTemplate } from '../src/index.js';
import { defineCounterElement } from '../examples/web-component/counter-element.js';

let cleanup: Array<() => void> = [];
afterEach(() => {
  const scope = createDisposalScope();
  for (const dispose of cleanup) scope.add(dispose);
  cleanup = [];
  try { scope.dispose(); } finally { document.body.replaceChildren(); }
});
function root() {
  const element = document.createElement('div');
  document.body.append(element);
  return element;
}
function view({ input }: { input: string }) { return <output>{input}</output>; }
let tag = 0;

describe('owned runtime roots', () => {
  it('updates only children and preserves its host root', () => {
    const host = root();
    const instance = mountPreact<string>(host, view, 'one');
    cleanup.push(() => instance.destroy());
    instance.update('two');
    expect(host.textContent).toBe('two');
    instance.destroy(); instance.destroy();
    expect(host.isConnected).toBe(true);
    expect(host.childNodes.length).toBe(0);
    expect(() => instance.update('three')).toThrow('destroyed');
  });
  it('rejects duplicate, populated, and overlapping light-DOM roots', () => {
    const host = root();
    const instance = mountPreact(host, view, 'one');
    cleanup.push(() => instance.destroy());
    expect(() => mountPreact(host, view, 'two')).toThrow('owns');
    const child = host.querySelector('output');
    if (!child) throw new Error('Expected output');
    expect(() => mountPreact(child, view, 'nested')).toThrow('owns');
    const populated = root(); populated.textContent = 'keep';
    expect(() => mountPreact(populated, view, 'replace')).toThrow('empty');
    expect(populated.textContent).toBe('keep');
  });
  it('rejects hydration of a light-DOM parent containing a managed child root', () => {
    const parent = root();
    const child = document.createElement('div');
    parent.append(child);
    const instance = mountPreact(child, view, 'child');
    expect(() => hydratePreact(parent, view, 'server')).toThrow('owns');
    expect(child.textContent).toBe('child');
    instance.destroy();
  });
  it('unmounts Preact effects and permits a fresh instance afterwards', () => {
    let disposals = 0;
    function View() {
      useLayoutEffect(() => () => { disposals++; }, []);
      return <span>mounted</span>;
    }
    const host = root();
    const instance = mountPreact(host, View, undefined);
    cleanup.push(() => instance.destroy());
    instance.destroy(); instance.destroy();
    expect(disposals).toBe(1);
    const next = mountPreact(host, view, 'again');
    cleanup.push(() => next.destroy());
    expect(host.textContent).toBe('again');
  });
  it('updates a direct signal binding', async () => {
    const host = root();
    const count = signal(1);
    const instance = mountPreact(host, () => <output>{count}</output>, undefined);
    cleanup.push(() => instance.destroy());
    await act(() => { count.value = 2; });
    expect(host.textContent).toBe('2');
  });
  it('keeps template siblings intact and removes only its cloned shell', () => {
    const host = root(); const before = document.createElement('aside');
    host.append(before);
    const template = document.createElement('template');
    template.innerHTML = '<section><header>Static</header><div data-preact-root></div></section>';
    const instance = mountTemplate<string>(host, template, view, 'one');
    cleanup.push(() => instance.destroy());
    const header = host.querySelector('header');
    instance.update('two');
    expect(host.querySelector('header')).toBe(header);
    instance.destroy();
    expect(host.childNodes.length).toBe(1);
    expect(host.firstChild).toBe(before);
  });
  it('does not insert a template with ambiguous roots', () => {
    const host = root(); const template = document.createElement('template');
    template.innerHTML = '<div data-preact-root></div><div data-preact-root></div>';
    expect(() => mountTemplate(host, template, view, 'x')).toThrow('exactly one');
    expect(host.childNodes.length).toBe(0);
  });
  it('requires a dispatch Provider and preserves the borrowed dispatcher', () => {
    const context = createDispatchContext<{ increment: void }>('Counter');
    let observed: unknown;
    function Consumer() { observed = context.useDispatch(); return null; }
    const missing = root();
    expect(() => mountPreact(missing, Consumer, undefined)).toThrow('Provider');
    const dispatch = async () => {};
    const instance = mountPreact(missing, () => (
      <context.Provider dispatch={dispatch}><Consumer /></context.Provider>
    ), undefined);
    cleanup.push(() => instance.destroy());
    expect(observed).toBe(dispatch);
  });
});

describe('custom element boundary template', () => {
  it('retains state on reconnect and does not echo programmatic updates', async () => {
    const Element = defineCounterElement(`test-counter-${++tag}`);
    const element = new Element();
    cleanup.push(() => element.remove());
    let events = 0;
    element.addEventListener('value-change', () => { events++; });
    element.value = 7;
    document.body.append(element);
    expect(events).toBe(0);
    await act(() => { element.shadowRoot?.querySelector('button')?.click(); });
    expect(element.value).toBe(8);
    expect(events).toBe(1);
    element.remove(); element.value = 9;
    expect(element.focusIncrement()).toBe(false);
    document.body.append(element);
    expect(element.shadowRoot?.querySelector('output')?.textContent).toBe('9');
    expect(events).toBe(1);
  });
  it('preserves a pre-upgrade property and interprets disabled as a boolean attribute', async () => {
    const name = `test-counter-${++tag}`;
    const pending = document.createElement(name) as HTMLElement & { value: number };
    pending.value = 12;
    pending.setAttribute('disabled', 'false'); // Presence means true.
    document.body.append(pending);
    cleanup.push(() => pending.remove());
    defineCounterElement(name);
    expect(pending.value).toBe(12);
    expect(pending.shadowRoot?.querySelector('button')?.disabled).toBe(true);
    await act(() => { pending.removeAttribute('disabled'); });
    expect(pending.shadowRoot?.querySelector('button')?.disabled).toBe(false);
  });
});
