# 지연 뷰 구독 (`useStorePath` / `useStoreValue` + `useDeferredValue`)

`useStorePath` 또는 `useStoreValue`의 **즉시(urgent) 외부 Store 읽기**와 무거운 파생 UI(대용량 필터링 리스트, 차트, 코드 프리뷰)의 **비차단 렌더링**을 React 기본 훅 `useDeferredValue`로 분리하는 패턴입니다.

- **React 호환성**: React 18 / 19
- **래퍼 API 대신 패턴으로 유지하는 이유**: `useDeferredValue`는 렌더 비용이 존재하는 **뷰 경계**에서 선택하는 표준 React 스케줄링 프리미티브입니다. Store 구독은 tear-free 일관성을 위해 즉시성을 유지하고, 무거운 파생 뷰 prop만 지연 처리하면 커스텀 Store 스케줄러 API 없이도 입력 반응성을 지킬 수 있습니다.

## 사전 요구사항

- [useStoreValue 패턴](./useStoreValue-patterns.md)
- [경로 기반 구독](./path-based-subscription.md)
- [코드 패턴](../../code-patterns.md)

---

## `useSyncExternalStore` 환경에서 `useDeferredValue`가 필요한 이유

Context-Action의 Store 구독 훅(`useStoreValue`, `useStoreSelector`, `useStorePath`)은 모두 `useSyncExternalStore`를 사용합니다. React의 계약상 외부 Store 알림은 화면 불일치(tearing)를 막기 위해 알림 시점에 동기/긴급 업데이트로 처리되므로, Store 변경 자체를 `startTransition`으로 감싸도 렌더가 중단 가능하게 전환되지 않습니다.

동시에 기본 `Store`는 구독자 알림을 **RAF 배칭(`notificationMode: 'batched'`, 약 16ms)** 으로 처리합니다. 따라서 제어 `<input value={query} />`를 RAF 배칭 `Store`에 직접 묶으면 입력 반영이 1프레임 지연되어 실제 브라우저에서 **커서 점프**나 **한글 IME 조합 깨짐**이 발생할 수 있습니다.

입력 반응성과 무거운 파생 뷰의 비차단 렌더링을 모두 지키려면:

1. 제어 `<input>`은 로컬 `useState`로 동기 제어하고(또는 입력 상태 자체를 Store에 두어야 한다면 기본값이 `notificationMode: 'immediate'`인 `TimeTravelStore` 사용), 변경을 공유 `Store`에 반영합니다.
2. 결과 뷰는 `useStorePath` 또는 `useStoreValue`로 `Store` 값을 구독합니다.
3. 무거운 하위 컴포넌트로 내릴 값만 `useDeferredValue(query)`로 감싸고, 하위 컴포넌트를 `React.memo(...)`로 감싸 새 입력이 들어올 때 백그라운드 렌더가 안전하게 양보하도록 합니다.

---

## 표준 패턴: 동기 입력 제어 + 메모이제이션된 지연 하위 트리

