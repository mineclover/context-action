# 테스트 컨벤션 및 재사용 가능 테스트 시나리오 표준

**상태:** Active  
**스펙 / 결정 ID:** `CA-TESTING-CONVENTION-001`  
**소유자:** Framework Architecture & Verification Governance  
**관련 규격 및 가이드:**
- [경계별 Context-Action 테스트](/ko/guide/testing-boundaries)
- [`act`를 활용한 React UI 테스트](/ko/guide/react-testing-act)
- [안정성 테스트 사이클](/ko/context-layered/stability-test-cycle)
- [표준 구현 컨벤션](/ko/context-layered/implementation-convention)
- [Local-First 검증 정책](../../LOCAL_FIRST_VERIFICATION_POLICY.md)

이 문서는 **Core `2.0.x`**, **Interactions `0.1.x`**, **React `5.0.x`** 환경에서 패키지·Context-Layered 앱·소비자 프로젝트가 준수해야 할 표준 테스트 규격과 재사용 가능한 시나리오를 정의합니다. 화면마다 임의의 단언을 작성하는 대신, 모든 검증을 4개 **테스트 계층(`T1`–`T4`)**으로 분류하고 6대 **표준 테스트 시나리오(`S1`–`S6`)**로 증명합니다.

---

## 1. 4계층 테스트 표준 (`T1`–`T4`)

| 계층 | 대상 및 파일 위치 | 실행 환경 및 설정 | 증명하는 계약 |
| --- | --- | --- | --- |
| **`T1` · 순수 도메인 & 헤드리스 런타임** | `business/*.test.ts`, `runtime/*.test.ts` | Node (`vitest` / `jest`), React 미사용, `act` 불필요 | 결정론적 draft 생성, 검증 코드, 도메인 이벤트, FSM 상태 전이, 순수 TS `ActionRegister` + `createStore` / `createStateStore` 오케스트레이션 |
| **`T2` · 프리미티브 & 서브패스 계약** | `packages/*/__tests__/**/*.contract.test.ts(x)` | Node (Core/Store/Interactions) 또는 JSDOM + `IS_REACT_ACT_ENVIRONMENT = true` (React) | 4-역할 파이프라인(`Guard`/`Command`/`Result`/`Observer`), Dual-Lane(`lane: 'fast'` vs `'orchestrated'`), Store v5 `notificationMode: 'immediate'` 기본값, `@context-action/react/{refs,time-travel,transactions,backend,advanced}` 계약 |
| **`T3` · Context-Layered 사용자 시나리오** | 라우트·기능 옆 동배치 `*.test.tsx` / `*.integration.test.tsx` | JSDOM + `await act(async () => ...)` + `act` 누락 시 실패 + RTL / `userEvent` | Provider 조립 순서(`Action -> Store -> Ref -> HandlerRegistry -> View`), 사용자에게 보이는 UI 변화, Ref 포커스/스크롤, 제어형 동기화, 언마운트 정리 |
| **`T4` · 거버넌스·카탈로그·스모크 증명** | `pnpm convention:check`, `pnpm verify:surface-catalog`, `pnpm example:impact`, `pnpm verify` | 정적 AST + 빌드 + 브라우저 라우트 스모크 + RFC 8785 영수증 | 7대 Context-Layered AST 불변식, `CA-SURFACE-CATALOG-001` 정합성, `.disabled`·연구 잔여물 0건 위생, `pnpm verify:receipt` 암호 검증 |

### 테스트 작성 전 계층 선택 규칙

1. 순수 계산·검증 코드·프레임워크 비의존 FSM → **`T1`**
2. 라이브러리 프리미티브 보장이나 서브패스 계약 → **`T2`**
3. 사용자에게 보이는 라우트·기능 조합(`views/` + `handlers/` + `contexts/`) → **`S1`–`S6`**을 다루는 **`T3`**
4. 아키텍처 경계, 표면 카탈로그 정합성, 릴리스 안전성 → **`T4`**

