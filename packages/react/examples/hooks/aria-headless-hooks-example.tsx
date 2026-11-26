/**
 * @fileoverview React Aria-Style Headless Hook Primitives Built on Ergonomic Context-Action APIs
 *
 * Implements 7 React Aria-style headless UI primitives using 2 public `@context-action/react` entrypoints:
 * 1. `useAriaButton` - StrictMode-safe `useSyncActionPipeline` + `mergeProps`
 * 2. `createAriaTabs` - `createScopedContext` + `useStoreInstance` + `useControlledStoreSync` + `useStorePath(..., { select })`
 * 3. `createAriaSlider` - `createScopedContext` + `useRefRegistry` + `usePointerGesture` + `lane: 'fast'` 0-render drag
 * 4. `createAriaDialog` - `createScopedContext` + `useRefRegistry` + LIFO `useDismissLayer` + guarded dismissal + focus restoration
 * 5. `createAriaComboBox` - `createScopedContext` + `useRefRegistry` + Virtual `useRovingFocus` (`getActiveDescendant`) + `onSync`
 * 6. `createAriaDataGrid` - `createScopedContext` + `useRefRegistry` + `selectedById` `O(depth)` `useStorePath` + vertical `useRovingFocus`
 * 7. `createAriaMenu` - `createScopedContext` + `useRefRegistry` + typeahead `useRovingFocus` + LIFO `useDismissLayer`
 */

import type React from 'react';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  createActionContext,
  createScopedContext,
  useStorePath,
  type Store,
} from '@context-action/react';
import {
  mergeProps,
  useControlledStoreSync,
  useDismissLayer,
  usePointerGesture,
  useRefCollection,
  useRefRegistry,
  useRovingFocus,
  useStoreInstance,
  useSyncActionPipeline,
  type RefCollection,
  type RefRegistry,
  type RovingFocusController,
} from '@context-action/react/advanced';

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
// 2. createAriaTabs (Scoped Context + Controlled Sync + Roving Focus)
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

  const Scope = createScopedContext(
    name,
    Actions,
    ({
      items,
      defaultSelectedId,
      selectedId,
      canSelect,
      onSelect,
    }: Omit<AriaTabsProviderProps, 'children'>) => {
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

      Actions.useActionGuard('selectTab', (payload, controller) => {
        const targetItem = itemsRef.current.find(item => item.id === payload.id);
        if (!targetItem || targetItem.disabled) {
          controller.abort(`tab "${payload.id}" is disabled or missing`);
          return;
        }
        if (canSelect && !canSelect(payload.id)) {
          controller.abort(`tab "${payload.id}" selection blocked by policy`);
        }
      });

      Actions.useActionCommandHandler('focusTab', payload => {
        store.update(draft => {
          draft.focusedId = payload.id;
        });
      });

      Actions.useActionCommandHandler('selectTab', payload => {
        store.update(draft => {
          draft.selectedId = payload.id;
          draft.focusedId = payload.id;
        });
      });

      Actions.useActionObserver(
        'selectTab',
        event => {
          onSelect?.(event.payload.id);
        },
        { when: 'success' },
      );

      return { baseId, store, itemsRef, itemRefs, rovingFocus };
    },
  );

  function useTabList() {
    const runtime = Scope.useScope();
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
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();

    const isSelected = useStorePath(runtime.store, ['selectedId'], {
      select: selected => selected === id,
    });
    const isFocused = useStorePath(runtime.store, ['focusedId'], {
      select: focused => focused === id,
    });

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
    const runtime = Scope.useScope();
    const isSelected = useStorePath(runtime.store, ['selectedId'], {
      select: selected => selected === id,
    });

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
    Provider: Scope.Provider,
    useTabList,
    useTab,
    useTabPanel,
    useTabsActionDispatch: Scope.useActionDispatch,
  };
}

