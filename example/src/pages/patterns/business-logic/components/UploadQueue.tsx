/**
 * UploadQueue Component
 *
 * Displays upload queue with selective re-rendering.
 * Demonstrates path-based subscriptions with useStorePath.
 */

import { useStorePath } from '@context-action/react';
import { useUploadStore } from '../contexts/UploadStoreContext';
import { useUploadAction } from '../contexts/UploadActionContext';
import type { FileUploadState } from '../contexts/UploadStoreContext';

function QueueItem({ item, index }: { item: FileUploadState; index: number }) {
  const dispatch = useUploadAction();
  const uploadStore = useUploadStore('upload');

  // Selective subscriptions - only re-render when specific paths change
  const state = useStorePath(uploadStore, ['queue', index, 'state']);
  const progress = useStorePath(uploadStore, ['queue', index, 'progress']);
  const status = useStorePath(uploadStore, ['queue', index, 'status']);
  const error = useStorePath(uploadStore, ['queue', index, 'error']);

  const getStateColor = () => {
    switch (state) {
      case 'complete':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'uploading':
      case 'processing':
        return 'bg-blue-50 border-blue-200';
      case 'validating':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStateIcon = () => {
    switch (state) {
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      case 'uploading':
        return '⬆️';
      case 'processing':
        return '⚙️';
      case 'validating':
        return '🔍';
      default:
        return '📄';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`border rounded-lg p-4 mb-3 ${getStateColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-2xl">{getStateIcon()}</span>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{item.name}</h4>
            <p className="text-sm text-gray-600">
              {formatBytes(item.size)} • {state}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state === 'error' && (
            <button
              onClick={() => dispatch('retryFile', { fileId: item.id })}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Retry
            </button>
          )}
          {(state === 'idle' || state === 'error') && (
            <button
              onClick={() => dispatch('removeFile', { fileId: item.id })}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Progress bar - only visible when uploading */}
      {(state === 'uploading' || state === 'processing') && (
        <div className="mb-2">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{progress.percentage}%</span>
            <span>
              {formatBytes(progress.bytesUploaded)} / {formatBytes(progress.totalBytes)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Status message */}
      {status && state === 'processing' && (
        <p className="text-sm text-gray-600 italic">{status}</p>
      )}

      {/* Error message */}
      {error && state === 'error' && (
        <p className="text-sm text-red-600 font-medium">❌ {error}</p>
      )}

      {/* Success message */}
      {state === 'complete' && (
        <p className="text-sm text-green-600 font-medium">
          ✅ Upload completed successfully
        </p>
      )}
    </div>
  );
}

export function UploadQueue() {
  const uploadStore = useUploadStore('upload');
  const dispatch = useUploadAction();

  // Subscribe to queue array
  const queue = useStorePath(uploadStore, ['queue']);

  if (queue.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-2">📭</p>
        <p>No files in queue</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Upload Queue ({queue.length} files)
        </h3>
        <button
          onClick={() => dispatch('clearProcessed')}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
        >
          Clear Processed
        </button>
      </div>

      <div>
        {queue.map((item, index) => (
          <QueueItem key={item.id} item={item} index={index} />
        ))}
      </div>
    </div>
  );
}
