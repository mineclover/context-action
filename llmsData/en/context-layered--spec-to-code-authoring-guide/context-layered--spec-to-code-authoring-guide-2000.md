---
document_id: context-layered--spec-to-code-authoring-guide
category: context-layered
source_path: en/context-layered/spec-to-code-authoring-guide.md
character_limit: 2000
last_update: '2026-11-21T09:09:45.487Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Spec-to-Code Authoring Guide

Spec-to-Code Authoring Guide Status: Active Spec / Decision IDs: CA-SURFACE-CATALOG-001, CA-SPEC-EVIDENCE-001, CA-STATECHART-EFFECT-001, CA-ELEMENT-INTEROP-001 Owner: Framework Core, React Runtime & Architecture Governance Related Specifications: - Convention Index - Implementation Convention - Store Selection and Usage Guide - Core Action Contracts - React State Contracts - Interaction Intent to Implementation Flow - Unified Triad Self-Serve Sync Guide Context-Action is designed so that specification intent, domain state, execution pipelines, UI bindings, and verification gates map 1:1 to distinct code locations. Rather than jumping between seven separate manuals before writing a feature, use this guide as the single end-to-end blueprint connecting specs to idiomatic Context-Action code. --- 1. End-to-End Spec-to-Code Pipeline --- 2. Spec-to-Layer-to-Gate Mapping Matrix | Authoring Stage | Target Directory / Artifact | Core Coding Rule | Authoritative Spec | Enforcement Scope & Gate | | --- | --- | --- | --- | --- | | Stage 0 · Intent & Tiering | Design spec / PR / @evidence | Record UX shortcuts & fallback signals (CA-IIC-); apply 2-Second State Rule (Tier 1 TypeSpec + @evidenceR

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
• **Tool-Calling AI Workspace (`tool-protocol` + `ai-sdk` + `webmcp` +...