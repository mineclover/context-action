/**
 * @fileoverview Priority Performance - Context-Driven Architecture Export
 *
 * Context-Driven Architecture 구현의 엔트리 포인트
 */

// Integration Point
export { PriorityPage as default } from './PriorityPage';

// Context Layer
export * from './contexts/PriorityContexts';

// Handler Layer
export { PerformanceManagementHandlers } from './handlers/PerformanceManagementHandlers';
export { PriorityTestHandlers } from './handlers/PriorityTestHandlers';

// Action Layer
export { usePerformanceManagementActions } from './actions/usePerformanceManagementActions';
export { usePriorityTestActions } from './actions/usePriorityTestActions';

// Hook Layer
export { usePerformanceState, useInstanceState } from './hooks/usePerformanceState';
export {
  usePriorityTestState,
  usePriorityCountsState,
  useTestConfigState,
} from './hooks/usePriorityTestState';

// View Layer
export { PriorityGrid } from './views/PriorityGrid';
export { TestControlsView } from './views/TestControlsView';
export { TestMetricsView } from './views/TestMetricsView';