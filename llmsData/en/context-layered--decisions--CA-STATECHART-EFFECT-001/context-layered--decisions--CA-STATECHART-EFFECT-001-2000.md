---
document_id: context-layered--decisions--CA-STATECHART-EFFECT-001
category: context-layered
source_path: en/context-layered/decisions/CA-STATECHART-EFFECT-001.md
character_limit: 2000
last_update: '2026-11-19T09:22:46.305Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-STATECHART-EFFECT-001: Separate `@context-action/xstate` Adapter Boundary and Core Integration Philosophy

CA-STATECHART-EFFECT-001: Separate @context-action/xstate Adapter Boundary and Core Integration Philosophy Status: accepted for implementation; publication cohort unapproved Owner: Framework Core & Runtime Integration Related issue/spec: CA-STATECHART-EFFECT-001 (packages/xstate/docs/xstate-effect-integration.md, CA-ELEMENT-INTEROP-001, CA-SPEC-EVIDENCE-001) Context Integrations with XState v5, XState v6 (xstate@beta), Effect v4, and @xstate/effect cross both orchestration (ActionRegister, SyncActionPipeline) and state observation/transaction coordination (StateReader, TransactionCoordinatorPort). Placing those bridges inside @context-action/core and @context-action/store-core creates duplicate structural ports (because @context-action/core and @context-action/store-core cannot import each other), leaks async Fiber/Scope concepts into ./element's 0ms DOM transport layer, and introduces irreconcilable npm/pnpm peer dependency diamond conflicts between xstat

Key points:
• **Keep ports split inside `@context-action/core/element` and `@context-action/store-core`**: Rejected because it duplicates 7+ structural interfaces, couples DOM transport to Effect scopes, and cannot bind `@context-action/core`'s main `ActionRegister` and `@context-action/store-core` together.
• **Create two separate runtime packages (`@context-action/xstate` and `@context-action/effect`)**: Held as future split option if standalone non-statechart Effect adapters outgrow `.`'s shared actor/guard contracts;...