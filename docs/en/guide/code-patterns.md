# Code Patterns

Catalog of core Context-Action patterns across setup, action dispatch, store reactivity, async pipelines, and high-frequency refs — paired with right-sized recipes.

> Need guidance on **when** to pick Level 1 Lite vs Level 2 Headless-First Symmetric DI vs Level 3 6-Layer, and which rules CI enforces? Start with [Best Practices](./best-practices.md).

---

## Right-Sized Recipe Selector

| Need | Recommended Recipe | Reference |
|---|---|---|
| Single-domain React widget (`1` Action + `1` Store + `Registry`) | Level 1 · Lite | [Best Practices — Level 1](./best-practices.md#level-1--lite-single-domain-coupon-widget) & [Basic Setup](../examples/basic-setup.md) |
| Shared engine runnable headlessly & across React unmount/remount | Level 2 · Headless-First Symmetric DI (`ownership="shared"`) | [Best Practices — Level 2](./best-practices.md#level-2--headless-first-symmetric-di-actionregister--createstore--shared-provider) |
| Multi-concern feature with `BusinessActionIntent` vs `LayoutActionIntent` | Level 3 · Full 6-Layer (`contexts/business/handlers/actions/hooks/views`) | [Canonical Order Form](../examples/canonical-order-form.md) |
| Returning early cache hits, validation results, or abort reasons | `dispatchWithResult()` + `controller.return(...)` / `controller.abort(...)` | [Dispatch Patterns](./patterns/action/dispatch-patterns.md) |
| Cancelling/resetting async handlers or recording live progress steps | `dispatch(..., { immediate: true })` queue bypass | [Best Practices — Queue Preemption](./best-practices.md#_3-preempt-serialized-queues-with--immediate-true-) |
| Focusing fields or driving 60fps scroll/DOM without Store re-renders | `createRefContext` (`useWaitForRefs`) | [RefContext Setup](./patterns/setup/ref-context-setup.md) & [Ref Basic Usage](./patterns/ref/basic-usage.md) |

---

## OOP × React Built-in Hook Patterns

> [!NOTE]
> These 5 archetypes are intentionally authored as **usage patterns** combining Context-Action primitives with React's built-in hooks—keeping `@context-action/react` lightweight across `react: ^18.0.0 || ^19.0.0` without thin wrapper APIs.

| Archetype | React Scope | Primitives + Built-in Hooks | Reference |
|---|---|---|---|
| **1. Encapsulated OOP Widget Control** | React 18 / 19 | `createRefContext` + `ActionContext` + `useImperativeHandle` (`[]` deps + `Object.freeze`) | [Imperative Handle Facade](./patterns/ref/imperative-handle-facade.md) |
| **2. Local Store / Reducer Encapsulation** | React 18 / 19 | `useLocalStore` or `useReducer` + `useImperativeHandle` | [Local State Imperative Handle](./patterns/ref/local-state-imperative-handle.md) |
| **3. High-Frequency Store → Non-Blocking View** | React 18 / 19 | `useStorePath` / `useStoreValue` + `useDeferredValue` + `React.memo` | [Deferred View Subscription](./patterns/store/deferred-view-subscription.md) |
| **4. Committed Store + Optimistic / Form Overlay** | React 19+ | `useStoreValue` + `dispatchWithResult` + `useOptimistic` / `useTransition` / `useActionState` | [Optimistic & Transition UI (React 19)](./patterns/async/optimistic-and-transition-ui.md) |
| **5. External Imperative OOP Runtime Bridge** | React 18 / 19 | `createRefContext` (`setRef`) + isomorphic `useLayoutEffect` / `useEffect` | [External OOP Lifecycle Bridge](./patterns/ref/external-oop-lifecycle.md) |

---

## Pattern Collection by Category

### Setup & Context Boundaries
- [Setup Overview](./patterns/setup/index.md) — Choosing providers and boundary composition
- [Basic Action Setup](./patterns/setup/basic-action-setup.md) — Typed action contracts with `createActionContext`
- [Basic Store Setup](./patterns/setup/basic-store-setup.md) — Type-safe store bundles with `createStoreContext`
- [RefContext Setup](./patterns/setup/ref-context-setup.md) — Imperative DOM & hardware ref containers
- [Multi-Context Setup](./patterns/setup/multi-context-setup.md) — Composing multiple business and layout domains
- [Provider Composition Setup](./patterns/setup/provider-composition-setup.md) — Clean app-level provider nesting (`composeProviders`)

### Action Pipeline & Handler Registration
- [Action Patterns Overview](./patterns/action/index.md)
- [Basic Action Usage](./patterns/action/basic-usage.md) — Defining payload maps and dispatching actions
- [Dispatch Access](./patterns/action/dispatch-access.md) — `useActionDispatch`, `useActionDispatchWithResult`, and handler hooks
- [Dispatch Patterns](./patterns/action/dispatch-patterns.md) — Priority execution, `dispatchWithResult()`, and queue options
- [Handler State Access](./patterns/action/handler-state-access.md) — Lazy `store.getValue()` snapshots without stale closures
- [Register Patterns](./patterns/action/register-patterns.md) — Organizing handler registration and cleanup
- [Type System](./patterns/action/type-system.md) — `ActionPayloadMap`, result typing, and inference
- [Advanced Patterns](./patterns/action/advanced-patterns.md) — Guards, priority jumps (`controller.jumpToPriority`), and abort handling

### Store Reactivity & Subscriptions
- [Basic Store Usage](./patterns/store/basic-usage.md) — Creating, reading, and updating Stores cleanly
- [useStoreValue Patterns](./patterns/store/useStoreValue-patterns.md) — Subscribing safely in React views with selectors
- [Path-Based Subscription](./patterns/store/path-based-subscription.md) — Granular JSON-pointer subscriptions via `useStorePath`
- [Deferred View Subscription](./patterns/store/deferred-view-subscription.md) — Keeping urgent Store reads non-blocking with `useDeferredValue`
- [useStoreManager API](./patterns/store/useStoreManager-api.md) — Low-level store registry access inside handler setup
- [Store Configuration](./patterns/store/store-configuration.md) — Custom comparators, equality checks, and batched/immediate notification modes

### Async Execution & Concurrency
- [Async Patterns Overview](./patterns/async/index.md)
- [Real-Time State Access](./patterns/async/real-time-state-access.md) — Reading latest store snapshots across `await` boundaries
- [Wait Then Execute](./patterns/async/wait-then-execute.md) — Debouncing, awaiting DOM refs, and cancellable async pipelines
- [Optimistic & Transition UI (React 19)](./patterns/async/optimistic-and-transition-ui.md) — Committed Stores + `useOptimistic`, `useTransition`, and `useActionState`

### Imperative DOM & RefContext
- [RefContext Basic Usage](./patterns/ref/basic-usage.md) — `useRefHandler`, `waitForRefs`, and non-reactive animation/scroll loops
- [Imperative Handle Facade](./patterns/ref/imperative-handle-facade.md) — Frozen `useImperativeHandle` facades wired into `createRefContext` + `ActionContext`
- [Local State Imperative Handle](./patterns/ref/local-state-imperative-handle.md) — Encapsulating `useLocalStore` / `useReducer` behind safe imperative commands
- [External OOP Lifecycle Bridge](./patterns/ref/external-oop-lifecycle.md) — Idempotent `useLayoutEffect` / `useEffect` mount/dispose for non-React OOP engines
- [React Refs Architecture Guide](../concept/react-refs-guide.md) — When to choose `RefContext` vs `Store`

---

## Testing Checklist for Runtime Recipes

- **Wrap UI events in `act(...)` / `userEvent` cleanly** and account for `Store`'s default RAF batching (`16ms` under fake timers or `waitFor(...)` under real timers). See [Stability & Test Cycle](../context-layered/stability-test-cycle.md).
- **Assert observers with `{ when: 'always' }`** when verifying guard rejections and aborted flows.
- **Test pure `business/` transitions headlessly** before mounting React views.
