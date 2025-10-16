/**
 * @fileoverview Canvas Ref Demo Page - Refactored Enhanced Context Store with createRefContext
 *
 * Refactors the enhanced-context-store mouse events logic to use createRefContext
 * instead of Context Store pattern for direct DOM manipulation and performance optimization.
 */

import {
  createRefContext,
  createStoreContext,
  useStoreValue,
} from '@context-action/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PageWithLogMonitor } from '@/components/LogMonitor';

// Canvas ref types
type CanvasRefTypes = {
  container: HTMLDivElement;
  canvas: HTMLCanvasElement;
  cursor: HTMLDivElement;
  coordinates: HTMLDivElement;
  pathSvg: SVGPathElement;
};

/**
 * Enhanced Canvas Ref Context for DOM manipulation
 */
const {
  Provider: CanvasRefProvider,
  useRefHandler: useCanvasRef,
  useRefMountState: useCanvasRefMountState,
} = createRefContext<CanvasRefTypes>('CanvasDrawing');

/**
 * Store Context for real-time state updates that trigger re-renders
 */
const { Provider: MouseStoreProvider, useStore: useMouseStore } =
  createStoreContext('MouseTracking', {
    // Real-time position that triggers re-renders
    realTimePosition: { x: -999, y: -999 },

    // Real-time movement data
    realTimeMovement: {
      velocity: 0,
      isMoving: false,
      path: [] as Array<{ x: number; y: number }>,
    },

    // Activity tracking
    realTimeActivity: {
      status: 'idle' as 'idle' | 'moving' | 'clicking',
      isHovered: false,
      totalEvents: 0,
    },

    // Click tracking
    realTimeClicks: {
      count: 0,
      recent: [] as Array<{ x: number; y: number; timestamp: number }>,
    },
  });

/**
 * Mouse tracking state interface
 */
interface MouseState {
  // Position tracking
  current: { x: number; y: number };
  previous: { x: number; y: number };
  isInsideArea: boolean;

  // Movement tracking
  velocity: number;
  isMoving: boolean;
  moveCount: number;
  path: Array<{ x: number; y: number; timestamp: number }>;

  // Click tracking
  clickCount: number;
  clickHistory: Array<{
    x: number;
    y: number;
    button: number;
    timestamp: number;
  }>;

  // Activity status
  activityStatus: 'idle' | 'moving' | 'clicking';
  totalEvents: number;
  sessionStartTime: number;

  // Performance tracking
  totalRenderCount: number;
  containerRenderCount: number;
}

/**
 * Canvas Ref Demo View - Using createStoreContext for real-time updates
 */
