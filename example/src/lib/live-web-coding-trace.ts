import {
  createToolCallTraceStore,
  formatToolTraceId,
  type ToolTraceEntry,
} from './tool-call-trace';

export type LiveWebCodingTraceEntry = ToolTraceEntry;

export const formatLiveWebCodingTraceId = formatToolTraceId;

const store = createToolCallTraceStore();

export const recordLiveWebCodingToolCall = store.record;
export const recordLiveWebCodingToolList = store.recordToolList;
export const clearLiveWebCodingTrace = store.clear;
export const liveWebCodingTraceStore = {
  getSnapshot: store.getSnapshot,
  subscribe: store.subscribe,
};
