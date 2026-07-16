# Context-Layered Usecase and Recipe Profile

The existing six-layer structure remains the internal runtime architecture. This profile adds the public boundary needed to connect that runtime to a design-system-based product UI.

## Positioning

```text
Product Scope
  └─ Provider + Handler Registry
       └─ Recipe
            ├─ Astryx primitives
            └─ Usecase Facade
                 └─ Context-Layered Runtime
                      ├─ contexts
                      ├─ business
                      ├─ handlers
                      ├─ actions
                      └─ hooks
```

`Context-Layered Architecture` is the umbrella name. `Usecase Boundary`, `Facade`, and `Recipe` are boundaries within that architecture, not a replacement architecture.

## Why the profile exists

The original six layers explain how Context-Action executes a workflow, but they do not define the public UI boundary clearly enough:

- `actions` and `hooks` can accidentally become an undocumented public API
- `views` can mix pure rendering with product-level composition
- an Astryx primitive can become coupled to domain state or `context-action`

This profile makes the ownership explicit:

| Boundary | Owns | Must not own |
| --- | --- | --- |
| Domain business | Pure validation, calculation, state transitions | React, stores, UI wording |
| Runtime | Contexts, handlers, dispatch, subscriptions | Astryx components |
| Facade | Stable commands and view model | Layout and visual policy |
| Recipe | Astryx composition and prop mapping | Domain rules and raw dispatch |
| Product scope | Provider, registry, route, external data | Individual handler details |

## Canonical feature structure

Existing features can keep the six-layer folders and add the two public boundaries:

```text
access-request/
├── contexts/
├── business/
├── handlers/
├── actions/
├── hooks/
├── facade/
│   └── useAccessRequestFacade.ts
├── recipes/
│   └── AccessRequestRecipe.tsx
├── views/
└── AccessRequestPage.tsx
```

For new features, grouping runtime implementation is also valid:

```text
feature/
├── contract/
├── domain/
├── runtime/
│   ├── contexts/
│   ├── handlers/
│   ├── actions/
│   └── hooks/
├── facade/
├── recipe/
└── scope/
```

Use the first form when preserving an existing feature. Use the second form for a new feature with a clear package boundary.

## Facade convention

The facade is the only public React-facing API for a feature runtime.

```tsx
const vm = useAccessRequestFacade();

vm.workflow.phase;
vm.canSubmit;
vm.commands.changeReason(value);
vm.commands.submit();
```

Rules:

- expose nouns for state and verbs for commands
- do not expose handler IDs, store managers, or raw `dispatch`
- derive values such as `isOpen`, `isBusy`, and `canSubmit` in the facade
- keep async result, abort, retry, and error normalization inside the facade

Recommended names:

```text
AccessRequestProvider
AccessRequestHandlerRegistry
useAccessRequestFacade
AccessRequestRecipe
```

## Recipe convention

Recipes compose Astryx-style primitives and map the facade view model to controlled props.

```tsx
function AccessRequestRecipe() {
  const vm = useAccessRequestFacade();

  return (
    <Drawer
      isOpen={vm.workflow.resourceId != null}
      onClose={vm.commands.close}
    >
      <Textarea
        value={vm.workflow.reason}
        onChange={vm.commands.changeReason}
      />
      <Button
        isLoading={vm.isBusy}
        isDisabled={!vm.canSubmit}
        onClick={vm.commands.submit}
      />
    </Drawer>
  );
}
```

Recipe rules:

- import the design-system primitives and the feature facade
- preserve controlled props such as `isOpen`, `value`, `isLoading`, and `status`
- keep focus, ARIA, keyboard, and intrinsic interaction behavior in primitives
- never import `context-action` directly in a primitive
- never implement validation or business transitions in JSX

## Ref-mount observation usecase

Framework pattern demos often need to observe a DOM boundary without turning the
DOM node itself into application state. Use the ref context for registration and
mount lifecycle, a store for derived observations, and actions for user intent:

```text
Ref mount lifecycle → action intent → Handler Registry → pure state transition → Store subscription
```

