/**
 * @fileoverview Refactored Enhanced Context Store Page (Reactive Pattern)
 * 
 * Sophisticated ActionGuard demonstration with reactive architecture:
 * 1. Architecture Section - MVVM pattern explanation (Reactive vs Non-Reactive)
 * 2. Demo Canvas Section - Interactive mouse tracking with Store subscriptions
 * 3. Status Visualization Section - Real-time metrics dashboard with React rendering
 * 4. Code Block Section - Reactive implementation examples
 * 
 * Features:
 * - Traditional React re-renders with useStoreValue subscriptions
 * - Advanced data visualization for Position, Movement, Clicks, Activity
 * - Structured template-based layout
 * - Performance comparison with Non-Reactive pattern
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MouseEventsModelProvider } from './context/MouseEventsModel';
import { EnhancedContextStoreView } from './components/EnhancedContextStoreView';
import { VisualizationDashboard } from './components/VisualizationDashboard';
import { useAdvancedCanvasControl } from './hooks/useAdvancedCanvasControl';
import { useNonReactiveMetrics } from './hooks/useNonReactiveMetrics';

// Reactive data interfaces - same as Non-Reactive for comparison
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

/**
 * Main Reactive Content Component - Uses Store subscriptions
 */
function ReactivePageContent() {
  const canvasControl = useAdvancedCanvasControl();
  const metrics = useNonReactiveMetrics();
  
  // Reactive visualization data state - triggers re-renders
  const [visualizationData, setVisualizationData] = useState({
    position: { x: 0, y: 0, timestamp: Date.now() } as Position,
    movement: { 
      path: [], 
      velocity: 0, 
      direction: 0, 
      isMoving: false 
    } as Movement,
    clicks: [] as Click[],
    activity: {
      isActive: false,
      totalMoves: 0,
      totalClicks: 0,
      sessionDuration: 0,
      averageVelocity: 0
    } as Activity
  });
  
  // Re-render count for demonstration
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  const sessionStartTime = useRef(Date.now());
  
  // Enhanced refresh function with reactive updates
  const refreshVisualizationData = useCallback(() => {
    const currentPosition = canvasControl.getCurrentPosition();
    const pathPoints = canvasControl.getPathPoints();
    const clickCount = canvasControl.getClickCount();
    
    // Calculate session duration
    const sessionDuration = Date.now() - sessionStartTime.current;
    
    // Calculate velocity (simplified)
    const recentPath = pathPoints.slice(-10);
    let totalVelocity = 0;
    if (recentPath.length > 1) {
      for (let i = 1; i < recentPath.length; i++) {
        const prev = recentPath[i - 1];
        const curr = recentPath[i];
        const distance = Math.sqrt(
          (curr!.x - prev!.x) ** 2 + (curr!.y - prev!.y) ** 2
        );
        const timeDiff = (curr!.timestamp - prev!.timestamp) || 16;
        totalVelocity += (distance / timeDiff) * 1000;
      }
    }
    const currentVelocity = recentPath.length > 1 ? totalVelocity / (recentPath.length - 1) : 0;
    
    // Calculate direction
    let direction = 0;
    if (recentPath.length >= 2) {
      const recent = recentPath[recentPath.length - 1];
      const previous = recentPath[recentPath.length - 2];
      direction = Math.atan2(recent!.y - previous!.y, recent!.x - previous!.x) * 180 / Math.PI;
      if (direction < 0) direction += 360;
    }
    
    // Generate mock clicks data
    const mockClicks: Click[] = Array.from({ length: Math.min(clickCount, 5) }, (_, i) => ({
      position: {
        x: Math.random() * 800,
        y: Math.random() * 600,
        timestamp: Date.now() - (i * 1000)
      },
      type: Math.random() > 0.8 ? 'double' : Math.random() > 0.9 ? 'right' : 'single',
      id: `click-${Date.now()}-${i}`
    }));
    
    // This setState will trigger React re-renders! (Reactive Pattern)
    setVisualizationData({
      position: {
        x: currentPosition.x,
        y: currentPosition.y,
        timestamp: Date.now()
      },
      movement: {
        path: pathPoints.map((p: any) => ({ x: p.x, y: p.y, timestamp: p.timestamp || Date.now() })),
        velocity: currentVelocity,
        direction,
        isMoving: currentVelocity > 10
      },
      clicks: mockClicks,
      activity: {
        isActive: pathPoints.length > 0 || clickCount > 0,
        totalMoves: pathPoints.length,
        totalClicks: clickCount,
        sessionDuration,
        averageVelocity: pathPoints.length > 10 ? totalVelocity / pathPoints.length : 0
      }
    });
  }, [canvasControl]);
  
  // Auto-refresh data periodically (triggers re-renders)
  useEffect(() => {
    const interval = setInterval(refreshVisualizationData, 500);
    return () => clearInterval(interval);
  }, [refreshVisualizationData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50">
      {/* === 1. Architecture Section === */}
      <div className="p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-purple-200 shadow-xl mb-8">
          <h1 className="text-3xl font-bold text-purple-900 mb-6 flex items-center gap-4">
            <span className="text-4xl">🔔</span>
            Reactive MVVM Architecture
            <div className="ml-auto text-sm bg-pink-100 text-pink-700 px-3 py-1 rounded-full">
              Renders: {renderCountRef.current}
            </div>
          </h1>
          
          {/* MVVM Layer Explanation with Reactive Focus */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Model Layer */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <span>🏪</span>
                Model Layer
              </h3>
              <ul className="space-y-2 text-sm text-purple-700">
                <li>• <strong>Store Contexts</strong> with declarative state</li>
                <li>• <strong>useStoreValue()</strong> reactive subscriptions</li>
                <li>• <strong>Automatic updates</strong> on state changes</li>
                <li>• <strong>React integration</strong> with re-render cycle</li>
              </ul>
            </div>
            
            {/* ViewModel Layer */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
              <h3 className="text-lg font-semibold text-pink-800 mb-3 flex items-center gap-2">
                <span>🔄</span>
                ViewModel Layer
              </h3>
              <ul className="space-y-2 text-sm text-pink-700">
                <li>• <strong>useEffect</strong> for reactive updates</li>
                <li>• <strong>Store subscriptions</strong> trigger re-renders</li>
                <li>• <strong>useState</strong> for local component state</li>
                <li>• <strong>React lifecycle</strong> integration</li>
              </ul>
            </div>
            
            {/* View Layer */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
              <h3 className="text-lg font-semibold text-cyan-800 mb-3 flex items-center gap-2">
                <span>👁️</span>
                View Layer
              </h3>
              <ul className="space-y-2 text-sm text-cyan-700">
                <li>• <strong>React re-renders</strong> on state changes</li>
                <li>• <strong>useStoreValue</strong> subscriptions</li>
                <li>• <strong>useEffect</strong> for DOM updates</li>
                <li>• <strong>Traditional rendering</strong> cycle</li>
              </ul>
            </div>
          </div>
          
          {/* Performance Comparison */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                <span>🔔</span>
                Reactive Pattern (Current)
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{renderCountRef.current}</div>
                  <div className="text-purple-700">React Re-renders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">~16ms</div>
                  <div className="text-pink-700">Render Cycle</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                <span>🚀</span>
                Non-Reactive Pattern
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-green-700">React Re-renders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">~1ms</div>
                  <div className="text-emerald-700">DOM Update</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === 2. Demo Canvas Section === */}
      <div className="px-6 mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-pink-200 shadow-xl">
          <h2 className="text-2xl font-bold text-pink-900 mb-4 flex items-center gap-3">
            <span className="text-3xl">🎨</span>
            Interactive Demo Canvas (Reactive)
            <div className="ml-auto text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              useStoreValue() Subscriptions
            </div>
          </h2>
          
          <div className="mb-4 text-sm text-pink-700">
            Move your mouse and click to see reactive updates with React re-renders
          </div>
          
          <EnhancedContextStoreView />
        </div>
      </div>

      {/* === 3. Status Visualization Section === */}
      <div className="px-6 mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-rose-200 shadow-xl">
          <h2 className="text-2xl font-bold text-rose-900 mb-4 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Real-Time Status Visualization (Reactive)
            <div className="ml-auto text-sm bg-rose-100 text-rose-700 px-3 py-1 rounded-full">
              setState() Triggers Re-renders
            </div>
          </h2>
          
          <VisualizationDashboard
            position={visualizationData.position}
            movement={visualizationData.movement}
            clicks={visualizationData.clicks}
            activity={visualizationData.activity}
            onRefresh={refreshVisualizationData}
          />
        </div>
      </div>

      {/* === 4. Code Block Section === */}
      <div className="px-6 pb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-purple-200 shadow-xl">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">💻</span>
            Reactive Implementation Code Examples
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Reactive Store Subscriptions */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔔</span>
                Reactive Store Subscriptions
              </h3>
              <pre className="text-xs font-mono text-gray-700 overflow-x-auto bg-white p-4 rounded-lg border">
{`// Reactive pattern with useStoreValue subscriptions
const ReactiveMouseCanvas = () => {
  const activityStore = useMouseEventsModel('activity');
  const movementStore = useMouseEventsModel('movement');
  
  // These subscriptions trigger React re-renders
  const activity = useStoreValue(activityStore);
  const movement = useStoreValue(movementStore);
  
  // useEffect runs on every re-render
  useEffect(() => {
    updateCanvasVisuals(movement);
    updateActivityIndicators(activity);
  }, [movement, activity]); // Dependencies cause re-runs
  
  return <div>Canvas updates via React cycle</div>;
};`}
              </pre>
            </div>
            
            {/* useState Pattern */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔄</span>
                React State Management
              </h3>
              <pre className="text-xs font-mono text-gray-700 overflow-x-auto bg-white p-4 rounded-lg border">
{`// Reactive pattern with useState
const ReactiveVisualization = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [metrics, setMetrics] = useState(initialData);
  
  // Every setState triggers re-render
  const refreshData = useCallback(() => {
    setRenderCount(prev => prev + 1); // Re-render!
    setMetrics(newData); // Re-render!
  }, []);
  
  // Auto-refresh causes periodic re-renders
  useEffect(() => {
    const interval = setInterval(refreshData, 500);
    return () => clearInterval(interval);
  }, [refreshData]);
};`}
              </pre>
            </div>
            
            {/* Performance Trade-offs */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>⚖️</span>
                Performance Trade-offs
              </h3>
              <div className="bg-white p-4 rounded-lg border">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>Simple and predictable React patterns</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>Automatic UI synchronization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-green-600 font-bold">✅</span>
                    <span>React DevTools integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>Higher CPU usage with frequent re-renders</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>Potential performance bottlenecks</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-red-600 font-bold">❌</span>
                    <span>Memory allocation for render cycles</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pattern Comparison */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span>🔄</span>
                Reactive vs Non-Reactive
              </h3>
              <div className="bg-white p-4 rounded-lg border">
                <div className="space-y-3 text-sm">
                  <div className="font-semibold text-purple-700">🔔 Reactive Pattern</div>
                  <div className="text-purple-600 text-xs">
                    • useStoreValue() → React re-render<br/>
                    • setState() → Virtual DOM diff<br/>
                    • useEffect() → DOM updates<br/>
                    • Predictable but potentially expensive
                  </div>
                  <div className="font-semibold text-green-700 mt-3">🚀 Non-Reactive Pattern</div>
                  <div className="text-green-600 text-xs">
                    • store.getValue() → No subscription<br/>
                    • RefContext → Direct DOM manipulation<br/>
                    • Zero React re-renders<br/>
                    • Maximum performance but higher complexity
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Refactored Reactive Page Component
 */
export function EnhancedContextStorePageRefactored() {
  return (
    <MouseEventsModelProvider>
      <ReactivePageContent />
    </MouseEventsModelProvider>
  );
}

export default EnhancedContextStorePageRefactored;