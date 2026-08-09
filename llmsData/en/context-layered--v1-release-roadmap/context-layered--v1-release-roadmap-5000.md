---
document_id: context-layered--v1-release-roadmap
category: context-layered
source_path: en/context-layered/v1-release-roadmap.md
character_limit: 5000
last_update: '2026-08-09T02:32:09.916Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Context-Action v1.0 Release Roadmap

Context-Action v1.0 Release Roadmap --- status: draft canonical: true roadmapRevision: v1-r2 baselineCommit: 0d6047b99961a33ef0d09704ae39c577d3b89cd8 translation: ko: docs/ko/context-layered/v1-release-roadmap.md --- Release principle: v1.0.0 is a contract freeze, not a version-number change. 1. Outcome and planning rule The v1.0.0 release is ready only when Context-Action can make, and keep through the 1.x line, this promise: > Its public API, runtime semantics, lifecycle behavior, and package > compatibility are documented, mutually consistent, and demonstrated with > reproducible consumer-facing evidence. This roadmap is the single delivery plan for work that is required to reach that state. It deliberately includes legacy removal, contract decisions, implementation hardening, package verification, documentation, and release operations. A work item is not complete when code merges; it is complete only when its contract, tests, consumer impact, and documentation are aligned. Non-negotiable ordering Breaking cleanup belongs before the v1.0 API freeze. A deprecated or legacy surface has only three allowed outcomes during the 0.9.x stabilization line: 1. remove it before the freeze and publish a migration path; 2. retain it as a supported 1.x public contract; or 3. move it behind an explicitly experimental package or subpath. Do not carry a temporary compatibility shim into v1.0 without treating it as a 1.x maintenance obligation. New features, new adapters, broad refactors, and unproven performance work stay outside this plan unless they are necessary to clear a release gate. 2. Current release baseline - Baseline commit: 0d6047b99961a33ef0d09704ae39c577d3b89cd8 (fix: harden execution metrics and WebMCP scope lifecycle) - Roadmap revision: v1-r2 - Versioning mode: Lerna independent - Evidence status: source and focused tests were inspected; the full release gate has not been certified as one evidence bundle. - Current verdict: NOT READY The statuses below describe the baseline; they are not claims that a CI run or an external consumer certification completed. No CI status/workflow result is recorded as release evidence for this baseline. | Gate | Current status | Baseline assessment | | --- | --- | --- | | G0 Scope/versioning | partial | Independent versioning is configured; package/subpath classification is open. | | G1 Public API | partial | Role API hardening exists; legacy retain/remove decisions are open. | | G2 Core execution | implemented-unverified | Role-conflict, atomic-once, guard semantics, and observer aggregation regressions exist. | | G3 Lifecycle/metrics | implemented-unverified | Cancellation metrics, retry cancellation, and observer/lifecycle work exist. | | G4 React contract | partial | WebMCP generics/resolver handling a

Key points:
• **Baseline commit:** `0d6047b99961a33ef0d09704ae39c577d3b89cd8`
• **Roadmap revision:** `v1-r2`
• **Versioning mode:** Lerna `independent`
• **Evidence status:** source and focused tests were inspected; the full release
• **Current verdict:** `NOT READY`
• Severity: P0 | P1 | P2
• Milestone:
• Affected public contract:
• Current behavior and reproduction:
• Expected 1.0 contract:
• Chosen resolution:
• Compatibility and migration impact:
• Test / package / documentation evidence:
• Owner and status:
• API-surface diff from M1 and after every public export/declaration change;
• packed-consumer smoke and dependency checks from M0 and after each relevant
• documentation and migration fixtures from M1 and after each public change;
• security and supply-chain checks across the release train.
• Record HEAD SHA, Node, pnpm, TypeScript, React, package versions, and latest
• Generate an export and package-metadata snapshot for each publishable
• Build a legacy inventory spanning exports, aliases, deprecated types,
• Build the P0/P1 risk register from the core, React, tool adapter, lifecycle,
• Record the actual verification commands and their baseline result. Existing
• Decide stable/experimental package classification, supported runtime matrix,
• Freeze the intended Core semantics: role identity, cross-role ID collision
• Decide lifecycle ownership for abort, timeout, queued work, debounce, retry,
• Decide canonical Tool Protocol ordering and the supported AI SDK and WebMCP
• For each legacy item, choose **remove**, **retain as 1.x contract**, or
• Add direct regression and negative type tests for role replacement, guard
• Test deterministic ordering and diagnostics for sequential, parallel, and
• Enforce an atomic `once` claim before invocation across every execution
• Enforce...