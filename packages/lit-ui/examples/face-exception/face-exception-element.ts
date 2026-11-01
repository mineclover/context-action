import { css, html, type PropertyValues } from 'lit';
import { FormAssociatedLitElement, type ValidityStateFlags } from '../../src/form-associated-element.js';

interface RejectionState {
  formValueRejected: boolean;
  validityRejected: boolean;
  nativeFormValue: string | null;
  nativeValid: boolean;
}

const rejectionStates = new WeakMap<FaceExceptionProbeElement, RejectionState>();

const validState = (): ValidityState => ({
  badInput: false,
  customError: false,
  patternMismatch: false,
  rangeOverflow: false,
  rangeUnderflow: false,
  stepMismatch: false,
  tooLong: false,
  tooShort: false,
  typeMismatch: false,
  valid: true,
  valueMissing: false,
});

/**
 * Minimal FACE exception reproduction.
 *
 * The fake internals intentionally reject native writes. The base class catches
 * the errors, making the requested state and the reported native state diverge.
 */
export class FaceExceptionProbeElement extends FormAssociatedLitElement {
  static styles = css`
    :host {
      display: block;
      color: #172033;
    }

    section {
      display: grid;
      gap: 1.1rem;
      padding: clamp(1.1rem, 3vw, 1.6rem);
      border: 1px solid #b8c7dc;
      border-radius: 1rem;
      background: linear-gradient(135deg, #ffffff, #f4f8ff);
      box-shadow: 0 0.75rem 1.8rem rgb(36 89 166 / 0.1);
    }

    header {
      display: grid;
      gap: 0.35rem;
    }

    .eyebrow {
      margin: 0;
      color: #2459a6;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    h2 {
      margin: 0;
      color: #101828;
      font-size: clamp(1.2rem, 2vw, 1.45rem);
      letter-spacing: -0.02em;
      line-height: 1.2;
    }

    .description {
      max-width: 72ch;
      margin: 0;
      color: #475467;
      font-size: 0.92rem;
    }

    .summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding-bottom: 0.1rem;
    }

    .summary-label {
      color: #667085;
      font-size: 0.78rem;
      font-weight: 600;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.65rem;
      border: 1px solid #f5c2c7;
      border-radius: 999px;
      background: #fff1f2;
      color: #b42318;
      font-size: 0.76rem;
      font-weight: 700;
      white-space: nowrap;
    }

    .status-chip::before {
      width: 0.45rem;
      height: 0.45rem;
      border-radius: 50%;
      background: currentColor;
      content: '';
    }

    dl {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.65rem;
      margin: 0;
    }

    .metric {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
      padding: 0.75rem 0.85rem;
      border: 1px solid #e4e7ec;
      border-radius: 0.7rem;
      background: rgb(255 255 255 / 0.78);
    }

    dt {
      color: #667085;
      font-size: 0.76rem;
      font-weight: 600;
      line-height: 1.35;
    }

    dd {
      margin: 0;
      overflow-wrap: anywhere;
      color: #101828;
      font: 600 0.93rem/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    dd[data-state='ok'] {
      color: #067647;
    }

    dd[data-state='warning'] {
      color: #b54708;
    }

    dd[data-state='invalid'] {
      color: #b42318;
    }

    dd[data-state='muted'] {
      color: #667085;
    }

    @media (prefers-color-scheme: dark) {
      :host {
        color: #e4e7ec;
      }

      section {
        border-color: #344054;
        background: linear-gradient(135deg, #111c31, #101828);
        box-shadow: 0 0.75rem 1.8rem rgb(0 0 0 / 0.2);
      }

      .eyebrow {
        color: #93c5fd;
      }

      h2,
      dd {
        color: #f9fafb;
      }

      .description,
      .summary-label,
      dt,
      dd[data-state='muted'] {
        color: #98a2b3;
      }

      .metric {
        border-color: #344054;
        background: rgb(2 6 23 / 0.4);
      }

      dd[data-state='ok'] {
        color: #6ce9a6;
      }

      dd[data-state='warning'] {
        color: #fdb022;
      }

      dd[data-state='invalid'] {
        color: #fda29b;
      }

      .status-chip {
        border-color: #7a271a;
        background: #451e1a;
        color: #fda29b;
      }
    }

    @media (max-width: 560px) {
      dl {
        grid-template-columns: 1fr;
      }

      .summary {
        align-items: flex-start;
        flex-direction: column;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        scroll-behavior: auto !important;
        transition-duration: 0.01ms !important;
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
      }
    }
  `;

