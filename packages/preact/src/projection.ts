/**
 * @module projection
 *
 * Purpose:
 *   Projects a derived slice of state from a `ReadonlySignal<State>` into a
 *   memoized, fine-grained `ReadonlySignal<Projected>` within a Preact view.
 *
 * Invariants:
 *   - Re-evaluates `selector` only when `sourceSignal.value` changes.
 *   - Downstream consumers subscribed to the projected signal only update when
 *     the projected value changes (`Object.is` equality in `@preact/signals`).
 */
import { computed } from '@preact/signals';
import type { ReadonlySignal } from '@preact/signals';
import { useMemo, useRef } from 'preact/hooks';

/**
 * Projects a slice of state from a source signal into a memoized, fine-grained ReadonlySignal.
 * Computation re-evaluates only when the accessed signals change.
 */
export function useProjection<State, Projected>(
  sourceSignal: ReadonlySignal<State>,
  selector: (state: State) => Projected,
): ReadonlySignal<Projected> {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  return useMemo(() => computed(() => selectorRef.current(sourceSignal.value)), [sourceSignal]);
}
