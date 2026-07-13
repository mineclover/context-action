/**
 * Parent/iframe contracts for the Live Code Editor preview.
 *
 * The parent owns the editable document and revision. The iframe receives a
 * controlled projection and only renders it; it never evaluates editor code.
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

export type LiveEditorParentMessage = {
  readonly channel: typeof LIVE_EDITOR_BRIDGE_CHANNEL;
  readonly type: 'editor:init' | 'editor:document';
  readonly document: LiveEditorDocumentSnapshot;
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
  private readonly listeners = new Set<LiveEditorDocumentListener>();

  constructor(initialDocument: LiveEditorDocument) {
    this.snapshot = { ...initialDocument, revision: 0 };
  }

  getSnapshot = (): LiveEditorDocumentSnapshot => this.snapshot;

  subscribe = (listener: LiveEditorDocumentListener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
  type: LiveEditorParentMessage['type'] = 'editor:document'
): LiveEditorParentMessage {
  return {
    channel: LIVE_EDITOR_BRIDGE_CHANNEL,
    type,
    document: snapshot,
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
      (candidate.revision === undefined || typeof candidate.revision === 'number')
    );
  }
  return false;
}
