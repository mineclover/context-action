import { useCallback, useEffect } from 'react';
import { useLogMonitorActions } from '@/components/LogMonitor';
import { LogLevel } from '@/utils/logger';
import {
  useChildAActionDispatch,
  useChildAActionHandler,
  useChildAStoreManager,
} from '../contexts/ChildAContext';
import {
  useParentActionDispatch,
  useParentActionHandler,
} from '../contexts/ParentContext';

// ==============================================
// CHILD A DOMAIN - Action Handlers
// ==============================================

/**
 * ChildA 카운터 액션 핸들러들
 */
export function useChildACounterActions() {
  const storeManager = useChildAStoreManager();
  const childDispatch = useChildAActionDispatch();
  const parentDispatch = useParentActionDispatch();
  const { addLog } = useLogMonitorActions();

  const childId = 'child-a-counter';

  // 카운터 증가 핸들러
  const incrementCounterHandler = useCallback(
    async (payload: { amount: number }, _controller: any) => {
      const { amount } = payload;
      const counterStore = storeManager.getStore('counter');
      const currentValue = counterStore.getValue();
      const newValue = currentValue + amount;

      counterStore.setValue(newValue);

      // 로그 모니터에 직접 데이터 전송
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: `ChildA 카운터 증가: ${newValue}`,
        details: {
          counter: newValue,
          action: 'increment',
          amount,
          context: 'Child A Component',
        },
      });

      // 단순한 콘솔 로그 사용
      console.log('🔄 ChildA 카운터 증가:', { amount, newValue });
    },
    [storeManager, childDispatch, parentDispatch, childId]
  );

  // 카운터 리셋 핸들러
  const resetCounterHandler = useCallback(
    async (_payload: void, _controller: any) => {
      const counterStore = storeManager.getStore('counter');
      const previousValue = counterStore.getValue();

      counterStore.setValue(0);

      // 로그 모니터에 직접 데이터 전송
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: 'ChildA 카운터 리셋됨',
        details: {
          counter: 0,
          action: 'reset',
          context: 'Child A Component',
        },
      });

      // 단순한 콘솔 로그 사용
      console.log('🔄 ChildA 카운터 리셋:', { previousValue });
    },
    [storeManager, parentDispatch, childId]
  );

  // 핸들러 등록 - 명시적 ID 사용
  useChildAActionHandler('incrementCounter', incrementCounterHandler, {
    id: 'child-a-counter-increment',
  });
  useChildAActionHandler('resetCounter', resetCounterHandler, {
    id: 'child-a-counter-reset',
  });

  // 리프레시 횟수 확인용 useEffect
  useEffect(() => {
    console.log(
      '🔄 ChildA Counter Actions 리프레시됨 - storeManager, childDispatch, parentDispatch, childId 변경'
    );
  }, [storeManager, childDispatch, parentDispatch, childId]);

  // View에서 사용할 액션 함수들
  const incrementCounter = useCallback(
    (amount: number) => childDispatch('incrementCounter', { amount }),
    [childDispatch]
  );

  const resetCounter = useCallback(
    () => childDispatch('resetCounter', undefined),
    [childDispatch]
  );

  return { incrementCounter, resetCounter };
}

/**
 * ChildA 상위 제어 등록 액션 핸들러
 */
export function useChildARemoteControlActions() {
  const storeManager = useChildAStoreManager();
  const parentDispatch = useParentActionDispatch();
  const { addLog } = useLogMonitorActions();

  const childId = 'child-a-counter';

  // 상위에서 요청받은 제어 핸들러 (ChildA가 상위에 등록)
  const handleRemoteControl = useCallback(
    async (
      payload: {
        childId: string;
        action: 'increment' | 'reset';
        amount?: number;
      },
      _controller: any
    ) => {
      const { childId: targetId, action, amount } = payload;

      // 자신에게 향한 명령인지 확인
      if (targetId !== childId) return;

      const counterStore = storeManager.getStore('counter');

      if (action === 'increment') {
        const currentValue = counterStore.getValue();
        const incrementAmount = amount || 1;
        const newValue = currentValue + incrementAmount;

        counterStore.setValue(newValue);

        // 로그 모니터에 직접 데이터 전송
        addLog({
          level: LogLevel.INFO,
          type: 'action',
          message: `🎮 ChildA 원격 제어로 카운터 증가: ${newValue}`,
          details: {
            counter: newValue,
            action: 'remote-increment',
            amount: incrementAmount,
            context: 'Child A - Remote Control',
          },
        });

        // 단순한 콘솔 로그 사용
        console.log('🎮 ChildA 원격 제어로 카운터 증가:', {
          amount: incrementAmount,
          newValue,
        });
      } else if (action === 'reset') {
        counterStore.setValue(0);

        // 로그 모니터에 직접 데이터 전송
        addLog({
          level: LogLevel.INFO,
          type: 'action',
          message: '🎮 ChildA 원격 제어로 카운터 리셋됨',
          details: {
            counter: 0,
            action: 'remote-reset',
            context: 'Child A - Remote Control',
          },
        });

        // 단순한 콘솔 로그 사용
        console.log('🎮 ChildA 원격 제어로 카운터 리셋됨');
      }
    },
    [storeManager, parentDispatch, childId]
  );

  // ChildA가 상위에 자신의 제어 핸들러를 등록
  useParentActionHandler('requestChildControl', handleRemoteControl, {
    id: `child-a-remote-control-${childId}`,
  });

  // 리프레시 횟수 확인용 useEffect
  useEffect(() => {
    console.log(
      '🔄 ChildA Remote Control Actions 리프레시됨 - storeManager, parentDispatch, childId 변경'
    );
  }, [storeManager, parentDispatch, childId]);

  return { childId };
}
