# CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance

**Status:** accepted  
**Owner:** Framework Core & Architecture Governance  
**Related Issues/Specs:** CA-ARCH-001, CA-SPEC-001, [change-management-convention](../change-management-convention.md), [triad-evidence-sync-guide](../triad-evidence-sync-guide.md)  
**Last Reviewed:** 2026-10-18  

## Context

The Context-Action framework successfully isolates frontend state management and business logic through its 6-layer separation (`contexts / business / handlers / actions / hooks / views`). In particular, forcing pure functions (`*Draft`, `*Validation`, `*Result`, `*StateMachine`) into the `business/` layer provides high testability.

However, in large enterprise environments and autonomous AI agent workflows, new challenges emerged:
1. **Lack of Compile-Time Specification Traceability Enforcement**: Issue and specification IDs (`CA-*`) were verified only at the text/PR level. When product requirements or backend schemas drifted, discrepancies with frontend business functions could not be prevented fail-closed at compile time.
2. **Governance Friction from Frequent UI Changes**: If all UI states were governed by strict SSOT contracts, rapid surface-level iterations (modal open/close, focus, tab switching, etc.) would require constant TypeSpec recompilations and AST hash lock churn, hurting developer velocity.

To address these challenges, we integrate the compiler-backed SSOT governance from `tsp-evidence` and establish a **Three-Tier State Classification (State Tiering)** convention tailored for frontend development. (See the [Unified Triad Self-Serve Sync Guide](../triad-evidence-sync-guide.md) for the responsibility split and pull-based synchronization workflow across `ttsc-ex`, `oa-sdk`, and `context-action`.)

---

## Considered Alternatives

1. **Alternative A: Full-Scale TypeSpec SSOT for All States**
   - Model all Actions, Store States, and component-local presentation states in TypeSpec.
   - *Rejected*: Rapid presentation tweaks require continuous TypeSpec updates and AST lock maintenance, causing severe developer fatigue.
2. **Alternative B: Retain Status Quo PR Text Traceability**
   - Rely solely on `check-change-traceability.mjs` checking `#issue` or `CA-*` commit headers.
   - *Rejected*: Inability to perform 3-phase reverse forensics from UI errors back to requirement anchors, and vulnerable to silent schema drift.
3. **Alternative C (Accepted): Selective TypeSpec Evidence Integration with State Tiering**
   - Enforce TypeSpec SSOT and strict AST hash locking (`@evidenceReview`) only on durable domain contracts (Tier 1).
   - Pure business functions bind directly as TypeSpec "Policy Hopping" targets.
   - Explicit waiver for volatile presentation state (Tier 3).

---

## Decision

### 1. Three-Tier State Classification

All states and business functions must be classified into one of three tiers during design:

| Tier | Definition | Location | TypeSpec SSOT | Evidence Enforcement Level |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1: Durable Domain Contract** | External API DTOs, persistence models (IndexedDB/storage), legal/financial validation invariants, core FSM phase/events | `specs/*.tsp`<br>`contexts/`<br>`business/` | **Mandatory** | **Fail-Closed (`error`)**<br>Enforces `@evidenceReview` AST hash locking |
| **Tier 2: Transient Application Logic** | Client-only calculation formulas (`*Result.ts`), view-specific derived models, activity log events (`*Activity.ts`) | `business/`<br>`hooks/` | Optional | **Phased (`warning` / `off`)**<br>Permits warnings during beta cycles |
| **Tier 3: Volatile Presentation State** | Modal open/close (`isOpen`), focus/hover, active tabs, pre-validation draft inputs, UI animations | Component `useState`<br>`ref` Context | **Forbidden** | **Explicit Waiver**<br>Excluded from Evidence tracking |

### 2. Pure Business Functions as Policy Hopping Targets (`ttsc@0.33.1` / `@wrtnlabs/evidence@0.8.0`)

