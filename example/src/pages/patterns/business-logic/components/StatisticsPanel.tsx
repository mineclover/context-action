/**
 * StatisticsPanel Component
 *
 * Displays upload statistics with selective subscriptions.
 * Only re-renders when specific statistics change.
 */

import { useStorePath } from '@context-action/react';
import { useUploadStore } from '../contexts/UploadStoreContext';

export function StatisticsPanel() {
  const uploadStore = useUploadStore('upload');

  // Selective subscriptions - each component re-renders independently
  const queueLength = useStorePath(uploadStore, ['queue']).length;
  const processing = useStorePath(uploadStore, ['processing']);
  const completedCount = useStorePath(uploadStore, ['completedCount']);
  const failedCount = useStorePath(uploadStore, ['failedCount']);
  const totalBytes = useStorePath(uploadStore, ['totalBytes']);
  const uploadedBytes = useStorePath(uploadStore, ['uploadedBytes']);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const overallProgress =
    totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {/* Queue Size */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">📋</span>
          <span className="text-2xl font-bold text-gray-800">{queueLength}</span>
        </div>
        <p className="text-sm text-gray-600">In Queue</p>
      </div>

      {/* Completed */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">✅</span>
          <span className="text-2xl font-bold text-green-700">
            {completedCount}
          </span>
        </div>
        <p className="text-sm text-green-700">Completed</p>
      </div>

      {/* Failed */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">❌</span>
          <span className="text-2xl font-bold text-red-700">{failedCount}</span>
        </div>
        <p className="text-sm text-red-700">Failed</p>
      </div>

      {/* Status */}
      <div
        className={`border rounded-lg p-4 ${
          processing
            ? 'bg-blue-50 border-blue-200'
            : 'bg-gray-50 border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{processing ? '⚙️' : '⏸️'}</span>
          <span
            className={`text-sm font-semibold ${
              processing ? 'text-blue-700' : 'text-gray-600'
            }`}
          >
            {processing ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>
        <p className="text-sm text-gray-600">Status</p>
      </div>

      {/* Overall Progress */}
      {totalBytes > 0 && (
        <div className="col-span-2 md:col-span-4 bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-semibold text-gray-800">
              {formatBytes(uploadedBytes)} / {formatBytes(totalBytes)} (
              {overallProgress}%)
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
