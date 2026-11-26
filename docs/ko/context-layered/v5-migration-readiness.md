# Phase 2 (`v5`) 마이그레이션 및 준비 가이드

이 문서는 [`CA-VNEXT-ARCHITECTURE-001`](./decisions/CA-VNEXT-ARCHITECTURE-001.md)의 **Phase 2 (`v5` 메이저 호환성 정리)** 를 대비해 애플리케이션 팀, 스타터 템플릿, 외부 소비자가 사전에 준비할 수 있는 절차를 정리합니다. 여기에 포함된 모든 준비 단계는 기존 루트 import나 `4.x` 호환성을 깨지 않고 현재 `4.x` 브랜치에서 점진적으로 적용할 수 있습니다.

- **상태:** **npm `latest` 배포 완료 (2026-11-26)** (`@context-action/core@2.0.0`, `@context-action/interactions@0.1.0`, `@context-action/store-core@0.1.5`, `@context-action/xstate@0.1.1`, `@context-action/react@5.0.0` 및 Core v2 호환 `@context-action/lit@0.1.5`, `@context-action/lit-ui@0.1.5`, `@context-action/preact@0.1.4`, `@context-action/preact-ui@0.2.2`; Phase 2 직전 `4.x` 롤백 체크포인트 `checkpoint/pre-phase2-v4` @ `240b2b32`). 외부 `4.x -> 5.0` 업그레이드 시 `pnpm audit:v5-readiness`로 점진적 전환을 점검할 수 있습니다.
- **선행 기준선:** [CA-VNEXT-ARCHITECTURE-001](./decisions/CA-VNEXT-ARCHITECTURE-001.md) (`main` / npm `latest`에 `M0–M4` 및 Phase 2 배포 완료) · [vNext 아키텍처 핸드오프 가이드](./vnext-architecture-handoff.md)

## 1. Phase 1 (`4.x` 무중단) vs. Phase 2 (`v5` 메이저) 경계

Phase 1은 기존 `4.x` 소비자를 깨뜨리지 않고 전환 프리미티브를 먼저 제공했고, Phase 2는 `@context-action/core@2.0.0` + `@context-action/react@5.0.0`으로 정식 배포되었습니다 (`@context-action/core`의 `registerEffect`는 `1.x` 호환을 위해 유지됨):

