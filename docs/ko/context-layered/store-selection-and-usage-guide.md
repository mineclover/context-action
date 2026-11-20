# Store별 선택 기준 및 사용법 가이드

**상태:** Active  
**스펙 / 결정 ID:** `CA-SURFACE-CATALOG-001`  
**소유자:** Framework Core & React Runtime  
**관련 기준 문서:**
- [Store and Time-Travel Contracts](../../../packages/react/docs/state-contracts.md)
- [Store 컨벤션](/ko/concept/store-conventions)
- [저장소 표면 카탈로그](/ko/context-layered/repository-surface-catalog)
- [CA-STATECHART-EFFECT-001](/ko/context-layered/decisions/CA-STATECHART-EFFECT-001)

Context-Action은 **쓰기 경계(`StoreWriter` / Action Handler)** 와 **읽기 경계(`StoreReader` / 구독 훅·컨트롤러)** 를 분리합니다. 모든 상태 변경은 Action Handler 내부에서 `store.getValue()`로 현재 값을 읽고, 순수 비즈니스 로직으로 다음 값을 계산한 뒤, `store.setValue()` 또는 `store.update()`로 커밋하는 3단계 흐름을 따릅니다.

---

## 1. Store 선택 매트릭스

| Store / 상태 수단 | 패키지 진입점 | 핵심 용도 | Undo/Redo | React 의존 |
| --- | --- | --- | --- | --- |
| **`createStoreContext`** | `@context-action/react` | **기본 권장.** 도메인별 다중 스토어를 React 트리 스코프로 격리 | 없음 | 예 |
| **`createStore` (`Store`)** | `@context-action/react` | Provider 밖의 단일 독립 스토어 (모듈 공유·DI·단위 테스트) | 없음 | 예 (Mutative 내장) |
| **`createTimeTravelStoreContext` / `createTimeTravelStore`** | `@context-action/react` | Undo/Redo·히스토리 탐색이 필요한 에디터, 폼 드래프트, 캔버스 상태 | **예 (Mutative 패치)** | 예 |
| **`createStateStore`** | `@context-action/store-core` | Vanilla JS, Node, Preact, Lit, XState 공용 Zero-dependency 최소 참조 스토어 | 없음 | **아니오 (0 deps)** |
| **`createBackendStore` (`BackendStore`)** | `@context-action/react/backend` | 사용자 소유의 커스텀 `StateBackend`를 React 훅에 연결 | 백엔드 기능에 따름 | 예 (래퍼만) |
| **`StoreTransactionCoordinator` + `bindActionTransactions`** | `@context-action/react` | 여러 Store의 변경을 하나의 원자적 커밋·롤백·단일 Undo 단위로 묶을 때 | **예 (다중 스토어 원자 Undo)** | 예 |
| **`useLocalStore` / `useComputedStore` / `StoreRegistry`** | `@context-action/react/advanced` | 컴포넌트 수명 로컬 스토어 / 메모이즈된 파생 계산 / 동적 스토어 등록 | 없음 | 예 |
| **`createRefContext`** | `@context-action/react` | **비반응형 (Tier 3).** DOM, Canvas, 120fps 포인터 좌표 등 리렌더 0회 상태 | 없음 | 예 |
| **`createActorStateReader`** | `@context-action/xstate` | **닫힌 상태 머신 읽기 전용 투영.** 외부 `setValue()` 차단, 전이는 이벤트로만 | 없음 | **아니오** |
| **`createSourceContext` / `StoreController`** | `@context-action/preact`, `@context-action/lit` | 외부 Store를 Preact Signals 또는 Lit `ReactiveController`에 읽기 전용 투영 | 없음 | **아니오** |
| **`createDurableOperationStore`** | `@context-action/tool-durable-operations` | **UI 상태 아님.** 외부 HTTP·큐·파일시스템 부작용의 멱등성·복구 레코드 저장소 | 없음 | **아니오** |

---

