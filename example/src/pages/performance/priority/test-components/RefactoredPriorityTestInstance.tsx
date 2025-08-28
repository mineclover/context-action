/**
 * @fileoverview 리팩토링된 우선순위 테스트 인스턴스
 *
 * 기존 PriorityTestInstance를 관심사별로 분리하여 재구성:
 * - 개별 훅들로 비즈니스 로직 분리
 * - 독립적인 UI 컴포넌트들로 표시 로직 분리
 * - 각 컴포넌트가 필요한 상태만 구독하여 성능 최적화
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionTestProvider,
  PriorityTestProvider,
} from '../test-context/ActionTestContext';
import type { HandlerConfig } from '../test-hooks/types';
import { useTestExecution } from '../test-hooks/useTestExecution';
import { useTestHandlerRegistration } from '../test-hooks/useTestHandlerRegistration';
import { PriorityGrid } from './PriorityGrid';
import { TestControls } from './TestControls';
import { MetricsDashboard } from './TestMetrics';

// 기본 핸들러 설정
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

interface RefactoredPriorityTestInstanceProps {
  title: string;
  instanceId?: string;
}

/**
 * 리팩토링된 우선순위 테스트 인스턴스 컴포넌트
 *
 * 관심사별로 분리된 훅들과 컴포넌트들을 조합하여 구성:
 * - useTestHandlerRegistration: 핸들러 등록/해제
 * - useTestExecution: 테스트 실행/중단/리셋
 * - MetricsDashboard: 실행 통계 표시
 * - PriorityGrid: 우선순위별 실행 횟수 시각화
 * - TestControls: 테스트 제어 인터페이스
 */
const RefactoredPriorityTestInstance =
  memo<RefactoredPriorityTestInstanceProps>(
    function RefactoredPriorityTestInstance({ title, instanceId }) {
      // 로컬 상태
      const [configs] = useState<HandlerConfig[]>(DEFAULT_HANDLER_CONFIGS);
      const [selectedDelay, setSelectedDelay] = useState<0 | 1 | 50>(0);

      // 딜레이가 적용된 설정 계산
      const configsWithDelay = useMemo(() => {
        return configs.map((config) => ({
          ...config,
          delay: selectedDelay,
        }));
      }, [configs, selectedDelay]);

      // 핸들러 등록 훅
      const { registerHandlers, unregisterHandlers } =
        useTestHandlerRegistration(configsWithDelay, {
          onRegistered: (count) => {
            console.log(`✅ ${count}개 핸들러 등록 완료`);
          },
          onRegistrationError: (error) => {
            console.error('❌ 핸들러 등록 실패:', error.message);
          },
        });

      // 테스트 실행 훅
      const { isRunning, executeTest, abortTest, resetTest } = useTestExecution(
        {
          onTestStart: () => {
            console.log('🚀 테스트 시작');
          },
          onTestComplete: (result) => {
            if (result.success) {
              console.log(
                `✅ 테스트 완료 (${result.totalTime}ms, ${result.handlerCount}개 핸들러)`
              );
            } else {
              console.log(`❌ 테스트 실패: ${result.errorMessage}`);
            }
          },
          onTestError: (error) => {
            console.error('❌ 테스트 실행 오류:', error.message);
          },
        }
      );

      // 컴포넌트 마운트시 핸들러 등록
      useEffect(() => {
        registerHandlers();
        return () => {
          unregisterHandlers();
        };
      }, [registerHandlers, unregisterHandlers]);

      // 이벤트 핸들러들
      const handleStart = useCallback(async () => {
        await executeTest();
      }, [executeTest]);

      const handleAbort = useCallback(() => {
        abortTest();
      }, [abortTest]);

      const handleReset = useCallback(() => {
        resetTest();
        // 핸들러 재등록
        setTimeout(() => {
          registerHandlers();
        }, 100);
      }, [resetTest, registerHandlers]);

      const handleDelayChange = useCallback((delay: 0 | 1 | 50) => {
        setSelectedDelay(delay);
      }, []);

      return (
        <div className="priority-test-instance space-y-6">
          {/* 헤더 */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              {title}
              {instanceId && (
                <span className="ml-2 text-sm text-gray-500 font-normal">
                  #{instanceId}
                </span>
              )}
            </h3>
            <div className="text-sm text-gray-500">
              Context-Action v7 패턴 (분리된 훅 구조)
            </div>
          </div>

          {/* 메트릭 대시보드 */}
          <MetricsDashboard />

          {/* 우선순위 그리드 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              우선순위별 실행 현황
            </h4>
            <PriorityGrid configs={configsWithDelay} />
          </div>

          {/* 테스트 제어판 */}
          <TestControls
            isRunning={isRunning}
            selectedDelay={selectedDelay}
            configs={configsWithDelay}
            onStart={handleStart}
            onAbort={handleAbort}
            onReset={handleReset}
            onDelayChange={handleDelayChange}
          />

          {/* 설정 정보 */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div>📋 총 {configs.length}개 핸들러 등록됨</div>
              <div>
                🎯 점프 핸들러:{' '}
                {configs.filter((c) => c.jumpToPriority !== null).length}개
              </div>
              <div>⚡ 현재 딜레이: {selectedDelay}ms</div>
            </div>
          </div>
        </div>
      );
    }
  );

/**
 * Provider로 감싸진 래퍼 컴포넌트
 */
const RefactoredPriorityTestInstanceWithProvider = memo(
  function RefactoredPriorityTestInstanceWithProvider(
    props: RefactoredPriorityTestInstanceProps
  ) {
    return (
      <PriorityTestProvider>
        <ActionTestProvider>
          <RefactoredPriorityTestInstance {...props} />
        </ActionTestProvider>
      </PriorityTestProvider>
    );
  }
);

export default RefactoredPriorityTestInstanceWithProvider;
