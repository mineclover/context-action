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
