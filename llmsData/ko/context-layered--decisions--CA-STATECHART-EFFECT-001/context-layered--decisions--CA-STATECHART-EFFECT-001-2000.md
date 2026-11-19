---
document_id: context-layered--decisions--CA-STATECHART-EFFECT-001
category: context-layered
source_path: ko/context-layered/decisions/CA-STATECHART-EFFECT-001.md
character_limit: 2000
last_update: '2026-11-19T09:22:46.302Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
CA-STATECHART-EFFECT-001: `@context-action/xstate` 어댑터 경계 분리 및 핵심 통합 철학

CA-STATECHART-EFFECT-001: @context-action/xstate 어댑터 경계 분리 및 핵심 통합 철학 상태: 구현 채택, 배포 버전 조합 미승인 소유자: Framework Core & Runtime Integration 관련 이슈/스펙: CA-STATECHART-EFFECT-001 (packages/xstate/docs/xstate-effect-integration.md, CA-ELEMENT-INTEROP-001, CA-SPEC-EVIDENCE-001) 맥락 XState v5, XState v6(xstate@beta), Effect v4 및 @xstate/effect 연동은 오케스트레이션 평면(ActionRegister, SyncActionPipeline)과 상태 관찰·트랜잭션 경계(StateReader, TransactionCoordinatorPort)를 모두 가로지릅니다. 이를 @context-action/core와 @context-action/store-core 내부에 두면 두 코어 패키지가 서로를 import할 수 없는 경계 규칙 때문에 구조적 포트를 중복 선언해야 하고, ./element의 0ms DOM 전달 계층에 Effect Scope 개념이 섞이며, xstate@^5와 @xstate/effect(xstate@^6.0.0-alpha 요구) 간 npm/pnpm 피어 의존성 다이아몬드 충돌이 발생합니다. 검토한 선택지 - @context-action/core/element와 @context-action/store-core에 분산 유지: 7개 이상의 구조적 인터페이스가 중복되고 DOM 계층에 Effect Scope 수명이 혼입되며, 메인 ActionRegister와 store-core를 직접 연결할 수 없어 제외했습니다. - 초기부터 @context-action/xstate와 @context-action/effect 2개 패키지로 완전 분리: 상태 머신과 무관한 Effect 전

Key points:
• **`@context-action/core/element`와 `@context-action/store-core`에 분산 유지**: 7개 이상의 구조적 인터페이스가 중복되고 DOM 계층에 Effect Scope 수명이 혼입되며, 메인 `ActionRegister`와 `store-core`를 직접 연결할 수 없어 제외했습니다.
• **초기부터 `@context-action/xstate`와 `@context-action/effect` 2개 패키지로 완전 분리**: 상태 머신과 무관한 Effect 전용 기능이 커질 경우의 향후 분리안으로 남기고, 현재는 공통 액터·가드·트랜잭션 계약 공유와 배포 복잡도 절감을 위해 보류했습니다.
• **옵션 1 (채택): `.` 및 `./effect` 서브패스를 가진 단일 선택적 패키지 `@context-action/xstate`**: 코어 두 패키지의 Zero-Dependency 순수성을 유지하면서 구조적 포트 위에서 동기·비동기 액션, 스토어, 상태 머신, 스키마, Effect 계약을 표준화합니다.
•...