// Action types
export interface ComparisonActions {
  increment: void;
  decrement: void;
  reset: void;
  complexCalculation: { multiplier: number };
  heavyOperation: { dataSize: number };
  memoryIntensiveTask: void;
}

// Store types
export interface ComparisonStore {
  counter: number;
  calcResult: number;
  heavyData: number[];
  processedResults: { id: number; value: number; timestamp: number }[];
  memoryLeakData: any[];
}

// Performance thresholds
export const PERFORMANCE_LIMITS = {
  HEAVY_DATA_LIMIT: 5000,
  MEMORY_DATA_LIMIT: 5000,
  MAX_DATA_SIZE: 30,
  RENDER_RATE_WARNING: 5,
  RENDER_RATE_DANGER: 10,
  RENDER_RATE_CRITICAL: 15,
} as const;

// UI color thresholds
export const UI_THRESHOLDS = {
  HEAVY_DATA_WARNING: 2000,
  MEMORY_DATA_WARNING: 500,
  MEMORY_DATA_DANGER: 1000,
} as const;

// Memory leak data structure
export interface MemoryLeakItem {
  id: number;
  data: number[];
  timestamp: number;
  largeString: string;
}
