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
    try { render(null, root); } finally { release(); }
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
