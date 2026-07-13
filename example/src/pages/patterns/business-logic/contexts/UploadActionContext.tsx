/**
 * Upload Action Context
 *
 * Action layer for upload operations.
 * Orchestrates business logic (FileUploadService) with state management (UploadStore).
 */

import type { ActionPayloadMap } from '@context-action/core';
import { createActionContext } from '@context-action/react';

/**
 * Upload action definitions
 */
export interface UploadActions extends ActionPayloadMap {
  // Queue management
  addFiles: { files: File[] };
  clearQueue: void;
  clearProcessed: void;

  // Upload operations
  startUpload: void;
  cancelUpload: void;
  retryFailed: void;

  // Single file operations
  removeFile: { fileId: string };
  retryFile: { fileId: string };
}

/**
 * Upload Action Context
 */
export const {
  Provider: UploadActionProvider,
  useActionDispatch: useUploadAction,
  useActionHandler: useUploadActionHandler,
} = createActionContext<UploadActions>('UploadActions');
