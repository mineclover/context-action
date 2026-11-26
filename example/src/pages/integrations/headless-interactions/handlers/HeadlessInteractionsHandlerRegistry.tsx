import { createScopedContext } from '@context-action/react';
import {
  useControlledStoreSync,
  useRefCollection,
  useRefRegistry,
  useRovingFocus,
  useStoreInstance,
} from '@context-action/react/advanced';
import { useCallback, useId, useRef } from 'react';
import {
  clampPercent,
  OverlayActionCtx,
  type OverlayState,
  SLIDER_MAX,
  SLIDER_MIN,
  SliderActionCtx,
  type SliderState,
  TAB_ITEMS,
  type TabItem,
  TabsActionCtx,
  type TabsState,
} from '../contexts/HeadlessInteractionsContexts';

export const TabsScope = createScopedContext(
  'HeadlessTabs',
  TabsActionCtx,
  ({
    selectedId,
    onSelectedIdChange,
  }: {
    selectedId?: TabItem['id'];
    onSelectedIdChange?: (id: TabItem['id']) => void;
  }) => {
    const baseId = useId();
    const initialId = selectedId ?? 'overview';

    const store = useStoreInstance<TabsState>(
      () => ({
        selectedId: initialId,
        focusedId: initialId,
        lastBlocked: null,
      }),
      `HeadlessTabs:${baseId}`,
      { notificationMode: 'immediate' }
    );

    useControlledStoreSync(store, ['selectedId'], selectedId, {
      onSync(draft, nextId) {
        draft.focusedId = nextId;
        draft.lastBlocked = null;
      },
    });

    const itemRefs = useRefCollection<HTMLButtonElement>();

    const rovingFocus = useRovingFocus({
      orientation: 'horizontal',
      loop: true,
      typeahead: true,
      getItems: () => TAB_ITEMS,
      getActiveId: () => store.getValue().focusedId,
      onFocusChange(nextId) {
        const typedId = nextId as TabItem['id'];
        store.update((draft) => {
          draft.focusedId = typedId;
        });
        itemRefs.executeIfMounted(nextId, (el) => el.focus());
      },
    });

    TabsActionCtx.useActionGuard('selectTab', ({ id }, controller) => {
      const target = TAB_ITEMS.find((item) => item.id === id);
      if (!target || target.disabled) {
        controller.abort(`Tab "${id}" is disabled`);
      }
    });

    TabsActionCtx.useActionCommandHandler('focusTab', ({ id }) => {
      store.update((draft) => {
        draft.focusedId = id;
      });
    });

    TabsActionCtx.useActionCommandHandler('selectTab', ({ id }) => {
      store.update((draft) => {
        draft.selectedId = id;
        draft.focusedId = id;
        draft.lastBlocked = null;
      });
    });

    TabsActionCtx.useActionObserver(
      'selectTab',
      (event) => {
        onSelectedIdChange?.(event.payload.id);
      },
      { when: 'success' }
    );

    TabsActionCtx.useActionObserver(
      'selectTab',
      (event) => {
        const reason =
          event.errors[0]?.error.message ?? 'Selection blocked (disabled tab)';
        store.update((draft) => {
          draft.lastBlocked = reason;
        });
      },
      { when: 'failure' }
    );

    return { baseId, store, itemRefs, rovingFocus };
  }
);

