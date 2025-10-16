import React from 'react';

interface PerformanceControlPanelProps {
  autoUpdate: boolean;
  updateInterval: number;
  onToggleAutoUpdate: () => void;
  onIntervalChange: (interval: number) => void;
}

/**
 * Shared Component - Performance Control Panel
 * 자동 업데이트 제어를 위한 순수 UI 컴포넌트
 */
export function PerformanceControlPanel({
  autoUpdate,
  updateInterval,
  onToggleAutoUpdate,
  onIntervalChange,
}: PerformanceControlPanelProps) {
  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="font-bold mb-3">🎛️ Performance Test Controls</h3>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoUpdate}
            onChange={onToggleAutoUpdate}
            className="rounded"
          />
          <span>Auto Update</span>
        </label>

        <div className="flex items-center gap-2">
          <label>Interval (ms):</label>
          <input
            type="number"
            value={updateInterval}
            onChange={(e) => onIntervalChange(Number(e.target.value))}
            min={10}
            max={1000}
            step={10}
            className="w-20 px-2 py-1 border rounded"
          />
        </div>

        {autoUpdate && (
          <div className="text-sm text-yellow-600 font-medium">
            ⚠️ Auto-updating every {updateInterval}ms
          </div>
        )}
      </div>
    </div>
  );
}
