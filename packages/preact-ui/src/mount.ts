import { createElement, render } from 'preact';
import type { ComponentType } from 'preact';
import { claimMountRoot } from './ownership.js';
import type { MountRoot } from './ownership.js';

export type OwnedView<Input> = ComponentType<{ input: Input }>;

export interface MountInstance<Input> {
  readonly destroyed: boolean;
  /** Replace the complete input snapshot, not a partial prop merge. */
  update(input: Input): void;
  /** Unmount children; never remove the host-owned root. Idempotent. */
  destroy(): void;
}

export function mountPreact<Input>(
  root: MountRoot,
  View: OwnedView<Input>,
  initialInput: Input,
): MountInstance<Input> {
  const release = claimMountRoot(root);
  let destroyed = false;

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    const errors: unknown[] = [];
    try { render(null, root); } catch (error) { errors.push(error); }
    try {
      // A failed component render may leave a partially created node behind;
      // this root is exclusively owned by the mount, so remove the residue
      // after Preact has had a chance to run its unmount lifecycle.
      while (root.firstChild) root.removeChild(root.firstChild);
    } catch (error) { errors.push(error); }
    try { release(); } catch (error) { errors.push(error); }
    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) throw new AggregateError(errors, 'Mount cleanup failed');
  };
  const draw = (input: Input) => {
    if (destroyed) throw new Error('Cannot update a destroyed UI boundary');
    try {
      render(createElement(View, { input }), root);
    } catch (error) {
      try { destroy(); } catch (cleanupError) {
        throw new AggregateError([error, cleanupError], 'Render and cleanup failed');
      }
      throw error;
    }
  };

  draw(initialInput);
  return { get destroyed() { return destroyed; }, update: draw, destroy };
}
