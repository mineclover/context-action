# @context-action/preact

`@context-action/preact`는 Context-Action의 핵심 액션 파이프라인(`ActionDispatcher`)과 외부의 읽기 전용 상태 소스(`ReadableSource`)를 Preact 뷰와 `@preact/signals`에 연결하는 **헤드리스(Headless) 어댑터**입니다.

이 패키지는 DOM 루트를 생성하거나 소유하지 않으며, 컴포넌트 수명주기를 직접 제어하지 않습니다. 정확히 4개의 공개 함수(`createDispatchContext`, `connectSourceSignal`, `createSourceContext`, `useProjection`)와 3개의 핵심 인터페이스(`ReadableSource<T>`, `SignalConnection<T>`, `SourceContext<T>`)로 구성된 극도로 정제된 API 표면을 제공합니다. Preact Signals의 미세 단위 반응성을 활용하여 가상 DOM 전체 리렌더링 없이 DOM 텍스트 노드를 $O(1)$로 직접 갱신합니다.

---

## 1. 설치 및 피어 의존성 매트릭스 (Installation & Peer Dependency Matrix)

### 패키지 관리자별 설치 명령어

```bash
# pnpm
pnpm add @context-action/preact preact @preact/signals

# npm
npm install @context-action/preact preact @preact/signals

# yarn
yarn add @context-action/preact preact @preact/signals
```

### 피어 의존성 매트릭스 (Peer Dependency Matrix)

| 패키지 (Package) | 요구 버전 (Version Range) | 필수 여부 (Required) | 역할 및 설명 (Role & Responsibility) |
|---|---|---|---|
| `preact` | `^10.27.3` | **필수 (Mandatory)** | Preact VDOM 런타임 및 JSX 렌더링 엔진 |
| `@preact/signals` | `^2.11.3` | **필수 (Mandatory)** | 미세 단위 반응형 시그널 프리미티브 (`signal`, `computed`, `ReadonlySignal`) |
| `react` | 해당 없음 | **불필요 (Not Required)** | 순수 Headless 어댑터이므로 React 의존성이 필요하지 않습니다. (선택적 브릿지가 필요한 경우 `@context-action/preact-ui/react-bridge` 사용) |
| `preact-render-to-string` | 해당 없음 | **불필요 (Not Required)** | DOM 렌더러가 아니므로 SSR 렌더러 의존성이 필요하지 않습니다. (서버 마운트 렌더링이 필요한 경우 `@context-action/preact-ui/ssr` 사용) |

### 모듈 번들 해소 (Module Resolution)

`@context-action/preact`는 단일 루트 엔트리(`.`)만을 제공하며, 하위 서브패스 엔트리(subpath exports)를 두지 않습니다. Rolldown 기반의 `tsdown`으로 빌드되어 ESM과 CommonJS 듀얼 모듈 및 TypeScript 타입 선언을 완전하게 지원합니다.

- **ESM**: `dist/index.js` (`types`: `dist/index.d.ts`)
- **CJS**: `dist/index.cjs` (`types`: `dist/index.d.cts`)

---

## 2. 아키텍처 경계 및 계약 책임 모델 (Architectural Boundaries & Contract Responsibilities)

Context-Action 프레임워크는 상태와 액션의 수명주기를 엄격한 관심사 분리(Separation of Concerns) 원칙에 따라 격리합니다.

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. Host Domain Layer                                                   │
│    - ActionRegister<A> 생성, 핸들러 등록, destroy() 수명주기 전담      │
│    - ReadableSource<T> (스냅샷 보관, 동기 통지 구독 관리)               │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ 주입 (Injection)                │ 연결 (Connection)
                   ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 2. Preact Adapter Layer (@context-action/preact)                       │
│    - createDispatchContext : ActionDispatcher를 Preact Context에 전달   │
│    - connectSourceSignal   : ReadableSource → ReadonlySignal 투영       │
│    - createSourceContext   : ReadonlySignal을 컴포넌트 트리에 공급      │
│    - useProjection         : 미세 단위 파생 읽기 전용 시그널 생성       │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ useDispatch                     │ useProjection
                   ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 3. Presentation View Layer                                             │
