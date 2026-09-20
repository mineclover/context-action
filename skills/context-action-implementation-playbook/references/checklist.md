# Checklist

- Classify state into 3 tiers up front:
  - **Tier 1 (Durable Domain Contract)**: API DTOs, storage models, validation rules, FSM phase/events -> TypeSpec SSOT candidate
  - **Tier 2 (Transient Application Logic)**: Derived view-models, client calculations, activity events -> `business/` pure functions
  - **Tier 3 (Volatile Presentation State)**: Modal `isOpen`, focus, active tab, UI animations -> **Explicit Waiver (Never model in TypeSpec/Evidence)**
- Define draft, validation, result, activity, and workflow state up front
- Use `business/` for pure functions only (qualify as TypeSpec Policy Hopping targets)
- Use a state machine when the flow has more than one async phase
- Split handlers by concern instead of keeping one large registry file
- Convert domain events to UI text in handler support or hooks
- Keep views render-only (strict Presentation Waiver)
- Add at least one integration test for invalid, valid, and reset flows
- Register source files and link docs
- When binding to TypeSpec SSOT, verify AST hash lock with `@evidenceReview`
