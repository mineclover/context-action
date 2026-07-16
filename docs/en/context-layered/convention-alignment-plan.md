# Context-Layered Convention Alignment Plan

**Status:** Direct-registration inventory closed; remaining structural gates tracked
**Last reviewed:** 2026-07-16

This document records the repository-level decision for aligning existing examples and documentation with the Context-Layered architecture. It sits beside the implementation convention because it describes the current-state classification, the fixed provider composition, and the migration gates needed to make the convention enforceable.

## Decisions

### 1. Context-Layered is the single standard for new work

New scenarios use these layers:

```text
contexts/  -> boundaries and providers
business/  -> pure domain logic
handlers/  -> orchestration and dependency injection
actions/   -> dispatch helpers and callbacks
hooks/     -> reactive store subscriptions
views/     -> rendering and user events
```

Strict MVVM material remains useful as migration context, but it is not a second standard for new implementation-playbook work.

### 2. Every handler is registered through a Handler Registry

There is no size-based exception.

- Context files define and compose boundaries; they do not register handlers.
- Every domain exposes a `*HandlerRegistry` (or an equivalent registry component).
- All `use*ActionHandler` calls belong inside the registry or its handler modules.
- Pages and views mount the registry; they do not register handlers directly.

This rule applies to one-handler examples as well as multi-phase workflows. It keeps registration, cleanup, priority, and dependency injection reviewable in one place.

### 3. Provider composition is fixed

The canonical nesting order is:

```tsx
<DomainActionProvider>
  <DomainStoreProvider>
    <DomainRefProvider>
      <DomainHandlerRegistry>
        <DomainView />
      </DomainHandlerRegistry>
    </DomainRefProvider>
  </DomainStoreProvider>
</DomainActionProvider>
```

This is a repository convention, not a claim that the runtime requires one order. Include the Ref Provider when the domain defines a ref boundary; otherwise the registry follows the Store Provider directly. This ensures every registry is below the boundaries it may depend on.

## Lint and convention enforcement

The repository uses Biome `2.5.3`, which is the current npm `latest` as of 2026-07-14. Both Biome configurations were migrated with `biome migrate --write` from the deprecated `linter.rules.recommended` option to `linter.rules.preset`. The root configuration remains lint-only for package source, while the example configuration keeps the formatter-enabled `check` gate.

Biome remains responsible for language-level concerns: parsing, formatting, import organization, and generic lint rules. Context-Layered rules are enforced by the repository-specific `pnpm convention:check` command in `scripts/check-context-layered-conventions.mjs`. This split is intentional: a Biome GritQL plugin can match a local syntax pattern, but registry placement, transitional exceptions, Provider ordering, and migration classification are repository structure rules that need file-aware analysis and an explicit migration inventory.

The first structural rule is already active: every `use*ActionHandler(...)` call must be inside a `handlers/` module or a `*HandlerRegistry` file. The transitional allowlist is now empty: the direct-registration inventory has no remaining exceptions. Any new direct registration outside a Registry fails immediately.

Provider-order and canonical layer-path/name checking are now active alongside the direct-registration rule. The checker enforces Action → Store → Ref → Handler Registry nesting, recognizes 28 canonical roots, and currently reports zero provider-order and layer-path/name violations. `convention:check` is already part of `verify:all`, so CI catches new direct registrations and structural drift today.

## Current-State Classification

The following classification is the baseline for migration.

| Classification | Current surface | Treatment |
| --- | --- | --- |
| Canonical | `example/src/pages/patterns/implementation-playbook/**`, playbook examples, `contexts/business/handlers/actions/hooks/views` | Preserve and use as the reference implementation |
| Transitional | Strict MVVM documents, `business-logic` examples, direct handler registration in context/page files, mixed provider nesting | Migrate to the canonical structure |
| Advanced/isolated | time-travel stores, performance demos, direct `ActionRegister` usage, low-level integration tests | Keep as advanced material; do not present as the default architecture |
| Compatibility | Legacy object-form context creation and older hook aliases | Keep for compatibility, but document only in migration/reference material |

### Evidence recorded on 2026-07-13

