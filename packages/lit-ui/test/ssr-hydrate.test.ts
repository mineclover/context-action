import { beforeEach, describe, expect, it } from 'vitest';
import { LitElement, css, html } from 'lit';
import { hydrateLit } from '../src/hydrate.js';
import { renderLitElement, renderLitTemplate } from '../src/ssr.js';

const probeTemplate = (label: string) => html`
  <div part="ruler" data-testid="ruler">${label}</div>
`;

class HydrateProbeElement extends LitElement {
  static styles = css`
    [part='ruler'] {
      color: red;
    }
  `;

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

const styledListTemplate = (items: readonly string[]) => html`
  ${items.map(
    item => html`<div class="tl-item" part="item" data-item=${item}>${item}</div>`,
  )}
`;

class StyledListElement extends LitElement {
  static styles = css`
    .tl-item {
      color: red;
    }
  `;

  static properties = {
    items: { attribute: false },
  };

  items: readonly string[] = ['one', 'two', 'three'];

  override render() {
    return styledListTemplate(this.items);
  }
}

if (!customElements.get('styled-list-element')) {
  customElements.define('styled-list-element', StyledListElement);
}

class MethodEventElement extends LitElement {
  static properties = {
    count: { type: Number },
  };

  count = 0;

  increment(): void {
    this.count += 1;
  }

  override render() {
    return html`<button data-testid="method-increment" @click=${this.increment}>${this.count}</button>`;
  }
}

if (!customElements.get('method-event-element')) {
  customElements.define('method-event-element', MethodEventElement);
}

const serverShadowMarkup = (element: LitElement): string => {
  const parsed = document.createElement('div');
  parsed.innerHTML = renderLitElement(element);
  const template = parsed.querySelector('template[shadowrootmode]');
  if (!(template instanceof HTMLTemplateElement)) {
    throw new Error('SSR fixture did not produce a declarative shadow root template');
  }
  return template.innerHTML;
};

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

  it('adopts static-styles SSR markup in an element own shadow root', async () => {
    const serverElement = new StyledListElement();
    const element = new StyledListElement();
    const shadow = element.attachShadow({ mode: 'open' });
    shadow.innerHTML = serverShadowMarkup(serverElement);

    expect(shadow.firstElementChild?.localName).toBe('style');
    const serverItems = Array.from(shadow.querySelectorAll('.tl-item'));
    expect(serverItems).toHaveLength(3);

    document.body.append(element);
    hydrateLit(shadow, element);
    await element.updateComplete;

    const hydratedItems = Array.from(shadow.querySelectorAll('.tl-item'));
    expect(hydratedItems).toHaveLength(3);
    expect(hydratedItems).toEqual(serverItems);
    expect(shadow.querySelectorAll('.tl-item')).toHaveLength(3);
    expect(shadow.firstElementChild?.localName).toBe('style');

    element.remove();
  });

  it('keeps multiple static style nodes before the Lit root marker', async () => {
    const serverElement = new StyledListElement();
    const element = new StyledListElement();
    const shadow = element.attachShadow({ mode: 'open' });
    shadow.innerHTML = `<style data-extra-style>.tl-item { display: block; }</style>${serverShadowMarkup(serverElement)}`;

    const serverItems = Array.from(shadow.querySelectorAll('.tl-item'));
    expect(shadow.querySelectorAll('style')).toHaveLength(2);
    expect(serverItems).toHaveLength(3);

    document.body.append(element);
    hydrateLit(shadow, element);
    await element.updateComplete;

    expect(shadow.querySelectorAll('.tl-item')).toHaveLength(3);
    expect(shadow.querySelectorAll('style')).toHaveLength(2);
    expect(shadow.querySelector('[data-extra-style]')).not.toBeNull();
    expect(Array.from(shadow.querySelectorAll('.tl-item'))).toEqual(serverItems);

    element.remove();
  });

  it('preserves Lit render options for method event handlers', async () => {
    const serverElement = new MethodEventElement();
    const element = new MethodEventElement();
    const shadow = element.attachShadow({ mode: 'open' });
    shadow.innerHTML = serverShadowMarkup(serverElement);

    document.body.append(element);
    hydrateLit(shadow, element);
    await element.updateComplete;

    shadow.querySelector<HTMLButtonElement>('[data-testid="method-increment"]')?.click();
    await element.updateComplete;

    expect(element.count).toBe(1);
    expect(shadow.querySelector('[data-testid="method-increment"]')?.textContent).toBe('1');

    element.remove();
  });

  it.each(['own-shadow', 'host-container'] as const)(
    'repairs an actual duplicate client render via %s and remains reactive', async mode => {
      const element = new StyledListElement();
      const shadow = element.attachShadow({ mode: 'open' });
      shadow.innerHTML = `<style data-extra-style>.tl-item { display: block; }</style>\n${serverShadowMarkup(new StyledListElement())}`;
      const serverItems = Array.from(shadow.querySelectorAll('.tl-item'));
      const serverStyles = Array.from(shadow.querySelectorAll('style'));
      expect(serverItems).toHaveLength(3);

      // Bypass automatic hydration to deterministically exercise recovery from
      // a client render already appended beside the server tree.
      Object.defineProperty(element, 'createRenderRoot', {
        configurable: true,
        value: () => shadow,
      });
      container.append(element);
      await element.updateComplete;
      expect(shadow.querySelectorAll('.tl-item')).toHaveLength(6);

      const hydrateRoot = mode === 'own-shadow' ? shadow : container;
      const hydrateElement = mode === 'own-shadow' ? element : new StyledListElement();
      hydrateLit(hydrateRoot, hydrateElement);
      await element.updateComplete;

      const hydratedItems = Array.from(shadow.querySelectorAll('.tl-item'));
      expect(hydratedItems).toHaveLength(3);
      hydratedItems.forEach((item, index) => expect(item).toBe(serverItems[index]));
      expect(Array.from(shadow.querySelectorAll('style'))).toEqual(serverStyles);

      // Repeated hydration must not re-adopt the already live server part.
      expect(() => hydrateLit(hydrateRoot, hydrateElement)).not.toThrow();
      await element.updateComplete;
      expect(shadow.querySelectorAll('.tl-item')).toHaveLength(3);

      element.items = ['updated', 'two', 'three', 'four'];
      await element.updateComplete;
      expect(Array.from(shadow.querySelectorAll('.tl-item'), item => item.textContent))
        .toEqual(['updated', 'two', 'three', 'four']);
      expect(shadow.querySelector('.tl-item')).toBe(serverItems[0]);

      element.remove();
    },
  );

  it('rejects invalid inputs', () => {
    expect(() => hydrateLit(null as never, new HydrateProbeElement())).toThrow(TypeError);
    expect(() => hydrateLit(container, null as never)).toThrow(TypeError);
  });
});
