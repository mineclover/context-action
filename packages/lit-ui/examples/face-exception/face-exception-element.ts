import { css, html, type PropertyValues } from 'lit';
import { FormAssociatedLitElement, type ValidityStateFlags } from '../../src/form-associated-element.js';

interface RejectionState {
  formValue: string;
  requestInvalid: boolean;
  rejectFormValue: boolean;
  rejectValidity: boolean;
  formValueRejected: boolean;
  validityRejected: boolean;
  nativeFormValue: string | null;
  nativeValid: boolean;
}

export interface FaceExceptionRunOptions {
  formValue: string;
  requestInvalid: boolean;
  rejectFormValue: boolean;
  rejectValidity: boolean;
}

export const DEFAULT_FACE_EXCEPTION_RUN: FaceExceptionRunOptions = {
  formValue: 'demo-value',
  requestInvalid: true,
  rejectFormValue: true,
  rejectValidity: true,
};

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

    code {
      border-radius: 0.25rem;
      background: #eef4ff;
      color: #2459a6;
      font-size: 0.9em;
      padding: 0.08rem 0.28rem;
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
      border: 1px solid #abefc6;
      border-radius: 999px;
      background: #ecfdf3;
      color: #067647;
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

      code {
        background: #172554;
        color: #bfdbfe;
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
        border-color: #05603a;
        background: #053321;
        color: #6ce9a6;
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
      ...DEFAULT_FACE_EXCEPTION_RUN,
      formValueRejected: false,
      validityRejected: false,
      nativeFormValue: null,
      nativeValid: true,
    };
    rejectionStates.set(this, state);

    return {
      form: null,
      validationMessage: '',
      willValidate: true,
      setFormValue: (value: string | FormData | Blob | null) => {
        if (state.rejectFormValue) {
          state.formValueRejected = true;
          throw new TypeError(`simulated ElementInternals.setFormValue rejection: ${String(value)}`);
        }
        state.nativeFormValue = typeof value === 'string' ? value : null;
      },
      setValidity: (flags?: ValidityStateFlags) => {
        if (state.rejectValidity) {
          state.validityRejected = true;
          throw new TypeError('simulated ElementInternals.setValidity rejection');
        }
        state.nativeValid = !Object.values(flags ?? {}).some(Boolean);
      },
      checkValidity: () => true,
      reportValidity: () => true,
      get validity() {
        return state.nativeValid ? validState() : { ...validState(), valid: false, valueMissing: true };
      },
    } as unknown as ElementInternals;
  }

  override firstUpdated(_changed: PropertyValues): void {
    this.run();
  }

  public run(options: Partial<FaceExceptionRunOptions> = {}): void {
    const state = rejectionStates.get(this);
    if (!state) return;

    Object.assign(state, DEFAULT_FACE_EXCEPTION_RUN, options, {
      formValueRejected: false,
      validityRejected: false,
      nativeFormValue: null,
      nativeValid: true,
    });

    this.setFormValue(state.formValue);
    this.setValidity(
      state.requestInvalid ? { valueMissing: true } : {},
      state.requestInvalid ? 'Required by the demo' : undefined,
    );
    queueMicrotask(() => this.requestUpdate());
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
      requestedValid: !state?.requestInvalid,
      reportedValid: this.validity.valid,
      nativeFormValue: state?.nativeFormValue ?? null,
      nativeValid: state?.nativeValid ?? true,
      formValueRejected: state?.formValueRejected ?? false,
      validityRejected: state?.validityRejected ?? false,
    };
  }

  override render() {
    const report = this.report;
    const formValueSummary = report.formValueRejected
      ? 'native 폼 값 거부 · fallback 유지'
      : 'native 폼 값 반영';
    const validitySummary = report.validityRejected
      ? 'native 유효성 거부 · 이전 상태 유지'
      : 'native 유효성 반영';
    return html`
      <section aria-label="FACE 예외 재현 결과">
        <header>
          <p class="eyebrow">네이티브 경계 테스트</p>
          <h2>실험 결과: 쓰기 거부와 상태 차이</h2>
        </header>
        <p class="description">
          아래 컨트롤에서 두 native 쓰기의 거부 여부를 바꿀 수 있습니다.
          현재 실행은 ${report.formValueRejected ? '폼 값 쓰기를 거부해 fallback 값만 유지하고' : '폼 값 쓰기를 반영해 native 값도 갱신하며'},
          ${report.validityRejected ? '유효성 쓰기를 거부해 native 유효성을 바꾸지 않습니다.' : '유효성 쓰기를 반영해 native 유효성을 요청 상태에 맞춥니다.'}
        </p>
        <div class="summary">
          <span class="summary-label">현재 관찰 요약</span>
          <span class="status-chip">${formValueSummary} · ${validitySummary}</span>
        </div>
        <dl>
          <div class="metric">
            <dt>fallback 폼 값</dt>
            <dd data-testid="fallback-form-value" data-state="ok">${report.fallbackFormValue}</dd>
          </div>
          <div class="metric">
            <dt>native 폼 값</dt>
            <dd data-testid="native-form-value" data-state="${report.nativeFormValue === null ? 'muted' : 'ok'}">${report.nativeFormValue ?? 'null'}</dd>
          </div>
          <div class="metric">
            <dt>요청한 유효성</dt>
            <dd data-testid="requested-valid" data-state="${report.requestedValid ? 'ok' : 'invalid'}">${String(report.requestedValid)}</dd>
          </div>
          <div class="metric">
            <dt>보고된 유효성</dt>
            <dd data-testid="reported-valid" data-state="${report.reportedValid ? 'ok' : 'invalid'}">${String(report.reportedValid)}</dd>
          </div>
          <div class="metric">
            <dt>네이티브 유효성</dt>
            <dd data-testid="native-valid" data-state="${report.nativeValid ? 'ok' : 'invalid'}">${String(report.nativeValid)}</dd>
          </div>
          <div class="metric">
            <dt><code>setFormValue</code> 거부</dt>
            <dd data-testid="form-value-rejected" data-state="${report.formValueRejected ? 'warning' : 'ok'}">${String(report.formValueRejected)}</dd>
          </div>
          <div class="metric">
            <dt><code>setValidity</code> 거부</dt>
            <dd data-testid="validity-rejected" data-state="${report.validityRejected ? 'warning' : 'ok'}">${String(report.validityRejected)}</dd>
          </div>
        </dl>
      </section>
    `;
  }
}
