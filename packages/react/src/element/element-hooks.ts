import { useEffect, useMemo, useRef } from 'react';
import {
  createPointerGestureSession,
  createRovingFocusController,
  createSyncActionPipeline,
  type PointerGestureOptions,
  type PointerGestureSession,
  type RovingFocusController,
  type RovingFocusOptions,
  type SyncActionPipeline,
} from '@context-action/core/element';

interface PipelineHolder<TActions extends Record<string, unknown>> {
  name: string;
  pipeline: SyncActionPipeline<TActions>;
  destroyed: boolean;
}

interface GestureHolder {
  session: PointerGestureSession;
  disposed: boolean;
}

/**
 * Manages a StrictMode-safe synchronous UI action pipeline that cleans up on unmount
 * without causing React re-renders. Returns a stable facade that always forwards
 * to the currently active pipeline instance across StrictMode remounts.
 */
export function useSyncActionPipeline<
  TActions extends Record<string, unknown> = Record<string, unknown>,
>(
  name: string,
  configure: (pipeline: SyncActionPipeline<TActions>) => void,
): SyncActionPipeline<TActions> {
  const configureRef = useRef(configure);
  configureRef.current = configure;

  const instanceRef = useRef<PipelineHolder<TActions> | null>(null);

  const getActive = (): SyncActionPipeline<TActions> => {
    const existing = instanceRef.current;
    if (!existing || existing.destroyed || existing.name !== name) {
      if (existing && !existing.destroyed) {
        existing.pipeline.destroy();
      }
      const created = createSyncActionPipeline<TActions>(name);
      configureRef.current(created);
      instanceRef.current = { name, pipeline: created, destroyed: false };
    }
    return instanceRef.current!.pipeline;
  };

  // Eagerly initialize on first render so handlers registered during render/commit are ready.
  getActive();

  useEffect(() => {
    const existing = instanceRef.current;
    if (!existing || existing.destroyed || existing.name !== name) {
      const recreated = createSyncActionPipeline<TActions>(name);
      configureRef.current(recreated);
      instanceRef.current = { name, pipeline: recreated, destroyed: false };
    }
    const activeHolder = instanceRef.current!;
    return () => {
      activeHolder.pipeline.destroy();
      activeHolder.destroyed = true;
    };
  }, [name]);

  const getActiveRef = useRef(getActive);
  getActiveRef.current = getActive;

  return useMemo<SyncActionPipeline<TActions>>(
    () => ({
      name,
      registerGuard(action, handler, config) {
        return getActiveRef.current().registerGuard(action, handler, config);
      },
      register(action, handler, config) {
        return getActiveRef.current().register(action, handler, config);
      },
      registerObserver(action, handler, config) {
        return getActiveRef.current().registerObserver(action, handler, config);
      },
      dispatch(action, payload) {
        return getActiveRef.current().dispatch(action, payload);
      },
      destroy() {
        const current = instanceRef.current;
        if (current && !current.destroyed) {
          current.pipeline.destroy();
          current.destroyed = true;
        }
      },
    }),
    [name],
  );
}

/**
 * Wraps `createRovingFocusController` with live latest-ref callbacks so consumers
 * never manage manual ref mirrors or re-create the controller per render.
 */
export function useRovingFocus(
  options: RovingFocusOptions,
): RovingFocusController {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const orientation = options.orientation ?? 'horizontal';
  const loop = options.loop ?? true;

  return useMemo(
    () =>
      createRovingFocusController({
        orientation,
        loop,
        getItems: () => optionsRef.current.getItems(),
        getActiveId: () => optionsRef.current.getActiveId(),
        onFocusChange: nextId => optionsRef.current.onFocusChange?.(nextId),
      }),
    [orientation, loop],
  );
}

/**
 * Manages a StrictMode-safe `PointerGestureSession` with live callback refs and
 * automatic disposal on unmount. Returns a stable facade delegating to the
 * active session instance across StrictMode remounts.
 */
export function usePointerGesture(
  options: PointerGestureOptions = {},
): PointerGestureSession {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sessionRef = useRef<GestureHolder | null>(null);

  const getActive = (): PointerGestureSession => {
    const existing = sessionRef.current;
    if (!existing || existing.disposed) {
      const created = createPointerGestureSession({
        onStart: snapshot => optionsRef.current.onStart?.(snapshot),
        onMove: snapshot => optionsRef.current.onMove?.(snapshot),
        onCommit: snapshot => optionsRef.current.onCommit?.(snapshot),
        onCancel: (snapshot, reason) => optionsRef.current.onCancel?.(snapshot, reason),
      });
      sessionRef.current = { session: created, disposed: false };
    }
    return sessionRef.current!.session;
  };

  getActive();

  useEffect(() => {
    const existing = sessionRef.current;
    if (!existing || existing.disposed) {
      const recreated = createPointerGestureSession({
        onStart: snapshot => optionsRef.current.onStart?.(snapshot),
        onMove: snapshot => optionsRef.current.onMove?.(snapshot),
        onCommit: snapshot => optionsRef.current.onCommit?.(snapshot),
        onCancel: (snapshot, reason) => optionsRef.current.onCancel?.(snapshot, reason),
      });
      sessionRef.current = { session: recreated, disposed: false };
    }
    const activeHolder = sessionRef.current!;
    return () => {
      activeHolder.session.dispose();
      activeHolder.disposed = true;
    };
  }, []);

  const getActiveRef = useRef(getActive);
  getActiveRef.current = getActive;

  return useMemo<PointerGestureSession>(
    () => ({
      start: event => getActiveRef.current().start(event),
      move: event => getActiveRef.current().move(event),
      commit: event => getActiveRef.current().commit(event),
      cancel: reason => getActiveRef.current().cancel(reason),
      handleKeyDown: event => getActiveRef.current().handleKeyDown(event),
      isActive: () => getActiveRef.current().isActive(),
      getSnapshot: () => getActiveRef.current().getSnapshot(),
      dispose() {
        const current = sessionRef.current;
        if (current && !current.disposed) {
          current.session.dispose();
          current.disposed = true;
        }
      },
    }),
    [],
  );
}
