# External OOP Runtime Lifecycle Bridge (`createRefContext` + `useLayoutEffect` / `useEffect`)

Mount, synchronize, and deterministically dispose non-React imperative OOP engines (Canvas/WebGL/Three.js renderers, Monaco/CodeMirror editors, Chart.js, Map SDKs, media players) using `createRefContext`, isomorphic `useLayoutEffect`, and `ActionContext`.

- **React Compatibility**: React 18 / 19 (note on React 19.2 `useEffectEvent` included below)
- **Boundary Role**: Bridges external mutable OOP object lifecycles into Context-Action's `RefContext` without storing raw DOM nodes or non-serializable engine instances inside `Store`.
- **Why a Usage Pattern (not a Wrapper API)**: Different engines attach at different phases (synchronous layout measurement vs passive subscription) and expose different disposal methods. Keeping lifecycle wiring explicit makes `<StrictMode>` replay and `<Activity>` hide/reveal semantics visible.

## Prerequisites

- [Ref Basic Usage](./basic-usage.md)
- [Imperative Handle Facade](./imperative-handle-facade.md)
- [React 19.2 Activity](../../react-19-activity.md)

---

## Effect Boundary Rule: Library Providers vs Application OOP Bridges

| Layer | Effect Hook | Why |
|---|---|---|
| **Context-Action Providers** (`ActionContext`, `StoreContext`, `RefContext`) | `useInsertionEffect` (internal) | Keeps Provider-owned registries/managers alive when React 19.2 `<Activity>` hides passive/layout effects, disposing only on real unmount. |
| **Application DOM & External OOP Engines** | `useLayoutEffect` (isomorphic) / `useEffect` | Application code must **never** use `useInsertionEffect` for DOM refs or external instances; React forbids reading DOM layout or scheduling state updates there. Use `useLayoutEffect` for synchronous attach/measure before paint, and `useEffect` for passive listeners/subscriptions. |

> [!IMPORTANT]
> Under React 19.2 `<Activity mode="hidden">`, `useLayoutEffect` / `useEffect` cleanups run when hidden and re-run when revealed — just like `<StrictMode>` double-invocation. Make your engine `create + setRef` and `setRef(null) + dispose()` pair **strictly idempotent** so hide/reveal and `<StrictMode>` never leak active engine instances.

---

## Canonical Pattern: Idempotent Attach/Dispose + Latest-Callback Ref

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

/** Simulated third-party OOP runtime (Canvas / Editor / Map SDK). */
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
  useRefController: useViewportController,
} = createRefContext<{ engine: ViewportEngineHandle }>('ViewportEngineRefs');

function ViewportCanvas({
  onRegionFocused,
}: {
  onRegionFocused?: (regionId: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const { setRef } = useViewportController('engine');

  // React 18/19-safe latest callback indirection:
  // prevents recreating the heavy OOP engine when parent passes an inline callback.
  // (On React 19.2+, `useEffectEvent` can replace this ref pair inside Effects.)
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

    // Expose a frozen capability facade instead of raw `instance.dispose()`
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
  const { withTarget } = useViewportController('engine');

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

## Key Invariants

1. **Use `useRefController` inside engine hosts & coordinators**: `useRefController` gives both `ViewportCanvas` (`setRef`) and `ViewportCoordinator` (`withTarget`) a stable reference without subscribing to `isMounted` changes, triggering **zero** mount-state re-renders when `setRef(facade)` attaches.
2. **Subscribe to mount status separately when needed**: Only call `useRefMountState('engine')` (or `useRefHandler('engine')`) in UI components that actually display loading/ready indicators for the external runtime.
3. **Detach `setRef(null)` before `instance.dispose()`**: Clears the `RefContext` handle first so no queued `withTarget` callback attempts to invoke a disposed instance.
4. **Hide `dispose()` from `RefContext` consumers**: Exposing a frozen `ViewportEngineHandle` ensures `ActionContext` handlers can command the engine (`focusRegion`, `resize`) while only the owning React Effect controls teardown.
5. **React 19.2 `useEffectEvent` note**: When targeting React 19.2+ exclusively, `onRegionFocusedRef` can be replaced by `useEffectEvent` inside the Effect callback; keep the ref indirection when supporting React 18 or when callbacks are also invoked outside Effects.