│    - use<Domain>Actions    : UI 의도를 의미적 액션으로 발행            │
│    - JSX Signal Binding    : <output>{signal}</output> 직접 DOM 바인딩 │
└────────────────────────────────────────────────────────────────────────┘
```

### 계층별 책임 비교표 (Host vs Adapter vs View)

| 항목 | 호스트 도메인 계층 (Host Domain) | Preact 어댑터 (@context-action/preact) | 표현 뷰 계층 (Presentation View) |
|---|---|---|---|
| **ActionRegister 수명주기** | 인스턴스화, 핸들러 등록, `destroy()` 소유 | 생성/소유하지 않음 (대여된 Dispatcher만 전달) | 디스패처 호출만 수행 |
| **상태 소스 수명주기** | 원본 상태 소유, `getSnapshot()`, `subscribe()` 제공 | 상태를 보관하지 않고 `ReadonlySignal`로 연결 | 시그널 값 읽기 및 뷰 투영 |
| **DOM 루트 소유권** | 소유하지 않음 | DOM 요소를 전혀 소유하지 않음 | 표준 Preact JSX 렌더링 |
| **역방향 쓰기** | 비즈니스 핸들러를 통한 상태 전이만 허용 | 시그널을 통한 원본 역방향 쓰기 원천 차단 | 액션 디스패치로만 의도 전달 |
| **정리(Teardown) 책임** | 도메인 모델 파괴 및 리스너 해제 (`model.destroy()`) | `connection.dispose()` (멱등적 구독 해제) | 언마운트 시 자동 훅 정리 |

### `@context-action/preact-ui`와의 명확한 경계

- **`@context-action/preact`**: DOM 루트를 소유하지 않는 **순수 헤드리스 어댑터**입니다. 호스트가 준비한 디스패처와 시그널을 Preact 컴포넌트에 공급하는 역할만 수행합니다.
- **`@context-action/preact-ui`**: 특정 DOM subtree를 위임받아 소유하는 **UI 런타임 어댑터**입니다. 빈 DOM 엘리먼트에 마운트(`mountPreact`), 서버 마크업 수화(`hydratePreact`), 템플릿 복제(`mountTemplate`), 자원 정리 스코프(`createDisposalScope`), Web Component 커스텀 엘리먼트 정의(`definePreactElement`), React 19 호스트 브릿지(`@context-action/preact-ui/react-bridge`), SSR 마크업 렌더링(`@context-action/preact-ui/ssr`)을 담당합니다.

---

## 3. 빠른 시작: Context-Layered 아키텍처 (Quick Start)

아래 예제는 Context-Layered 아키텍처(Context-Layered Architecture)의 권장 패턴에 맞추어 도메인 계약, 컨텍스트 주입, 프로젝션 및 의미적 액션 훅, 프레젠테이션 뷰, 호스트 세션 수명주기를 완벽하게 분리한 실행 가능한 전체 코드입니다.

```tsx
import { ActionRegister, type ActionDispatcher, type ActionPayloadMap } from '@context-action/core';
import {
  connectSourceSignal,
  createDispatchContext,
  createSourceContext,
  useProjection,
  type ReadableSource,
} from '@context-action/preact';
import type { ComponentChildren } from 'preact';
import type { ReadonlySignal } from '@preact/signals';
import { useCallback } from 'preact/hooks';

// ============================================================================
// 1. 액션 및 상태 계약 정의 (Domain Types)
// ============================================================================
export interface CounterActions extends ActionPayloadMap {
  increment: void;
  decrement: void;
  setStep: { step: number };
}

export interface CounterState {
  readonly count: number;
  readonly step: number;
}

// ============================================================================
// 2. 컨텍스트 및 Provider 정의 (Context Layer)
// ============================================================================
export const CounterDispatchContext = createDispatchContext<CounterActions>('CounterDispatch');
export const CounterSourceContext = createSourceContext<CounterState>('CounterSource');

export function CounterProvider(props: {
  dispatch: ActionDispatcher<CounterActions>;
  sourceSignal: ReadonlySignal<CounterState>;
  children?: ComponentChildren;
}) {
  return (
    <CounterDispatchContext.Provider dispatch={props.dispatch}>
      <CounterSourceContext.Provider sourceSignal={props.sourceSignal}>
        {props.children}
      </CounterSourceContext.Provider>
    </CounterDispatchContext.Provider>
  );
}

