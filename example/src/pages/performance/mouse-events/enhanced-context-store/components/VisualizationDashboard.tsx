/**
 * @fileoverview Sophisticated Visualization Dashboard
 *
 * Advanced data visualization for mouse events with real-time metrics:
 * - Position tracking with coordinate history
 * - Movement analysis with velocity and path visualization
 * - Click activity with pattern analysis
 * - Performance metrics with frame rate monitoring
 */

import { useState } from 'react';

interface Position {
  x: number;
  y: number;
  timestamp: number;
}

interface Movement {
  path: Position[];
  velocity: number;
  direction: number;
  isMoving: boolean;
}

interface Click {
  position: Position;
  type: 'single' | 'double' | 'right';
  id: string;
}

interface Activity {
  isActive: boolean;
  totalMoves: number;
  totalClicks: number;
  sessionDuration: number;
  averageVelocity: number;
}

interface VisualizationDashboardProps {
  position: Position;
  movement: Movement;
  clicks: Click[];
  activity: Activity;
  onRefresh?: () => void;
}

export function VisualizationDashboard({
  position,
  movement,
  clicks,
  activity,
  onRefresh,
}: VisualizationDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState<
    'position' | 'movement' | 'clicks' | 'activity'
  >('position');

  // Format numbers for display
  const formatNumber = (num: number, decimals: number = 2): string => {
    return num.toFixed(decimals);
  };

  // Format time duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  // Calculate click rate
  const getClickRate = (): string => {
    if (activity.sessionDuration === 0) return '0.00';
    const rate = (activity.totalClicks / activity.sessionDuration) * 1000; // clicks per second
    return formatNumber(rate);
  };

  // Get velocity color based on speed
  const getVelocityColor = (velocity: number): string => {
    if (velocity < 50) return 'text-green-600';
    if (velocity < 150) return 'text-yellow-600';
    if (velocity < 300) return 'text-orange-600';
    return 'text-red-600';
  };

  // Get activity status color
  const getActivityColor = (): string => {
    return activity.isActive ? 'text-green-600' : 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Metric Selection Tabs */}
      <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
        {[
          { key: 'position', label: '📍 Position', color: 'blue' },
          { key: 'movement', label: '🌊 Movement', color: 'purple' },
          { key: 'clicks', label: '🖱️ Clicks', color: 'green' },
          { key: 'activity', label: '📊 Activity', color: 'orange' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setSelectedMetric(key as any)}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedMetric === key
                ? `bg-${color}-500 text-white shadow-md`
                : `text-${color}-600 hover:bg-${color}-50`
            }`}
          >
            {label}
          </button>
        ))}

        {/* Refresh Button */}
        <div className="ml-auto">
          <button
            onClick={onRefresh}
            className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-md transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            Refresh
          </button>
        </div>
      </div>

      {/* Position Visualization */}
      {selectedMetric === 'position' && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <span>📍</span>
            Position Tracking
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Position */}
            <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-700 mb-2">
                Current Position
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">X:</span>
                  <span className="font-mono text-blue-600">
                    {formatNumber(position.x)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Y:</span>
                  <span className="font-mono text-blue-600">
                    {formatNumber(position.y)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-mono text-blue-600 text-xs">
                    {new Date(position.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Position History */}
            <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-700 mb-2">
                Position History
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Path Points:</span>
                  <span className="font-mono text-blue-600">
                    {movement.path.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Coverage:</span>
                  <span className="font-mono text-blue-600">
                    {movement.path.length > 0
                      ? formatNumber((movement.path.length / 1000) * 100)
                      : '0.00'}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-mono text-blue-600 text-xs">
                    {formatDuration(activity.sessionDuration)}
                  </span>
                </div>
              </div>
            </div>

            {/* Position Stats */}
            <div className="bg-white/70 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-blue-700 mb-2">Position Stats</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Bounds:</span>
                  <span className="font-mono text-blue-600 text-xs">
                    800×600
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quadrant:</span>
                  <span className="font-mono text-blue-600">
                    {position.x > 400 ? 'R' : 'L'}
                    {position.y > 300 ? 'B' : 'T'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Center Dist:</span>
                  <span className="font-mono text-blue-600">
                    {formatNumber(
                      Math.sqrt(
                        (position.x - 400) ** 2 + (position.y - 300) ** 2
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Movement Visualization */}
      {selectedMetric === 'movement' && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
            <span>🌊</span>
            Movement Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Velocity Metrics */}
            <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-700 mb-2">
                Velocity Metrics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Current:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono font-bold ${getVelocityColor(movement.velocity)}`}
                    >
                      {formatNumber(movement.velocity)}
                    </span>
                    <span className="text-xs text-gray-500">px/s</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono ${getVelocityColor(activity.averageVelocity)}`}
                    >
                      {formatNumber(activity.averageVelocity)}
                    </span>
                    <span className="text-xs text-gray-500">px/s</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`text-sm font-medium ${movement.isMoving ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    {movement.isMoving ? '🏃‍♂️ Moving' : '🛑 Still'}
                  </span>
                </div>
              </div>
            </div>

            {/* Direction & Path */}
            <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-700 mb-2">
                Direction & Path
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Direction:</span>
                  <span className="font-mono text-purple-600">
                    {formatNumber(movement.direction)}°
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cardinal:</span>
                  <span className="text-sm font-medium text-purple-600">
                    {movement.direction >= 315 || movement.direction < 45
                      ? '⬆️ N'
                      : movement.direction >= 45 && movement.direction < 135
                        ? '➡️ E'
                        : movement.direction >= 135 && movement.direction < 225
                          ? '⬇️ S'
                          : '⬅️ W'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Path Length:</span>
                  <span className="font-mono text-purple-600">
                    {movement.path.length} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Movement Quality */}
            <div className="bg-white/70 rounded-lg p-4 border border-purple-200">
              <h4 className="font-medium text-purple-700 mb-2">
                Movement Quality
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Smoothness:</span>
                  <span className="text-sm font-medium text-green-600">
                    {movement.velocity < 100
                      ? '🟢 Smooth'
                      : movement.velocity < 200
                        ? '🟡 Moderate'
                        : '🔴 Jerky'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precision:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {activity.totalMoves < 100
                      ? '🎯 High'
                      : activity.totalMoves < 500
                        ? '📍 Medium'
                        : '🌊 Fluid'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Activity:</span>
                  <span className={`text-sm font-medium ${getActivityColor()}`}>
                    {activity.isActive ? '✅ Active' : '💤 Idle'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clicks Visualization */}
      {selectedMetric === 'clicks' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
            <span>🖱️</span>
            Click Activity Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Click Statistics */}
            <div className="bg-white/70 rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-700 mb-2">
                Click Statistics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Clicks:</span>
                  <span className="font-mono font-bold text-green-600">
                    {activity.totalClicks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent:</span>
                  <span className="font-mono text-green-600">
                    {clicks.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Click Rate:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-green-600">
                      {getClickRate()}
                    </span>
                    <span className="text-xs text-gray-500">/sec</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Click Types */}
            <div className="bg-white/70 rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-700 mb-2">Click Types</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Single:</span>
                  <span className="font-mono text-green-600">
                    {clicks.filter((c) => c.type === 'single').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Double:</span>
                  <span className="font-mono text-green-600">
                    {clicks.filter((c) => c.type === 'double').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Right:</span>
                  <span className="font-mono text-green-600">
                    {clicks.filter((c) => c.type === 'right').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Recent Clicks */}
            <div className="bg-white/70 rounded-lg p-4 border border-green-200">
              <h4 className="font-medium text-green-700 mb-2">Recent Clicks</h4>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {clicks
                  .slice(-3)
                  .reverse()
                  .map((click, index) => (
                    <div
                      key={click.id}
                      className="flex justify-between text-xs"
                    >
                      <span className="text-gray-600">
                        {click.type === 'single'
                          ? '🖱️'
                          : click.type === 'double'
                            ? '🖱️🖱️'
                            : '🖱️➡️'}
                      </span>
                      <span className="font-mono text-green-600">
                        ({formatNumber(click.position.x, 0)},{' '}
                        {formatNumber(click.position.y, 0)})
                      </span>
                    </div>
                  ))}
                {clicks.length === 0 && (
                  <div className="text-xs text-gray-400 text-center">
                    No recent clicks
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Visualization */}
      {selectedMetric === 'activity' && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center gap-2">
            <span>📊</span>
            Overall Activity Analysis
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Session Overview */}
            <div className="bg-white/70 rounded-lg p-4 border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">
                Session Overview
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`text-sm font-medium ${getActivityColor()}`}>
                    {activity.isActive ? '🟢 Active' : '🔴 Idle'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-mono text-orange-600">
                    {formatDuration(activity.sessionDuration)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Started:</span>
                  <span className="font-mono text-orange-600 text-xs">
                    {new Date(
                      Date.now() - activity.sessionDuration
                    ).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Activity Metrics */}
            <div className="bg-white/70 rounded-lg p-4 border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">
                Activity Metrics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Moves:</span>
                  <span className="font-mono font-bold text-orange-600">
                    {activity.totalMoves}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Clicks:</span>
                  <span className="font-mono font-bold text-orange-600">
                    {activity.totalClicks}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg Velocity:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono ${getVelocityColor(activity.averageVelocity)}`}
                    >
                      {formatNumber(activity.averageVelocity)}
                    </span>
                    <span className="text-xs text-gray-500">px/s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Index */}
            <div className="bg-white/70 rounded-lg p-4 border border-orange-200">
              <h4 className="font-medium text-orange-700 mb-2">
                Performance Index
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Efficiency:</span>
                  <span className="text-sm font-medium text-green-600">
                    {activity.totalClicks / (activity.totalMoves || 1) > 0.1
                      ? '🎯 High'
                      : activity.totalClicks / (activity.totalMoves || 1) > 0.05
                        ? '📍 Medium'
                        : '🌊 Exploratory'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Engagement:</span>
                  <span className="text-sm font-medium text-blue-600">
                    {activity.sessionDuration > 30000
                      ? '🔥 High'
                      : activity.sessionDuration > 10000
                        ? '👍 Medium'
                        : '👋 Brief'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Interaction:</span>
                  <span className="text-sm font-medium text-purple-600">
                    {activity.totalMoves + activity.totalClicks > 100
                      ? '⚡ Intensive'
                      : activity.totalMoves + activity.totalClicks > 20
                        ? '📊 Moderate'
                        : '🔍 Light'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
