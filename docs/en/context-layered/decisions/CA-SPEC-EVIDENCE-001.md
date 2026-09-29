# CA-SPEC-EVIDENCE-001: TypeSpec Evidence Integration and Frontend State Tiering Governance

**Status:** accepted  
**Owner:** Framework Core & Architecture Governance  
**Related Issues/Specs:** CA-ARCH-001, CA-SPEC-001, [change-management-convention](../change-management-convention.md)  
**Last Reviewed:** 2026-09-19  

## Context

The Context-Action framework successfully isolates frontend state management and business logic through its 6-layer separation (`contexts / business / handlers / actions / hooks / views`). In particular, forcing pure functions (`*Draft`, `*Validation`, `*Result`, `*StateMachine`) into the `business/` layer provides high testability.

However, in large enterprise environments and autonomous AI agent workflows, new challenges emerged:
1. **Lack of Compile-Time Specification Traceability Enforcement**: Issue and specification IDs (`CA-*`) were verified only at the text/PR level. When product requirements or backend schemas drifted, discrepancies with frontend business functions could not be prevented fail-closed at compile time.
2. **Governance Friction from Frequent UI Changes**: If all UI states were governed by strict SSOT contracts, rapid surface-level iterations (modal open/close, focus, tab switching, etc.) would require constant TypeSpec recompilations and AST hash lock churn, hurting developer velocity.

To address these challenges, we integrate the compiler-backed SSOT governance from `tsp-evidence` and establish a **Three-Tier State Classification (State Tiering)** convention tailored for frontend development.

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

### 2. Pure Business Functions as Policy Hopping Targets

Functions inside the `business/` layer are pure functions free of React or DOM runtime coupling. They are officially recognized as TypeSpec runtime policy targets:

```typespec
// specs/order.tsp
@evidence("docs/requirements.md#CA-ORDER-1", "Order submission validation invariants")
model OrderValidationPolicy {}
```

```typescript
// packages/react/src/patterns/canonical-order/business/orderValidation.ts
/**
 * @evidenceReview specs/order.tsp#OrderValidationPolicy #65a0cfc
 */
export function validateOrderDraft(draft: OrderDraft): ValidationIssue[] {
  // Pure business validation logic
}
```

### 3. Full-Chain Reverse Forensics

When a defect is discovered in a component or handler, developers and AI agents can trace upstream to the requirement anchor in a single step:
$$\text{OrderView / Handlers} \xrightarrow{} \text{business/orderValidation.ts} \xrightarrow[\text{@evidenceReview}]{\text{AST Hash}} \text{specs/order.tsp} \xrightarrow[\text{@evidence}]{\text{Anchor}} \text{docs/requirements.md\#CA-ORDER-1}$$

### 4. Phased Severity Lifecycle

To avoid friction during early prototyping:
- **Inception / Experimental**: `"severity": "off"` (no CI blocks during exploratory phase)
- **Beta / Hardening**: `"severity": "warning"` (surfaces missing anchors and gaps)
- **GA / Release**: `"severity": "error"` (strict fail-closed gate; 100% coverage required)

---

## Consequences and Invariants

1. **Package Independence**: `@context-action/core` and `@context-action/react` packages remain zero-dependency runtimes and do not depend directly on `@ttsc/*` or TypeSpec compiler packages.
2. **Pure Function Invariant**: `business/` modules strictly observe zero React/framework imports.
3. **Presentation State Waiver Invariant**: Modeling component-internal visual flags in TypeSpec is an anti-pattern and will be rejected in review.

---

## Verification Evidence

- `pnpm convention:check`: Verifies Context-Layered boundary and React isolation.
- `node scripts/verify-context-action-conventions.mjs`: Verifies repository-wide convention integrity.
- `tsp-evidence check specs/**/*.tsp`: Verifies TypeSpec model citations and AST references.
