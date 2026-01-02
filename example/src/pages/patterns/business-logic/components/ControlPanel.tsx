/**
 * ControlPanel Component
 *
 * Upload control buttons with action dispatching.
 * Pure presentation component.
 */

import { useStorePath } from '@context-action/react';
import { useUploadStore } from '../contexts/UploadStoreContext';
import { useUploadAction } from '../contexts/UploadActionContext';

export function ControlPanel() {
  const uploadStore = useUploadStore('upload');
  const dispatch = useUploadAction();

  // Selective subscriptions
  const queue = useStorePath(uploadStore, ['queue']);
  const processing = useStorePath(uploadStore, ['processing']);
  const failedCount = useStorePath(uploadStore, ['failedCount']);

  const hasIdleFiles = queue.some((f) => f.state === 'idle' || f.state === 'error');
  const hasFiles = queue.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Upload Controls</h3>

      <div className="flex flex-wrap gap-3">
        {/* Start Upload */}
        <button
          onClick={() => dispatch('startUpload')}
          disabled={!hasIdleFiles || processing}
          className={`px-4 py-2 rounded font-medium transition-colors ${
            !hasIdleFiles || processing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {processing ? '⏳ Uploading...' : '▶️ Start Upload'}
        </button>

        {/* Cancel Upload */}
        {processing && (
          <button
            onClick={() => dispatch('cancelUpload')}
            className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 transition-colors"
          >
            ⏹️ Cancel
          </button>
        )}

        {/* Retry Failed */}
        {failedCount > 0 && !processing && (
          <button
            onClick={() => dispatch('retryFailed')}
            className="px-4 py-2 bg-orange-500 text-white rounded font-medium hover:bg-orange-600 transition-colors"
          >
            🔄 Retry Failed ({failedCount})
          </button>
        )}

        {/* Clear Queue */}
        {hasFiles && !processing && (
          <button
            onClick={() => dispatch('clearQueue')}
            className="px-4 py-2 bg-gray-500 text-white rounded font-medium hover:bg-gray-600 transition-colors"
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* Status Messages */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        {processing && (
          <p className="text-sm text-blue-600">
            ⏳ Upload in progress... Please wait.
          </p>
        )}
        {!hasIdleFiles && hasFiles && !processing && (
          <p className="text-sm text-gray-600">
            All files processed. Add more files or clear the queue.
          </p>
        )}
        {!hasFiles && (
          <p className="text-sm text-gray-600">
            No files in queue. Add files to start uploading.
          </p>
        )}
      </div>
    </div>
  );
}
