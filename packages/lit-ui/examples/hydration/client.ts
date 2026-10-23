import { hydrateLit } from '../../src/hydrate.js';
import { HydrationProbeElement } from './probe-element.js';

interface HydrationContract {
  readonly target: HydrationProbeElement;
  readonly shadowBefore: ShadowRoot | null;
  readonly shadowAfter: ShadowRoot | null;
  readonly serverPart: string | null;
  readonly serverData: string | null;
  readonly serverItemCount: number;
  readonly itemCount: number;
  readonly preservedItems: boolean;
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
if (!shadowBefore) {
  throw new Error('Server-rendered shadow root was not adopted');
}
const serverPart = shadowBefore.querySelector('[part="ruler"]')?.getAttribute('data-testid') ?? null;
const serverData = shadowBefore.querySelector('[data-testid="data"]')?.getAttribute('data-input') ?? null;
const serverItems = Array.from(shadowBefore.querySelectorAll('.tl-item'));

const clicks: number[] = [];
target.addEventListener('count-change', (event) => {
  clicks.push((event as CustomEvent<{ count: number }>).detail.count);
});

// Exercise the own-shadow-root hydration contract, including static styles.
hydrateLit(shadowBefore, target);
await target.updateComplete;

const hydratedItems = Array.from(shadowBefore.querySelectorAll('.tl-item'));
window.__litHydrationContract = {
  target,
  shadowBefore,
  shadowAfter: target.shadowRoot,
  serverPart,
  serverData,
  serverItemCount: serverItems.length,
  itemCount: hydratedItems.length,
  preservedItems:
    hydratedItems.length === serverItems.length &&
    hydratedItems.every((item, index) => item === serverItems[index]),
  clicks,
};

status.dataset.count = String(target.count);
status.dataset.ready = 'true';