// ============================================================================
// 3. 프로젝션 및 의미적 액션 훅 분리 (Projection & Action Hooks Layer)
// ============================================================================
export function useCounterProjection() {
  const sourceSignal = CounterSourceContext.useSourceSignal();
  // 미세 단위 ReadonlySignal로 투영하여 원치 않는 리렌더링 방지
  const countSignal = useProjection(sourceSignal, (state) => state.count);
  const stepSignal = useProjection(sourceSignal, (state) => state.step);
  return { countSignal, stepSignal };
}

export function useCounterActions() {
  const dispatch = CounterDispatchContext.useDispatch();
  // 컴포넌트가 원시 액션 이름 대신 의미적 함수를 호출하도록 캡슐화
  const increment = useCallback(() => {
    void dispatch('increment');
  }, [dispatch]);
  const decrement = useCallback(() => {
    void dispatch('decrement');
  }, [dispatch]);
  const setStep = useCallback((step: number) => {
    void dispatch('setStep', { step });
  }, [dispatch]);
  return { increment, decrement, setStep };
}

// ============================================================================
// 4. 표현 뷰 컴포넌트 (Presentation View Layer - 시그널 직접 DOM 바인딩)
// ============================================================================
export function CounterView() {
  const { countSignal, stepSignal } = useCounterProjection();
  const { increment, decrement } = useCounterActions();

  return (
    <div class="counter-panel">
      {/* Preact Signals는 텍스트 노드에 직접 바인딩되어 컴포넌트 VDOM 리렌더링 없이 O(1) 갱신 */}
      <p>현재 카운트: <output>{countSignal}</output></p>
      <p>스텝 크기: <output>{stepSignal}</output></p>
      <div class="button-group">
        <button type="button" onClick={increment}>+ 증가</button>
        <button type="button" onClick={decrement}>- 감소</button>
      </div>
    </div>
  );
}

// ============================================================================
// 5. 호스트 모델 및 세션 수명주기 부트스트랩 (Host Domain Layer)
// ============================================================================
export function createCounterModel() {
  let state: CounterState = { count: 0, step: 1 };
  const listeners = new Set<() => void>();
  const actions = new ActionRegister<CounterActions>({ name: 'CounterModel' });

  const commit = (next: CounterState) => {
    state = Object.freeze(next);
    for (const notify of listeners) notify();
  };

  actions.register('increment', () => {
    commit({ ...state, count: state.count + state.step });
  });

  actions.register('decrement', () => {
    commit({ ...state, count: state.count - state.step });
  });

  actions.register('setStep', ({ step }) => {
    commit({ ...state, step });
  });

  const source: ReadableSource<CounterState> = {
    getSnapshot: () => state,
    subscribe: (notify) => {
      listeners.add(notify);
      return () => {
        listeners.delete(notify);
      };
    },
  };

  return {
    source,
    dispatch: actions.dispatch.bind(actions),
    destroy: () => {
      listeners.clear();
      actions.destroy();
    },
  };
}

// 호스트 세션 초기화 및 자원 해제(Teardown)
export function bootstrapCounterSession() {
  const model = createCounterModel();

  // 중요: 렌더링 본문 내부가 아닌 호스트 초기화 시점에 조기 연결(Eager Connection)
  const connection = connectSourceSignal(model.source);

  return {
    dispatch: model.dispatch,
    sourceSignal: connection.signal,
    teardown: () => {
      connection.dispose(); // 시그널 구독 해제 (멱등성 보장)
      model.destroy();      // 호스트 액션 레지스터 및 리스너 완전 정리
    },
  };
}
```

---

## 4. 공개 API 상세 레퍼런스 (API Reference)

### `createDispatchContext<A>(name: string)`

호스트가 소유한 `ActionDispatcher<A>`를 Preact 컴포넌트 트리에 안전하게 전달하기 위한 컨텍스트 객체를 생성합니다.

```typescript
export function createDispatchContext<A extends ActionPayloadMap>(name: string): {
  Provider: (props: {
    dispatch: ActionDispatcher<A>;
    children?: ComponentChildren;
  }) => JSX.Element;
  useDispatch: () => ActionDispatcher<A>;
};
```

- **파라미터**:
  - `name`: 진단용 컨텍스트 식별자 문자열 (오류 메시지에 사용).
- **반환값**:
  - `Provider`: 호스트 디스패처를 주입하는 Preact 컴포넌트.
  - `useDispatch`: 현재 주입된 디스패처를 반환하는 커스텀 훅.
- **예외(Throw)**:
  - `Provider` 외부에서 `useDispatch()`를 호출할 경우 `"${name}: useDispatch requires its Provider"` 에러를 던집니다.
- **계약 보장**:
  - 이 어댑터는 `ActionRegister`를 임의로 생성하거나 파괴하지 않으며, `@context-action/core`의 디스패치 실행 및 프로미스 처리 의미론을 그대로 유지합니다.

---

### `connectSourceSignal<T>(source: ReadableSource<T>): SignalConnection<T>`

외부 상태 저장소(`ReadableSource<T>`)를 Preact Signals 런타임에 연결하여 읽기 전용 시그널(`ReadonlySignal<T>`)로 투영합니다.

```typescript
export interface ReadableSource<T> {
  getSnapshot(): T;
  subscribe(notify: () => void): () => void;
}

