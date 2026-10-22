import { beforeEach, describe, expect, it } from 'vitest';
import { LitElement, html } from 'lit';
import { hydrateLit } from '../src/hydrate.js';
import { renderLitTemplate } from '../src/ssr.js';

const probeTemplate = (label: string) => html`
  <div part="ruler" data-testid="ruler">${label}</div>
`;

class HydrateProbeElement extends LitElement {
  static properties = {
    label: { type: String },
  };

  label = 'initial';

  override render() {
    return probeTemplate(this.label);
  }
}

if (!customElements.get('hydrate-probe-element')) {
  customElements.define('hydrate-probe-element', HydrateProbeElement);
}

describe('hydrateLit', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.append(container);
  });

  it('hydrates existing Lit SSR markup without replacing its DOM nodes', () => {
    container.innerHTML = renderLitTemplate(probeTemplate('initial'));

    const existingNode = container.querySelector('[data-testid="ruler"]');
    expect(existingNode).not.toBeNull();

    const element = new HydrateProbeElement();
    hydrateLit(container, element);

    // The same DOM node survives hydration: parts were adopted, not re-rendered.
    expect(container.querySelector('[data-testid="ruler"]')).toBe(existingNode);
    expect(container.textContent).toContain('initial');
    expect(container.querySelector('[part="ruler"]')).not.toBeNull();
  });

  it('is idempotent when the same template root is hydrated twice', () => {
    container.innerHTML = renderLitTemplate(probeTemplate('initial'));
    const existingNode = container.querySelector('[data-testid="ruler"]');
    const element = new HydrateProbeElement();

    hydrateLit(container, element);
    expect(() => hydrateLit(container, element)).not.toThrow();

    expect(container.querySelector('[data-testid="ruler"]')).toBe(existingNode);
    expect(container.querySelectorAll('[data-testid="ruler"]')).toHaveLength(1);
  });

  it('mounts the element when the target root has no server markup', async () => {
    const element = new HydrateProbeElement();

    hydrateLit(container, element);
    await element.updateComplete;

    expect(container.contains(element)).toBe(true);
    expect(element.shadowRoot).not.toBeNull();
    expect(element.shadowRoot?.querySelector('[part="ruler"]')).not.toBeNull();
  });

  it('connects a server-rendered custom element host for the same tag', async () => {
    document.body.append(container);
    const serverHost = document.createElement('hydrate-probe-element');
    container.append(serverHost);

    hydrateLit(container, new HydrateProbeElement());
    await (serverHost as HydrateProbeElement).updateComplete;

    expect(container.querySelector('hydrate-probe-element')).toBe(serverHost);
    expect(serverHost.shadowRoot?.querySelector('[part="ruler"]')).not.toBeNull();
  });

  it('reuses an existing declarative shadow root instead of attaching a second one', async () => {
    document.body.append(container);
    const serverHost = document.createElement('hydrate-probe-element');
    const existingShadow = serverHost.attachShadow({ mode: 'open' });
    existingShadow.innerHTML = renderLitTemplate(probeTemplate('server'));
    container.append(serverHost);

    hydrateLit(container, new HydrateProbeElement());
    await (serverHost as HydrateProbeElement).updateComplete;

    expect(serverHost.shadowRoot).toBe(existingShadow);
    expect(existingShadow.querySelector('[part="ruler"]')).not.toBeNull();
  });

  it('hydrates an element own shadow root without duplicating content', async () => {
    const element = new HydrateProbeElement();
    const shadow = element.attachShadow({ mode: 'open' });
    shadow.innerHTML = renderLitTemplate(probeTemplate('shadow'));

    document.body.append(element);
    hydrateLit(shadow, element);
    await element.updateComplete;

    expect(element.shadowRoot).toBe(shadow);
    expect(shadow.querySelectorAll('[data-testid="ruler"]')).toHaveLength(1);
    expect(shadow.textContent).toContain('shadow');

    element.remove();
  });

  it('rejects invalid inputs', () => {
    expect(() => hydrateLit(null as never, new HydrateProbeElement())).toThrow(TypeError);
    expect(() => hydrateLit(container, null as never)).toThrow(TypeError);
  });
});
