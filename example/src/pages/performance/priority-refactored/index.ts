/**
 * @fileoverview Priority Performance - Context-Driven Architecture Export
 *
 * Context-Driven Architecture 구현의 엔트리 포인트
 */

// Action Layer
export { usePerformanceManagementActions } from './actions/usePerformanceManagementActions';
export { usePriorityTestActions } from './actions/usePriorityTestActions';
// Context Layer
export * from './contexts/PriorityContexts';
// Handler Layer
export { PerformanceManagementHandlers } from './handlers/PerformanceManagementHandlers';
export { PriorityTestHandlers } from './handlers/PriorityTestHandlers';
// Hook Layer
export {
  useInstanceState,
  usePerformanceState,
} from './hooks/usePerformanceState';
export {
  usePriorityCountsState,
  usePriorityTestState,
  useTestConfigState,
} from './hooks/usePriorityTestState';
// Integration Point
export { PriorityPage as default } from './PriorityPage';

// View Layer
export { PriorityGrid } from './views/PriorityGrid';
export { TestControlsView } from './views/TestControlsView';
export { TestMetricsView } from './views/TestMetricsView';
