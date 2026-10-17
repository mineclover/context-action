---
name: context-action-implementation-playbook
description: Use when adding or refactoring repository examples to follow the Context-Action implementation-playbook standard. Triggers on requests for standard conventions, implementation playbooks, scenario examples, explicit state machine flows, Unified Triad Evidence/Layout sync, or reusable Context-Layered example structures.
---

# Context-Action Implementation Playbook

Use this skill when a repository example or scenario should follow the standard implementation-playbook structure and Unified Triad (`ttsc-ex` · `oa-sdk` · `context-action`) governance conventions.

Do not default every request to a full demo. Start with the smallest shape that still proves the architecture, then iterate upward only if the scenario keeps paying for itself.

## What this skill produces

- a `contexts / business / handlers / actions / hooks / views` 6-layer split
- `BusinessActionIntent` vs `LayoutActionIntent` separation (`No Mixed Payloads`)
- pure business modules (`*Draft.ts`, `*Validation.ts`, `*Result.ts`, `*Activity.ts`, `*StateMachine.ts`) with `ttsc@0.33.1` / `@wrtnlabs/evidence@0.8.0` Policy Hopping locks (`@evidenceReview ./generated/dto.ts#... #hash`, Heading-Form `## @evidence`, or detached `evidenceFiles`)
- handlers split by concern (`Draft` vs `Submission` / `Hydration`) using `Promise.allSettled` for parallel `@entityRoot` + `@aspectOf` aspect hydration
- thin views adhering to the 6-Level layout hierarchy, Two Golden Rules, 4-Tier Semantic Z-Index tokens (`--z-base: 1` ~ `--z-toast: 1100`), and Tier 3 Presentation State Waiver (file-header `@evidenceExclude`)
- source registration, paired KO/EN docs linkage, and local verification gates (`pnpm docs:management`, `pnpm llms:check`, `pnpm convention:check`)

## Read these references first

- `references/checklist.md`
- `references/scenario-recipes.md`
- `references/scaffolding.md`
- `references/test-and-doc-linking.md`
- `references/maturity-levels.md`
- `../../docs/ko/context-layered/implementation-convention.md`
- `../../docs/ko/context-layered/triad-evidence-sync-guide.md`
- `../../docs/ko/context-layered/decisions/CA-SPEC-EVIDENCE-001.md`
- `../../docs/ko/context-layered/convention-index.md`

If the user is working in English, also read:

- `../../docs/en/context-layered/implementation-convention.md`
- `../../docs/en/context-layered/triad-evidence-sync-guide.md`
- `../../docs/en/context-layered/decisions/CA-SPEC-EVIDENCE-001.md`
- `../../docs/en/context-layered/convention-index.md`

## Pick the right target shape first

- Use a **scenario blueprint** when the user wants breadth, pattern transfer, or planning examples across multiple domains
- Use a **discoverable page** when the team needs a visible scenario catalog without full interactivity
- Use a **full interactive example** when the scenario needs real UI behavior, explicit workflow transitions, and integration tests

## Workflow

1. Define the scenario contract and 3-Tier State Ownership
   - What is the draft, validation policy, and produced result?
   - Which async phases need an explicit state machine?
   - Classify state by the **2-Second State Rule** (`CA-SPEC-EVIDENCE-001`):
     - **Tier 1 (Durable Domain Contract)**: survives reload / API DTO / core FSM $\to$ `.tsp` model & `@evidenceReview` lock required
     - **Tier 2 (Transient Application Logic)**: client calculation (`*Result.ts`) & activity events (`*Activity.ts`)
     - **Tier 3 (Volatile Presentation State)**: ephemeral UI chrome (`isOpen`, `activeTab`, `isHovered`, `isFocused`) & imperative handles $\to$ explicitly waived from TypeSpec/Evidence

2. Create context boundaries (`contexts/`)
   - Separate **`BusinessActionIntent`** (persistence mutations, business FSM transitions, MCP tool dispatches) from **`LayoutActionIntent`** (split dock toggles, panel resize, canvas zoom/pan, tab switching) — **No Mixed Payloads**
   - Store context for draft, validation, submission/review, activity
   - Ref context only when imperative focus, scrolling, or encapsulated Custom Element OOP Facade handles (`useImperativeHandle` / `createCustomElementBridge({ createHandle })`) are needed