// =============================================================================
// 3. createAriaSlider (usePointerGesture + useRefRegistry Fast-Lane + Sync)
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

  const Scope = createScopedContext(
    name,
    Actions,
    ({
      min = 0,
      max = 100,
      step = 1,
      defaultValue = min,
      value,
      onChangeEnd,
    }: Omit<AriaSliderProviderProps, 'children'>) => {
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

      const refs = useRefRegistry<{
        track: HTMLDivElement;
        thumb: HTMLDivElement;
      }>();

      const syncThumbDom = useCallback(
        (nextValue: number) => {
          const { min: cfgMin, max: cfgMax } = configRef.current;
          const pct = cfgMax === cfgMin ? 0 : ((nextValue - cfgMin) / (cfgMax - cfgMin)) * 100;
          refs.executeIfMounted('thumb', el => {
            el.style.left = `${pct}%`;
            el.setAttribute('aria-valuenow', String(nextValue));
            el.dataset.previewValue = String(nextValue);
          });
        },
        [refs],
      );

      const computeValueFromClientX = useCallback(
        (clientX: number) => {
          if (!Number.isFinite(clientX)) return store.getValue().value;
          const { min: cfgMin, max: cfgMax, step: cfgStep } = configRef.current;
          const trackEl = refs.get('track');
          if (!trackEl) return store.getValue().value;
          const rect = trackEl.getBoundingClientRect();
          if (rect.width <= 0) return store.getValue().value;
          const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
          return clampAndStep(cfgMin + ratio * (cfgMax - cfgMin), cfgMin, cfgMax, cfgStep);
        },
        [refs, store],
      );

      Actions.useActionCommandHandler('previewDrag', payload => {
        syncThumbDom(payload.value);
      });

      Actions.useActionGuard('commitValue', (payload, controller) => {
        const { min: cfgMin, max: cfgMax, step: cfgStep } = configRef.current;
        const normalized = clampAndStep(payload.value, cfgMin, cfgMax, cfgStep);
        if (normalized !== payload.value) {
          controller.modifyPayload(() => ({ value: normalized }));
        }
      });

      Actions.useActionCommandHandler('commitValue', payload => {
        store.update(draft => {
          draft.value = payload.value;
        });
        syncThumbDom(payload.value);
      });

      Actions.useActionObserver(
        'commitValue',
        event => {
          onChangeEnd?.(event.payload.value);
        },
        { when: 'success' },
      );

      return { store, refs, configRef, computeValueFromClientX };
    },
  );

  function useSliderTrack() {
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();

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
          ref: runtime.refs.setRef('track'),
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
      [gesture, runtime],
    );
  }

  function useSliderThumb() {
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
    const committedValue = useStorePath(runtime.store, ['value']);
    const { min, max } = runtime.configRef.current;
    const pct = max === min ? 0 : ((committedValue - min) / (max - min)) * 100;

    return {
      value: committedValue,
      thumbProps: {
        ref: runtime.refs.setRef('thumb'),
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
    const runtime = Scope.useScope();
    return useStorePath(runtime.store, ['value']);
  }

  return {
    Provider: Scope.Provider,
    useSliderTrack,
    useSliderThumb,
    useSliderValue,
  };
}

// =============================================================================
// 4. createAriaDialog (Scoped Context + LIFO Dismiss + Guarded Close)
// =============================================================================

interface AriaDialogState {
  isOpen: boolean;
}

interface AriaDialogActionMap {
  open: undefined;
  close: undefined;
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

  const Scope = createScopedContext(
    name,
    Actions,
    ({
      defaultOpen = false,
      isOpen,
      dismissOnOutsideClick = false,
      canDismiss,
      onOpenChange,
    }: Omit<AriaDialogProviderProps, 'children'>) => {
      const baseId = useId();
      const store = useStoreInstance<AriaDialogState>(
        () => ({ isOpen: isOpen ?? defaultOpen }),
        `${name}:${baseId}:Store`,
        { notificationMode: 'immediate' },
      );
      useControlledStoreSync(store, ['isOpen'], isOpen);

      const refs = useRefRegistry<{
        trigger: HTMLButtonElement;
        dialog: HTMLDivElement;
      }>();
      const dispatch = Actions.useActionDispatch();
      const openState = useStorePath(store, ['isOpen']);

      useDismissLayer({
        isOpen: openState,
        dismissOnEscape: true,
        dismissOnOutsidePointer: dismissOnOutsideClick,
        getContainers: () => [refs.get('dialog'), refs.get('trigger')],
        onDismiss: () => void dispatch('close'),
      });

      Actions.useActionCommandHandler('open', () => {
        store.update(draft => {
          draft.isOpen = true;
        });
      });

      Actions.useActionGuard('close', (_payload, controller) => {
        if (canDismiss && !canDismiss()) {
          controller.abort('dismiss blocked by policy');
        }
      });

      Actions.useActionCommandHandler('close', () => {
        store.update(draft => {
          draft.isOpen = false;
        });
      });

      Actions.useActionObserver(
        'open',
        () => {
          onOpenChange?.(true);
        },
        { when: 'success' },
      );

      Actions.useActionObserver(
        'close',
        () => {
          onOpenChange?.(false);
        },
        { when: 'success' },
      );

      return {
        dialogId: `${baseId}-dialog`,
        titleId: `${baseId}-title`,
        store,
        refs,
      };
    },
  );

  function useDialogTrigger() {
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
    const isOpen = useStorePath(runtime.store, ['isOpen']);

    return {
      isOpen,
      triggerProps: {
        ref: runtime.refs.setRef('trigger'),
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
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
    const isOpen = useStorePath(runtime.store, ['isOpen']);
    const prevOpenRef = useRef(isOpen);

    useEffect(() => {
      const wasOpen = prevOpenRef.current;
      prevOpenRef.current = isOpen;
      if (!wasOpen && isOpen) {
        runtime.refs.get('dialog')?.focus();
      } else if (wasOpen && !isOpen) {
        runtime.refs.get('trigger')?.focus();
      }
    }, [isOpen, runtime.refs]);

    return {
      isOpen,
      close: () => void dispatch('close'),
      titleProps: {
        id: runtime.titleId,
      },
      dialogProps: {
        id: runtime.dialogId,
        ref: runtime.refs.setRef('dialog'),
        role: 'dialog' as const,
        'aria-modal': true as const,
        'aria-labelledby': runtime.titleId,
        tabIndex: -1 as const,
        hidden: !isOpen,
      },
    };
  }

  return {
    Provider: Scope.Provider,
    useDialogTrigger,
    useDialog,
  };
}

// =============================================================================
// 5. createAriaComboBox (Virtual aria-activedescendant + Fast Filter + Dismiss)
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

  const Scope = createScopedContext(
    name,
    Actions,
    ({
      items,
      defaultSelectedKey = null,
      selectedKey,
      onSelectionChange,
    }: Omit<AriaComboBoxProviderProps, 'children'>) => {
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

      const refs = useRefRegistry<{
        input: HTMLInputElement;
        trigger: HTMLButtonElement;
        listbox: HTMLUListElement;
      }>();
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

      const dispatch = Actions.useActionDispatch();
      const isOpen = useStorePath(store, ['isOpen']);

      Actions.useActionCommandHandler('setQuery', payload => {
        const trimmed = payload.query.trim().toLowerCase();
        const filtered =
          trimmed.length === 0
            ? itemsRef.current
            : itemsRef.current.filter(item =>
                item.label.toLowerCase().includes(trimmed),
              );
        const firstEnabled = filtered.find(item => !item.disabled)?.id ?? null;
        store.update(draft => {
          draft.query = payload.query;
          draft.isOpen = true;
          draft.highlightedKey = firstEnabled;
        });
      });

      Actions.useActionCommandHandler('highlightOption', payload => {
        store.update(draft => {
          draft.highlightedKey = payload.key;
        });
      });

      Actions.useActionCommandHandler('setOpen', payload => {
        const cur = store.getValue();
        const filtered = getFilteredComboBoxItems(
          itemsRef.current,
          cur.query,
          cur.selectedKey,
        );
        const nextHighlight = payload.isOpen
          ? cur.selectedKey ?? filtered.find(item => !item.disabled)?.id ?? null
          : null;
        store.update(draft => {
          draft.isOpen = payload.isOpen;
          draft.highlightedKey = nextHighlight;
        });
      });

      Actions.useActionGuard('selectOption', (payload, controller) => {
        const candidate = itemsRef.current.find(item => item.id === payload.key);
        if (!candidate || candidate.disabled) {
          controller.abort(`combobox option "${payload.key}" is disabled or missing`);
        }
      });

      Actions.useActionCommandHandler('selectOption', payload => {
        const candidate = itemsRef.current.find(item => item.id === payload.key);
        store.update(draft => {
          draft.selectedKey = payload.key;
          draft.query = candidate?.label ?? '';
          draft.isOpen = false;
          draft.highlightedKey = null;
        });
      });

      Actions.useActionObserver(
        'selectOption',
        event => {
          onSelectionChange?.(event.payload.key);
        },
        { when: 'success' },
      );

      // Coordinated LIFO Escape + outside-pointer dismiss layer while listbox is open
      useDismissLayer({
        isOpen,
        dismissOnEscape: true,
        dismissOnOutsidePointer: true,
        getContainers: () => [
          refs.get('input'),
          refs.get('trigger'),
          refs.get('listbox'),
        ],
        onDismiss: () => void dispatch('setOpen', { isOpen: false }),
      });

      return { baseId, store, itemsRef, refs, optionRefs, rovingFocus };
    },
  );

  function useComboBoxInput() {
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();

    const isOpen = useStorePath(runtime.store, ['isOpen']);
    const query = useStorePath(runtime.store, ['query']);
    const highlightedKey = useStorePath(runtime.store, ['highlightedKey']);

    return {
      isOpen,
      query,
      highlightedKey,
      inputProps: {
        id: `${runtime.baseId}-input`,
        ref: runtime.refs.setRef('input'),
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
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
    const isOpen = useStorePath(runtime.store, ['isOpen']);

    return {
      isOpen,
      triggerProps: {
        ref: runtime.refs.setRef('trigger'),
        type: 'button' as const,
        tabIndex: -1 as const,
        'aria-label': 'Toggle options',
        'aria-expanded': isOpen,
        'aria-controls': `${runtime.baseId}-listbox`,
        onClick() {
          void dispatch('setOpen', { isOpen: !isOpen });
          runtime.refs.get('input')?.focus();
        },
      },
    };
  }

  function useComboBoxListBox() {
    const runtime = Scope.useScope();
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
        ref: runtime.refs.setRef('listbox'),
        role: 'listbox' as const,
        hidden: !isOpen,
      },
    };
  }

  function useComboBoxOption(key: string) {
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();

    const isSelected = useStorePath(runtime.store, ['selectedKey'], {
      select: selected => selected === key,
    });
    const isHighlighted = useStorePath(runtime.store, ['highlightedKey'], {
      select: highlighted => highlighted === key,
    });

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
    const runtime = Scope.useScope();
    const selectedKey = useStorePath(runtime.store, ['selectedKey']);
    const isOpen = useStorePath(runtime.store, ['isOpen']);
    return { selectedKey, isOpen };
  }

  return {
    Provider: Scope.Provider,
    useComboBoxInput,
    useComboBoxTrigger,
    useComboBoxListBox,
    useComboBoxOption,
    useComboBoxState,
  };
}

// =============================================================================
// 6. createAriaDataGrid (O(1) selectedById Row Isolation + Shift Range + Sort)
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

  const Scope = createScopedContext(
    name,
    Actions,
    ({
      rows,
      onSelectionChange,
      onSortChange,
    }: Omit<AriaDataGridProviderProps, 'children'>) => {
      const baseId = useId();
      const rowMap = new Map<string, AriaGridRowData>();
      for (const r of rows) rowMap.set(r.id, r);
      const rowsByIdRef = useRef(rowMap);
      rowsByIdRef.current = rowMap;

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

      const refs = useRefRegistry<{ hoverIndicator: HTMLSpanElement }>();
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

      Actions.useActionCommandHandler('hoverRow', payload => {
        refs.executeIfMounted('hoverIndicator', el => {
          el.dataset.hoverRow = payload.rowId ?? 'none';
          el.textContent = payload.rowId ? `Hovered: ${payload.rowId}` : 'Hover idle';
        });
      });

      Actions.useActionCommandHandler('focusRow', payload => {
        store.update(draft => {
          draft.focusedRowId = payload.rowId;
        });
      });

      Actions.useActionGuard('toggleRowSelect', (payload, controller) => {
        const row = rowsByIdRef.current.get(payload.rowId);
        if (!row || row.disabled) {
          controller.abort(`row "${payload.rowId}" is disabled or missing`);
        }
      });

      Actions.useActionCommandHandler('toggleRowSelect', payload => {
        store.update(draft => {
          if (payload.shiftKey && draft.lastSelectedId) {
            const startIdx = draft.rowOrder.indexOf(draft.lastSelectedId);
            const endIdx = draft.rowOrder.indexOf(payload.rowId);
            if (startIdx >= 0 && endIdx >= 0) {
              const lo = Math.min(startIdx, endIdx);
              const hi = Math.max(startIdx, endIdx);
              for (let i = lo; i <= hi; i += 1) {
                const id = draft.rowOrder[i]!;
                const candidate = rowsByIdRef.current.get(id);
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
      });

      Actions.useActionCommandHandler('selectAll', () => {
        store.update(draft => {
          for (const id of draft.rowOrder) {
            const candidate = rowsByIdRef.current.get(id);
            if (candidate && !candidate.disabled) {
              draft.selectedById[id] = true;
            }
          }
        });
      });

      Actions.useActionCommandHandler('clearSelection', () => {
        store.update(draft => {
          for (const key of Object.keys(draft.selectedById)) {
            delete draft.selectedById[key];
          }
          draft.lastSelectedId = null;
        });
      });

      Actions.useActionCommandHandler('sortByColumn', payload => {
        store.update(draft => {
          const nextDir: 'ascending' | 'descending' =
            draft.sortDescriptor?.column === payload.column
            && draft.sortDescriptor.direction === 'ascending'
              ? 'descending'
              : 'ascending';
          draft.sortDescriptor = { column: payload.column, direction: nextDir };
          draft.rowOrder.sort((aId, bId) => {
            const a = rowsByIdRef.current.get(aId);
            const b = rowsByIdRef.current.get(bId);
            if (!a || !b) return 0;
            const cmp =
              payload.column === 'name'
                ? a.name.localeCompare(b.name)
                : a.score - b.score;
            return nextDir === 'ascending' ? cmp : -cmp;
          });
        });
      });

      const notifySelection = () => {
        const selMap = store.getValue().selectedById;
        onSelectionChange?.(Object.keys(selMap).filter(id => selMap[id]));
      };

      Actions.useActionObserver('toggleRowSelect', notifySelection, { when: 'success' });
      Actions.useActionObserver('selectAll', notifySelection, { when: 'success' });
      Actions.useActionObserver('clearSelection', notifySelection, { when: 'success' });
      Actions.useActionObserver(
        'sortByColumn',
        () => {
          onSortChange?.(store.getValue().sortDescriptor);
        },
        { when: 'success' },
      );

      return { baseId, store, rowsByIdRef, refs, rowRefs, rovingFocus };
    },
  );

  function useGrid() {
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
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
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
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
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();

    // Exact path subscription: toggling row-3 re-renders ONLY row-3 (`O(depth)` Path-Trie precision).
    const isSelected = useStorePath(runtime.store, ['selectedById', rowId], {
      select: Boolean,
    });
    const isFocused = useStorePath(runtime.store, ['focusedRowId'], {
      select: focused => focused === rowId,
    });

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
    const runtime = Scope.useScope();
    return { setRef: runtime.refs.setRef('hoverIndicator') };
  }

  return {
    Provider: Scope.Provider,
    useGrid,
    useGridColumnHeader,
    useGridRow,
    useGridHoverBadge,
    useGridDispatch: Scope.useActionDispatch,
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

  const Scope = createScopedContext(
    name,
    Actions,
    ({ items, onAction }: Omit<AriaMenuProviderProps, 'children'>) => {
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

      const refs = useRefRegistry<{
        trigger: HTMLButtonElement;
        menu: HTMLDivElement;
      }>();
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

      const dispatch = Actions.useActionDispatch();
      const isOpen = useStorePath(store, ['isOpen']);
      const prevOpenRef = useRef(isOpen);

      useDismissLayer({
        isOpen,
        dismissOnEscape: true,
        dismissOnOutsidePointer: true,
        getContainers: () => [refs.get('trigger'), refs.get('menu')],
        onDismiss: () => void dispatch('close'),
      });

      useEffect(() => {
        const wasOpen = prevOpenRef.current;
        prevOpenRef.current = isOpen;

        if (!wasOpen && isOpen) {
          const activeId = store.getValue().activeItemId;
          if (activeId) {
            itemRefs.executeIfMounted(activeId, el => el.focus());
          }
        } else if (wasOpen && !isOpen) {
          rovingFocus.resetTypeahead();
          refs.get('trigger')?.focus();
        }
      }, [isOpen, itemRefs, refs, rovingFocus, store]);

      Actions.useActionCommandHandler('open', payload => {
        const enabled = itemsRef.current.filter(item => !item.disabled);
        const target =
          payload && payload.focusTarget === 'last'
            ? enabled[enabled.length - 1]?.id ?? null
            : enabled[0]?.id ?? null;
        store.update(draft => {
          draft.isOpen = true;
          draft.activeItemId = target;
        });
      });

      Actions.useActionCommandHandler('close', () => {
        store.update(draft => {
          draft.isOpen = false;
          draft.activeItemId = null;
        });
      });

      Actions.useActionCommandHandler('focusItem', payload => {
        store.update(draft => {
          draft.activeItemId = payload.id;
        });
      });

      Actions.useActionGuard('activateItem', (payload, controller) => {
        const candidate = itemsRef.current.find(item => item.id === payload.id);
        if (!candidate || candidate.disabled) {
          controller.abort(`menu item "${payload.id}" is disabled or missing`);
        }
      });

      Actions.useActionCommandHandler('activateItem', () => {
        store.update(draft => {
          draft.isOpen = false;
          draft.activeItemId = null;
        });
      });

      Actions.useActionObserver(
        'activateItem',
        event => {
          onAction?.(event.payload.id);
        },
        { when: 'success' },
      );

      return { baseId, store, itemsRef, refs, itemRefs, rovingFocus };
    },
  );

  function useMenuTrigger() {
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
    const isOpen = useStorePath(runtime.store, ['isOpen']);

    return {
      isOpen,
      triggerProps: {
        id: `${runtime.baseId}-trigger`,
        ref: runtime.refs.setRef('trigger'),
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
    const runtime = Scope.useScope();
    const isOpen = useStorePath(runtime.store, ['isOpen']);

    return {
      isOpen,
      menuProps: {
        id: `${runtime.baseId}-menu`,
        ref: runtime.refs.setRef('menu'),
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
    const runtime = Scope.useScope();
    const dispatch = Scope.useActionDispatch();
    const isFocused = useStorePath(runtime.store, ['activeItemId'], {
      select: activeId => activeId === id,
    });

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
    const runtime = Scope.useScope();
    const isOpen = useStorePath(runtime.store, ['isOpen']);
    const activeItemId = useStorePath(runtime.store, ['activeItemId']);
    return { isOpen, activeItemId };
  }

  return {
    Provider: Scope.Provider,
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
