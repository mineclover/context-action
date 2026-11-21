# 외부 OOP 라이프사이클 브릿지 (`createRefContext` + `useLayoutEffect` / `useEffect`)

Canvas/WebGL/Three.js 렌더러, Monaco/CodeMirror 에디터, Chart.js, 지도 SDK, 미디어 컨트롤러처럼 React 외부에 존재하는 명령형 OOP 엔진을 `createRefContext`, isomorphic `useLayoutEffect`, `ActionContext`와 결합해 안전하게 마운트·제어·해제하는 패턴입니다.

- **React 호환성**: React 18 / 19 (React 19.2 `useEffectEvent` 참고 안내 포함)
- **경계 역할**: 원시 DOM 노드나 직렬화 불가능한 OOP 인스턴스를 `Store`에 넣지 않고 `RefContext` 수명 주기에 연결합니다.
- **래퍼 API 대신 패턴으로 유지하는 이유**: 외부 엔진마다 초기화 타이밍(페인트 전 동기 레이아웃 결합 vs 수동 구독)과 정리(`dispose`/`destroy`) 규칙이 다릅니다. 수명 주기 연결 코드를 명시적 패턴으로 유지해야 `<StrictMode>` 이중 실행과 `<Activity>` hide/reveal 동작을 명확히 제어할 수 있습니다.

## 사전 요구사항

- [Ref 기본 사용법](./basic-usage.md)
- [Imperative Handle Facade](./imperative-handle-facade.md)
- [React 19.2 Activity](../../react-19-activity.md)

---

## Effect 경계 규칙: 라이브러리 Provider vs 애플리케이션 OOP 브릿지

| 계층 | 사용하는 Effect 훅 | 이유 |
|---|---|---|
| **Context-Action Provider** (`ActionContext`, `StoreContext`, `RefContext`) | `useInsertionEffect` (내부 구현) | React 19.2 `<Activity>`가 passive/layout effect를 끊는 동안에도 Provider 소유 레지스트리·매니저를 보존하고 실제 unmount 시에만 정리합니다. |
| **애플리케이션 DOM & 외부 OOP 엔진** | `useLayoutEffect` (isomorphic) / `useEffect` | 애플리케이션 코드는 DOM ref나 외부 OOP 인스턴스에 `useInsertionEffect`를 쓰면 **절대 안 됩니다**(DOM 참조·상태 업데이트 금지). 페인트 전 동기 연결/측정에는 `useLayoutEffect`, 수동 구독/리스너에는 `useEffect`를 사용하세요. |

> [!IMPORTANT]
> React 19.2 `<Activity mode="hidden">`에서는 숨김 시 `useLayoutEffect` / `useEffect` cleanup이 실행되고 다시 보일 때 effect가 재실행됩니다(`<StrictMode>`의 이중 호출과 동일). 엔진의 `생성 + setRef`와 `setRef(null) + dispose()` 쌍이 **엄격히 멱등(idempotent)** 하도록 작성해야 인스턴스 누수가 발생하지 않습니다.

---

## 표준 패턴: 멱등 Attach/Dispose + 최신 콜백 Ref 우회

