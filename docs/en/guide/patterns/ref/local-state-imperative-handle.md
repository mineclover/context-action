# Local State Encapsulation + Imperative Handle (`useLocalStore` / `useReducer`)

Encapsulate an internal reactive `Store` (`useLocalStore`) or deterministic state machine (`useReducer`) inside a reusable widget, while exposing only safe, domain-scoped imperative commands via `useImperativeHandle`.

- **React Compatibility**: React 18 / 19
- **Why a Usage Pattern (not a Wrapper API)**: Exposing a restricted command surface over internal state is an architectural boundary choice. Both `useLocalStore` (from `@context-action/react/advanced`) and React's `useReducer` already provide referentially stable handles (`store` / `dispatch`) needed to keep `useImperativeHandle` stable.

## Prerequisites

- [Imperative Handle Facade](./imperative-handle-facade.md)
- [Store Selection and Usage Guide](../../../context-layered/store-selection-and-usage-guide.md)

---

## Choosing Variant A vs Variant B

| Criterion | Variant A: `useLocalStore` + `useImperativeHandle` | Variant B: `useReducer` + `useImperativeHandle` |
|---|---|---|
| **Internal State Owner** | Component-scoped `Store<T>` (`@context-action/react/advanced`) | React `useReducer` state machine |
| **Granular Sub-Tree Subscriptions** | ✅ Sub-components can read `useStoreSelector` / `useStorePath` | Requires passing props or local Context |
| **Same-Turn Read After Write** | ✅ `store.getValue()` reflects mutations immediately | ❌ Reads last committed state (`stateRef` updated on commit) |
| **What Must Stay Hidden** | `store.dispose()`, arbitrary `store.setValue(...)` | Raw `dispatch(action)` union |
| **`useImperativeHandle` Deps** | `[store]` (stable for component mount lifetime) | `[]` (`dispatch` is guaranteed stable by React) |
| **Best Fit** | Stepper, filter panel, same-turn `cmd(); getSnapshot()` APIs | Fire-and-forget timer/playback commands without Store overhead |

---

## Variant A: `useLocalStore` + `useImperativeHandle`

`useLocalStore` returns `{ value, store }` where `store` is created once per mount and disposed automatically on unmount. Wrapping `store` inside `useImperativeHandle` hides `store.dispose()` and raw `store.setValue()`, exposing only clamped domain commands and a defensive `getSnapshot()`.

<!-- @context-action-compile -->
```tsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import { useLocalStore } from '@context-action/react/advanced';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface StepperState {
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export interface StepperHandle {
  readonly increment: () => void;
  readonly decrement: () => void;
  readonly reset: () => void;
  readonly getSnapshot: () => StepperState;
}

interface EncapsulatedStepperProps {
  initialCount?: number;
  min?: number;
  max?: number;
  step?: number;
}

function clampCount(next: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, next));
}

export const EncapsulatedStepper = forwardRef<StepperHandle, EncapsulatedStepperProps>(
  function EncapsulatedStepper(
    { initialCount = 0, min = 0, max = 10, step = 1 },
    ref,
  ) {
    const initialCountRef = useRef(initialCount);
    useIsomorphicLayoutEffect(() => {
      initialCountRef.current = initialCount;
    }, [initialCount]);

    const initialState: StepperState = {
      count: clampCount(initialCount, min, max),
      min,
      max,
      step,
    };
    const { value, store } = useLocalStore<StepperState>(
      initialState,
      'encapsulated-stepper',
    );

    useImperativeHandle(
      ref,
      () =>
        Object.freeze({
          increment: () => {
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count + prev.step, prev.min, prev.max),
            }));
          },
          decrement: () => {
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count - prev.step, prev.min, prev.max),
            }));
          },
          reset: () => {
            store.update((prev) => ({
              ...prev,
              count: clampCount(initialCountRef.current, prev.min, prev.max),
            }));
          },
          getSnapshot: () => store.getValue(),
        }),
      [store],
    );

    return (
      <div>
        <button
          type="button"
          onClick={() =>
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count - prev.step, prev.min, prev.max),
            }))
          }
        >
          -
        </button>
        <output>{value.count}</output>
        <button
          type="button"
          onClick={() =>
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count + prev.step, prev.min, prev.max),
            }))
          }
        >
          +
        </button>
      </div>
    );
  },
);
```

