import { type ReactNode, useCallback } from 'react';
import {
  type HandlerOutput,
  LifecycleContext,
  type TraceEntry,
} from '../contexts/ActionLifecycleContext';

interface ActionLifecycleHandlerRegistryProps {
  record: (entry: Omit<TraceEntry, 'elapsedMs'>) => void;
  children: ReactNode;
}

export function ActionLifecycleHandlerRegistry({
  record,
  children,
}: ActionLifecycleHandlerRegistryProps) {
  LifecycleContext.useActionGuard(
    'run',
    useCallback(
      ({ mode: requestedMode }, controller) => {
        if (requestedMode === 'invalid') {
          record({
            handler: 'input-validation',
            status: 'rejected',
            detail: '필수 입력이 누락된 요청으로 처리했습니다.',
            priority: 100,
          });
          controller.abort('입력 검증에 실패했습니다.');
          return;
        }

        record({
          handler: 'input-validation',
          status: 'passed',
          detail: '입력 계약이 유효합니다.',
          priority: 100,
        });
      },
      [record]
    ),
    { id: 'lifecycle-input-validation', priority: 100 }
  );

  LifecycleContext.useActionGuard(
    'run',
    useCallback(
      async ({ mode: requestedMode }, controller) => {
        await new Promise((resolve) => setTimeout(resolve, 180));

        if (requestedMode === 'blocked') {
          record({
            handler: 'policy-guard',
            status: 'blocked',
            detail: '정책 엔진이 이 요청을 차단했습니다.',
            priority: 80,
          });
          controller.abort('정책 검사를 통과하지 못했습니다.');
          return;
        }

        record({
          handler: 'policy-guard',
          status: 'passed',
          detail: '정책·권한 검사를 통과했습니다.',
          priority: 80,
        });
      },
      [record]
    ),
    { id: 'lifecycle-policy-guard', priority: 80 }
  );

  LifecycleContext.useActionResultHandler(
    'run',
    useCallback(async () => {
      await new Promise((resolve) => setTimeout(resolve, 260));
      const output: HandlerOutput = {
        handler: 'business-operation',
        status: 'completed',
        detail: '비즈니스 작업과 상태 갱신을 완료했습니다.',
      };
      record({ ...output, priority: 50 });
      return output;
    }, [record]),
    {
      id: 'lifecycle-business-operation',
      priority: 50,
      scheduling: 'await-before-next',
      errorPolicy: 'fatal',
    }
  );

  LifecycleContext.useActionObserver(
    'run',
    useCallback(
      (event) => {
        const output: HandlerOutput = {
          handler: 'audit-log',
          status: 'completed',
          detail: `감사 이벤트를 기록했습니다. 최종 상태: ${event.outcome}`,
        };
        record({ ...output, priority: 10 });
      },
      [record]
    ),
    {
      id: 'lifecycle-audit-log',
      priority: 10,
      scheduling: 'start-and-continue',
      when: 'always',
    }
  );

  return children;
}
