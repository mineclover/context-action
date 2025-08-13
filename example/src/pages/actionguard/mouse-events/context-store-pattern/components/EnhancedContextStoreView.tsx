/**
 * Enhanced Context Store View - Full Implementation with Real Mouse Interaction
 */

import { useStoreValue } from '@context-action/react';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useMouseEventsActionDispatch, useMouseEventsStore } from '../context/MouseEventsContext';

export function EnhancedContextStoreView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const coordinatesRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [realTimePosition, setRealTimePosition] = useState({ x: -999, y: -999 });
  const throttleTimeoutRef = useRef<number>();
  const animationFrameRef = useRef<number>();

  // Access individual stores using the Context Store Pattern
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');
  const performanceStore = useMouseEventsStore('performance');
  
  // Subscribe to individual store values
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);
  const performance = useStoreValue(performanceStore);
  
  // Action dispatcher
  const dispatch = useMouseEventsActionDispatch();

  // Performance optimized mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // Real-time cursor update (no throttling)
    setRealTimePosition({ x, y });
    
    // Update cursor position with GPU acceleration
    if (cursorRef.current) {
      cursorRef.current.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
    }
    
    // Update coordinates display
    if (coordinatesRef.current && showDetails) {
      coordinatesRef.current.textContent = `(${x}, ${y})`;
      coordinatesRef.current.style.transform = `translate(${x + 16}px, ${y - 32}px)`;
    }
    
    // Throttled store updates to prevent performance issues
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = window.setTimeout(() => {
      dispatch('mouseMove', { x, y, timestamp });
    }, 16); // ~60fps throttling
  }, [dispatch, showDetails]);
  
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

  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    dispatch('mouseClick', { x, y, button: e.button, timestamp });
  }, [dispatch]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    setIsHovered(true);
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // Initialize real-time position
    setRealTimePosition({ x, y });
    
    // Show cursor immediately
    if (cursorRef.current) {
      cursorRef.current.style.opacity = '1';
      cursorRef.current.style.transform = `translate(${x - 8}px, ${y - 8}px)`;
    }
    
    dispatch('mouseEnter', { x, y, timestamp });
  }, [dispatch]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    setIsHovered(false);
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    // Hide cursor immediately
    if (cursorRef.current) {
      cursorRef.current.style.opacity = '0';
    }
    
    // Hide coordinates
    if (coordinatesRef.current) {
      coordinatesRef.current.style.opacity = '0';
    }
    
    // Clear any pending throttled updates
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    dispatch('mouseLeave', { x, y, timestamp });
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch('resetMouseState');
  }, [dispatch]);

  return (
    <div className="p-6">
      {/* Add CSS for animations and performance */}
      <style>{`
        @keyframes pathDraw {
          from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
          to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
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
          .animate-pulse, .animate-ping {
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
          <span className="text-3xl animate-pulse">🏪</span>
          <div>
            <h2 className="text-2xl font-bold text-emerald-800">Enhanced Context Store Demo</h2>
            <p className="text-sm text-emerald-600">Real-time mouse tracking with individual stores</p>
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
        Interactive Context Store Pattern with individual store subscriptions
      </p>

      {/* Store Values Display */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📍</span>
            <h4 className="font-semibold text-blue-800 text-sm">Position Store</h4>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-blue-700 font-mono bg-white/50 px-2 py-1 rounded">
              ({position.current.x}, {position.current.y})
            </p>
            <p className="text-xs text-blue-600">
              Inside: {position.isInsideArea ? '✅ Active' : '❌ Outside'}
            </p>
            {showDetails && (
              <p className="text-xs text-blue-500">
                Prev: ({position.previous.x}, {position.previous.y})
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🏃</span>
            <h4 className="font-semibold text-green-800 text-sm">Movement Store</h4>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-green-700 font-mono bg-white/50 px-2 py-1 rounded">
              {movement.velocity.toFixed(2)} px/ms
            </p>
            <p className="text-xs text-green-600">
              Path: {movement.path.length} points
            </p>
            {showDetails && (
              <>
                <p className="text-xs text-green-500">
                  Moving: {movement.isMoving ? '✅' : '❌'}
                </p>
                <p className="text-xs text-green-500">
                  Count: {movement.moveCount}
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">👆</span>
            <h4 className="font-semibold text-purple-800 text-sm">Clicks Store</h4>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-purple-700 font-mono bg-white/50 px-2 py-1 rounded">
              {clicks.count} clicks
            </p>
            <p className="text-xs text-purple-600">
              History: {clicks.history.length}
            </p>
            {showDetails && clicks.history[0] && (
              <p className="text-xs text-purple-500">
                Last: ({clicks.history[0].x}, {clicks.history[0].y})
              </p>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧮</span>
            <h4 className="font-semibold text-orange-800 text-sm">Computed Store</h4>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-orange-700">
              Status: <span className={`font-mono px-1.5 py-0.5 rounded text-xs ${
                computed.activityStatus === 'moving' ? 'bg-green-200 text-green-800' :
                computed.activityStatus === 'clicking' ? 'bg-purple-200 text-purple-800' :
                'bg-gray-200 text-gray-800'
              }`}>{computed.activityStatus}</span>
            </p>
            <p className="text-xs text-orange-600">
              Events: {computed.totalEvents}
            </p>
            {showDetails && (
              <>
                <p className="text-xs text-orange-500">
                  Avg Velocity: {computed.averageVelocity.toFixed(2)}
                </p>
                <p className="text-xs text-orange-500">
                  Recent Clicks: {computed.recentClickCount}
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 p-4 rounded-xl border border-teal-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <h4 className="font-semibold text-teal-800 text-sm">Performance</h4>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-teal-700">
              Renders: {performance.totalRenderCount}
            </p>
            <p className="text-xs text-teal-600">
              Session: {Math.floor((Date.now() - performance.sessionStartTime) / 1000)}s
            </p>
            {showDetails && (
              <p className="text-xs text-teal-500">
                Container: {performance.containerRenderCount}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Mouse Area */}
      <div className="p-6 border border-emerald-200 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-emerald-800 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Interactive Context Store Area
          </h3>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600">Animation Speed:</span>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={animationSpeed}
                onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                className="w-16"
              />
              <span className="text-emerald-700 font-mono">{animationSpeed}x</span>
            </div>
            
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              isHovered ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-600'
            }`}>
              {isHovered ? '🖱️ Tracking' : '💤 Idle'}
            </div>
          </div>
        </div>
        
        <div
          ref={containerRef}
          className="relative w-full h-80 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-2 border-emerald-300 rounded-xl overflow-hidden cursor-crosshair shadow-inner transition-all duration-300 hover:shadow-lg"
          style={{
            background: isHovered 
              ? 'linear-gradient(135deg, #ecfdf5 0%, #f0fdfa 50%, #e6fffa 100%)'
              : 'linear-gradient(135deg, #f0fdf4 0%, #f0fdfa 50%, #f0f9ff 100%)'
          }}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* High-performance cursor indicator */}
          {isHovered && (
            <>
              {/* Real-time cursor (GPU accelerated) */}
              <div
                ref={cursorRef}
                className="absolute pointer-events-none w-4 h-4 will-change-transform transition-opacity duration-150"
                style={{
                  transform: `translate(${realTimePosition.x - 8}px, ${realTimePosition.y - 8}px)`,
                  opacity: isHovered ? 1 : 0,
                }}
              >
                {/* Main cursor */}
                <div className="w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-lg animate-pulse" />
              </div>
              
              {/* Velocity indicator (store-based) */}
              {movement.velocity > 5 && position.isInsideArea && position.current.x !== -999 && (
                <div
                  className="absolute pointer-events-none transition-all duration-150"
                  style={{
                    left: position.current.x - Math.min(movement.velocity, 20),
                    top: position.current.y - Math.min(movement.velocity, 20),
                    width: Math.min(movement.velocity * 2, 40),
                    height: Math.min(movement.velocity * 2, 40),
                  }}
                >
                  <div className="w-full h-full rounded-full bg-emerald-300/30 border border-emerald-400/50 animate-ping" />
                </div>
              )}
              
              {/* Real-time coordinate display */}
              {showDetails && (
                <div
                  ref={coordinatesRef}
                  className="absolute pointer-events-none bg-emerald-800 text-white px-2 py-1 rounded text-xs font-mono shadow-lg will-change-transform transition-opacity duration-150"
                  style={{
                    transform: `translate(${realTimePosition.x + 16}px, ${realTimePosition.y - 32}px)`,
                    opacity: isHovered ? 1 : 0,
                  }}
                >
                  ({realTimePosition.x}, {realTimePosition.y})
                </div>
              )}
            </>
          )}
          
          {/* Enhanced path visualization */}
          {movement.path.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(16, 185, 129, 0.8)" />
                  <stop offset="50%" stopColor="rgba(20, 184, 166, 0.6)" />
                  <stop offset="100%" stopColor="rgba(59, 130, 246, 0.4)" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/> 
                  </feMerge>
                </filter>
              </defs>
              
              {/* Path with gradient and glow */}
              <path
                d={movement.path
                  .filter(p => p.x !== -999 && p.y !== -999)
                  .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                  .join(' ')
                }
                stroke="url(#pathGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#glow)"
                style={{
                  animation: `pathDraw ${2 / animationSpeed}s ease-in-out`,
                }}
              />
              
              {/* Path points */}
              {showDetails && movement.path
                .filter(p => p.x !== -999 && p.y !== -999)
                .slice(-10) // Show last 10 points
                .map((point, index, array) => (
                <circle
                  key={`${point.x}-${point.y}-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={2}
                  fill="rgba(16, 185, 129, 0.8)"
                  opacity={0.3 + (index / array.length) * 0.7}
                />
              ))}
            </svg>
          )}
          
          {/* Enhanced click indicators */}
          {clicks.history.slice(0, 8).map((click, index) => {
            const age = Date.now() - click.timestamp;
            const isRecent = age < 2000;
            
            return (
              <div
                key={`${click.x}-${click.y}-${click.timestamp}`}
                className="absolute pointer-events-none"
                style={{
                  left: click.x - 16,
                  top: click.y - 16,
                  opacity: isRecent ? 1 - (index * 0.15) : 0.3,
                  transform: `scale(${isRecent ? 1 - (index * 0.08) : 0.6})`,
                  transition: `all ${300 / animationSpeed}ms ease-out`,
                }}
              >
                {/* Ripple effect */}
                <div className="absolute inset-0 w-8 h-8 border-2 border-emerald-600 rounded-full animate-ping" 
                     style={{ animationDuration: `${1000 / animationSpeed}ms` }} />
                
                {/* Click marker */}
                <div className="w-8 h-8 bg-emerald-500/20 border-2 border-emerald-600 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full" />
                </div>
                
                {/* Click number */}
                {showDetails && isRecent && (
                  <div className="absolute -top-6 -left-2 bg-emerald-800 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                    #{clicks.count - index}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Enhanced instructions */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`text-center p-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-emerald-200 transition-all duration-500 ${
              isHovered || computed.hasActivity ? 'opacity-30 scale-95' : 'opacity-100 scale-100'
            }`}>
              <div className="text-4xl mb-3 animate-bounce">🖱️</div>
              <h4 className="text-lg font-semibold text-emerald-800 mb-2">
                Interactive Demo Area
              </h4>
              <p className="text-sm text-gray-700 mb-2">
                Move mouse and click to see Context Store Pattern in action
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  Individual stores → Selective subscriptions
                </p>
                <p className="flex items-center justify-center gap-1">
                  <span className="w-2 h-2 bg-teal-500 rounded-full"></span>
                  Real-time updates → Reactive patterns
                </p>
              </div>
              
              {/* Activity indicator */}
              <div className="mt-4 flex justify-center">
                <div className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  computed.hasActivity 
                    ? 'bg-emerald-200 text-emerald-800' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {computed.hasActivity ? '✨ Active Session' : '💤 Waiting for interaction'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced status information */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
            <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
              <span className="text-sm">🏗️</span>
              Architecture Info
            </h4>
            <div className="space-y-1 text-emerald-700">
              <p>✨ Context Store Pattern: Individual store access</p>
              <p>⚡ Selective subscriptions: {Object.keys({
                position: position,
                movement: movement, 
                clicks: clicks,
                computed: computed,
                performance: performance
              }).length} active stores</p>
              <p>🔄 Reactive updates: Real-time state synchronization</p>
            </div>
          </div>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-emerald-200">
            <h4 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
              <span className="text-sm">📊</span>
              Performance Stats
            </h4>
            <div className="space-y-1 text-emerald-700">
              <p>🎯 Render optimization: {performance.totalRenderCount} total renders</p>
              <p>⏱️ Session duration: {Math.floor((Date.now() - performance.sessionStartTime) / 1000)}s</p>
              <p>🏃 Activity level: {computed.activityStatus} ({computed.totalEvents} events)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedContextStoreView;