3. Split `business/` (Pure Functions & Policy Hopping)
   - `*Draft.ts`
   - `*Validation.ts`
   - `*Result.ts` or domain-specific result module
   - `*Activity.ts`
   - `*StateMachine.ts`
   - optional barrel `*Business.ts`
   - Lock generated TypeScript contracts from `oa-sdk` / `tsp-evidence` using `ttsc@0.33.1` & `@wrtnlabs/evidence@0.8.0`:
     - `@evidenceReview ./generated/dto.ts#Symbol #hash`
     - multi-line Heading-Form (`## @evidence`, `## @evidenceReview`, `## @evidenceExclude`)
     - or detached `evidenceFiles: ["evidence/**/*.md"]`

4. Split `handlers/` (Registry Orchestration & Parallel Aspect Hydration)
   - draft/edit/reset handlers
   - submission/review/approval handlers
   - support file for mapping domain outputs into view text
   - When hydrating decoupled `@entityRoot` and `@aspectOf` storage aspects, use **`Promise.allSettled`** in parallel so optional aspect failures degrade gracefully (`degraded: true` / `null`) without blocking the core view

5. Keep the view thin (`views/` & 6-Level Layout Hierarchy)
   - Place file-header `@evidenceExclude` at the top of Tier 3 view files
   - Render subscribed state and emit action helpers only (no embedded business rules)
   - Follow the **6-Level layout hierarchy** (`L1 app-shell` $\to$ parallel siblings `L2 page-canvas` & `L3 dock-panel` $\to$ `L4 slot-panel` $\to$ `L5 section-card` $\to$ `L6 floating-overlay`), **Two Golden Rules** (Component Slot Decomposition & Viewport Geometry Isolation via Native Top Layer `<dialog>`/`popover` or `scale(1/zoom)`), and **4-Tier Semantic Z-Index** (`--z-base: 1` ~ `--z-toast: 1100`, no magic numbers)

6. Add verification and run local gates
   - invalid flow, valid flow, post-success draft invalidation, and reset baseline tests
   - Run the repository governance and documentation gates:
     - `pnpm docs:management`
     - `pnpm llms:check`
     - `pnpm convention:check`

7. Add discoverability
   - source registration
   - paired KO/EN example and convention docs
   - scenario library or overview entry

8. Run the iteration loop
   - check whether transitions are explicit enough
   - check whether activity entries derive from domain events
   - check whether the view still contains business logic or mixed intents
   - decide whether the scenario should remain a blueprint or be promoted

## Guardrails

- **Zero-Dependency Runtime Preservation**: Never add `@typespec/*`, `@oa-sdk/*`, `ttsc`, or `@wrtnlabs/evidence` as runtime dependencies of `@context-action/*` packages
- **No Mixed Payloads**: Never mix `BusinessActionIntent` and `LayoutActionIntent` in the same action payload contract
- **Generated Contract Locking**: Do not point `.ts` `@evidenceReview` directly at `.tsp` files; always lock generated TypeScript declarations (`./generated/dto.ts#... #hash`) or use detached `evidenceFiles`
- **Presentation State Waiver**: Never model Tier 3 UI flags (`isOpen`, `activeTab`, `isHovered`, `isFocused`) in TypeSpec or Evidence
- **Layout & Z-Index Hygiene**: Never mount global modals inside a transformed canvas (`transform: matrix(...)`) or use arbitrary z-index magic numbers (`9999`)
- Do not return UI wording directly from validation functions
- Do not mutate workflow state ad hoc in handlers when a state machine should exist
- Do not log final UI strings directly if domain events can be logged first
- Do not put pricing, scoring, approval, or validation rules into `views/`

## Exit criteria

- the scenario follows the standard 6-layer split and intent separation
- the async workflow has explicit transitions and `Promise.allSettled` aspect resilience when needed
- paired KO/EN docs and `llmsData/` are synchronized
- `pnpm docs:management`, `pnpm llms:check`, `pnpm convention:check`, tests, and builds pass

## Iterative enhancement rule

When this skill is used repeatedly, improve the weakest layer first instead of expanding surface area at random.

Recommended order:

1. split business logic and separate `BusinessActionIntent` vs `LayoutActionIntent`
2. add or refine explicit state transitions and `@evidenceReview` contract locks
3. convert log strings into domain events
4. improve paired KO/EN docs, `llmsData`, and source discoverability
5. only then promote blueprint scenarios into full demos
