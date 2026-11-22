# Imperative Handle Facade (`useImperativeHandle` + `createRefContext`)

Expose a **frozen, encapsulated OOP command facade** from a React widget using `useImperativeHandle`, connect it to `createRefContext`, and orchestrate commands from `ActionContext` handlers via `withTarget`.

- **React Compatibility**: React 18 / 19 (`forwardRef` preserved for `react: ^18.0.0 || ^19.0.0` peer compatibility)
- **Boundary Role**: **Tier 3 Imperative Presentation Boundary** — domain state stays in `Store` + `ActionContext`; imperative commands (`focus`, `validate`, `reset`, `getValue`) cross component boundaries via `RefContext`.
- **Why a Usage Pattern (not a Wrapper API)**: `forwardRef` + `useImperativeHandle` + `Object.freeze` is standard React composition. Keeping it as a pattern avoids hiding React's ref lifecycle behind opaque wrappers while making the `RefContext` stability invariant explicit.

## Prerequisites

- [RefContext Setup](../setup/ref-context-setup.md)
- [Ref Basic Usage](./basic-usage.md)
- [Code Patterns](../../code-patterns.md)

---

## The Critical Pitfall: State Dependencies in `useImperativeHandle`

When pairing `useImperativeHandle` with `createRefContext`, **never** list reactive React state in the dependency array of `useImperativeHandle`:

```tsx
// ❌ Anti-pattern: `value` in deps forces React to tear down & re-attach the ref on every keystroke
const BadInput = forwardRef<FieldHandle, Props>((props, ref) => {
  const [value, setValue] = useState('');

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => value,
      validate: () => value.trim().length > 0,
      focus: () => inputRef.current?.focus(),
      reset: () => setValue(''),
    }),
    [value], // 💥 Calls fieldRef.setRef(null) -> fieldRef.setRef(nextHandle) on every update!
  );
  // ...
});
```

### Why this breaks with `createRefContext`

Every time `deps` change, React invokes the callback ref (`fieldRef.setRef`) with `null` and then with the new handle object. Inside `createRefContext`, that transition:

1. Flips `isMounted` `true → false → true` on every input change.
2. Re-fires registered `onMount` callbacks repeatedly.
3. Triggers extra `useSyncExternalStore` notifications for `useRefMountState` subscribers.

---

## Canonical Pattern: Frozen Stable Facade (`deps: []`) + Lazy Read Ref

Keep the exposed handle identity **constant for the component mount lifetime** (`[]` deps) and freeze it with `Object.freeze(...)`. Read latest internal state lazily via a synced `ref` (or `store.getValue()`), and keep DOM node references strictly internal.

