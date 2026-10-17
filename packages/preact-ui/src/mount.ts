/**
 * @module mount
 *
 * Purpose:
 *   Mounts a Preact `OwnedView<Input>` into an empty, exclusively leased
 *   `MountRoot` and returns a lifecycle-controlled `MountInstance<Input>`.
 *
 * Invariants:
 *   - Claims ownership via `claimMountRoot(root)` before rendering.
 *   - If initial render or any subsequent `update(input)` throws, the boundary
 *     automatically destroys itself, clears any partial DOM residue, and
 *     releases its ownership lease so the root can be safely reused.
 *   - `destroy()` is idempotent, unmounts the Preact tree, removes child nodes,
 *     and never removes the host-owned `root` element itself.
 */
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

/**
 * Shared 3-phase teardown for exclusively owned Preact roots (`mountPreact` & `hydratePreact`):
 * 1. Run Preact unmount lifecycles via `render(null, root)`
 * 2. Remove any residual child nodes left by a failed render/diff
 * 3. Release the root ownership lease
 */
export function teardownOwnedRoot(
  root: MountRoot,
  release: () => void,
  failureMessage: string,
): void {
  const errors: unknown[] = [];
  try {
    render(null, root);
  } catch (error) {
    errors.push(error);
  }
  try {
    while (root.firstChild) {
      root.removeChild(root.firstChild);
    }
  } catch (error) {
    errors.push(error);
  }
  try {
    release();
  } catch (error) {
    errors.push(error);
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, failureMessage);
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
    teardownOwnedRoot(root, release, 'Mount cleanup failed');
  };
  const draw = (input: Input) => {
    if (destroyed) throw new Error('Cannot update a destroyed UI boundary');
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

  draw(initialInput);
  return { get destroyed() { return destroyed; }, update: draw, destroy };
}
