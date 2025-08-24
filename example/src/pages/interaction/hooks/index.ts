/**
 * Interaction domain hooks
 * Mouse tracking and performance monitoring hooks
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeTimeout, usePerformanceMonitor } from '../../../domains/shared/hooks';
import type { 
  MousePosition, 
  MouseTrackingConfig, 
  UseMouseTrackingReturn,
  UseMousePerformanceReturn,
  ClickEvent,
  MousePerformanceMetrics
} from '../types';

// Mouse tracking hook
export function useMouseTracking(initialConfig: MouseTrackingConfig): UseMouseTrackingReturn {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0, timestamp: 0 });
  const [mousePath, setMousePath] = useState<MousePosition[]>([]);
  const [clickHistory, setClickHistory] = useState<ClickEvent[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [config, setConfig] = useState<MouseTrackingConfig>(initialConfig);

  const lastUpdateTime = useRef<number>(0);
  const { setSafeTimeout } = useSafeTimeout();

  // Mouse move handler with throttling
  const handleMouseMove = useCallback((event: MouseEvent) => {
    const now = Date.now();
    if (now - lastUpdateTime.current < config.throttleMs) {
      return;
    }
    lastUpdateTime.current = now;

    const position: MousePosition = {
      x: event.clientX,
      y: event.clientY,
      timestamp: now
    };

    setMousePosition(position);

    if (config.enablePath) {
      setMousePath(prev => {
        const newPath = [...prev, position];
        const maxLength = config.maxPathLength || 1000;
        return newPath.slice(-maxLength);
      });
    }
  }, [config.throttleMs, config.enablePath, config.maxPathLength]);

  // Click handler
  const handleClick = useCallback((event: MouseEvent) => {
    if (!config.enableClicks) return;

    const clickEvent: ClickEvent = {
      x: event.clientX,
      y: event.clientY,
      timestamp: Date.now(),
      button: event.button,
      type: event.detail === 2 ? 'double-click' : 
             event.button === 2 ? 'right-click' : 'click'
    };

    setClickHistory(prev => {
      const newHistory = [...prev, clickEvent];
      const maxHistory = config.maxClickHistory || 100;
      return newHistory.slice(-maxHistory);
    });
  }, [config.enableClicks, config.maxClickHistory]);

  // Context menu handler
  const handleContextMenu = useCallback((event: MouseEvent) => {
    if (config.enableClicks) {
      event.preventDefault(); // Prevent default context menu
    }
  }, [config.enableClicks]);

  // Start tracking
  const startTracking = useCallback(() => {
    if (isTracking) return;

    setIsTracking(true);
    
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('click', handleClick);
    document.addEventListener('dblclick', handleClick);
    document.addEventListener('contextmenu', handleContextMenu);
  }, [isTracking, handleMouseMove, handleClick, handleContextMenu]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (!isTracking) return;

    setIsTracking(false);
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick);
    document.removeEventListener('dblclick', handleClick);
    document.removeEventListener('contextmenu', handleContextMenu);
  }, [isTracking, handleMouseMove, handleClick, handleContextMenu]);

  // Clear history
  const clearHistory = useCallback(() => {
    setMousePath([]);
    setClickHistory([]);
    setMousePosition({ x: 0, y: 0, timestamp: 0 });
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<MouseTrackingConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isTracking) {
        stopTracking();
      }
    };
  }, [isTracking, stopTracking]);

  return {
    mousePosition,
    mousePath,
    clickHistory,
    isTracking,
    startTracking,
    stopTracking,
    clearHistory,
    updateConfig
  };
}

// Performance monitoring hook
export function useMousePerformance(): UseMousePerformanceReturn {
  const [performance, setPerformance] = useState<MousePerformanceMetrics>({
    fps: 0,
    eventCount: 0,
    averageEventInterval: 0,
    lastEventTime: 0,
    memoryUsage: 0
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const performanceMonitor = usePerformanceMonitor('mouseEvents');
  
  const frameCount = useRef(0);
  const lastFrameTime = useRef(0);
  const eventTimes = useRef<number[]>([]);
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // FPS calculation
  const calculateFPS = useCallback(() => {
    const now = Date.now();
    frameCount.current++;
    
    if (now - lastFrameTime.current >= 1000) { // Update every second
      const fps = Math.round((frameCount.current * 1000) / (now - lastFrameTime.current));
      
      setPerformance(prev => ({
        ...prev,
        fps,
        lastEventTime: now
      }));
      
      frameCount.current = 0;
      lastFrameTime.current = now;
    }
  }, []);

  // Event counter and interval calculation
  const recordEvent = useCallback(() => {
    const now = Date.now();
    eventTimes.current.push(now);
    
    // Keep only last 100 events for calculation
    if (eventTimes.current.length > 100) {
      eventTimes.current.shift();
    }
    
    const eventCount = eventTimes.current.length;
    const averageInterval = eventCount > 1 
      ? (eventTimes.current[eventCount - 1] - eventTimes.current[0]) / (eventCount - 1)
      : 0;
    
    setPerformance(prev => ({
      ...prev,
      eventCount: prev.eventCount + 1,
      averageEventInterval: averageInterval,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    }));
    
    calculateFPS();
  }, [calculateFPS]);

  // Start performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    performanceMonitor.startTimer();
    
    // Monitor at 60fps
    monitoringInterval.current = setInterval(() => {
      recordEvent();
    }, 16);
  }, [isMonitoring, performanceMonitor, recordEvent]);

  // Stop performance monitoring
  const stopPerformanceMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    performanceMonitor.endTimer();
    
    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }
  }, [isMonitoring, performanceMonitor]);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setPerformance({
      fps: 0,
      eventCount: 0,
      averageEventInterval: 0,
      lastEventTime: 0,
      memoryUsage: 0
    });
    
    frameCount.current = 0;
    lastFrameTime.current = 0;
    eventTimes.current = [];
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, []);

  return {
    performance,
    isMonitoring,
    startPerformanceMonitoring,
    stopPerformanceMonitoring,
    resetMetrics
  };
}

// Canvas rendering hook
export function useCanvasRenderer(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const [canvasContext, setCanvasContext] = useState<{
    canvas: HTMLCanvasElement | null;
    context: CanvasRenderingContext2D | null;
    width: number;
    height: number;
  }>({
    canvas: null,
    context: null,
    width: 0,
    height: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      context.scale(window.devicePixelRatio, window.devicePixelRatio);
      
      setCanvasContext({
        canvas,
        context,
        width: rect.width,
        height: rect.height
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [canvasRef]);

  const clearCanvas = useCallback(() => {
    const { context, width, height } = canvasContext;
    if (context) {
      context.clearRect(0, 0, width, height);
    }
  }, [canvasContext]);

  return {
    ...canvasContext,
    clearCanvas
  };
}