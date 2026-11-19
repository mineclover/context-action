---
document_id: context-layered--store-selection-and-usage-guide
category: context-layered
source_path: ko/context-layered/store-selection-and-usage-guide.md
character_limit: 5000
last_update: '2026-11-19T22:10:08.943Z'
update_status: auto_generated
priority_score: 85
priority_tier: high
completion_status: completed
workflow_stage: content_generated
---
Store별 선택 기준 및 사용법 가이드

Store별 선택 기준 및 사용법 가이드 상태: Active 스펙 / 결정 ID: CA-SURFACE-CATALOG-001 소유자: Framework Core & React Runtime 관련 기준 문서: - Store and Time-Travel Contracts - Store 컨벤션 - 저장소 표면 카탈로그 - CA-STATECHART-EFFECT-001 Context-Action은 쓰기 경계(StoreWriter / Action Handler) 와 읽기 경계(StoreReader / 구독 훅·컨트롤러) 를 분리합니다. 모든 상태 변경은 Action Handler 내부에서 store.getValue()로 현재 값을 읽고, 순수 비즈니스 로직으로 다음 값을 계산한 뒤, store.setValue() 또는 store.update()로 커밋하는 3단계 흐름을 따릅니다. --- 1. Store 선택 매트릭스 | Store / 상태 수단 | 패키지 진입점 | 핵심 용도 | Undo/Redo | React 의존 | | --- | --- | --- | --- | --- | | createStoreContext | @context-action/react | 기본 권장. 도메인별 다중 스토어를 React 트리 스코프로 격리 | 없음 | 예 | | createStore (Store) | @context-action/react | Provider 밖의 단일 독립 스토어 (모듈 공유·DI·단위 테스트) | 없음 | 예 (Mutative 내장) | | createTimeTravelStoreContext / createTimeTravelStore | @context-action/react | Undo/Redo·히스토리 탐색이 필요한 에디터, 폼 드래프트, 캔버스 상태 | 예 (Mutative 패치) | 예 | | createStateStore | @context-action/store-core | Vanilla JS, Node, Preact, Lit, XState 공용 Zero-dependency 최소 참조 스토어 | 없음 | 아니오 (0 deps) | | createBackendStore (BackendStore) | @context-action/react/backend | 사용자 소유의 커스텀 StateBackend를 React 훅에 연결 | 백엔드 기능에 따름 | 예 (래퍼만) | | StoreTransactionCoordinator + bindActionTransactions | @context-action/react | 여러 Store의 변경을 하나의 원자적 커밋·롤백·단일 Undo 단위로 묶을 때 | 예 (다중 스토어 원자 Undo) | 예 | | useLocalStore / useComputedStore / StoreRegistry | @context-action/react/advanced | 컴포넌트 수명 로컬 스토어 / 메모이즈된 파생 계산 / 동적 스토어 등록 | 없음 | 예 | | createRefContext | @context-action/react | 비반응형 (Tier 3). DOM, Canvas, 120fps 포인터 좌표 등 리렌더 0회 상태 | 없음 | 예 | | createActorStateReader | @context-action/xstate | 닫힌 상태 머신 읽기 전용 투영. 외부 setValue() 차단, 전이는 이벤트로만 | 없음 | 아니오 | | createSourceContext / StoreController | @context-action/preact, @context-action/lit | 외부 Store를 Preact Signals 또는 Lit ReactiveController에 읽기 전용 투영 | 없음 | 아니오 | | createDurableOperationStore | @context-action/tool-durable-operations | UI 상태 아님. 외부 HTTP·큐·파일시스템 부작용의 멱등성·복구 레코드 저장소 | 없음 | 아니오 | --- 2. Store별 상세 사용법 2.1 createStoreContext (@context-action/react) — 표준 React 도메인 상태 같은 도메인에 속하는 여러 스토어를 하나의 Provider로 묶고 컴포넌트 트리 단위로 격리할 때 기본으로 사용합니다. { Provider, useStore, useStoreManager, useStoreInfo, useStoreClear, withProvider }를 반환합니다. 2.2 createStore (@context-action/react) — 독립 단일 Store Provider 없이 모듈 스코프, 직접 주입(DI), 또는 단위 테스트에서 단일 스토어 인스턴스를 쓸 때 사용합니다. 내부적으로 Mutative 패치를 발행하므로 useStorePath 경로 구독과 바로 호환됩니다. 2.3 createTimeTravelStoreContext & createTimeTravelStore (@context-action/react) — Undo / Redo 사용자가 실행 취소(Undo), 다시 실행(Redo), 히스토리 위치 탐색을 해야 할 때 사용합니다. - createTimeTravelStore(name, initialValue, { maxHistory, mutable, notificationMode, readMode })는 기존 구조적 공유 호환성을 위해 readMode: 'reference'를 기본값으로 유지합니다. - 선언적 createTimeTravelStoreContext는 readMode: 'safe'가 기본값입니다. - 외부