The `useRefMountState` demo is the reference recipe for this case:

- `contexts/` owns the action, store, and ref contracts.
- `business/` contains pure transitions such as incrementing render counts.
- `handlers/` is the only place that registers `use*ActionHandler` calls.
- `actions/` exposes semantic commands such as `resetRenderCounts`.
- views read `useRefMountState` and `useStoreValue`; they do not mutate stores.

Mount callbacks may perform narrowly scoped DOM synchronization, but they must
not become a second state-management channel. If the observation is rendered,
dispatch an intent and keep the rendered value in a Store Context. Compose the
domain as Action → Store → Ref → Handler Registry → View.

## Priority pipeline usecase

An ordered pipeline is a useful usecase when validation, policy, business work,
and observability must run under one action. Keep the order explicit in one
Handler Registry:

```text
authenticate → 100 validation → 95 security → 90 rate limit
             → 80 business → 30 analytics → 10 audit
```

Each registration should have a stable handler ID and a documented priority.
Blocking stages use the controller to abort before later stages, while later
stages record their result through a Store Context rather than closing over
view-local React state. This makes the execution trace observable and keeps
priority configuration reviewable without reading the page component.

## Action and handler naming

Usecase actions describe intent, not storage mutation:

```text
selectResource
changeReason
submitRequest
cancelRequest
retryRequest
resetRequest
```

Handler IDs describe the feature, action, and stage:

```text
access-request.submit.validation
access-request.submit.policy
access-request.submit.request
access-request.submit.audit
```

Suggested priority bands:

| Priority | Stage | Blocking |
| ---: | --- | --- |
| 100 | Contract and input validation | yes |
| 80 | Policy and permission checks | yes |
| 50 | Business operation or request | yes |
| 20 | View synchronization | normally no |
| 10 | Audit and telemetry | no |

## Priority-word execution usecase

The ActionGuard priority-word demo is a compact usecase for an ordered,
user-built command sequence:

```text
registerWord → executeRegistered → ordered Registry run → status + result Stores
```

- `components/priority/business/priority-demo-rules.ts` owns duplicate checks,
  priority sorting, status transitions, and result composition as pure rules.
- `contexts/PriorityDemoContexts.tsx` defines the Action and Store contracts;
  registration state, execution state, and the visible result are observable.
- `actions/usePriorityDemoActions.ts` exposes `registerWord`,
  `executeRegistered`, and `clear` without leaking Store mutation to the view.
- `handlers/PriorityDemoHandlerRegistry.tsx` owns the ordered async run,
  per-step delay, cancellation token, and cleanup.

Use this recipe for command palettes, approval steps, staged workflows, or any
demo where users register work in one order but the system executes it by an
explicit priority. Keep the execution trace in Stores so the view can show
registered, executing, and completed states without owning the pipeline.

## Memoization comparison usecase

The memoization demo compares stable and intentionally re-registered handlers
without mixing the comparison mechanics into the widgets:

```text
control command → ComparisonHandlerRegistry → memoized/non-memoized Stores
                 → render metrics + data status View
```

- `business/comparison-rules.ts` owns counter, calculation, heavy-data, and
  memory-data transitions as pure functions.
- `handlers/ComparisonHandlerRegistry.tsx` owns both action lanes and the
  performance-control handlers. The stable lane uses `useCallback`; the
  comparison lane intentionally recreates its handler references inside the
  same Registry boundary.
- `actions/useComparisonActions.ts` exposes stable commands to widgets, while
  `useComparisonViewState` remains read-only presentation state.
- The old component and handler hooks remain compatibility re-exports/status
  hooks, so existing links do not reintroduce direct registrations.

Use this recipe when measuring handler identity, registration churn, or the
effect of lazy Store reads. Keep the contrast explicit in the Registry and do
not let a legacy comparison path become a second architectural standard.

## Generic object-context synchronization usecase

The generic object-context factory is a useful usecase when one domain needs
object lifecycle commands, a manager-owned runtime, and reactive metadata
without coupling views to the manager implementation:

