/**
 * Upload Handlers
 *
 * Orchestration layer that connects:
 * - Business Logic (FileUploadService)
 * - State Management (UploadStore)
 * - Actions (UploadActions)
 *
 * Demonstrates modular business logic integration pattern.
 */

import { useCallback, useRef } from 'react';
import { FileUploadService } from '../services/FileUploadService';
import {
  useUploadStore,
  useUploadStoreManager,
  addFilesToQueue,
  clearProcessedUploads,
  resetUploadStore,
} from '../contexts/UploadStoreContext';
import { useUploadActionHandler } from '../contexts/UploadActionContext';
import type { ProcessState, UploadProgress } from '../services/FileUploadService';

export function UploadHandlers({ children }: { children: React.ReactNode }) {
  const uploadStore = useUploadStore('upload');
  const _storeManager = useUploadStoreManager();
  const uploadServiceRef = useRef(new FileUploadService());

  // Handler: Add files to queue
  const handleAddFiles = useCallback(
    (payload: { files: File[] }) => {
      addFilesToQueue(uploadStore, payload.files);
    },
    [uploadStore]
  );

  // Handler: Clear entire queue
  const handleClearQueue = useCallback(() => {
    resetUploadStore(uploadStore);
  }, [uploadStore]);

  // Handler: Clear processed uploads
  const handleClearProcessed = useCallback(() => {
    clearProcessedUploads(uploadStore);
  }, [uploadStore]);

  // Handler: Remove single file
  const handleRemoveFile = useCallback(
    (payload: { fileId: string }) => {
      const state = uploadStore.getValue();
      const fileIndex = state.queue.findIndex((f) => f.id === payload.fileId);

      if (fileIndex >= 0) {
        const removedFile = state.queue[fileIndex]!;
        // Replace subscribed collections instead of mutating them in place.
        state.queue = state.queue.filter((_, index) => index !== fileIndex);
        state.totalBytes -= removedFile.size;

        uploadStore.notifyPaths([['queue'], ['totalBytes']]);
      }
    },
    [uploadStore]
  );

  // Handler: Start upload process
  const handleStartUpload = useCallback(async () => {
    const state = uploadStore.getValue();

    if (state.processing) {
      console.warn('Upload already in progress');
      return;
    }

    // Get files to upload (idle or error state)
    const filesToUpload = state.queue.filter(
      (f) => f.state === 'idle' || f.state === 'error'
    );

    if (filesToUpload.length === 0) {
      console.info('No files to upload');
      return;
    }

    // Start processing
    state.processing = true;
    uploadStore.notifyPath(['processing']);

    const uploadService = uploadServiceRef.current;

    for (let i = 0; i < state.queue.length; i++) {
      const fileState = state.queue[i]!;

      // Skip already completed files
      if (fileState.state === 'complete') {
        continue;
      }

      // Create File object (simulated)
      const file = new File(
        [new ArrayBuffer(fileState.size)],
        fileState.name,
        { type: 'application/octet-stream' }
      );

      // Set current index
      state.currentIndex = i;
      uploadStore.notifyPath(['currentIndex']);

      // Set active upload
      state.activeUpload = {
        fileId: fileState.id,
        name: fileState.name,
        state: 'idle' as ProcessState,
        progress: { bytesUploaded: 0, totalBytes: fileState.size, percentage: 0 },
        status: '',
      };
      uploadStore.notifyPath(['activeUpload']);

      // Execute upload with business logic
      const result = await uploadService.completeUpload(file, {
        // State change callback
        onStateChange: (newState: ProcessState) => {
          const current = uploadStore.getValue();

          // Update queue item state
          if (current.queue[i] !== undefined) {
            current.queue[i]!.state = newState;
            uploadStore.notifyPath(['queue', i, 'state']);
          }

          // Update active upload state
          if (current.activeUpload) {
            current.activeUpload = {
              ...current.activeUpload,
              state: newState,
            };
            uploadStore.notifyPath(['activeUpload', 'state']);
          }
        },

        // Progress callback (progress-only updates)
        onProgress: (progress: UploadProgress) => {
          const current = uploadStore.getValue();

          // Update queue item progress
          if (current.queue[i] !== undefined) {
            current.queue[i]!.progress = progress;
            uploadStore.notifyPath(['queue', i, 'progress']);
          }

          // Update active upload progress
          if (current.activeUpload) {
            current.activeUpload = {
              ...current.activeUpload,
              progress,
            };
            uploadStore.notifyPath(['activeUpload', 'progress']);
          }

          // Update total uploaded bytes
          current.uploadedBytes = current.queue.reduce((sum, f) => {
            return sum + f.progress.bytesUploaded;
          }, 0);
          uploadStore.notifyPath(['uploadedBytes']);
        },

        // Status update callback
        onStatusUpdate: (status: string) => {
          const current = uploadStore.getValue();

          // Update queue item status
          if (current.queue[i] !== undefined) {
            current.queue[i]!.status = status;
            uploadStore.notifyPath(['queue', i, 'status']);
          }

          // Update active upload status
          if (current.activeUpload) {
            current.activeUpload = {
              ...current.activeUpload,
              status,
            };
            uploadStore.notifyPath(['activeUpload', 'status']);
          }
        },
      });

      // Handle result
      const current = uploadStore.getValue();

      if (result.success) {
        if (current.queue[i] !== undefined) {
          current.queue[i]!.result = result;
          current.queue[i]!.error = null;
        }
        current.completedCount++;
        uploadStore.notifyPaths([
          ['queue', i, 'result'],
          ['queue', i, 'error'],
          ['completedCount'],
        ]);
      } else {
        if (current.queue[i] !== undefined) {
          current.queue[i]!.error = result.error || 'Unknown error';
          current.queue[i]!.result = null;
        }
        current.failedCount++;
        uploadStore.notifyPaths([
          ['queue', i, 'error'],
          ['queue', i, 'result'],
          ['failedCount'],
        ]);
      }
    }

    // Complete processing
    const finalState = uploadStore.getValue();
    finalState.processing = false;
    finalState.currentIndex = -1;
    finalState.activeUpload = null;

    uploadStore.notifyPaths([
      ['processing'],
      ['currentIndex'],
      ['activeUpload'],
    ]);
  }, [uploadStore]);

  // Handler: Cancel upload
  const handleCancelUpload = useCallback(() => {
    const state = uploadStore.getValue();

    if (!state.processing) {
      return;
    }

    // Mark as cancelled (simplified - real implementation would abort fetch)
    state.processing = false;
    state.activeUpload = null;

    uploadStore.notifyPaths([['processing'], ['activeUpload']]);
  }, [uploadStore]);

  // Handler: Retry failed uploads
  const handleRetryFailed = useCallback(async () => {
    const state = uploadStore.getValue();

    // Reset failed files to idle state
    state.queue.forEach((file, index) => {
      if (file.state === 'error') {
        file.state = 'idle';
        file.error = null;
        file.progress = { bytesUploaded: 0, totalBytes: file.size, percentage: 0 };
        uploadStore.notifyPaths([
          ['queue', index, 'state'],
          ['queue', index, 'error'],
          ['queue', index, 'progress'],
        ]);
      }
    });

    state.failedCount = 0;
    uploadStore.notifyPath(['failedCount']);

    // Start upload
    handleStartUpload();
  }, [uploadStore, handleStartUpload]);

  // Handler: Retry single file
  const handleRetryFile = useCallback(
    async (payload: { fileId: string }) => {
      const state = uploadStore.getValue();
      const fileIndex = state.queue.findIndex((f) => f.id === payload.fileId);

      if (fileIndex >= 0 && state.queue[fileIndex]!.state === 'error') {
        state.queue[fileIndex]!.state = 'idle';
        state.queue[fileIndex]!.error = null;
        state.queue[fileIndex]!.progress = {
          bytesUploaded: 0,
          totalBytes: state.queue[fileIndex]!.size,
          percentage: 0,
        };

        uploadStore.notifyPaths([
          ['queue', fileIndex, 'state'],
          ['queue', fileIndex, 'error'],
          ['queue', fileIndex, 'progress'],
        ]);

        // Start upload if not already processing
        if (!state.processing) {
          handleStartUpload();
        }
      }
    },
    [uploadStore, handleStartUpload]
  );

  // Register action handlers
  useUploadActionHandler('addFiles', handleAddFiles);
  useUploadActionHandler('clearQueue', handleClearQueue);
  useUploadActionHandler('clearProcessed', handleClearProcessed);
  useUploadActionHandler('removeFile', handleRemoveFile);
  useUploadActionHandler('startUpload', handleStartUpload);
  useUploadActionHandler('cancelUpload', handleCancelUpload);
  useUploadActionHandler('retryFailed', handleRetryFailed);
  useUploadActionHandler('retryFile', handleRetryFile);

  return <>{children}</>;
}