  public name = 'face-probe';

  override attachInternals(): ElementInternals {
    const state: RejectionState = {
      formValueRejected: false,
      validityRejected: false,
      nativeFormValue: null,
      nativeValid: true,
    };
    rejectionStates.set(this, state);

    return {
      form: null,
      validity: validState(),
      validationMessage: '',
      willValidate: true,
      setFormValue: (value: string | FormData | Blob | null) => {
        state.formValueRejected = true;
        throw new TypeError(`simulated ElementInternals.setFormValue rejection: ${String(value)}`);
      },
      setValidity: (_flags?: ValidityStateFlags) => {
        state.validityRejected = true;
        throw new TypeError('simulated ElementInternals.setValidity rejection');
      },
      checkValidity: () => true,
      reportValidity: () => true,
    } as unknown as ElementInternals;
  }

  override firstUpdated(_changed: PropertyValues): void {
    this.setFormValue('demo-value');
    this.setValidity({ valueMissing: true }, 'Required by the demo');
    this.dispatchReport();
  }

  private dispatchReport(): void {
    const state = rejectionStates.get(this);
    if (!state) return;
    this.dispatchEvent(new CustomEvent('face-exception-report', {
      bubbles: true,
      composed: true,
      detail: this.report,
    }));
  }

  get report() {
    const state = rejectionStates.get(this);
    return {
      fallbackFormValue: this.getFormValue(),
      requestedValid: false,
      reportedValid: this.validity.valid,
      nativeFormValue: state?.nativeFormValue ?? null,
      nativeValid: state?.nativeValid ?? true,
      formValueRejected: state?.formValueRejected ?? false,
      validityRejected: state?.validityRejected ?? false,
    };
  }

  override render() {
    const report = this.report;
    return html`
      <section aria-label="FACE exception reproduction">
        <header>
          <p class="eyebrow">Native boundary probe</p>
          <h2>Rejected ElementInternals writes</h2>
        </header>
        <p class="description">
          The simulated native internals reject both writes. The base class catches
          the errors: the requested invalid state is not reflected by the reported
          native validity, while the fallback form value still shows the requested value.
        </p>
        <div class="summary">
          <span class="summary-label">Current observation</span>
          <span class="status-chip">Fallback preserved · diagnostics emitted</span>
        </div>
        <dl>
          <div class="metric">
            <dt>Fallback form value</dt>
            <dd data-testid="fallback-form-value" data-state="ok">${report.fallbackFormValue}</dd>
          </div>
          <div class="metric">
            <dt>Native form value</dt>
            <dd data-testid="native-form-value" data-state="${report.nativeFormValue === null ? 'muted' : 'ok'}">${report.nativeFormValue ?? 'null'}</dd>
          </div>
          <div class="metric">
            <dt>Requested valid</dt>
            <dd data-testid="requested-valid" data-state="${report.requestedValid ? 'ok' : 'invalid'}">${String(report.requestedValid)}</dd>
          </div>
          <div class="metric">
            <dt>Reported valid</dt>
            <dd data-testid="reported-valid" data-state="${report.reportedValid ? 'ok' : 'invalid'}">${String(report.reportedValid)}</dd>
          </div>
          <div class="metric">
            <dt>Native valid</dt>
            <dd data-testid="native-valid" data-state="${report.nativeValid ? 'ok' : 'invalid'}">${String(report.nativeValid)}</dd>
          </div>
          <div class="metric">
            <dt>setFormValue rejected</dt>
            <dd data-testid="form-value-rejected" data-state="${report.formValueRejected ? 'warning' : 'ok'}">${String(report.formValueRejected)}</dd>
          </div>
          <div class="metric">
            <dt>setValidity rejected</dt>
            <dd data-testid="validity-rejected" data-state="${report.validityRejected ? 'warning' : 'ok'}">${String(report.validityRejected)}</dd>
          </div>
        </dl>
      </section>
    `;
  }
}
