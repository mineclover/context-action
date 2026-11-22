/**
 * @fileoverview React Aria-Style Headless Hook Primitives Built on Context-Action
 *
 * Implements 4 accessible headless hook factories/hooks using strictly public
 * Context-Action entrypoints (`@context-action/core/element`, `@context-action/react`,
 * `@context-action/react/refs`):
 * 1. `useAriaButton` - Sync pipeline (`createSyncActionPipeline`) for disabled guard + Enter/Space `preventDefault()`
 * 2. `createAriaTabs` - `createRovingFocusController` + `useStoreSelectorWithPaths` O(2) tab selection + Guard
 * 3. `createAriaSlider` - `createPointerGestureSession` + `lane: 'fast'` `useRefController` 0-render drag + Escape cancel + orchestrated commit
 * 4. `createAriaDialog` - Store + Guarded dismissal + trigger focus restoration
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createPointerGestureSession,
  createRovingFocusController,
  createSyncActionPipeline,
  type RovingFocusController,
} from '@context-action/core/element';
import {
  createActionContext,
  createStore,
  useStorePath,
  useStoreSelectorWithPaths,
  type Store,
} from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';

// =============================================================================
// 1. useAriaButton (Synchronous Element Pipeline + Local Pressed State)
// =============================================================================

export interface AriaButtonOptions {
  isDisabled?: boolean;
  onPress?: () => void;
}

export interface AriaButtonResult {
  isPressed: boolean;
  buttonProps: {
    type: 'button';
    role: 'button';
    tabIndex: 0 | -1;
    'aria-disabled': true | undefined;
    'data-pressed': 'true' | 'false';
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void;
    onPointerCancel: () => void;
    onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    onKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
  };
}

export function useAriaButton(options: AriaButtonOptions = {}): AriaButtonResult {
  const { isDisabled = false, onPress } = options;
  const [isPressed, setIsPressed] = useState(false);

  const disabledRef = useRef(isDisabled);
  const onPressRef = useRef(onPress);
  disabledRef.current = isDisabled;
  onPressRef.current = onPress;

  const pipelineRef = useRef<ReturnType<
    typeof createSyncActionPipeline<{
      pressStart: undefined;
      pressEnd: undefined;
      press: undefined;
    }>
  > | null>(null);

  if (!pipelineRef.current) {
    const pipeline = createSyncActionPipeline<{
      pressStart: undefined;
      pressEnd: undefined;
      press: undefined;
    }>('AriaButtonSyncPipeline');

    pipeline.registerGuard('pressStart', (_payload, controller) => {
      if (disabledRef.current) controller.abort('disabled');
    });
    pipeline.registerGuard('press', (_payload, controller) => {
      if (disabledRef.current) controller.abort('disabled');
    });

    pipeline.register('pressStart', () => {
      setIsPressed(true);
    });
    pipeline.register('pressEnd', () => {
      setIsPressed(false);
    });
    pipeline.register('press', () => {
      onPressRef.current?.();
    });

    pipelineRef.current = pipeline;
  }

  useEffect(() => {
    const current = pipelineRef.current;
    return () => {
      current?.destroy();
      pipelineRef.current = null;
    };
  }, []);

  const buttonProps = useMemo<AriaButtonResult['buttonProps']>(
    () => ({
      type: 'button',
      role: 'button',
      tabIndex: isDisabled ? -1 : 0,
      'aria-disabled': isDisabled ? true : undefined,
      'data-pressed': isPressed ? 'true' : 'false',
      onClick(event) {
        if (disabledRef.current) {
          event.preventDefault();
          return;
        }
        pipelineRef.current?.dispatch('press');
      },
      onPointerDown(event) {
        if ((event.button !== undefined && event.button !== 0) || disabledRef.current) return;
        pipelineRef.current?.dispatch('pressStart');
      },
      onPointerUp() {
        pipelineRef.current?.dispatch('pressEnd');
      },
      onPointerCancel() {
        pipelineRef.current?.dispatch('pressEnd');
      },
      onKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (disabledRef.current) return;
          pipelineRef.current?.dispatch('pressStart');
          if (event.key === 'Enter') {
            pipelineRef.current?.dispatch('pressEnd');
            pipelineRef.current?.dispatch('press');
          }
        }
      },
      onKeyUp(event) {
        if (event.key === ' ') {
          event.preventDefault();
          pipelineRef.current?.dispatch('pressEnd');
          pipelineRef.current?.dispatch('press');
        }
      },
    }),
    [isDisabled, isPressed],
  );

  return { isPressed, buttonProps };
}

// =============================================================================
// 2. createAriaTabs (Roving Focus + O(2) Path-Filtered Tab Selection + Guard)
// =============================================================================

export interface AriaTabItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface AriaTabsState {
  selectedId: string;
  focusedId: string;
}

interface AriaTabsActionMap {
  focusTab: { id: string };
  selectTab: { id: string };
}

interface AriaTabsRuntime {
  baseId: string;
  store: Store<AriaTabsState>;
  itemsRef: React.RefObject<readonly AriaTabItem[]>;
  itemElements: Map<string, HTMLButtonElement>;
  rovingFocus: RovingFocusController;
}

export interface AriaTabsProviderProps {
  items: readonly AriaTabItem[];
  defaultSelectedId?: string;
  canSelect?: (nextId: string) => boolean;
  onSelect?: (nextId: string) => void;
  children: React.ReactNode;
}

export function createAriaTabs(name: string) {
  const Actions = createActionContext<AriaTabsActionMap>(`${name}:Actions`, {
    actions: {
      focusTab: { lane: 'fast' },
      selectTab: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  const TabsRuntimeContext = createContext<AriaTabsRuntime | null>(null);

  function useTabsRuntime(): AriaTabsRuntime {
    const ctx = useContext(TabsRuntimeContext);
    if (!ctx) {
      throw new Error(`useTabsRuntime(${name}) must be used within ${name}.Provider`);
    }
    return ctx;
  }

  function TabsBridge({
    items,
    canSelect,
    onSelect,
    children,
  }: Omit<AriaTabsProviderProps, 'defaultSelectedId'>) {
    const runtime = useTabsRuntime();
    const canSelectRef = useRef(canSelect);
    const onSelectRef = useRef(onSelect);
    canSelectRef.current = canSelect;
    onSelectRef.current = onSelect;
    runtime.itemsRef.current = items;

    Actions.useActionGuard(
      'selectTab',
      useCallback((payload, controller) => {
        const targetItem = runtime.itemsRef.current.find(item => item.id === payload.id);
        if (!targetItem || targetItem.disabled) {
          controller.abort(`tab "${payload.id}" is disabled or missing`);
          return;
        }
        if (canSelectRef.current && !canSelectRef.current(payload.id)) {
          controller.abort(`tab "${payload.id}" selection blocked by policy`);
        }
      }, [runtime]),
    );

    Actions.useActionCommandHandler(
      'focusTab',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            draft.focusedId = payload.id;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'selectTab',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            draft.selectedId = payload.id;
            draft.focusedId = payload.id;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionObserver(
      'selectTab',
      useCallback(event => {
        onSelectRef.current?.(event.payload.id);
      }, []),
      { when: 'success' },
    );

    return <>{children}</>;
  }

  function Provider({
    items,
    defaultSelectedId,
    canSelect,
    onSelect,
    children,
  }: AriaTabsProviderProps) {
    const baseId = useId();
    const firstEnabled = items.find(item => !item.disabled)?.id ?? items[0]?.id ?? '';
    const initialId = defaultSelectedId ?? firstEnabled;

    const itemsRef = useRef<readonly AriaTabItem[]>(items);
    itemsRef.current = items;

    const storeRef = useRef<Store<AriaTabsState> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createStore<AriaTabsState>(
        `${name}:${baseId}:Store`,
        { selectedId: initialId, focusedId: initialId },
        { notificationMode: 'immediate' },
      );
    }

    const itemElementsRef = useRef<Map<string, HTMLButtonElement> | null>(null);
    if (!itemElementsRef.current) {
      itemElementsRef.current = new Map();
    }

    const rovingFocus = useMemo(
      () =>
        createRovingFocusController({
          orientation: 'horizontal',
          loop: true,
          getItems: () => itemsRef.current,
          getActiveId: () => storeRef.current?.getValue().focusedId ?? null,
          onFocusChange(nextId) {
            storeRef.current?.update(draft => {
              draft.focusedId = nextId;
            });
            itemElementsRef.current?.get(nextId)?.focus();
          },
        }),
      [],
    );

    const runtime = useMemo<AriaTabsRuntime>(
      () => ({
        baseId,
        store: storeRef.current!,
        itemsRef,
        itemElements: itemElementsRef.current!,
        rovingFocus,
      }),
      [baseId, rovingFocus],
    );

    useEffect(() => {
      return () => {
        runtime.store.dispose();
        storeRef.current = null;
      };
    }, [runtime]);

    return (
      <Actions.Provider>
        <TabsRuntimeContext.Provider value={runtime}>
          <TabsBridge items={items} canSelect={canSelect} onSelect={onSelect}>
            {children}
          </TabsBridge>
        </TabsRuntimeContext.Provider>
      </Actions.Provider>
    );
  }

  function useTabList() {
    const runtime = useTabsRuntime();
    return useMemo(
      () => ({
        role: 'tablist' as const,
        'aria-orientation': 'horizontal' as const,
        onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
          const currentId = runtime.store.getValue().focusedId;
          runtime.rovingFocus.handleKeyDown(currentId, event);
        },
      }),
      [runtime],
    );
  }

  function useTab(id: string) {
    const runtime = useTabsRuntime();
    const dispatch = Actions.useActionDispatch();

    const isSelected = useStoreSelectorWithPaths<AriaTabsState, boolean>(
      runtime.store,
      state => state.selectedId === id,
      { dependsOn: [['selectedId']] },
    );
    const isFocused = useStoreSelectorWithPaths<AriaTabsState, boolean>(
      runtime.store,
      state => state.focusedId === id,
      { dependsOn: [['focusedId']] },
    );

    const item = runtime.itemsRef.current.find(candidate => candidate.id === id);
    const isDisabled = Boolean(item?.disabled);

    const setRef = useCallback(
      (node: HTMLButtonElement | null) => {
        if (node) runtime.itemElements.set(id, node);
        else runtime.itemElements.delete(id);
      },
      [id, runtime],
    );

    const onClick = useCallback(() => {
      if (isDisabled) return;
      void dispatch('selectTab', { id });
    }, [dispatch, id, isDisabled]);

    const onFocus = useCallback(() => {
      if (isDisabled) return;
      void dispatch('focusTab', { id });
    }, [dispatch, id, isDisabled]);

    return {
      isSelected,
      isFocused,
      tabProps: {
        id: `${runtime.baseId}-tab-${id}`,
        role: 'tab' as const,
        type: 'button' as const,
        tabIndex: isDisabled ? -1 : isFocused ? 0 : -1,
        'aria-selected': isSelected,
        'aria-controls': `${runtime.baseId}-panel-${id}`,
        'aria-disabled': isDisabled ? true : undefined,
        disabled: isDisabled,
        ref: setRef,
        onClick,
        onFocus,
      },
    };
  }

  function useTabPanel(id: string) {
    const runtime = useTabsRuntime();
    const isSelected = useStoreSelectorWithPaths<AriaTabsState, boolean>(
      runtime.store,
      state => state.selectedId === id,
      { dependsOn: [['selectedId']] },
    );

    return {
      isSelected,
      tabPanelProps: {
        id: `${runtime.baseId}-panel-${id}`,
        role: 'tabpanel' as const,
        'aria-labelledby': `${runtime.baseId}-tab-${id}`,
        hidden: !isSelected,
        tabIndex: 0 as const,
      },
    };
  }

  return {
    Provider,
    useTabList,
    useTab,
    useTabPanel,
    useTabsActionDispatch: Actions.useActionDispatch,
  };
}

// =============================================================================
// 3. createAriaSlider (Gesture Session + Fast-Lane Ref Drag + Orchestrated Commit)
// =============================================================================

interface AriaSliderState {
  value: number;
}

interface AriaSliderActionMap {
  previewDrag: { value: number };
  commitValue: { value: number };
}

interface AriaSliderConfig {
  min: number;
  max: number;
  step: number;
}

interface AriaSliderRuntime {
  store: Store<AriaSliderState>;
  configRef: React.RefObject<AriaSliderConfig>;
  computeValueFromClientX: (clientX: number) => number;
  syncThumbDom: (value: number) => void;
}

export interface AriaSliderProviderProps {
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChangeEnd?: (value: number) => void;
  children: React.ReactNode;
}

function clampAndStep(raw: number, min: number, max: number, step: number): number {
  const clamped = Math.min(max, Math.max(min, raw));
  const stepped = min + Math.round((clamped - min) / step) * step;
  return Math.min(max, Math.max(min, Number(stepped.toFixed(6))));
}

export function createAriaSlider(name: string) {
  const Actions = createActionContext<AriaSliderActionMap>(`${name}:Actions`, {
    actions: {
      previewDrag: { lane: 'fast' },
      commitValue: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  const Refs = createRefContext(`${name}:Refs`, {
    track: {
      name: 'track',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLDivElement =>
        target instanceof HTMLDivElement,
    },
    thumb: {
      name: 'thumb',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLDivElement =>
        target instanceof HTMLDivElement,
    },
  });

  const SliderRuntimeContext = createContext<AriaSliderRuntime | null>(null);

  function useSliderRuntime(): AriaSliderRuntime {
    const ctx = useContext(SliderRuntimeContext);
    if (!ctx) {
      throw new Error(`useSliderRuntime(${name}) must be used within ${name}.Provider`);
    }
    return ctx;
  }

  function SliderBridge({
    onChangeEnd,
    children,
  }: {
    onChangeEnd?: (value: number) => void;
    children: React.ReactNode;
  }) {
    const runtime = useSliderRuntime();
    const track = Refs.useRefController('track');
    const thumb = Refs.useRefController('thumb');
    const onChangeEndRef = useRef(onChangeEnd);
    onChangeEndRef.current = onChangeEnd;

    // Bind DOM/coordinate helpers cleanly to ref controllers
    useMemo(() => {
      runtime.syncThumbDom = (nextValue: number) => {
        const { min, max } = runtime.configRef.current;
        const pct = max === min ? 0 : ((nextValue - min) / (max - min)) * 100;
        thumb.executeIfMounted(el => {
          el.style.left = `${pct}%`;
          el.setAttribute('aria-valuenow', String(nextValue));
          el.dataset.previewValue = String(nextValue);
        });
      };

      runtime.computeValueFromClientX = (clientX: number) => {
        if (!Number.isFinite(clientX)) return runtime.store.getValue().value;
        const { min, max, step } = runtime.configRef.current;
        const trackEl = track.target;
        if (!trackEl) return runtime.store.getValue().value;
        const rect = trackEl.getBoundingClientRect();
        if (rect.width <= 0) return runtime.store.getValue().value;
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        return clampAndStep(min + ratio * (max - min), min, max, step);
      };
    }, [runtime, thumb, track]);

    Actions.useActionCommandHandler(
      'previewDrag',
      useCallback(
        payload => {
          runtime.syncThumbDom(payload.value);
        },
        [runtime],
      ),
    );

    Actions.useActionGuard(
      'commitValue',
      useCallback(
        (payload, controller) => {
          const { min, max, step } = runtime.configRef.current;
          const normalized = clampAndStep(payload.value, min, max, step);
          if (normalized !== payload.value) {
            controller.modifyPayload(() => ({ value: normalized }));
          }
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'commitValue',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            draft.value = payload.value;
          });
          runtime.syncThumbDom(payload.value);
        },
        [runtime],
      ),
    );

    Actions.useActionObserver(
      'commitValue',
      useCallback(event => {
        onChangeEndRef.current?.(event.payload.value);
      }, []),
      { when: 'success' },
    );

    return <>{children}</>;
  }

  function Provider({
    min = 0,
    max = 100,
    step = 1,
    defaultValue = min,
    onChangeEnd,
    children,
  }: AriaSliderProviderProps) {
    const clampedDefault = clampAndStep(defaultValue, min, max, step);
    const configRef = useRef<AriaSliderConfig>({ min, max, step });
    configRef.current = { min, max, step };

    const storeRef = useRef<Store<AriaSliderState> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createStore<AriaSliderState>(
        `${name}:Store`,
        { value: clampedDefault },
        { notificationMode: 'immediate' },
      );
    }

    const runtime = useMemo<AriaSliderRuntime>(
      () => ({
        store: storeRef.current!,
        configRef,
        computeValueFromClientX: () => storeRef.current!.getValue().value,
        syncThumbDom: () => {},
      }),
      [],
    );

    useEffect(() => {
      return () => {
        runtime.store.dispose();
        storeRef.current = null;
      };
    }, [runtime]);

    return (
      <Actions.Provider>
        <Refs.Provider>
          <SliderRuntimeContext.Provider value={runtime}>
            <SliderBridge onChangeEnd={onChangeEnd}>{children}</SliderBridge>
          </SliderRuntimeContext.Provider>
        </Refs.Provider>
      </Actions.Provider>
    );
  }

  function useSliderTrack() {
    const runtime = useSliderRuntime();
    const track = Refs.useRefController('track');
    const dispatch = Actions.useActionDispatch();

    const gestureRef = useRef<ReturnType<typeof createPointerGestureSession> | null>(null);
    if (!gestureRef.current) {
      gestureRef.current = createPointerGestureSession({
        onStart(snapshot) {
          const next = runtime.computeValueFromClientX(snapshot.startX);
          void dispatch('previewDrag', { value: next });
        },
        onMove(snapshot) {
          const next = runtime.computeValueFromClientX(snapshot.currentX);
          void dispatch('previewDrag', { value: next });
        },
        onCommit(snapshot) {
          const next = runtime.computeValueFromClientX(snapshot.currentX);
          void dispatch('commitValue', { value: next });
        },
        onCancel() {
          const committed = runtime.store.getValue().value;
          void dispatch('previewDrag', { value: committed });
        },
      });
    }

    useEffect(() => {
      const gesture = gestureRef.current;
      return () => {
        gesture?.dispose();
        gestureRef.current = null;
      };
    }, []);

    return useMemo(
      () => ({
        trackProps: {
          ref: track.setRef,
          onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
            gestureRef.current?.start(event);
          },
          onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
            gestureRef.current?.move(event);
          },
          onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
            gestureRef.current?.commit(event);
          },
          onPointerCancel() {
            gestureRef.current?.cancel('pointercancel');
          },
          onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
            gestureRef.current?.handleKeyDown(event);
          },
        },
        cancelGesture: () => gestureRef.current?.cancel('escape') ?? false,
      }),
      [track],
    );
  }

  function useSliderThumb() {
    const runtime = useSliderRuntime();
    const thumb = Refs.useRefController('thumb');
    const dispatch = Actions.useActionDispatch();
    const committedValue = useStorePath<AriaSliderState, number>(runtime.store, ['value']);
    const { min, max, step } = runtime.configRef.current;
    const pct = max === min ? 0 : ((committedValue - min) / (max - min)) * 100;

    return {
      value: committedValue,
      thumbProps: {
        ref: thumb.setRef,
        role: 'slider' as const,
        tabIndex: 0 as const,
        'aria-valuemin': min,
        'aria-valuemax': max,
        'aria-valuenow': committedValue,
        'data-preview-value': String(committedValue),
        style: { left: `${pct}%` },
        onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
          const current = runtime.store.getValue().value;
          const cfg = runtime.configRef.current;
          let next: number | null = null;
          if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
            next = current + cfg.step;
          } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
            next = current - cfg.step;
          } else if (event.key === 'Home') {
            next = cfg.min;
          } else if (event.key === 'End') {
            next = cfg.max;
          }
          if (next === null) return;
          event.preventDefault();
          void dispatch('commitValue', {
            value: clampAndStep(next, cfg.min, cfg.max, cfg.step),
          });
        },
      },
    };
  }

  function useSliderValue(): number {
    const runtime = useSliderRuntime();
    return useStorePath<AriaSliderState, number>(runtime.store, ['value']);
  }

  return {
    Provider,
    useSliderTrack,
    useSliderThumb,
    useSliderValue,
  };
}

// =============================================================================
// 4. createAriaDialog (Overlay Store + Guarded Dismiss + Focus Restoration)
// =============================================================================

interface AriaDialogState {
  isOpen: boolean;
}

interface AriaDialogActionMap {
  open: undefined;
  close: undefined;
}

interface AriaDialogRuntime {
  dialogId: string;
  titleId: string;
  store: Store<AriaDialogState>;
}

export interface AriaDialogProviderProps {
  defaultOpen?: boolean;
  canDismiss?: () => boolean;
  onOpenChange?: (isOpen: boolean) => void;
  children: React.ReactNode;
}

export function createAriaDialog(name: string) {
  const Actions = createActionContext<AriaDialogActionMap>(`${name}:Actions`, {
    actions: {
      open: { lane: 'orchestrated', queue: 'serial' },
      close: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  const Refs = createRefContext(`${name}:Refs`, {
    trigger: {
      name: 'trigger',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLButtonElement =>
        target instanceof HTMLButtonElement,
    },
    dialog: {
      name: 'dialog',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLDivElement =>
        target instanceof HTMLDivElement,
    },
  });

  const DialogRuntimeContext = createContext<AriaDialogRuntime | null>(null);

  function useDialogRuntime(): AriaDialogRuntime {
    const ctx = useContext(DialogRuntimeContext);
    if (!ctx) {
      throw new Error(`useDialogRuntime(${name}) must be used within ${name}.Provider`);
    }
    return ctx;
  }

  function DialogBridge({
    canDismiss,
    onOpenChange,
    children,
  }: Omit<AriaDialogProviderProps, 'defaultOpen'>) {
    const runtime = useDialogRuntime();
    const canDismissRef = useRef(canDismiss);
    const onOpenChangeRef = useRef(onOpenChange);
    canDismissRef.current = canDismiss;
    onOpenChangeRef.current = onOpenChange;

    Actions.useActionCommandHandler(
      'open',
      useCallback(() => {
        runtime.store.update(draft => {
          draft.isOpen = true;
        });
      }, [runtime]),
    );

    Actions.useActionGuard(
      'close',
      useCallback((_payload, controller) => {
        if (canDismissRef.current && !canDismissRef.current()) {
          controller.abort('dismiss blocked by policy');
        }
      }, []),
    );

    Actions.useActionCommandHandler(
      'close',
      useCallback(() => {
        runtime.store.update(draft => {
          draft.isOpen = false;
        });
      }, [runtime]),
    );

    Actions.useActionObserver(
      'open',
      useCallback(() => {
        onOpenChangeRef.current?.(true);
      }, []),
      { when: 'success' },
    );

    Actions.useActionObserver(
      'close',
      useCallback(() => {
        onOpenChangeRef.current?.(false);
      }, []),
      { when: 'success' },
    );

    return <>{children}</>;
  }

  function Provider({
    defaultOpen = false,
    canDismiss,
    onOpenChange,
    children,
  }: AriaDialogProviderProps) {
    const baseId = useId();
    const storeRef = useRef<Store<AriaDialogState> | null>(null);
    if (!storeRef.current) {
      storeRef.current = createStore<AriaDialogState>(
        `${name}:${baseId}:Store`,
        { isOpen: defaultOpen },
        { notificationMode: 'immediate' },
      );
    }

    const runtime = useMemo<AriaDialogRuntime>(
      () => ({
        dialogId: `${baseId}-dialog`,
        titleId: `${baseId}-title`,
        store: storeRef.current!,
      }),
      [baseId],
    );

    useEffect(() => {
      return () => {
        runtime.store.dispose();
        storeRef.current = null;
      };
    }, [runtime]);

    return (
      <Actions.Provider>
        <Refs.Provider>
          <DialogRuntimeContext.Provider value={runtime}>
            <DialogBridge canDismiss={canDismiss} onOpenChange={onOpenChange}>
              {children}
            </DialogBridge>
          </DialogRuntimeContext.Provider>
        </Refs.Provider>
      </Actions.Provider>
    );
  }

  function useDialogTrigger() {
    const runtime = useDialogRuntime();
    const trigger = Refs.useRefController('trigger');
    const dispatch = Actions.useActionDispatch();
    const isOpen = useStorePath<AriaDialogState, boolean>(runtime.store, ['isOpen']);

    return {
      isOpen,
      triggerProps: {
        ref: trigger.setRef,
        type: 'button' as const,
        'aria-haspopup': 'dialog' as const,
        'aria-expanded': isOpen,
        'aria-controls': runtime.dialogId,
        onClick() {
          void dispatch(isOpen ? 'close' : 'open');
        },
      },
    };
  }

  function useDialog() {
    const runtime = useDialogRuntime();
    const dialog = Refs.useRefController('dialog');
    const trigger = Refs.useRefController('trigger');
    const dispatch = Actions.useActionDispatch();
    const isOpen = useStorePath<AriaDialogState, boolean>(runtime.store, ['isOpen']);
    const prevOpenRef = useRef(isOpen);

    useEffect(() => {
      const wasOpen = prevOpenRef.current;
      prevOpenRef.current = isOpen;
      if (!wasOpen && isOpen) {
        dialog.target?.focus();
      } else if (wasOpen && !isOpen) {
        trigger.target?.focus();
      }
    }, [dialog, isOpen, trigger]);

    return {
      isOpen,
      close: () => void dispatch('close'),
      titleProps: {
        id: runtime.titleId,
      },
      dialogProps: {
        id: runtime.dialogId,
        ref: dialog.setRef,
        role: 'dialog' as const,
        'aria-modal': true as const,
        'aria-labelledby': runtime.titleId,
        tabIndex: -1 as const,
        hidden: !isOpen,
        onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            void dispatch('close');
          }
        },
      },
    };
  }

  return {
    Provider,
    useDialogTrigger,
    useDialog,
  };
}

// =============================================================================
// 5. Combined Showcase Component
// =============================================================================

const DemoTabs = createAriaTabs('ShowcaseAriaTabs');
const DemoSlider = createAriaSlider('ShowcaseAriaSlider');
const DemoDialog = createAriaDialog('ShowcaseAriaDialog');

function ShowcaseButton() {
  const [pressCount, setPressCount] = useState(0);
  const { buttonProps, isPressed } = useAriaButton({
    onPress: () => setPressCount(c => c + 1),
  });
  return (
    <button {...buttonProps}>
      Sync Aria Button ({isPressed ? 'pressed' : 'idle'} | presses: {pressCount})
    </button>
  );
}

function ShowcaseTabsContent() {
  const tabListProps = DemoTabs.useTabList();
  const tabA = DemoTabs.useTab('overview');
  const tabB = DemoTabs.useTab('telemetry');
  const panelA = DemoTabs.useTabPanel('overview');
  const panelB = DemoTabs.useTabPanel('telemetry');

  return (
    <div>
      <div {...tabListProps} style={{ display: 'flex', gap: 8 }}>
        <button {...tabA.tabProps}>Overview</button>
        <button {...tabB.tabProps}>Telemetry</button>
      </div>
      <div {...panelA.tabPanelProps}>Overview content</div>
      <div {...panelB.tabPanelProps}>Telemetry content</div>
    </div>
  );
}

function ShowcaseSliderContent() {
  const { trackProps } = DemoSlider.useSliderTrack();
  const { thumbProps, value } = DemoSlider.useSliderThumb();

  return (
    <div>
      <div>Committed slider value: {value}</div>
      <div
        {...trackProps}
        style={{ position: 'relative', width: 200, height: 24, background: '#e2e8f0' }}
      >
        <div
          {...thumbProps}
          style={{
            ...thumbProps.style,
            position: 'absolute',
            top: 2,
            width: 20,
            height: 20,
            background: '#0f172a',
          }}
        />
      </div>
    </div>
  );
}

function ShowcaseDialogContent() {
  const { triggerProps } = DemoDialog.useDialogTrigger();
  const { dialogProps, titleProps, close } = DemoDialog.useDialog();

  return (
    <div>
      <button {...triggerProps}>Open Settings Dialog</button>
      <div {...dialogProps} style={{ padding: 12, border: '1px solid #94a3b8' }}>
        <h4 {...titleProps}>Settings</h4>
        <button type="button" onClick={close}>
          Close
        </button>
      </div>
    </div>
  );
}

export function AriaHeadlessShowcase() {
  const items: readonly AriaTabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'telemetry', label: 'Telemetry' },
  ];

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h3>React Aria-Style Headless Primitives on Context-Action</h3>
      <ShowcaseButton />
      <DemoTabs.Provider items={items}>
        <ShowcaseTabsContent />
      </DemoTabs.Provider>
      <DemoSlider.Provider min={0} max={100} step={5} defaultValue={25}>
        <ShowcaseSliderContent />
      </DemoSlider.Provider>
      <DemoDialog.Provider>
        <ShowcaseDialogContent />
      </DemoDialog.Provider>
    </div>
  );
}

export default AriaHeadlessShowcase;
