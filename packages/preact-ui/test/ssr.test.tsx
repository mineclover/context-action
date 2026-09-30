import { describe, expect, it } from 'vitest';
import { hydratePreact } from '../src/index.js';
import { createSSR } from '../src/ssr.js';

function View({ input }: { input: { label: string } }) {
  return <button type="button">{input.label}</button>;
}

describe('SSR and hydration boundaries', () => {
  it('renders through the server-only entry without touching browser globals', () => {
    const html = createSSR(View).render({ label: 'Server label' });
    expect(html).toContain('Server label');
    expect(html).toContain('<button');
  });

  it('hydrates only a populated root and preserves the root owner contract', () => {
    const host = document.createElement('div');
    host.innerHTML = '<button type="button">Server label</button>';
    const instance = hydratePreact(host, View, { label: 'Server label' });
    expect(host.textContent).toBe('Server label');
    instance.update({ label: 'Updated label' });
    expect(host.textContent).toBe('Updated label');
    instance.destroy();
    expect(host.childNodes.length).toBe(0);
    expect(() => hydratePreact(document.createElement('div'), View, { label: 'empty' })).toThrow('server-rendered');
  });
});
