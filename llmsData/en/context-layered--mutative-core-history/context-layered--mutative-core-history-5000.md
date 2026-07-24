---
document_id: context-layered--mutative-core-history
category: context-layered
source_path: en/context-layered/mutative-core-history.md
character_limit: 5000
last_update: '2026-07-24T05:15:02.268Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Mutative Core History and Upstream References

Mutative Core History and Upstream References Status: Active reference for @context-action/mutative-core Scope: source lineage, carried fixes, licensing, and synchronization rules @context-action/mutative-core is the low-level immutable-update engine used by the Context-Action runtime adapter. It is a maintained, upstream-compatible package boundary; Context-Action-specific helpers such as time travel remain in @context-action/mutative. Lineage | Stage | Reference | Role | | --- | --- | --- | | Original project | unadlib/mutative | Original Mutative implementation and issue history | | Maintained fork | mineclover/mutative | Fork used for maintenance and upstream-compatible fixes | | Imported revision | 5fd7d56 | Revision vendored into @context-action/mutative-core | | Context-Action package | packages/mutative-core | Published core package and synchronization boundary | The imported revision was prepared on 2026-07-18 and includes generated distributable output so package consumers do not need an install-time build. The complete provenance is also recorded in the package's UPSTREAM.md. Upstream work carried forward - PR #166: lazy array draft performance, rollback, species-constructor, and assigned-value fixes. - Issue #160: nested create() calls now detach untouched descendants instead of exposing references into the original base state. - Issue #32: produce is exported as an exact alias of create for Immer-style call sites. The following proposals remain intentionally outside the core package until their identity and replay semantics are specified: - Issue #127: move/copy operations. - Issue #162: splice-specific patch representation. - Issue #163: bundle-size reduction follow-up after the array implementation. Context-Action adapter contract @context-action/mutative is the Context-Action-facing adapter and forwards the core behavior instead of maintaining a second immutable-update engine: - produce(..., { freeze: true }) maps to core enableAutoFreeze; strict is forwarded independently and rejects non-draft replacement values. - produceWithPatches returns the core tuple [state, patches, inversePatches]. Set updates use a replace patch so undo/redo preserves insertion order. - createTimeTravel forwards enableAutoFreeze, strict, and patchesOptions. String patch paths are valid only for string properties and string Map keys. Numeric/object Map keys and Symbol properties require array paths and otherwise fail explicitly. - Time-travel listeners expose transition-only patches separately from the complete history so React path subscriptions do not replay historical patches on every update. - enableAutoFreeze freezes object, array, Map, and Set shells and blocks their normal mutators. Direct prototype calls such as Map.prototype.set.call(ma

Key points:
• [PR #166](https://github.com/unadlib/mutative/pull/166): lazy array draft
• [Issue #160](https://github.com/unadlib/mutative/issues/160): nested
• [Issue #32](https://github.com/unadlib/mutative/issues/32): `produce` is
• [Issue #127](https://github.com/unadlib/mutative/issues/127): `move`/`copy`
• [Issue #162](https://github.com/unadlib/mutative/issues/162): splice-specific
• [Issue #163](https://github.com/unadlib/mutative/issues/163): bundle-size
• `produce(..., { freeze: true })` maps to core `enableAutoFreeze`; `strict` is
• `produceWithPatches` returns the core tuple
• `createTimeTravel` forwards `enableAutoFreeze`, `strict`, and
• Time-travel listeners expose transition-only patches separately from the
• `enableAutoFreeze` freezes object, array, Map, and Set shells and blocks their
• Review new issues and pull requests in the original repository and the
• Prefer importing a focused upstream commit over making Context-Action-only
• Record the imported commit in `UPSTREAM.md`, this history, and the package
• Run core tests and type checks first, then build `@context-action/mutative`,
• Publish the core package before publishing the adapter package when the