export interface SignalConnection<T> {
  readonly signal: ReadonlySignal<T>;
  readonly disposed: boolean;
  dispose(): void;
}

export function connectSourceSignal<T>(source: ReadableSource<T>): SignalConnection<T>;
```

- **`ReadableSource<T>` 요구조건**:
  - `getSnapshot()`: 상태의 불변 스냅샷을 반환해야 합니다. 상태가 변경되지 않는 한 동일한 객체 참조를 반환해야 합니다.
  - `subscribe(notify)`: 변경 알림 콜백을 등록하고 구독 해제 함수를 반환해야 합니다. `notify`는 새로운 스냅샷이 준비된 직후 동기적으로 호출되어야 합니다.
- **연결 및 해제 동작 보장**:
  - **구독-스냅샷 갭 해소**: 구독 직후 `refresh()`를 즉시 실행하여, 스냅샷 최초 획득과 리스너 등록 사이에 발생할 수 있는 상태 변경 누락을 방지합니다.
  - **초기화 실패 안전망**: 구독 또는 초기 갱신 중 예외가 발생하면 즉시 구독을 해제하고 `disposed = true`로 전환합니다. (구독 해제 도중 추가 오류가 발생하면 `AggregateError`로 래핑하여 던집니다.)
  - **멱등적 자원 해제**: `dispose()`를 여러 번 호출해도 실제 구독 해제는 단 한 번만 실행됩니다.
  - **해제 후 동결(Freezing)**: 해제된 이후에 도착하는 상태 알림은 안전하게 무시되며, `signal.value`는 마지막 스냅샷을 유지합니다.
  - **비파괴성**: `dispose()`는 시그널 연결만을 해제할 뿐, 호스트의 원본 `ReadableSource`를 파괴하지 않습니다.
  - **단방향성**: 시그널을 통한 원본 상태로의 역방향 쓰기는 원천적으로 지원되지 않으며 금지됩니다.

---

### `createSourceContext<T>(name: string): SourceContext<T>`

대여받은 소스 시그널(`ReadonlySignal<T>`)을 DOM 요소와의 결합 없이 컴포넌트 하위 트리로 배포하기 위한 Preact Context를 생성합니다.

```typescript
export interface SourceContext<T> {
  Provider(props: {
    sourceSignal: ReadonlySignal<T>;
    children?: ComponentChildren;
  }): JSX.Element;
  useSourceSignal(): ReadonlySignal<T>;
}

