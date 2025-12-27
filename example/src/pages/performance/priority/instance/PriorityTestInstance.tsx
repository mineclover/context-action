import { useStoreValue } from '@context-action/react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AverageExecutionTime,
  MetricCard,
  MinMaxExecutionTime,
  PriorityGrid,
  SuccessRate,
  TotalExecutionCount,
} from '../test-components';
import {
  ActionTestProvider,
  PriorityTestProvider,
} from '../test-context/ActionTestContext';
import {
  usePriorityPerformanceActionDispatch,
  usePriorityPerformanceStore,
} from '../test-context/PriorityPerformanceContext';
import {
  type HandlerConfig,
  useTestExecution,
  useTestHandlerRegistration,
} from '../test-hooks';

// 기본 핸들러 설정 (점프 패턴이 잘 보이도록 조정)
const DEFAULT_HANDLER_CONFIGS: HandlerConfig[] = [
  {
    id: 'h1',
    priority: 95,
    color: '#dc2626',
    label: 'Ultra High (95)',
    delay: 50,
    jumpToPriority: null,
  },
  {
    id: 'h2',
    priority: 90,
    color: '#e11d48',
    label: 'Very High (90)',
    delay: 60,
    jumpToPriority: 70,
  },
  {
    id: 'h3',
    priority: 70,
    color: '#ea580c',
    label: 'High (70)',
    delay: 45,
    jumpToPriority: 25,
  },
  {
    id: 'h4',
    priority: 55,
    color: '#f59e0b',
    label: 'High-Mid (55)',
    delay: 40,
    jumpToPriority: 45,
  },
  {
    id: 'h5',
    priority: 45,
    color: '#ca8a04',
    label: 'Medium (45)',
    delay: 35,
    jumpToPriority: 15,
  },
  {
    id: 'h6',
    priority: 30,
    color: '#84cc16',
    label: 'Med-Low (30)',
    delay: 30,
    jumpToPriority: 10,
  },
  {
    id: 'h7',
    priority: 25,
    color: '#65a30d',
    label: 'Low (25)',
    delay: 25,
    jumpToPriority: null,
  },
  {
    id: 'h8',
    priority: 15,
    color: '#0891b2',
    label: 'Lower (15)',
    delay: 20,
    jumpToPriority: 95,
  },
  {
    id: 'h9',
    priority: 10,
    color: '#7c3aed',
    label: 'Lowest (10)',
    delay: 15,
    jumpToPriority: null,
  },
];

