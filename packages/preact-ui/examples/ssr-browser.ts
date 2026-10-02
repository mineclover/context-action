import { h } from 'preact';
import { definePreactElement } from '../src/custom-element.js';
import { hydratePreact } from '../src/hydrate.js';

interface BrowserInput {
  readonly label: string;
}

const host = document.querySelector<HTMLElement>('#ssr-host');
const status = document.querySelector<HTMLOutputElement>('#ssr-status');
if (!host || !status) throw new Error('SSR browser fixture is incomplete');
const statusElement = status;

let clicks = 0;
function View({ input }: { input: BrowserInput }) {
  return h('button', {
    type: 'button',
    onClick: () => {
      clicks += 1;
      statusElement.dataset.clicks = String(clicks);
    },
  }, input.label);
}

const instance = hydratePreact(host, View, { label: 'Server label' });
instance.update({ label: 'Client label' });

const DsdTag = definePreactElement({
  tagName: 'x-ssr-widget',
  hydrateShadowRoot: true,
  setup() {
    return {
      view: ({ input }: { input: BrowserInput }) => h('button', {
        type: 'button',
        onClick: () => { statusElement.dataset.dsdClicks = '1'; },
      }, input.label),
      getInput: () => ({ label: 'DSD client label' }),
    };
  },
});
const dsdHost = document.querySelector('x-ssr-widget');
if (!(dsdHost instanceof DsdTag)) throw new Error('DSD custom element did not upgrade');

statusElement.dataset.ready = 'true';
statusElement.textContent = host.textContent ?? '';

(window as typeof window & {
  ssrBrowserContract?: { destroy(): void };
}).ssrBrowserContract = {
  destroy() {
    instance.destroy();
    statusElement.dataset.destroyed = 'true';
    statusElement.textContent = host.textContent ?? '';
  },
};
