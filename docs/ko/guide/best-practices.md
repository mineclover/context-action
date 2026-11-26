# 모범 사례 (Best Practices)

유지보수 가능한 **Context-Action** 애플리케이션을 설계하기 위한 팀 컨벤션, 런타임 안전 가드레일, 단계별 적정 구현(Right-Sized Adoption) 예제 모음입니다.

> 전체 6-Layer 거버넌스 규격이나 스토어 프리미티브 선택 기준은 [아키텍처 컨벤션](../concept/conventions.md), [컨벤션 인덱스](../context-layered/convention-index.md), [스토어 선택 및 사용 가이드](../context-layered/store-selection-and-usage-guide.md)를 함께 참고하세요.

---

## ⚡ 빠른 팀 요약

팀에서 “Context-Action을 권장 방식대로 어떻게 개발해야 하는가”를 빠르게 맞출 때 아래 6가지 규칙부터 공유하면 됩니다:

1. **UI보다 경계를 먼저 정의합니다**: 뷰 컴포넌트를 작성하기 전에 타입이 선언된 `actions/` + `contexts/` 계약과 순수 도메인 헬퍼(`business/`)를 먼저 세웁니다.
2. **핸들러에서는 지연 조회(`store.getValue()`), 뷰에서만 구독합니다**: `handlers/` 내부에서는 항상 `store.getValue()`를 호출하고, `useStoreValue`, `useStoreSelector`, `useStorePath`는 절대 사용하지 않습니다.
3. **`actions/`는 dispatch 전용으로 유지하고 반환값은 명시적으로 받습니다**: `actions/` 훅은 `dispatch` / `dispatchWithResult` 호출만 감쌉니다. 핸들러 반환값이나 중단 사유(`abortReason`)가 필요하면 반드시 `dispatchWithResult()`를 사용하세요 (`dispatch()`는 `Promise<void>`를 반환합니다).
4. **취소·리셋·실시간 텔레메트리 액션은 `{ immediate: true }`로 직렬 큐를 우회합니다**: `createActionContext`는 기본으로 `useConcurrencyQueue: true`를 사용하므로, 비동기 핸들러 실행 중 호출되는 취소/리셋/스텝 기록 액션에는 `{ immediate: true }`를 넘겨 교착을 방지합니다.
5. **Store 업데이트는 항상 불변(Immutable)으로 수행합니다**: `store.update(...)` 콜백 내부에서 기존 `Map`, `Set`, 배열을 직접 변경하지 말고 얕은 복제(`new Map(prev.map)`, `[...prev.items]`) 후 새 루트 객체를 반환합니다.
6. **단순한 화면에 과도한 6계층을 강제하지 않습니다**: 기능 복잡도에 맞춰 **Level 1(Lite)**, **Level 2(Headless-First Symmetric DI)**, **Level 3(Full 6-Layer)** 중 적정 수준을 선택합니다.

---

## 적정 구현(Right-Sized Adoption) 의사결정 매트릭스

소유권이 명확하고 테스트가 빠르면서도 불필요한 보일러플레이트가 없는 가장 가벼운 구조를 선택하세요:

| 단계 | 적합한 상황 | 구성 모듈 / 프리미티브 | 검증 초점 | 과잉 설계를 피해야 할 때 |
|---|---|---|---|---|
| **로컬 React 상태** | 단일 컴포넌트 hover, 아코디언 토글, 임시 입력 UI 플래그 | React `useState` / `useReducer` | 컴포넌트 단위 테스트 | 단순 드롭다운이나 탭 토글 하나 때문에 Action/Store를 만들지 마세요 |
| **Level 1 · Lite** | 단일 도메인 위젯, 쿠폰/계산기, 간단한 폼 검증 및 파생 상태 | `createActionContext` 1개, `createStoreContext` 1개, `Registry` 컴포넌트 + `View` | React Testing Library 동작 테스트 | 도메인 로직이나 다중 패널 조율이 커지기 전까지 6개 폴더로 쪼개지 마세요 |
| **Level 2 · Headless-First Symmetric DI** | React 마운트와 무관하게 실행돼야 하는 공유 엔진, SSR/Worker, 언마운트 후에도 유지되는 작업 공간 상태 | 순수 TS `ActionRegister` + `createStore`, `registerGuard/Result/Observer`, React `Provider ownership="shared"` | 순수 Node/Vitest/Jest 엔진 테스트 + 얇은 React 마운트/언마운트 DI 테스트 | 단일 응집 엔진 API로 충분하면 6계층 라우트 폴더를 강제하지 마세요 |
| **Level 3 · Full 6-Layer** | 다중 관심사가 얽힌 제품 피처, 비동기 워크플로우, 비즈니스/레이아웃 인텐트 분리, 팀 공동 소유 라우트 | `contexts / business / handlers / actions / hooks / views` + `BusinessActionIntent` vs `LayoutActionIntent` | `pnpm convention:check`, 순수 `business/` 단위 테스트, 통합 플로우 테스트 | 작은 팝오버나 단일 위젯에는 과합니다 |

