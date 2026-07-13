/**
 * Upload Store Context
 *
 * State management layer using the MutableStore pattern.
 * Demonstrates direct mutation with selective notifyPath notifications.
 */

import { createTimeTravelStoreContext } from '@context-action/react';
import type {
  FileUploadResult,
  ProcessState,
  UploadProgress,
} from '../services/FileUploadService';

/**
 * Single file upload state
 */
export interface FileUploadState {
  id: string;
  name: string;
  size: number;
  state: ProcessState;
  progress: UploadProgress;
  status: string;
  error: string | null;
  result: FileUploadResult | null;
}

/**
 * Upload store state definition
 */
export interface UploadStoreState {
  // Queue management
  queue: FileUploadState[];
  processing: boolean;
  currentIndex: number;

  // Statistics
  completedCount: number;
  failedCount: number;
  totalBytes: number;
  uploadedBytes: number;

  // Active upload (for detailed progress display)
  activeUpload: {
    fileId: string;
    name: string;
    state: ProcessState;
    progress: UploadProgress;
    status: string;
  } | null;
}

/**
 * Initial state factory
 */
const createInitialState = (): UploadStoreState => ({
  queue: [],
  processing: false,
  currentIndex: -1,
  completedCount: 0,
  failedCount: 0,
  totalBytes: 0,
  uploadedBytes: 0,
  activeUpload: null,
});

/**
 * MutableStore Context.
 * TimeTravelStore supplies structural sharing and path-aware notifications;
 * this example intentionally does not expose or use its undo/redo controls.
 */
export const {
  Provider: UploadStoreProvider,
  useTimeTravelStore: useUploadStore,
  useStoreManager: useUploadStoreManager,
} = createTimeTravelStoreContext<{ upload: UploadStoreState }>('UploadStore', {
  upload: {
    initialValue: createInitialState(),
    mutable: true,
    maxHistory: 50,
  },
});

/**
 * Utility: Reset upload store to initial state
 */
export function resetUploadStore(
  store: ReturnType<typeof useUploadStore<'upload'>>
): void {
  store.setValue(createInitialState());
}

/**
 * Utility: Add files to upload queue
 */
export function addFilesToQueue(
  store: ReturnType<typeof useUploadStore<'upload'>>,
  files: File[]
): void {
  const state = store.getValue();

  const newFiles: FileUploadState[] = files.map((file) => ({
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: file.name,
    size: file.size,
    state: 'idle' as ProcessState,
    progress: { bytesUploaded: 0, totalBytes: file.size, percentage: 0 },
    status: '',
    error: null,
    result: null,
  }));

  // Path subscribers compare the selected value by reference. Replace the
  // array so queue subscribers observe the addition after notifyPaths().
  state.queue = [...state.queue, ...newFiles];
  state.totalBytes += files.reduce((sum, f) => sum + f.size, 0);

  store.notifyPaths([['queue'], ['totalBytes']]);
}

/**
 * Utility: Clear completed/failed uploads from queue
 */
export function clearProcessedUploads(
  store: ReturnType<typeof useUploadStore<'upload'>>
): void {
  const state = store.getValue();

  state.queue = state.queue.filter(
    (file) => file.state !== 'complete' && file.state !== 'error'
  );

  // Recalculate statistics
  const _processed = state.completedCount + state.failedCount;
  state.completedCount = 0;
  state.failedCount = 0;

  store.notifyPaths([['queue'], ['completedCount'], ['failedCount']]);
}
