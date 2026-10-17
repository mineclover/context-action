/**
 * @module ssr
 *
 * Purpose:
 *   Provides a pure server-side HTML string renderer (`createSSR`) for Preact
 *   views that share the `{ input: Input }` contract with `hydratePreact`.
 *
 * Invariants:
 *   - Never accesses `window`, `document`, or `customElements` so it can run
 *     in Node/Edge/Worker environments without DOM globals.
 */
import { createElement } from 'preact';
import type { ComponentType } from 'preact';
import { renderToString } from 'preact-render-to-string';

export type SSRView<Input> = ComponentType<{ input: Input }>;

export interface SSRRenderer<Input> {
  render(input: Input): string;
}

/** Server-only renderer. It does not access document, window, or Custom Elements. */
export function createSSR<Input>(View: SSRView<Input>): SSRRenderer<Input> {
  return {
    render(input) {
      return renderToString(createElement(View, { input }));
    },
  };
}