Key points:
• [Store and Time-Travel Contracts](../../../packages/react/docs/state-contracts.md)
• [Store 컨벤션](/ko/concept/store-conventions)
• [저장소 표면 카탈로그](/ko/context-layered/repository-surface-catalog)
• [CA-STATECHART-EFFECT-001](/ko/context-layered/decisions/CA-STATECHART-EFFECT-001)
• `createTimeTravelStore(name, initialValue, { maxHistory, mutable, notificationMode, readMode })`는 기존 구조적 공유 호환성을 위해 `readMode: 'reference'`를 기본값으로 유지합니다.
• 선언적 `createTimeTravelStoreContext`는 `readMode: 'safe'`가 기본값입니다.
• 외부 직렬화·전달 경계에서는 내부 상태 변이를 막기 위해 `store.getSafeValue()`를 사용합니다.
• `ownership: 'shared'` (기본값): 래퍼가 `dispose()`되어도 원본 백엔드는 살아 있습니다.
• `ownership: 'owned'`: 래퍼를 `dispose()`할 때 원본 백엔드도 함께 정리합니다.
• 참가자는 전역 자동 탐색이 아니라 **명시적으로 등록**해야 합니다.
• 커밋이 끝날 때까지 알림을 보류한 뒤 일괄 flush하므로 구독자가 절반만 커밋된 상태를 보지 않습니다.
• React 없이 프레임워크 중립으로 액션-트랜잭션을 묶으려면 `@context-action/xstate/effect`의 `bindActionDispatchTransactions` 및 `runInTransactionScope`를 사용합니다.
• **`useLocalStore(initialValue, name?)`**: 컴포넌트 마운트 수명에 묶인 로컬 `Store`를 생성해 언마운트 시 자동 `dispose()`하며 `{ value, name, lastUpdate, store }`를 반환합니다.
• **`useComputedStore(store, computeFn, config?)`**: 다른 스토어에서 파생된 계산 값을 `equalityFn`, `initialValue`, `onError`, `debounceMs` 옵션으로 메모이즈 구독합니다.
• **`StoreRegistry`**: 문자열 키 기반으로 동적 스토어를 등록·조회·정리해야 하는 고급 시나리오에만 사용합니다.
• **`createRefContext` (`@context-action/react`) — 비반응형 Tier 3 상태**: DOM 엘리먼트, HTML5 Canvas, 애니메이션 타이머, 120fps 마우스 좌표처럼 React 리렌더를 유발하면 안 되는 휘발성 상태는 `createRefContext`에 둡니다.
• **`createActorStateReader` (`@context-action/xstate`) — 닫힌 상태 머신 읽기 전용 투영**: 열린 `StateStore`와 달리 XState 액터는 외부 `setValue()`가 차단됩니다. 의도는 `ActionRegister` / `SyncActionPipeline`(`bindActorToActionRegister` / `bindActorToSyncPipeline`)으로만 전달하고, UI는 `createActorStateReader(actor, { select, equals })`의 단조 증가 `version` 스냅샷만 구독합니다.
• **Preact &...