import { useStorePath } from '@context-action/react';
import {
  mergeProps,
  useDismissLayer,
  usePointerGesture,
} from '@context-action/react/advanced';
import type React from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeBlock,
} from '@/components/ui';
import { SourceLink } from '@/components/ui/SourceLink';
import { useRegisterSourceFile } from '@/hooks/useRegisterSourceFile';
import {
  clampPercent,
  SLIDER_MAX,
  SLIDER_MIN,
  TAB_ITEMS,
  type TabItem,
} from './contexts/HeadlessInteractionsContexts';
import {
  OverlayScope,
  SliderScope,
  TabsScope,
} from './handlers/HeadlessInteractionsHandlerRegistry';

function TabButton({ item }: { item: TabItem }) {
  const { baseId, store, itemRefs } = TabsScope.useScope();
  const dispatch = TabsScope.useActionDispatch();

  const isSelected = useStorePath(store, ['selectedId'], {
    select: (id) => id === item.id,
  });
  const isFocused = useStorePath(store, ['focusedId'], {
    select: (id) => id === item.id,
  });

  const buttonProps = mergeProps(
    {
      id: `${baseId}-tab-${item.id}`,
      role: 'tab' as const,
      type: 'button' as const,
      tabIndex: item.disabled ? -1 : isFocused ? 0 : -1,
      'aria-selected': isSelected,
      'aria-disabled': item.disabled ? true : undefined,
      'aria-controls': `${baseId}-panel-${item.id}`,
      ref: itemRefs.setRef(item.id),
      onClick() {
        void dispatch('selectTab', { id: item.id });
      },
      onFocus() {
        if (!item.disabled) {
          void dispatch('focusTab', { id: item.id });
        }
      },
    },
    {
      'data-testid': `tab-${item.id}`,
      className: isSelected
        ? 'rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm'
        : item.disabled
          ? 'cursor-not-allowed rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400'
          : 'rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50',
    }
  );

  return <button {...buttonProps}>{item.label}</button>;
}

