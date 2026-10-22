import { LitElement, css, html } from 'lit';
import type { ReactiveController } from 'lit';

class ConnectionMarker implements ReactiveController {
  readonly #host: LitElement;

  constructor(host: LitElement) {
    this.#host = host;
    host.addController(this);
  }

  hostConnected(): void {
    this.#host.setAttribute('data-controller-connected', 'true');
  }

  hostDisconnected(): void {
    this.#host.removeAttribute('data-controller-connected');
  }
}

/**
 * Browser E2E fixture for declarative shadow DOM hydration.
 *
 * `label` is reflected so the server markup carries it as an attribute, which
 * lets the browser upgrade the host with the same initial state.
 */
export class HydrationProbeElement extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    [part='ruler'] {
      font-weight: 700;
    }
  `;

  static properties = {
    label: { type: String, reflect: true },
    input: { attribute: false },
    count: { type: Number, state: true },
  };

  label = 'default';
  input: Record<string, unknown> = {};
  count = 0;

  readonly connectionMarker = new ConnectionMarker(this);

  override render() {
    return html`
      <div part="ruler" data-testid="ruler">${this.label}</div>
      <div part="data" data-testid="data" data-input=${JSON.stringify(this.input)}>
        ${this.count}
      </div>
      <button part="button" data-testid="increment" @click=${this.#increment}>+</button>
      <slot name="suffix"></slot>
    `;
  }

  increment(): void {
    this.#increment();
  }

  #increment = (): void => {
    this.count += 1;
    this.dispatchEvent(
      new CustomEvent('count-change', {
        bubbles: true,
        composed: true,
        detail: { count: this.count },
      }),
    );
  };
}

if (!customElements.get('lit-hydration-probe')) {
  customElements.define('lit-hydration-probe', HydrationProbeElement);
}