```text
semantic command → ObjectContextHandlerRegistry
                 → ObjectContextManager.dispatch → typed Stores → view
```

- `createObjectContextHooks` creates the Action/Store/Manager contracts and
  keeps its public hooks compatible.
- `handlers/ObjectContextHandlerRegistry.tsx` registers lifecycle, selection,
  focus, and cleanup actions, then synchronizes metadata into Stores.
- `ObjectContextManager` owns domain lifecycle behavior; its public `dispatch`
  bridge keeps the internal `ActionRegister` private.

Use this recipe for dashboards, editors, or catalogs that manage many typed
entities and need independent subscriptions for object lists, selection, focus,
and cleanup state.

## High-frequency pointer tracking usecase

Mouse tracking is a useful usecase when high-frequency input, derived metrics,
and direct DOM feedback must coexist. Keep the event boundary semantic and split
the data by update frequency:

```text
pointer event → updatePosition / recordClick → Handler Registry
              → position + movement + activity Stores → metric subscriptions
```

The enhanced context-store mouse recipe demonstrates this boundary:

- `contexts/` owns Store, Action, and Ref contracts.
- the ViewModel hook computes handler implementations and injects Store access;
  it does not register actions itself.
- `handlers/EnhancedContextStoreHandlerRegistry.tsx` is the only registration
  point for the five mouse actions.
- high-frequency position and movement data stay in separate stores from
  derived metrics and performance counters.
- the View subscribes to the metrics it renders and leaves DOM/canvas control to
  the Ref-aware control hooks.

The lower-level context-store variant is useful when the example should make the
Store boundaries visible:

- `context-store-pattern/context/MouseEventsContext.tsx` defines the typed Action
  and Store contracts plus derived calculation helpers.
- `context-store-pattern/handlers/MouseEventsHandlerRegistry.tsx` owns the six
  event registrations and updates the split stores.
- `context-store-pattern/providers/MouseEventsProvider.tsx` keeps Provider
  composition outside the context definition, so containers only dispatch
  semantic pointer actions.

Use this recipe when the feature needs observable state without forcing every
pointer event through a large page-level render tree. Keep the action payload
small, cap retained paths/history, and document which derived metrics are
updated eagerly versus throttled.

## Abortable filtered search usecase

Search is a useful usecase when query intent, filter transitions, async work,
and result selection must remain independently observable:

```text
query/filter command → performSearch → abort-aware Registry → results + metrics
```

The advanced search recipe applies the same boundaries:

- `business/` owns relevance scoring, filtering, history, and metric updates as
  deterministic functions.
- `actions/` exposes `performSearch`, filter commands, and `selectResult` without
  exposing Store mutation to the View.
- the Registry owns the async search lifecycle and checks the pipeline signal
  before committing results.
- query, filters, results, selection, loading, history, and metrics are separate
  Store concerns so each consumer subscribes only to what it renders.

Use this recipe when a new query should supersede stale work or when filtering
must be measured independently from result rendering. Keep cancellation and
error policy in the handler boundary, not in input JSX.

## API request gate usecase

API request management is a useful usecase when duplicate-request blocking,
rate limiting, simulated transport work, and outcome metrics must remain
observable independently:

```text
request command → blocking policy → rate-limit policy → transport
                → outcome Registry → request history + metrics Stores
```

The API Blocking recipe applies the same boundaries:

- `business/api-blocking-rules.ts` owns rate-window normalization, blocking
  decisions, request-record transitions, and metric calculations as pure
  functions.
- `actions/useApiBlockingActions.ts` exposes `makeApiCall`, configuration, and
  history commands without exposing raw Store mutation to the View.
- `handlers/ApiBlockingHandlerRegistry.tsx` owns the simulated transport,
  blocking timer, rate-limit counter, and success/blocked/error result actions.
- `apiCalls`, gate state, rate-limit state, and metrics remain separate Stores;
  each View subscribes only to the state it renders.
- Every request receives a `callId`, so asynchronous outcomes update exactly
  one pending record instead of matching by endpoint or timestamp.

