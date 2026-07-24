---
document_id: context-layered--usecase-recipe-profile
category: context-layered
source_path: en/context-layered/usecase-recipe-profile.md
character_limit: 1000
last_update: '2026-07-24T05:15:02.261Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Layered Usecase and Recipe Profile

Context-Layered Usecase and Recipe Profile The existing six-layer structure remains the internal runtime architecture. This profile adds the public boundary needed to connect that runtime to a design-system-based product UI. Positioning Context-Layered Architecture is the umbrella name. Usecase Boundary, Facade, and Recipe are boundaries within that architecture, not a replacement a

Key points:
• `actions` and `hooks` can accidentally become an undocumented public API
• `views` can mix pure rendering with product-level composition
• an Astryx primitive can become coupled to domain state...