Functions inside the `business/` layer are pure functions free of React or DOM runtime coupling. They are officially recognized as binding targets for contract declarations synthesized by `tsp-evidence` and `oa-sdk`:

```typespec
// specs/order.tsp
@evidence("docs/requirements.md#CA-ORDER-1", "Order submission validation invariants")
model OrderValidationPolicy {}
```

```typescript
// packages/react/src/patterns/canonical-order/business/orderValidation.ts
/**
 * @evidence ./generated/dto.ts#OrderValidationPolicy Order submission validation invariants
 * @evidenceReview ./generated/dto.ts#OrderValidationPolicy #65a0cfc
 */
export function validateOrderDraft(draft: OrderDraft): ValidationIssue[] {
  // Pure business validation logic
}
```

- **Heading-Form Annotations and Comment-Bloat Pruning**: Multi-paragraph rationales and checklists use `## @evidence`, `## @evidenceReview`, and `## @evidenceExclude` Heading-Form blocks or detached Markdown files (`evidenceFiles: ["evidence/**/*.md"]`) configured in `evidence.config.json`.
- **File-Header `@evidenceExclude`**: Tier 3 presentation view files (`views/*.tsx`) declare `@evidenceExclude` in the top-of-file comment header to exempt all exported declarations in the file at once.

### 3. Full-Chain Reverse Forensics

When a defect is discovered in a component or handler, developers and AI agents can trace upstream to the requirement anchor in a single step:
$$\text{OrderView / Handlers} \xrightarrow{} \text{business/orderValidation.ts} \xrightarrow[\text{@evidenceReview}]{\text{AST Hash}} \text{generated/dto.ts} \xrightarrow{} \text{specs/order.tsp} \xrightarrow[\text{@evidence}]{\text{Anchor}} \text{docs/requirements.md\#CA-ORDER-1}$$

### 4. Phased Severity Lifecycle

To avoid friction during early prototyping:
- **Inception / Experimental**: `"severity": "off"` (no CI blocks during exploratory phase)
- **Beta / Hardening**: `"severity": "warning"` (surfaces missing anchors and gaps)
- **GA / Release**: `"severity": "error"` (strict fail-closed gate; 100% coverage required)

---

## Consequences and Invariants

1. **Zero-Dependency Package Preservation**: `@context-action/core`, `@context-action/react`, `@context-action/preact`, and `@context-action/preact-ui` remain zero-dependency runtimes and never depend directly on `@typespec/*`, `@oa-sdk/*`, `ttsc`, or `@wrtnlabs/evidence`.
2. **Pure Function Invariant**: `business/` modules strictly observe zero React/framework imports.
3. **Action Intent Separation and Parallel Aspect Hydration**: `BusinessActionIntent` and `LayoutActionIntent` never mix payloads (`No Mixed Payloads`), and decoupled storage aspects (`@entityRoot` + `@aspectOf`) are hydrated in parallel via `Promise.allSettled` inside `handlers/`.
4. **Presentation State Waiver and 6-Level Layout Invariant**: Modeling component-internal visual flags (`isOpen`, `activeTab`, etc.) in TypeSpec or Evidence is rejected as an anti-pattern, and views adhere to the 6-Level layout hierarchy, Two Golden Rules, and 4-Tier Semantic Z-Index tokens (`--z-base: 1` through `--z-toast: 1100`).

---

## Verification Evidence

- `pnpm docs:management`: Verifies paired KO/EN docs, issue templates, convention index, and ADR link integrity.
- `pnpm llms:check`: Verifies `llmsData/` summary template synchronization after doc updates.
- `pnpm convention:check` (`node scripts/verify-context-action-conventions.mjs`): Verifies Context-Layered 6-layer boundaries, React isolation, and use-case boundaries.
- `tsp-evidence check specs/**/*.tsp` / `npx evidence check --only <unit> --context`: Verifies TypeSpec and generated TS declaration bindings against frontend pure business functions.
