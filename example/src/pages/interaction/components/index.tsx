/**
 * Interaction domain components
 * Mouse tracking and visualization components
 */

import { useRef, useEffect, useCallback } from 'react';
import { MetricsDisplay, StatusIndicator } from '../../../domains/shared/components';
import { useCanvasRenderer } from '../hooks';
import type { 
  MouseTrackerProps, 
  MousePathVisualizerProps, 
  PerformanceMonitorProps,
  MousePosition,
  ClickEvent,
  RenderingOptions
} from '../types';

// Main mouse tracker component with canvas rendering
export function MouseTracker({
  isTracking,
  mousePosition,
  mousePath,
  clickHistory,
  visualizationMode,
  className = ''
}: MouseTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { context, width, height, clearCanvas } = useCanvasRenderer(canvasRef);

  const renderingOptions: RenderingOptions = {
    pathWidth: 2,
    pathColor: '#3b82f6',
    clickRadius: 8,
    clickColor: '#ef4444',
    smoothPath: true,
    fadeEffect: true
  };

  // Render mouse path
  const renderPath = useCallback((positions: MousePosition[]) => {
    if (!context || positions.length < 2) return;

    context.strokeStyle = renderingOptions.pathColor;
    context.lineWidth = renderingOptions.pathWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    if (renderingOptions.smoothPath) {
      // Smooth path rendering with quadratic curves
      context.beginPath();
      context.moveTo(positions[0].x, positions[0].y);
      
      for (let i = 1; i < positions.length - 1; i++) {
        const current = positions[i];
        const next = positions[i + 1];
        const midX = (current.x + next.x) / 2;
        const midY = (current.y + next.y) / 2;
        
        context.quadraticCurveTo(current.x, current.y, midX, midY);
      }
      
      const lastPosition = positions[positions.length - 1];
      context.lineTo(lastPosition.x, lastPosition.y);
      context.stroke();
    } else {
      // Simple line rendering
      context.beginPath();
      positions.forEach((pos, index) => {
        if (index === 0) {
          context.moveTo(pos.x, pos.y);
        } else {
          context.lineTo(pos.x, pos.y);
        }
      });
      context.stroke();
    }
  }, [context, renderingOptions]);

  // Render click points
  const renderClicks = useCallback((clicks: ClickEvent[]) => {
    if (!context) return;

    clicks.forEach((click) => {
      context.fillStyle = renderingOptions.clickColor;
      context.beginPath();
      context.arc(click.x, click.y, renderingOptions.clickRadius, 0, 2 * Math.PI);
      context.fill();

      // Add click type indicator
      context.fillStyle = 'white';
      context.font = '10px Arial';
      context.textAlign = 'center';
      const indicator = click.type === 'click' ? 'L' : 
                       click.type === 'right-click' ? 'R' : 'D';
      context.fillText(indicator, click.x, click.y + 3);
    });
  }, [context, renderingOptions]);

  // Render current mouse position
  const renderCurrentPosition = useCallback((position: MousePosition) => {
    if (!context) return;

    // Cursor indicator
    context.fillStyle = '#10b981';
    context.beginPath();
    context.arc(position.x, position.y, 6, 0, 2 * Math.PI);
    context.fill();

    // Position text
    context.fillStyle = '#374151';
    context.font = '12px Arial';
    context.fillText(`(${position.x.toFixed(0)}, ${position.y.toFixed(0)})`, 
                     position.x + 10, position.y - 10);
  }, [context]);

  // Main render function
  const render = useCallback(() => {
    if (!context) return;

    clearCanvas();

    // Render based on visualization mode
    if (visualizationMode === 'path' && mousePath.length > 0) {
      renderPath(mousePath);
    }

    if ((visualizationMode === 'clicks' || visualizationMode === 'path') && clickHistory.length > 0) {
      renderClicks(clickHistory);
    }

    if (isTracking && mousePosition.timestamp > 0) {
      renderCurrentPosition(mousePosition);
    }
  }, [context, clearCanvas, visualizationMode, mousePath, clickHistory, isTracking, mousePosition, renderPath, renderClicks, renderCurrentPosition]);

  // Render when data changes
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className={`relative overflow-hidden bg-gray-50 ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full cursor-crosshair"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Status overlay */}
      <div className="absolute top-4 left-4">
        <StatusIndicator 
          status={isTracking ? 'success' : 'idle'} 
          message={isTracking ? 'Tracking' : 'Stopped'} 
        />
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-lg p-2">
        <div className="text-xs space-y-1">
          <div>Path: <span className="font-medium">{mousePath.length}</span></div>
          <div>Clicks: <span className="font-medium">{clickHistory.length}</span></div>
        </div>
      </div>
    </div>
  );
}

// Mouse path visualizer component
export function MousePathVisualizer({
  mousePath,
  clickHistory,
  showPath,
  showHeatmap,
  showClicks,
  className = ''
}: MousePathVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { context, clearCanvas } = useCanvasRenderer(canvasRef);

  // Render heatmap visualization
  const renderHeatmap = useCallback(() => {
    if (!context || mousePath.length === 0) return;

    // Create density map
    const densityMap = new Map<string, number>();
    const gridSize = 20;

    mousePath.forEach(pos => {
      const gridX = Math.floor(pos.x / gridSize);
      const gridY = Math.floor(pos.y / gridSize);
      const key = `${gridX}-${gridY}`;
      densityMap.set(key, (densityMap.get(key) || 0) + 1);
    });

    // Find max density for normalization
    const maxDensity = Math.max(...Array.from(densityMap.values()));

    // Render heatmap
    densityMap.forEach((density, key) => {
      const [gridX, gridY] = key.split('-').map(Number);
      const x = gridX * gridSize;
      const y = gridY * gridSize;
      
      const intensity = density / maxDensity;
      const alpha = Math.min(intensity * 0.6, 0.6);
      
      context.fillStyle = `rgba(239, 68, 68, ${alpha})`;
      context.fillRect(x, y, gridSize, gridSize);
    });
  }, [context, mousePath]);

  const render = useCallback(() => {
    if (!context) return;
    
    clearCanvas();

    if (showHeatmap) {
      renderHeatmap();
    }

    if (showPath && mousePath.length > 1) {
      context.strokeStyle = '#3b82f6';
      context.lineWidth = 1;
      context.beginPath();
      mousePath.forEach((pos, index) => {
        if (index === 0) {
          context.moveTo(pos.x, pos.y);
        } else {
          context.lineTo(pos.x, pos.y);
        }
      });
      context.stroke();
    }

    if (showClicks) {
      clickHistory.forEach(click => {
        context.fillStyle = '#ef4444';
        context.beginPath();
        context.arc(click.x, click.y, 4, 0, 2 * Math.PI);
        context.fill();
      });
    }
  }, [context, clearCanvas, showHeatmap, showPath, showClicks, mousePath, clickHistory, renderHeatmap]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

// Performance monitor component
export function PerformanceMonitor({
  performance,
  isMonitoring,
  onStartMonitoring,
  onStopMonitoring,
  className = ''
}: PerformanceMonitorProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Performance Metrics</h4>
        <div className="flex gap-2">
          <button
            onClick={isMonitoring ? onStopMonitoring : onStartMonitoring}
            className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      <StatusIndicator 
        status={isMonitoring ? 'loading' : 'idle'}
        message={isMonitoring ? 'Monitoring Active' : 'Monitoring Stopped'}
      />

      <MetricsDisplay
        title="Real-time Metrics"
        metrics={{
          'FPS': `${performance.fps}`,
          'Events': performance.eventCount,
          'Avg Interval': `${performance.averageEventInterval.toFixed(1)}ms`,
          'Memory': `${(performance.memoryUsage / 1024 / 1024).toFixed(1)}MB`
        }}
      />

      {/* Performance visualization */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm font-medium mb-2">FPS History</div>
        <div className="h-16 bg-white rounded border flex items-end justify-between px-2">
          {/* Simple FPS bar chart */}
          {Array.from({ length: 20 }).map((_, index) => {
            const height = Math.min((performance.fps / 60) * 100, 100);
            return (
              <div
                key={index}
                className="bg-blue-500 w-1 transition-all duration-200"
                style={{ 
                  height: index === 19 ? `${height}%` : '0%',
                  opacity: index === 19 ? 1 : 0.3
                }}
              />
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-1 flex justify-between">
          <span>0 FPS</span>
          <span>60 FPS</span>
        </div>
      </div>
    </div>
  );
}