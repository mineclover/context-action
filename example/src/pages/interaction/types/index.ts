/**
 * Interaction domain type definitions
 * Mouse events and interaction patterns
 */

// Mouse position and tracking types
export interface MousePosition {
  x: number;
  y: number;
  timestamp: number;
}

export interface ClickEvent extends MousePosition {
  button: number; // 0: left, 1: middle, 2: right
  type: 'click' | 'double-click' | 'right-click';
}

export interface MouseTrackingConfig {
  enablePath: boolean;
  enableClicks: boolean;
  enableHover: boolean;
  smoothing: boolean;
  throttleMs: number;
  maxPathLength?: number;
  maxClickHistory?: number;
}

export interface MouseTrackingState {
  mousePosition: MousePosition;
  mousePath: MousePosition[];
  clickHistory: ClickEvent[];
  isTracking: boolean;
  config: MouseTrackingConfig;
}

// Performance monitoring types
export interface MousePerformanceMetrics {
  fps: number;
  eventCount: number;
  averageEventInterval: number;
  lastEventTime: number;
  memoryUsage: number;
}

export interface PerformanceMonitoringState {
  isMonitoring: boolean;
  metrics: MousePerformanceMetrics;
  history: MousePerformanceMetrics[];
}

// Visualization types
export type VisualizationMode = 'path' | 'heatmap' | 'clicks';

export interface VisualizationConfig {
  mode: VisualizationMode;
  showPath: boolean;
  showHeatmap: boolean;
  showClicks: boolean;
  pathColor: string;
  clickColor: string;
  heatmapIntensity: number;
}

// Component props types
export interface MouseTrackerProps {
  isTracking: boolean;
  mousePosition: MousePosition;
  mousePath: MousePosition[];
  clickHistory: ClickEvent[];
  visualizationMode: VisualizationMode;
  className?: string;
}

export interface MousePathVisualizerProps {
  mousePath: MousePosition[];
  clickHistory: ClickEvent[];
  showPath: boolean;
  showHeatmap: boolean;
  showClicks: boolean;
  className?: string;
}

export interface PerformanceMonitorProps {
  performance: MousePerformanceMetrics;
  isMonitoring: boolean;
  onStartMonitoring: () => void;
  onStopMonitoring: () => void;
  className?: string;
}

// Hook return types
export interface UseMouseTrackingReturn {
  mousePosition: MousePosition;
  mousePath: MousePosition[];
  clickHistory: ClickEvent[];
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  clearHistory: () => void;
  updateConfig: (config: Partial<MouseTrackingConfig>) => void;
}

export interface UseMousePerformanceReturn {
  performance: MousePerformanceMetrics;
  isMonitoring: boolean;
  startPerformanceMonitoring: () => void;
  stopPerformanceMonitoring: () => void;
  resetMetrics: () => void;
}

// Canvas rendering types
export interface CanvasRenderingContext {
  canvas: HTMLCanvasElement | null;
  context: CanvasRenderingContext2D | null;
  width: number;
  height: number;
}

export interface RenderingOptions {
  pathWidth: number;
  pathColor: string;
  clickRadius: number;
  clickColor: string;
  smoothPath: boolean;
  fadeEffect: boolean;
}