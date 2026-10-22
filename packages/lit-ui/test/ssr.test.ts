// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { LitElement, html, css } from 'lit';
import {
  hydrateLit,
  renderLitElement,
  renderLitElementAsync,
  renderLitTemplate,
  renderLitTemplateAsync,
} from '../src/ssr.js';

class SsrProbeElement extends LitElement {
  static styles = css`
    [part='ruler'] {
      color: red;
    }
  `;

  static properties = {
    label: { type: String, reflect: true },
    input: { attribute: false },
  };

  label = 'default';
  input: Record<string, unknown> = {};

  override render() {
    return html`
      <div part="ruler" data-testid="ruler">${this.label}</div>
      <div part="item" data-kind="track">${JSON.stringify(this.input)}</div>
    `;
  }
}

if (!customElements.get('ssr-probe-element')) {
  customElements.define('ssr-probe-element', SsrProbeElement);
}

class ReflectiveProbeElement extends LitElement {
  static properties = {
    disabled: { type: Boolean, reflect: true },
    count: { type: Number, reflect: true },
    code: {
      reflect: true,
      attribute: 'data-code',
      converter: {
        fromAttribute(value: string | null) {
          return value ?? '';
        },
        toAttribute(value: string) {
          return `code-${value}`;
        },
      },
    },
  };

  disabled = true;
  count = 0;
  code = 'x';

  override render() {
    return html`<span part="data">${this.disabled}:${this.count}:${this.code}</span>`;
  }
}

if (!customElements.get('reflective-probe-element')) {
  customElements.define('reflective-probe-element', ReflectiveProbeElement);
}

describe('lit-ui SSR entry', () => {
  it('renders a Lit template to a string without browser globals', () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');

    const output = renderLitTemplate(
      html`<section part="scroll" data-testid="timeline">
        <div part="row">Row</div>
      </section>`,
    );

    expect(output).toContain('part="scroll"');
    expect(output).toContain('data-testid="timeline"');
    expect(output).toContain('part="row"');
  });

  it('preserves part and data-* contracts while rendering a LitElement instance', () => {
    const element = new SsrProbeElement();
    element.label = 'Server rendered';
    element.input = { nested: { value: 1 } };

    const output = renderLitElement(element);

    expect(output).toContain('<ssr-probe-element');
    expect(output).toContain('label="Server rendered"');
    expect(output).toContain('<template shadowroot="open"');
    expect(output).toContain('<style>');
    expect(output).toContain("[part='ruler']");
    expect(output).toContain('part="ruler"');
    expect(output).toContain('data-testid="ruler"');
    expect(output).toContain('part="item"');
    expect(output).toContain('data-kind="track"');
    expect(output).toContain('Server rendered');
    expect(output).toContain('{&quot;nested&quot;:{&quot;value&quot;:1}}');
  });

  it('escapes host attributes without double-encoding decoded values', () => {
    const element = new SsrProbeElement();
    element.setAttribute('data-label', 'a"b&c<d');

    const output = renderLitElement(element);

    expect(output).toContain('data-label="a&quot;b&amp;c&lt;d"');
    expect(output).not.toContain('a&quot;b&amp;quot;c');
  });

  it('reflects boolean, numeric, and custom-converter properties as host attributes', () => {
    const element = new ReflectiveProbeElement();
    element.disabled = true;
    element.count = 0;
    element.code = 'ready';

    const output = renderLitElement(element);

    expect(output).toMatch(/\sdisabled(?:\s|>|=)/u);
    expect(output).toContain('count="0"');
    expect(output).toContain('data-code="code-ready"');
  });

  it('omits a false reflected boolean attribute', () => {
    const element = new ReflectiveProbeElement();
    element.disabled = false;

    const output = renderLitElement(element);

    expect(output).not.toContain('disabled=');
  });

  it('serializes light DOM children for slot projection by default', () => {
    const element = new SsrProbeElement();
    element.innerHTML = '<span slot="label" data-slot="label">Projected</span>';

    const output = renderLitElement(element);

    expect(output).toContain('slot="label"');
    expect(output).toContain('data-slot="label"');
    expect(output).toContain('Projected');
  });

  it('can omit light DOM children explicitly', () => {
    const element = new SsrProbeElement();
    element.innerHTML = '<span data-slot="label">Projected</span>';

    const output = renderLitElement(element, { includeLightDom: false });

    expect(output).not.toContain('data-slot="label"');
  });

  it('re-exports hydrateLit from the ssr entry for backward compatibility', () => {
    expect(typeof hydrateLit).toBe('function');
  });

  it('serializes complex properties as Lit property bindings, not attributes', () => {
    const element = new SsrProbeElement();
    element.input = { a: 1 };

    const output = renderLitElement(element);

    // The object is bound to the server-side element and rendered by its own
    // template; it is never stringified into a host attribute.
    expect(output).not.toContain('input="[object Object]"');
    expect(output).toContain('{&quot;a&quot;:1}');
  });

  it('supports explicit property lists and attribute omission', () => {
    const element = new SsrProbeElement();
    element.label = 'Explicit';
    element.input = { ignored: true };
    element.setAttribute('data-testid', 'server-element');

    const output = renderLitElement(element, {
      properties: ['label'],
      includeAttributes: false,
    });

    expect(output).toContain('Explicit');
    expect(output).not.toContain('data-testid="server-element"');
  });

  it('provides async variants for asynchronous renderer chunks', async () => {
    const templateOutput = await renderLitTemplateAsync(html`<div part="data">async</div>`);
    expect(templateOutput).toContain('part="data"');

    const element = new SsrProbeElement();
    element.label = 'async element';
    const elementOutput = await renderLitElementAsync(element);
    expect(elementOutput).toContain('async element');
  });

  it('produces the same markup through the async renderer', async () => {
    const template = html`<div part="data">async</div>`;
    expect(await renderLitTemplateAsync(template)).toBe(renderLitTemplate(template));
  });

  it('rejects non-template values with a descriptive error', () => {
    expect(() => renderLitTemplate({} as never)).toThrow(TypeError);
  });

  it('rejects unregistered elements', () => {
    class UnregisteredElement extends LitElement {
      override render() {
        return html`<div></div>`;
      }
    }

    expect(() => renderLitElement(new UnregisteredElement())).toThrow(
      /registered custom element/,
    );
  });
});
