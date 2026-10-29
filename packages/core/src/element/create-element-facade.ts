import { createPublicFacade } from '../facade/create-public-facade.js';
import type { ImperativeHandleFactory } from './contracts.js';

/** DOM specialization of the internal object projection; not a revocable capability. */
export function createElementFacade<Element extends HTMLElement, const Keys extends readonly (keyof Element)[]>(
  keys: Keys,
): ImperativeHandleFactory<Element, Pick<Element, Keys[number]>> {
  return createPublicFacade<Element, Keys>(keys, 'Custom element handle is not mounted');
}
