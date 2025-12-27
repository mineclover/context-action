/**
 * @fileoverview Performance Management Handlers
 *
 * Context-Driven Architecture의 Handler Layer
 * Props-based DI 패턴을 사용한 비즈니스 로직 구현
 */

import type { Store } from '@context-action/react';
import { type ReactNode, useCallback } from 'react';
import {
  type PerformanceStateData,
  type TestInstance,
  usePerformanceManagementActionHandler,
} from '../contexts/PriorityContexts';

interface PerformanceManagementHandlersProps {
  performanceStore: Store<PerformanceStateData>;
}

/**
 * 성능 관리 핸들러 컴포넌트
 *
 * Props-based DI 패턴을 사용하여 스토어 의존성을 주입받고
 * 성능 관리 관련 비즈니스 로직을 처리합니다.
 */
export function PerformanceManagementHandlers({
  performanceStore,
  children,
}: PerformanceManagementHandlersProps & { children: ReactNode }) {
  // 새 인스턴스 생성 헬퍼
  const generateNewInstance = useCallback(
    (instanceNumber: number): TestInstance => {
      const colors = ['🟢', '🟡', '🟠', '🟣', '⚫', '⚪', '🔲', '🔳'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      return {
        id: `instance-${instanceNumber}`,
        title: `${randomColor} Priority Test Instance ${String.fromCharCode(64 + instanceNumber)}`,
      };
    },
    []
  );

  // 인스턴스 추가 핸들러
  usePerformanceManagementActionHandler(
    'addInstance',
    useCallback(
      async (_, controller) => {
        const currentState = performanceStore.getValue();
        const newInstance = generateNewInstance(
          currentState.instances.length + 1
        );

        performanceStore.update((state) => ({
          ...state,
          instances: [...state.instances, newInstance],
        }));

        console.log(`✅ Added new instance: ${newInstance.id}`);
      },
      [performanceStore, generateNewInstance]
    ),
    { priority: 100, id: 'add-instance-handler' }
  );

  // 인스턴스 제거 핸들러
  usePerformanceManagementActionHandler(
    'removeInstance',
    useCallback(
      async ({ instanceId }, controller) => {
        const currentState = performanceStore.getValue();

        // 실행 중인 인스턴스는 제거할 수 없음
        if (currentState.runningInstances.includes(instanceId)) {
          controller.abort('Cannot remove running instance');
          return;
        }

        // 최소 1개 인스턴스는 유지
        if (currentState.instances.length <= 1) {
          controller.abort('Cannot remove last instance');
          return;
        }

        performanceStore.update((state) => ({
          ...state,
          instances: state.instances.filter(
            (instance) => instance.id !== instanceId
          ),
        }));

        console.log(`✅ Removed instance: ${instanceId}`);
      },
      [performanceStore]
    ),
    { priority: 100, id: 'remove-instance-handler' }
  );

  // 인스턴스 리셋 핸들러
  usePerformanceManagementActionHandler(
    'resetInstances',
    useCallback(
      async (_, controller) => {
        const defaultInstances: TestInstance[] = [
          { id: 'instance-a', title: '🔴 Priority Test Instance A' },
          { id: 'instance-b', title: '🔵 Priority Test Instance B' },
        ];

        performanceStore.update((state) => ({
          ...state,
          instances: defaultInstances,
          runningInstances: [],
        }));

        console.log('✅ Reset instances to default state');
      },
      [performanceStore]
    ),
    { priority: 100, id: 'reset-instances-handler' }
  );

  // 인스턴스 실행 시작 핸들러
  usePerformanceManagementActionHandler(
    'startInstanceExecution',
    useCallback(
      async ({ instanceId }, controller) => {
        performanceStore.update((state) => {
          if (state.runningInstances.includes(instanceId)) {
            return state;
          }
          return {
            ...state,
            runningInstances: [...state.runningInstances, instanceId],
          };
        });

        console.log(`✅ Started execution for instance: ${instanceId}`);
      },
      [performanceStore]
    ),
    { priority: 100, id: 'start-instance-execution-handler' }
  );

  // 인스턴스 실행 종료 핸들러
  usePerformanceManagementActionHandler(
    'stopInstanceExecution',
    useCallback(
      async ({ instanceId }, controller) => {
        performanceStore.update((state) => ({
          ...state,
          runningInstances: state.runningInstances.filter((id) => id !== instanceId),
        }));

        console.log(`✅ Stopped execution for instance: ${instanceId}`);
      },
      [performanceStore]
    ),
    { priority: 100, id: 'stop-instance-execution-handler' }
  );

  return <>{children}</>;
}
