import { act, render } from '@testing-library/react';
import React, { useState } from 'react';
import { createStore, useStorePath, type PathValue } from '@context-action/react';
import {
  useControlledStoreSync,
  usePointerGesture,
  useRovingFocus,
  useStoreInstance,
  useSyncActionPipeline,
} from '@context-action/react/advanced';

describe('Ergonomic scoped store, controlled sync, path inference, and element hooks contract', () => {
  it('infers nested PathValue return types automatically without explicit generics', () => {
    interface SampleState {
      quotes: { AAPL: number };
      selectedById: Record<string, boolean | undefined>;
      items: Array<{ label: string }>;
    }

    const store = createStore<SampleState>('inferred-path', {
      quotes: { AAPL: 185 },
      selectedById: { 'row-1': true },
      items: [{ label: 'First' }],
    });

    function Reader({ rowId }: { rowId: string }) {
      const aapl: number = useStorePath(store, ['quotes', 'AAPL']);
      const selected: boolean | undefined = useStorePath(store, ['selectedById', rowId]);
      const firstLabel: string | undefined = useStorePath(store, ['items', 0, 'label']);
      const checked: PathValue<SampleState, ['quotes', 'AAPL']> = aapl;

      return (
        <div>
          <span data-testid="p-aapl">{checked}</span>
          <span data-testid="p-sel">{String(Boolean(selected))}</span>
          <span data-testid="p-lbl">{firstLabel}</span>
        </div>
      );
    }

    const view = render(<Reader rowId="row-1" />);
    expect(view.getByTestId('p-aapl').textContent).toBe('185');
    expect(view.getByTestId('p-sel').textContent).toBe('true');
    expect(view.getByTestId('p-lbl').textContent).toBe('First');

    act(() => {
      store.update(draft => {
        draft.quotes.AAPL = 200;
      });
    });
    expect(view.getByTestId('p-aapl').textContent).toBe('200');

    view.unmount();
    store.dispose();
  });

  it('provides non-subscribing useStoreInstance (0 owner renders) and StrictMode-safe controlled sync', async () => {
    interface PanelState {
      value: number;
      other: string;
    }

    let ownerRenders = 0;
    let valueLeafRenders = 0;
    let ownedStoreRef: ReturnType<typeof useStoreInstance<PanelState>> | undefined;

    const ValueLeaf = React.memo(function ValueLeaf({
      store,
    }: {
      store: ReturnType<typeof useStoreInstance<PanelState>>;
    }) {
      valueLeafRenders += 1;
      const val = useStorePath(store, ['value']);
      return <span data-testid="leaf-val">{val}</span>;
    });

    function Host({ controlledValue }: { controlledValue?: number }) {
      ownerRenders += 1;
      const store = useStoreInstance<PanelState>(
        () => ({ value: 10, other: 'idle' }),
        'scopedHostStore',
        { notificationMode: 'immediate' },
      );
      ownedStoreRef = store;
      useControlledStoreSync(store, ['value'], controlledValue);

      return (
        <div>
          <ValueLeaf store={store} />
          <button
            type="button"
            data-testid="mut-leaf"
            onClick={() => store.update(draft => {
              draft.value += 1;
            })}
          />
        </div>
      );
    }

    const view = render(<Host controlledValue={undefined} />);
    expect(ownerRenders).toBe(1);
    expect(valueLeafRenders).toBe(1);
    expect(view.getByTestId('leaf-val').textContent).toBe('10');

    // Internal store mutation does NOT re-render the Host owning `useStoreInstance`
    act(() => {
      view.getByTestId('mut-leaf').click();
    });
    expect(ownerRenders).toBe(1);
    expect(valueLeafRenders).toBe(2);
    expect(view.getByTestId('leaf-val').textContent).toBe('11');

    // Controlled prop update syncs surgically into ['value'] path
    view.rerender(<Host controlledValue={42} />);
    expect(view.getByTestId('leaf-val').textContent).toBe('42');

    // Duplicate controlled prop value triggers zero store notifications & zero memo leaf renders
    let notificationsOnSameProp = 0;
    const unsub = ownedStoreRef!.subscribe(() => {
      notificationsOnSameProp += 1;
    });
    const leafBeforeSameProp = valueLeafRenders;
    view.rerender(<Host controlledValue={42} />);
    expect(notificationsOnSameProp).toBe(0);
    expect(valueLeafRenders).toBe(leafBeforeSameProp);
    unsub();

    const capturedStore = ownedStoreRef!;
    view.unmount();
    expect(capturedStore.isStoreDisposed()).toBe(true);
  });

  it('survives React StrictMode double-mount cleanly for useSyncActionPipeline, useRovingFocus, and usePointerGesture', () => {
    const focusLog: string[] = [];
    const gestureLog: string[] = [];
    const syncCalls = jest.fn();

    function StrictWidget() {
      const [activeId, setActiveId] = useState('item-0');

      const pipeline = useSyncActionPipeline<{ fire: { n: number } }>(
        'StrictSyncPipe',
        p => {
          p.register('fire', payload => {
            syncCalls(payload.n);
          });
        },
      );

      const roving = useRovingFocus({
        orientation: 'horizontal',
        getItems: () => [
          { id: 'item-0' },
          { id: 'item-1', disabled: true },
          { id: 'item-2' },
        ],
        getActiveId: () => activeId,
        onFocusChange(nextId) {
          focusLog.push(nextId);
          setActiveId(nextId);
        },
      });

      const gesture = usePointerGesture({
        onStart(snap) {
          gestureLog.push(`start:${snap.startX}`);
        },
        onCommit(snap) {
          gestureLog.push(`commit:${snap.currentX}`);
        },
      });

      return (
        <div>
          <span data-testid="active-id">{activeId}</span>
          <button
            type="button"
            data-testid="fire-sync"
            onClick={() => pipeline.dispatch('fire', { n: 7 })}
          />
          <button
            type="button"
            data-testid="roving-next"
            onClick={() => roving.handleKeyDown(activeId, { key: 'ArrowRight' })}
          />
          <button
            type="button"
            data-testid="gesture-tap"
            onClick={() => {
              gesture.start({ pointerId: 1, button: 0, clientX: 10, clientY: 0 });
              gesture.commit({ pointerId: 1, clientX: 90, clientY: 0 });
            }}
          />
        </div>
      );
    }

    const view = render(
      <React.StrictMode>
        <StrictWidget />
      </React.StrictMode>,
    );

    act(() => {
      view.getByTestId('fire-sync').click();
      view.getByTestId('roving-next').click();
      view.getByTestId('gesture-tap').click();
    });

    expect(syncCalls).toHaveBeenCalledWith(7);
    expect(focusLog).toEqual(['item-2']);
    expect(view.getByTestId('active-id').textContent).toBe('item-2');
    expect(gestureLog).toEqual(['start:10', 'commit:90']);

    view.unmount();
  });
});
