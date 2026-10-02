import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'preact/test-utils';
import { defineLayerPanel } from '../examples/layer-panel/define.js';
import { mountLayerPanel } from '../examples/layer-panel/mount.js';

const items = [
  { id: 'one', name: 'One' },
  { id: 'two', name: 'Two' },
] as const;

let tag = 0;
afterEach(() => document.body.replaceChildren());

describe('layer-panel public contract', () => {
  it('keeps selection controlled and emits one request without programmatic echo', async () => {
    const Tag = defineLayerPanel(`test-layer-panel-${++tag}`);
    const element = new Tag();
    const requests: string[] = [];
    element.addEventListener('selection-request', event => {
      requests.push((event as CustomEvent<{ id: string }>).detail.id);
    });
    element.items = items;
    element.selectedId = 'one';
    document.body.append(element);

    const buttons = element.shadowRoot?.querySelectorAll('button');
    expect(buttons?.length).toBe(2);
    expect(buttons?.[0]?.getAttribute('aria-pressed')).toBe('true');
    expect(element.selectedId).toBe('one');

    await act(() => { (buttons?.[1] as HTMLButtonElement).click(); });
    expect(requests).toEqual(['two']);
    expect(element.selectedId).toBe('one');

    element.selectedId = 'two';
    expect(element.shadowRoot?.querySelectorAll('button')[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(requests).toEqual(['two']);
  });

  it('rejects invalid input before changing the committed snapshot', () => {
    const Tag = defineLayerPanel(`test-layer-panel-${++tag}`);
    const element = new Tag();
    element.items = items;
    expect(() => { element.items = [{ id: 'one', name: 'duplicate' }, { id: 'one', name: 'again' }]; }).toThrow();
    expect(element.items).toEqual(items);
    expect(() => { element.disabled = 'false' as unknown as boolean; }).toThrow(TypeError);
    expect(element.disabled).toBe(false);
  });

  it('ends a connection session on disconnect and reconnects from the latest snapshot', async () => {
    const Tag = defineLayerPanel(`test-layer-panel-${++tag}`);
    const element = new Tag();
    element.items = items;
    document.body.append(element);
    element.remove();
    expect(element.focusItem('one')).toBe(false);
    element.selectedId = 'two';
    document.body.append(element);
    expect(element.shadowRoot?.querySelectorAll('button')[1]?.getAttribute('aria-pressed')).toBe('true');
    expect(element.focusItem('two')).toBe(true);
  });

  it('restores properties assigned before custom-element upgrade', () => {
    const name = `test-layer-panel-${++tag}`;
    const pending = document.createElement(name) as HTMLElement & {
      items: readonly { id: string; name: string }[];
      selectedId: string | null;
    };
    pending.items = items;
    pending.selectedId = 'two';
    document.body.append(pending);
    defineLayerPanel(name);
    expect(pending.items).toEqual(items);
    expect(pending.selectedId).toBe('two');
    expect(pending.shadowRoot?.querySelectorAll('button')[1]?.getAttribute('aria-pressed')).toBe('true');
  });

  it('provides the same semantic contract through a template island', async () => {
    const host = document.createElement('div');
    const template = document.createElement('template');
    template.innerHTML = '<section><h2>Layers</h2><div data-preact-root></div></section>';
    const panel = mountLayerPanel(host, template, { items, selectedId: 'one' });
    document.body.append(host);
    const requests: string[] = [];
    host.addEventListener('selection-request', event => {
      requests.push((event as CustomEvent<{ id: string }>).detail.id);
    });
    const button = host.querySelectorAll('button')[1] as HTMLButtonElement;
    await act(() => { button.click(); });
    expect(requests).toEqual(['two']);
    expect(panel.selectedId).toBe('one');
    panel.selectedId = 'two';
    expect(host.querySelectorAll('button')[1]?.getAttribute('aria-pressed')).toBe('true');
    panel.destroy();
    expect(host.childNodes).toHaveLength(0);
    expect(() => { panel.items = []; }).toThrow('destroyed');

    const remounted = mountLayerPanel(host, template, { items, selectedId: 'one' });
    expect(host.querySelectorAll('button')).toHaveLength(2);
    remounted.destroy();
  });
});
