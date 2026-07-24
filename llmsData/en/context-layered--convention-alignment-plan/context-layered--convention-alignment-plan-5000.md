---
document_id: context-layered--convention-alignment-plan
category: context-layered
source_path: en/context-layered/convention-alignment-plan.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.315Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Convention Alignment Plan

Context-Layered Convention Alignment Plan Status: Direct-registration inventory closed; remaining structural gates tracked Last reviewed: 2026-07-16 This document records the repository-level decision for aligning existing examples and documentation with the Context-Layered architecture. It sits beside the implementation convention because it describes the current-state classification, the fixed provider composition, and the migration gates needed to make the convention enforceable. Decisions 1. Context-Layered is the single standard for new work New scenarios use these layers: Strict MVVM material remains useful as migration context, but it is not a second standard for new implementation-playbook work. 2. Every handler is registered through a Handler Registry There is no size-based exception. - Context files define and compose boundaries; they do not register handlers. - Every domain exposes a HandlerRegistry (or an equivalent registry component). - All useActionHandler calls belong inside the registry or its handler modules. - Pages and views mount the registry; they do not register handlers directly. This rule applies to one-handler examples as well as multi-phase workflows. It keeps registration, cleanup, priority, and dependency injection reviewable in one place. 3. Provider composition is fixed The canonical nesting order is: This is a repository convention, not a claim that the runtime requires one order. Include the Ref Provider when the domain defines a ref boundary; otherwise the registry follows the Store Provider directly. This ensures every registry is below the boundaries it may depend on. Lint and convention enforcement The repository uses Biome 2.5.3, which is the current npm latest as of 2026-07-14. Both Biome configurations were migrated with biome migrate --write from the deprecated linter.rules.recommended option to linter.rules.preset. The root configuration remains lint-only for package source, while the example configuration keeps the formatter-enabled check gate. Biome remains responsible for language-level concerns: parsing, formatting, import organization, and generic lint rules. Context-Layered rules are enforced by the repository-specific pnpm convention:check command in scripts/check-context-layered-conventions.mjs. This split is intentional: a Biome GritQL plugin can match a local syntax pattern, but registry placement, transitional exceptions, Provider ordering, and migration classification are repository structure rules that need file-aware analysis and an explicit migration inventory. The first structural rule is already active: every useActionHandler(...) call must be inside a handlers/ module or a HandlerRegistry file. The transitional allowlist is now empty: the direct-registration inventory has

Key points:
• Context files define and compose boundaries; they do not register handlers.
• Every domain exposes a `*HandlerRegistry` (or an equivalent registry component).
• All `use*ActionHandler` calls belong inside the registry or its handler modules.
• Pages and views mount the registry; they do not register handlers directly.
• `CanonicalOrderHandlers.tsx` already composes an action provider, store provider, ref provider, and handler registry.
• `LogMonitor` was the first migration target: its boundaries now live under `contexts/`, all five handlers are registered by `handlers/LogMonitorHandlerRegistry.tsx`, and its provider order is canonical.
• `ChatUI`, the context-store mouse-events container, conditional permission execution, and the foundations/react Child A/B domain now also keep all handler registration in dedicated Registry modules.
• The foundations/react parent and child handlers now share `FoundationHandlerRegistry`, and the conditional permission route uses its canonical Action → Store provider wrapper with the Registry around the view.
• The foundations/core Basics demo now separates `contexts/`, pure `business/` rules, and `handlers/CoreBasicsHandlerRegistry.tsx`.
• The foundations/react Provider demo now keeps its handler registration in `handlers/ProviderHandlerRegistry.tsx` and composes it through `ProviderRuntime`.
• The advanced Concurrent Actions demo now injects task callbacks into `handlers/ConcurrentActionHandlerRegistry.tsx` instead of registering handlers in the page.
• The advanced Canvas demo now separates `contexts/CanvasContexts.tsx` from `handlers/CanvasHandlerRegistry.tsx` while preserving its public compatibility hooks.
• The `useRefMountState` pattern demo now separates ref/store/action boundaries under `contexts/`, pure render-count...