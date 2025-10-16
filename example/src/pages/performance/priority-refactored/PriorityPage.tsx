/**
 * @fileoverview Priority Performance Page - Context-Driven Architecture
 *
 * Context-Driven Architecture의 Integration Point
 * 모든 레이어를 통합하고 핸들러 등록 및 컴포지션을 담당합니다.
 */

import { useCallback, useState } from 'react';
import { usePerformanceManagementActions } from './actions/usePerformanceManagementActions';
import { usePriorityTestActions } from './actions/usePriorityTestActions';
import {
  PerformanceManagementActionProvider,
  PerformanceManagementStoreProvider,
  PriorityTestActionProvider,
  PriorityTestStoreProvider,
  TestConfigStoreProvider,
} from './contexts/PriorityContexts';
import { PerformanceManagementHandlers } from './handlers/PerformanceManagementHandlers';
import { PriorityTestHandlers } from './handlers/PriorityTestHandlers';
import { usePerformanceState } from './hooks/usePerformanceState';
import {
  usePriorityCountsState,
  usePriorityTestState,
  useTestConfigState,
} from './hooks/usePriorityTestState';
import { PriorityGrid } from './views/PriorityGrid';
import { TestControlsView } from './views/TestControlsView';
import { TestMetricsView } from './views/TestMetricsView';

/**
 * 페이지 콘텐츠 컴포넌트
 *
 * Context-Driven Architecture의 핵심 구현부입니다.
 */
