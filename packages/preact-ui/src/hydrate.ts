import { createElement, hydrate, render } from 'preact';
import type { ComponentType } from 'preact';
import { claimHydrationRoot } from './ownership.js';
import type { MountRoot } from './ownership.js';

export type HydratedView<Input> = ComponentType<{ input: Input }>;

export interface HydrationInstance<Input> {
  readonly destroyed: boolean;
  update(input: Input): void;
  destroy(): void;
}

/** Hydrates server-rendered children without adopting or clearing an arbitrary root. */
export function hydratePreact<Input>(
  root: MountRoot,
  View: HydratedView<Input>,
  initialInput: Input,
): HydrationInstance<Input> {
  const release = claimHydrationRoot(root);
  let destroyed = false;
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    try { render(null, root); } finally { release(); }
  };
  try {
    hydrate(createElement(View, { input: initialInput }), root);
  } catch (error) {
    try { destroy(); } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Hydration and cleanup failed');
    }
    throw error;
  }
  const update = (input: Input) => {
    if (destroyed) throw new Error('Cannot update a destroyed hydrated UI boundary');
    render(createElement(View, { input }), root);
  };
  return { get destroyed() { return destroyed; }, update, destroy };
}
