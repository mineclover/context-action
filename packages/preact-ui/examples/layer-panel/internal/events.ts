import type { SelectionRequestDetail } from '../public.js';

/** DOM CustomEvent is the only public event path for both adapters. */
export function emitSelectionRequest(host: HTMLElement, id: string): void {
  if (!host.isConnected) return;
  const EventConstructor = host.ownerDocument.defaultView?.CustomEvent;
  if (!EventConstructor) return;
  host.dispatchEvent(new EventConstructor<SelectionRequestDetail>('selection-request', {
    detail: Object.freeze({ id }), bubbles: true, composed: true, cancelable: false,
  }));
}
