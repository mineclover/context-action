import { html, type PropertyValues } from 'lit';
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
        <h2>FACE exception reproduction</h2>
        <p>
          The simulated native internals reject both writes. The base class catches
          the errors: the requested invalid state is not reflected by the reported
          native validity, while the fallback form value still shows the requested value.
        </p>
        <dl>
          <dt>Fallback form value</dt><dd data-testid="fallback-form-value">${report.fallbackFormValue}</dd>
          <dt>Native form value</dt><dd data-testid="native-form-value">${report.nativeFormValue ?? 'null'}</dd>
          <dt>Requested valid</dt><dd data-testid="requested-valid">${String(report.requestedValid)}</dd>
          <dt>Reported valid</dt><dd data-testid="reported-valid">${String(report.reportedValid)}</dd>
          <dt>Native valid</dt><dd data-testid="native-valid">${String(report.nativeValid)}</dd>
          <dt>setFormValue rejected</dt><dd data-testid="form-value-rejected">${String(report.formValueRejected)}</dd>
          <dt>setValidity rejected</dt><dd data-testid="validity-rejected">${String(report.validityRejected)}</dd>
        </dl>
      </section>
    `;
  }
}
