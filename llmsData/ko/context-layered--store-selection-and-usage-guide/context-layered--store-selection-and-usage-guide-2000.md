---
document_id: context-layered--store-selection-and-usage-guide
category: context-layered
source_path: ko/context-layered/store-selection-and-usage-guide.md
character_limit: 2000
last_update: '2026-11-19T22:10:08.942Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store별 선택 기준 및 사용법 가이드

Store별 선택 기준 및 사용법 가이드 상태: Active 스펙 / 결정 ID: CA-SURFACE-CATALOG-001 소유자: Framework Core & React Runtime 관련 기준 문서: - Store and Time-Travel Contracts - Store 컨벤션 - 저장소 표면 카탈로그 - CA-STATECHART-EFFECT-001 Context-Action은 쓰기 경계(StoreWriter / Action Handler) 와 읽기 경계(StoreReader / 구독 훅·컨트롤러) 를 분리합니다. 모든 상태 변경은 Action Handler 내부에서 store.getValue()로 현재 값을 읽고, 순수 비즈니스 로직으로 다음 값을 계산한 뒤, store.setValue() 또는 store.update()로 커밋하는 3단계 흐름을 따릅니다. --- 1. Store 선택 매트릭스 | Store / 상태 수단 | 패키지 진입점 | 핵심 용도 | Undo/Redo | React 의존 | | --- | --- | --- | --- | --- | | createStoreContext | @context-action/react | 기본 권장. 도메인별 다중 스토어를 React 트리 스코프로 격리 | 없음 | 예 | | createStore (Store) | @context-action/react | Provider 밖의 단일 독립 스토어 (모듈 공유·DI·단위 테스트) | 없음 | 예 (Mutative 내장) | | createTimeTravelStoreContext / createTimeTravelStore | @context-action/react | Undo/Redo·히스토리 탐색이 필요한 에디터, 폼 드래프트, 캔버스 상태 | 예 (Mutative 패치) | 예 | | createStateStore | @context-action/store-core | Vanilla JS, Node, Pre

Key points:
• [Store and Time-Travel Contracts](../../../packages/react/docs/state-contracts.md)
• [Store 컨벤션](/ko/concept/store-conventions)
• [저장소 표면 카탈로그](/ko/context-layered/repository-surface-catalog)
• [CA-STATECHART-EFFECT-001](/ko/context-layered/decisions/CA-STATECHART-EFFECT-001)
• `createTimeTravelStore(name, initialValue, { maxHistory, mutable, notificationMode, readMode })`는 기존 구조적 공유 호환성을 위해 `readMode: 'reference'`를 기본값으로 유지합니다.
• 선언적 `createTimeTravelStoreContext`는 `readMode: 'safe'`가 기본값입니다.
• 외부 직렬화·전달 경계에서는 내부 상태 변이를 막기 위해 `store.getSafeValue()`를 사용합니다.
• `ownership: 'shared'` (기본값): 래퍼가...