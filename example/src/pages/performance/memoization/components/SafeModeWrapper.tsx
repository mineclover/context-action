import React, { useRef, useEffect, useState, PropsWithChildren } from 'react';

interface SafeModeWrapperProps {
  componentName: string;
  maxRenderRate?: number; // Max renders per second before unmounting
  checkInterval?: number; // How often to check render rate (ms)
  onSafetyTrigger?: (info: SafetyInfo) => void;
}

interface SafetyInfo {
  componentName: string;
  renderCount: number;
  renderRate: number;
  timestamp: number;
}

/**
 * SafeModeWrapper - Prevents infinite re-renders by unmounting components
 * that exceed the maximum render rate threshold.
 * 
 * Similar to the waitForRefs pattern, this provides safety against runaway renders.
 */
export function SafeModeWrapper({
  componentName,
  maxRenderRate = 10, // Default: max 10 renders per second
  checkInterval = 1000, // Default: check every second
  onSafetyTrigger,
  children
}: PropsWithChildren<SafeModeWrapperProps>) {
  const [isUnmounted, setIsUnmounted] = useState(false);
  const [safetyInfo, setSafetyInfo] = useState<SafetyInfo | null>(null);
  const renderCountRef = useRef(0);
  const lastCheckRef = useRef(Date.now());
  const checkTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track renders
  useEffect(() => {
    renderCountRef.current++;
  });
  
  // Check render rate periodically
  useEffect(() => {
    const checkRenderRate = () => {
      const now = Date.now();
      const elapsed = (now - lastCheckRef.current) / 1000; // seconds
      const renderRate = renderCountRef.current / elapsed;
      
      if (renderRate > maxRenderRate) {
        // Excessive re-renders detected - unmount component for safety
        const info: SafetyInfo = {
          componentName,
          renderCount: renderCountRef.current,
          renderRate,
          timestamp: now
        };
        
        setSafetyInfo(info);
        setIsUnmounted(true);
        
        // Notify parent if callback provided
        if (onSafetyTrigger) {
          onSafetyTrigger(info);
        }
        
        console.error(
          `🚨 SafeMode: Component "${componentName}" unmounted due to excessive re-renders`,
          `\n  Render count: ${renderCountRef.current}`,
          `\n  Render rate: ${renderRate.toFixed(1)}/sec`,
          `\n  Threshold: ${maxRenderRate}/sec`
        );
      }
      
      // Reset counter for next interval
      renderCountRef.current = 0;
      lastCheckRef.current = now;
    };
    
    // Set up periodic checking
    checkTimerRef.current = setInterval(checkRenderRate, checkInterval);
    
    return () => {
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
      }
    };
  }, [componentName, maxRenderRate, checkInterval, onSafetyTrigger]);
  
  // If component was unmounted for safety, show error state
  if (isUnmounted && safetyInfo) {
    return (
      <div className="p-4 border-2 border-red-500 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🚨</span>
          <h3 className="text-lg font-bold text-red-700">
            Component Unmounted for Safety
          </h3>
        </div>
        
        <div className="space-y-1 text-sm">
          <p className="text-red-600">
            Component <strong>"{componentName}"</strong> was automatically unmounted
            to prevent infinite re-renders.
          </p>
          
          <div className="mt-3 p-2 bg-white rounded">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-600">Render Count:</span>
                <span className="ml-2 font-mono font-bold text-red-600">
                  {safetyInfo.renderCount}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Render Rate:</span>
                <span className="ml-2 font-mono font-bold text-red-600">
                  {safetyInfo.renderRate.toFixed(1)}/sec
                </span>
              </div>
              <div>
                <span className="text-gray-600">Max Allowed:</span>
                <span className="ml-2 font-mono font-bold">
                  {maxRenderRate}/sec
                </span>
              </div>
              <div>
                <span className="text-gray-600">Timestamp:</span>
                <span className="ml-2 font-mono text-xs">
                  {new Date(safetyInfo.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-xs text-yellow-800">
              <strong>💡 Tip:</strong> Check for missing dependencies in useCallback/useMemo,
              or handlers being recreated on every render.
            </p>
          </div>
          
          <button
            onClick={() => {
              setIsUnmounted(false);
              setSafetyInfo(null);
              renderCountRef.current = 0;
              lastCheckRef.current = Date.now();
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            🔄 Retry Component
          </button>
        </div>
      </div>
    );
  }
  
  // Normal render - component is safe
  return <>{children}</>;
}

/**
 * Hook for components to check if they're in safe mode
 */
export function useSafeMode(componentName: string, maxRenderRate = 10) {
  const [isSafe, setIsSafe] = useState(true);
  const renderCountRef = useRef(0);
  const lastCheckRef = useRef(Date.now());
  
  useEffect(() => {
    renderCountRef.current++;
    
    const now = Date.now();
    const elapsed = (now - lastCheckRef.current) / 1000;
    
    if (elapsed >= 1) { // Check every second
      const renderRate = renderCountRef.current / elapsed;
      
      if (renderRate > maxRenderRate) {
        console.warn(
          `⚠️ SafeMode Warning: "${componentName}" approaching unsafe render rate`,
          `(${renderRate.toFixed(1)}/sec)`
        );
        setIsSafe(false);
      } else {
        setIsSafe(true);
      }
      
      renderCountRef.current = 0;
      lastCheckRef.current = now;
    }
  });
  
  return isSafe;
}

export default SafeModeWrapper;