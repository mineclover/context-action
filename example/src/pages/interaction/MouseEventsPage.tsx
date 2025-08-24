/**
 * Mouse Events Interaction Demo Page
 * Unified demonstration of mouse interaction patterns using modular architecture
 */

import { useCallback, useState } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  DomainLayout,
  Section,
  DemoCard,
  CodeExample,
  PatternBadge
} from '../../domains/shared/components';

// Mouse interaction domain components
import { MouseTracker, MousePathVisualizer, PerformanceMonitor } from './components';

// Mouse interaction hooks
import { useMouseTracking, useMousePerformance } from './hooks';

// Mouse interaction types
import type { MousePosition, MouseTrackingConfig } from './types';

function MouseInteractionDemos() {
  const logger = useActionLoggerWithToast();
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [visualizationMode, setVisualizationMode] = useState<'path' | 'heatmap' | 'clicks'>('path');
  
  const trackingConfig: MouseTrackingConfig = {
    enablePath: true,
    enableClicks: true,
    enableHover: true,
    smoothing: true,
    throttleMs: 16 // 60fps
  };

  const {
    mousePosition,
    mousePath,
    clickHistory,
    isTracking,
    startTracking,
    stopTracking,
    clearHistory
  } = useMouseTracking(trackingConfig);

  const {
    performance,
    startPerformanceMonitoring,
    stopPerformanceMonitoring
  } = useMousePerformance();

  const handleTrackingToggle = useCallback(() => {
    if (isTracking) {
      stopTracking();
      logger.logSystem('Mouse tracking stopped');
    } else {
      startTracking();
      logger.logSystem('Mouse tracking started');
    }
    setTrackingEnabled(!trackingEnabled);
  }, [isTracking, trackingEnabled, startTracking, stopTracking, logger]);

  const handleClearData = useCallback(() => {
    clearHistory();
    logger.logSystem('Mouse tracking data cleared');
  }, [clearHistory, logger]);

  return (
    <div className="space-y-8">
      {/* Basic Mouse Tracking */}
      <Section title="Interactive Mouse Tracking">
        <DemoCard title="Real-time Mouse Position Tracking">
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
              <PatternBadge type="integration" difficulty="intermediate" />
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Track mouse position, path, and interactions with performance monitoring.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controls */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleTrackingToggle}
                    className={`px-4 py-2 rounded font-medium transition-colors ${
                      isTracking 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isTracking ? 'Stop Tracking' : 'Start Tracking'}
                  </button>
                  
                  <button
                    onClick={handleClearData}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Clear Data
                  </button>
                </div>

                {/* Visualization Mode Selector */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                  {(['path', 'heatmap', 'clicks'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setVisualizationMode(mode)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        visualizationMode === mode
                          ? 'bg-white text-gray-900 shadow'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Current Position Display */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Current Position</h4>
                  <div className="text-sm space-y-1">
                    <div>X: <span className="font-mono">{mousePosition.x.toFixed(0)}</span></div>
                    <div>Y: <span className="font-mono">{mousePosition.y.toFixed(0)}</span></div>
                    <div>Timestamp: <span className="font-mono">{mousePosition.timestamp}</span></div>
                  </div>
                </div>
              </div>

              {/* Mouse Tracker Component */}
              <MouseTracker
                isTracking={isTracking}
                mousePosition={mousePosition}
                mousePath={mousePath}
                clickHistory={clickHistory}
                visualizationMode={visualizationMode}
                className="h-80 border-2 border-gray-200 rounded-lg"
              />
            </div>

            <CodeExample>
{`// Mouse tracking with performance optimization
const {
  mousePosition,
  mousePath,
  clickHistory,
  isTracking,
  startTracking,
  stopTracking
} = useMouseTracking({
  enablePath: true,
  enableClicks: true,
  throttleMs: 16 // 60fps
});

// Usage in component
<MouseTracker
  isTracking={isTracking}
  mousePosition={mousePosition}
  mousePath={mousePath}
  visualizationMode="path"
/>`}
            </CodeExample>
          </div>
        </DemoCard>
      </Section>

      {/* Advanced Visualizations */}
      <Section title="Advanced Mouse Visualizations">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Path Visualizer */}
          <DemoCard title="Mouse Path Visualization">
            <div className="space-y-4">
              <PatternBadge type="async" difficulty="advanced" />
              <MousePathVisualizer
                mousePath={mousePath}
                clickHistory={clickHistory}
                showPath={visualizationMode === 'path'}
                showHeatmap={visualizationMode === 'heatmap'}
                showClicks={visualizationMode === 'clicks'}
                className="h-64 bg-gray-50 rounded border"
              />
              <div className="text-sm text-gray-600">
                Path points: <span className="font-medium">{mousePath.length}</span> | 
                Clicks: <span className="font-medium">{clickHistory.length}</span>
              </div>
            </div>
          </DemoCard>

          {/* Performance Monitor */}
          <DemoCard title="Performance Monitoring">
            <div className="space-y-4">
              <PatternBadge type="performance" difficulty="intermediate" />
              <PerformanceMonitor
                performance={performance}
                isMonitoring={isTracking}
                onStartMonitoring={startPerformanceMonitoring}
                onStopMonitoring={stopPerformanceMonitoring}
                className="h-64"
              />
            </div>
          </DemoCard>
        </div>
      </Section>

      {/* Implementation Patterns */}
      <Section title="Implementation Patterns">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DemoCard title="Store Integration Pattern">
            <CodeExample>
{`// Store pattern for mouse state management
const { Provider, useStore } = createDeclarativeStorePattern('MouseEvents', {
  position: { initialValue: { x: 0, y: 0, timestamp: 0 } },
  path: { initialValue: [] as MousePosition[] },
  clicks: { initialValue: [] as ClickEvent[] },
  performance: { initialValue: { fps: 0, eventCount: 0 } }
});

// Usage in component
const positionStore = useStore('position');
const position = useStoreValue(positionStore);`}
            </CodeExample>
          </DemoCard>

          <DemoCard title="Action Handler Pattern">
            <CodeExample>
{`// Action handlers for mouse interactions
useActionHandler('trackMousePosition', async (payload, controller) => {
  const { x, y } = payload;
  const timestamp = Date.now();
  
  // Update position store
  positionStore.setValue({ x, y, timestamp });
  
  // Add to path with performance optimization
  pathStore.update(prev => {
    const newPath = [...prev, { x, y, timestamp }];
    return newPath.slice(-1000); // Keep last 1000 points
  });
});`}
            </CodeExample>
          </DemoCard>
        </div>
      </Section>
    </div>
  );
}

function MouseEventsPageContent() {
  return (
    <DomainLayout
      title="Mouse Events & Interaction Patterns"
      description="Comprehensive demonstration of mouse tracking, visualization, and performance patterns using the Context-Action framework's modular architecture."
    >
      <MouseInteractionDemos />
    </DomainLayout>
  );
}

function MouseEventsPage() {
  return (
    <PageWithLogMonitor>
      <MouseEventsPageContent />
    </PageWithLogMonitor>
  );
}

export default MouseEventsPage;