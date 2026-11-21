# Phase 2 (`v5`) 마이그레이션 및 준비 가이드

이 문서는 [`CA-VNEXT-ARCHITECTURE-001`](./decisions/CA-VNEXT-ARCHITECTURE-001.md)의 **Phase 2 (`v5` 메이저 호환성 정리)** 를 대비해 애플리케이션 팀, 스타터 템플릿, 외부 소비자가 사전에 준비할 수 있는 절차를 정리합니다. 여기에 포함된 모든 준비 단계는 기존 루트 import나 `4.x` 호환성을 깨지 않고 현재 `4.x` 브랜치에서 점진적으로 적용할 수 있습니다.

- **상태:** `4.x` 사전 준비 진행 중 (`packages/template-react` 준수 완료, `v5` breaking 제거는 릴리스 승인 전까지 유보)
- **선행 기준선:** [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) (`stage`에 `M0–M4` Phase 1 완료) · [vNext 아키텍처 핸드오프 가이드](./vnext-architecture-handoff.md)

## 1. Phase 1 (`4.x` 무중단) vs. Phase 2 (`v5` 메이저) 경계

Phase 1은 기존 `4.x` 소비자의 호환성을 100% 유지하면서 점진적 전환에 필요한 프리미티브를 먼저 제공했습니다:

| 영역 | 현재 `4.x`에서 사용 가능 (무중단 Opt-In) | Phase 2 (`v5` 메이저)로 이월된 정리 항목 |
| :--- | :--- | :--- |
| React 진입점 | 루트 `.` re-export를 유지한 채 `@context-action/react/{refs,time-travel,transactions,backend}` 서브패스 제공 | 루트 `@context-action/react`에서 특화 API(`createRefContext`, `createTimeTravelStore*`, `StoreTransactionCoordinator`, `createBackendStore` 등) 제거 |
| Dispatch 훅 대칭성 | `useActionResultDispatch()`와 `useActionScope()`를 주력 API로 승격, `useActionDispatchWithResult()`에 `@deprecated` 표기 | `useActionDispatchWithResult`, `useActionEffectHandler`, `registerEffect`, `StoreSchema` / `defineStoreSchema`, `compareStrategy` 제거 |
| 액션 큐 정책 | `ActionRegister` / `createActionContext`의 계약 단위 `actions: { [name]: { queue, timeout } }` 정책 및 `{ immediate: false }` 지연 큐 할당 | 소비자가 호출부 `{ immediate: true }` 대신 계약 단위 큐 정책을 채택한 뒤 기본 `useConcurrencyQueue`(`true` vs `false`) 재평가 |
| 스토어 알림 모드 | `Store`, `TimeTravelStore`, `createStoreContext`, `createTimeTravelStoreContext`에 명시적 `notificationMode?: 'batched' \| 'immediate'` 추가 (기본값 `'batched'` 유지) | 활성 소비자 감사 완료 후 기본 알림 모드 통일 여부 확정 |

## 2. 소비자 마이그레이션 레시피 (`4.x` 호환 & `v5` 준비)

### 2.1 Ref · Time-Travel · Transaction · Backend Import를 서브패스로 이동

변경 전 (`4.x` 루트 배럴):

```ts
import {
  createActionContext,
  createRefContext,
  createTimeTravelStoreContext,
  StoreTransactionCoordinator,
} from '@context-action/react';
```

변경 후 (`4.x` 호환 & `v5` 준비 완료):

<!-- @context-action-compile -->
```ts
import {
  createActionContext,
  createStoreContext,
  type ActionPayloadMap,
} from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import {
  createTimeTravelStore,
  createTimeTravelStoreContext,
} from '@context-action/react/time-travel';
import { StoreTransactionCoordinator } from '@context-action/react/transactions';

export interface WorkspaceActions extends ActionPayloadMap {
  submitOrder: { orderId: string };
  resetDraft: void;
  retrySubmission: void;
}

export const {
  Provider: WorkspaceActionProvider,
  useActionDispatch: useWorkspaceDispatch,
  useActionResultDispatch: useWorkspaceResultDispatch,
  useActionScope: useWorkspaceScope,
} = createActionContext<
  WorkspaceActions,
  { submitOrder: { accepted: boolean } }
>('WorkspaceActions', {
  actions: {
    resetDraft: { queue: 'immediate' },
    retrySubmission: { queue: 'immediate', timeout: 5_000 },
  },
});

export const {
  Provider: WorkspaceStoreProvider,
  useStore: useWorkspaceStore,
} = createStoreContext('WorkspaceStores', {
  status: { initialValue: 'idle' as 'idle' | 'submitting', notificationMode: 'batched' },
  pendingCount: { initialValue: 0, notificationMode: 'immediate' },
});

export const WorkspaceRefs = createRefContext<{ focusInput: HTMLInputElement }>('WorkspaceRefs');
export const timelineStore = createTimeTravelStore(
  'workspace-timeline',
  { step: 0 },
  { maxHistory: 20, notificationMode: 'batched' }
);
export const TimeTravelCtx = createTimeTravelStoreContext('WorkspaceTimeTravel', {
  history: { initialValue: { step: 0 }, notificationMode: 'batched' },
});
export const coordinator = new StoreTransactionCoordinator();
```

### 2.2 `useActionDispatchWithResult()` 및 호출부 `{ immediate: true }` 대체

Provider 단위 결과 수집에는 `useActionResultDispatch()`를(컴포넌트 언마운트 시 abort 스코프가 필요할 때는 `useActionScope()`를) 사용하고, UI 호출부마다 `{ immediate: true }`를 넘기는 대신 `actions` 정책 맵에 `{ queue: 'immediate' }`를 선언합니다:

