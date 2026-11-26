/**
 * @fileoverview External Global State Synchronization Patterns Example
 *
 * Showcases 3 production external-sync architectures built with Context-Action:
 * 1. IndexedDB Write-Through + Scoped Multi-Store Atomic Rollback
 * 2. Bidirectional URL Query/History (`popstate` / `pushState`) Sync with Guard Normalization
 * 3. Realtime Stream Coalescing (`notificationMode: 'batched'`), Fast-Lane DOM Ticker, and Sequence Guard
 */

import React, { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
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

// =============================================================================
// 1. IndexedDB Persistence + Multi-Store Transaction Rollback Pattern
// =============================================================================

export interface PersistedNote {
  id: string;
  title: string;
}

export interface AsyncNotesBackend {
  getAll(): Promise<PersistedNote[]>;
  put(note: PersistedNote): Promise<void>;
}

interface NotesActionMap {
  draftPreview: { text: string };
  hydrateNotes: undefined;
  saveNote: PersistedNote;
}

export const NotesSyncActions = createActionContext<NotesActionMap>('NotesIdbSync', {
  actions: {
    draftPreview: { lane: 'fast' },
    hydrateNotes: { lane: 'orchestrated', queue: 'serial' },
    saveNote: { lane: 'orchestrated', queue: 'serial' },
  },
});

export const NotesSyncRefs = createRefContext('NotesIdbRefs', {
  draftBanner: {
    name: 'draftBanner',
    autoCleanup: true,
    validator: (target: unknown): target is HTMLSpanElement =>
      target instanceof HTMLSpanElement,
  },
});

export function NotesIndexedDbSyncExample({ backend }: { backend: AsyncNotesBackend }) {
  const coordinator = useMemo(() => new StoreTransactionCoordinator(), []);
  // Use `mutable: false` so nested array updates allocate fresh immutable references for `useStorePath`.
  const notesStore = useMemo(
    () =>
      createTimeTravelStore<{ items: PersistedNote[]; hydrated: boolean }>(
        'exampleIdbNotes',
        { items: [], hydrated: false },
        { mutable: false, notificationMode: 'immediate' },
      ),
    [],
  );
  const metaStore = useMemo(
    () =>
      createTimeTravelStore<{ savedCount: number }>(
        'exampleIdbMeta',
        { savedCount: 0 },
        { mutable: false, notificationMode: 'immediate' },
      ),
    [],
  );
  const errorStore = useMemo(
    () => createStore<{ message: string | null }>('exampleIdbError', { message: null }),
    [],
  );

  function NotesSurface() {
    const dispatch = NotesSyncActions.useActionDispatch();
    const register = NotesSyncActions.useActionRegister();
    const draftBanner = NotesSyncRefs.useRefController('draftBanner');
    const items = useStorePath<{ items: PersistedNote[]; hydrated: boolean }, PersistedNote[]>(
      notesStore,
      ['items'],
    );
    const savedCount = useStorePath<{ savedCount: number }, number>(metaStore, ['savedCount']);
    const errorMessage = useStorePath<{ message: string | null }, string | null>(
      errorStore,
      ['message'],
    );

    useEffect(() => {
      if (!register) return undefined;
      return bindActionTransactions(register, coordinator, {
        actions: ['saveNote'],
        getParticipants: () => [
          { name: 'notes', store: notesStore },
          { name: 'meta', store: metaStore },
        ],
      });
    }, [register]);

    NotesSyncActions.useActionCommandHandler(
      'draftPreview',
      useCallback(
        payload => {
          draftBanner.executeIfMounted(el => {
            el.textContent = payload.text;
          });
        },
        [draftBanner],
      ),
    );

    NotesSyncActions.useActionCommandHandler(
      'hydrateNotes',
      useCallback(async () => {
        const rows = await backend.getAll();
        notesStore.update(draft => {
          draft.items = rows;
          draft.hydrated = true;
        });
        metaStore.update(draft => {
          draft.savedCount = rows.length;
        });
      }, []),
    );

    // `errorPolicy: 'fatal'` ensures IndexedDB failure rolls back both stores via bindActionTransactions.
    NotesSyncActions.useActionCommandHandler(
      'saveNote',
      useCallback(async note => {
        notesStore.update(draft => {
          draft.items.push(note);
        });
        metaStore.update(draft => {
          draft.savedCount += 1;
        });
        errorStore.update(draft => {
          draft.message = null;
        });
        await backend.put(note);
      }, []),
      { errorPolicy: 'fatal' },
    );

    NotesSyncActions.useActionObserver(
      'saveNote',
      useCallback(event => {
        const firstErr = event.errors[0]?.error;
        errorStore.update(draft => {
          draft.message = firstErr instanceof Error ? firstErr.message : 'Write failed';
        });
      }, []),
      { when: 'failure' },
    );

    return (
      <div>
        <div>Saved notes ({savedCount}): {items.map(n => n.title).join(', ')}</div>
        {errorMessage ? <div>Error: {errorMessage}</div> : null}
        <span ref={draftBanner.setRef}>Draft idle</span>
        <button type="button" onClick={() => void dispatch('hydrateNotes')}>
          Hydrate
        </button>
        <button
          type="button"
          onClick={() => void dispatch('saveNote', { id: String(Date.now()), title: 'New Note' })}
        >
          Save Note
        </button>
      </div>
    );
  }

  return (
    <NotesSyncActions.Provider>
      <NotesSyncRefs.Provider>
        <NotesSurface />
      </NotesSyncRefs.Provider>
    </NotesSyncActions.Provider>
  );
}

// =============================================================================
// 2. Bidirectional URL Query / History Sync Pattern
// =============================================================================

export interface QueryFilterState {
  tab: 'overview' | 'orders';
  page: number;
}

interface UrlSyncActions {
  syncFromUrl: QueryFilterState;
  setFilter: Partial<QueryFilterState>;
}

export const UrlSyncActionContext = createActionContext<UrlSyncActions>('ExampleUrlSync', {
  actions: {
    syncFromUrl: { lane: 'orchestrated', queue: 'serial' },
    setFilter: { lane: 'orchestrated', queue: 'serial' },
  },
});

export const urlFilterStore = createStore<QueryFilterState>('exampleUrlFilter', {
  tab: 'overview',
  page: 1,
});

export function UrlQuerySyncExample() {
  function FilterLeafs() {
    const dispatch = UrlSyncActionContext.useActionDispatch();
    const tab = useStorePath<QueryFilterState, QueryFilterState['tab']>(urlFilterStore, ['tab']);
    const page = useStorePath<QueryFilterState, number>(urlFilterStore, ['page']);

    UrlSyncActionContext.useActionGuard(
      'syncFromUrl',
      useCallback((payload, controller) => {
        const normalizedTab = payload.tab === 'orders' ? 'orders' : 'overview';
        const normalizedPage =
          Number.isFinite(payload.page) && payload.page >= 1 ? Math.floor(payload.page) : 1;
        if (normalizedTab !== payload.tab || normalizedPage !== payload.page) {
          controller.modifyPayload(() => ({
            tab: normalizedTab,
            page: normalizedPage,
          }));
        }
      }, []),
    );

    UrlSyncActionContext.useActionCommandHandler(
      'syncFromUrl',
      useCallback(next => {
        urlFilterStore.update(draft => {
          if (draft.tab !== next.tab) draft.tab = next.tab;
          if (draft.page !== next.page) draft.page = next.page;
        });
      }, []),
    );

    UrlSyncActionContext.useActionCommandHandler(
      'setFilter',
      useCallback(patch => {
        const prev = urlFilterStore.getValue();
        const next: QueryFilterState = {
          tab: patch.tab ?? prev.tab,
          page: patch.page ?? prev.page,
        };
        if (next.tab === prev.tab && next.page === prev.page) return;
        urlFilterStore.update(draft => {
          if (draft.tab !== next.tab) draft.tab = next.tab;
          if (draft.page !== next.page) draft.page = next.page;
        });
        const targetUrl = `/?tab=${next.tab}&page=${next.page}`;
        if (`${window.location.pathname}${window.location.search}` !== targetUrl) {
          window.history.pushState(null, '', targetUrl);
        }
      }, []),
    );

    useEffect(() => {
      const onPopState = () => {
        const params = new URLSearchParams(window.location.search);
        void dispatch('syncFromUrl', {
          tab: params.get('tab') === 'orders' ? 'orders' : 'overview',
          page: Number(params.get('page') ?? '1'),
        });
      };
      window.addEventListener('popstate', onPopState);
      return () => window.removeEventListener('popstate', onPopState);
    }, [dispatch]);

    return (
      <div>
        <span>Tab: {tab} | Page: {page}</span>
        <button type="button" onClick={() => void dispatch('setFilter', { page: page + 1 })}>
          Next Page
        </button>
      </div>
    );
  }

  return (
    <UrlSyncActionContext.Provider>
      <FilterLeafs />
    </UrlSyncActionContext.Provider>
  );
}

// =============================================================================
// 3. Realtime Stream Coalescing + Fast-Lane DOM Ticker + notifyPath Pattern
// =============================================================================

interface StreamActionMap {
  liveTick: { price: number };
  applyDelta: { seq: number; price: number };
}

export const RealtimeActionContext = createActionContext<StreamActionMap>('ExampleRealtimeSync', {
  actions: {
    liveTick: { lane: 'fast' },
    applyDelta: { lane: 'orchestrated', queue: 'serial' },
  },
});

export const RealtimeRefs = createRefContext('ExampleRealtimeRefs', {
  tickerEl: {
    name: 'tickerEl',
    autoCleanup: true,
    validator: (target: unknown): target is HTMLSpanElement =>
      target instanceof HTMLSpanElement,
  },
});

interface StreamStoreState {
  lastSeq: number;
  price: number;
  alerts: { unread: number };
}

export const streamStore = createStore<StreamStoreState>(
  'exampleStreamStore',
  { lastSeq: 0, price: 100, alerts: { unread: 0 } },
  { notificationMode: 'batched' },
);

export function RealtimeStreamSyncExample() {
  let externalUnread = 0;

  function StreamView() {
    const tickerEl = RealtimeRefs.useRefController('tickerEl');
    const committedPrice = useStorePath<StreamStoreState, number>(streamStore, ['price']);

    // Custom surgical listener triggered via `streamStore.notifyPath(['alerts'])`
    const unreadAlerts = useSyncExternalStore(
      useCallback(
        callback =>
          streamStore.subscribeWithPatches(patches => {
            if (patches?.some(p => p.path[0] === 'alerts')) {
              callback();
            }
          }),
        [],
      ),
      () => externalUnread,
      () => externalUnread,
    );

    RealtimeActionContext.useActionCommandHandler(
      'liveTick',
      useCallback(
        payload => {
          tickerEl.executeIfMounted(el => {
            el.textContent = `Live: ${payload.price}`;
          });
        },
        [tickerEl],
      ),
    );

    RealtimeActionContext.useActionGuard(
      'applyDelta',
      useCallback((payload, controller) => {
        if (payload.seq <= streamStore.getValue().lastSeq) {
          controller.abort(`stale seq ${payload.seq}`);
        }
      }, []),
    );

    RealtimeActionContext.useActionCommandHandler(
      'applyDelta',
      useCallback(payload => {
        streamStore.update(draft => {
          draft.lastSeq = payload.seq;
          draft.price = payload.price;
        });
      }, []),
    );

    return (
      <div>
        <span ref={tickerEl.setRef}>Live: 100</span>
        <span>Committed (RAF batched): {committedPrice}</span>
        <span>Alerts: {unreadAlerts}</span>
      </div>
    );
  }

  return (
    <RealtimeActionContext.Provider>
      <RealtimeRefs.Provider>
        <StreamView />
      </RealtimeRefs.Provider>
    </RealtimeActionContext.Provider>
  );
}