---

## CI 강제 규칙 vs 권장 설계 가이드

Context-Action은 스크립트가 자동으로 차단하는 규칙(`pnpm convention:check`, `pnpm verify:surface-catalog`, `pnpm package-boundary:check`)과 코드 리뷰로 관리하는 설계 원칙을 명확히 구분합니다.

### CI에서 자동 강제되는 규칙 (`pnpm convention:check` 및 경계 게이트)

1. **핸들러 내 스토어 구독 금지 (`no-store-subscription-in-handlers`)**: `handlers/**` 내부에서 직접 호출되거나 별칭으로 import된 `useStoreValue`, `useStoreSelector`, `useStorePath`를 정적 분석으로 차단합니다. 콜백 내부에서 `store.getValue()`를 호출하세요.
2. **핸들러에서 `actions/` import 금지 (`no-actions-import-in-handlers`)**: 핸들러가 React 액션 디스패치 래퍼에 결합되지 않도록 차단합니다. UI 콜백 주입이나 순수 `business/` 헬퍼를 사용하세요.
3. **인텐트 페이로드 분리 (`no-mixed-intent-payloads`)**: `BusinessActionIntent`(검증, API 제출, 상태 전이)와 `LayoutActionIntent`(포커스 이동, 스크롤, 뷰포트 레이아웃)를 한 액션 맵에 섞지 않습니다.
4. **dispatch 전용 `actions/` 훅 (`actions-dispatch-only`)**: `actions/` 모듈은 `useCallback`으로 감싼 `dispatch` / `dispatchWithResult` 래퍼만 노출하며, 도메인 분기나 스토어 구독을 포함하지 않습니다.
5. **Store 내 원시 DOM 객체·이벤트 저장 금지**: 반응형 Store에는 직렬화 가능한 도메인 상태만 담고, DOM 엘리먼트(`HTMLInputElement`, 스크롤 컨테이너 등)는 `RefContext`로 분리합니다.
6. **단일 상태 소유자(Single-Source Owner)**: 동일한 가변 도메인 필드를 여러 Store나 React `useState`에 중복 미러링하지 않습니다.
7. **정규 패키지 경계 준수**: 워크스페이스 소비자는 `pnpm package-boundary:check`가 검증하는 공개 엔트리포인트와 서브패스만 import합니다.

### 리뷰 기반 권장(Advisory) 원칙

- **엄격한 6-Layer 디렉터리 분리 (`Level 3`)**: 규모가 큰 멀티 개발자 피처에 권장되며, Level 1/2 소규모 위젯에는 강제하지 않습니다.
- **Observer `{ when: 'always' }`**: 검증 실패, 중단(`cancelled`) 이력, 감사 로그를 빠짐없이 남겨야 할 때 권장됩니다.
- **큐 선점(`{ immediate: true }`)**: 실행 중인 비동기 핸들러를 취소하거나 실시간 진행 스텝을 발행하는 액션 여부에 따라 설계자가 결정합니다.

---

## 실전 Do / Don't 체크리스트

### 1. 핸들러에서는 항상 `store.getValue()`로 지연 조회하세요

핸들러 레지스트리에서 Store를 구독하면 상태가 바뀔 때마다 핸들러가 재등록되고 오래된 클로저(Stale Closure) 버그가 발생합니다.

```tsx
// ❌ Don't: draft 변경마다 핸들러 레지스트리가 재구독·재등록됨
const draft = useStoreValue(draftStore);
useActionCommandHandler('submitOrder', useCallback(async () => {
  await submit(draft);
}, [draft]));

// ✅ Do: 핸들러 실행 시점에 최신 스냅샷을 지연 조회
useActionCommandHandler('submitOrder', useCallback(async () => {
  const latestDraft = draftStore.getValue();
  await submit(latestDraft);
}, [draftStore]));
```