<!-- @context-action-compile -->
```tsx
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext, createRefContext } from '@context-action/react';

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface ViewportEngineHandle {
  readonly focusRegion: (regionId: string) => void;
  readonly resize: () => void;
}

/** 외부 서드파티 OOP 런타임 예시 (Canvas / Editor / Map SDK) */
class ViewportEngine {
  private disposed = false;

  constructor(
    private readonly hostElement: HTMLElement,
    private readonly onFocusRegion?: (regionId: string) => void,
  ) {
    this.hostElement.dataset.engineMounted = 'true';
  }

  focusRegion(regionId: string): void {
    if (this.disposed) return;
    this.hostElement.dataset.activeRegion = regionId;
    this.onFocusRegion?.(regionId);
  }

  resize(): void {
    if (this.disposed) return;
    this.hostElement.dataset.resizedAt = String(Date.now());
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    delete this.hostElement.dataset.engineMounted;
  }
}

interface ViewportActions extends ActionPayloadMap {
  focusRegion: { regionId: string };
}

const {
  Provider: ViewportActionProvider,
  useActionDispatch: useViewportDispatch,
  useActionCommandHandler: useViewportCommand,
} = createActionContext<ViewportActions>('ViewportEngineActions');

const {
  Provider: ViewportRefProvider,
  useRefHandler: useViewportRef,
} = createRefContext<{ engine: ViewportEngineHandle }>('ViewportEngineRefs');

function ViewportCanvas({
  onRegionFocused,
}: {
  onRegionFocused?: (regionId: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useViewportRef('engine');
  const { setRef } = engineRef;

  // React 18/19 공통 최신 콜백 우회 패턴:
  // 부모가 인라인 콜백을 넘기더라도 무거운 OOP 엔진이 재생성되지 않게 보호합니다.
  // (React 19.2+ 전용 환경에서는 Effect 내부 콜백에 한해 useEffectEvent로 대체할 수 있습니다.)
  const onRegionFocusedRef = useRef(onRegionFocused);
  useIsomorphicLayoutEffect(() => {
    onRegionFocusedRef.current = onRegionFocused;
  }, [onRegionFocused]);

  useIsomorphicLayoutEffect(() => {
    const hostElement = hostRef.current;
    if (!hostElement) return;

    const instance = new ViewportEngine(hostElement, (regionId) => {
      onRegionFocusedRef.current?.(regionId);
    });

    // 원시 instance.dispose()를 숨기고 동결된 능력 Facade만 노출
    const facade: ViewportEngineHandle = Object.freeze({
      focusRegion: (regionId: string) => instance.focusRegion(regionId),
      resize: () => instance.resize(),
    });

    setRef(facade);

    return () => {
      setRef(null);
      instance.dispose();
    };
  }, [setRef]);

  return <div ref={hostRef} data-testid="viewport-host" />;
}

function ViewportCoordinator({ children }: { children: React.ReactNode }) {
  // `isMounted` 변경 시 커맨드 핸들러가 재등록되지 않도록 `withTarget`을 구조 분해합니다.
  const { withTarget } = useViewportRef('engine');

  useViewportCommand(
    'focusRegion',
    useCallback(
      async ({ regionId }) => {
        await withTarget((engine) => {
          engine.focusRegion(regionId);
        });
      },
      [withTarget],
    ),
  );

  return <>{children}</>;
}

function ViewportControls() {
  const dispatch = useViewportDispatch();

  return (
    <button
      type="button"
      onClick={() => void dispatch('focusRegion', { regionId: 'hero' })}
    >
      Focus Hero Region
    </button>
  );
}

export function ExternalOopViewport({
  onRegionFocused,
}: {
  onRegionFocused?: (regionId: string) => void;
}) {
  return (
    <ViewportActionProvider>
      <ViewportRefProvider>
        <ViewportCoordinator>
          <ViewportCanvas onRegionFocused={onRegionFocused} />
          <ViewportControls />
        </ViewportCoordinator>
      </ViewportRefProvider>
    </ViewportActionProvider>
  );
}
```

---

## 핵심 불변식

1. **`setRef`와 `withTarget`을 구조 분해해 의존성 안정화**: `useRefHandler`가 반환하는 래퍼 객체는 `isMounted` 변경 시 새 참조가 되지만, 내부의 `setRef`·`withTarget`은 마운트 상태가 바뀌어도 참조가 고정되어 불필요한 Effect·핸들러 재실행 루프를 막습니다.
2. **`useRefHandler`의 마운트 구독 인지하기**: `useRefHandler`는 내부적으로 `useRefMountState`(`useSyncExternalStore`)를 구독합니다. 따라서 `ViewportCanvas` 안에서 `useViewportRef('engine')`를 호출하면 `useLayoutEffect`에서 `setRef(facade)`가 실행될 때 `isMounted: false -> true` 전환으로 1회 동기 마운트 리렌더링이 발생합니다. 무거운 하위 트리가 있어 이 1회 리렌더링조차 피해야 한다면 하위 요소를 메모이제이션하거나 경량 부모에서 `setRef`만 prop으로 내려주세요.
3. **`instance.dispose()` 전에 `setRef(null)` 먼저 호출**: `RefContext` 핸들을 먼저 비워 대기 중이던 `withTarget` 작업이 이미 해제된 인스턴스를 호출하지 않게 보호합니다.
4. **`RefContext` 소비자에게 `dispose()` 숨기기**: 동결된 `ViewportEngineHandle`만 등록하면 `ActionContext` 핸들러는 도메인 명령(`focusRegion`, `resize`)만 실행하고, 실제 해제는 소유 Effect가 전담합니다.
5. **React 19.2 `useEffectEvent` 참고**: React 19.2 이상만 지원한다면 Effect 내부 콜백에 `onRegionFocusedRef` 대신 `useEffectEvent`를 쓸 수 있습니다. 반면 React 18 호환이 필요하거나 Effect 밖(`ActionRegister` 핸들러 등)에서 호출되는 콜백에는 기존 ref 패턴을 유지하세요.