// 성능 테스트용 간소화된 컨트롤 컴포넌트
const PerformanceTestControls = memo<{
  isRunning: boolean;
  selectedDelay: number;
  configs: HandlerConfig[];
  onStart: () => void;
  onAbort: () => void;
  onReset: () => void;
  onDelayChange: (delay: 0 | 1 | 50) => void;
  onBulkAdd: () => void;
  onClear: () => void;
  canStartTest: boolean;
  isAnyInstanceRunning: boolean;
}>(function PerformanceTestControls({
  isRunning,
  selectedDelay,
  configs,
  onStart,
  onAbort,
  onReset,
  onDelayChange,
  onBulkAdd,
  onClear,
  canStartTest,
  isAnyInstanceRunning,
}) {
  return (
    <div className="mb-4">
      <div className="flex gap-2 mb-3">
        <button
          onClick={onStart}
          disabled={isRunning}
          className={`btn text-sm px-3 py-2 flex-1 transition-all duration-200 ${
            isRunning
              ? 'btn-secondary opacity-50 cursor-not-allowed'
              : 'btn-primary'
          }`}
          title={isRunning ? '현재 실행 중...' : '성능 테스트 시작'}
        >
          {isRunning ? '⏳ 실행 중...' : '🚀 성능 테스트'}
        </button>
        <button
          onClick={onAbort}
          disabled={!isRunning}
          className="btn btn-danger text-sm px-3 py-2"
          title="실행 중단"
        >
          🛑 중단
        </button>
        <button
          onClick={onReset}
          disabled={isRunning}
          className={`btn btn-secondary text-sm px-3 py-2 transition-all duration-200 ${
            isRunning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isRunning ? '현재 실행 중...' : '전체 초기화'}
        >
          🔄 리셋
        </button>
      </div>

      {/* 일괄 추가 버튼 */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={onBulkAdd}
          disabled={isRunning}
          className={`btn btn-warning text-xs px-3 py-2 flex-1 whitespace-nowrap transition-all duration-200 ${
            isRunning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isRunning ? '현재 실행 중...' : '1-100번 핸들러 일괄 추가'}
        >
          📦 일괄 추가 (1-100)
        </button>
        <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
          현재: {configs.length}개 핸들러
        </div>
      </div>

      {/* 딜레이 설정 버튼 (0ms, 1ms, 50ms) */}
      <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded text-xs">
        <span className="text-gray-600 font-medium">딜레이:</span>
        <div className="flex gap-1">
          {[0, 1, 50].map((delay) => (
            <button
              key={delay}
              onClick={() => onDelayChange(delay as 0 | 1 | 50)}
              disabled={isRunning}
              className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                selectedDelay === delay
                  ? 'bg-purple-600 text-white'
                  : isRunning
                    ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-100'
              }`}
              title={
                isRunning ? '현재 실행 중...' : `딜레이를 ${delay}ms로 설정`
              }
            >
              {delay}ms
            </button>
          ))}
        </div>
        <span className="text-gray-500 ml-auto text-xs">
          ⚡ 자동: {selectedDelay}ms
        </span>
      </div>

      {/* 핸들러 상태 정보 */}
      <div className="flex gap-2 mb-3 p-2 bg-blue-50 rounded text-xs">
        <span className="text-gray-600">설정된 핸들러:</span>
        <span className="font-medium text-blue-800">{configs.length}개</span>
        <button
          onClick={onClear}
          disabled={isRunning}
          className={`ml-auto btn btn-warning text-xs px-2 py-1 transition-all duration-200 ${
            isRunning ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title={isRunning ? '현재 실행 중...' : '데이터 클리어'}
        >
          🗑️ 클리어
        </button>
      </div>
    </div>
  );
});

// 성능 테스트용 간소화된 메트릭 표시
const PerformanceMetrics = memo<{
  isRunning: boolean;
}>(function PerformanceMetrics({ isRunning }) {
  return (
    <div className="mb-4">
      <h4 className="font-medium text-gray-700 mb-2 text-sm">📊 성능 메트릭</h4>
      <div className="flex flex-wrap gap-3">
        <MetricCard title="총 실행">
          <TotalExecutionCount />
        </MetricCard>
        <MetricCard title="상태">
          <div className="text-sm font-semibold whitespace-nowrap">
            {isRunning ? '실행 중' : '대기 중'}
          </div>
        </MetricCard>
        <MetricCard title="성공률">
          <SuccessRate />
        </MetricCard>
        <MetricCard title="평균 시간">
          <AverageExecutionTime />
        </MetricCard>
        <MetricCard title="최소-최대">
          <MinMaxExecutionTime />
        </MetricCard>
      </div>
    </div>
  );
});

// 성능 테스트용 컴포넌트 (새로운 분리된 훅 사용) - React.memo로 최적화
const PriorityTestInstance = memo(function PriorityTestInstance({
  title,
  instanceId,
}: {
  title: string;
  instanceId?: string;
}) {
  const [configs, setConfigs] = useState<HandlerConfig[]>(
    DEFAULT_HANDLER_CONFIGS
  );
  const [selectedDelay, setSelectedDelay] = useState<0 | 1 | 50>(0);
  const dispatch = usePriorityPerformanceActionDispatch();
  const performanceStore = usePriorityPerformanceStore('performanceState');
  const performanceState = useStoreValue(performanceStore);

  // 선택된 딜레이가 적용된 configs를 memoized로 계산
  const configsWithDelay = useMemo(() => {
    return configs.map((config) => ({
      ...config,
      delay: selectedDelay,
    }));
  }, [configs, selectedDelay]);

  // 새로운 분리된 훅들 사용
  const { registerHandlers, unregisterHandlers } = useTestHandlerRegistration(
    configsWithDelay,
    {
      onRegistered: (handlerCount) => {
        console.log(
          `✅ Registered ${handlerCount} handlers for performance test`
        );
      },
      onRegistrationError: (error) => {
        console.error('❌ Handler registration failed:', error);
      },
    }
  );

  const { isRunning, executeTest, abortTest, resetTest } = useTestExecution({
    onTestStart: () => {
      console.log('🚀 Performance test started');
      if (instanceId && dispatch) {
        dispatch('startInstanceExecution', { instanceId });
      }
    },
    onTestComplete: (result) => {
      if (result.success) {
        console.log(`✅ Performance test completed in ${result.totalTime}ms`);
      } else {
        console.error(`❌ Performance test failed: ${result.errorMessage}`);
      }
      if (instanceId && dispatch) {
        dispatch('stopInstanceExecution', { instanceId });
      }
    },
    onTestError: (error) => {
      console.error('❌ Performance test error:', error);
      if (instanceId && dispatch) {
        dispatch('stopInstanceExecution', { instanceId });
      }
    },
  });

  // 핸들러 등록 (configs 변경 시)
  useEffect(() => {
    registerHandlers();
    return () => {
      unregisterHandlers();
    };
  }, [registerHandlers, unregisterHandlers]);

  // 일괄 핸들러 추가 (1-100)
  const addBulkHandlers = useCallback(() => {
    setConfigs((prev) => {
      const bulkConfigs: HandlerConfig[] = [];
      const colors = [
        '#dc2626',
        '#ea580c',
        '#ca8a04',
        '#65a30d',
        '#0891b2',
        '#7c3aed',
        '#8b5cf6',
        '#f59e0b',
      ];

      const existingPriorities = new Set(prev.map((config) => config.priority));

      for (let priority = 1; priority <= 100; priority++) {
        if (existingPriorities.has(priority)) continue;

        const color = colors[priority % colors.length] || '#000000';
        bulkConfigs.push({
          id: `bulk-${priority}`,
          priority,
          color,
          label: `P${priority}`,
          delay: 0, // selectedDelay는 configsWithDelay에서 처리
          jumpToPriority: null,
        });
      }

      return [...prev, ...bulkConfigs];
    });
  }, []);

  // 데이터 클리어
  const clearAllData = useCallback(() => {
    setConfigs(DEFAULT_HANDLER_CONFIGS);
    resetTest();
  }, [resetTest]);

  // 글로벌 상태 기반 계산값들
  const isAnyInstanceRunning = performanceState.runningInstances.length > 0;
  const canStartTest = !isRunning; // 본인만 실행 중이 아니면 시작 가능

  // Abort 액션에 실행 상태 정리 추가
  const handleAbort = useCallback(() => {
    abortTest();
    if (instanceId && dispatch) {
      dispatch('stopInstanceExecution', { instanceId });
    }
  }, [abortTest, instanceId, dispatch]);

  return (
    <div className="flex-1 p-4 border border-gray-200 rounded-lg bg-white">
      {/* 헤더 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
          {title}
        </h3>
        <div className="text-xs text-gray-500">
          {instanceId && `인스턴스: ${instanceId} | `}핸들러:{' '}
          {configsWithDelay.length}개
        </div>
      </div>

      {/* 컨트롤 패널 */}
      <PerformanceTestControls
        isRunning={isRunning}
        selectedDelay={selectedDelay}
        configs={configsWithDelay}
        onStart={executeTest}
        onAbort={handleAbort}
        onReset={resetTest}
        onDelayChange={setSelectedDelay}
        onBulkAdd={addBulkHandlers}
        onClear={clearAllData}
        canStartTest={canStartTest}
        isAnyInstanceRunning={isAnyInstanceRunning}
      />

      {/* 성능 메트릭 */}
      <PerformanceMetrics isRunning={isRunning} />

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
              💡 P30은 점프만 하고 직접 실행되지 않음 | 지연 평가로 실시간 조건
              확인
            </div>
            <div>🖱️ 블럭 클릭: 좌클릭 +1, 우클릭 -1 (수동 카운트 조작 가능)</div>
            <div className="text-amber-600 font-medium">
              ⚡ 점프 패턴 테스트: 성능 테스트 버튼을 누르고 점프가 등록된 P90,
              P70, P55, P45, P30을 각각 4 이상으로 높이면 모든 우선순위 영역을
              채울 수 있습니다
            </div>
          </div>
        </div>
      </div>

      {/* 실행 로그 간소화 */}
      <div>
        <h4 className="font-medium text-gray-700 mb-1 text-sm whitespace-nowrap">
          📋 실행 로그
        </h4>
        <div className="bg-gray-50 rounded p-2 h-12 overflow-hidden">
          <div className="text-gray-500 text-center py-1 text-xs whitespace-nowrap">
            성능 테스트 대기 중... (로그 비활성화)
          </div>
        </div>
      </div>
    </div>
  );
});

// Provider로 감싸진 래퍼 컴포넌트 - React.memo로 최적화
const PriorityTestInstanceWithProvider = memo(
  function PriorityTestInstanceWithProvider({
    title,
    instanceId,
  }: {
    title: string;
    instanceId?: string;
  }) {
    // registryId를 memoized로 계산하여 불필요한 리렌더링 방지
    const _registryId = useMemo(
      () => `priority-perf-${instanceId || 'default'}`,
      [instanceId]
    );

    return (
      <ActionTestProvider>
        <PriorityTestProvider>
          <PriorityTestInstance title={title} instanceId={instanceId} />
        </PriorityTestProvider>
      </ActionTestProvider>
    );
  }
);

export default PriorityTestInstanceWithProvider;