### 2. `dispatch()`와 `dispatchWithResult()`를 목적에 맞게 구분하세요

`dispatch()`는 `Promise<void>`를 반환합니다. 핸들러가 `controller.return(value)`로 반환한 결과나 `controller.abort(reason)` 정보를 호출자가 받아야 한다면 반드시 `dispatchWithResult()`를 사용해야 합니다.

- **`dispatch(action, payload)`**: 결과가 Store 업데이트로만 흘러가는 fire-and-forget UI 명령에 사용합니다.
- **`dispatchWithResult(action, payload)`**: 캐시 히트 여부, 다단계 폴백 결과, 중단 사유(`execution.outcome`, `execution.result`, `execution.abortReason`)를 호출자가 직접 다룰 때 사용합니다.

### 3. 직렬 큐 교착을 막기 위해 `{ immediate: true }`를 활용하세요

`createActionContext`는 기본적으로 `useConcurrencyQueue: true`가 활성화되어 동일 컨텍스트의 액션을 순서대로 실행합니다. 아래 두 경우는 반드시 `{ immediate: true }`를 지정하세요:

1. **취소·리셋·재시도 액션**: 느린 비동기 `submitOrder` 실행 도중 사용자가 누르는 초기화/취소 버튼 (`{ immediate: true }`가 없으면 앞선 제출이 끝날 때까지 영원히 대기합니다).
2. **실행 중 핸들러 내부에서 발행하는 실시간 텔레메트리/스텝 기록 액션**: 부모 액션이 끝나기 전에 UI 진행 표시와 로그를 즉시 반영해야 할 때 필요합니다.

```tsx
const resetDraft = useCallback(
  () => businessDispatch('resetDraft', undefined, { immediate: true }),
  [businessDispatch]
);
```

### 4. `store.update(...)`에서 `Map` · `Set` · 배열을 불변으로 복제하세요

`Store`는 `Object.is` 참조 비교로 구독자 알림을 결정합니다. 기존 `Map`이나 배열을 제자리(in-place)에서 수정한 뒤 같은 참조를 반환하면 UI가 갱신되지 않습니다.

```ts
// ❌ Don't: 기존 Map 인스턴스를 직접 변형하여 참조가 동일함
cacheStore.update((prev) => {
  prev.entries.set(key, entry);
  return prev;
});

// ✅ Do: Map을 복제한 뒤 새로운 루트 상태 객체 반환
cacheStore.update((prev) => {
  const nextEntries = new Map(prev.entries);
  nextEntries.set(key, entry);
  return { ...prev, entries: nextEntries };
});
```

### 5. 취소 가능한 비동기 Promise 정착과 완료 후 편집 복귀 처리

- 대기 중인 비동기 작업(`pendingResolveRef`)은 취소·리셋·언마운트 정리 시점에 즉시 `resolve(false)` 등으로 정착시켜 dangling promise와 지연된 상태 덮어쓰기를 차단합니다.
- 순수 상태 머신에 사용자 재편집 전이(예: `{ type: 'draft_edited' }`)를 명시해 `'success'` 또는 `'failed'` 상태에서 입력을 고치면 자동으로 `'idle'` 상태로 복귀하도록 설계하세요.

### 6. 비즈니스 인텐트와 레이아웃 인텐트를 분리하고 DOM은 `RefContext`로 제어하세요

검증·제출(`businessDispatch('submitOrder')`)과 유효성 오류 필드 포커스·스크롤(`layoutDispatch('focusField', { field })`)을 혼합하지 마세요. 고빈도 DOM 좌표 제어는 Store가 아니라 `createRefContext`로 처리합니다. 또한 `Store`의 기본 `batched` 모드는 `requestAnimationFrame`(약 16ms) 단위로 React 알림을 묶어 보내므로, fake timer 기반 테스트에서는 `16ms` 틱 진행 또는 `waitFor`로 렌더링 반영을 기다려야 합니다.

---

## 검증된 단계별 적정 구현(Right-Sized) 예제

아래 TypeScript 코드는 `pnpm verify:doc-snippets` 게이트에서 실제 패키지 선언과 함께 컴파일 검증됩니다 (`<!-- @context-action-compile -->`).

### Level 1 · Lite (단일 도메인 쿠폰 위젯)

