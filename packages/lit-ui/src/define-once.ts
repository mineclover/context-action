/**
 * @fileoverview Idempotent custom element registration for the reference
 * components. ESM and CJS builds can both be loaded in one process, so an
 * unconditional `customElements.define()` would throw on the second load.
 *
 * @implements web-component-primitive
 * @memberof core-concepts
 */

export function defineCustomElement(
  tagName: string,
  elementConstructor: CustomElementConstructor,
): void {
  if (typeof customElements === 'undefined') return;
  if (customElements.get(tagName)) return;
  customElements.define(tagName, elementConstructor);
}
