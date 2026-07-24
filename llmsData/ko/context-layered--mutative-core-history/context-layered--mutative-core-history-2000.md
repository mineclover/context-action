---
document_id: context-layered--mutative-core-history
category: context-layered
source_path: ko/context-layered/mutative-core-history.md
character_limit: 2000
last_update: '2026-07-24T05:15:02.450Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Mutative Core 히스토리 및 원본 참조

Mutative Core 히스토리 및 원본 참조 상태: @context-action/mutative-core 활성 참조 문서 범위: 소스 계보, 반영한 수정, 라이선스, 동기화 규칙 @context-action/mutative-core는 Context-Action runtime adapter가 사용하는 하위 immutable-update engine이다. upstream 호환성을 유지하는 독립 경계로 관리하며, TimeTravel 같은 Context-Action 전용 helper는 @context-action/mutative가 소유한다. 소스 계보 | 단계 | 참조 | 역할 | | --- | --- | --- | | 원본 프로젝트 | unadlib/mutative | Mutative 원본 구현과 이슈 이력 | | 유지보수 포크 | mineclover/mutative | 유지보수와 upstream 호환 수정의 기준 포크 | | 편입 revision | 5fd7d56 | @context-action/mutative-core에 vendoring한 revision | | Context-Action 패키지 | packages/mutative-core | publish 패키지와 동기화 경계 | 이 revision은 2026-07-18에 준비했으며, 설치 시 별도 빌드가 필요하지 않도록 배포 산출물도 포함한다. 전체 provenance는 패키지의 UPSTREAM.md에도 기록한다. 반영한 upstream 작업 - PR #166: lazy array draft 성능, rollback, species constructor, assigned value 수정. - Issue #160: nested create() 호출에서 원본 base state의 참조가 노출되지 않도록 미변경 descendant를 분리. - Issue #32: Immer 스타일 호출부를 위한 create의 정확한 alias produce 추가. 다음 제안은 identity와 replay

Key points:
• [PR #166](https://github.com/unadlib/mutative/pull/166): lazy array draft
• [Issue #160](https://github.com/unadlib/mutative/issues/160): nested
• [Issue #32](https://github.com/unadlib/mutative/issues/32): Immer 스타일
• [Issue #127](https://github.com/unadlib/mutative/issues/127): `move`/`copy`
• [Issue #162](https://github.com/unadlib/mutative/issues/162): splice 전용
• [Issue #163](https://github.com/unadlib/mutative/issues/163): array 구현
• `produce(..., { freeze: true })`는 core `enableAutoFreeze`로 전달하며,
• `produceWithPatches`는 core tuple
• `createTimeTravel`은 `enableAutoFreeze`, `strict`,...