단일 React 서브트리 안에서 동작하는 계산기, 쿠폰 바, 필터 패널에 적합합니다. 복잡도가 커지기 전까지 `business/`나 `actions/` 폴더를 미리 만들지 않고 1파일 또는 2파일로 간결하게 유지합니다.

<!-- @context-action-compile -->
```tsx
import { useCallback } from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface CouponQuote {
  readonly appliedCode: string | null;
  readonly totalAmount: number;
  readonly errorCode: 'empty_code' | 'unknown_coupon' | null;
}

const VALID_COUPONS: Record<string, number> = { SAVE10: 10, TEAM25: 25 };

function evaluateCoupon(rawCode: string, subtotal: number): CouponQuote {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { appliedCode: null, totalAmount: subtotal, errorCode: 'empty_code' };
  const pct = VALID_COUPONS[code];
  if (pct === undefined) {
    return { appliedCode: null, totalAmount: subtotal, errorCode: 'unknown_coupon' };
  }
  return {
    appliedCode: code,
    totalAmount: Math.round(subtotal * (1 - pct / 100)),
    errorCode: null,
  };
}

interface LiteCouponActions extends ActionPayloadMap {
  applyCoupon: { code: string };
  clearCoupon: void;
}

const {
  Provider: LiteCouponActionProvider,
  useActionDispatch: useLiteCouponDispatch,
  useActionCommandHandler: useLiteCouponCommand,
} = createActionContext<LiteCouponActions>('LiteCouponActions');

const {
  Provider: LiteCouponStoreProvider,
  useStore: useLiteCouponStore,
} = createStoreContext('LiteCouponStores', {
  subtotal: 100,
  quote: { appliedCode: null, totalAmount: 100, errorCode: null } as CouponQuote,
});

function LiteCouponRegistry() {
  const subtotalStore = useLiteCouponStore('subtotal');
  const quoteStore = useLiteCouponStore('quote');

  useLiteCouponCommand(
    'applyCoupon',
    useCallback(
      ({ code }) => {
        quoteStore.setValue(evaluateCoupon(code, subtotalStore.getValue()));
      },
      [quoteStore, subtotalStore]
    )
  );

  useLiteCouponCommand(
    'clearCoupon',
    useCallback(() => {
      quoteStore.setValue({
        appliedCode: null,
        totalAmount: subtotalStore.getValue(),
        errorCode: null,
      });
    }, [quoteStore, subtotalStore])
  );

  return null;
}

export function LiteCouponWidget() {
  const quote = useStoreValue(useLiteCouponStore('quote'));
  const dispatch = useLiteCouponDispatch();

  return (
    <div>
      <span>{quote.totalAmount}</span>
      <button type="button" onClick={() => void dispatch('applyCoupon', { code: 'SAVE10' })}>
        Apply SAVE10
      </button>
      <button type="button" onClick={() => void dispatch('clearCoupon')}>
        Clear
      </button>
    </div>
  );
}

export function LiteCouponFeature() {
  return (
    <LiteCouponActionProvider>
      <LiteCouponStoreProvider>
        <LiteCouponRegistry />
        <LiteCouponWidget />
      </LiteCouponStoreProvider>
    </LiteCouponActionProvider>
  );
}
```

### Level 2 · Headless-First Symmetric DI (`ActionRegister` + `createStore` + Shared Provider)

도메인 파이프라인이 **React 마운트 없이도**(순수 단위 테스트, SSR 프리페치, 워커, 탭 언마운트/재마운트 간 상태 유지) 동일하게 동작해야 할 때 적합합니다. `ownership="shared"`로 헤드리스 인스턴스를 React 트리에 주입합니다.