## 2. Store별 상세 사용법

### 2.1 `createStoreContext` (`@context-action/react`) — 표준 React 도메인 상태

같은 도메인에 속하는 여러 스토어를 하나의 Provider로 묶고 컴포넌트 트리 단위로 격리할 때 기본으로 사용합니다. `{ Provider, useStore, useStoreManager, useStoreInfo, useStoreClear, withProvider }`를 반환합니다.

<!-- @context-action-compile -->
```tsx
import { createStoreContext, asStoreValue, useStoreValue } from '@context-action/react';

const {
  Provider: OrderStoreProvider,
  useStore: useOrderStore,
} = createStoreContext('Order', {
  draft: { item: '', qty: 1 },
  // StoreConfig 형태와 혼동될 수 있는 일반 객체는 asStoreValue()로 감쌉니다
  metadata: asStoreValue({ initialValue: 'custom-user-field' }),
  status: 'idle' as 'idle' | 'submitting' | 'done',
});

// Action Handler 내부에서 사용할 쓰기 헬퍼 훅:
function useOrderQuantityUpdater() {
  const draftStore = useOrderStore('draft');
  return (qty: number) => {
    const current = draftStore.getValue();
    draftStore.setValue({ ...current, qty });
  };
}

// View 컴포넌트 (읽기):
function OrderQuantityBadge() {
  const draftStore = useOrderStore('draft');
  const draft = useStoreValue(draftStore);
  return <span>{draft.qty}</span>;
}

export { OrderStoreProvider, useOrderQuantityUpdater, OrderQuantityBadge };
```

### 2.2 `createStore` (`@context-action/react`) — 독립 단일 Store

Provider 없이 모듈 스코프, 직접 주입(DI), 또는 단위 테스트에서 단일 스토어 인스턴스를 쓸 때 사용합니다. 내부적으로 Mutative 패치를 발행하므로 `useStorePath` 경로 구독과 바로 호환됩니다.

<!-- @context-action-compile -->
```tsx
import { createStore, useStorePath } from '@context-action/react';

interface ProfileState {
  user: { name: string; age: number };
  theme: 'light' | 'dark';
}

const profileStore = createStore<ProfileState>('profile', {
  user: { name: 'Kim', age: 30 },
  theme: 'dark',
});

profileStore.update((prev) => ({
  ...prev,
  user: { ...prev.user, name: 'Lee' },
}));

export function UserNameLabel() {
  // 패치가 ['user', 'name'] 경로에 영향을 줄 때만 리렌더
  const name = useStorePath<ProfileState, string>(profileStore, ['user', 'name']);
  return <span>{name}</span>;
}

// 독립 생성한 스토어는 수명이 끝나면 반드시 정리합니다
profileStore.dispose();
```

### 2.3 `createTimeTravelStoreContext` & `createTimeTravelStore` (`@context-action/react`) — Undo / Redo

사용자가 실행 취소(Undo), 다시 실행(Redo), 히스토리 위치 탐색을 해야 할 때 사용합니다.

- `createTimeTravelStore(name, initialValue, { maxHistory, mutable, notificationMode, readMode })`는 기존 구조적 공유 호환성을 위해 `readMode: 'reference'`를 기본값으로 유지합니다.
- 선언적 `createTimeTravelStoreContext`는 `readMode: 'safe'`가 기본값입니다.
- 외부 직렬화·전달 경계에서는 내부 상태 변이를 막기 위해 `store.getSafeValue()`를 사용합니다.

<!-- @context-action-compile -->
```tsx
import { createTimeTravelStoreContext } from '@context-action/react';

const DocStores = createTimeTravelStoreContext('Doc', {
  content: { initialValue: { text: '' }, maxHistory: 50 },
});

export function HistoryToolbar() {
  const { canUndo, canRedo, undo, redo, position, historyLength } =
    DocStores.useTimeTravelControls('content');

  return (
    <div>
      <button type="button" disabled={!canUndo} onClick={() => undo()}>Undo</button>
      <button type="button" disabled={!canRedo} onClick={() => redo()}>Redo</button>
      <span>{position} / {historyLength}</span>
    </div>
  );
}
```

