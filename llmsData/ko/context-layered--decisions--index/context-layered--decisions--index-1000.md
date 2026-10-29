---
document_id: context-layered--decisions--index
category: context-layered
source_path: ko/context-layered/decisions/index.md
character_limit: 1000
last_update: '2026-10-25T07:23:14.365Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
아키텍처 결정 기록

아키텍처 결정 기록 결정 기록은 지속되는 아키텍처 선택을 해당 컨벤션 가까이에 보관합니다. 이는 runtime registry가 아니며 package README나 공개 가이드를 중복하지 않습니다. 산출물별 소유권 | 산출물 | 소유하는 것 | 대체하지 않는 것 | | --- | --- | --- | | decision record | 지속 경계를 선택한 이유, 대안, invariant, 되돌림 조건 | 구현 세부나 소비자 사용법 | | package README | 발견 경로, public entry point, quickstart | 전체 동작 또는 아키텍처 계약 | | 권위 가이드 | 현재 동작, 제한, 운영 안내 | 결정 이력 | | 테스트와 집중 gate | 실행 가능한 증거 | 의도에

Key points:
• [CA-ELEMENT-INTEROP-001: Core subpath와 호스트 중립 Element binding](./CA-ELEMENT-INTEROP-001.md)
• [CA-SPEC-EVIDENCE-001: TypeSpec Evidence 결합 및 프론트엔드 상태 계층화(State Tiering) 거버넌스](./CA-SPEC-EVIDENCE-001.md)
• [PostgreSQL Durable...