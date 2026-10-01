import { describe, expect, it } from 'vitest';
import { hydratePreact, mountPreact } from '../src/index.js';
import { createSSR } from '../src/ssr.js';

function View({ input }: { input: { label: string } }) {
  return <button type="button">{input.label}</button>;
}

function FailingView({ input }: { input: { label: string } }) {
  if (input.label === 'fail') throw new Error('hydrated render failed');
  return <span>{input.label}</span>;
}

describe('SSR and hydration boundaries', () => {
  it('renders through the server-only entry without touching browser globals', () => {
    const html = createSSR(View).render({ label: 'Server label' });
    expect(html).toContain('Server label');
    expect(html).toContain('<button');
  });

  it('hydrates only a populated root and preserves the root owner contract', () => {
    const host = document.createElement('div');
    host.innerHTML = createSSR(View).render({ label: 'Server label' });
    const instance = hydratePreact(host, View, { label: 'Server label' });
    expect(host.textContent).toBe('Server label');
    instance.update({ label: 'Updated label' });
    expect(host.textContent).toBe('Updated label');
    instance.destroy();
    expect(host.childNodes.length).toBe(0);
    expect(() => hydratePreact(document.createElement('div'), View, { label: 'empty' })).toThrow('server-rendered');
  });

  it('reconciles a server/client text mismatch without leaking a second tree', () => {
    const host = document.createElement('div');
    host.innerHTML = '<button type="button">Stale server label</button>';
    const instance = hydratePreact(host, View, { label: 'Client label' });
    expect(host.querySelectorAll('button')).toHaveLength(1);
    expect(host.textContent).toBe('Client label');
    instance.destroy();
  });

  it('terminates and releases ownership when an update render fails', () => {
    const host = document.createElement('div');
    host.innerHTML = '<span>Server label</span>';
    const instance = hydratePreact(host, FailingView, { label: 'Server label' });

    expect(() => instance.update({ label: 'fail' })).toThrow('hydrated render failed');
    expect(instance.destroyed).toBe(true);
    expect(host.childNodes).toHaveLength(0);
    expect(() => instance.update({ label: 'again' })).toThrow('destroyed');
    expect(() => instance.destroy()).not.toThrow();

    // A failed hydration must release the root so its owner can be replaced
    // without retaining the stale server node or creating duplicate children.
    const replacement = mountPreact(host, FailingView, { label: 'recovered' });
    expect(host.querySelectorAll('span')).toHaveLength(1);
    expect(host.textContent).toBe('recovered');
    replacement.destroy();
  });

  it('cleans the root and lease when the initial hydration render fails', () => {
    const host = document.createElement('div');
    host.innerHTML = '<span>Server label</span>';

    expect(() => hydratePreact(host, FailingView, { label: 'fail' }))
      .toThrow('hydrated render failed');
    expect(host.childNodes).toHaveLength(0);

    const replacement = mountPreact(host, FailingView, { label: 'recovered' });
    expect(host.querySelectorAll('span')).toHaveLength(1);
    replacement.destroy();
  });
});