### 2.4 `createStateStore` (`@context-action/store-core`) — Zero-Dependency 참조 스토어

React·Mutative·DOM 없이 순수 TypeScript, Node.js, Vanilla JS, Preact, Lit, XState 환경에서 가벼운 상태 저장소가 필요할 때 사용합니다(`capabilities: { patches: false, timeline: false, immutableSnapshots: false }`). 불변성(새 참조 전달)은 호출자가 책임지며 `Object.is(prev, next)`로 동일 참조 갱신은 건너뜁니다.

<!-- @context-action-compile -->
```ts
import { createStateStore } from '@context-action/store-core';

const counterStore = createStateStore('counter', { count: 0 });
const unsubscribe = counterStore.subscribe(() => {
  const snapshot = counterStore.getSnapshot(); // { value, name, version, lastUpdate }
  console.log(`v${snapshot.version}: ${snapshot.value.count}`);
});

counterStore.update((prev) => ({ count: prev.count + 1 }));
unsubscribe();
counterStore.dispose?.();
```

### 2.5 `createBackendStore` / `BackendStore` (`@context-action/react/backend`) — 커스텀 백엔드 연결

`@context-action/store-core`의 `StateBackend<T, Patch>`(`createStateStore`, `MutativeStateBackend`, 또는 사용자 정의 영속/동기화 백엔드)를 React의 `useSyncExternalStore` 훅(`useStoreValue`, `useStoreSelector`, 패치 지원 시 `useStorePath`)에 그대로 연결합니다.

- `ownership: 'shared'` (기본값): 래퍼가 `dispose()`되어도 원본 백엔드는 살아 있습니다.
- `ownership: 'owned'`: 래퍼를 `dispose()`할 때 원본 백엔드도 함께 정리합니다.

<!-- @context-action-compile -->
```tsx
import { createStateStore } from '@context-action/store-core';
import { createBackendStore } from '@context-action/react/backend';
import { useStoreValue } from '@context-action/react';

const sharedBackend = createStateStore('session', { step: 1 });
const reactStore = createBackendStore('session', sharedBackend, { ownership: 'shared' });

export function SessionStep() {
  const state = useStoreValue(reactStore);
  return <span>Step {state.step}</span>;
}
```

### 2.6 `StoreTransactionCoordinator` & `bindActionTransactions` (`@context-action/react`) — 다중 Store 원자적 트랜잭션

하나의 논리 액션이 **2개 이상의 스토어를 함께 수정**하며 중간 상태 노출 방지, 예외 시 롤백, 단일 Undo가 필요할 때 사용합니다.

- 참가자는 전역 자동 탐색이 아니라 **명시적으로 등록**해야 합니다.
- 커밋이 끝날 때까지 알림을 보류한 뒤 일괄 flush하므로 구독자가 절반만 커밋된 상태를 보지 않습니다.
- React 없이 프레임워크 중립으로 액션-트랜잭션을 묶으려면 `@context-action/xstate/effect`의 `bindActionDispatchTransactions` 및 `runInTransactionScope`를 사용합니다.

<!-- @context-action-compile -->
```ts
import { StoreTransactionCoordinator, createTimeTravelStore } from '@context-action/react';

const cart = createTimeTravelStore('cart', { items: [] as string[] });
const totals = createTimeTravelStore('totals', { price: 0 });
const coordinator = new StoreTransactionCoordinator();

export async function addItemWithRollback() {
  await coordinator.run(
    [
      { name: 'cart', store: cart },
      { name: 'totals', store: totals },
    ],
    () => {
      cart.update((prev) => ({ items: [...prev.items, 'book'] }));
      totals.update((prev) => ({ price: prev.price + 25 }));
    },
    { label: 'addItem' },
  );

  // 트랜잭션 단위로 cart와 totals가 함께 되돌려집니다
  coordinator.undo();
}
```