<!-- @context-action-compile -->
```tsx
import { type ActionPayloadMap, createActionContext } from '@context-action/react';

interface SearchActions extends ActionPayloadMap {
  runSearch: { query: string };
  cancelDraft: void;
}

interface SearchResults {
  runSearch: string[];
}

export const {
  useActionDispatch,
  useActionResultDispatch,
  useActionScope,
} = createActionContext<SearchActions, SearchResults>('SearchActions', {
  actions: {
    cancelDraft: { queue: 'immediate' },
  },
});

export function SearchControls() {
  const dispatch = useActionDispatch();
  const dispatchResult = useActionResultDispatch();
  const scope = useActionScope();

  const handleRun = async (query: string) => dispatchResult('runSearch', { query });
  const handleScopedRun = async (query: string) => scope.dispatchWithResult('runSearch', { query });
  const handleCancel = () => dispatch('cancelDraft');

  return (
    <div>
      <button type="button" onClick={() => void handleRun('context-action')}>Search</button>
      <button type="button" onClick={() => void handleScopedRun('scoped')}>Scoped</button>
      <button type="button" onClick={handleCancel}>Cancel</button>
    </div>
  );
}
```

### 2.3 전역 동시성 큐 없이 특정 디스패치만 직렬화하기

`useConcurrencyQueue`가 생략되었거나 비활성화된 상태에서도 `{ immediate: false }`를 명시하면 `ActionRegister`가 내부 `dispatchQueue`를 지연 초기화하여 해당 호출을 직렬 실행합니다:

<!-- @context-action-compile -->
```ts
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';

interface QueueActions extends ActionPayloadMap {
  syncItem: { id: string };
}

export async function dispatchSeriallyWithoutGlobalQueue() {
  const register = new ActionRegister<QueueActions>({
    name: 'LazySerialExample',
  });

  register.register('syncItem', async ({ id }) => {
    await Promise.resolve(id);
  });

  await Promise.all([
    register.dispatch('syncItem', { id: 'first' }, { immediate: false }),
    register.dispatch('syncItem', { id: 'second' }, { immediate: false }),
  ]);

  await register.destroyAsync({ deferCleanup: true });
}
```

## 3. 자동 준비도 감사기 (`pnpm audit:v5-readiness`)

저장소에 포함된 TypeScript AST 기반 감사기(`scripts/audit-v5-readiness.mjs`)는 주석·문자열 리터럴의 오탐 없이 소비자 코드를 분류합니다:

```bash
pnpm audit:v5-readiness                       # template-react 및 example 요약 리포트 출력
pnpm audit:v5-readiness -- --strict-template   # packages/template-react/src 내 blocking 항목 시 실패
pnpm audit:v5-readiness -- --json              # 파일/라인/컬럼 단위 JSON 리포트 출력
pnpm audit:v5-readiness -- --root ../my-app    # 외부 소비자 앱 경로 스캔
pnpm test:v5-readiness                         # AST 픽스처 및 스타터 템플릿 준수 테스트 실행
```

### 감사 분류 기준

| 분류 (`category`) | 게이트 역할 | 탐지 대상 |
| :--- | :--- | :--- |
| `deprecatedApis` | 차단 (`--strict-template`) | `useActionDispatchWithResult`, `useActionEffectHandler`, `registerEffect`, `StoreSchema`, `defineStoreSchema`, `compareStrategy` |
| `rootSubpathImports` | 차단 (`--strict-template`) | `./refs`, `./time-travel`, `./transactions`, `./backend` 서브패스 소속인데 루트 `@context-action/react`에서 가져온 심볼 |
| `manualImmediateDispatches` | 차단 (`--strict-template`) | 계약 단위 `actions: { <action>: { queue: 'immediate' } }` 대신 호출부에서 넘긴 `{ immediate: true }` |
| `implicitStoreNotificationMode` | 참고용 인벤토리 | 명시적 `notificationMode` 없이 기본값(`'batched'`)에 의존하는 `createStore*` / `createTimeTravelStore*` 선언 |

### `stage` 기준선 실측 결과

| 스코프 | 스캔 파일 수 | 차단 합계 (`blockingTotal`) | 세부 내역 (`deprecatedApis` / `rootSubpathImports` / `manualImmediateDispatches`) | 참고 (`implicitStoreNotificationMode`) | 비고 |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `packages/template-react/src` | 21 | **0** | `0 / 0 / 0` | 5 | `--strict-template` 통과; `@context-action/react/refs` 및 계약 단위 `actions` 정책 적용 완료 |
| `example/src` | 540 | **47** | `11 / 25 / 11` | 213 | findings 69개 파일에 분포; Phase 2 마이그레이션 전까지 `4.x` 호환성 검증 커버리지로 의도적 유지 |

## 4. Phase 2 (`v5`) 진입 승인 체크리스트

별도 `v5` 릴리스 브랜치에서 버전 범프나 `4.x` 호환성 별칭 제거를 제안하기 전 아래 조건을 충족해야 합니다:

1. `pnpm audit:v5-readiness -- --strict-template` 및 `pnpm test:v5-readiness`가 지속 통과할 것 (`packages/template-react/src` 차단 항목 `0` 유지).
2. `example/src` 및 추적 중인 연계 소비자 앱의 `blockingTotal`(`deprecatedApis`, `rootSubpathImports`, `manualImmediateDispatches`) 정리가 완료될 것.
3. [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) (섹션 6)의 의사결정 게이트 및 [릴리스 거버넌스](../../../releases/RELEASE.md) 승인이 완료될 것.