> [!TIP]
> `store.getValue()` reads the latest Store value synchronously as a single source of truth without adding `value` to `useImperativeHandle` dependencies. Note that `useLocalStore` captures `initialState` on mount only; if `min`, `max`, or `step` props can change dynamically after mount, synchronize them into the store or via refs inside an effect.

---

## Variant B: `useReducer` + `useImperativeHandle`

When the widget is a pure UI state machine that only receives **fire-and-forget commands** and reads the **last committed** state without `Store` subscriptions or same-turn synchronous read-after-write, `useReducer` lets you keep `useImperativeHandle` dependencies completely empty (`[]`).

<!-- @context-action-compile -->
```tsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type RunnerStatus = 'idle' | 'running' | 'paused';

interface RunnerState {
  readonly status: RunnerStatus;
  readonly cycles: number;
}

type RunnerAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'tick' }
  | { type: 'reset' };

function runnerReducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case 'start':
      return state.status === 'running' ? state : { ...state, status: 'running' };
    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state;
    case 'tick':
      return state.status === 'running' ? { ...state, cycles: state.cycles + 1 } : state;
    case 'reset':
      return { status: 'idle', cycles: 0 };
  }
}

export interface RunnerHandle {
  readonly start: () => void;
  readonly pause: () => void;
  readonly tick: () => void;
  readonly reset: () => void;
  readonly getStatus: () => RunnerStatus;
  readonly getCycles: () => number;
}

export const EncapsulatedRunner = forwardRef<RunnerHandle>(
  function EncapsulatedRunner(_props, ref) {
    const [state, dispatch] = useReducer(runnerReducer, {
      status: 'idle',
      cycles: 0,
    });

    // Sync the latest committed state on commit (no render-phase ref writes and
    // no dual reducer invocation inside imperative handlers).
    const stateRef = useRef(state);
    useIsomorphicLayoutEffect(() => {
      stateRef.current = state;
    }, [state]);

    // `dispatch` from `useReducer` has guaranteed permanent identity in React,
    // so the imperative facade can keep `[]` dependencies.
    useImperativeHandle(
      ref,
      () =>
        Object.freeze({
          start: () => dispatch({ type: 'start' }),
          pause: () => dispatch({ type: 'pause' }),
          tick: () => dispatch({ type: 'tick' }),
          reset: () => dispatch({ type: 'reset' }),
          getStatus: () => stateRef.current.status,
          getCycles: () => stateRef.current.cycles,
        }),
      [],
    );

    return (
      <div>
        <span>Status: {state.status}</span>
        <span>Cycles: {state.cycles}</span>
      </div>
    );
  },
);
```

---

## Key Invariants

- **Never expose raw `Store` or raw `dispatch` from the handle**: Parents only invoke domain-valid transitions (`increment()`, `start()`, `pause()`), preserving invariants such as clamping and valid state transitions.
- **Choose Variant A vs Variant B by read timing**:
  - Pick **Variant A (`useLocalStore`)** whenever callers expect same-turn read-after-write (`handle.increment(); handle.getSnapshot()`), because `Store` maintains a synchronous single source of truth via `store.getValue()`.
  - Pick **Variant B (`useReducer`)** for fire-and-forget commands and committed snapshot reads (`getStatus()` / `getCycles()` reflect the latest committed render without manually running the reducer twice or drifting from internal UI `dispatch` calls).
- **Use `Object.freeze`**: Ensures the handle contract acts as a read-only capability object.
