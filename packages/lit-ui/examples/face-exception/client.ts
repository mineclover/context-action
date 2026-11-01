import { FaceExceptionProbeElement } from './face-exception-element.js';

if (!customElements.get('lit-face-exception-probe')) {
  customElements.define('lit-face-exception-probe', FaceExceptionProbeElement);
}

const status = document.querySelector<HTMLElement>('#status');
const probe = document.querySelector<FaceExceptionProbeElement>('lit-face-exception-probe');
if (!status || !probe) throw new Error('FACE exception demo is missing #status or probe element');

const diagnostics: string[] = [];
probe.addEventListener('form-internals-error', (event) => {
  diagnostics.push((event as CustomEvent<{ operation: string }>).detail.operation);
  status.textContent = JSON.stringify({ ...probe.report, diagnostics }, null, 2);
  status.dataset.ready = 'true';
});

probe.addEventListener('face-exception-report', (event) => {
  status.textContent = JSON.stringify({
    ...(event as CustomEvent).detail,
    diagnostics,
  }, null, 2);
  status.dataset.ready = 'true';
});