---

## 2. 6대 표준 테스트 시나리오 (`S1`–`S6`)

모든 Context-Action 기능 또는 스타터 템플릿은 책임을 소유한 경계에서 아래 6가지 표준 시나리오를 검증합니다:

### `S1` · Guard 차단 및 명령형 포커스 이동 (잘못된 입력 흐름)

- **전제(Given)**: draft 또는 폼에 유효하지 않거나 누락된 입력이 있음
- **동작(When)**: 비즈니스 제출 액션을 디스패치함
- **결과(Then)**: `useActionGuard`가 `controller.abort(reason)`로 파이프라인을 중단하고 도메인 Store는 `submitting`/`success`로 전이하지 않으며, `LayoutActionIntent` 또는 `RefRegistry`/`RefContext`가 첫 번째 오류 필드로 DOM 포커스를 이동시키고, `useActionObserver(..., { when: 'failure' })`가 도메인 실패 이벤트를 기록함

### `S2` · 정상 경로 상태 머신 및 결과 수집 (유효 입력 흐름)

- **전제(Given)**: 유효한 입력이 준비됨
- **동작(When)**: `Guard` → `Command`/`Result` → `Observer` 순으로 실행됨
- **결과(Then)**: 명시적 FSM 상태가 결정론적으로 전이(`idle -> submitting -> success`)하고 구조화된 결과 또는 주문 ID가 관찰되며, UI는 구독을 통해 선언적으로 갱신됨

### `S3` · 성공 이후 Draft 재편집 무효화 (Dirty 복구)

- **전제(Given)**: 제출 완료(`success`) 상태와 완료 배너가 표시되어 있음
- **동작(When)**: 사용자가 입력 필드를 다시 수정함
- **결과(Then)**: FSM이 즉시 `idle`로 복귀하고 이전 완료 배너 및 stale 결과를 제거해 재제출 정합성을 보장함

### `S4` · 진행 중 리셋 / 언마운트 취소 (중단 및 누수 차단)

- **전제(Given)**: 비동기 타이머, 요청 또는 상태 전이가 `submitting` 상태로 진행 중임
- **동작(When)**: 완료 전에 `reset` 액션을 디스패치하거나 컴포넌트를 언마운트함
- **결과(Then)**: `await act(async () => ...)` 안에서 가짜 타이머를 진행해도 지연된 상태 덮어쓰기나 stale `success` 전이 없이 기준 상태로 복구되며, `not wrapped in act` 경고가 0건임

### `S5` · 선택적 구독 & 0-리렌더 격리 (`useStorePath` + Dual-Lane `fast`)

- **전제(Given)**: 다중 필드 Store 또는 고빈도 포인터 스크러빙 인터랙션
  1. `useStorePath(store, ['user', 'name'], { select })` 구독 컴포넌트는 관련 없는 슬라이스가 변경될 때 **추가 리렌더 0회**를 유지해야 함
  2. 고빈도 제스처(`usePointerGesture` + `useRefRegistry` + `lane: 'fast'`)는 드래그 중 preview DOM만 직접 갱신해 커밋 UI 리렌더 **0회**를 유지하다가, 포인터 해제 시 `lane: 'orchestrated'` 커밋을 수행함

### `S6` · 스코프 격리, 제어형 동기화, Shared DI & 원자적 롤백

- **스코프 격리 (`createScopedContext`)**: 형제 Provider 두 개가 로컬 Store·Ref·핸들러 상태를 간섭 없이 독립 유지함
- **제어형 동기화 (`useControlledStoreSync`)**: 외부 controlled prop 변경 시 `onSync(draft, nextValue)`가 동일 `store.update()` 커밋 내부에서 실행되어 피드백 루프 없이 파생 상태를 동기화함
- **Headless Shared DI (`ownership="shared"`)**: React 바깥에서 생성한 `ActionRegister`와 `TimeTravelStoreManager`는 React 뷰 언마운트·재마운트 이후에도 상태와 undo/redo 이력을 보존함
- **원자적 롤백 (`@context-action/react/transactions`)**: `StoreTransactionCoordinator` + `bindActionTransactions`는 트랜잭션 도중 Guard 중단이나 핸들러 예외가 발생하면 참여한 모든 Store를 일괄 롤백함