export function createSourceContext<T>(name: string): SourceContext<T>;
```

- **파라미터**:
  - `name`: 진단용 컨텍스트 식별자 문자열.
- **예외(Throw)**:
  - `Provider` 외부에서 `useSourceSignal()`을 호출하면 `"${name}: useSourceSignal requires its Provider"` 에러를 던집니다.

---

### `useProjection<State, Projected>(sourceSignal, selector): ReadonlySignal<Projected>`

원본 상태 시그널로부터 필요한 슬라이스를 추출하여 미세 단위의 파생 읽기 전용 시그널(`ReadonlySignal<Projected>`)로 투영합니다.

```typescript
export function useProjection<State, Projected>(
  sourceSignal: ReadonlySignal<State>,
  selector: (state: State) => Projected,
): ReadonlySignal<Projected>;
```

- **동작 원리**:
  - `@preact/signals`의 `useComputed(() => selector(sourceSignal.value))`를 기반으로 구현됩니다.
  - 셀렉터가 접근한 시그널 값이 실제로 변경될 때만 재평가됩니다.
- **DOM 미세 바인딩 최적화**:
  - 반환된 `ReadonlySignal`을 JSX에 직접 전달(예: `<output>{countSignal}</output>`)하면, 부모 컴포넌트의 가상 DOM 리렌더링 없이 브라우저의 DOM 텍스트 노드가 직접 갱신됩니다.
- **순수성 규칙(Purity Rule)**:
  - `selector`는 반드시 순수 함수여야 합니다. 셀렉터 내부에서 액션을 디스패치하거나 상태를 변경하거나 외부 부수 효과를 일으켜서는 안 됩니다.

---

## 5. 아키텍처 가이드라인 및 안티패턴 (Guidelines & Anti-Patterns)

| 안티패턴 (Anti-Pattern) ❌ | 모범 사례 (Best Practice) ✅ | 이유 (Rationale) |
|---|---|---|
| 컴포넌트 렌더 바디 안에서 `connectSourceSignal` 호출 | 호스트 세션 초기화 시점에 조기 연결(Eager Connection)하고 세션 종료 시 `dispose()` | 매 렌더링마다 불필요한 구독과 메모리 누수 발생 방지 |
| 컴포넌트 JSX에서 직접 원시 액션명 호출 (`onClick={() => dispatch('increment')}`) | 도메인 의미적 액션 훅(`useCounterActions`)으로 캡슐화하여 뷰에 제공 | 뷰 컴포넌트가 비즈니스 액션명과 페이로드 구조에 결합되는 것을 차단 |
| 상태 전체 시그널(`sourceSignal`)을 그대로 뷰에 내려 모든 필드 변경 시 전체 재평가 유발 | `useProjection`을 통해 컴포넌트가 필요로 하는 최소 단위 신호만 투영 | 미세 단위 반응성을 극대화하여 불필요한 연산 및 DOM 업데이트 최소화 |
| `useProjection`의 `selector` 내부에서 액션 디스패치나 API 호출 등 부수 효과 수행 | 셀렉터는 오직 순수한 상태 슬라이스 추출만 수행 | 시그널 평가 루프의 무한 재귀 및 예측 불가능한 렌더링 버그 방지 |
| 세션 종료 시 `connection.dispose()` 및 `model.destroy()` 누락 | 호스트 부트스트랩 반환값에 명시적 `teardown()` 함수를 포함하여 일괄 정리 | 브라우저 탭 및 SPA 라우팅 전환 시 리스너 및 메모리 누수 방지 |

---

## 6. 공개 preview 상태 및 검증 (Preview Status & Verification)

`@context-action/preact@0.1.0`은 공개 배포된 공식 프리뷰 패키지입니다. `private: false` 및 `publishConfig.access: public`으로 설정되어 있으며, Core 및 React 패키지와는 독립된 Preact 공개 코호트 관리 하에 보호된 워크플로로 릴리즈됩니다.

### 패키지 검증 명령어

리포지토리 내에서 다음 명령어를 통해 패키지의 빌드, 타입 검사, 단위 테스트, 린트 및 릴리즈 계약 무결성을 직접 검증할 수 있습니다.

```bash
# 단위 테스트 실행 (Vitest)
pnpm --filter @context-action/preact test

# 엄격 모드 TypeScript 타입 검사
pnpm --filter @context-action/preact type-check

# 리포지토리 전체 린트 검사
pnpm lint

# Context-Layered 아키텍처 컨벤션 검사
pnpm convention:check

# 공개 프리뷰 릴리즈 계약 검증
pnpm verify:preact-public-release -- --require-current-source
```

모든 문서 링크는 npm 레지스트리 게시 시 깨짐(404)이 발생하지 않도록 패키지 자체 완결형 앵커로 구성되어 있습니다.
DOM 마운트, Web Component 커스텀 엘리먼트 정의, React 19 호스트 연동, SSR 수화가 필요한 상위 런타임 기능은 [`@context-action/preact-ui`](https://www.npmjs.com/package/@context-action/preact-ui)를 참조하십시오.
