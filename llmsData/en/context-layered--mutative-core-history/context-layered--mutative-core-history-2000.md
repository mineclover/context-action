---
document_id: context-layered--mutative-core-history
category: context-layered
source_path: en/context-layered/mutative-core-history.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.268Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Mutative Core History and Upstream References

Mutative Core History and Upstream References Status: Active reference for @context-action/mutative-core Scope: source lineage, carried fixes, licensing, and synchronization rules @context-action/mutative-core is the low-level immutable-update engine used by the Context-Action runtime adapter. It is a maintained, upstream-compatible package boundary; Context-Action-specific helpers such as time travel remain in @context-action/mutative. Lineage | Stage | Reference | Role | | --- | --- | --- | | Original project | unadlib/mutative | Original Mutative implementation and issue history | | Maintained fork | mineclover/mutative | Fork used for maintenance and upstream-compatible fixes | | Imported revision | 5fd7d56 | Revision vendored into @context-action/mutative-core | | Context-Action package | packages/mutative-core | Published core package and synchronization boundary | The imported revision was prepared on 2026-07-18 and includes generated distributable output so packag

Key points:
• [PR #166](https://github.com/unadlib/mutative/pull/166): lazy array draft
• [Issue #160](https://github.com/unadlib/mutative/issues/160): nested
• [Issue #32](https://github.com/unadlib/mutative/issues/32): `produce` is
• [Issue #127](https://github.com/unadlib/mutative/issues/127): `move`/`copy`
• [Issue #162](https://github.com/unadlib/mutative/issues/162): splice-specific
• [Issue #163](https://github.com/unadlib/mutative/issues/163): bundle-size
• `produce(..., { freeze: true })` maps to core `enableAutoFreeze`; `strict` is
• `produceWithPatches` returns the core tuple
•...