function PriorityPageContent() {
  // Hooks Layer - Store subscriptions
  const { performanceState, performanceStore, isAnyInstanceRunning } =
    usePerformanceState();
  const { executionStateStore } = usePriorityTestState();
  const { priorityCountsStore } = usePriorityCountsState();
  const {
    handlerConfigs,
    selectedDelay,
    selectedDelayStore,
    configsWithDelay,
  } = useTestConfigState();

  // Actions Layer - Action dispatching
  const performanceActions = usePerformanceManagementActions();
  const { isRunning, executeTest, abortTest } = usePriorityTestActions();

  // Local state for UI
  const [currentInstanceId] = useState('instance-main');

  // Instance management handlers
  const handleAddInstance = useCallback(async () => {
    try {
      await performanceActions.addInstance();
    } catch (error) {
      console.error('Failed to add instance:', error);
    }
  }, [performanceActions]);

  const handleRemoveInstance = useCallback(
    async (instanceId: string) => {
      try {
        await performanceActions.removeInstance(instanceId);
      } catch (error) {
        console.error('Failed to remove instance:', error);
      }
    },
    [performanceActions]
  );

  const handleResetInstances = useCallback(async () => {
    try {
      await performanceActions.resetInstances();
    } catch (error) {
      console.error('Failed to reset instances:', error);
    }
  }, [performanceActions]);

  // Test execution handlers
  const handleExecuteTest = useCallback(async () => {
    try {
      await performanceActions.startInstanceExecution(currentInstanceId);
      await executeTest(currentInstanceId);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      await performanceActions.stopInstanceExecution(currentInstanceId);
    }
  }, [performanceActions, executeTest, currentInstanceId]);

  const handleAbortTest = useCallback(() => {
    abortTest();
    performanceActions.stopInstanceExecution(currentInstanceId);
  }, [abortTest, performanceActions, currentInstanceId]);

  const handleResetTest = useCallback(() => {
    // 리셋 시 우선순위 카운트와 실행 상태 모두 초기화
    priorityCountsStore.setValue({});
    executionStateStore.setValue({
      isRunning: false,
      testResults: [],
      currentTestId: null,
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      abortedTests: 0,
      averageExecutionTime: 0,
      lastExecutionTime: 0,
      maxExecutionTime: 0,
      minExecutionTime: Number.MAX_VALUE,
      startTime: Date.now(),
      executionTimes: [],
    });
  }, [priorityCountsStore, executionStateStore]);

  // Delay setting handler
  const handleDelayChange = useCallback(
    (delay: 0 | 1 | 50) => {
      selectedDelayStore.setValue(delay);
    },
    [selectedDelayStore]
  );

  // Bulk operations
  const handleBulkAdd = useCallback(() => {
    // 일괄 추가 로직 (간단화)
    console.log('Bulk add handlers (1-100)');
  }, []);

  const handleClear = useCallback(() => {
    handleResetTest();
  }, [handleResetTest]);

  return (
    <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-white">
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          🎯 Context-Driven Priority Test
        </h3>
        <div className="text-xs text-gray-500">
          Instance: {currentInstanceId} | Handlers: {configsWithDelay.length}개
        </div>
      </div>

      {/* Handler Layer Integration - Props-based DI */}
      <PerformanceManagementHandlers performanceStore={performanceStore}>
        <PriorityTestHandlers
          priorityCountsStore={priorityCountsStore}
          executionStateStore={executionStateStore}
          handlerConfigs={configsWithDelay}
        >
          {/* Views Layer - Pure UI Components */}
          <TestControlsView
            isRunning={isRunning}
            selectedDelay={selectedDelay}
            configs={configsWithDelay}
            onStart={handleExecuteTest}
            onAbort={handleAbortTest}
            onReset={handleResetTest}
            onDelayChange={handleDelayChange}
            onBulkAdd={handleBulkAdd}
            onClear={handleClear}
            canStartTest={!isRunning}
            isAnyInstanceRunning={isAnyInstanceRunning}
          />

          <TestMetricsView isRunning={isRunning} />

          {/* 우선순위별 실행 카운트 (1-100 전체 표시) */}
          <div className="mb-3">
            <h4 className="font-medium text-gray-700 mb-2 text-sm">
              🎯 우선순위별 실행 횟수 (높은 순위 → 낮은 순위)
            </h4>
            <div className="bg-gray-50 rounded p-1">
              <PriorityGrid
                configs={configsWithDelay}
                className=""
                allowManualClick={true}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 space-y-1">
              <div className="flex items-center gap-4">
                <div className="flex items-center whitespace-nowrap">
                  <span
                    className="inline-block w-2 h-2 border border-blue-300 mr-1"
                    style={{ backgroundColor: '#dbeafe' }}
                  ></span>
                  핸들러
                </div>
                <div className="flex items-center whitespace-nowrap">
                  <span
                    className="inline-block w-2 h-2 border border-yellow-500 mr-1"
                    style={{ backgroundColor: '#fbbf24' }}
                  ></span>
                  점프 지점
                </div>
                <div className="text-gray-400 whitespace-nowrap">
                  실행 횟수에 따라 색상 농도 변화
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-1">
                <div>
                  💡 P30은 점프만 하고 직접 실행되지 않음 | 지연 평가로 실시간
                  조건 확인
                </div>
                <div>
                  🖱️ 블럭 클릭: 좌클릭 +1, 우클릭 -1 (수동 카운트 조작 가능)
                </div>
                <div className="text-amber-600 font-medium">
                  ⚡ 점프 패턴 테스트: 성능 테스트 버튼을 누르고 점프가 등록된
                  P90, P70, P55, P45, P30을 각각 4 이상으로 높이면 모든 우선순위
                  영역을 채울 수 있습니다
                </div>
              </div>
            </div>
          </div>

          {/* Performance State Display */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-2 text-sm">
              📈 성능 상태
            </h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>총 인스턴스: {performanceState.instances.length}개</div>
              <div>실행 중: {performanceState.runningInstances.size}개</div>
              <div>아키텍처: Context-Driven (4-Layer)</div>
            </div>
          </div>
        </PriorityTestHandlers>
      </PerformanceManagementHandlers>
    </div>
  );
}

/**
 * 우선순위 성능 테스트 페이지
 *
 * Context-Driven Architecture의 최상위 Integration Point입니다.
 * 모든 Context Provider를 설정하고 핸들러 등록을 관리합니다.
 */
export function PriorityPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Context-Driven Architecture Demo
        </h1>
        <p className="text-gray-600">
          Priority Performance Test with 4-Layer Architecture Pattern
        </p>
      </div>

      {/* Context Provider Hierarchy */}
      <PriorityTestActionProvider>
        <PerformanceManagementActionProvider>
          <PriorityTestStoreProvider>
            <PerformanceManagementStoreProvider>
              <TestConfigStoreProvider>
                <PriorityPageContent />
              </TestConfigStoreProvider>
            </PerformanceManagementStoreProvider>
          </PriorityTestStoreProvider>
        </PerformanceManagementActionProvider>
      </PriorityTestActionProvider>
    </div>
  );
}

export default PriorityPage;