---

## 3. 컴파일 검증 테스트 하네스 패턴 (Core `2.0` / React `5.0`)

테스트 하네스와 예제는 반드시 공개 v5 서브패스만 import 해야 합니다 (`createRefContext`나 `StoreTransactionCoordinator`를 `@context-action/react` 루트에서 import 하는 v4 구형 패턴 금지):

<!-- @context-action-compile -->
```tsx
import {
  type ActionPayloadMap,
  createActionContext,
  createScopedContext,
  useStorePath,
} from '@context-action/react';
import {
  useControlledStoreSync,
  useRefRegistry,
  useStoreInstance,
} from '@context-action/react/advanced';

interface TabActions extends ActionPayloadMap {
  selectTab: { id: string };
}

interface TabState {
  selectedId: string;
  focusedId: string;
}

const TabActionCtx = createActionContext<TabActions>('ConventionTabActions', {
  actions: { selectTab: { lane: 'orchestrated', queue: 'serial' } },
});

export const TabScope = createScopedContext(
  'ConventionTabs',
  TabActionCtx,
  ({ selectedId }: { selectedId?: string }) => {
    const store = useStoreInstance<TabState>(() => ({
      selectedId: selectedId ?? 'overview',
      focusedId: selectedId ?? 'overview',
    }));

    // onSync는 이미 store.update() 내부에서 실행되므로 draft만 직접 수정합니다
    useControlledStoreSync(store, ['selectedId'], selectedId, {
      onSync(draft, nextId) {
        draft.focusedId = nextId;
      },
    });

    const refs = useRefRegistry<{ tablist: HTMLDivElement }>();

    TabActionCtx.useActionGuard('selectTab', ({ id }, controller) => {
      if (!id) controller.abort('tab id required');
    });

    TabActionCtx.useActionCommandHandler('selectTab', ({ id }) => {
      store.update((draft) => {
        draft.selectedId = id;
        draft.focusedId = id;
      });
    });

    return { store, refs };
  }
);

export function useIsOverviewSelected(): boolean {
  const { store } = TabScope.useScope();
  return useStorePath(store, ['selectedId'], {
    select: (id) => id === 'overview',
  });
}
```

### 표준 `S1`–`S6` 테스트 템플릿 (Jest / Vitest + RTL)

```tsx
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

describe('Feature Scenarios (S1-S6)', () => {
  afterEach(() => {
    cleanup();
    // S4에서 fake timer를 켰다면 반드시 real timer로 복원
  });

  it('S1: Guard가 잘못된 제출을 차단하고 Ref로 포커스를 이동하며 실패를 기록한다', async () => {
    render(<FeaturePage />);
    fireEvent.click(screen.getByTestId('submit-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('validation-error')).toBeInTheDocument();
      expect(document.activeElement).toBe(screen.getByTestId('primary-input'));
    });
  });

  it('S4: 진행 중 reset 시 async act() 내부 타이머 플러시 후 누수가 없어야 한다', async () => {
    await act(async () => {
      await Promise.resolve();
      // act() 내부에서 타이머를 결정론적으로 진행한 뒤 밖에서 단언
    });
    expect(screen.getByTestId('phase-badge')).toHaveTextContent('IDLE');
  });
});
```

---

## 4. 저장소 실행 증명 매트릭스

아래 파일들이 CI에서 `T1`–`T4` 및 `S1`–`S6` 규격의 실질적 충족을 상시 증명합니다:

