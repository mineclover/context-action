/**
 * ActiveUploadPanel Component
 *
 * Displays currently active upload with real-time progress.
 * Demonstrates progress-only updates with notifyPath.
 */

import { useStorePath } from '@context-action/react';
import { useUploadStore, type UploadStoreState } from '../contexts/UploadStoreContext';

export function ActiveUploadPanel() {
  const uploadStore = useUploadStore('upload');

  // Subscribe only to activeUpload path
  const activeUpload = useStorePath<UploadStoreState, UploadStoreState['activeUpload']>(uploadStore, ['activeUpload']);

  if (!activeUpload) {
    return null;
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStateIcon = () => {
    switch (activeUpload.state) {
      case 'validating':
        return '🔍';
      case 'uploading':
        return '⬆️';
      case 'processing':
        return '⚙️';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📄';
    }
  };

  const getStateColor = () => {
    switch (activeUpload.state) {
      case 'complete':
        return 'border-green-500 bg-green-50';
      case 'error':
        return 'border-red-500 bg-red-50';
      case 'uploading':
      case 'processing':
        return 'border-blue-500 bg-blue-50';
      case 'validating':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  return (
    <div className={`border-2 rounded-lg p-6 mb-6 ${getStateColor()}`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{getStateIcon()}</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold">Currently Uploading</h3>
          <p className="text-gray-700 font-medium">{activeUpload.name}</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* State */}
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Status:</span>
          <span className="text-sm font-semibold capitalize">
            {activeUpload.state}
          </span>
        </div>

        {/* Progress bar */}
        {(activeUpload.state === 'uploading' ||
          activeUpload.state === 'processing') && (
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{activeUpload.progress.percentage}%</span>
              <span>
                {formatBytes(activeUpload.progress.bytesUploaded)} /{' '}
                {formatBytes(activeUpload.progress.totalBytes)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${activeUpload.progress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Status message */}
        {activeUpload.status && (
          <div className="bg-white border border-gray-200 rounded p-3">
            <p className="text-sm text-gray-700 italic">{activeUpload.status}</p>
          </div>
        )}
      </div>

      {/* Performance indicator */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          ⚡ Progress updates use <code className="bg-gray-200 px-1 rounded">notifyPath</code>
          for zero-cost re-rendering
        </p>
      </div>
    </div>
  );
}
