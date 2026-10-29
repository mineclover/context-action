import { createReactElementBridge } from '@context-action/core/element/react';
import * as React from 'react';
import type { ElementBridgeContract, ReactElementComponent } from '@context-action/core/element/react';

export { createElementFacade } from './facade.js';
export type { ImperativeHandleFactory, PublicActionMethods } from './facade.js';

export interface CustomElementBridgeOptions<
  // Preserve the existing public generic constraint.
  Props extends Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
> extends ElementBridgeContract<Props, Element, Handle> {}

export type CustomElementComponent<Props, Element extends HTMLElement, Handle = Element> =
  ReactElementComponent<Props, Element, Handle>;

export function createCustomElementBridge<
  // Preserve the existing public generic defaults.
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
>(options: CustomElementBridgeOptions<Props, Element, Handle>): CustomElementComponent<Props, Element, Handle> {
  // Preserve Preact's existing fail-fast assignment policy; Lit keeps its
  // existing best-effort policy. Omission cleanup remains best-effort in both.
  const bridge = createReactElementBridge(React, options, 'throw');
  bridge.displayName = `CustomElementBridge(${options.tagName})`;
  return bridge;
}
