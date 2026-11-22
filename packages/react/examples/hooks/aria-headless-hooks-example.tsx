/**
 * @fileoverview React Aria-Style Headless Hook Primitives Built on Ergonomic Context-Action APIs
 *
 * Implements 7 React Aria-style headless UI primitives using strictly public
 * `@context-action/react` entrypoints:
 * 1. `useAriaButton` - StrictMode-safe `useSyncActionPipeline` + `mergeProps`
 * 2. `createAriaTabs` - `useStoreInstance` + `useControlledStoreSync` + `useRovingFocus` + `useRefCollection`
 * 3. `createAriaSlider` - `usePointerGesture` + `lane: 'fast'` `useRefController` 0-render drag + `useControlledStoreSync` + inferred `useStorePath`
 * 4. `createAriaDialog` - `useStoreInstance` + `useControlledStoreSync` + LIFO `useDismissLayer` + guarded dismissal + focus restoration
 * 5. `createAriaComboBox` - Virtual `useRovingFocus` (`getActiveDescendant`) + LIFO `useDismissLayer` + atomic `useControlledStoreSync` (`onSync`)
 * 6. `createAriaDataGrid` - Multi-select (`selectedById` `O(depth)` Path-Trie `useStorePath` per row), `Shift+Click` range, column sort, vertical `useRovingFocus`, and `lane: 'fast'` hover ref
 * 7. `createAriaMenu` - Vertical `useRovingFocus` with multi-char/cyclic `typeahead`, `useRefCollection`, LIFO `useDismissLayer`, guarded `activateItem`, and trigger focus restoration
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
  createActionContext,
  useStorePath,
  useStoreSelectorWithPaths,
  type Store,
} from '@context-action/react';
import {
  createRefContext,
  useRefCollection,
  type RefCollection,
} from '@context-action/react/refs';
import {
  useControlledStoreSync,
  useDismissLayer,
  usePointerGesture,
  useRovingFocus,
  useStoreInstance,
  useSyncActionPipeline,
  type RovingFocusController,
} from '@context-action/react/advanced';
import { mergeProps } from '@context-action/react/utils';

// =============================================================================
// 1. useAriaButton (StrictMode-Safe Sync Pipeline + mergeProps Ready)
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

  const pipeline = useSyncActionPipeline<{
    pressStart: undefined;
    pressEnd: undefined;
    press: undefined;
  }>('AriaButtonSyncPipeline', p => {
    p.registerGuard('pressStart', (_payload, controller) => {
      if (disabledRef.current) controller.abort('disabled');
    });
    p.registerGuard('press', (_payload, controller) => {
      if (disabledRef.current) controller.abort('disabled');
    });
    p.register('pressStart', () => {
      setIsPressed(true);
    });
    p.register('pressEnd', () => {
      setIsPressed(false);
    });
    p.register('press', () => {
      onPressRef.current?.();
    });
  });

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
        pipeline.dispatch('press');
      },
      onPointerDown(event) {
        if ((event.button !== undefined && event.button !== 0) || disabledRef.current) {
          return;
        }
        pipeline.dispatch('pressStart');
      },
      onPointerUp() {
        pipeline.dispatch('pressEnd');
      },
      onPointerCancel() {
        pipeline.dispatch('pressEnd');
      },
      onKeyDown(event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          if (disabledRef.current) return;
          pipeline.dispatch('pressStart');
          if (event.key === 'Enter') {
            pipeline.dispatch('pressEnd');
            pipeline.dispatch('press');
          }
        }
      },
      onKeyUp(event) {
        if (event.key === ' ') {
          event.preventDefault();
          pipeline.dispatch('pressEnd');
          pipeline.dispatch('press');
        }
      },
    }),
    [isDisabled, isPressed, pipeline],
  );

  return { isPressed, buttonProps };
}

// =============================================================================
// 2. createAriaTabs (Controlled/Uncontrolled + useRovingFocus + useRefCollection)
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
  itemRefs: RefCollection<HTMLButtonElement>;
  rovingFocus: RovingFocusController;
}

export interface AriaTabsProviderProps {
  items: readonly AriaTabItem[];
  defaultSelectedId?: string;
  selectedId?: string;
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
  }: Omit<AriaTabsProviderProps, 'defaultSelectedId' | 'selectedId'>) {
    const runtime = useTabsRuntime();
    const canSelectRef = useRef(canSelect);
    const onSelectRef = useRef(onSelect);
    canSelectRef.current = canSelect;
    onSelectRef.current = onSelect;
    runtime.itemsRef.current = items;

    Actions.useActionGuard(
      'selectTab',
      useCallback(
        (payload, controller) => {
          const targetItem = runtime.itemsRef.current.find(item => item.id === payload.id);
          if (!targetItem || targetItem.disabled) {
            controller.abort(`tab "${payload.id}" is disabled or missing`);
            return;
          }
          if (canSelectRef.current && !canSelectRef.current(payload.id)) {
            controller.abort(`tab "${payload.id}" selection blocked by policy`);
          }
        },
        [runtime],
      ),
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
    selectedId,
    canSelect,
    onSelect,
    children,
  }: AriaTabsProviderProps) {
    const baseId = useId();
    const firstEnabled = items.find(item => !item.disabled)?.id ?? items[0]?.id ?? '';
    const initialId = selectedId ?? defaultSelectedId ?? firstEnabled;

    const itemsRef = useRef<readonly AriaTabItem[]>(items);
    itemsRef.current = items;

    const store = useStoreInstance<AriaTabsState>(
      () => ({ selectedId: initialId, focusedId: initialId }),
      `${name}:${baseId}:Store`,
      { notificationMode: 'immediate' },
    );
    useControlledStoreSync(store, ['selectedId'], selectedId);

    const itemRefs = useRefCollection<HTMLButtonElement>();

    const rovingFocus = useRovingFocus({
      orientation: 'horizontal',
      loop: true,
      getItems: () => itemsRef.current,
      getActiveId: () => store.getValue().focusedId,
      onFocusChange(nextId) {
        store.update(draft => {
          draft.focusedId = nextId;
        });
        itemRefs.executeIfMounted(nextId, el => el.focus());
      },
    });

    const runtime = useMemo<AriaTabsRuntime>(
      () => ({
        baseId,
        store,
        itemsRef,
        itemRefs,
        rovingFocus,
      }),
      [baseId, store, itemRefs, rovingFocus],
    );

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
        ref: runtime.itemRefs.setRef(id),
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
// 3. createAriaSlider (usePointerGesture + Fast-Lane Ref + Controlled Sync)
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
  value?: number;
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
    value,
    onChangeEnd,
    children,
  }: AriaSliderProviderProps) {
    const initialVal = clampAndStep(value ?? defaultValue, min, max, step);
    const configRef = useRef<AriaSliderConfig>({ min, max, step });
    configRef.current = { min, max, step };

    const store = useStoreInstance<AriaSliderState>(
      () => ({ value: initialVal }),
      `${name}:Store`,
      { notificationMode: 'immediate' },
    );
    const clampedControlled =
      value === undefined ? undefined : clampAndStep(value, min, max, step);
    useControlledStoreSync(store, ['value'], clampedControlled);

    const runtime = useMemo<AriaSliderRuntime>(
      () => ({
        store,
        configRef,
        computeValueFromClientX: () => store.getValue().value,
        syncThumbDom: () => {},
      }),
      [store],
    );

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

    const gesture = usePointerGesture({
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

    return useMemo(
      () => ({
        trackProps: {
          ref: track.setRef,
          onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
            gesture.start(event);
          },
          onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
            gesture.move(event);
          },
          onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
            gesture.commit(event);
          },
          onPointerCancel() {
            gesture.cancel('pointercancel');
          },
          onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
            gesture.handleKeyDown(event);
          },
        },
        cancelGesture: () => gesture.cancel('escape'),
      }),
      [gesture, track],
    );
  }

  function useSliderThumb() {
    const runtime = useSliderRuntime();
    const thumb = Refs.useRefController('thumb');
    const dispatch = Actions.useActionDispatch();
    const committedValue = useStorePath(runtime.store, ['value']);
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
    return useStorePath(runtime.store, ['value']);
  }

  return {
    Provider,
    useSliderTrack,
    useSliderThumb,
    useSliderValue,
  };
}

// =============================================================================
// 4. createAriaDialog (useStoreInstance + Controlled Sync + Guarded Dismiss)
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
  isOpen?: boolean;
  dismissOnOutsideClick?: boolean;
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
    dismissOnOutsideClick = false,
    canDismiss,
    onOpenChange,
    children,
  }: Omit<AriaDialogProviderProps, 'defaultOpen' | 'isOpen'>) {
    const runtime = useDialogRuntime();
    const dispatch = Actions.useActionDispatch();
    const trigger = Refs.useRefController('trigger');
    const dialog = Refs.useRefController('dialog');
    const canDismissRef = useRef(canDismiss);
    const onOpenChangeRef = useRef(onOpenChange);
    canDismissRef.current = canDismiss;
    onOpenChangeRef.current = onOpenChange;

    const isOpen = useStorePath(runtime.store, ['isOpen']);

    useDismissLayer({
      isOpen,
      dismissOnEscape: true,
      dismissOnOutsidePointer: dismissOnOutsideClick,
      getContainers: () => [dialog.target, trigger.target],
      onDismiss: () => void dispatch('close'),
    });

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
    isOpen,
    dismissOnOutsideClick = false,
    canDismiss,
    onOpenChange,
    children,
  }: AriaDialogProviderProps) {
    const baseId = useId();
    const store = useStoreInstance<AriaDialogState>(
      () => ({ isOpen: isOpen ?? defaultOpen }),
      `${name}:${baseId}:Store`,
      { notificationMode: 'immediate' },
    );
    useControlledStoreSync(store, ['isOpen'], isOpen);

    const runtime = useMemo<AriaDialogRuntime>(
      () => ({
        dialogId: `${baseId}-dialog`,
        titleId: `${baseId}-title`,
        store,
      }),
      [baseId, store],
    );

    return (
      <Actions.Provider>
        <Refs.Provider>
          <DialogRuntimeContext.Provider value={runtime}>
            <DialogBridge
              dismissOnOutsideClick={dismissOnOutsideClick}
              canDismiss={canDismiss}
              onOpenChange={onOpenChange}
            >
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
    const isOpen = useStorePath(runtime.store, ['isOpen']);

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
    const isOpen = useStorePath(runtime.store, ['isOpen']);
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
// 5. createAriaComboBox (Virtual Focus aria-activedescendant + Fast Filter + Dismiss)
// =============================================================================

export interface AriaComboBoxItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface AriaComboBoxState {
  isOpen: boolean;
  query: string;
  selectedKey: string | null;
  highlightedKey: string | null;
}

interface AriaComboBoxActionMap {
  setQuery: { query: string };
  highlightOption: { key: string | null };
  setOpen: { isOpen: boolean };
  selectOption: { key: string };
}

interface AriaComboBoxRuntime {
  baseId: string;
  store: Store<AriaComboBoxState>;
  itemsRef: React.RefObject<readonly AriaComboBoxItem[]>;
  optionRefs: RefCollection<HTMLLIElement>;
  rovingFocus: RovingFocusController;
}

export interface AriaComboBoxProviderProps {
  items: readonly AriaComboBoxItem[];
  defaultSelectedKey?: string | null;
  selectedKey?: string | null;
  onSelectionChange?: (key: string | null) => void;
  children: React.ReactNode;
}

function getFilteredComboBoxItems(
  items: readonly AriaComboBoxItem[],
  query: string,
  selectedKey: string | null,
): readonly AriaComboBoxItem[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length === 0) return items;
  // If query matches selected item's exact label, show all options on re-open unless user edits text
  const selectedItem = selectedKey ? items.find(i => i.id === selectedKey) : undefined;
  if (selectedItem && selectedItem.label.toLowerCase() === trimmed) {
    return items;
  }
  return items.filter(item => item.label.toLowerCase().includes(trimmed));
}

export function createAriaComboBox(name: string) {
  const Actions = createActionContext<AriaComboBoxActionMap>(`${name}:Actions`, {
    actions: {
      setQuery: { lane: 'fast' },
      highlightOption: { lane: 'fast' },
      setOpen: { lane: 'orchestrated', queue: 'serial' },
      selectOption: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  const Refs = createRefContext(`${name}:Refs`, {
    input: {
      name: 'input',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLInputElement =>
        target instanceof HTMLInputElement,
    },
    trigger: {
      name: 'trigger',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLButtonElement =>
        target instanceof HTMLButtonElement,
    },
    listbox: {
      name: 'listbox',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLUListElement =>
        target instanceof HTMLUListElement,
    },
  });

  const ComboRuntimeContext = createContext<AriaComboBoxRuntime | null>(null);

  function useComboRuntime(): AriaComboBoxRuntime {
    const ctx = useContext(ComboRuntimeContext);
    if (!ctx) {
      throw new Error(`useComboRuntime(${name}) must be used within ${name}.Provider`);
    }
    return ctx;
  }

  function ComboBoxBridge({
    items,
    onSelectionChange,
    children,
  }: Omit<AriaComboBoxProviderProps, 'defaultSelectedKey' | 'selectedKey'>) {
    const runtime = useComboRuntime();
    const dispatch = Actions.useActionDispatch();
    const input = Refs.useRefController('input');
    const trigger = Refs.useRefController('trigger');
    const listbox = Refs.useRefController('listbox');
    const onSelectionChangeRef = useRef(onSelectionChange);
    onSelectionChangeRef.current = onSelectionChange;
    runtime.itemsRef.current = items;

    const isOpen = useStorePath(runtime.store, ['isOpen']);

    Actions.useActionCommandHandler(
      'setQuery',
      useCallback(
        payload => {
          const cur = runtime.store.getValue();
          const trimmed = payload.query.trim().toLowerCase();
          const filtered =
            trimmed.length === 0
              ? runtime.itemsRef.current
              : runtime.itemsRef.current.filter(item =>
                  item.label.toLowerCase().includes(trimmed),
                );
          const firstEnabled = filtered.find(item => !item.disabled)?.id ?? null;
          runtime.store.update(draft => {
            draft.query = payload.query;
            draft.isOpen = true;
            draft.highlightedKey = firstEnabled;
          });
          void cur;
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'highlightOption',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            draft.highlightedKey = payload.key;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'setOpen',
      useCallback(
        payload => {
          const cur = runtime.store.getValue();
          const filtered = getFilteredComboBoxItems(
            runtime.itemsRef.current,
            cur.query,
            cur.selectedKey,
          );
          const nextHighlight = payload.isOpen
            ? cur.selectedKey ?? filtered.find(item => !item.disabled)?.id ?? null
            : null;
          runtime.store.update(draft => {
            draft.isOpen = payload.isOpen;
            draft.highlightedKey = nextHighlight;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionGuard(
      'selectOption',
      useCallback(
        (payload, controller) => {
          const candidate = runtime.itemsRef.current.find(item => item.id === payload.key);
          if (!candidate || candidate.disabled) {
            controller.abort(`combobox option "${payload.key}" is disabled or missing`);
          }
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'selectOption',
      useCallback(
        payload => {
          const candidate = runtime.itemsRef.current.find(item => item.id === payload.key);
          runtime.store.update(draft => {
            draft.selectedKey = payload.key;
            draft.query = candidate?.label ?? '';
            draft.isOpen = false;
            draft.highlightedKey = null;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionObserver(
      'selectOption',
      useCallback(event => {
        onSelectionChangeRef.current?.(event.payload.key);
      }, []),
      { when: 'success' },
    );

    // Coordinated LIFO Escape + outside-pointer dismiss layer while listbox is open
    useDismissLayer({
      isOpen,
      dismissOnEscape: true,
      dismissOnOutsidePointer: true,
      getContainers: () => [input.target, trigger.target, listbox.target],
      onDismiss: () => void dispatch('setOpen', { isOpen: false }),
    });

    return <>{children}</>;
  }

  function Provider({
    items,
    defaultSelectedKey = null,
    selectedKey,
    onSelectionChange,
    children,
  }: AriaComboBoxProviderProps) {
    const baseId = useId();
    const initialKey = selectedKey !== undefined ? selectedKey : defaultSelectedKey;
    const initialLabel =
      (initialKey ? items.find(i => i.id === initialKey)?.label : '') ?? '';

    const itemsRef = useRef<readonly AriaComboBoxItem[]>(items);
    itemsRef.current = items;

    const store = useStoreInstance<AriaComboBoxState>(
      () => ({
        isOpen: false,
        query: initialLabel,
        selectedKey: initialKey,
        highlightedKey: null,
      }),
      `${name}:${baseId}:Store`,
      { notificationMode: 'immediate' },
    );
    useControlledStoreSync(store, ['selectedKey'], selectedKey, {
      onSync(draft, nextKey) {
        draft.query =
          (nextKey ? itemsRef.current.find(i => i.id === nextKey)?.label : '') ?? '';
      },
    });

    const optionRefs = useRefCollection<HTMLLIElement>();
    const rovingFocus = useRovingFocus({
      orientation: 'vertical',
      loop: true,
      getItems: () =>
        getFilteredComboBoxItems(
          itemsRef.current,
          store.getValue().query,
          store.getValue().selectedKey,
        ).map(item => ({
          id: item.id,
          label: item.label,
          disabled: item.disabled,
        })),
      getActiveId: () => store.getValue().highlightedKey,
      onFocusChange(nextKey) {
        store.update(draft => {
          draft.highlightedKey = nextKey;
        });
        optionRefs.executeIfMounted(nextKey, el => {
          el.scrollIntoView?.({ block: 'nearest' });
        });
      },
    });

    const runtime = useMemo<AriaComboBoxRuntime>(
      () => ({
        baseId,
        store,
        itemsRef,
        optionRefs,
        rovingFocus,
      }),
      [baseId, store, optionRefs, rovingFocus],
    );

    return (
      <Actions.Provider>
        <Refs.Provider>
          <ComboRuntimeContext.Provider value={runtime}>
            <ComboBoxBridge items={items} onSelectionChange={onSelectionChange}>
              {children}
            </ComboBoxBridge>
          </ComboRuntimeContext.Provider>
        </Refs.Provider>
      </Actions.Provider>
    );
  }

  function useComboBoxInput() {
    const runtime = useComboRuntime();
    const input = Refs.useRefController('input');
    const dispatch = Actions.useActionDispatch();

    const isOpen = useStorePath(runtime.store, ['isOpen']);
    const query = useStorePath(runtime.store, ['query']);
    const highlightedKey = useStorePath(runtime.store, ['highlightedKey']);

    return {
      isOpen,
      query,
      highlightedKey,
      inputProps: {
        id: `${runtime.baseId}-input`,
        ref: input.setRef,
        role: 'combobox' as const,
        type: 'text' as const,
        value: query,
        'aria-autocomplete': 'list' as const,
        'aria-expanded': isOpen,
        'aria-controls': `${runtime.baseId}-listbox`,
        'aria-activedescendant':
          isOpen && highlightedKey
            ? runtime.rovingFocus.getActiveDescendant(`${runtime.baseId}-option-`)
            : undefined,
        onChange(event: React.ChangeEvent<HTMLInputElement>) {
          void dispatch('setQuery', { query: event.target.value });
        },
        onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
          const cur = runtime.store.getValue();

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            if (!cur.isOpen) {
              event.preventDefault();
              void dispatch('setOpen', { isOpen: true });
              return;
            }
            runtime.rovingFocus.handleKeyDown(cur.highlightedKey, event);
            return;
          }

          if (event.key === 'Home' || event.key === 'End') {
            if (!cur.isOpen) return;
            runtime.rovingFocus.handleKeyDown(cur.highlightedKey, event);
            return;
          }

          if (event.key === 'Enter') {
            if (cur.isOpen && cur.highlightedKey) {
              event.preventDefault();
              void dispatch('selectOption', { key: cur.highlightedKey });
            } else if (!cur.isOpen) {
              event.preventDefault();
              void dispatch('setOpen', { isOpen: true });
            }
          }
        },
      },
    };
  }

  function useComboBoxTrigger() {
    const runtime = useComboRuntime();
    const trigger = Refs.useRefController('trigger');
    const input = Refs.useRefController('input');
    const dispatch = Actions.useActionDispatch();
    const isOpen = useStorePath(runtime.store, ['isOpen']);

    return {
      isOpen,
      triggerProps: {
        ref: trigger.setRef,
        type: 'button' as const,
        tabIndex: -1 as const,
        'aria-label': 'Toggle options',
        'aria-expanded': isOpen,
        'aria-controls': `${runtime.baseId}-listbox`,
        onClick() {
          void dispatch('setOpen', { isOpen: !isOpen });
          input.target?.focus();
        },
      },
    };
  }

  function useComboBoxListBox() {
    const runtime = useComboRuntime();
    const listbox = Refs.useRefController('listbox');
    const isOpen = useStorePath(runtime.store, ['isOpen']);
    const query = useStorePath(runtime.store, ['query']);
    const selectedKey = useStorePath(runtime.store, ['selectedKey']);

    const filteredItems = useMemo(
      () => getFilteredComboBoxItems(runtime.itemsRef.current, query, selectedKey),
      [query, runtime.itemsRef, selectedKey],
    );

    return {
      isOpen,
      filteredItems,
      listBoxProps: {
        id: `${runtime.baseId}-listbox`,
        ref: listbox.setRef,
        role: 'listbox' as const,
        hidden: !isOpen,
      },
    };
  }

  function useComboBoxOption(key: string) {
    const runtime = useComboRuntime();
    const dispatch = Actions.useActionDispatch();

    const isSelected = useStoreSelectorWithPaths<AriaComboBoxState, boolean>(
      runtime.store,
      s => s.selectedKey === key,
      { dependsOn: [['selectedKey']] },
    );
    const isHighlighted = useStoreSelectorWithPaths<AriaComboBoxState, boolean>(
      runtime.store,
      s => s.highlightedKey === key,
      { dependsOn: [['highlightedKey']] },
    );

    const item = runtime.itemsRef.current.find(candidate => candidate.id === key);
    const isDisabled = Boolean(item?.disabled);

    return {
      isSelected,
      isHighlighted,
      optionProps: {
        id: `${runtime.baseId}-option-${key}`,
        ref: runtime.optionRefs.setRef(key),
        role: 'option' as const,
        'aria-selected': isSelected,
        'aria-disabled': isDisabled ? true : undefined,
        'data-highlighted': isHighlighted ? 'true' : 'false',
        onPointerEnter() {
          if (!isDisabled) void dispatch('highlightOption', { key });
        },
        onPointerDown(event: React.PointerEvent<HTMLLIElement>) {
          // Keep DOM focus on the combobox input rather than blurring before selection commits.
          event.preventDefault();
        },
        onClick() {
          if (!isDisabled) void dispatch('selectOption', { key });
        },
      },
    };
  }

  function useComboBoxState() {
    const runtime = useComboRuntime();
    const selectedKey = useStorePath(runtime.store, ['selectedKey']);
    const isOpen = useStorePath(runtime.store, ['isOpen']);
    return { selectedKey, isOpen };
  }

  return {
    Provider,
    useComboBoxInput,
    useComboBoxTrigger,
    useComboBoxListBox,
    useComboBoxOption,
    useComboBoxState,
  };
}

// =============================================================================
// 6. createAriaDataGrid (O(1) selectedById Row Isolation + Shift Range + Sort + Vertical Roving Focus)
// =============================================================================

export interface AriaGridRowData {
  readonly id: string;
  readonly name: string;
  readonly score: number;
  readonly disabled?: boolean;
}

export interface AriaSortDescriptor {
  readonly column: 'name' | 'score';
  readonly direction: 'ascending' | 'descending';
}

interface AriaGridState {
  selectedById: Record<string, boolean | undefined>;
  lastSelectedId: string | null;
  focusedRowId: string | null;
  rowOrder: string[];
  sortDescriptor: AriaSortDescriptor | null;
}

interface AriaGridActionMap {
  hoverRow: { rowId: string | null };
  focusRow: { rowId: string };
  toggleRowSelect: { rowId: string; shiftKey?: boolean };
  selectAll: undefined;
  clearSelection: undefined;
  sortByColumn: { column: 'name' | 'score' };
}

interface AriaGridRuntime {
  baseId: string;
  store: Store<AriaGridState>;
  rowsByIdRef: React.RefObject<Map<string, AriaGridRowData>>;
  rowRefs: RefCollection<HTMLTableRowElement>;
  rovingFocus: RovingFocusController;
}

export interface AriaDataGridProviderProps {
  rows: readonly AriaGridRowData[];
  onSelectionChange?: (selectedIds: string[]) => void;
  onSortChange?: (descriptor: AriaSortDescriptor | null) => void;
  children: React.ReactNode;
}

export function createAriaDataGrid(name: string) {
  const Actions = createActionContext<AriaGridActionMap>(`${name}:Actions`, {
    actions: {
      hoverRow: { lane: 'fast' },
      focusRow: { lane: 'fast' },
      toggleRowSelect: { lane: 'orchestrated', queue: 'serial' },
      selectAll: { lane: 'orchestrated', queue: 'serial' },
      clearSelection: { lane: 'orchestrated', queue: 'serial' },
      sortByColumn: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  const Refs = createRefContext(`${name}:Refs`, {
    hoverIndicator: {
      name: 'hoverIndicator',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLSpanElement =>
        target instanceof HTMLSpanElement,
    },
  });

  const GridRuntimeContext = createContext<AriaGridRuntime | null>(null);

  function useGridRuntime(): AriaGridRuntime {
    const ctx = useContext(GridRuntimeContext);
    if (!ctx) {
      throw new Error(`useGridRuntime(${name}) must be used within ${name}.Provider`);
    }
    return ctx;
  }

  function GridBridge({
    rows,
    onSelectionChange,
    onSortChange,
    children,
  }: AriaDataGridProviderProps) {
    const runtime = useGridRuntime();
    const hoverIndicator = Refs.useRefController('hoverIndicator');
    const onSelRef = useRef(onSelectionChange);
    const onSortRef = useRef(onSortChange);
    onSelRef.current = onSelectionChange;
    onSortRef.current = onSortChange;

    const nextMap = new Map<string, AriaGridRowData>();
    for (const r of rows) nextMap.set(r.id, r);
    runtime.rowsByIdRef.current = nextMap;

    Actions.useActionCommandHandler(
      'hoverRow',
      useCallback(
        payload => {
          hoverIndicator.executeIfMounted(el => {
            el.dataset.hoverRow = payload.rowId ?? 'none';
            el.textContent = payload.rowId ? `Hovered: ${payload.rowId}` : 'Hover idle';
          });
        },
        [hoverIndicator],
      ),
    );

    Actions.useActionCommandHandler(
      'focusRow',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            draft.focusedRowId = payload.rowId;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionGuard(
      'toggleRowSelect',
      useCallback(
        (payload, controller) => {
          const row = runtime.rowsByIdRef.current.get(payload.rowId);
          if (!row || row.disabled) {
            controller.abort(`row "${payload.rowId}" is disabled or missing`);
          }
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'toggleRowSelect',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            if (payload.shiftKey && draft.lastSelectedId) {
              const startIdx = draft.rowOrder.indexOf(draft.lastSelectedId);
              const endIdx = draft.rowOrder.indexOf(payload.rowId);
              if (startIdx >= 0 && endIdx >= 0) {
                const lo = Math.min(startIdx, endIdx);
                const hi = Math.max(startIdx, endIdx);
                for (let i = lo; i <= hi; i += 1) {
                  const id = draft.rowOrder[i]!;
                  const candidate = runtime.rowsByIdRef.current.get(id);
                  if (candidate && !candidate.disabled) {
                    draft.selectedById[id] = true;
                  }
                }
                draft.lastSelectedId = payload.rowId;
                return;
              }
            }

            if (draft.selectedById[payload.rowId]) {
              delete draft.selectedById[payload.rowId];
            } else {
              draft.selectedById[payload.rowId] = true;
            }
            draft.lastSelectedId = payload.rowId;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'selectAll',
      useCallback(() => {
        runtime.store.update(draft => {
          for (const id of draft.rowOrder) {
            const candidate = runtime.rowsByIdRef.current.get(id);
            if (candidate && !candidate.disabled) {
              draft.selectedById[id] = true;
            }
          }
        });
      }, [runtime]),
    );

    Actions.useActionCommandHandler(
      'clearSelection',
      useCallback(() => {
        runtime.store.update(draft => {
          for (const key of Object.keys(draft.selectedById)) {
            delete draft.selectedById[key];
          }
          draft.lastSelectedId = null;
        });
      }, [runtime]),
    );

    Actions.useActionCommandHandler(
      'sortByColumn',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            const nextDir: 'ascending' | 'descending' =
              draft.sortDescriptor?.column === payload.column
              && draft.sortDescriptor.direction === 'ascending'
                ? 'descending'
                : 'ascending';
            draft.sortDescriptor = { column: payload.column, direction: nextDir };
            draft.rowOrder.sort((aId, bId) => {
              const a = runtime.rowsByIdRef.current.get(aId);
              const b = runtime.rowsByIdRef.current.get(bId);
              if (!a || !b) return 0;
              const cmp =
                payload.column === 'name'
                  ? a.name.localeCompare(b.name)
                  : a.score - b.score;
              return nextDir === 'ascending' ? cmp : -cmp;
            });
          });
        },
        [runtime],
      ),
    );

    const notifySelection = useCallback(() => {
      const selMap = runtime.store.getValue().selectedById;
      onSelRef.current?.(Object.keys(selMap).filter(id => selMap[id]));
    }, [runtime]);

    Actions.useActionObserver('toggleRowSelect', notifySelection, { when: 'success' });
    Actions.useActionObserver('selectAll', notifySelection, { when: 'success' });
    Actions.useActionObserver('clearSelection', notifySelection, { when: 'success' });
    Actions.useActionObserver(
      'sortByColumn',
      useCallback(() => {
        onSortRef.current?.(runtime.store.getValue().sortDescriptor);
      }, [runtime]),
      { when: 'success' },
    );

    return <>{children}</>;
  }

  function Provider({
    rows,
    onSelectionChange,
    onSortChange,
    children,
  }: AriaDataGridProviderProps) {
    const baseId = useId();
    const initialMap = new Map<string, AriaGridRowData>();
    for (const r of rows) initialMap.set(r.id, r);
    const rowsByIdRef = useRef(initialMap);
    rowsByIdRef.current = initialMap;

    const firstEnabled = rows.find(r => !r.disabled)?.id ?? null;

    const store = useStoreInstance<AriaGridState>(
      () => ({
        selectedById: {},
        lastSelectedId: null,
        focusedRowId: firstEnabled,
        rowOrder: rows.map(r => r.id),
        sortDescriptor: null,
      }),
      `${name}:${baseId}:Store`,
      { notificationMode: 'immediate' },
    );

    const rowRefs = useRefCollection<HTMLTableRowElement>();

    const rovingFocus = useRovingFocus({
      orientation: 'vertical',
      loop: false,
      getItems: () =>
        store.getValue().rowOrder.map(id => ({
          id,
          disabled: Boolean(rowsByIdRef.current.get(id)?.disabled),
        })),
      getActiveId: () => store.getValue().focusedRowId,
      onFocusChange(nextRowId) {
        store.update(draft => {
          draft.focusedRowId = nextRowId;
        });
        rowRefs.executeIfMounted(nextRowId, el => el.focus());
      },
    });

    const runtime = useMemo<AriaGridRuntime>(
      () => ({
        baseId,
        store,
        rowsByIdRef,
        rowRefs,
        rovingFocus,
      }),
      [baseId, store, rowRefs, rovingFocus],
    );

    return (
      <Actions.Provider>
        <Refs.Provider>
          <GridRuntimeContext.Provider value={runtime}>
            <GridBridge
              rows={rows}
              onSelectionChange={onSelectionChange}
              onSortChange={onSortChange}
            >
              {children}
            </GridBridge>
          </GridRuntimeContext.Provider>
        </Refs.Provider>
      </Actions.Provider>
    );
  }

  function useGrid() {
    const runtime = useGridRuntime();
    const dispatch = Actions.useActionDispatch();
    const rowOrder = useStorePath(runtime.store, ['rowOrder']);

    return {
      rowOrder,
      selectAll: () => void dispatch('selectAll'),
      clearSelection: () => void dispatch('clearSelection'),
      gridProps: {
        role: 'grid' as const,
        'aria-multiselectable': true as const,
        onKeyDown(event: React.KeyboardEvent<HTMLElement>) {
          const curId = runtime.store.getValue().focusedRowId;
          if (!curId) return;
          runtime.rovingFocus.handleKeyDown(curId, event);
        },
      },
    };
  }

  function useGridColumnHeader(column: 'name' | 'score') {
    const runtime = useGridRuntime();
    const dispatch = Actions.useActionDispatch();
    const sortDescriptor = useStorePath(runtime.store, ['sortDescriptor']);
    const ariaSort =
      sortDescriptor?.column === column ? sortDescriptor.direction : ('none' as const);

    return {
      ariaSort,
      columnHeaderProps: {
        role: 'columnheader' as const,
        'aria-sort': ariaSort,
        onClick() {
          void dispatch('sortByColumn', { column });
        },
      },
    };
  }

  function useGridRow(rowId: string) {
    const runtime = useGridRuntime();
    const dispatch = Actions.useActionDispatch();

    // Exact path subscription: toggling row-3 re-renders ONLY row-3 (`O(1)` path precision).
    const isSelected = Boolean(useStorePath(runtime.store, ['selectedById', rowId]));
    const isFocused = useStoreSelectorWithPaths<AriaGridState, boolean>(
      runtime.store,
      s => s.focusedRowId === rowId,
      { dependsOn: [['focusedRowId']] },
    );

    const row = runtime.rowsByIdRef.current.get(rowId);
    const isDisabled = Boolean(row?.disabled);

    return {
      row,
      isSelected,
      isFocused,
      rowProps: {
        ref: runtime.rowRefs.setRef(rowId),
        role: 'row' as const,
        tabIndex: isDisabled ? -1 : isFocused ? 0 : -1,
        'aria-selected': isSelected,
        'aria-disabled': isDisabled ? true : undefined,
        onFocus() {
          if (!isDisabled) void dispatch('focusRow', { rowId });
        },
        onPointerEnter() {
          void dispatch('hoverRow', { rowId });
        },
        onClick(event: React.MouseEvent<HTMLTableRowElement>) {
          if (isDisabled) return;
          void dispatch('toggleRowSelect', { rowId, shiftKey: event.shiftKey });
        },
      },
    };
  }

  function useGridHoverBadge() {
    const hoverIndicator = Refs.useRefController('hoverIndicator');
    return { setRef: hoverIndicator.setRef };
  }

  return {
    Provider,
    useGrid,
    useGridColumnHeader,
    useGridRow,
    useGridHoverBadge,
    useGridDispatch: Actions.useActionDispatch,
  };
}

// =============================================================================
// 7. createAriaMenu (Typeahead Roving Focus + Dismiss Layer + Trigger Restore)
// =============================================================================

export interface AriaMenuItem {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

interface AriaMenuState {
  isOpen: boolean;
  activeItemId: string | null;
}

interface AriaMenuActionMap {
  open: { focusTarget?: 'first' | 'last' } | void;
  close: void;
  focusItem: { id: string };
  activateItem: { id: string };
}

interface AriaMenuRuntime {
  baseId: string;
  store: Store<AriaMenuState>;
  itemsRef: React.RefObject<readonly AriaMenuItem[]>;
  itemRefs: RefCollection<HTMLButtonElement>;
  rovingFocus: RovingFocusController;
}

export interface AriaMenuProviderProps {
  items: readonly AriaMenuItem[];
  onAction?: (id: string) => void;
  children: React.ReactNode;
}

export function createAriaMenu(name: string) {
  const Actions = createActionContext<AriaMenuActionMap>(`${name}:Actions`, {
    actions: {
      open: { lane: 'orchestrated', queue: 'serial' },
      close: { lane: 'orchestrated', queue: 'serial' },
      focusItem: { lane: 'fast' },
      activateItem: { lane: 'orchestrated', queue: 'serial' },
    },
  });

  const Refs = createRefContext(`${name}:Refs`, {
    trigger: {
      name: 'trigger',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLButtonElement =>
        target instanceof HTMLButtonElement,
    },
    menu: {
      name: 'menu',
      autoCleanup: true,
      validator: (target: unknown): target is HTMLDivElement =>
        target instanceof HTMLDivElement,
    },
  });

  const MenuRuntimeContext = createContext<AriaMenuRuntime | null>(null);

  function useMenuRuntime(): AriaMenuRuntime {
    const ctx = useContext(MenuRuntimeContext);
    if (!ctx) {
      throw new Error(`useMenuRuntime(${name}) must be used within ${name}.Provider`);
    }
    return ctx;
  }

  function MenuBridge({
    items,
    onAction,
    children,
  }: AriaMenuProviderProps) {
    const runtime = useMenuRuntime();
    const dispatch = Actions.useActionDispatch();
    const trigger = Refs.useRefController('trigger');
    const menu = Refs.useRefController('menu');
    const onActionRef = useRef(onAction);
    onActionRef.current = onAction;
    runtime.itemsRef.current = items;

    const isOpen = useStorePath(runtime.store, ['isOpen']);
    const prevOpenRef = useRef(isOpen);

    useDismissLayer({
      isOpen,
      dismissOnEscape: true,
      dismissOnOutsidePointer: true,
      getContainers: () => [trigger.target, menu.target],
      onDismiss: () => void dispatch('close'),
    });

    useEffect(() => {
      const wasOpen = prevOpenRef.current;
      prevOpenRef.current = isOpen;

      if (!wasOpen && isOpen) {
        const activeId = runtime.store.getValue().activeItemId;
        if (activeId) {
          runtime.itemRefs.executeIfMounted(activeId, el => el.focus());
        }
      } else if (wasOpen && !isOpen) {
        runtime.rovingFocus.resetTypeahead();
        trigger.target?.focus();
      }
    }, [isOpen, runtime, trigger]);

    Actions.useActionCommandHandler(
      'open',
      useCallback(
        payload => {
          const enabled = runtime.itemsRef.current.filter(item => !item.disabled);
          const target =
            payload && payload.focusTarget === 'last'
              ? enabled[enabled.length - 1]?.id ?? null
              : enabled[0]?.id ?? null;
          runtime.store.update(draft => {
            draft.isOpen = true;
            draft.activeItemId = target;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'close',
      useCallback(() => {
        runtime.store.update(draft => {
          draft.isOpen = false;
          draft.activeItemId = null;
        });
      }, [runtime]),
    );

    Actions.useActionCommandHandler(
      'focusItem',
      useCallback(
        payload => {
          runtime.store.update(draft => {
            draft.activeItemId = payload.id;
          });
        },
        [runtime],
      ),
    );

    Actions.useActionGuard(
      'activateItem',
      useCallback(
        (payload, controller) => {
          const candidate = runtime.itemsRef.current.find(item => item.id === payload.id);
          if (!candidate || candidate.disabled) {
            controller.abort(`menu item "${payload.id}" is disabled or missing`);
          }
        },
        [runtime],
      ),
    );

    Actions.useActionCommandHandler(
      'activateItem',
      useCallback(() => {
        runtime.store.update(draft => {
          draft.isOpen = false;
          draft.activeItemId = null;
        });
      }, [runtime]),
    );

    Actions.useActionObserver(
      'activateItem',
      useCallback(event => {
        onActionRef.current?.(event.payload.id);
      }, []),
      { when: 'success' },
    );

    return <>{children}</>;
  }

  function Provider({ items, onAction, children }: AriaMenuProviderProps) {
    const baseId = useId();
    const itemsRef = useRef<readonly AriaMenuItem[]>(items);
    itemsRef.current = items;

    const store = useStoreInstance<AriaMenuState>(
      () => ({
        isOpen: false,
        activeItemId: null,
      }),
      `${name}:${baseId}:Store`,
      { notificationMode: 'immediate' },
    );

    const itemRefs = useRefCollection<HTMLButtonElement>();

    const rovingFocus = useRovingFocus({
      orientation: 'vertical',
      loop: true,
      typeahead: true,
      getItems: () => itemsRef.current,
      getActiveId: () => store.getValue().activeItemId,
      onFocusChange(nextId) {
        store.update(draft => {
          draft.activeItemId = nextId;
        });
        itemRefs.executeIfMounted(nextId, el => el.focus());
      },
    });

    const runtime = useMemo<AriaMenuRuntime>(
      () => ({
        baseId,
        store,
        itemsRef,
        itemRefs,
        rovingFocus,
      }),
      [baseId, store, itemRefs, rovingFocus],
    );

    return (
      <Actions.Provider>
        <Refs.Provider>
          <MenuRuntimeContext.Provider value={runtime}>
            <MenuBridge items={items} onAction={onAction}>
              {children}
            </MenuBridge>
          </MenuRuntimeContext.Provider>
        </Refs.Provider>
      </Actions.Provider>
    );
  }

  function useMenuTrigger() {
    const runtime = useMenuRuntime();
    const trigger = Refs.useRefController('trigger');
    const dispatch = Actions.useActionDispatch();
    const isOpen = useStorePath(runtime.store, ['isOpen']);

    return {
      isOpen,
      triggerProps: {
        id: `${runtime.baseId}-trigger`,
        ref: trigger.setRef,
        type: 'button' as const,
        'aria-haspopup': 'menu' as const,
        'aria-expanded': isOpen,
        'aria-controls': `${runtime.baseId}-menu`,
        onClick() {
          void dispatch(isOpen ? 'close' : 'open');
        },
        onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            void dispatch('open', {
              focusTarget: event.key === 'ArrowUp' ? 'last' : 'first',
            });
          }
        },
      },
    };
  }

  function useMenu() {
    const runtime = useMenuRuntime();
    const menu = Refs.useRefController('menu');
    const isOpen = useStorePath(runtime.store, ['isOpen']);

    return {
      isOpen,
      menuProps: {
        id: `${runtime.baseId}-menu`,
        ref: menu.setRef,
        role: 'menu' as const,
        'aria-orientation': 'vertical' as const,
        'aria-labelledby': `${runtime.baseId}-trigger`,
        hidden: !isOpen,
        onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
          const curId = runtime.store.getValue().activeItemId;
          runtime.rovingFocus.handleKeyDown(curId, event);
        },
      },
    };
  }

  function useMenuItem(id: string) {
    const runtime = useMenuRuntime();
    const dispatch = Actions.useActionDispatch();
    const isFocused = useStoreSelectorWithPaths<AriaMenuState, boolean>(
      runtime.store,
      s => s.activeItemId === id,
      { dependsOn: [['activeItemId']] },
    );

    const item = runtime.itemsRef.current.find(candidate => candidate.id === id);
    const isDisabled = Boolean(item?.disabled);

    return {
      isFocused,
      isDisabled,
      menuItemProps: {
        id: `${runtime.baseId}-menuitem-${id}`,
        ref: runtime.itemRefs.setRef(id),
        role: 'menuitem' as const,
        type: 'button' as const,
        tabIndex: isFocused ? 0 : -1,
        'aria-disabled': isDisabled ? true : undefined,
        onFocus() {
          if (!isDisabled) void dispatch('focusItem', { id });
        },
        onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            event.stopPropagation();
            if (!isDisabled) void dispatch('activateItem', { id });
          }
        },
        onClick() {
          if (!isDisabled) void dispatch('activateItem', { id });
        },
      },
    };
  }

  function useMenuState() {
    const runtime = useMenuRuntime();
    const isOpen = useStorePath(runtime.store, ['isOpen']);
    const activeItemId = useStorePath(runtime.store, ['activeItemId']);
    return { isOpen, activeItemId };
  }

  return {
    Provider,
    useMenuTrigger,
    useMenu,
    useMenuItem,
    useMenuState,
  };
}

// =============================================================================
// 8. Combined Showcase Component
// =============================================================================

const DemoMenu = createAriaMenu('ShowcaseAriaMenu');

const DemoTabs = createAriaTabs('ShowcaseAriaTabs');
const DemoSlider = createAriaSlider('ShowcaseAriaSlider');
const DemoDialog = createAriaDialog('ShowcaseAriaDialog');
const DemoComboBox = createAriaComboBox('ShowcaseAriaComboBox');
const DemoGrid = createAriaDataGrid('ShowcaseAriaDataGrid');

function ShowcaseButton() {
  const [pressCount, setPressCount] = useState(0);
  const { buttonProps, isPressed } = useAriaButton({
    onPress: () => setPressCount(c => c + 1),
  });
  const merged = mergeProps(buttonProps, {
    className: 'demo-aria-btn',
  });
  return (
    <button {...merged}>
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

function ShowcaseComboOption({ item }: { item: AriaComboBoxItem }) {
  const { optionProps } = DemoComboBox.useComboBoxOption(item.id);
  return <li {...optionProps}>{item.label}</li>;
}

function ShowcaseComboBoxContent() {
  const { inputProps } = DemoComboBox.useComboBoxInput();
  const { triggerProps } = DemoComboBox.useComboBoxTrigger();
  const { listBoxProps, filteredItems } = DemoComboBox.useComboBoxListBox();

  return (
    <div>
      <input {...inputProps} placeholder="Search framework..." />
      <button {...triggerProps}>v</button>
      <ul {...listBoxProps}>
        {filteredItems.map(item => (
          <ShowcaseComboOption key={item.id} item={item} />
        ))}
      </ul>
    </div>
  );
}

function ShowcaseGridRow({ rowId }: { rowId: string }) {
  const { row, rowProps, isSelected } = DemoGrid.useGridRow(rowId);
  if (!row) return null;
  return (
    <tr {...rowProps}>
      <td>{isSelected ? '[x]' : '[ ]'}</td>
      <td>{row.name}</td>
      <td>{row.score}</td>
    </tr>
  );
}

function ShowcaseDataGridContent() {
  const { rowOrder, gridProps, selectAll, clearSelection } = DemoGrid.useGrid();
  const nameHeader = DemoGrid.useGridColumnHeader('name');
  const scoreHeader = DemoGrid.useGridColumnHeader('score');
  const hoverBadge = DemoGrid.useGridHoverBadge();

  return (
    <div>
      <span ref={hoverBadge.setRef}>Hover idle</span>
      <button type="button" onClick={selectAll}>
        Select All
      </button>
      <button type="button" onClick={clearSelection}>
        Clear
      </button>
      <table {...gridProps}>
        <thead>
          <tr>
            <th>Sel</th>
            <th {...nameHeader.columnHeaderProps}>Name</th>
            <th {...scoreHeader.columnHeaderProps}>Score</th>
          </tr>
        </thead>
        <tbody>
          {rowOrder.map(id => (
            <ShowcaseGridRow key={id} rowId={id} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShowcaseMenuItem({ item }: { item: AriaMenuItem }) {
  const { menuItemProps } = DemoMenu.useMenuItem(item.id);
  return <button {...menuItemProps}>{item.label}</button>;
}

function ShowcaseMenuContent({ items }: { items: readonly AriaMenuItem[] }) {
  const { triggerProps } = DemoMenu.useMenuTrigger();
  const { menuProps } = DemoMenu.useMenu();

  return (
    <div>
      <button {...triggerProps}>Actions Menu</button>
      <div {...menuProps}>
        {items.map(item => (
          <ShowcaseMenuItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export function AriaHeadlessShowcase() {
  const tabItems: readonly AriaTabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'telemetry', label: 'Telemetry' },
  ];
  const comboItems: readonly AriaComboBoxItem[] = [
    { id: 'react', label: 'React 19' },
    { id: 'lit', label: 'Lit 3' },
    { id: 'preact', label: 'Preact Signals' },
  ];
  const gridRows: readonly AriaGridRowData[] = [
    { id: 'r1', name: 'Alpha', score: 95 },
    { id: 'r2', name: 'Beta', score: 82 },
  ];
  const menuItems: readonly AriaMenuItem[] = [
    { id: 'save', label: 'Save' },
    { id: 'share', label: 'Share' },
    { id: 'delete', label: 'Delete', disabled: true },
  ];

  return (
    <div style={{ display: 'grid', gap: 16, padding: 16, fontFamily: 'system-ui, sans-serif' }}>
      <h3>React Aria-Style Headless Primitives on Context-Action</h3>
      <ShowcaseButton />
      <DemoTabs.Provider items={tabItems}>
        <ShowcaseTabsContent />
      </DemoTabs.Provider>
      <DemoSlider.Provider min={0} max={100} step={5} defaultValue={25}>
        <ShowcaseSliderContent />
      </DemoSlider.Provider>
      <DemoDialog.Provider>
        <ShowcaseDialogContent />
      </DemoDialog.Provider>
      <DemoComboBox.Provider items={comboItems}>
        <ShowcaseComboBoxContent />
      </DemoComboBox.Provider>
      <DemoGrid.Provider rows={gridRows}>
        <ShowcaseDataGridContent />
      </DemoGrid.Provider>
      <DemoMenu.Provider items={menuItems}>
        <ShowcaseMenuContent items={menuItems} />
      </DemoMenu.Provider>
    </div>
  );
}

export default AriaHeadlessShowcase;
