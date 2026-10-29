import type { ElementBridgeConfig, ElementBridgeContract, ReactElementComponent } from '@context-action/core/element/react';
import { createReactElementBridge } from '@context-action/core/element/react';
import * as React from 'react';

export type { ImperativeHandleFactory, PublicActionMethods } from './facade.js';
export { createElementFacade } from './facade.js';

export interface LitBridgeConfig<
  Props extends object,
  // Annotated LitBridgeConfig<Props> must accept existing concrete element factories.
  Element extends HTMLElement = any,
  // Preserve the existing one-argument compatibility annotation.
  Handle = any,
> extends ElementBridgeConfig<Props, Element, Handle> {}

export interface LitBridgeOptions<Props extends object, Element extends HTMLElement = HTMLElement, Handle = Element>
  extends LitBridgeConfig<Props, Element, Handle>, ElementBridgeContract<Props, Element, Handle> {}

export type LitElementComponent<Props extends object, Element extends HTMLElement = HTMLElement, Handle = Element> =
  ReactElementComponent<Props, Element, Handle>;

export function createLitElementBridge<
  // Preserve existing unparameterized call inference.
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
>(tagName: string, config?: LitBridgeConfig<Props, Element, Handle>): LitElementComponent<Props, Element, Handle>;
export function createLitElementBridge<
  // Preserve existing unparameterized call inference.
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
>(options: LitBridgeOptions<Props, Element, Handle>): LitElementComponent<Props, Element, Handle>;
export function createLitElementBridge<
  // Preserve existing unparameterized call inference.
  Props extends Record<string, any> = Record<string, any>,
  Element extends HTMLElement = HTMLElement,
  Handle = Element,
>(tagOrOptions: string | LitBridgeOptions<Props, Element, Handle>, config?: LitBridgeConfig<Props, Element, Handle>): LitElementComponent<Props, Element, Handle> {
  const options = typeof tagOrOptions === 'string' ? { tagName: tagOrOptions, ...config } : tagOrOptions;
  const bridge = createReactElementBridge(React, options);
  bridge.displayName = `LitBridge(${options.tagName})`;
  return bridge;
}

export { createLitElementBridge as createLitBridge, createLitElementBridge as createCustomElementBridge };