function TabsWorkspace() {
  const { baseId, store, rovingFocus } = TabsScope.useScope();
  const selectedId = useStorePath(store, ['selectedId']);
  const focusedId = useStorePath(store, ['focusedId']);
  const activeTab: TabItem = TAB_ITEMS.find(
    (item) => item.id === selectedId
  ) ?? {
    id: 'overview',
    label: 'Overview',
    summary: '',
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <Badge variant="outline" data-testid="tabs-selected-badge">
          Selected: {selectedId}
        </Badge>
        <Badge variant="outline" data-testid="tabs-focused-badge">
          Focused: {focusedId}
        </Badge>
      </div>

      <div
        role="tablist"
        aria-label="v5 Headless Tabs"
        className="flex flex-wrap gap-2"
        onKeyDown={(event) => {
          rovingFocus.handleKeyDown(store.getValue().focusedId, event);
        }}
      >
        {TAB_ITEMS.map((item) => (
          <TabButton key={item.id} item={item} />
        ))}
      </div>

      <div
        id={`${baseId}-panel-${activeTab.id}`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${activeTab.id}`}
        data-testid="tabs-active-panel"
        className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
      >
        <div className="font-semibold text-slate-900">{activeTab.label}</div>
        <p className="mt-1">{activeTab.summary}</p>
      </div>
    </div>
  );
}

function NestedOverlayDemo() {
  const { store, refs } = OverlayScope.useScope();
  const dispatch = OverlayScope.useActionDispatch();

  const outerOpen = useStorePath(store, ['outerOpen']);
  const popoverOpen = useStorePath(store, ['popoverOpen']);
  const guardClose = useStorePath(store, ['guardClose']);
  const dismissMessage = useStorePath(store, ['dismissMessage']);

  useDismissLayer({
    isOpen: outerOpen,
    dismissOnEscape: true,
    dismissOnOutsidePointer: true,
    getContainers: () => [refs.get('outerDialog'), refs.get('openOuterBtn')],
    onDismiss: () => void dispatch('closeOuter'),
  });

  useDismissLayer({
    isOpen: outerOpen && popoverOpen,
    dismissOnEscape: true,
    dismissOnOutsidePointer: true,
    getContainers: () => [
      refs.get('nestedPopover'),
      refs.get('openPopoverBtn'),
    ],
    onDismiss: () => void dispatch('closePopover'),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          ref={refs.setRef('openOuterBtn')}
          className={buttonVariants({ size: 'sm', variant: 'primary' })}
          onClick={() => void dispatch('openOuter')}
        >
          Open Outer Dialog
        </button>

        <Badge variant="outline" data-testid="overlay-stack-status">
          {outerOpen
            ? popoverOpen
              ? 'Stack: Outer Dialog -> Nested Popover'
              : 'Stack: Outer Dialog'
            : 'Stack: Closed'}
        </Badge>
      </div>

      {outerOpen && (
        <div
          ref={refs.setRef('outerDialog')}
          role="dialog"
          aria-label="Outer Inspector Dialog"
          data-testid="outer-dialog"
          className="rounded-lg border-2 border-indigo-300 bg-indigo-50/60 p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-semibold text-indigo-950">
                Outer Dialog (Layer 1)
              </h4>
              <p className="text-xs text-indigo-800">
                Press Escape or click outside to test LIFO dismissal and
                useActionGuard protection.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                ref={refs.setRef('openPopoverBtn')}
                className={buttonVariants({ size: 'sm', variant: 'secondary' })}
                onClick={() => void dispatch('openPopover')}
              >
                Open Nested Popover
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void dispatch('closeOuter')}
              >
                Close Dialog
              </Button>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-indigo-950">
            <input
              type="checkbox"
              checked={guardClose}
              onChange={(event) =>
                void dispatch('setGuardClose', {
                  enabled: event.target.checked,
                })
              }
            />
            Block outer dialog close (unsaved changes guard)
          </label>

          {dismissMessage && (
            <div
              role="alert"
              data-testid="dismiss-guard-reason"
              className="rounded border border-rose-300 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
            >
              {dismissMessage}
            </div>
          )}

          {popoverOpen && (
            <div
              ref={refs.setRef('nestedPopover')}
              role="dialog"
              aria-label="Nested Command Popover"
              data-testid="nested-popover"
              className="rounded-md border border-amber-300 bg-amber-50 p-3 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-amber-950">
                  Nested Popover (Top-Most Layer 2)
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void dispatch('closePopover')}
                >
                  Dismiss Popover
                </Button>
              </div>
              <p className="text-xs text-amber-900">
                Pressing Escape now dismisses ONLY this popover while keeping
                Outer Dialog open.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CommittedSliderMetrics() {
  const { store } = SliderScope.useScope();
  const committedValue = useStorePath(store, ['value']);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <Badge variant="primary" data-testid="slider-committed-value">
        Committed: {committedValue}%
      </Badge>
      <Badge variant="outline" data-testid="slider-commit-renders">
        Committed UI Renders: {renderCountRef.current}
      </Badge>
    </div>
  );
}

function DualLaneSliderWidget() {
  const { store, refs, computeValueFromClientX } = SliderScope.useScope();
  const dispatch = SliderScope.useActionDispatch();
  const committedValue = useStorePath(store, ['value']);

  const gesture = usePointerGesture({
    onStart(snapshot) {
      const next = computeValueFromClientX(snapshot.startX);
      void dispatch('previewDrag', { value: next });
    },
    onMove(snapshot) {
      const next = computeValueFromClientX(snapshot.currentX);
      void dispatch('previewDrag', { value: next });
    },
    onCommit(snapshot) {
      const next = computeValueFromClientX(snapshot.currentX);
      void dispatch('commitValue', { value: next });
    },
    onCancel() {
      const fallback = store.getValue().value;
      void dispatch('previewDrag', { value: fallback });
    },
  });

  const handleThumbKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const current = store.getValue().value;
      let next: number | null = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        next = current + 5;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        next = current - 5;
      } else if (event.key === 'Home') {
        next = SLIDER_MIN;
      } else if (event.key === 'End') {
        next = SLIDER_MAX;
      }
      if (next === null) return;
      event.preventDefault();
      void dispatch('commitValue', { value: clampPercent(next) });
    },
    [dispatch, store]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <CommittedSliderMetrics />
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            ref={refs.setRef('previewBadge')}
            data-testid="slider-preview-badge"
            className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800"
          >
            Fast Preview: {committedValue}%
          </span>
          <span
            ref={refs.setRef('previewCountBadge')}
            data-testid="slider-fast-ticks"
            className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-slate-700"
          >
            Fast-lane ticks: 0
          </span>
        </div>
      </div>

      <div
        ref={refs.setRef('track')}
        data-testid="gesture-slider-track"
        className="relative h-8 cursor-pointer select-none rounded-full border border-slate-300 bg-slate-100 px-3"
        onPointerDown={(event) => gesture.start(event)}
        onPointerMove={(event) => gesture.move(event)}
        onPointerUp={(event) => gesture.commit(event)}
        onPointerCancel={() => gesture.cancel('pointercancel')}
        onKeyDown={(event) => gesture.handleKeyDown(event)}
      >
        <div
          ref={refs.setRef('thumb')}
          role="slider"
          tabIndex={0}
          aria-label="Dual-lane percentage slider"
          aria-valuemin={SLIDER_MIN}
          aria-valuemax={SLIDER_MAX}
          aria-valuenow={committedValue}
          data-testid="gesture-slider-thumb"
          data-preview-value={String(committedValue)}
          style={{ left: `${committedValue}%` }}
          onKeyDown={handleThumbKeyDown}
          className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => void dispatch('commitValue', { value: 25 })}
        >
          Commit 25%
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => void dispatch('commitValue', { value: 75 })}
        >
          Commit 75%
        </Button>
      </div>
    </div>
  );
}

const SUBPATH_SNIPPET = `import {
  createActionContext,
  createScopedContext,
  createStoreContext,
  useStorePath,
} from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import { createTimeTravelStoreContext } from '@context-action/react/time-travel';
import { StoreTransactionCoordinator } from '@context-action/react/transactions';
import { createBackendStore } from '@context-action/react/backend';
import {
  useControlledStoreSync,
  useDismissLayer,
  usePointerGesture,
  useRefCollection,
  useRefRegistry,
  useRovingFocus,
  useStoreInstance,
} from '@context-action/react/advanced';`;

export default function HeadlessInteractionsPage() {
  useRegisterSourceFile(
    'pages/integrations/headless-interactions/HeadlessInteractionsPage.tsx',
    {
      name: 'Headless Interactions Showcase (v5)',
      category: 'integrations',
      description:
        'Demonstrates @context-action/react v5 modular subpaths and @context-action/interactions headless primitives (useRovingFocus, useDismissLayer, usePointerGesture, useRefCollection, useControlledStoreSync, createScopedContext) with Dual-Lane fast/orchestrated execution.',
      tags: [
        'v5',
        'interactions',
        'useDismissLayer',
        'useRovingFocus',
        'usePointerGesture',
        'createScopedContext',
        'useControlledStoreSync',
        'dual-lane',
      ],
    }
  );

  const [controlledTab, setControlledTab] = useState<TabItem['id']>('overview');

  const tabPresets = useMemo<TabItem['id'][]>(
    () => ['overview', 'architecture', 'migration'],
    []
  );

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-3 border-b border-slate-200 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-800">
              React v5.0 + Core v2.0 + Interactions v0.1
            </div>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">
              Headless UI Primitives &amp; Dual-Lane Interactions
            </h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              <code>@context-action/react/advanced</code> exposes headless
              focus, LIFO dismissal, pointer gesture, and controlled sync hooks
              backed by <code>@context-action/interactions</code> and Dual-Lane{' '}
              <code>ActionRegister</code> scheduling.
            </p>
          </div>
          <SourceLink
            filePath="pages/integrations/headless-interactions/HeadlessInteractionsPage.tsx"
            variant="badge"
          />
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>
            1. Controlled Tabs (createScopedContext + useRovingFocus +
            useRefCollection + useControlledStoreSync)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-600">
              External controlled prop:
            </span>
            {tabPresets.map((preset) => (
              <Button
                key={preset}
                size="sm"
                variant={controlledTab === preset ? 'primary' : 'outline'}
                onClick={() => setControlledTab(preset)}
              >
                External: {preset}
              </Button>
            ))}
          </div>

          <TabsScope.Provider
            selectedId={controlledTab}
            onSelectedIdChange={setControlledTab}
          >
            <TabsWorkspace />
          </TabsScope.Provider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            2. Nested LIFO Overlay Stack (useDismissLayer + useActionGuard)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <OverlayScope.Provider>
            <NestedOverlayDemo />
          </OverlayScope.Provider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            3. Dual-Lane Zero-Re-Render Scrub Slider (usePointerGesture +
            useRefRegistry + fast/orchestrated)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SliderScope.Provider defaultValue={40}>
            <DualLaneSliderWidget />
          </SliderScope.Provider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. v5 Modular Subpath Imports</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock size="md">{SUBPATH_SNIPPET}</CodeBlock>
        </CardContent>
      </Card>
    </div>
  );
}