| 영역 | `4.x` 준비 단계 (무중단 Opt-In) | `core@2.0.0` / `react@5.0.0` 적용 사항 |
| :--- | :--- | :--- |
| React 진입점 | 루트 `.` re-export를 유지한 채 `@context-action/react/{refs,time-travel,transactions,backend}` 서브패스 제공 | 특화 API(`createRefContext`, `createTimeTravelStore*`, `StoreTransactionCoordinator`, `createBackendStore` 등)를 전용 서브패스로만 제공 |
| Dispatch 훅 대칭성 및 deprecation 제거 | `useActionResultDispatch()`와 `useActionScope()`를 주력 API로 승격, `useActionDispatchWithResult()`에 `@deprecated` 표기 | React의 `useActionDispatchWithResult`, `useActionEffectHandler`, `StoreSchema`, `compareStrategy`, 레거시 `TransactionBackend` 파사드 제거 (`@context-action/core` `registerEffect`는 `1.x` 호환 유지) |
| 헤드리스 UI 인터랙션 | `createPointerGestureSession`과 `createRovingFocusController`를 `@context-action/core/element`에 포함 | `createPointerGestureSession`, `createRovingFocusController`, `createDismissLayer`를 무의존성 `@context-action/interactions@0.1.0`으로 분리 (React 훅은 `@context-action/react/advanced` 제공) |
| 액션 큐 정책 | `ActionRegister` / `createActionContext`의 계약 단위 `actions: { [name]: { queue, timeout } }` 정책 및 `{ immediate: false }` 지연 큐 할당 | `createActionContext` 기본 `useConcurrencyQueue`를 Core와 동일한 `false`로 통일 (직렬 큐가 필요하면 `actions: { [name]: { queue: 'serial' } }` 또는 `{ registry: { useConcurrencyQueue: true } }` opt-in) |
| 스토어 알림 모드 | `Store`, `TimeTravelStore`, `createStoreContext`, `createTimeTravelStoreContext`에 명시적 `notificationMode?: 'batched' \| 'immediate'` 추가 | `Store` 기본 `notificationMode`를 `'immediate'`로 통일 (`createStateStore()`·React 18/19 자동 배칭과 정합, 명시적 RAF 코얼레싱이 필요할 때 `'batched'` opt-in) |

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
pnpm audit:v5-readiness -- --strict-all        # 전체 스캔 스코프 내 blocking 항목 시 실패
pnpm audit:v5-readiness -- --json              # 파일/라인/컬럼 단위 JSON 리포트 출력
pnpm audit:v5-readiness -- --root ../my-app    # 외부 소비자 앱 경로 스캔
pnpm test:v5-readiness                         # AST 픽스처 및 스타터 템플릿 준수 테스트 실행
```

### 감사 분류 기준

| 분류 (`category`) | 게이트 역할 | 탐지 대상 |
| :--- | :--- | :--- |
| `deprecatedApis` | 차단 (`--strict-template`, `--strict-all`) | `useActionDispatchWithResult`, `useActionEffectHandler`, `registerEffect`, `StoreSchema`, `defineStoreSchema`, `compareStrategy` |
| `rootSubpathImports` | 차단 (`--strict-template`, `--strict-all`) | `./refs`, `./time-travel`, `./transactions`, `./backend` 서브패스 소속인데 루트 `@context-action/react`에서 가져온 심볼 |
| `manualImmediateDispatches` | 차단 (`--strict-template`, `--strict-all`) | 계약 단위 `actions: { <action>: { queue: 'immediate' } }` 대신 호출부에서 넘긴 `{ immediate: true }` |
| `implicitStoreNotificationMode` | 참고용 인벤토리 | 명시적 `notificationMode` 없이 기본값에 의존하는 `createStore*` / `createTimeTravelStore*` 선언 |

### `stage` 기준선 실측 결과 (Phase 2 직전 체크포인트)

| 스코프 | 스캔 파일 수 | 차단 합계 (`blockingTotal`) | 세부 내역 (`deprecatedApis` / `rootSubpathImports` / `manualImmediateDispatches`) | 참고 (`implicitStoreNotificationMode`) | 비고 |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `packages/template-react/src` | 21 | **0** | `0 / 0 / 0` | 5 | `--strict-template` · `--strict-all` 통과; `@context-action/react/refs` 및 계약 단위 `actions` 정책 적용 완료 |
| `example/src` | 540 | **0** | `0 / 0 / 0` | 213 | `--strict-all` 통과 완료; 모든 서브패스 import · `useActionScope` · 계약 단위 액션 큐 정책 전환 완료 |

## 4. Phase 2 (`v5`) 완료 현황 및 릴리스 체크리스트

Phase 2의 React breaking 정리와 기본값 통일은 `stage`에 구현되었습니다 (롤백 체크포인트 `checkpoint/pre-phase2-v4` @ `240b2b32` 보존). 정식 `v5` 릴리스 PR에서 패키지 버전 범프나 태그를 진행하기 전 아래 항목을 확인합니다:

1. `pnpm audit:v5-readiness -- --strict-template`, `pnpm audit:v5-readiness -- --strict-all` 및 `pnpm test:v5-readiness`가 지속 통과할 것 (`packages/template-react/src` 및 `example/src` 차단 항목 `0` 유지).
2. `4.x`에서 업그레이드하는 외부 소비자 앱의 `pnpm audit:v5-readiness -- --root <app>` 차단 항목(`deprecatedApis`, `rootSubpathImports`, `manualImmediateDispatches`) 정리가 완료될 것.
3. 전체 검증 게이트(`pnpm release:check`, `pnpm verify && pnpm verify:receipt`) 및 [릴리스 거버넌스](../../../releases/RELEASE.md) 승인이 완료될 것.
