/**
 * Enhanced Context Store View - Full Implementation with Real Mouse Interaction
 */

import { useStoreValue } from '@context-action/react';
import React, { useCallback, useRef } from 'react';
import { useMouseEventsActionDispatch, useMouseEventsStore } from '../context/MouseEventsContext';

export function EnhancedContextStoreView() {
  const containerRef = useRef<HTMLDivElement>(null);

  // Access individual stores using the Context Store Pattern
  const positionStore = useMouseEventsStore('position');
  const movementStore = useMouseEventsStore('movement');
  const clicksStore = useMouseEventsStore('clicks');
  const computedStore = useMouseEventsStore('computed');
  
  // Subscribe to individual store values
  const position = useStoreValue(positionStore);
  const movement = useStoreValue(movementStore);
  const clicks = useStoreValue(clicksStore);
  const computed = useStoreValue(computedStore);
  
  // Action dispatcher
  const dispatch = useMouseEventsActionDispatch();

  // Event handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    dispatch('mouseMove', { x, y, timestamp });
  }, [dispatch]);

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
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    dispatch('mouseEnter', { x, y, timestamp });
  }, [dispatch]);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    const timestamp = Date.now();
    
    dispatch('mouseLeave', { x, y, timestamp });
  }, [dispatch]);

  const handleReset = useCallback(() => {
    dispatch('resetMouseState');
  }, [dispatch]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🏪 Enhanced Context Store Demo</h2>
        <button
          onClick={handleReset}
          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
        >
          Reset
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">
        Interactive Context Store Pattern with individual store subscriptions
      </p>

      {/* Store Values Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-blue-800 text-sm">Position Store</h4>
          <p className="text-xs text-blue-600">
            ({position.current.x}, {position.current.y})
          </p>
          <p className="text-xs text-blue-600">
            Inside: {position.isInsideArea ? '✅' : '❌'}
          </p>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-green-800 text-sm">Movement Store</h4>
          <p className="text-xs text-green-600">
            Velocity: {movement.velocity.toFixed(2)}
          </p>
          <p className="text-xs text-green-600">
            Path points: {movement.path.length}
          </p>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-purple-800 text-sm">Clicks Store</h4>
          <p className="text-xs text-purple-600">
            Total: {clicks.count}
          </p>
          <p className="text-xs text-purple-600">
            History: {clicks.history.length}
          </p>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg border">
          <h4 className="font-semibold text-orange-800 text-sm">Computed Store</h4>
          <p className="text-xs text-orange-600">
            Active: {computed.hasActivity ? '✅' : '❌'}
          </p>
          <p className="text-xs text-orange-600">
            Events: {computed.totalEvents}
          </p>
        </div>
      </div>

      {/* Interactive Mouse Area */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="font-semibold mb-2">Interactive Context Store Area</h3>
        <div
          ref={containerRef}
          className="relative w-full h-64 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-lg overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Dynamic cursor indicator */}
          {position.isInsideArea && position.current.x !== -999 && (
            <div
              className="absolute w-4 h-4 bg-emerald-500 border-2 border-white rounded-full pointer-events-none shadow-lg transform -translate-x-2 -translate-y-2 transition-all duration-75"
              style={{
                left: position.current.x,
                top: position.current.y,
              }}
            />
          )}
          
          {/* Path visualization */}
          {movement.path.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <path
                d={movement.path
                  .filter(p => p.x !== -999 && p.y !== -999)
                  .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
                  .join(' ')
                }
                stroke="rgba(16, 185, 129, 0.6)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          
          {/* Click indicators */}
          {clicks.history.slice(0, 5).map((click, index) => (
            <div
              key={`${click.x}-${click.y}-${click.timestamp}`}
              className="absolute w-6 h-6 border-2 border-emerald-600 rounded-full pointer-events-none"
              style={{
                left: click.x - 12,
                top: click.y - 12,
                opacity: 1 - (index * 0.2),
                transform: `scale(${1 - (index * 0.1)})`,
              }}
            />
          ))}
          
          {/* Instructions */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center p-4 bg-white/80 backdrop-blur-sm rounded-lg">
              <div className="text-2xl mb-2">🖱️</div>
              <p className="text-sm text-gray-600">
                Move mouse and click to see Context Store Pattern
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Individual stores → Selective subscriptions → Reactive updates
              </p>
            </div>
          </div>
        </div>
        
        {/* Status information */}
        <div className="mt-4 flex justify-between items-center text-xs text-gray-600">
          <span>
            Context Store Pattern: Individual store access with selective subscriptions
          </span>
          <span>
            Render count optimized through selective subscriptions
          </span>
        </div>
      </div>
    </div>
  );
}

export default EnhancedContextStoreView;