<!-- @context-action-compile -->
```tsx
import { useCallback } from 'react';
import { ActionRegister, type ActionPayloadMap } from '@context-action/core';
import {
  createActionContext,
  createStore,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';

interface QuoteResult {
  readonly appliedCode: string | null;
  readonly totalAmount: number;
  readonly errorCode: 'unknown_coupon' | null;
}

interface HeadlessCouponActions extends ActionPayloadMap {
  applyCoupon: { code: string; subtotal: number };
}

interface HeadlessCouponResultMap {
  applyCoupon: QuoteResult;
}

export function createCouponEngine() {
  const register = new ActionRegister<HeadlessCouponActions, HeadlessCouponResultMap>({
    name: 'CouponEngine',
  });
  const quoteStore = createStore<QuoteResult>('couponQuote', {
    appliedCode: null,
    totalAmount: 200,
    errorCode: null,
  });
  const auditStore = createStore<string[]>('couponAudit', []);

  register.registerGuard(
    'applyCoupon',
    ({ code, subtotal }, controller) => {
      if (code.trim().toUpperCase() !== 'TEAM25') {
        quoteStore.setValue({ appliedCode: null, totalAmount: subtotal, errorCode: 'unknown_coupon' });
        controller.abort('unknown_coupon');
      }
    },
    { id: 'coupon-guard', priority: 100 }
  );

  register.registerResult(
    'applyCoupon',
    ({ code, subtotal }) => {
      const next: QuoteResult = {
        appliedCode: code.trim().toUpperCase(),
        totalAmount: Math.round(subtotal * 0.75),
        errorCode: null,
      };
      quoteStore.setValue(next);
      return next;
    },
    { id: 'coupon-result', priority: 10 }
  );

  register.registerObserver(
    'applyCoupon',
    (event) => {
      auditStore.update((prev) => [...prev, `${event.outcome}:${event.payload.code.toUpperCase()}`]);
    },
    { id: 'coupon-audit', priority: 1, when: 'always' }
  );

  const CouponActions = createActionContext<HeadlessCouponActions, HeadlessCouponResultMap>(
    'CouponActions'
  );
  const CouponStores = createStoreContext('CouponStores', {
    couponQuote: { appliedCode: null, totalAmount: 200, errorCode: null } as QuoteResult,
  });

  return { register, quoteStore, auditStore, CouponActions, CouponStores };
}

export async function runHeadlessCouponCheck() {
  const engine = createCouponEngine();
  const execution = await engine.register.dispatchWithResult('applyCoupon', {
    code: 'team25',
    subtotal: 200,
  });
  return { execution, quote: engine.quoteStore.getValue(), audit: engine.auditStore.getValue() };
}

export function MountedCouponPanel({ engine }: { engine: ReturnType<typeof createCouponEngine> }) {
  function TelemetryObserver() {
    engine.CouponActions.useActionObserver(
      'applyCoupon',
      useCallback((event) => {
        void event.outcome;
      }, []),
      { id: 'react-ui-observer', when: 'always' }
    );
    return null;
  }

  function View() {
    const dispatch = engine.CouponActions.useActionDispatch();
    const quote = useStoreValue(engine.CouponStores.useStore('couponQuote'));
    return (
      <button
        type="button"
        onClick={() => void dispatch('applyCoupon', { code: 'TEAM25', subtotal: 200 })}
      >
        Total: {quote.totalAmount}
      </button>
    );
  }

  return (
    <engine.CouponActions.Provider register={engine.register} ownership="shared">
      <engine.CouponStores.Provider stores={{ couponQuote: engine.quoteStore }} ownership="shared">
        <TelemetryObserver />
        <View />
      </engine.CouponStores.Provider>
    </engine.CouponActions.Provider>
  );
}
```

### Level 3 · Full 6-Layer 피처 아키텍처

다단계 비동기 제출, 초안 검증, 포커스·스크롤 레이아웃 인텐트, 테마 토큰, 감사 로그가 여러 뷰에 걸쳐 결합된 대규모 기능에 사용합니다:

- `contexts / business / handlers / actions / hooks / views` 구조로 분리하며, 취소/리셋 액션에는 `{ immediate: true }`, 핸들러에는 4-역할 훅(`useActionGuard`, `useActionCommandHandler`, `useActionResultHandler`, `useActionObserver`)을 배치합니다.
- 실제 안정화 레퍼런스는 `packages/template-react/src/features/order-workspace/` 및 아래 문서를 참고하세요:
  - [표준 주문 폼 예제 (Canonical Order Form)](../examples/canonical-order-form.md)
  - [Spec-to-Code 작성 가이드](../context-layered/spec-to-code-authoring-guide.md)
  - [Context-Layered 아키텍처 가이드](../context-layered/context-layered-guide.md)

---

## 관련 문서

- [코드 패턴 빠른 참조](./code-patterns.md)
- [액션 파이프라인 가이드](../concept/action-pipeline-guide.md)
- [훅 레퍼런스](../concept/hooks-reference.md)
- [Handler Registry 아키텍처](../context-layered/architecture/handler-registry.md)
- [안정성 및 테스트 사이클](../context-layered/stability-test-cycle.md)
- [문제 해결 (Troubleshooting)](./troubleshooting.md)
