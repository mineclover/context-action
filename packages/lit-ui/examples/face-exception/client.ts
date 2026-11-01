import {
  DEFAULT_FACE_EXCEPTION_RUN,
  FaceExceptionProbeElement,
  type FaceExceptionRunOptions,
} from './face-exception-element.js';

if (!customElements.get('lit-face-exception-probe')) {
  customElements.define('lit-face-exception-probe', FaceExceptionProbeElement);
}

const status = document.querySelector<HTMLElement>('#status');
const reportState = document.querySelector<HTMLElement>('#report-state');
const probe = document.querySelector<FaceExceptionProbeElement>('lit-face-exception-probe');
const controls = document.querySelector<HTMLElement>('#controls');
const formValueInput = document.querySelector<HTMLInputElement>('#form-value');
const requestInvalidInput = document.querySelector<HTMLInputElement>('#request-invalid');
const rejectFormValueInput = document.querySelector<HTMLInputElement>('#reject-form-value');
const rejectValidityInput = document.querySelector<HTMLInputElement>('#reject-validity');
const resetButton = document.querySelector<HTMLButtonElement>('#reset-controls');
if (
  !status ||
  !probe ||
  !controls ||
  !formValueInput ||
  !requestInvalidInput ||
  !rejectFormValueInput ||
  !rejectValidityInput ||
  !resetButton
) {
  throw new Error('FACE exception demo is missing required controls or probe element');
}
const statusElement = status;
const probeElement = probe;
const formValueControl = formValueInput;
const requestInvalidControl = requestInvalidInput;
const rejectFormValueControl = rejectFormValueInput;
const rejectValidityControl = rejectValidityInput;
const resetControl = resetButton;

const diagnostics: string[] = [];

function renderReport(report: FaceExceptionProbeElement['report']): void {
  statusElement.textContent = JSON.stringify({ ...report, diagnostics }, null, 2);
  statusElement.dataset.ready = 'true';
  if (reportState) {
    reportState.textContent = diagnostics.length
      ? `진단 작업 ${diagnostics.length}건 수집됨`
      : 'probe 실행 완료';
  }
}

function readOptions(): FaceExceptionRunOptions {
  return {
    formValue: formValueControl.value,
    requestInvalid: requestInvalidControl.checked,
    rejectFormValue: rejectFormValueControl.checked,
    rejectValidity: rejectValidityControl.checked,
  };
}

function run(options: FaceExceptionRunOptions): void {
  diagnostics.length = 0;
  probeElement.run(options);
}

function resetControls(): void {
  formValueControl.value = DEFAULT_FACE_EXCEPTION_RUN.formValue;
  requestInvalidControl.checked = DEFAULT_FACE_EXCEPTION_RUN.requestInvalid;
  rejectFormValueControl.checked = DEFAULT_FACE_EXCEPTION_RUN.rejectFormValue;
  rejectValidityControl.checked = DEFAULT_FACE_EXCEPTION_RUN.rejectValidity;
  run(DEFAULT_FACE_EXCEPTION_RUN);
}

formValueControl.addEventListener('input', () => run(readOptions()));
requestInvalidControl.addEventListener('change', () => run(readOptions()));
rejectFormValueControl.addEventListener('change', () => run(readOptions()));
rejectValidityControl.addEventListener('change', () => run(readOptions()));

resetControl.addEventListener('click', resetControls);

probeElement.addEventListener('form-internals-error', (event) => {
  diagnostics.push((event as CustomEvent<{ operation: string }>).detail.operation);
  renderReport(probeElement.report);
});

probeElement.addEventListener('face-exception-report', (event) => {
  renderReport((event as CustomEvent<FaceExceptionProbeElement['report']>).detail);
});
