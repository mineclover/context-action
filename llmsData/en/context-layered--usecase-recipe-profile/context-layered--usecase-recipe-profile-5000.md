---
document_id: context-layered--usecase-recipe-profile
category: context-layered
source_path: en/context-layered/usecase-recipe-profile.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.262Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Usecase and Recipe Profile

Context-Layered Usecase and Recipe Profile The existing six-layer structure remains the internal runtime architecture. This profile adds the public boundary needed to connect that runtime to a design-system-based product UI. Positioning Context-Layered Architecture is the umbrella name. Usecase Boundary, Facade, and Recipe are boundaries within that architecture, not a replacement architecture. Why the profile exists The original six layers explain how Context-Action executes a workflow, but they do not define the public UI boundary clearly enough: - actions and hooks can accidentally become an undocumented public API - views can mix pure rendering with product-level composition - an Astryx primitive can become coupled to domain state or context-action This profile makes the ownership explicit: | Boundary | Owns | Must not own | | --- | --- | --- | | Domain business | Pure validation, calculation, state transitions | React, stores, UI wording | | Runtime | Contexts, handlers, dispatch, subscriptions | Astryx components | | Facade | Stable commands and view model | Layout and visual policy | | Recipe | Astryx composition and prop mapping | Domain rules and raw dispatch | | Product scope | Provider, registry, route, external data | Individual handler details | Canonical feature structure Existing features can keep the six-layer folders and add the two public boundaries: For new features, grouping runtime implementation is also valid: Use the first form when preserving an existing feature. Use the second form for a new feature with a clear package boundary. Facade convention The facade is the only public React-facing API for a feature runtime. Rules: - expose nouns for state and verbs for commands - do not expose handler IDs, store managers, or raw dispatch - derive values such as isOpen, isBusy, and canSubmit in the facade - keep async result, abort, retry, and error normalization inside the facade Recommended names: Recipe convention Recipes compose Astryx-style primitives and map the facade view model to controlled props. Recipe rules: - import the design-system primitives and the feature facade - preserve controlled props such as isOpen, value, isLoading, and status - keep focus, ARIA, keyboard, and intrinsic interaction behavior in primitives - never import context-action directly in a primitive - never implement validation or business transitions in JSX Ref-mount observation usecase Framework pattern demos often need to observe a DOM boundary without turning the DOM node itself into application state. Use the ref context for registration and mount lifecycle, a store for derived observations, and actions for user intent: The useRefMountState demo is the reference recipe for this case: - contexts/ owns the action, store, and ref contr

Key points:
• `actions` and `hooks` can accidentally become an undocumented public API
• `views` can mix pure rendering with product-level composition
• an Astryx primitive can become coupled to domain state or `context-action`
• expose nouns for state and verbs for commands
• do not expose handler IDs, store managers, or raw `dispatch`
• derive values such as `isOpen`, `isBusy`, and `canSubmit` in the facade
• keep async result, abort, retry, and error normalization inside the facade
• import the design-system primitives and the feature facade
• preserve controlled props such as `isOpen`, `value`, `isLoading`, and `status`
• keep focus, ARIA, keyboard, and intrinsic interaction behavior in primitives
• never import `context-action` directly in a primitive
• never implement validation or business transitions in JSX
• `contexts/` owns the action, store, and ref contracts.
• `business/` contains pure transitions such as incrementing render counts.
• `handlers/` is the only place that registers `use*ActionHandler` calls.
• `actions/` exposes semantic commands such as `resetRenderCounts`.
• views read `useRefMountState` and `useStoreValue`; they do not mutate stores.
• `components/priority/business/priority-demo-rules.ts` owns duplicate checks,
• `contexts/PriorityDemoContexts.tsx` defines the Action and Store contracts;
• `actions/usePriorityDemoActions.ts` exposes `registerWord`,
• `handlers/PriorityDemoHandlerRegistry.tsx` owns the ordered async run,
• `business/comparison-rules.ts` owns counter, calculation, heavy-data, and
• `handlers/ComparisonHandlerRegistry.tsx` owns both action lanes and the
• `actions/useComparisonActions.ts` exposes stable commands to widgets, while
• The old component and handler hooks remain compatibility re-exports/status
• `createObjectContextHooks`...