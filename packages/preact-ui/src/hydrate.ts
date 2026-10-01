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
    const errors: unknown[] = [];
    try { render(null, root); } catch (error) { errors.push(error); }
    try {
      // A component that throws during diffing can leave a partially created
      // node behind. The hydration boundary owns the complete root, so clear
      // any such residue after asking Preact to run its unmount lifecycle.
      while (root.firstChild) root.removeChild(root.firstChild);
    } catch (error) { errors.push(error); }
    try { release(); } catch (error) { errors.push(error); }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Hydration cleanup failed');
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
    try {
      render(createElement(View, { input }), root);
    } catch (error) {
      try { destroy(); } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Render and cleanup failed');
      }
      throw error;
    }
  };
  return { get destroyed() { return destroyed; }, update, destroy };
}
