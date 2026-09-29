import { useComputed } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';

/**
 * Projects a slice of state from a source signal into a memoized, fine-grained ReadonlySignal.
 * Computation re-evaluates only when the accessed signals change.
 */
export function useProjection<State, Projected>(
  sourceSignal: ReadonlySignal<State>,
  selector: (state: State) => Projected,
): ReadonlySignal<Projected> {
  return useComputed(() => selector(sourceSignal.value));
}