### 2.7 `useLocalStore`, `useComputedStore`, `StoreRegistry` (`@context-action/react/advanced`)

- **`useLocalStore(initialValue, name?)`**: 컴포넌트 마운트 수명에 묶인 로컬 `Store`를 생성해 언마운트 시 자동 `dispose()`하며 `{ value, name, lastUpdate, store }`를 반환합니다.
- **`useComputedStore(store, computeFn, config?)`**: 다른 스토어에서 파생된 계산 값을 `equalityFn`, `initialValue`, `onError`, `debounceMs` 옵션으로 메모이즈 구독합니다.
- **`StoreRegistry`**: 문자열 키 기반으로 동적 스토어를 등록·조회·정리해야 하는 고급 시나리오에만 사용합니다.

---

## 3. React 구독 훅 선택 기준

| 훅 | 구독 단위 | 적합한 상황 |
| --- | --- | --- |
| **`useStoreValue(store, options?)`** | 스토어 값 전체 (`condition` 렌더링 게이트 지원) | 원시값 또는 대부분 필드를 함께 그리는 작은 스토어 |
| **`useStoreSelector(store, selector, equalityFn?)`** | `equalityFn`으로 비교한 파생 슬라이스 | 중간 크기 스토어에서 단일 필드·계산값만 구독할 때 |
| **`useStorePath(store, path, options?)`** | 패치 기반 경로 추적 (배열 경로 또는 RFC 6901 JSON Pointer) | 깊은 중첩 `PatchAwareStore`에서 다른 브랜치 변경을 무시해야 할 때 |
| **`useStoreSelectorWithPaths(store, selector, { dependsOn, equalityFn })`** | `dependsOn` 경로가 패치로 변경된 경우에만 `selector` 재실행 | 큰 중첩 트리에서 여러 경로를 조합하는 무거운 파생 셀렉터 |

---

## 4. 혼동하기 쉬운 비(非)스토어 및 타 프레임워크 경계

모든 상태를 React 반응형 `Store`에 넣을 필요는 없습니다.

1. **`createRefContext` (`@context-action/react`) — 비반응형 Tier 3 상태**: DOM 엘리먼트, HTML5 Canvas, 애니메이션 타이머, 120fps 마우스 좌표처럼 React 리렌더를 유발하면 안 되는 휘발성 상태는 `createRefContext`에 둡니다.
2. **`createActorStateReader` (`@context-action/xstate`) — 닫힌 상태 머신 읽기 전용 투영**: 열린 `StateStore`와 달리 XState 액터는 외부 `setValue()`가 차단됩니다. 의도는 `ActionRegister` / `SyncActionPipeline`(`bindActorToActionRegister` / `bindActorToSyncPipeline`)으로만 전달하고, UI는 `createActorStateReader(actor, { select, equals })`의 단조 증가 `version` 스냅샷만 구독합니다.
3. **Preact & Lit 읽기 전용 어댑터**:
   - **Preact** (`@context-action/preact`): `connectSourceSignal(store)`로 외부 스토어를 `ReadonlySignal`로 연결한 뒤 `createSourceContext`로 전달하고 `useProjection(signal, selector)`로 투영합니다.
   - **Lit** (`@context-action/lit`): 호스트에 `new StoreController(this, store, { selector, equalityFn })`를 붙이면 `hostConnected()`/`hostDisconnected()`에 맞춰 자동 구독·정리됩니다.
4. **`createDurableOperationStore` (`@context-action/tool-durable-operations`) — 영속 작업 복구 스토어**: HTTP·큐·파일시스템 등 외부 부작용의 `pending`/`completed`/`failed`/`unknown` 상태, lease, 재시도 복구를 기록하는 멱등성 저장소이며 UI 상태 스토어가 아닙니다.
