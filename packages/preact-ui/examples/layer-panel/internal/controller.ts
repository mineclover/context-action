import type { LayerItem, LayerPanelInput } from '../public.js';

export interface LayerPanelSnapshot {
  readonly items: readonly LayerItem[];
  readonly selectedId: string | null;
  readonly disabled: boolean;
}

function copyItems(items: readonly LayerItem[]): readonly LayerItem[] {
  if (!Array.isArray(items)) throw new TypeError('items must be an array');
  const ids = new Set<string>();
  return Object.freeze(items.map((item: LayerItem) => {
    if (!item || typeof item.id !== 'string' || typeof item.name !== 'string') {
      throw new TypeError('Each item requires string id and name');
    }
    if (!item.id.trim() || ids.has(item.id)) {
      throw new RangeError('Item ids must be nonempty and unique');
    }
    ids.add(item.id);
    return Object.freeze({ id: item.id, name: item.name });
  }));
}

/** Pure input authority, with no dependency on Preact or a browser. */
export function createLayerPanelController(initial: LayerPanelInput = {}) {
  let snapshot: LayerPanelSnapshot = Object.freeze({ items: Object.freeze([]), selectedId: null, disabled: false });
  const listeners = new Set<() => void>();
  function commit(next: LayerPanelSnapshot) {
    snapshot = Object.freeze(next);
    for (const notify of [...listeners]) notify();
  }
  const controller = {
    getSnapshot: () => snapshot,
    setItems(items: readonly LayerItem[]) {
      // Validate/copy before committing so invalid input cannot replace state.
      commit({ ...snapshot, items: copyItems(items) });
    },
    setSelectedId(id: string | null) {
      if (id !== null && typeof id !== 'string') throw new TypeError('selectedId must be string or null');
      if (id !== snapshot.selectedId) commit({ ...snapshot, selectedId: id });
    },
    setDisabled(disabled: boolean) {
      if (typeof disabled !== 'boolean') throw new TypeError('disabled must be boolean');
      if (disabled !== snapshot.disabled) commit({ ...snapshot, disabled });
    },
    canRequest(id: string) {
      return !snapshot.disabled && snapshot.selectedId !== id && snapshot.items.some(item => item.id === id);
    },
    subscribe(notify: () => void) {
      listeners.add(notify);
      return () => { listeners.delete(notify); };
    },
  };
  if (initial.items !== undefined) controller.setItems(initial.items);
  if (initial.selectedId !== undefined) controller.setSelectedId(initial.selectedId);
  if (initial.disabled !== undefined) controller.setDisabled(initial.disabled);
  return controller;
}

export type LayerPanelController = ReturnType<typeof createLayerPanelController>;
