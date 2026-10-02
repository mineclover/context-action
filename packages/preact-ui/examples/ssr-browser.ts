import { h } from 'preact';
import { hydratePreact } from '../src/hydrate.js';

interface BrowserInput {
  readonly label: string;
}

const host = document.querySelector<HTMLElement>('#ssr-host');
const status = document.querySelector<HTMLOutputElement>('#ssr-status');
if (!host || !status) throw new Error('SSR browser fixture is incomplete');

let clicks = 0;
function View({ input }: { input: BrowserInput }) {
  return h('button', {
    type: 'button',
    onClick: () => {
      clicks += 1;
      status.dataset.clicks = String(clicks);
    },
  }, input.label);
}

const instance = hydratePreact(host, View, { label: 'Server label' });
instance.update({ label: 'Client label' });
status.dataset.ready = 'true';
status.textContent = host.textContent ?? '';

(window as typeof window & {
  ssrBrowserContract?: { destroy(): void };
}).ssrBrowserContract = {
  destroy() {
    instance.destroy();
    status.dataset.destroyed = 'true';
    status.textContent = host.textContent ?? '';
  },
};