export const OverlayScope = createScopedContext(
  'HeadlessOverlay',
  OverlayActionCtx,
  () => {
    const store = useStoreInstance<OverlayState>(
      () => ({
        outerOpen: false,
        popoverOpen: false,
        guardClose: false,
        dismissMessage: null,
      }),
      'HeadlessOverlay:Store',
      { notificationMode: 'immediate' }
    );
    const refs = useRefRegistry<{
      openOuterBtn: HTMLButtonElement;
      outerDialog: HTMLDivElement;
      openPopoverBtn: HTMLButtonElement;
      nestedPopover: HTMLDivElement;
    }>();

    OverlayActionCtx.useActionCommandHandler('openOuter', () => {
      store.update((draft) => {
        draft.outerOpen = true;
        draft.dismissMessage = null;
      });
    });

    OverlayActionCtx.useActionGuard('closeOuter', (_payload, controller) => {
      if (store.getValue().guardClose) {
        controller.abort('Unsaved changes: disable the guard before closing');
      }
    });

    OverlayActionCtx.useActionCommandHandler('closeOuter', () => {
      store.update((draft) => {
        draft.outerOpen = false;
        draft.popoverOpen = false;
        draft.dismissMessage = null;
      });
    });

    OverlayActionCtx.useActionObserver(
      'closeOuter',
      (event) => {
        const message =
          event.errors[0]?.error.message ??
          'Unsaved changes: disable the guard before closing';
        store.update((draft) => {
          draft.dismissMessage = message;
        });
      },
      { when: 'failure' }
    );

    OverlayActionCtx.useActionCommandHandler('openPopover', () => {
      store.update((draft) => {
        draft.popoverOpen = true;
      });
    });

    OverlayActionCtx.useActionCommandHandler('closePopover', () => {
      store.update((draft) => {
        draft.popoverOpen = false;
      });
    });

    OverlayActionCtx.useActionCommandHandler('setGuardClose', ({ enabled }) => {
      store.update((draft) => {
        draft.guardClose = enabled;
        if (!enabled) {
          draft.dismissMessage = null;
        }
      });
    });

    return { store, refs };
  }
);

export const SliderScope = createScopedContext(
  'HeadlessSlider',
  SliderActionCtx,
  ({ defaultValue = 40 }: { defaultValue?: number }) => {
    const store = useStoreInstance<SliderState>(
      () => ({ value: clampPercent(defaultValue) }),
      'HeadlessSlider:Store',
      { notificationMode: 'immediate' }
    );
    const refs = useRefRegistry<{
      track: HTMLDivElement;
      thumb: HTMLDivElement;
      previewBadge: HTMLSpanElement;
      previewCountBadge: HTMLSpanElement;
    }>();
    const previewCounterRef = useRef(0);

    const syncPreviewDom = useCallback(
      (nextValue: number) => {
        refs.executeIfMounted('thumb', (el) => {
          el.style.left = `${nextValue}%`;
          el.setAttribute('aria-valuenow', String(nextValue));
          el.dataset.previewValue = String(nextValue);
        });
        refs.executeIfMounted('previewBadge', (el) => {
          el.textContent = `Fast Preview: ${nextValue}%`;
        });
      },
      [refs]
    );

    const computeValueFromClientX = useCallback(
      (clientX: number) => {
        if (!Number.isFinite(clientX)) return store.getValue().value;
        const trackEl = refs.get('track');
        if (!trackEl) return store.getValue().value;
        const rect = trackEl.getBoundingClientRect();
        if (rect.width <= 0) return store.getValue().value;
        const ratio = Math.min(
          1,
          Math.max(0, (clientX - rect.left) / rect.width)
        );
        return clampPercent(SLIDER_MIN + ratio * (SLIDER_MAX - SLIDER_MIN));
      },
      [refs, store]
    );

    SliderActionCtx.useActionCommandHandler('previewDrag', ({ value }) => {
      previewCounterRef.current += 1;
      syncPreviewDom(value);
      refs.executeIfMounted('previewCountBadge', (el) => {
        el.textContent = `Fast-lane ticks: ${previewCounterRef.current}`;
      });
    });

    SliderActionCtx.useActionGuard('commitValue', ({ value }, controller) => {
      const normalized = clampPercent(value);
      if (normalized !== value) {
        controller.modifyPayload(() => ({ value: normalized }));
      }
    });

    SliderActionCtx.useActionCommandHandler('commitValue', ({ value }) => {
      store.update((draft) => {
        draft.value = value;
      });
      syncPreviewDom(value);
    });

    return { store, refs, computeValueFromClientX };
  }
);
