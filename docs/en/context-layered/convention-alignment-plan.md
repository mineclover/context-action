# Context-Layered Convention Alignment Plan

**Status:** Migration baseline documented; remaining surfaces tracked
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

Biome remains responsible for language-level concerns: parsing, formatting, import organization, and generic lint rules. Context-Layered rules are enforced by the repository-specific `pnpm convention:check` command in `scripts/check-context-layered-conventions.mjs`. This split is intentional: a Biome GritQL plugin can match a local syntax pattern, but registry placement, transitional exceptions, and Provider ordering are repository structure rules that need file-aware analysis and an explicit migration inventory.

The first structural rule is already active: every `use*ActionHandler(...)` call must be inside a `handlers/` module or a `*HandlerRegistry` file. The current transitional allowlist records 11 known legacy/advanced files; they are reported but do not fail the check. Any new direct registration outside that allowlist fails immediately. The allowlist is reduced as each remaining surface is migrated.

The next enforcement steps are to add Provider-order and layer-path checks, then remove the transitional allowlist when the inventory reaches zero (or every remaining file has an explicit compatibility classification). `convention:check` is already part of `verify:all`, so CI catches new direct registrations today.

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

- `EnhancedAbortableSearch` now separates its Search Store/Action Contexts, pure search-state rules, semantic action facade, and abort-aware `handlers/EnhancedAbortableSearchHandlerRegistry.tsx`; the compatibility component is now a reactive view only.
- The enhanced context-store mouse usecase now returns handler implementations from its ViewModel hook and registers them only in `handlers/EnhancedContextStoreHandlerRegistry.tsx`; its Model Provider follows Action → Store → Ref ordering.
- `SearchPageRefactored` now separates search data and relevance/filter rules, typed Action/Store Contexts, a stable command facade, and `handlers/AdvancedSearchHandlerRegistry.tsx`; the page is now presentation and Store subscription only.
- `ApiBlockingPageRefactored` now separates request/rate-limit/metric transitions into pure `business/api-blocking-rules.ts`, exposes stable commands through `actions/useApiBlockingActions.ts`, and registers the request lifecycle in `handlers/ApiBlockingHandlerRegistry.tsx`; both API Blocking routes now use the canonical page.
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
2. Move direct handler registrations into domain Handler Registries; LogMonitor, ChatUI, context-store mouse events, conditional permission execution, foundations/core Basics, foundations/react Provider and Child A/B, advanced Concurrent Actions and Canvas, Action Lifecycle Workbench, the useRefMountState pattern, the action-priority demo, the legacy mouse-events demo, the ActionGuard context-store mouse demo, Enhanced Abortable Search, the enhanced context-store mouse usecase, SearchPageRefactored, and ApiBlockingPageRefactored are complete. The current inventory has 11 remaining files in foundations compatibility and performance surfaces.
3. Reconcile all provider examples to the fixed nesting order.
4. Normalize public hook names and move legacy API examples to the migration guide.
5. Add `convention:check` for registry placement, provider order, layer paths, and naming.
6. Run type-check, tests, example builds, docs builds, and package verification.

## Remaining Direct-Registration Inventory

This inventory is intentionally separated from the canonical playbook examples. The current search finds 11 files. Each group needs either a Registry migration or an explicit compatibility wrapper before the structural check can be strict.

| Group | Remaining surfaces |
| --- | --- |
| Foundations and compatibility | `lib/patterns/createObjectContextHooks.tsx` |
| Pattern demonstrations | No remaining direct registrations |
| Integrations | No remaining direct registrations |
| Performance demonstrations | `performance/action-guard/{ScrollPage,ScrollPageRefactored,SearchPage,ThrottleComparisonPage,ThrottleComparisonPageRefactored}.tsx`, `performance/action-guard/components/index.tsx`, `performance/memoization/components/HandlerComparisonDemo.tsx`, `performance/memoization/hooks/{useMemoizedHandlers,useNonMemoizedHandlers}.ts`, `performance/mouse-events/context-store-pattern/context/MouseEventsContext.tsx` |

## Completion Gates

- No handler registration exists outside a Handler Registry or its handler modules.
- Canonical documentation and examples use one provider order.
- Context-Layered is the only recommended structure for new work.
- Legacy/MVVM material is explicitly labeled as migration or compatibility guidance.
- English and Korean convention documents describe the same rules.
- CI fails when the structural convention drifts.

The next re-entry point is the remaining performance groups. Do not mark the migration complete until the 11-file inventory reaches zero or each remaining file is explicitly classified as a compatibility exception.