<!-- @context-action-compile -->
```tsx
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext } from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface FieldHandle {
  readonly focus: () => void;
  readonly validate: () => boolean;
  readonly reset: () => void;
  readonly getValue: () => string;
}

interface EncapsulatedFieldProps {
  label: string;
  required?: boolean;
}

export const EncapsulatedField = forwardRef<FieldHandle, EncapsulatedFieldProps>(
  function EncapsulatedField({ label, required = false }, ref) {
    const [value, setValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    // Sync committed props/state into a ref in a layout effect rather than
    // mutating refs during render (React 19 / React Compiler purity).
    const latestRef = useRef({ value, label, required });
    useIsomorphicLayoutEffect(() => {
      latestRef.current = { value, label, required };
    }, [value, label, required]);

    useImperativeHandle(
      ref,
      () =>
        Object.freeze({
          focus: () => {
            inputRef.current?.focus();
          },
          validate: () => {
            const current = latestRef.current;
            const valid = !current.required || current.value.trim().length > 0;
            setError(valid ? null : `${current.label} is required`);
            return valid;
          },
          reset: () => {
            latestRef.current = { ...latestRef.current, value: '' };
            setValue('');
            setError(null);
          },
          getValue: () => latestRef.current.value,
        }),
      [],
    );

    return (
      <label>
        <span>{label}</span>
        <input
          ref={inputRef}
          value={value}
          onChange={(event) => {
            const next = event.target.value;
            latestRef.current = { ...latestRef.current, value: next };
            setValue(next);
            if (error) setError(null);
          }}
        />
        {error && <span role="alert">{error}</span>}
      </label>
    );
  },
);

interface FormActions extends ActionPayloadMap {
  submitForm: void;
  resetForm: void;
}

const {
  Provider: FormActionProvider,
  useActionDispatch: useFormDispatch,
  useActionCommandHandler: useFormCommand,
} = createActionContext<FormActions>('FormFacadeActions');

const {
  Provider: FormRefProvider,
  useRefController: useFormRefController,
} = createRefContext<{ emailField: FieldHandle }>('FormFacadeRefs');

function FormCoordinator({ children }: { children: React.ReactNode }) {
  // `useRefController` does not subscribe to mount state and stays stable across mounts.
  const { withTarget } = useFormRefController('emailField');

  useFormCommand(
    'submitForm',
    useCallback(async () => {
      await withTarget((handle) => {
        if (!handle.validate()) {
          handle.focus();
        }
      });
    }, [withTarget]),
  );

  useFormCommand(
    'resetForm',
    useCallback(async () => {
      await withTarget((handle) => {
        handle.reset();
      });
    }, [withTarget]),
  );

  return <>{children}</>;
}

function ProfileFormContent() {
  const emailField = useFormRefController('emailField');
  const dispatch = useFormDispatch();

  return (
    <>
      <EncapsulatedField ref={emailField.setRef} label="Work Email" required />
      <button type="button" onClick={() => void dispatch('submitForm')}>
        Validate &amp; Submit
      </button>
      <button type="button" onClick={() => void dispatch('resetForm')}>
        Reset
      </button>
    </>
  );
}

export function ProfileFormSection() {
  return (
    <FormActionProvider>
      <FormRefProvider>
        <FormCoordinator>
          <ProfileFormContent />
        </FormCoordinator>
      </FormRefProvider>
    </FormActionProvider>
  );
}
```

---

## Key Invariants

1. **Empty dependency array (`[]`) for `useImperativeHandle`**: Ensure `setRef` receives a single stable handle reference for the entire mount lifecycle.
2. **Freeze the facade (`Object.freeze`)**: Prevents callers from mutating or monkey-patching imperative methods exposed through `RefContext`.
3. **Sync refs on commit and inside events/commands**: Sync `latestRef` inside `useIsomorphicLayoutEffect` (avoiding render-phase ref writes under Concurrent React / React Compiler), and update `latestRef` synchronously inside `onChange` / `reset` so back-to-back calls (`handle.reset(); handle.getValue()`) read fresh values before the next commit.
4. **Prefer `useRefController` for command-only writers and coordinators**: `useRefController` returns a mount-lifetime-stable `{ setRef, withTarget, waitForMount, onMount, executeIfMounted, checkMountState, target }` handle with **zero mount-state re-renders**. Reserve `useRefMountState` (or `useRefHandler`) for components that render reactive `isMounted` / `isWaitingForMount` UI badges.
5. **Never leak raw DOM nodes & preserve `forwardRef`**: Parents and `ActionContext` handlers only see `FieldHandle`, never `HTMLInputElement`, and `forwardRef` preserves React 18/19 portability.

## Related Patterns

- [Local State Imperative Handle](./local-state-imperative-handle.md) — Encapsulating `useLocalStore` or `useReducer` behind a frozen facade
- [External OOP Lifecycle Bridge](./external-oop-lifecycle.md) — Managing non-React OOP engines with `useLayoutEffect` + `createRefContext`
- [Triad & Evidence Sync Guide](../../../context-layered/triad-evidence-sync-guide.md) — Why imperative handles remain Tier 3 volatile presentation boundaries
