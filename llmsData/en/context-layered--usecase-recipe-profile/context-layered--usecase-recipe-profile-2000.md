---
document_id: context-layered--usecase-recipe-profile
category: context-layered
source_path: en/context-layered/usecase-recipe-profile.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.261Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Usecase and Recipe Profile

Context-Layered Usecase and Recipe Profile The existing six-layer structure remains the internal runtime architecture. This profile adds the public boundary needed to connect that runtime to a design-system-based product UI. Positioning Context-Layered Architecture is the umbrella name. Usecase Boundary, Facade, and Recipe are boundaries within that architecture, not a replacement architecture. Why the profile exists The original six layers explain how Context-Action executes a workflow, but they do not define the public UI boundary clearly enough: - actions and hooks can accidentally become an undocumented public API - views can mix pure rendering with product-level composition - an Astryx primitive can become coupled to domain state or context-action This profile makes the ownership explicit: | Boundary | Owns | Must not own | | --- | --- | --- | | Domain business | Pure validation, calculation, state transitions | React, stores, UI wording | | Runtime | Contexts, hand

Key points:
• `actions` and `hooks` can accidentally become an undocumented public API
• `views` can mix pure rendering with product-level composition
• an Astryx primitive can become coupled to domain state or `context-action`
• expose nouns for state and verbs for commands
• do not expose handler IDs, store managers, or raw `dispatch`
• derive values such as `isOpen`, `isBusy`, and `canSubmit` in the facade
• keep async result, abort, retry, and error normalization inside the facade
• import the design-system primitives and the feature facade
• preserve controlled props such as `isOpen`, `value`,...