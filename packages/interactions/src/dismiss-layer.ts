export type DismissReason = 'escape' | 'outside-pointer';

export interface DismissLayerOptions {
  readonly enabled?: boolean | undefined;
  readonly dismissOnEscape?: boolean | undefined;
  readonly dismissOnOutsidePointer?: boolean | undefined;
  readonly ownerDocument?: Document | null | undefined;
  getContainers(): readonly (Node | null | undefined)[];
  isInside?(target: EventTarget | null, event: Event): boolean;
  onDismiss(reason: DismissReason, event: Event): void;
}

export interface DismissLayerHandle {
  readonly active: boolean;
  readonly isTopMost: boolean;
  activate(): void;
  deactivate(): void;
  dispose(): void;
}

interface DismissStackEntry {
  options: DismissLayerOptions;
  active: boolean;
  disposed: boolean;
}

interface DocumentDismissStack {
  readonly doc: Document;
  readonly entries: DismissStackEntry[];
  listenersAttached: boolean;
  readonly onKeyDown: (event: Event) => void;
  readonly onPointerDown: (event: Event) => void;
}

const documentStacks = new WeakMap<Document, DocumentDismissStack>();

function resolveTargetDocument(explicit?: Document | null): Document | null {
  if (explicit !== undefined) return explicit;
  return typeof document !== 'undefined' ? document : null;
}

function isEventInsideLayer(entry: DismissStackEntry, event: Event): boolean {
  if (entry.options.isInside?.(event.target, event)) {
    return true;
  }

  const targetNode =
    event.target !== null &&
    event.target !== undefined &&
    typeof (event.target as Partial<Node>).nodeType === 'number'
      ? (event.target as Node)
      : null;

  const composedPath =
    typeof event.composedPath === 'function' ? event.composedPath() : undefined;

  for (const container of entry.options.getContainers()) {
    if (!container) continue;
    if (targetNode && (container === targetNode || container.contains(targetNode))) {
      return true;
    }
    if (composedPath?.includes(container)) {
      return true;
    }
  }

  return false;
}

function getOrCreateDocumentStack(doc: Document): DocumentDismissStack {
  const existing = documentStacks.get(doc);
  if (existing) return existing;

  const entries: DismissStackEntry[] = [];

  const stack: DocumentDismissStack = {
    doc,
    entries,
    listenersAttached: false,
    onKeyDown(event: Event) {
      const top = entries[entries.length - 1];
      if (!top?.active || top.disposed) return;
      if (top.options.dismissOnEscape === false) return;
      if ((event as Partial<KeyboardEvent>).key !== 'Escape') return;
      event.preventDefault();
      top.options.onDismiss('escape', event);
    },
    onPointerDown(event: Event) {
      const top = entries[entries.length - 1];
      if (!top?.active || top.disposed) return;
      if (top.options.dismissOnOutsidePointer === false) return;
      if (isEventInsideLayer(top, event)) return;
      top.options.onDismiss('outside-pointer', event);
    },
  };

  documentStacks.set(doc, stack);
  return stack;
}

function syncDocumentListeners(stack: DocumentDismissStack): void {
  if (stack.entries.length > 0 && !stack.listenersAttached) {
    stack.doc.addEventListener('keydown', stack.onKeyDown, true);
    stack.doc.addEventListener('pointerdown', stack.onPointerDown, true);
    stack.listenersAttached = true;
    return;
  }

  if (stack.entries.length === 0 && stack.listenersAttached) {
    stack.doc.removeEventListener('keydown', stack.onKeyDown, true);
    stack.doc.removeEventListener('pointerdown', stack.onPointerDown, true);
    stack.listenersAttached = false;
  }
}

/**
 * Coordinates LIFO escape and outside-pointer dismissal across one or more
 * open overlay layers sharing a Document without leaking window/document listeners.
 */
export function createDismissLayer(options: DismissLayerOptions): DismissLayerHandle {
  const doc = resolveTargetDocument(options.ownerDocument);
  const entry: DismissStackEntry = {
    options,
    active: false,
    disposed: false,
  };

  const activate = (): void => {
    if (entry.disposed || !doc) return;
    const stack = getOrCreateDocumentStack(doc);
    const existingIndex = stack.entries.indexOf(entry);
    if (existingIndex >= 0) {
      if (existingIndex === stack.entries.length - 1) return;
      stack.entries.splice(existingIndex, 1);
    }
    entry.active = true;
    stack.entries.push(entry);
    syncDocumentListeners(stack);
  };

  const deactivate = (): void => {
    if (!doc || !entry.active) return;
    entry.active = false;
    const stack = documentStacks.get(doc);
    if (!stack) return;
    const idx = stack.entries.indexOf(entry);
    if (idx >= 0) {
      stack.entries.splice(idx, 1);
    }
    syncDocumentListeners(stack);
  };

  const dispose = (): void => {
    deactivate();
    entry.disposed = true;
  };

  if (options.enabled) {
    activate();
  }

  return {
    get active() {
      return entry.active;
    },
    get isTopMost() {
      if (!entry.active || !doc) return false;
      const stack = documentStacks.get(doc);
      return Boolean(stack && stack.entries[stack.entries.length - 1] === entry);
    },
    activate,
    deactivate,
    dispose,
  };
}
