import { hydrateLit } from '../../src/hydrate.js';
import { HydrationProbeElement } from './probe-element.js';

interface HydrationContract {
  readonly target: HydrationProbeElement;
  readonly shadowBefore: ShadowRoot | null;
  readonly shadowAfter: ShadowRoot | null;
  readonly serverPart: string | null;
  readonly serverData: string | null;
  readonly clicks: number[];
}

declare global {
  interface Window {
    __litHydrationContract?: HydrationContract;
  }
}

const host = document.getElementById('host');
const status = document.getElementById('status');

if (!(host instanceof HTMLElement) || !status) {
  throw new Error('Hydration fixture is missing #host or #status');
}

const target = host.querySelector<HydrationProbeElement>('lit-hydration-probe');
if (!(target instanceof HydrationProbeElement)) {
  throw new Error('Server-rendered lit-hydration-probe was not found');
}

// Capture the declarative shadow root before hydration.
const shadowBefore = target.shadowRoot;
const serverPart = shadowBefore?.querySelector('[part="ruler"]')?.getAttribute('data-testid') ?? null;
const serverData = shadowBefore?.querySelector('[data-testid="data"]')?.getAttribute('data-input') ?? null;

const clicks: number[] = [];
target.addEventListener('count-change', (event) => {
  clicks.push((event as CustomEvent<{ count: number }>).detail.count);
});

const clientElement = new HydrationProbeElement();
clientElement.label = 'client';
clientElement.input = { from: 'client' };

hydrateLit(host, clientElement);
await target.updateComplete;

window.__litHydrationContract = {
  target,
  shadowBefore,
  shadowAfter: target.shadowRoot,
  serverPart,
  serverData,
  clicks,
};

const countNode = target.shadowRoot?.querySelector('[data-testid="data"]');
if (countNode) {
  target.addEventListener('count-change', () => {
    status.dataset.count = String(target.count);
  });
}

status.dataset.ready = 'true';