function CanvasRefDemoView() {
  // Ref context hooks for DOM manipulation
  const container = useCanvasRef('container');
  const canvas = useCanvasRef('canvas');
  const cursor = useCanvasRef('cursor');
  const coordinates = useCanvasRef('coordinates');
  const pathSvg = useCanvasRef('pathSvg');

  // 🎯 Reactive mount state - container 마운트 상태 감지
  const containerMountState = useCanvasRefMountState('container');
  const { isMounted: isContainerMounted, mountedTarget: containerElement } =
    containerMountState;

  // Store hooks for reactive state updates
  const realTimePositionStore = useMouseStore('realTimePosition');
  const realTimeMovementStore = useMouseStore('realTimeMovement');
  const realTimeActivityStore = useMouseStore('realTimeActivity');
  const realTimeClicksStore = useMouseStore('realTimeClicks');

  // Subscribe to real-time updates for re-renders
  const realTimePosition = useStoreValue(realTimePositionStore);
  const realTimeMovement = useStoreValue(realTimeMovementStore);
  const realTimeActivity = useStoreValue(realTimeActivityStore);
  const realTimeClicks = useStoreValue(realTimeClicksStore);

  // Local state management (replaces Context Store pattern)
  const [mouseState, setMouseState] = useState<MouseState>({
    current: { x: -999, y: -999 },
    previous: { x: -999, y: -999 },
    isInsideArea: false,
    velocity: 0,
    isMoving: false,
    moveCount: 0,
    path: [],
    clickCount: 0,
    clickHistory: [],
    activityStatus: 'idle',
    totalEvents: 0,
    sessionStartTime: Date.now(),
    totalRenderCount: 0,
    containerRenderCount: 0,
  });

  // UI state (non-reactive)
  const [showDetails, setShowDetails] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);

  // Performance refs
  const throttleTimeoutRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const realtimePathPoints = useRef<Array<{ x: number; y: number }>>([]);
  const lastMoveTimeRef = useRef<number>(0);

  // 🎯 실시간 상태 추적을 위한 refs (쓰로틀링 없음)
  const realTimeStateRef = useRef({
    isMoving: false,
    velocity: 0,
    lastPosition: { x: -999, y: -999 },
    lastMoveTime: 0,
  });

  // === 반응형 마운트 상태에 따른 시각적 피드백 ===
  useEffect(() => {
    if (isContainerMounted && containerElement) {
      console.log(
        '🎯 [CanvasRefDemoView] Container mounted via reactive state'
      );
      containerElement.style.border = '2px solid #10b981';
    } else if (!isContainerMounted) {
      console.log('🔄 [CanvasRefDemoView] Container unmounted');
      // 언마운트 시 정리 작업은 container.target이 있을 때만 수행
      if (container.target) {
        container.target.style.border = '';
      }
    }
  }, [isContainerMounted, containerElement, container]);

  // === 반응형 마운트 상태에 따른 기능 활성화 ===
  useEffect(() => {
    if (isContainerMounted) {
      console.log(
        '🚀 [CanvasRefDemoView] Container is mounted, canvas features activated'
      );
    }
  }, [isContainerMounted]);

  // Real-time activity status update using createStoreContext pattern
  useEffect(() => {
    const updateActivityStatus = () => {
      const now = Date.now();

      // Get current store values
      const currentMovement = realTimeMovementStore.getValue();
      const currentClicks = realTimeClicksStore.getValue();
      const currentActivity = realTimeActivityStore.getValue();

      const recentClicks = currentClicks.recent.filter(
        (click) => now - click.timestamp <= 1500
      );
      const lastClickTime = currentClicks.recent[0]?.timestamp || null;
      const timeSinceLastClick = lastClickTime ? now - lastClickTime : Infinity;

      const newActivityStatus = (() => {
        // Very recent click (within 300ms)
        if (recentClicks.length > 0 && timeSinceLastClick < 300) {
          return 'clicking';
        }

        // Currently moving with sufficient velocity (consistent with movement threshold)
        if (currentMovement.isMoving || currentMovement.velocity > 0.002) {
          return 'moving';
        }

        // Recent click but not currently moving
        if (recentClicks.length > 0 && timeSinceLastClick < 1000) {
          return 'clicking';
        }

        // Default to idle when not moving and no recent clicks
        return 'idle';
      })();

      // 🎯 Update store if changed for real-time reactivity
      if (currentActivity.status !== newActivityStatus) {
        realTimeActivityStore.setValue({
          ...currentActivity,
          status: newActivityStatus,
        });
      }
    };

    // Initial run and periodic updates (100ms interval for more responsive)
    updateActivityStatus();
    const interval = setInterval(updateActivityStatus, 100);

    return () => clearInterval(interval);
  }, [realTimeActivityStore, realTimeMovementStore, realTimeClicksStore]);

  // === 🎯 반응형 안전한 DOM 조작 ===
  const safeWithContainer = useCallback(
    (callback: (container: HTMLDivElement) => void) => {
      if (isContainerMounted && containerElement) {
        callback(containerElement);
      }
    },
    [isContainerMounted, containerElement]
  );

  // Performance optimized mouse move handler using createStoreContext + createRefContext
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const containerEl = container.target;
      if (!containerEl) return;

      const rect = containerEl.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      const timestamp = Date.now();

      // 🎯 Get previous position BEFORE updating store
      const previousPos = realTimePositionStore.getValue();

      // 🎯 Calculate velocity immediately for real-time updates
      const deltaTime = timestamp - lastMoveTimeRef.current;
      const deltaX = x - previousPos.x;
      const deltaY = y - previousPos.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      // More stable velocity calculation with minimum time threshold
      const velocity = deltaTime > 8 && distance > 1 ? distance / deltaTime : 0;

      // 🎯 Update position store for real-time re-renders
      realTimePositionStore.setValue({ x, y });

      // 🎯 Update movement store immediately for real-time velocity display
      const currentMovement = realTimeMovementStore.getValue();
      const newPath = [...currentMovement.path, { x, y }].slice(-50);

      // Use smoothed velocity to reduce jitter
      const smoothedVelocity =
        velocity > 0 ? velocity : currentMovement.velocity * 0.85; // Slower decay
      const finalVelocity = smoothedVelocity < 0.001 ? 0 : smoothedVelocity; // Complete stop at very low values
      const isMoving = finalVelocity > 0.002; // Consistent with display threshold

      realTimeMovementStore.setValue({
        velocity: finalVelocity,
        isMoving,
        path: newPath,
      });

      // 🎯 Update activity store for real-time status (less frequently)
      if (deltaTime > 50) {
        // Only update activity every 50ms to reduce jitter
        const currentActivity = realTimeActivityStore.getValue();
        realTimeActivityStore.setValue({
          ...currentActivity,
          status: isMoving ? 'moving' : currentActivity.status, // Don't immediately switch to idle
          totalEvents: currentActivity.totalEvents + 1,
        });
      }

      lastMoveTimeRef.current = timestamp;

      // Update cursor position with GPU acceleration via createRefContext
      const cursorRef = cursor.target;
      if (cursorRef) {
        cursorRef.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
      }

      // Update coordinates display via createRefContext
      const coordinatesRef = coordinates.target;
      if (coordinatesRef && showDetails) {
        coordinatesRef.textContent = `(${x}, ${y})`;
        coordinatesRef.style.transform = `translate(${x + 16}px, ${y - 32}px)`;
      }

      // Update real-time path for smooth drawing
      realtimePathPoints.current = [
        ...realtimePathPoints.current,
        { x, y },
      ].slice(-50);

      // Update SVG path directly for immediate visual feedback via createRefContext
      const pathSvgRef = pathSvg.target;
      if (pathSvgRef && realtimePathPoints.current.length > 1) {
        const pathData = realtimePathPoints.current
          .map(
            (point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
          )
          .join(' ');
        pathSvgRef.setAttribute('d', pathData);
      }

      // Legacy throttled updates for remaining features (optional)
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      throttleTimeoutRef.current = window.setTimeout(() => {
        // Update legacy mouseState for remaining non-reactive features
        setMouseState((prev) => ({
          ...prev,
          previous: { x: previousPos.x, y: previousPos.y },
          current: { x, y },
          isInsideArea: true,
          velocity,
          isMoving: velocity > 0.1,
          moveCount: prev.moveCount + 1,
          path: [...prev.path, { x, y, timestamp }].slice(-50),
          totalEvents: prev.totalEvents + 1,
          containerRenderCount: prev.containerRenderCount + 1,
        }));
      }, 16); // ~60fps throttling
    },
    [
      cursor,
      coordinates,
      pathSvg,
      showDetails,
      realTimePositionStore,
      realTimeMovementStore,
      realTimeActivityStore,
    ]
  );

  // Mouse click handler using createStoreContext + createRefContext pattern
  const handleMouseClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const containerEl = container.target;
      if (!containerEl) return;

      const rect = containerEl.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      const timestamp = Date.now();

      // 🎯 Update click store for real-time updates
      const currentClicks = realTimeClicksStore.getValue();
      realTimeClicksStore.setValue({
        count: currentClicks.count + 1,
        recent: [{ x, y, timestamp }, ...currentClicks.recent].slice(0, 10),
      });

      // 🎯 Update activity store for status change
      const currentActivity = realTimeActivityStore.getValue();
      realTimeActivityStore.setValue({
        ...currentActivity,
        status: 'clicking',
        totalEvents: currentActivity.totalEvents + 1,
      });

      // Update legacy state for remaining features
      setMouseState((prev) => ({
        ...prev,
        clickCount: prev.clickCount + 1,
        clickHistory: [
          { x, y, button: e.button, timestamp },
          ...prev.clickHistory,
        ].slice(0, 10),
        totalEvents: prev.totalEvents + 1,
      }));
    },
    [realTimeClicksStore, realTimeActivityStore]
  );

  // Mouse enter handler
  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const containerEl = container.target;
      if (!containerEl) return;

      const rect = containerEl.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      const timestamp = Date.now();

      // 🎯 Update stores for real-time reactivity
      realTimePositionStore.setValue({ x, y });
      realTimeActivityStore.setValue({
        status: 'idle',
        isHovered: true,
        totalEvents: realTimeActivityStore.getValue().totalEvents + 1,
      });
      realTimeMovementStore.setValue({
        velocity: 0,
        isMoving: false,
        path: [{ x, y }],
      });

      // Initialize real-time path and timing
      realtimePathPoints.current = [{ x, y }];
      lastMoveTimeRef.current = timestamp; // Initialize timing for velocity calculation

      // Show cursor immediately via createRefContext
      const cursorRef = cursor.target;
      if (cursorRef) {
        cursorRef.style.opacity = '1';
        cursorRef.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
      }

      // Update legacy state
      setMouseState((prev) => ({
        ...prev,
        current: { x, y },
        isInsideArea: true,
        totalEvents: prev.totalEvents + 1,
      }));
    },
    [
      cursor,
      realTimePositionStore,
      realTimeActivityStore,
      realTimeMovementStore,
    ]
  );

  // Mouse leave handler
  const handleMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 🎯 안전한 컨테이너 접근 - 마운트 상태 확인 (leave는 필수 아님)
      let x = -999,
        y = -999;

      if (isContainerMounted && containerElement) {
        const rect = containerElement.getBoundingClientRect();
        x = Math.round(e.clientX - rect.left);
        y = Math.round(e.clientY - rect.top);
      }

      // 🎯 Update stores for real-time reactivity
      realTimePositionStore.setValue({ x: -999, y: -999 });
      realTimeActivityStore.setValue({
        status: 'idle',
        isHovered: false,
        totalEvents: realTimeActivityStore.getValue().totalEvents + 1,
      });
      realTimeMovementStore.setValue({
        velocity: 0,
        isMoving: false,
        path: [],
      });

      // Hide cursor immediately via createRefContext
      const cursorRef = cursor.target;
      if (cursorRef) {
        cursorRef.style.opacity = '0';
      }

      // Hide coordinates via createRefContext
      const coordinatesRef = coordinates.target;
      if (coordinatesRef) {
        coordinatesRef.style.opacity = '0';
      }

      // Clear real-time path
      realtimePathPoints.current = [];

      // Clear SVG path immediately via createRefContext
      const pathSvgRef = pathSvg.target;
      if (pathSvgRef) {
        pathSvgRef.setAttribute('d', '');
      }

      // Clear any pending throttled updates
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      // Update legacy state
      setMouseState((prev) => ({
        ...prev,
        isInsideArea: false,
        totalEvents: prev.totalEvents + 1,
      }));
    },
    [
      cursor,
      coordinates,
      pathSvg,
      realTimePositionStore,
      realTimeActivityStore,
      realTimeMovementStore,
    ]
  );

  // Reset handler
  const handleReset = useCallback(() => {
    // 🎯 Reset all stores for complete state reset
    realTimePositionStore.setValue({ x: -999, y: -999 });
    realTimeMovementStore.setValue({ velocity: 0, isMoving: false, path: [] });
    realTimeActivityStore.setValue({
      status: 'idle',
      isHovered: false,
      totalEvents: 0,
    });
    realTimeClicksStore.setValue({ count: 0, recent: [] });

    // Clear real-time data
    realtimePathPoints.current = [];

    // Clear path SVG via createRefContext
    const pathSvgRef = pathSvg.target;
    if (pathSvgRef) {
      pathSvgRef.setAttribute('d', '');
    }

    // Reset legacy state
    setMouseState((prev) => ({
      ...prev,
      current: { x: -999, y: -999 },
      previous: { x: -999, y: -999 },
      isInsideArea: false,
      velocity: 0,
      isMoving: false,
      moveCount: 0,
      path: [],
      clickCount: 0,
      clickHistory: [],
      activityStatus: 'idle',
      totalEvents: 0,
      containerRenderCount: 0,
    }));
  }, [
    pathSvg,
    realTimePositionStore,
    realTimeMovementStore,
    realTimeActivityStore,
    realTimeClicksStore,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Computed values using real-time stores (reactive)
  const averageVelocity =
    realTimeMovement.path.length > 1
      ? realTimeMovement.path.reduce((sum, p, i, arr) => {
          if (i === 0) return sum;
          const prev = arr[i - 1];
          const distance = Math.sqrt(
            (p.x - prev!.x) ** 2 + (p.y - prev!.y) ** 2
          );
          // Use estimated time since we don't have timestamps in real-time path
          const deltaTime = 16; // Assume 60fps (16ms between points)
          return sum + (deltaTime > 0 ? distance / deltaTime : 0);
        }, 0) /
        (realTimeMovement.path.length - 1)
      : 0;

  const recentClickCount = realTimeClicks.recent.filter(
    (click) => Date.now() - click.timestamp <= 1500
  ).length;

  const hasActivity = realTimeActivity.totalEvents > 0;

  return (
    <CanvasRefProvider>
      <div className="p-6">
        {/* CSS for animations and performance */}
        <style>{`
          @keyframes pathDraw {
            from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
            to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
          }
          
          @keyframes dashMove {
            0% { stroke-dashoffset: 0; }
            100% { stroke-dashoffset: 20; }
          }
          
          .click-connection-line {
            animation: dashMove 2s linear infinite;
          }
          
          /* GPU acceleration for smooth animations */
          .will-change-transform {
            will-change: transform;
          }
          
          /* Smooth cursor transitions */
          .cursor-smooth {
            transition: transform 16ms linear;
          }
          
          /* Reduce motion for accessibility */
          @media (prefers-reduced-motion: reduce) {
            .animate-pulse, .animate-ping, .click-connection-line {
              animation: none;
            }
            .cursor-smooth {
              transition: none;
            }
          }
        `}</style>

        {/* Header with Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-pulse">🎨</span>
            <div>
              <h2 className="text-2xl font-bold text-purple-800">
                Canvas Ref Demo
              </h2>
              <p className="text-sm text-purple-600">
                createRefContext mouse tracking and drawing
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <span>{showDetails ? '👁️' : '🔍'}</span>
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <span>🔄</span>
              Reset
            </button>
          </div>
        </div>

        <p className="text-gray-600 mb-6">
          createRefContext Pattern with direct DOM manipulation for optimal
          performance
        </p>

        {/* State Display (replaces individual store subscriptions) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📍</span>
              <h4 className="font-semibold text-purple-800 text-sm">
                Real-Time Position
              </h4>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-purple-700 font-mono bg-white/50 px-2 py-1 rounded">
                ({realTimePosition.x}, {realTimePosition.y})
              </p>
              <p className="text-xs text-purple-600">
                Inside:{' '}
                {realTimeActivity.isHovered ? '✅ Active' : '❌ Outside'}
              </p>
              {showDetails && (
                <p className="text-xs text-purple-500">
                  Legacy: ({mouseState.current.x}, {mouseState.current.y})
                </p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🏃</span>
              <h4 className="font-semibold text-green-800 text-sm">
                Real-Time Movement
              </h4>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-green-700 font-mono bg-white/50 px-2 py-1 rounded">
                {realTimeMovement.velocity > 0.05
                  ? `${realTimeMovement.velocity.toFixed(2)} px/ms`
                  : realTimeMovement.velocity > 0.01
                    ? `${(realTimeMovement.velocity * 1000).toFixed(0)} px/s`
                    : realTimeMovement.velocity > 0.002
                      ? `${realTimeMovement.velocity.toFixed(3)} px/ms`
                      : 'Idle'}
              </p>
              <p className="text-xs text-green-600">
                Path: {realTimeMovement.path.length} points
              </p>
              {showDetails && (
                <>
                  <p className="text-xs text-green-500">
                    Moving: {realTimeMovement.isMoving ? '✅' : '❌'}
                  </p>
                  <p className="text-xs text-green-500">
                    Legacy Count: {mouseState.moveCount}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">👆</span>
              <h4 className="font-semibold text-orange-800 text-sm">
                Real-Time Clicks
              </h4>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-orange-700 font-mono bg-white/50 px-2 py-1 rounded">
                {realTimeClicks.count} clicks
              </p>
              <p className="text-xs text-orange-600">
                Recent: {realTimeClicks.recent.length}
              </p>
              {showDetails && realTimeClicks.recent[0] && (
                <p className="text-xs text-orange-500">
                  Last: ({realTimeClicks.recent[0].x},{' '}
                  {realTimeClicks.recent[0].y})
                </p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl border border-cyan-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🧮</span>
              <h4 className="font-semibold text-cyan-800 text-sm">
                Real-Time Activity
              </h4>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-cyan-700">
                Status:{' '}
                <span
                  className={`font-mono px-1.5 py-0.5 rounded text-xs ${
                    realTimeActivity.status === 'moving'
                      ? 'bg-green-200 text-green-800'
                      : realTimeActivity.status === 'clicking'
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {realTimeActivity.status}
                </span>
              </p>
              <p className="text-xs text-cyan-600">
                Events: {realTimeActivity.totalEvents}
              </p>
              {showDetails && (
                <>
                  <p className="text-xs text-cyan-500">
                    Avg Velocity: {averageVelocity.toFixed(2)}
                  </p>
                  <p className="text-xs text-cyan-500">
                    Recent Clicks: {recentClickCount}
                  </p>
                  <p className="text-xs text-cyan-500">
                    Hovered: {realTimeActivity.isHovered ? '✅' : '❌'}
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📊</span>
              <h4 className="font-semibold text-teal-800 text-sm">
                Performance
              </h4>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-teal-700">
                Renders: {mouseState.totalRenderCount}
              </p>
              <p className="text-xs text-teal-600">
                Session:{' '}
                {Math.floor((Date.now() - mouseState.sessionStartTime) / 1000)}s
              </p>
              {showDetails && (
                <p className="text-xs text-teal-500">
                  Container: {mouseState.containerRenderCount}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Interactive Mouse Area with createRefContext */}
        <div className="p-6 border border-purple-200 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-purple-800 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Interactive Canvas Ref Area
            </h3>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-purple-600">Animation Speed:</span>
                <input
                  type="range"
                  min="0.1"
                  max="2"
                  step="0.1"
                  value={animationSpeed}
                  onChange={(e) =>
                    setAnimationSpeed(parseFloat(e.target.value))
                  }
                  className="w-16"
                />
                <span className="text-purple-700 font-mono">
                  {animationSpeed}x
                </span>
              </div>

              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  realTimeActivity.isHovered
                    ? 'bg-purple-200 text-purple-800'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {realTimeActivity.isHovered ? '🖱️ Tracking' : '💤 Idle'}
              </div>
            </div>
          </div>

          <div
            ref={container.setRef}
            className="relative w-full h-80 bg-gradient-to-br from-purple-50 via-pink-50 to-cyan-50 border-2 border-purple-300 rounded-xl overflow-hidden cursor-crosshair shadow-inner transition-all duration-300 hover:shadow-lg"
            style={{
              background: realTimeActivity.isHovered
                ? 'linear-gradient(135deg, #fdf4ff 0%, #fdf2f8 50%, #ecfeff 100%)'
                : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 50%, #f0f9ff 100%)',
            }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* High-performance cursor indicator via createRefContext + createStoreContext */}
            {realTimeActivity.isHovered && (
              <>
                {/* Real-time cursor (GPU accelerated) - Now reactive! */}
                <div
                  ref={cursor.setRef}
                  className="absolute pointer-events-none w-4 h-4 will-change-transform transition-opacity duration-150"
                  style={{
                    transform: `translate(${realTimePosition.x - 8}px, ${realTimePosition.y - 8}px)`,
                    opacity: realTimeActivity.isHovered ? 1 : 0,
                  }}
                >
                  {/* Main cursor */}
                  <div className="w-4 h-4 bg-purple-500 border-2 border-white rounded-full shadow-lg animate-pulse" />
                </div>

                {/* Velocity indicator - Now reactive with store updates! */}
                {realTimeMovement.velocity > 5 &&
                  realTimeActivity.isHovered &&
                  realTimePosition.x !== -999 && (
                    <div
                      className="absolute pointer-events-none transition-all duration-150"
                      style={{
                        left:
                          realTimePosition.x -
                          Math.min(realTimeMovement.velocity, 20),
                        top:
                          realTimePosition.y -
                          Math.min(realTimeMovement.velocity, 20),
                        width: Math.min(realTimeMovement.velocity * 2, 40),
                        height: Math.min(realTimeMovement.velocity * 2, 40),
                      }}
                    >
                      <div className="w-full h-full rounded-full bg-purple-300/30 border border-purple-400/50 animate-ping" />
                    </div>
                  )}

                {/* Real-time coordinate display via createRefContext - Now reactive! */}
                {showDetails && (
                  <div
                    ref={coordinates.setRef}
                    className="absolute pointer-events-none bg-purple-800 text-white px-2 py-1 rounded text-xs font-mono shadow-lg will-change-transform transition-opacity duration-150"
                    style={{
                      transform: `translate(${realTimePosition.x + 16}px, ${realTimePosition.y - 32}px)`,
                      opacity: realTimeActivity.isHovered ? 1 : 0,
                    }}
                  >
                    ({realTimePosition.x}, {realTimePosition.y})
                  </div>
                )}
              </>
            )}

            {/* High-performance real-time path visualization - Now reactive via createStoreContext! */}
            {(realTimeMovement.path.length > 1 ||
              realTimeClicks.recent.length > 1) && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient
                    id="realtimePathGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(147, 51, 234, 1.0)" />
                    <stop offset="50%" stopColor="rgba(168, 85, 247, 0.8)" />
                    <stop offset="100%" stopColor="rgba(219, 39, 119, 0.6)" />
                  </linearGradient>
                  <linearGradient
                    id="clickConnectionGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
                    <stop offset="50%" stopColor="rgba(99, 102, 241, 0.6)" />
                    <stop offset="100%" stopColor="rgba(139, 92, 246, 0.4)" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Real-time path (foreground - smooth) - Now reactive! */}
                {realTimeMovement.path.length > 1 && (
                  <path
                    ref={pathSvg.setRef}
                    d={realTimeMovement.path
                      .map(
                        (point, index) =>
                          `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                      )
                      .join(' ')}
                    stroke="url(#realtimePathGradient)"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#glow)"
                    style={{
                      transition: 'none', // No transition for real-time updates
                      opacity: realTimeActivity.isHovered ? 1 : 0.7, // Slightly fade when not hovering but still visible
                    }}
                  />
                )}

                {/* Click connection lines (separate from mouse movement path) - Now reactive! */}
                {realTimeClicks.recent.length > 1 && (
                  <path
                    className="click-connection-line"
                    d={realTimeClicks.recent
                      .slice(0, 5) // Only connect recent 5 clicks
                      .map(
                        (click, index) =>
                          `${index === 0 ? 'M' : 'L'} ${click.x} ${click.y}`
                      )
                      .join(' ')}
                    stroke="url(#clickConnectionGradient)" // Blue gradient for click connections
                    strokeWidth="2"
                    strokeDasharray="8,4" // Dashed line to distinguish from mouse path
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                )}

                {/* Path points */}
                {showDetails &&
                  mouseState.path
                    .filter((p) => p.x !== -999 && p.y !== -999)
                    .slice(-10) // Show last 10 points
                    .map((point, index, array) => (
                      <circle
                        key={`${point.x}-${point.y}-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={2}
                        fill="rgba(147, 51, 234, 0.8)"
                        opacity={0.3 + (index / array.length) * 0.7}
                      />
                    ))}
              </svg>
            )}

            {/* Enhanced click indicators - Now reactive! */}
            {realTimeClicks.recent.slice(0, 8).map((click, index) => {
              const age = Date.now() - click.timestamp;
              const isRecent = age < 2000;

              return (
                <div
                  key={`${click.x}-${click.y}-${click.timestamp}`}
                  className="absolute pointer-events-none"
                  style={{
                    left: click.x - 16,
                    top: click.y - 16,
                    opacity: isRecent ? 1 - index * 0.15 : 0.3,
                    transform: `scale(${isRecent ? 1 - (index * 0.08) : 0.6})`,
                    transition: `all ${300 / animationSpeed}ms ease-out`,
                  }}
                >
                  {/* Ripple effect */}
                  <div
                    className="absolute inset-0 w-8 h-8 border-2 border-purple-600 rounded-full animate-ping"
                    style={{ animationDuration: `${1000 / animationSpeed}ms` }}
                  />

                  {/* Click marker */}
                  <div className="w-8 h-8 bg-purple-500/20 border-2 border-purple-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  </div>

                  {/* Click number */}
                  {showDetails && isRecent && (
                    <div className="absolute -top-6 -left-2 bg-purple-800 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                      #{realTimeClicks.count - index}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Enhanced instructions */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-purple-200 transition-all duration-500 ${
                  realTimeActivity.isHovered || hasActivity
                    ? 'opacity-30 scale-95'
                    : 'opacity-100 scale-100'
                }`}
              >
                <div className="text-4xl mb-3 animate-bounce">🎨</div>
                <h4 className="text-lg font-semibold text-purple-800 mb-2">
                  Canvas Ref Demo Area
                </h4>
                <p className="text-sm text-gray-700 mb-2">
                  Move mouse and click to see createRefContext in action
                </p>
                <div className="text-xs text-gray-600 space-y-1">
                  <p className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    Direct DOM manipulation → Performance optimization
                  </p>
                  <p className="flex items-center justify-center gap-1">
                    <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                    createRefContext → Type-safe ref management
                  </p>
                </div>

                {/* Activity indicator */}
                <div className="mt-4 flex justify-center">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      hasActivity
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {hasActivity
                      ? '✨ Active Session'
                      : '💤 Waiting for interaction'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Legend */}
          <div className="mt-4 bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
              <span className="text-sm">🎨</span>
              Visual Guide
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <svg width="30" height="8" viewBox="0 0 30 8">
                    <path
                      d="M0 4 L30 4"
                      stroke="url(#realtimePathGradient)"
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-purple-700">
                  <strong>Mouse Path:</strong> Real-time movement trail
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center">
                  <svg width="30" height="8" viewBox="0 0 30 8">
                    <path
                      d="M0 4 L30 4"
                      stroke="url(#clickConnectionGradient)"
                      strokeWidth="2"
                      strokeDasharray="8,4"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span className="text-blue-700">
                  <strong>Click Connections:</strong> Links between click points
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-purple-500 border-2 border-white rounded-full shadow-sm"></div>
                <span className="text-purple-700">
                  <strong>Live Cursor:</strong> Real-time position tracker
                </span>
              </div>
            </div>
          </div>

          {/* Enhanced status information */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <span className="text-sm">🏗️</span>
                Architecture Info
              </h4>
              <div className="space-y-1 text-purple-700">
                <p>✨ createRefContext Pattern: Direct DOM manipulation</p>
                <p>
                  ⚡ Performance optimization: GPU acceleration + throttling
                </p>
                <p>🔄 Real-time updates: Immediate visual feedback</p>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-200">
              <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                <span className="text-sm">📊</span>
                Performance Stats
              </h4>
              <div className="space-y-1 text-purple-700">
                <p>
                  🎯 Render optimization: {mouseState.totalRenderCount} total
                  renders
                </p>
                <p>
                  ⏱️ Session duration:{' '}
                  {Math.floor(
                    (Date.now() - mouseState.sessionStartTime) / 1000
                  )}
                  s
                </p>
                <p>
                  🏃 Activity level: {mouseState.activityStatus} (
                  {mouseState.totalEvents} events)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CanvasRefProvider>
  );
}

export function CanvasRefDemoPage() {
  return (
    <PageWithLogMonitor
      pageId="canvas-ref-demo-mouse"
      title="Canvas Ref Demo Mouse Events"
      initialConfig={{ enableToast: false, maxLogs: 50 }}
    >
      <div className="page-container">
        <header className="page-header">
          <h1>🎨 Canvas Ref Demo Mouse Events</h1>
          <p className="page-description">
            createRefContext pattern with{' '}
            <strong>
              direct DOM manipulation, performance optimization, and real-time
              tracking
            </strong>
            . Refactored from enhanced-context-store for maximum performance.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-4">
            <h2 className="font-semibold text-purple-800 mb-2">
              🎨 createRefContext Features:
            </h2>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>
                • <strong>Direct DOM Access</strong> - Bypasses React
                reconciliation
              </li>
              <li>
                • <strong>GPU Acceleration</strong> - Optimized transform
                animations
              </li>
              <li>
                • <strong>Real-time Performance</strong> - Immediate visual
                feedback
              </li>
              <li>
                • <strong>Type-Safe Refs</strong> - TypeScript-safe ref
                management
              </li>
            </ul>
          </div>
        </header>

        <MouseStoreProvider>
          <CanvasRefProvider>
            <CanvasRefDemoView />
          </CanvasRefProvider>
        </MouseStoreProvider>
      </div>
    </PageWithLogMonitor>
  );
}
