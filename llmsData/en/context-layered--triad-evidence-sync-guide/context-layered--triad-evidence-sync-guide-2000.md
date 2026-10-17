---
document_id: context-layered--triad-evidence-sync-guide
category: context-layered
source_path: en/context-layered/triad-evidence-sync-guide.md
character_limit: 2000
last_update: '2026-10-17T15:53:28.625Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Unified Triad (`ttsc-ex` · `oa-sdk` · `context-action`) Responsibility Split and Self-Serve Sync Guide

Unified Triad (ttsc-ex · oa-sdk · context-action) Responsibility Split and Self-Serve Sync Guide Status: active Owner: Framework Core & Architecture Governance Related Docs: Implementation Convention, CA-SPEC-EVIDENCE-001, Panel Layout Preference Convention Cross-Workspace Canonical References: - ttsc-ex Unified Hub: /Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md - ttsc-ex Frontend Integration Guide: /Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md - oa-sdk Delegation & Sync Guide: /Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md --- 1. Purpose and Three-Workspace Responsibility Boundaries Within the Unified Triad architecture, context-action owns frontend modular state management, the action intent pipeline, and viewport layout hierarchy (Pillar 3 & Pillar 4). Meanwhile, .tsp (TypeSpec) domain contract modeling and TypeScript/OpenAPI code generation are owned by o

Key points:
• `ttsc-ex` Unified Hub: `/Users/junwoobang/workflow/samchon/docs/cross-repo-responsibility-and-sync-guide.md`
• `ttsc-ex` Frontend Integration Guide: `/Users/junwoobang/workflow/samchon/docs/context-action-frontend-evidence-guide.md`
• `oa-sdk` Delegation & Sync Guide: `/Users/junwoobang/workflow/oa-sdk/docs/guides/ttsc-ex-delegation-and-sync-guide.md`
• **Locking Generated TypeScript Contract Symbols**:
• **Comment-Bloat Pruning**:
• Never mix business and layout payloads when designing `contexts/` and `handlers/` (`No Mixed...