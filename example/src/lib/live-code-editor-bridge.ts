/**
 * Parent/iframe contracts for the Live Code Editor preview.
 *
 * The parent owns the editable document, revision, and workspace projection.
 * The iframe only evaluates an explicitly selected workspace HTML entry inside
 * its sandbox; regular editor documents remain text-only projections.
 */

export const LIVE_EDITOR_BRIDGE_CHANNEL = 'context-action.live-editor';

export interface LiveEditorDocument {
  readonly exampleId: string;
  readonly file: string;
  readonly source: string;
  readonly scenario: string;
}

export interface LiveEditorDocumentSnapshot extends LiveEditorDocument {
  readonly revision: number;
}

export interface LiveEditorPreviewStatus {
  readonly state: 'pending' | 'rendered' | 'timeout';
  readonly revision: number;
}

export interface LiveEditorPreviewFile {
  readonly path: string;
  readonly source: string;
  readonly mimeType?: string;
  readonly url?: string;
}

export interface LiveEditorPreviewPayload {
  readonly execute: boolean;
  readonly entryPath?: string;
  readonly files: readonly LiveEditorPreviewFile[];
}

export type LiveEditorParentMessage = {
  readonly channel: typeof LIVE_EDITOR_BRIDGE_CHANNEL;
  readonly type: 'editor:init' | 'editor:document';
  readonly document: LiveEditorDocumentSnapshot;
  readonly preview?: LiveEditorPreviewPayload;
};

export type LiveEditorChildMessage =
  | {
      readonly channel: typeof LIVE_EDITOR_BRIDGE_CHANNEL;
      readonly type: 'editor:ready';
    }
  | {
      readonly channel: typeof LIVE_EDITOR_BRIDGE_CHANNEL;
      readonly type: 'editor:rendered';
      readonly revision: number;
    }
  | {
      readonly channel: typeof LIVE_EDITOR_BRIDGE_CHANNEL;
      readonly type: 'editor:error';
      readonly message: string;
      readonly revision?: number;
    };

export type LiveEditorDocumentListener = (
  snapshot: LiveEditorDocumentSnapshot
) => void;

export class LiveEditorDocumentManager {
  private snapshot: LiveEditorDocumentSnapshot;
  private renderedRevision = -1;
  private readonly listeners = new Set<LiveEditorDocumentListener>();
  private readonly renderWaiters = new Map<
    number,
    Set<(status: LiveEditorPreviewStatus) => void>
  >();

  constructor(initialDocument: LiveEditorDocument) {
    this.snapshot = { ...initialDocument, revision: 0 };
  }

  getSnapshot = (): LiveEditorDocumentSnapshot => this.snapshot;

  subscribe = (listener: LiveEditorDocumentListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getPreviewStatus = (): LiveEditorPreviewStatus => ({
    state:
      this.renderedRevision >= this.snapshot.revision ? 'rendered' : 'pending',
    revision: this.renderedRevision,
  });

  markRendered = (revision: number): void => {
    if (revision < this.renderedRevision) return;
    this.renderedRevision = revision;
    for (const [requestedRevision, waiters] of this.renderWaiters) {
      if (requestedRevision > revision) continue;
      for (const resolve of waiters) {
        resolve({ state: 'rendered', revision });
      }
      this.renderWaiters.delete(requestedRevision);
    }
  };

  waitForRendered = (
    revision: number,
    timeoutMs = 2_000
  ): Promise<LiveEditorPreviewStatus> => {
    if (this.renderedRevision >= revision) {
      return Promise.resolve({
        state: 'rendered',
        revision: this.renderedRevision,
      });
    }

    return new Promise((resolve) => {
      const waiters = this.renderWaiters.get(revision) ?? new Set();
      this.renderWaiters.set(revision, waiters);
      const waiter = (status: LiveEditorPreviewStatus) => {
        clearTimeout(timeout);
        resolve(status);
      };
      const timeout = setTimeout(() => {
        waiters.delete(waiter);
        if (waiters.size === 0) this.renderWaiters.delete(revision);
        resolve({ state: 'timeout', revision: this.renderedRevision });
      }, timeoutMs);
      waiters.add(waiter);
    });
  };

  update(patch: Partial<LiveEditorDocument>): LiveEditorDocumentSnapshot {
    this.snapshot = {
      ...this.snapshot,
      ...patch,
      revision: this.snapshot.revision + 1,
    };
    for (const listener of this.listeners) listener(this.snapshot);
    return this.snapshot;
  }
}

export function createLiveEditorDocumentMessage(
  snapshot: LiveEditorDocumentSnapshot,
  type: LiveEditorParentMessage['type'] = 'editor:document',
  preview?: LiveEditorPreviewPayload
): LiveEditorParentMessage {
  return {
    channel: LIVE_EDITOR_BRIDGE_CHANNEL,
    type,
    document: snapshot,
    ...(preview ? { preview } : {}),
  };
}

export function isLiveEditorChildMessage(
  value: unknown
): value is LiveEditorChildMessage {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.channel !== LIVE_EDITOR_BRIDGE_CHANNEL) return false;

  if (candidate.type === 'editor:ready') return true;
  if (candidate.type === 'editor:rendered') {
    return typeof candidate.revision === 'number';
  }
  if (candidate.type === 'editor:error') {
    return (
      typeof candidate.message === 'string' &&
      (candidate.revision === undefined ||
        typeof candidate.revision === 'number')
    );
  }
  return false;
}
