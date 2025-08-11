/**
 * @fileoverview Priority Performance Demo Page
 * 
 * Context → Data/Action → Hook → View 계층 구조를 따르는 우선순위 성능 테스트 페이지
 */


import { PriorityPerformanceProvider } from './context/PriorityPerformanceContext';
import { PriorityPerformanceView } from './components/PriorityPerformanceView';

/**
 * 우선순위 성능 테스트 페이지
 * 
 * 다중 Priority Test 인스턴스를 관리하고 성능을 비교합니다.
 */
export function PriorityPerformancePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <PriorityPerformanceProvider>
        <PriorityPerformanceView />
      </PriorityPerformanceProvider>
    </div>
  );
}

export default PriorityPerformancePage;