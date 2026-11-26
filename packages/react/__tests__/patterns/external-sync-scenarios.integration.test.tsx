import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React, { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import {
  createActionContext,
  createStore,
  useStorePath,
} from '@context-action/react';
import { createRefContext } from '@context-action/react/refs';
import { createTimeTravelStore } from '@context-action/react/time-travel';
import {
  StoreTransactionCoordinator,
  bindActionTransactions,
} from '@context-action/react/transactions';
import { patchesAffectPath } from '../../src/stores/utils/patch-affects-path';

// -----------------------------------------------------------------------------
// Helpers & Self-Contained Fakes
// -----------------------------------------------------------------------------

interface NoteRecord {
  readonly id: string;
  readonly title: string;
  readonly revision: number;
}

class FakeIndexedDbDriver<TRecord> {
  private readonly records = new Map<string, TRecord>();
  public getCount = 0;
  public putCount = 0;
  public deleteCount = 0;
  public failNextPutError: Error | null = null;

  seed(key: string, value: TRecord): void {
    this.records.set(key, JSON.parse(JSON.stringify(value)) as TRecord);
  }

  async getAll(): Promise<TRecord[]> {
    this.getCount += 1;
    await new Promise<void>(resolve => queueMicrotask(resolve));
    return [...this.records.values()].map(
      item => JSON.parse(JSON.stringify(item)) as TRecord,
    );
  }

  async put(key: string, value: TRecord): Promise<void> {
    this.putCount += 1;
    await new Promise<void>(resolve => queueMicrotask(resolve));
    if (this.failNextPutError) {
      const err = this.failNextPutError;
      this.failNextPutError = null;
      throw err;
    }
    this.records.set(key, JSON.parse(JSON.stringify(value)) as TRecord);
  }

  async delete(key: string): Promise<void> {
    this.deleteCount += 1;
    await new Promise<void>(resolve => queueMicrotask(resolve));
    this.records.delete(key);
  }

  snapshotKeys(): string[] {
    return [...this.records.keys()];
  }
}

interface FilterState {
  tab: 'overview' | 'orders' | 'settings';
  page: number;
  sort: 'asc' | 'desc';
}

const VALID_TABS = new Set<FilterState['tab']>(['overview', 'orders', 'settings']);

function parseFilterFromSearch(search: string): FilterState {
  const params = new URLSearchParams(search);
  const rawTab = params.get('tab');
  const rawPage = Number(params.get('page') ?? '1');
  const rawSort = params.get('sort');
  return {
    tab: VALID_TABS.has(rawTab as FilterState['tab'])
      ? (rawTab as FilterState['tab'])
      : 'overview',
    page: Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1,
    sort: rawSort === 'desc' ? 'desc' : 'asc',
  };
}

function serializeFilterToUrl(filter: FilterState): string {
  const params = new URLSearchParams();
  params.set('tab', filter.tab);
  params.set('page', String(filter.page));
  params.set('sort', filter.sort);
  return `/?${params.toString()}`;
}

type StreamMessage =
  | { type: 'tick'; symbol: 'AAPL' | 'MSFT'; price: number }
  | { type: 'delta'; seq: number; symbol: 'AAPL' | 'MSFT'; price: number }
  | { type: 'disconnect' }
  | {
      type: 'reconnect-snapshot';
      seq: number;
      quotes: { AAPL: number; MSFT: number };
    };

class FakeRealtimeChannel {
  private readonly subscribers = new Set<(msg: StreamMessage) => void>();

  subscribe(listener: (msg: StreamMessage) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  emit(msg: StreamMessage): void {
    for (const listener of [...this.subscribers]) {
      listener(msg);
    }
  }
}

describe('External global state synchronization scenarios', () => {
  // ---------------------------------------------------------------------------
  // Scenario 1: Global State <-> IndexedDB
  // ---------------------------------------------------------------------------
  describe('Scenario 1: Global State <-> IndexedDB persistence, write-through rollback, and fast-lane isolation', () => {
    interface NotesState {
      items: NoteRecord[];
      hydrated: boolean;
    }

    interface MetaState {
      savedCount: number;
      lastSavedId: string | null;
    }

    interface ErrorState {
      lastError: string | null;
    }

    interface NotesActionMap {
      draftInput: { noteId: string; text: string };
      hydrateFromIdb: undefined;
      saveNote: NoteRecord;
    }

    function createNotesSession(idb: FakeIndexedDbDriver<NoteRecord>) {
      const Actions = createActionContext<NotesActionMap>('IndexedDbNotes', {
        actions: {
          draftInput: { lane: 'fast' },
          hydrateFromIdb: { lane: 'orchestrated', queue: 'serial' },
          saveNote: { lane: 'orchestrated', queue: 'serial' },
        },
      });
      const Refs = createRefContext('IndexedDbNotesRefs', {
        draftPreview: {
          name: 'draftPreview',
          autoCleanup: true,
          validator: (target: unknown): target is HTMLSpanElement =>
            target instanceof HTMLSpanElement,
        },
      });

      const notesStore = createTimeTravelStore<NotesState>(
        'idb-notes',
        { items: [], hydrated: false },
        { mutable: false, notificationMode: 'immediate' },
      );
      const metaStore = createTimeTravelStore<MetaState>(
        'idb-meta',
        { savedCount: 0, lastSavedId: null },
        { mutable: false, notificationMode: 'immediate' },
      );
      const errorStore = createStore<ErrorState>(
        'idb-errors',
        { lastError: null },
        { notificationMode: 'immediate' },
      );
      const coordinator = new StoreTransactionCoordinator();
      const txParticipantsSpy = jest.fn(() => [
        { name: 'notes', store: notesStore },
        { name: 'meta', store: metaStore },
      ]);
      const renders = { shell: 0, notes: 0, hydrated: 0, meta: 0, error: 0 };
      let dispatchFn: ReturnType<typeof Actions.useActionDispatch> | undefined;
      let registerRef: ReturnType<typeof Actions.useActionRegister> = null;
      let draftNode: HTMLSpanElement | null = null;

      function NotesLeaf() {
        renders.notes += 1;
        const items = useStorePath<NotesState, NoteRecord[]>(notesStore, ['items']);
        return (
          <span data-testid="idb-notes">
            {items.map(item => `${item.id}:${item.title}@${item.revision}`).join('|')}
          </span>
        );
      }

      function HydratedLeaf() {
        renders.hydrated += 1;
        const hydrated = useStorePath<NotesState, boolean>(notesStore, ['hydrated']);
        return <span data-testid="idb-hydrated">{String(hydrated)}</span>;
      }

      function SidebarLeaf() {
        renders.meta += 1;
        const savedCount = useStorePath<MetaState, number>(metaStore, ['savedCount']);
        return <span data-testid="idb-saved-count">{savedCount}</span>;
      }

      function ErrorBannerLeaf() {
        renders.error += 1;
        const lastError = useStorePath<ErrorState, string | null>(errorStore, ['lastError']);
        return <span data-testid="idb-error">{lastError ?? 'none'}</span>;
      }

      function NotesShell() {
        renders.shell += 1;
        dispatchFn = Actions.useActionDispatch();
        registerRef = Actions.useActionRegister();
        const draftPreview = Refs.useRefController('draftPreview');

        const setDraftNode = useCallback(
          (node: HTMLSpanElement | null) => {
            draftNode = node;
            draftPreview.setRef(node);
          },
          [draftPreview],
        );

        useEffect(() => {
          if (!registerRef) return undefined;
          return bindActionTransactions(registerRef, coordinator, {
            actions: ['saveNote'],
            getParticipants: txParticipantsSpy,
          });
        }, [registerRef]);

        Actions.useActionCommandHandler(
          'draftInput',
          useCallback(
            payload => {
              draftPreview.executeIfMounted(el => {
                el.dataset.noteId = payload.noteId;
                el.textContent = payload.text;
              });
            },
            [draftPreview],
          ),
        );

        Actions.useActionCommandHandler(
          'hydrateFromIdb',
          useCallback(async () => {
            const loaded = await idb.getAll();
            notesStore.update(draft => {
              draft.items = loaded;
              draft.hydrated = true;
            });
            metaStore.update(draft => {
              draft.savedCount = loaded.length;
              draft.lastSavedId = loaded[loaded.length - 1]?.id ?? null;
            });
          }, []),
        );

        Actions.useActionCommandHandler(
          'saveNote',
          useCallback(async payload => {
            // Speculative update across two TimeTravelStores inside active transaction batch
            notesStore.update(draft => {
              const idx = draft.items.findIndex(item => item.id === payload.id);
              if (idx >= 0) draft.items[idx] = payload;
              else draft.items.push(payload);
            });
            metaStore.update(draft => {
              draft.savedCount += 1;
              draft.lastSavedId = payload.id;
            });
            errorStore.update(draft => {
              draft.lastError = null;
            });
            // Persist write-through to IndexedDB; throwing here triggers atomic rollback
            await idb.put(payload.id, payload);
          }, []),
          { errorPolicy: 'fatal' },
        );

        Actions.useActionObserver(
          'saveNote',
          useCallback(event => {
            const firstErr = event.errors[0];
            const message = firstErr?.error instanceof Error
              ? firstErr.error.message
              : typeof firstErr?.error === 'string'
                ? firstErr.error
                : 'Save failed';
            errorStore.update(draft => {
              draft.lastError = message;
            });
          }, []),
          { when: 'failure' },
        );

        return (
          <>
            <NotesLeaf />
            <HydratedLeaf />
            <SidebarLeaf />
            <ErrorBannerLeaf />
            <span ref={setDraftNode} data-testid="idb-draft-preview" />
          </>
        );
      }

      const view = render(
        <Actions.Provider>
          <Refs.Provider>
            <NotesShell />
          </Refs.Provider>
        </Actions.Provider>,
      );

      return {
        view,
        notesStore,
        metaStore,
        errorStore,
        coordinator,
        txParticipantsSpy,
        renders,
        getDispatch: () => dispatchFn!,
        getRegister: () => registerRef!,
        getDraftNode: () => draftNode!,
        dispose: async () => {
          await act(async () => {
            view.unmount();
          });
          notesStore.dispose();
          metaStore.dispose();
          errorStore.dispose();
        },
      };
    }

    it('hydrates cleanly, isolates fast-lane typing, rolls back multi-store state on IDB write failure, and restores across sessions', async () => {
      const idb = new FakeIndexedDbDriver<NoteRecord>();
      idb.seed('note-1', { id: 'note-1', title: 'Architecture', revision: 1 });

      const session1 = createNotesSession(idb);
      await waitFor(() => {
        expect(session1.getRegister()?.getHandlerCount('saveNote')).toBe(2);
        expect(session1.getRegister()?.getHandlerCount('hydrateFromIdb')).toBe(1);
        expect(session1.getRegister()?.getHandlerCount('draftInput')).toBe(1);
      });

      // 1. Initial hydration reads IDB once with zero write-back or tx overhead
      await act(async () => {
        await session1.getDispatch()('hydrateFromIdb');
      });
      expect(idb.getCount).toBe(1);
      expect(idb.putCount).toBe(0);
      expect(session1.txParticipantsSpy).not.toHaveBeenCalled();
      expect(session1.view.getByTestId('idb-notes').textContent).toBe('note-1:Architecture@1');
      expect(session1.view.getByTestId('idb-hydrated').textContent).toBe('true');
      expect(session1.view.getByTestId('idb-saved-count').textContent).toBe('1');
      expect(session1.renders.error).toBe(1); // ErrorBanner untouched

      // 2. High-frequency draftInput (lane: 'fast') x 50 updates DOM ref with 0 React re-renders & 0 IDB writes
      const rendersBeforeTyping = { ...session1.renders };
      await act(async () => {
        for (let i = 1; i <= 50; i += 1) {
          await session1.getDispatch()('draftInput', {
            noteId: 'note-2',
            text: `draft-${i}`,
          });
        }
      });
      expect(session1.getDraftNode().textContent).toBe('draft-50');
      expect(session1.getDraftNode().dataset.noteId).toBe('note-2');
      expect(session1.renders).toEqual(rendersBeforeTyping);
      expect(idb.putCount).toBe(0);
      expect(session1.txParticipantsSpy).not.toHaveBeenCalled();

      // 3. Successful transactional saveNote persists to IDB & updates both stores + supports Undo
      await act(async () => {
        await session1.getDispatch()('saveNote', {
          id: 'note-2',
          title: 'IndexedDB',
          revision: 1,
        });
      });
      expect(idb.putCount).toBe(1);
      expect(idb.snapshotKeys()).toEqual(['note-1', 'note-2']);
      expect(session1.txParticipantsSpy).toHaveBeenCalledTimes(1);
      expect(session1.view.getByTestId('idb-notes').textContent).toBe(
        'note-1:Architecture@1|note-2:IndexedDB@1',
      );
      expect(session1.view.getByTestId('idb-saved-count').textContent).toBe('2');

      // Coordinator Undo reverts both TimeTravelStores together cleanly
      await act(async () => {
        session1.coordinator.undo();
      });
      expect(session1.notesStore.getValue().items).toHaveLength(1);
      expect(session1.metaStore.getValue().savedCount).toBe(1);

      await act(async () => {
        session1.coordinator.redo();
      });
      expect(session1.notesStore.getValue().items).toHaveLength(2);
      expect(session1.metaStore.getValue().savedCount).toBe(2);

      // 4. Fault injection: QuotaExceededError on IDB put rolls back BOTH stores automatically
      idb.failNextPutError = new Error('QuotaExceededError: IDB storage full');
      const rendersBeforeFailure = { ...session1.renders };
      const txBeforeFailure = session1.coordinator.getHistory().length;

      let caughtError: unknown;
      await act(async () => {
        try {
          await session1.getDispatch()('saveNote', {
            id: 'note-3',
            title: 'ShouldRollback',
            revision: 1,
          });
        } catch (error) {
          caughtError = error;
        }
      });

      expect((caughtError as Error).message).toContain('QuotaExceededError');
      expect(session1.notesStore.getValue().items).toHaveLength(2); // Rolled back!
      expect(session1.metaStore.getValue()).toEqual({ savedCount: 2, lastSavedId: 'note-2' });
      expect(session1.coordinator.getHistory().length).toBe(txBeforeFailure); // Failed tx not committed
      expect(idb.snapshotKeys()).toEqual(['note-1', 'note-2']); // Failed key not in IDB
      expect(session1.view.getByTestId('idb-error').textContent).toContain('QuotaExceededError');
      expect(session1.renders.notes).toBe(rendersBeforeFailure.notes);
      expect(session1.renders.meta).toBe(rendersBeforeFailure.meta);
      expect(session1.renders.error).toBe(rendersBeforeFailure.error + 1);

      await session1.dispose();

      // 5. Cross-session restore: brand-new Provider + fresh empty stores rehydrate persisted notes
      const session2 = createNotesSession(idb);
      await waitFor(() => {
        expect(session2.getRegister()?.getHandlerCount('hydrateFromIdb')).toBe(1);
      });
      await act(async () => {
        await session2.getDispatch()('hydrateFromIdb');
      });
      expect(session2.view.getByTestId('idb-notes').textContent).toBe(
        'note-1:Architecture@1|note-2:IndexedDB@1',
      );
      expect(session2.view.getByTestId('idb-saved-count').textContent).toBe('2');
      await session2.dispose();
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 2: URL Query/History <-> Global Store Sync
  // ---------------------------------------------------------------------------
  describe('Scenario 2: Bidirectional URL query/history <-> global store sync without feedback loops', () => {
    let savedLocationHref = '';

    beforeEach(() => {
      savedLocationHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.history.replaceState(null, '', '/?tab=overview&page=1&sort=asc');
    });

    afterEach(() => {
      jest.restoreAllMocks();
      window.history.replaceState(null, '', savedLocationHref || '/');
    });

    it('synchronizes popstate and UI filter actions with guard clamping, zero pushState loops, and leaf render isolation', async () => {
      interface UrlActionMap {
        hoverRow: { rowId: string };
        syncFromUrl: FilterState;
        setRouteFilter: Partial<FilterState>;
      }

      const Actions = createActionContext<UrlActionMap>('UrlSyncActions', {
        actions: {
          hoverRow: { lane: 'fast' },
          syncFromUrl: { lane: 'orchestrated', queue: 'serial' },
          setRouteFilter: { lane: 'orchestrated', queue: 'serial' },
        },
      });
      const Refs = createRefContext('UrlSyncRefs', {
        hoverIndicator: {
          name: 'hoverIndicator',
          autoCleanup: true,
          validator: (target: unknown): target is HTMLSpanElement =>
            target instanceof HTMLSpanElement,
        },
      });

      const routeStore = createStore<FilterState>(
        'url-route-store',
        parseFilterFromSearch(window.location.search),
        { notificationMode: 'immediate' },
      );

      const renders = { shell: 0, tab: 0, page: 0, sort: 0 };
      const fetchedPages: number[] = [];
      const pushStateSpy = jest.spyOn(window.history, 'pushState');
      let dispatchFn: ReturnType<typeof Actions.useActionDispatch> | undefined;
      let registerRef: ReturnType<typeof Actions.useActionRegister> = null;
      let hoverNode: HTMLSpanElement | null = null;

      function TabLeaf() {
        renders.tab += 1;
        const tab = useStorePath<FilterState, FilterState['tab']>(routeStore, ['tab']);
        return <span data-testid="url-tab">{tab}</span>;
      }

      function PageLeaf() {
        renders.page += 1;
        const page = useStorePath<FilterState, number>(routeStore, ['page']);
        useEffect(() => {
          fetchedPages.push(page);
        }, [page]);
        return <span data-testid="url-page">{page}</span>;
      }

      function SortLeaf() {
        renders.sort += 1;
        const sort = useStorePath<FilterState, FilterState['sort']>(routeStore, ['sort']);
        return <span data-testid="url-sort">{sort}</span>;
      }

      function UrlAppShell() {
        renders.shell += 1;
        dispatchFn = Actions.useActionDispatch();
        registerRef = Actions.useActionRegister();
        const hoverIndicator = Refs.useRefController('hoverIndicator');

        const setHoverNode = useCallback(
          (node: HTMLSpanElement | null) => {
            hoverNode = node;
            hoverIndicator.setRef(node);
          },
          [hoverIndicator],
        );

        // Guard normalizes malformed external URL parameters before state update
        Actions.useActionGuard(
          'syncFromUrl',
          useCallback((payload, controller) => {
            const safeTab = VALID_TABS.has(payload.tab) ? payload.tab : 'overview';
            const safePage = Number.isFinite(payload.page) && payload.page >= 1
              ? Math.floor(payload.page)
              : 1;
            const safeSort = payload.sort === 'desc' ? 'desc' : 'asc';
            if (safeTab !== payload.tab || safePage !== payload.page || safeSort !== payload.sort) {
              controller.modifyPayload(() => ({
                tab: safeTab,
                page: safePage,
                sort: safeSort,
              }));
            }
          }, []),
        );

        Actions.useActionCommandHandler(
          'syncFromUrl',
          useCallback(next => {
            routeStore.update(draft => {
              if (draft.tab !== next.tab) draft.tab = next.tab;
              if (draft.page !== next.page) draft.page = next.page;
              if (draft.sort !== next.sort) draft.sort = next.sort;
            });
          }, []),
        );

        Actions.useActionCommandHandler(
          'setRouteFilter',
          useCallback(patch => {
            const prev = routeStore.getValue();
            const merged: FilterState = {
              tab: patch.tab ?? prev.tab,
              page: patch.page ?? prev.page,
              sort: patch.sort ?? prev.sort,
            };
            if (
              merged.tab === prev.tab
              && merged.page === prev.page
              && merged.sort === prev.sort
            ) {
              return;
            }
            routeStore.update(draft => {
              if (draft.tab !== merged.tab) draft.tab = merged.tab;
              if (draft.page !== merged.page) draft.page = merged.page;
              if (draft.sort !== merged.sort) draft.sort = merged.sort;
            });
            const nextUrl = serializeFilterToUrl(merged);
            const currentUrl = `${window.location.pathname}${window.location.search}`;
            if (nextUrl !== currentUrl) {
              window.history.pushState(null, '', nextUrl);
            }
          }, []),
        );

        Actions.useActionCommandHandler(
          'hoverRow',
          useCallback(
            payload => {
              hoverIndicator.executeIfMounted(el => {
                el.dataset.rowId = payload.rowId;
              });
            },
            [hoverIndicator],
          ),
        );

        useEffect(() => {
          const onPopState = () => {
            const params = new URLSearchParams(window.location.search);
            const unsafePayload: FilterState = {
              tab: (params.get('tab') ?? 'overview') as FilterState['tab'],
              page: Number(params.get('page') ?? '1'),
              sort: (params.get('sort') ?? 'asc') as FilterState['sort'],
            };
            void dispatchFn?.('syncFromUrl', unsafePayload);
          };
          window.addEventListener('popstate', onPopState);
          return () => window.removeEventListener('popstate', onPopState);
        }, []);

        return (
          <>
            <TabLeaf />
            <PageLeaf />
            <SortLeaf />
            <span ref={setHoverNode} data-testid="url-hover" />
          </>
        );
      }

      const view = render(
        <Actions.Provider>
          <Refs.Provider>
            <UrlAppShell />
          </Refs.Provider>
        </Actions.Provider>,
      );

      await waitFor(() => {
        expect(registerRef?.getHandlerCount('syncFromUrl')).toBe(2);
        expect(registerRef?.getHandlerCount('setRouteFilter')).toBe(1);
        expect(registerRef?.getHandlerCount('hoverRow')).toBe(1);
      });

      expect(renders).toEqual({ shell: 1, tab: 1, page: 1, sort: 1 });
      expect(fetchedPages).toEqual([1]);

      // 1. Browser popstate changes tab & page (sort remains 'asc') -> zero pushState loop!
      window.history.replaceState(null, '', '/?tab=orders&page=3&sort=asc');
      window.dispatchEvent(new PopStateEvent('popstate'));

      await waitFor(() => {
        expect(view.getByTestId('url-tab').textContent).toBe('orders');
        expect(view.getByTestId('url-page').textContent).toBe('3');
      });
      expect(view.getByTestId('url-sort').textContent).toBe('asc');
      expect(renders).toEqual({ shell: 1, tab: 2, page: 2, sort: 1 }); // SortLeaf untouched!
      expect(fetchedPages).toEqual([1, 3]);
      expect(pushStateSpy).toHaveBeenCalledTimes(0);

      // 2. App-initiated filter change updates only PageLeaf & pushes new URL once
      await act(async () => {
        await dispatchFn!('setRouteFilter', { page: 4 });
      });

      expect(window.location.search).toBe('?tab=orders&page=4&sort=asc');
      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      expect(renders).toEqual({ shell: 1, tab: 2, page: 3, sort: 1 });
      expect(fetchedPages).toEqual([1, 3, 4]);

      // Duplicate filter dispatch is a strict no-op (0 pushState calls, 0 renders)
      await act(async () => {
        await dispatchFn!('setRouteFilter', { page: 4 });
      });
      expect(pushStateSpy).toHaveBeenCalledTimes(1);
      expect(renders).toEqual({ shell: 1, tab: 2, page: 3, sort: 1 });

      // 3. Corrupted popstate URL (?tab=hacked&page=-9&sort=invalid) clamped by guard
      window.history.replaceState(null, '', '/?tab=hacked&page=-9&sort=invalid');
      window.dispatchEvent(new PopStateEvent('popstate'));

      await waitFor(() => {
        expect(routeStore.getValue()).toEqual({ tab: 'overview', page: 1, sort: 'asc' });
        expect(view.getByTestId('url-tab').textContent).toBe('overview');
        expect(view.getByTestId('url-page').textContent).toBe('1');
      });
      expect(fetchedPages).toEqual([1, 3, 4, 1]);
      expect(pushStateSpy).toHaveBeenCalledTimes(1);

      // 4. Fast-lane hoverRow x 50 updates DOM ref with 0 renders & 0 URL pushes
      const rendersBeforeHover = { ...renders };
      await act(async () => {
        for (let i = 1; i <= 50; i += 1) {
          await dispatchFn!('hoverRow', { rowId: `row-${i}` });
        }
      });
      expect(hoverNode!.dataset.rowId).toBe('row-50');
      expect(renders).toEqual(rendersBeforeHover);
      expect(pushStateSpy).toHaveBeenCalledTimes(1);

      await act(async () => {
        view.unmount();
      });
      routeStore.dispose();
    });
  });

  // ---------------------------------------------------------------------------
  // Scenario 3: Realtime Stream
  // ---------------------------------------------------------------------------
  describe('Scenario 3: Realtime WebSocket burst coalescing, fast-lane ticker ref, notifyPath alerts, sequence guard, and reconnect resync', () => {
    interface MarketState {
      connection: 'connected' | 'reconnecting';
      lastSeq: number;
      quotes: {
        AAPL: number;
        MSFT: number;
      };
      alerts: {
        unread: number;
        lastAlert: string | null;
      };
    }

    interface MarketActionMap {
      liveTick: { symbol: 'AAPL' | 'MSFT'; price: number };
      applyDelta: { seq: number; symbol: 'AAPL' | 'MSFT'; price: number };
      setConnection: { connection: 'connected' | 'reconnecting' };
      resyncSnapshot: { seq: number; quotes: { AAPL: number; MSFT: number } };
    }

    it('coalesces 50 delta bursts, drops out-of-order packets, isolates notifyPath alerts, and resyncs after reconnect', async () => {
      const channel = new FakeRealtimeChannel();
      const Actions = createActionContext<MarketActionMap>('RealtimeMarket', {
        actions: {
          liveTick: { lane: 'fast' },
          applyDelta: { lane: 'orchestrated', queue: 'serial' },
          setConnection: { lane: 'orchestrated', queue: 'serial' },
          resyncSnapshot: { lane: 'orchestrated', queue: 'serial' },
        },
      });
      const Refs = createRefContext('RealtimeMarketRefs', {
        sparkline: {
          name: 'sparkline',
          autoCleanup: true,
          validator: (target: unknown): target is HTMLSpanElement =>
            target instanceof HTMLSpanElement,
        },
      });

      const marketStore = createStore<MarketState>(
        'realtime-market-store',
        {
          connection: 'connected',
          lastSeq: 0,
          quotes: { AAPL: 180, MSFT: 410 },
          alerts: { unread: 0, lastAlert: null },
        },
        { notificationMode: 'batched' },
      );

      // External non-frozen alert buffer triggered surgically via `store.notifyPath(['alerts'])`
      let externalUnreadAlerts = 0;

      const renders = { shell: 0, connection: 0, aapl: 0, msft: 0, alerts: 0, sparkline: 0 };
      const rejectedSeqs: number[] = [];
      let dispatchFn: ReturnType<typeof Actions.useActionDispatch> | undefined;
      let registerRef: ReturnType<typeof Actions.useActionRegister> = null;
      let sparkNode: HTMLSpanElement | null = null;

      function ConnectionLeaf() {
        renders.connection += 1;
        const conn = useStorePath<MarketState, MarketState['connection']>(marketStore, ['connection']);
        return <span data-testid="rt-conn">{conn}</span>;
      }

      function AAPLLeaf() {
        renders.aapl += 1;
        const price = useStorePath<MarketState, number>(marketStore, ['quotes', 'AAPL']);
        return <span data-testid="rt-aapl">{price}</span>;
      }

      function MSFTLeaf() {
        renders.msft += 1;
        const price = useStorePath<MarketState, number>(marketStore, ['quotes', 'MSFT']);
        return <span data-testid="rt-msft">{price}</span>;
      }

      function AlertLeaf() {
        renders.alerts += 1;
        const unread = useSyncExternalStore(
          useCallback(
            callback =>
              marketStore.subscribeWithPatches(patches => {
                if (patchesAffectPath(patches, ['alerts'])) {
                  callback();
                }
              }),
            [],
          ),
          () => externalUnreadAlerts,
          () => externalUnreadAlerts,
        );
        return <span data-testid="rt-alerts">{unread}</span>;
      }

      function SparklineOverlay() {
        renders.sparkline += 1;
        const sparkline = Refs.useRefController('sparkline');
        const setSparkRef = useCallback(
          (node: HTMLSpanElement | null) => {
            sparkNode = node;
            sparkline.setRef(node);
          },
          [sparkline],
        );

        Actions.useActionCommandHandler(
          'liveTick',
          useCallback(
            payload => {
              sparkline.executeIfMounted(el => {
                el.dataset.lastSymbol = payload.symbol;
                el.dataset.lastPrice = String(payload.price);
              });
            },
            [sparkline],
          ),
        );

        return <span ref={setSparkRef} data-testid="rt-sparkline" />;
      }

      function MarketShell() {
        renders.shell += 1;
        const dispatch = Actions.useActionDispatch();
        dispatchFn = dispatch;
        registerRef = Actions.useActionRegister();

        Actions.useActionGuard(
          'applyDelta',
          useCallback((payload, controller) => {
            const currentSeq = marketStore.getValue().lastSeq;
            if (payload.seq <= currentSeq) {
              rejectedSeqs.push(payload.seq);
              controller.abort(`stale or duplicate seq ${payload.seq} <= ${currentSeq}`);
            }
          }, []),
        );

        Actions.useActionCommandHandler(
          'applyDelta',
          useCallback(payload => {
            marketStore.update(draft => {
              draft.lastSeq = payload.seq;
              draft.quotes[payload.symbol] = payload.price;
            });
          }, []),
        );

        Actions.useActionCommandHandler(
          'setConnection',
          useCallback(payload => {
            marketStore.update(draft => {
              draft.connection = payload.connection;
            });
          }, []),
        );

        Actions.useActionCommandHandler(
          'resyncSnapshot',
          useCallback(payload => {
            marketStore.update(draft => {
              draft.connection = 'connected';
              draft.lastSeq = payload.seq;
              if (draft.quotes.AAPL !== payload.quotes.AAPL) {
                draft.quotes.AAPL = payload.quotes.AAPL;
              }
              if (draft.quotes.MSFT !== payload.quotes.MSFT) {
                draft.quotes.MSFT = payload.quotes.MSFT;
              }
            });
          }, []),
        );

        useEffect(() => {
          return channel.subscribe(msg => {
            if (msg.type === 'tick') {
              void dispatch('liveTick', { symbol: msg.symbol, price: msg.price });
            } else if (msg.type === 'delta') {
              void dispatch('applyDelta', {
                seq: msg.seq,
                symbol: msg.symbol,
                price: msg.price,
              });
            } else if (msg.type === 'disconnect') {
              void dispatch('setConnection', { connection: 'reconnecting' });
            } else if (msg.type === 'reconnect-snapshot') {
              void dispatch('resyncSnapshot', {
                seq: msg.seq,
                quotes: msg.quotes,
              });
            }
          });
        }, [dispatch]);

        return (
          <>
            <ConnectionLeaf />
            <AAPLLeaf />
            <MSFTLeaf />
            <AlertLeaf />
            <SparklineOverlay />
          </>
        );
      }

      const view = render(
        <Actions.Provider>
          <Refs.Provider>
            <MarketShell />
          </Refs.Provider>
        </Actions.Provider>,
      );

      await waitFor(() => {
        expect(registerRef?.getHandlerCount('liveTick')).toBe(1);
        expect(registerRef?.getHandlerCount('applyDelta')).toBe(2);
        expect(registerRef?.getHandlerCount('setConnection')).toBe(1);
        expect(registerRef?.getHandlerCount('resyncSnapshot')).toBe(1);
      });

      expect(renders).toEqual({
        shell: 1,
        connection: 1,
        aapl: 1,
        msft: 1,
        alerts: 1,
        sparkline: 1,
      });

      // 1. High-frequency liveTick x 300 on lane: 'fast' -> direct DOM update, 0 React re-renders
      await act(async () => {
        for (let i = 1; i <= 300; i += 1) {
          channel.emit({ type: 'tick', symbol: 'AAPL', price: 180 + i * 0.1 });
        }
      });
      expect(sparkNode!.dataset.lastSymbol).toBe('AAPL');
      expect(sparkNode!.dataset.lastPrice).toBe('210');
      expect(renders).toEqual({
        shell: 1,
        connection: 1,
        aapl: 1,
        msft: 1,
        alerts: 1,
        sparkline: 1,
      });

      // 2. Burst of 50 sequential AAPL delta messages coalesces via notificationMode: 'batched'
      const aaplRendersBeforeBurst = renders.aapl;
      for (let seq = 1; seq <= 50; seq += 1) {
        channel.emit({ type: 'delta', seq, symbol: 'AAPL', price: 180 + seq });
      }

      await waitFor(() => {
        expect(view.getByTestId('rt-aapl').textContent).toBe('230');
      });

      const aaplRendersAfterBurst = renders.aapl - aaplRendersBeforeBurst;
      expect(aaplRendersAfterBurst).toBeGreaterThanOrEqual(1);
      expect(aaplRendersAfterBurst).toBeLessThanOrEqual(2); // Coalesced from 50 messages into 1-2 commits
      expect(renders.msft).toBe(1);
      expect(renders.connection).toBe(1);
      expect(renders.alerts).toBe(1);
      expect(renders.shell).toBe(1);

      // 3. Out-of-order (seq 45) & duplicate (seq 50) packets rejected fail-closed by guard
      const staleResult = await registerRef!.dispatchWithResult('applyDelta', {
        seq: 45,
        symbol: 'AAPL',
        price: 999,
      });
      const dupResult = await registerRef!.dispatchWithResult('applyDelta', {
        seq: 50,
        symbol: 'AAPL',
        price: 888,
      });
      expect(staleResult.aborted).toBe(true);
      expect(dupResult.aborted).toBe(true);
      expect(rejectedSeqs).toEqual([45, 50]);
      expect(marketStore.getValue().quotes.AAPL).toBe(230);
      expect(view.getByTestId('rt-aapl').textContent).toBe('230');

      // 4. Surgical external alert wakeup via store.notifyPath(['alerts'])
      const aaplBeforeAlert = renders.aapl;
      const msftBeforeAlert = renders.msft;
      const connBeforeAlert = renders.connection;

      externalUnreadAlerts = 3;
      marketStore.notifyPath(['alerts']);

      await waitFor(() => {
        expect(view.getByTestId('rt-alerts').textContent).toBe('3');
      });
      expect(renders.alerts).toBe(2);
      expect(renders.aapl).toBe(aaplBeforeAlert);
      expect(renders.msft).toBe(msftBeforeAlert);
      expect(renders.connection).toBe(connBeforeAlert);
      expect(renders.shell).toBe(1);

      // 5. Disconnect -> Reconnect full snapshot resync without disturbing unchanged MSFTLeaf
      channel.emit({ type: 'disconnect' });
      await waitFor(() => {
        expect(view.getByTestId('rt-conn').textContent).toBe('reconnecting');
      });
      expect(renders.connection).toBe(2);
      expect(renders.msft).toBe(1);

      channel.emit({
        type: 'reconnect-snapshot',
        seq: 80,
        quotes: { AAPL: 245, MSFT: 410 },
      });
      await waitFor(() => {
        expect(view.getByTestId('rt-conn').textContent).toBe('connected');
        expect(view.getByTestId('rt-aapl').textContent).toBe('245');
      });
      expect(renders.msft).toBe(1); // MSFT stayed 410 -> still zero extra renders!

      // Post-resync stale packet seq 79 rejected; seq 81 for MSFT updates ONLY MSFTLeaf
      const stalePostResync = await registerRef!.dispatchWithResult('applyDelta', {
        seq: 79,
        symbol: 'MSFT',
        price: 1,
      });
      expect(stalePostResync.aborted).toBe(true);
      expect(rejectedSeqs).toEqual([45, 50, 79]);

      channel.emit({ type: 'delta', seq: 81, symbol: 'MSFT', price: 425 });
      await waitFor(() => {
        expect(view.getByTestId('rt-msft').textContent).toBe('425');
      });
      expect(renders.msft).toBe(2);

      if (process.env.BENCH_LOG === '1') {
        console.info('Realtime Stream Scenario Summary:', {
          burstMessages: 50,
          aaplBurstRenders: aaplRendersAfterBurst,
          fastTicks: 300,
          sparklineRenders: renders.sparkline,
          rejectedOutOfOrderSeqs: rejectedSeqs,
          finalRenders: renders,
        });
      }

      await act(async () => {
        view.unmount();
      });
      marketStore.dispose();
    });
  });
});
