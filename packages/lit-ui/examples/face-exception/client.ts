import { FaceExceptionProbeElement } from './face-exception-element.js';

if (!customElements.get('lit-face-exception-probe')) {
  customElements.define('lit-face-exception-probe', FaceExceptionProbeElement);
}

const status = document.querySelector<HTMLElement>('#status');
const reportState = document.querySelector<HTMLElement>('#report-state');
const probe = document.querySelector<FaceExceptionProbeElement>('lit-face-exception-probe');
if (!status || !probe) throw new Error('FACE exception demo is missing #status or probe element');
const statusElement = status;

const diagnostics: string[] = [];

function renderReport(report: FaceExceptionProbeElement['report']): void {
  statusElement.textContent = JSON.stringify({ ...report, diagnostics }, null, 2);
  statusElement.dataset.ready = 'true';
  if (reportState) {
    reportState.textContent = diagnostics.length
      ? `${diagnostics.length} diagnostic operation${diagnostics.length === 1 ? '' : 's'} captured`
      : 'Probe completed';
  }
}

probe.addEventListener('form-internals-error', (event) => {
  diagnostics.push((event as CustomEvent<{ operation: string }>).detail.operation);
  renderReport(probe.report);
});

probe.addEventListener('face-exception-report', (event) => {
  renderReport((event as CustomEvent<FaceExceptionProbeElement['report']>).detail);
});