| 계층 및 시나리오 | 증명 테스트 파일 | 검증 게이트 |
| --- | --- | --- |
| `T2` · `S1`–`S6` 계약 증명 | [`packages/react/__tests__/patterns/testing-convention-scenarios.contract.test.tsx`](../../../packages/react/__tests__/patterns/testing-convention-scenarios.contract.test.tsx) | `pnpm --filter @context-action/react test` |
| `T3` · `S1`–`S4` 스타터 통합 | [`packages/react/__tests__/patterns/template-react.integration.test.tsx`](../../../packages/react/__tests__/patterns/template-react.integration.test.tsx) | `pnpm --filter @context-action/react test` |
| `T3` · `S1`–`S4` 표준 Playbook | [`example/src/pages/patterns/implementation-playbook/CanonicalOrderExample.test.tsx`](../../../example/src/pages/patterns/implementation-playbook/CanonicalOrderExample.test.tsx) | `pnpm --filter example test` |
| `T3` · `S5` (`useStorePath { select }` & `useRefRegistry`) | [`example/src/pages/foundations/react/ProviderAndHooksErgonomics.test.tsx`](../../../example/src/pages/foundations/react/ProviderAndHooksErgonomics.test.tsx) | `pnpm --filter example test` |
| `T3` · `S5` + `S6` 헤드리스 인터랙션 & Dual-Lane | [`example/src/pages/integrations/headless-interactions/HeadlessInteractionsPage.test.tsx`](../../../example/src/pages/integrations/headless-interactions/HeadlessInteractionsPage.test.tsx) | `pnpm --filter example test` |
| `T3` · `S6` Shared-Ownership DI (`ownership="shared"`) | [`example/src/pages/foundations/react/headless-di/HeadlessDiPage.test.tsx`](../../../example/src/pages/foundations/react/headless-di/HeadlessDiPage.test.tsx) | `pnpm --filter example test` |
| `T3` · `S6` 원자적 트랜잭션 롤백 | [`example/src/pages/foundations/store/StoreBackendTransactionsPage.test.tsx`](../../../example/src/pages/foundations/store/StoreBackendTransactionsPage.test.tsx) | `pnpm --filter example test` |
| `T4` · 테스트 컨벤션·위생 자동 검증 | [`scripts/verify-testing-convention.mjs`](../../../scripts/verify-testing-convention.mjs) | `pnpm convention:check` |

---

## 5. 위생 및 안티패턴 가드레일

`pnpm convention:check`(`scripts/verify-testing-convention.mjs`)가 아래 위생 규칙을 자동 차단합니다:

1. **엄격한 `act` 환경 유지**: `packages/react/__tests__/setup.ts`와 `example/src/test/setup.ts`는 모두 `IS_REACT_ACT_ENVIRONMENT = true`를 선언하고 `/not wrapped in act/i` 진단을 실패 처리합니다. 전역 `console.error` 모의로 `act` 경고를 숨기지 마세요.
2. **비활성 테스트 및 연구 잔여물 금지**: `packages/` 아래에 `*.test.ts.disabled`, `*.test.tsx.disabled` 또는 임의 연구 리포트(`*_REPORT.md`, `TEST_MANAGEMENT_GUIDE.md` 등)를 남기지 않습니다. 릴리스 이력은 `releases/`와 `docs/releases/`에만 둡니다.
3. **공개 엔트리포인트 일관성**: 소비자 테스트와 문서 스니펫은 내부 `src/*` 경로가 아니라 `@context-action/react`, `/refs`, `/time-travel`, `/transactions`, `/backend`, `/advanced`, `/utils`, `@context-action/core`, `@context-action/interactions` 공개 경로만 사용합니다.
4. **과거 수치 인용 금지**: 검증 결과는 과거 테스트 개수가 아니라 현재 커밋의 실행 게이트(`pnpm verify`, `pnpm convention:check`, `pnpm verify:receipt`)로만 보고합니다.
