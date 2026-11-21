---
document_id: context-layered--spec-to-code-authoring-guide
category: context-layered
source_path: en/context-layered/spec-to-code-authoring-guide.md
character_limit: 5000
last_update: '2026-11-21T09:09:45.487Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Spec-to-Code Authoring Guide

Spec-to-Code Authoring Guide Status: Active Spec / Decision IDs: CA-SURFACE-CATALOG-001, CA-SPEC-EVIDENCE-001, CA-STATECHART-EFFECT-001, CA-ELEMENT-INTEROP-001 Owner: Framework Core, React Runtime & Architecture Governance Related Specifications: - Convention Index - Implementation Convention - Store Selection and Usage Guide - Core Action Contracts - React State Contracts - Interaction Intent to Implementation Flow - Unified Triad Self-Serve Sync Guide Context-Action is designed so that specification intent, domain state, execution pipelines, UI bindings, and verification gates map 1:1 to distinct code locations. Rather than jumping between seven separate manuals before writing a feature, use this guide as the single end-to-end blueprint connecting specs to idiomatic Context-Action code. --- 1. End-to-End Spec-to-Code Pipeline --- 2. Spec-to-Layer-to-Gate Mapping Matrix | Authoring Stage | Target Directory / Artifact | Core Coding Rule | Authoritative Spec | Enforcement Scope & Gate | | --- | --- | --- | --- | --- | | Stage 0 · Intent & Tiering | Design spec / PR / @evidence | Record UX shortcuts & fallback signals (CA-IIC-); apply 2-Second State Rule (Tier 1 TypeSpec + @evidenceReview, Tier 2 client rules/activity, Tier 3 volatile UI waived) | IIC Flow, CA-SPEC-EVIDENCE-001 | Advisory / Cross-Repo (fail-closed when running sibling ttsc-ex / oa-sdk Policy Hopping checks) | | Stage 1 · Boundaries & Store Selection | contexts/ (Contexts.tsx, Context.ts) | Separate BusinessActionIntent from LayoutActionIntent (No Mixed Payloads); choose progressive adoption level (Level 1 Lite, Level 2 Standard Headless-First DI, Level 3 Enterprise 6-Layer); pick primitive from Store matrix | Store Selection Guide, Triad Sync Guide | CI-Enforced: pnpm convention:check, pnpm package-boundary:check | | Stage 2 · Pure Domain Logic | business/ (Draft.ts, Validation.ts, Result.ts, Activity.ts, StateMachine.ts) | Zero React & @context-action/ imports; pure state + event -> nextState transitions; no UI copy or DOM calls; emit structured domain events instead of UI strings | Implementation Convention, Explicit State Machine | CI-Enforced: pnpm convention:check (business/ filename + import boundary rules) | | Stage 3A · Headless Engine (Optional) | runtime/ (create.ts, .test.ts) | Pure TypeScript engine assembly (ActionRegister + createStore / createStateStore / TimeTravelStoreManager) runnable in Node/Workers/Preact/Lit; zero react/react-dom or React layer imports; test directly without DOM | Context-Layered Guide, Headless-First Showcase | CI-Enforced: pnpm convention:check (runtime/ .ts naming + zero React/UI imports) | | Stage 3B · React Orchestration | handlers/ (HandlerRegistry.tsx, useHandlers.tsx, HandlerSupport.ts) | Three-step commit loop (getValue() -> business/ -> setValue()/update()); use 4-role hooks; coordinate multi-store atomic undo via StoreTransactionCoordinator / bindActionTransactions; hydrate decoupled @entityRoot + @aspectOf storage via Promise.allSet

Key points:
• [Convention Index](./convention-index.md)
• [Implementation Convention](./implementation-convention.md)
• [Store Selection and Usage Guide](./store-selection-and-usage-guide.md)
• [Core Action Contracts](../../../packages/core/docs/action-contracts.md)
• [React State Contracts](../../../packages/react/docs/state-contracts.md)
• [Interaction Intent to Implementation Flow](./interaction-intent-implementation-flow.md)
• [Unified Triad Self-Serve Sync Guide](./triad-evidence-sync-guide.md)
• **Enterprise 6-Layer Playbooks (React Registry + Business + Explicit FSM + IIC):**
• **Headless-First Symmetric DI (`runtime/` + `ownership="shared"` React DI):**
• **Tool-Calling AI Workspace (`tool-protocol` + `ai-sdk` + `webmcp` + `tool-durable-operations`):**