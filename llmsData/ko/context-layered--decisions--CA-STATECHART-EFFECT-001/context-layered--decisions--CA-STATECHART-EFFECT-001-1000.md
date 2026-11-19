---
document_id: context-layered--decisions--CA-STATECHART-EFFECT-001
category: context-layered
source_path: ko/context-layered/decisions/CA-STATECHART-EFFECT-001.md
character_limit: 1000
last_update: '2026-11-19T09:22:46.302Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-STATECHART-EFFECT-001: `@context-action/xstate` 어댑터 경계 분리 및 핵심 통합 철학

CA-STATECHART-EFFECT-001: @context-action/xstate 어댑터 경계 분리 및 핵심 통합 철학 상태: 구현 채택, 배포 버전 조합 미승인 소유자: Framework Core & Runtime Integration 관련 이슈/스펙: CA-STATECHART-EFFECT-001 (packages/xstate/docs/xstate-effect-integration.md, CA-ELEMENT-INTEROP-001, CA-SPEC-EVIDENCE-001) 맥락 XState v5, XState v6(xstate@beta), Effect v4 및 @xstate/effect 연동은 오케스트레이션 평면(ActionRegister, SyncA

Key points:
• **`@context-action/core/element`와 `@context-action/store-core`에 분산 유지**: 7개 이상의 구조적 인터페이스가 중복되고 DOM 계층에 Effect Scope 수명이 혼입되며, 메인 `ActionRegister`와...