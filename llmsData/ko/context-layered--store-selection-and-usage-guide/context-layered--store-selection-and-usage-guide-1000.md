---
document_id: context-layered--store-selection-and-usage-guide
category: context-layered
source_path: ko/context-layered/store-selection-and-usage-guide.md
character_limit: 1000
last_update: '2026-11-19T22:10:08.942Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store별 선택 기준 및 사용법 가이드

Store별 선택 기준 및 사용법 가이드 상태: Active 스펙 / 결정 ID: CA-SURFACE-CATALOG-001 소유자: Framework Core & React Runtime 관련 기준 문서: - Store and Time-Travel Contracts - Store 컨벤션 - 저장소 표면 카탈로그 - CA-STATECHART-EFFECT-001 Context-Action은 쓰기 경계(StoreWriter / Action Handler) 와 읽기 경계(StoreReader / 구독 훅·컨트롤러) 를 분리합니다. 모든 상태 변경은 Action Handler 내부에서 store.getValue()로 현재 값을 읽고, 순수 비즈니스 로직으로 다음 값을 계

Key points:
• [Store and Time-Travel Contracts](../../../packages/react/docs/state-contracts.md)
• [Store 컨벤션](/ko/concept/store-conventions)
• [저장소 표면 카탈로그](/ko/context-layered/repository-surface-catalog)
•...