Use this recipe for double-submit protection, client-side request gates, or
small circuit-breaker demonstrations. Keep policy decisions pure, put timers
and transport effects in the Registry, and keep the route responsible only for
provider composition and feature scope.

## Virtualized scroll usecase

Infinite scroll is a useful usecase when high-frequency position updates,
virtualized rendering, asynchronous page loading, and DOM animation need clear
ownership:

```text
scroll event → position/virtualization commands → Handler Registry
             → scroll/content/metrics Stores → virtualized View
```

The Scroll recipe applies the following boundaries:

- `business/scroll-rules.ts` owns content generation, velocity derivation,
  virtualization windows, and page-load metric transitions.
- `contexts/ScrollContexts.tsx` defines Action, Store, and Ref contracts; the
  Ref Context exposes the scroll container without putting the DOM node in a
  Store.
- `actions/useScrollActions.ts` exposes semantic commands such as
  `smoothScrollTo`, `loadMoreContent`, and `resetScroll`.
- `handlers/ScrollHandlerRegistry.tsx` owns handler registration, the async
  loading lifecycle, requestAnimationFrame animation, and the 60fps auto-scroll
  loop.
- The View subscribes to scroll data, content, loading, virtualization, and
  metrics while keeping event handlers limited to payload calculation and
  command dispatch.

Use this recipe for large content surfaces where only the visible window should
render. Keep the content window bounded by virtualization, keep DOM feedback
in the Ref boundary, and keep page-loading state transitions observable in
Stores rather than local component state.

## Timing strategy comparison usecase

Throttle comparison is a useful usecase when normal, throttle, debounce,
leading-edge, and trailing-edge input strategies must be compared against the
same processing and metrics pipeline:

```text
input event → strategy scheduler → processEvent → event log + metrics Store
             → benchmark / auto-test actions
```

The Throttle recipe applies these boundaries:

- `business/throttle-rules.ts` owns metric transitions, bounded event history,
  configuration defaults, and benchmark history as pure functions.
- `actions/useThrottleActions.ts` exposes `inputEvent`, configuration, and test
  commands; the View never chooses a scheduler or dispatches `processEvent`.
- `handlers/ThrottleHandlerRegistry.tsx` owns the five timing schedulers,
  timeout cleanup, simulated processing, benchmark loops, and auto-test timer.
- `inputEvent` is the semantic boundary. It fans out to the five strategy
  schedulers, while `processEvent` remains the single result/metrics boundary.

Use this recipe when comparing interaction policies or validating a timing
configuration. Keep scheduler state in refs owned by the Registry, clean up all
timers on unmount, and feed every strategy into the same result transition so
the comparison remains meaningful.

## Design-system boundary

The recipe is the integration point for Astryx-like conventions:

- neutral canvas and surface roles
- semantic accent and muted selected state
- subtle elevation rather than decorative gradients
- visible focus ring and keyboard-safe controls
- status text paired with a semantic state, never color alone
- controlled/uncontrolled behavior only for intrinsic component interaction

The Live Code Editor's **Usecase boundary** example is the reference implementation for this profile. It demonstrates the complete path in one browser surface:

```text
Contract → Runtime → Facade → Recipe → Activity / Result
```

For a model-driven variant of the same boundary, use the [Tool-Calling Web
Studio Convention](/en/context-layered/usecase-tool-calling-web-studio). It adds
the tool registry, approval policy, provider-neutral model loop, workspace
repository, and preview acknowledgement to the runtime while keeping the
facade/view boundary intact.

## Verification gates

Every profile implementation should verify:

1. domain functions independently
2. handler ordering, blocking, abort, and result collection
3. facade derivation and command stability
4. recipe controlled props, focus, and status states
5. browser happy path and invalid path
6. no direct runtime import from design-system primitives

Start with:

- [Live Code Editor](/example/integrations/live-code-editor)
- [Action Lifecycle Workbench](/example/integrations/action-lifecycle)
- [Access Request Playbook](../examples/access-request-playbook)
