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
  LifecycleContext.useActionHandler<'run', HandlerOutput>(
    'run',
    useCallback(
      ({ mode: requestedMode }) => {
        const output: HandlerOutput =
          requestedMode === 'invalid'
            ? {
                handler: 'input-validation',
                status: 'rejected',
                detail: '필수 입력이 누락된 요청으로 처리했습니다.',
              }
            : {
                handler: 'input-validation',
                status: 'passed',
                detail: '입력 계약이 유효합니다.',
              };
        record({ ...output, priority: 100 });
        return output;
      },
      [record]
    ),
    { id: 'lifecycle-input-validation', priority: 100, blocking: true }
  );

  LifecycleContext.useActionHandler<'run', HandlerOutput>(
    'run',
    useCallback(
      async ({ mode: requestedMode }, controller) => {
        await new Promise((resolve) => setTimeout(resolve, 180));

        const output: HandlerOutput =
          requestedMode === 'invalid' || requestedMode === 'blocked'
            ? {
                handler: 'policy-guard',
                status: 'blocked',
                detail:
                  requestedMode === 'invalid'
                    ? '검증 실패 요청은 후속 handler로 전달하지 않습니다.'
                    : '정책 엔진이 이 요청을 차단했습니다.',
              }
            : {
                handler: 'policy-guard',
                status: 'passed',
                detail: '정책·권한 검사를 통과했습니다.',
              };
        record({ ...output, priority: 80 });
        if (requestedMode === 'invalid') {
          controller.abort('입력 검증에 실패했습니다.');
        } else if (requestedMode === 'blocked') {
          controller.abort('정책 검사를 통과하지 못했습니다.');
        }
        return output;
      },
      [record]
    ),
    { id: 'lifecycle-policy-guard', priority: 80, blocking: true }
  );

  LifecycleContext.useActionHandler<'run', HandlerOutput>(
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
    { id: 'lifecycle-business-operation', priority: 50, blocking: true }
  );

  LifecycleContext.useActionHandler<'run', HandlerOutput>(
    'run',
    useCallback(() => {
      const output: HandlerOutput = {
        handler: 'audit-log',
        status: 'completed',
        detail: '감사 이벤트를 기록했습니다.',
      };
      record({ ...output, priority: 10 });
      return output;
    }, [record]),
    { id: 'lifecycle-audit-log', priority: 10, blocking: true }
  );

  return children;
}
