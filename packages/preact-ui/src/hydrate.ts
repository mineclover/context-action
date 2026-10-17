/**
 * @module hydrate
 *
 * Purpose:
 *   Hydrates server-rendered HTML inside an exclusively leased `MountRoot`
 *   using Preact `hydrate()` and transitions subsequent updates to `render()`.
 *
 * Invariants:
 *   - Claims ownership via `claimHydrationRoot(root)`, requiring non-empty
 *     server markup and rejecting any already-managed descendant roots.
 *   - Self-cleans via `teardownOwnedRoot` if initial hydration or a later
 *     `update(input)` fails, leaving the root empty and released.
 */
import { createElement, hydrate, render } from 'preact';
import type { ComponentType } from 'preact';
import { teardownOwnedRoot } from './mount.js';
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
    teardownOwnedRoot(root, release, 'Hydration cleanup failed');
  };
  try {
    hydrate(createElement(View, { input: initialInput }), root);
  } catch (error) {
    try {
      destroy();
    } catch (cleanupError) {
      throw new AggregateError([error, cleanupError], 'Hydration and cleanup failed');
    }
    throw error;
  }
  const update = (input: Input) => {
    if (destroyed) throw new Error('Cannot update a destroyed hydrated UI boundary');
    try {
      render(createElement(View, { input }), root);
    } catch (error) {
      try {
        destroy();
      } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Render and cleanup failed');
      }
      throw error;
    }
  };
  return { get destroyed() { return destroyed; }, update, destroy };
}
