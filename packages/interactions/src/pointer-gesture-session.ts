export interface PointerGestureModifiers {
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
}

export interface PointerGestureSnapshot {
  readonly active: boolean;
  readonly pointerId: number | null;
  readonly startX: number;
  readonly startY: number;
  readonly currentX: number;
  readonly currentY: number;
  readonly deltaX: number;
  readonly deltaY: number;
  readonly modifiers: PointerGestureModifiers;
}

export interface PointerCaptureTargetLike {
  setPointerCapture?(pointerId: number): void;
  releasePointerCapture?(pointerId: number): void;
}

export interface PointerGestureEventLike {
  readonly pointerId?: number | undefined;
  readonly button?: number | undefined;
  readonly clientX: number;
  readonly clientY: number;
  readonly shiftKey?: boolean | undefined;
  readonly altKey?: boolean | undefined;
  readonly ctrlKey?: boolean | undefined;
  readonly metaKey?: boolean | undefined;
  readonly currentTarget?: PointerCaptureTargetLike | null | undefined;
}

export interface PointerGestureKeyEventLike {
  readonly key: string;
  preventDefault?(): void;
}

export interface PointerGestureOptions {
  // biome-ignore lint/suspicious/noConfusingVoidType: callback intentionally allows boolean or void.
  onStart?: ((snapshot: PointerGestureSnapshot) => boolean | void) | undefined;
  onMove?: ((snapshot: PointerGestureSnapshot) => void) | undefined;
  onCommit?: ((snapshot: PointerGestureSnapshot) => void) | undefined;
  onCancel?: ((snapshot: PointerGestureSnapshot, reason?: string) => void) | undefined;
}

export interface PointerGestureSession {
  start(event: PointerGestureEventLike): boolean;
  move(event: PointerGestureEventLike): boolean;
  commit(event?: PointerGestureEventLike): boolean;
  cancel(reason?: string): boolean;
  handleKeyDown(event: PointerGestureKeyEventLike): boolean;
  isActive(): boolean;
  getSnapshot(): PointerGestureSnapshot;
  dispose(): void;
}

const DEFAULT_MODIFIERS: PointerGestureModifiers = {
  shiftKey: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
};

function readModifiers(event: Partial<PointerGestureEventLike>): PointerGestureModifiers {
  return {
    shiftKey: Boolean(event.shiftKey),
    altKey: Boolean(event.altKey),
    ctrlKey: Boolean(event.ctrlKey),
    metaKey: Boolean(event.metaKey),
  };
}

function createIdleSnapshot(): PointerGestureSnapshot {
  return {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    deltaX: 0,
    deltaY: 0,
    modifiers: { ...DEFAULT_MODIFIERS },
  };
}

function cloneSnapshot(snapshot: PointerGestureSnapshot): PointerGestureSnapshot {
  return {
    ...snapshot,
    modifiers: { ...snapshot.modifiers },
  };
}

export function createPointerGestureSession(
  options: PointerGestureOptions = {},
): PointerGestureSession {
  let disposed = false;
  let snapshot = createIdleSnapshot();
  let captureTarget: PointerCaptureTargetLike | null = null;

  const releaseCapture = (): void => {
    if (captureTarget && snapshot.pointerId !== null) {
      try {
        captureTarget.releasePointerCapture?.(snapshot.pointerId);
      } catch {
        // Ignore capture release errors when target is detached or synthetic.
      }
    }
    captureTarget = null;
  };

  return {
    start(event) {
      if (disposed || snapshot.active) return false;
      if (event.button !== undefined && event.button !== 0) return false;

      const pointerId = event.pointerId ?? 0;
      const next: PointerGestureSnapshot = {
        active: true,
        pointerId,
        startX: event.clientX,
        startY: event.clientY,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX: 0,
        deltaY: 0,
        modifiers: readModifiers(event),
      };

      const verdict = options.onStart?.(cloneSnapshot(next));
      if (verdict === false || disposed) return false;

      snapshot = next;
      captureTarget = event.currentTarget ?? null;
      if (captureTarget) {
        try {
          captureTarget.setPointerCapture?.(pointerId);
        } catch {
          // Ignore synthetic DOM pointer capture errors.
        }
      }
      return true;
    },
    move(event) {
      if (disposed || !snapshot.active) return false;
      if (event.pointerId !== undefined && event.pointerId !== snapshot.pointerId) return false;

      snapshot = {
        ...snapshot,
        currentX: event.clientX,
        currentY: event.clientY,
        deltaX: event.clientX - snapshot.startX,
        deltaY: event.clientY - snapshot.startY,
        modifiers: readModifiers(event),
      };
      options.onMove?.(cloneSnapshot(snapshot));
      return true;
    },
    commit(event) {
      if (disposed || !snapshot.active) return false;
      if (event?.pointerId !== undefined && event.pointerId !== snapshot.pointerId) return false;

      if (event && Number.isFinite(event.clientX) && Number.isFinite(event.clientY)) {
        snapshot = {
          ...snapshot,
          currentX: event.clientX,
          currentY: event.clientY,
          deltaX: event.clientX - snapshot.startX,
          deltaY: event.clientY - snapshot.startY,
          modifiers: readModifiers(event),
        };
      }

      releaseCapture();
      snapshot = { ...snapshot, active: false };
      options.onCommit?.(cloneSnapshot(snapshot));
      return true;
    },
    cancel(reason) {
      if (disposed || !snapshot.active) return false;
      releaseCapture();
      snapshot = { ...snapshot, active: false };
      options.onCancel?.(cloneSnapshot(snapshot), reason);
      return true;
    },
    handleKeyDown(event) {
      if (disposed || !snapshot.active || event.key !== 'Escape') return false;
      event.preventDefault?.();
      this.cancel('escape');
      return true;
    },
    isActive() {
      return !disposed && snapshot.active;
    },
    getSnapshot() {
      return cloneSnapshot(snapshot);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      releaseCapture();
      snapshot = { ...snapshot, active: false };
    },
  };
}
