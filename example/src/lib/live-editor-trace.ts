import {
  createToolCallTraceStore,
  formatToolTraceId,
  type ToolTraceEntry,
} from './tool-call-trace';

export type LiveEditorTraceEntry = ToolTraceEntry;

export const formatLiveEditorTraceId = formatToolTraceId;

const store = createToolCallTraceStore();

export const recordLiveEditorToolCall = store.record;
export const clearLiveEditorTrace = store.clear;
export const liveEditorTraceStore = {
  getSnapshot: store.getSnapshot,
  subscribe: store.subscribe,
};
