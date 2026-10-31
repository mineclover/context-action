import { FaceExceptionProbeElement } from './face-exception-element.js';

if (!customElements.get('lit-face-exception-probe')) {
  customElements.define('lit-face-exception-probe', FaceExceptionProbeElement);
}

const status = document.querySelector<HTMLElement>('#status');
const probe = document.querySelector<FaceExceptionProbeElement>('lit-face-exception-probe');
if (!status || !probe) throw new Error('FACE exception demo is missing #status or probe element');

probe.addEventListener('face-exception-report', (event) => {
  status.textContent = JSON.stringify((event as CustomEvent).detail, null, 2);
  status.dataset.ready = 'true';
});