<!-- @context-action-compile -->
```tsx
import React, { memo, useDeferredValue, useMemo, useState } from 'react';
import {
  createStoreContext,
  useStorePath,
} from '@context-action/react';

export interface CatalogItem {
  readonly id: string;
  readonly name: string;
  readonly category: string;
}

export interface CatalogFilterState {
  query: string;
  items: CatalogItem[];
}

const {
  Provider: CatalogStoreProvider,
  useStore: useCatalogStore,
} = createStoreContext('DeferredCatalog', {
  filterState: {
    query: '',
    items: [
      { id: '1', name: 'ActionRegister Pipeline', category: 'core' },
      { id: '2', name: 'Store Path Subscription', category: 'react' },
      { id: '3', name: 'TimeTravel Snapshot', category: 'mutative' },
    ],
  } as CatalogFilterState,
});

interface HeavyCatalogListProps {
  readonly query: string;
  readonly items: readonly CatalogItem[];
}

// React.memo가 필수입니다: query가 갱신될 때 HeavyCatalogList는
// 이전 deferredQuery 결과를 유지한 채 새 지연 렌더를 백그라운드로 미룹니다.
const HeavyCatalogList = memo(function HeavyCatalogList({
  query,
  items,
}: HeavyCatalogListProps) {
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized),
    );
  }, [items, query]);

  return (
    <ul aria-label="Catalog results">
      {filtered.map((item) => (
        <li key={item.id}>
          {item.name} ({item.category})
        </li>
      ))}
    </ul>
  );
});

function CatalogSearchBar() {
  const filterStore = useCatalogStore('filterState');
  // 기본 Store의 RAF 배칭(16ms)과 무관하게 제어 <input> 입력·IME 조합이
  // 매 키 입력마다 즉시 반영되도록 로컬 state로 동기 제어합니다.
  const [draftQuery, setDraftQuery] = useState('');

  return (
    <input
      aria-label="Filter catalog"
      value={draftQuery}
      onChange={(event) => {
        const nextQuery = event.target.value;
        setDraftQuery(nextQuery);
        // 루트 객체 교체 대신 Mutative draft를 수정해야 `useStorePath`가
        // 루트 패치가 아닌 세분화된 `['query']` 패치만 수신합니다.
        filterStore.update((draft) => {
          draft.query = nextQuery;
        });
      }}
    />
  );
}

function CatalogResultsView() {
  const filterStore = useCatalogStore('filterState');

  // 세밀한 경로 기반 Store 구독
  const query = useStorePath<CatalogFilterState, string>(filterStore, ['query']);
  const items = useStorePath<CatalogFilterState, readonly CatalogItem[]>(
    filterStore,
    ['items'],
  );

  // 무거운 파생 계산을 위한 비차단 지연 값
  const deferredQuery = useDeferredValue(query);
  const isStale = query !== deferredQuery;

  return (
    <div>
      {isStale && <span aria-live="polite">Updating results...</span>}
      <div style={{ opacity: isStale ? 0.7 : 1 }}>
        <HeavyCatalogList query={deferredQuery} items={items} />
      </div>
    </div>
  );
}

export function DeferredCatalogScreen() {
  return (
    <CatalogStoreProvider>
      <section>
        <CatalogSearchBar />
        <CatalogResultsView />
      </section>
    </CatalogStoreProvider>
  );
}
```

---

## 선택 기준: `useDeferredValue` vs 타이밍 제어 (`debounce` / `throttle` / `ActionGuard`)

| 상황 | 권장 방식 | 이유 |
|---|---|---|
| **클라이언트 측 순수 렌더 부하** (수천 행 필터링, 문법 강조, 차트/레이아웃 재계산) | `useStorePath` / `useStoreValue` + `useDeferredValue` + `React.memo` | 고정 타이머 지연 없이 기기 성능에 맞춰 동작하며, 후속 키 입력이 들어오면 즉시 중단·재스케줄링됩니다. |
| **네트워크 API 요청이나 무거운 핸들러 실행 억제** | 핸들러 `debounce` / `throttle` 옵션 또는 `ActionGuard` | `useDeferredValue`는 React 렌더링 스케줄링만 지연시킬 뿐, 액션 디스패치 자체의 부수효과 실행을 막지 않습니다. |
| **고빈도 외부 스트림의 UI 반영 빈도 상한 제한** (예: WebSocket 텔레메트리) | `useStoreValue(store, { throttle: 100 })` 또는 `debounce` | 초당 수십~수백 회 밀려오는 외부 상태 푸시의 커밋 주기를 명시적으로 제한합니다. |

## 핵심 불변식

- **지연 하위 트리를 `React.memo`로 감싸기**: `React.memo`(또는 `deferredQuery`에 키잉된 `useMemo`)가 없으면 긴급 렌더 시 무거운 계산이 그대로 다시 실행됩니다.
- **제어 `<input>`은 항상 동기 상태에 바인딩**: RAF 배칭 `Store`(`notificationMode: 'batched'`)에 `<input value>`를 직접 연결하지 말고 로컬 `useState`로 동기 제어(또는 `TimeTravelStore` 같은 `immediate` 모드 사용)하며, `<input value>`에 `deferredQuery`를 연결하지 마세요.
- **불안정한 인라인 객체/배열 prop 지양**: `items`처럼 Store에서 안정 참조로 읽은 슬라이스를 함께 전달해야 `React.memo`의 얕은 비교가 불필요하게 깨지지 않습니다.
