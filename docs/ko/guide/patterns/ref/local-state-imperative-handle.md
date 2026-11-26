# 로컬 상태 캡슐화 핸들 (`useLocalStore` / `useReducer` + `useImperativeHandle`)

재사용 가능한 위젯 내부에 반응형 `Store` (`useLocalStore`) 또는 결정론적 상태 머신 (`useReducer`)을 소유하면서도, 외부(부모/컨트롤러)에는 `useImperativeHandle`로 **도메인에 한정된 안전한 명령만 노출**하는 캡슐화 패턴입니다.

- **React 호환성**: React 18 / 19
- **래퍼 API 대신 패턴으로 유지하는 이유**: 내부 상태 소유 방식과 외부 명령 경계를 분리하는 설계 결정이며, `@context-action/react/advanced`의 `useLocalStore`와 React의 `useReducer` 자체가 이미 `useImperativeHandle` 안정성에 필요한 불변 참조(`store` / `dispatch`)를 제공합니다.

## 사전 요구사항

- [Imperative Handle Facade](./imperative-handle-facade.md)
- [Store별 선택 및 사용법 가이드](../../../context-layered/store-selection-and-usage-guide.md)

---

## Variant A vs Variant B 선택 기준

| 비교 축 | Variant A: `useLocalStore` + `useImperativeHandle` | Variant B: `useReducer` + `useImperativeHandle` |
|---|---|---|
| **내부 상태 소유자** | 컴포넌트 스코프 `Store<T>` (`@context-action/react/advanced`) | React `useReducer` 상태 머신 |
| **하위 트리 세분화 구독** | ✅ 하위 뷰에서 `useStoreSelector` / `useStorePath` 활용 가능 | props 전달 또는 로컬 Context 필요 |
| **같은 턴 쓰기 직후 동기 읽기** | ✅ `store.getValue()`로 즉시 반영 조회 | ❌ 커밋 완료된 스냅샷만 조회 (`stateRef`는 커밋 시 동기화) |
| **반드시 은닉할 항목** | `store.dispose()`, 임의 `store.setValue(...)` | 원시 `dispatch(action)` 유니온 |
| **`useImperativeHandle` 의존성** | `[store]` (컴포넌트 마운트 수명 동안 고정) | `[]` (`dispatch`는 React가 영구 안정성 보장) |
| **적합한 위젯** | 스테퍼, 필터 패널, `cmd(); getSnapshot()` 동기 API | fire-and-forget 명령형 타이머/재생 상태 머신 |

---

## Variant A: `useLocalStore` + `useImperativeHandle`

`useLocalStore`는 마운트당 1회 생성되고 언마운트 시 자동 정리되는 `{ value, store }`를 반환합니다. 이를 `useImperativeHandle`로 감싸면 `store.dispose()`와 원시 `store.setValue()`는 외부에서 호출할 수 없게 숨기고, 범위 제한(clamp)이 보장된 도메인 명령과 `getSnapshot()`만 노출할 수 있습니다.

<!-- @context-action-compile -->
```tsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from 'react';
import { useLocalStore } from '@context-action/react/advanced';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface StepperState {
  readonly count: number;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

export interface StepperHandle {
  readonly increment: () => void;
  readonly decrement: () => void;
  readonly reset: () => void;
  readonly getSnapshot: () => StepperState;
}

interface EncapsulatedStepperProps {
  initialCount?: number;
  min?: number;
  max?: number;
  step?: number;
}

function clampCount(next: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, next));
}

export const EncapsulatedStepper = forwardRef<StepperHandle, EncapsulatedStepperProps>(
  function EncapsulatedStepper(
    { initialCount = 0, min = 0, max = 10, step = 1 },
    ref,
  ) {
    const initialCountRef = useRef(initialCount);
    useIsomorphicLayoutEffect(() => {
      initialCountRef.current = initialCount;
    }, [initialCount]);

    const initialState: StepperState = {
      count: clampCount(initialCount, min, max),
      min,
      max,
      step,
    };
    const { value, store } = useLocalStore<StepperState>(
      initialState,
      'encapsulated-stepper',
    );

    useImperativeHandle(
      ref,
      () =>
        Object.freeze({
          increment: () => {
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count + prev.step, prev.min, prev.max),
            }));
          },
          decrement: () => {
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count - prev.step, prev.min, prev.max),
            }));
          },
          reset: () => {
            store.update((prev) => ({
              ...prev,
              count: clampCount(initialCountRef.current, prev.min, prev.max),
            }));
          },
          getSnapshot: () => store.getValue(),
        }),
      [store],
    );

    return (
      <div>
        <button
          type="button"
          onClick={() =>
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count - prev.step, prev.min, prev.max),
            }))
          }
        >
          -
        </button>
        <output>{value.count}</output>
        <button
          type="button"
          onClick={() =>
            store.update((prev) => ({
              ...prev,
              count: clampCount(prev.count + prev.step, prev.min, prev.max),
            }))
          }
        >
          +
        </button>
      </div>
    );
  },
);
```