- `CanonicalOrderHandlers.tsx` already composes an action provider, store provider, ref provider, and handler registry.
- `LogMonitor` was the first migration target: its boundaries now live under `contexts/`, all five handlers are registered by `handlers/LogMonitorHandlerRegistry.tsx`, and its provider order is canonical.
- `ChatUI`, the context-store mouse-events container, conditional permission execution, and the foundations/react Child A/B domain now also keep all handler registration in dedicated Registry modules.
- The foundations/react parent and child handlers now share `FoundationHandlerRegistry`, and the conditional permission route uses its canonical Action → Store provider wrapper with the Registry around the view.
- The foundations/core Basics demo now separates `contexts/`, pure `business/` rules, and `handlers/CoreBasicsHandlerRegistry.tsx`.
- The foundations/react Provider demo now keeps its handler registration in `handlers/ProviderHandlerRegistry.tsx` and composes it through `ProviderRuntime`.
- The advanced Concurrent Actions demo now injects task callbacks into `handlers/ConcurrentActionHandlerRegistry.tsx` instead of registering handlers in the page.
- The advanced Canvas demo now separates `contexts/CanvasContexts.tsx` from `handlers/CanvasHandlerRegistry.tsx` while preserving its public compatibility hooks.
- The `useRefMountState` pattern demo now separates ref/store/action boundaries under `contexts/`, pure render-count transitions under `business/`, action commands under `actions/`, and registrations under `handlers/UseRefMountStateHandlerRegistry.tsx`.
- The action-priority demo now keeps the ordered authentication pipeline in `handlers/ActionPriorityDemoHandlerRegistry.tsx`, stores execution results in a Store Context, and exposes only semantic commands from `actions/useActionPriorityDemoActions.ts`.
- The legacy mouse-events demo now keeps event-derived state in a Store Context and registers its five event handlers in `handlers/LegacyMouseEventsHandlerRegistry.tsx`; the page only dispatches semantic mouse commands.
- The ActionGuard context-store mouse demo now uses a typed Store Context for position, clicks, path, and recording modes; its seven state handlers live in `handlers/ActionGuardMouseEventsHandlerRegistry.tsx`.

### Evidence recorded on 2026-07-16

- The conditional permission usecase now keeps its Context-Action providers in `contexts/ConditionalPatternsContexts.tsx`, pure role/action evaluation in `business/permission-rules.ts`, semantic commands in `actions/usePermissionActions.ts`, and fail-secure orchestration in `handlers/PermissionHandlerRegistry.tsx`; `verify:conditional` protects these boundaries.
- `EnhancedAbortableSearch` now separates its Search Store/Action Contexts, pure search-state rules, semantic action facade, and abort-aware `handlers/EnhancedAbortableSearchHandlerRegistry.tsx`; the compatibility component is now a reactive view only.
- The enhanced context-store mouse usecase now returns handler implementations from its ViewModel hook and registers them only in `handlers/EnhancedContextStoreHandlerRegistry.tsx`; its Model Provider follows Action → Store → Ref ordering.
- `SearchPageRefactored` now separates search data and relevance/filter rules, typed Action/Store Contexts, a stable command facade, and `handlers/AdvancedSearchHandlerRegistry.tsx`; the page is now presentation and Store subscription only.
- `ApiBlockingPageRefactored` now separates request/rate-limit/metric transitions into pure `business/api-blocking-rules.ts`, exposes stable commands through `actions/useApiBlockingActions.ts`, and registers the request lifecycle in `handlers/ApiBlockingHandlerRegistry.tsx`; both API Blocking routes now use the canonical page.
- `ScrollPageRefactored` now separates deterministic content/virtualization/metric rules, typed Action/Store/Ref Contexts, semantic scroll commands, and `handlers/ScrollHandlerRegistry.tsx`; both scroll routes now use the canonical page and the Registry owns the DOM animation loop.
- `ThrottleComparisonPageRefactored` now routes the five timing strategies through an `inputEvent` action, keeps timing schedulers and auto-test timers in `handlers/ThrottleHandlerRegistry.tsx`, and isolates metric transitions in pure `business/throttle-rules.ts`; both throttle routes now use the canonical page.
- The ActionGuard priority-word demo now keeps registered words, execution status, and results in a typed Store Context; semantic commands live in `components/priority/actions/usePriorityDemoActions.ts`, and the ordered async run is owned by `components/priority/handlers/PriorityDemoHandlerRegistry.tsx`.
- The legacy Scroll, Search, and Throttle entry points are now compatibility re-exports of their canonical Refactored pages, so old source links remain valid without preserving direct handler registrations.
- The memoization comparison now keeps its Context-Action contracts/providers in `contexts/ComparisonContexts.ts`, pure comparison transitions in `business/comparison-rules.ts`, semantic commands in `actions/useComparisonActions.ts`, and both handler lanes plus performance controls in `handlers/ComparisonHandlerRegistry.tsx`; the old model and hook paths remain compatibility re-exports.
- The context-store mouse usecase now keeps its six event registrations in `context-store-pattern/handlers/MouseEventsHandlerRegistry.tsx`; `providers/MouseEventsProvider.tsx` owns the Action → Store → Registry composition while the context module remains the contract and derived-rule boundary.
- The generic `createObjectContextHooks` factory now delegates its Action → Manager → Store synchronization to `lib/patterns/handlers/ObjectContextHandlerRegistry.tsx`; `ObjectContextManager.dispatch` is the domain-safe bridge instead of exposing its internal ActionRegister.
- The convention checker now validates Provider nesting through the object-context factory, Flow Control, API Blocking, memoization, priority, and mouse-event compositions; `pnpm convention:check` reports zero provider-order violations.
- The convention checker now validates 28 canonical roots for layer paths, file names, and import boundaries; the conditional permission usecase now exposes its Context-Action boundaries under `contexts/`, packet/quote calculations remain in playbook Data Hooks, and the checker reports zero layer-path/name violations.
- `tools/context-action-lint/layered-surface-classification.json` now records all four non-canonical `handlers/` surfaces: three advanced comparison roots and one compatibility object-context root; unclassified additions and stale classifications fail `convention:check`.
- `docs/en/concept/conventions.md` describes strict MVVM and must be linked as migration/legacy guidance rather than a parallel standard.
- Existing documentation and examples contain both adjacent provider orders. A repository search found 19 action-then-store occurrences and 20 store-then-action occurrences; this is a structural inventory, not a runtime failure report.

### Validation evidence recorded on 2026-07-13

- `pnpm --dir example type-check` passed.
- `pnpm --dir example build:fast` passed.
- `pnpm test:canonical-example` passed (1 suite, 4 tests).
- `pnpm docs:build` passed.
- The development server at `http://127.0.0.1:4000/` loaded `/react/context` and `/actionguard/conditional/permissions`; Child A and Child B interactions, permission approval, and audit output were verified.
- A fresh browser load reported zero startup warnings/errors after the LogMonitor registry readiness gate was added.

## Migration Sequence

1. Add this decision to the English and Korean convention indexes.
2. Move direct handler registrations into domain Handler Registries; LogMonitor, ChatUI, context-store mouse events, conditional permission execution, foundations/core Basics, foundations/react Provider and Child A/B, advanced Concurrent Actions and Canvas, Action Lifecycle Workbench, the useRefMountState pattern, the action-priority demo, the legacy mouse-events demo, the ActionGuard context-store mouse demo, Enhanced Abortable Search, the enhanced context-store mouse usecase, SearchPageRefactored, ApiBlockingPageRefactored, ScrollPageRefactored, ThrottleComparisonPageRefactored, the ActionGuard priority-word demo, the memoization comparison, and the generic object-context factory are complete. The direct-registration inventory is now empty.
3. Reconcile all provider examples to the fixed nesting order.
4. Normalize public hook names and move legacy API examples to the migration guide.
5. Keep the active `convention:check` gates for Registry placement, provider order, canonical layer paths, file naming, import boundaries, and explicit advanced/compatibility classification; expand canonical coverage when one of those surfaces enters migration.
6. Run type-check, tests, example builds, docs builds, and package verification.

## Remaining Direct-Registration Inventory

This inventory is intentionally separated from the canonical playbook examples. The current search finds no direct-registration files, so the structural check can run without transitional exceptions.

| Group | Remaining surfaces |
| --- | --- |
| Foundations and compatibility | No remaining direct registrations |
| Pattern demonstrations | No remaining direct registrations |
| Integrations | No remaining direct registrations |
| Performance demonstrations | No remaining direct registrations |

## Completion Gates

- No handler registration exists outside a Handler Registry or its handler modules.
- Canonical documentation and examples use one provider order.
- Context-Layered is the only recommended structure for new work.
- Legacy/MVVM material is explicitly labeled as migration or compatibility guidance.
- English and Korean convention documents describe the same rules.
- CI fails when the structural convention drifts.

The direct-registration, Provider-order, canonical layer-path/name, and migration-classification gates are complete. The next re-entry point is migrating one explicitly classified advanced surface into the canonical structure; keep compatibility exports documented, but do not add new handler registrations outside Registry modules.