> [!TIP]
> `store.getValue()`는 `value`를 `useImperativeHandle` 의존성 배열에 넣지 않고도 단일 진실 공급원에서 최신 상태를 즉시 조회합니다. 단, `useLocalStore`는 최초 마운트 시점의 `initialState`만 캡처하므로 `min`·`max`·`step` prop이 런타임에 동적으로 바뀔 수 있는 위젯이라면 effect에서 store나 ref를 별도로 동기화하세요.

---

## Variant B: `useReducer` + `useImperativeHandle`

`Store` 구독이나 같은 턴의 쓰기 직후 동기 읽기가 필요 없고 **fire-and-forget 명령 + 마지막 커밋 스냅샷 조회**만 필요한 순수 로컬 UI 상태 머신이라면 `useReducer`로 `useImperativeHandle` 의존성을 완전히 빈 배열(`[]`)로 유지할 수 있습니다.

<!-- @context-action-compile -->
```tsx
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useReducer,
  useRef,
} from 'react';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export type RunnerStatus = 'idle' | 'running' | 'paused';

interface RunnerState {
  readonly status: RunnerStatus;
  readonly cycles: number;
}

type RunnerAction =
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'tick' }
  | { type: 'reset' };

function runnerReducer(state: RunnerState, action: RunnerAction): RunnerState {
  switch (action.type) {
    case 'start':
      return state.status === 'running' ? state : { ...state, status: 'running' };
    case 'pause':
      return state.status === 'running' ? { ...state, status: 'paused' } : state;
    case 'tick':
      return state.status === 'running' ? { ...state, cycles: state.cycles + 1 } : state;
    case 'reset':
      return { status: 'idle', cycles: 0 };
  }
}

export interface RunnerHandle {
  readonly start: () => void;
  readonly pause: () => void;
  readonly tick: () => void;
  readonly reset: () => void;
  readonly getStatus: () => RunnerStatus;
  readonly getCycles: () => number;
}

export const EncapsulatedRunner = forwardRef<RunnerHandle>(
  function EncapsulatedRunner(_props, ref) {
    const [state, dispatch] = useReducer(runnerReducer, {
      status: 'idle',
      cycles: 0,
    });

    // 렌더 중 ref 대입이나 핸들러 내 리듀서 이중 실행을 피하기 위해
    // layout effect에서 커밋된 최신 상태를 동기화합니다.
    const stateRef = useRef(state);
    useIsomorphicLayoutEffect(() => {
      stateRef.current = state;
    }, [state]);

    // useReducer의 dispatch는 참조가 영구 안정하므로
    // useImperativeHandle 의존성 배열을 []로 유지할 수 있습니다.
    useImperativeHandle(
      ref,
      () =>
        Object.freeze({
          start: () => dispatch({ type: 'start' }),
          pause: () => dispatch({ type: 'pause' }),
          tick: () => dispatch({ type: 'tick' }),
          reset: () => dispatch({ type: 'reset' }),
          getStatus: () => stateRef.current.status,
          getCycles: () => stateRef.current.cycles,
        }),
      [],
    );

    return (
      <div>
        <span>Status: {state.status}</span>
        <span>Cycles: {state.cycles}</span>
      </div>
    );
  },
);
```

---

## 핵심 불변식

- **원시 `Store`와 원시 `dispatch`를 핸들로 노출하지 않기**: 부모는 `increment()`, `start()`, `pause()` 같은 도메인 유효 명령만 호출해 범위 제한과 전이 규칙을 지킵니다.
- **읽기 타이밍 기준으로 Variant A와 B 구분**:
  - `handle.increment(); handle.getSnapshot();`처럼 같은 턴의 쓰기 직후 동기 읽기가 필요하면 `Store`의 `store.getValue()`가 단일 진실을 보장하는 **Variant A (`useLocalStore`)**를 사용하세요.
  - fire-and-forget 명령과 커밋 후 상태 조회만 필요하다면 리듀서 이중 실행이나 내부 UI 버튼과의 상태 불일치 위험이 없는 **Variant B (`useReducer`)**가 깔끔합니다.
- **`Object.freeze` 적용**: 노출된 핸들이 읽기 전용 능력 객체(capability object) 계약으로 동작하도록 보장합니다.
