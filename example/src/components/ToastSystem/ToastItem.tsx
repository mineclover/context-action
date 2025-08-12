// @ts-nocheck
import type React from 'react';
import { memo, useCallback, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { type ToastVariants, toastVariants } from '../ui/variants';
import { toastActionRegister } from './actions';
import type { Toast } from './types';
import { isActionToastPayload } from './types';

interface ToastItemProps {
  toast: Toast;
  index: number;
  totalCount: number;
}

const ToastItemComponent = ({
  toast,
  index,
  totalCount,
}: ToastItemProps): React.JSX.Element => {
  // Ensure toast has proper types
  const safeToast = toast as Toast;

  const handleClose = useCallback(() => {
    toastActionRegister.dispatch('removeToast', { toastId: safeToast.id });
  }, [safeToast.id]);

  const typeIcon = useMemo((): React.ReactNode => {
    switch (safeToast.type) {
      case 'action':
        return '⚡';
      case 'system':
        return '⚙️';
      case 'error':
        return '❌';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }, [safeToast.type]);


  // 스택 오프셋 계산 (뒤의 토스트들이 살짝 보이도록)
  const styleValues = useMemo(() => {
    const stackOffset = Math.min(index * 4, 12); // 최대 12px까지
    const scaleOffset = Math.max(0.95, 1 - index * 0.02); // 최소 0.95배까지
    
    const actionPayload = isActionToastPayload(safeToast.payload)
      ? safeToast.payload
      : null;
    const executionStep =
      actionPayload?.executionStep as ToastVariants['executionStep'];
    
    return {
      stackOffset,
      scaleOffset,
      actionPayload,
      executionStep,
    };
  }, [index, safeToast.payload]);

  const { stackOffset, scaleOffset, actionPayload, executionStep } = styleValues;

  return (
    <div
      className={cn(
        toastVariants({
          type: safeToast.type as ToastVariants['type'],
          phase: safeToast.phase as ToastVariants['phase'],
          executionStep:
            safeToast.type === 'action' ? executionStep : undefined,
        }),
        'p-2 w-full bg-black/70 backdrop-blur-sm text-white shadow-lg rounded-md relative transition-all duration-200 pointer-events-auto'
      )}
      style={
        {
          ['--stack-offset' as any]: `${stackOffset}px`,
          ['--scale-offset' as any]: scaleOffset,
          ['--opacity-offset' as any]: 0.8,
          transform: `translateY(var(--stack-offset)) scale(var(--scale-offset))`,
          opacity: 0.8,
          zIndex: totalCount - index,
        } as React.CSSProperties
      }
    >
      {/* 컴팩트 헤더 */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 text-sm">{typeIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium break-words">
            {safeToast.message as string}
          </div>
        </div>
        <button
          type="button"
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors p-0.5 rounded"
          onClick={handleClose}
          title="토스트 닫기"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* 액션 정보 - 최소화된 버전 */}
      {safeToast.type === 'action' && actionPayload?.executionTime && (
        <div className="text-xs text-white/70 mt-1">
          {actionPayload.executionTime}ms
        </div>
      )}

      {/* 진행률 바 - CSS 애니메이션 */}
      {safeToast.phase === 'visible' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-md overflow-hidden">
          <div
            className="h-full bg-white/30 toast-progress-bar"
            style={{
              ['--duration' as any]: `${safeToast.duration}ms`,
            }}
          />
        </div>
      )}
    </div>
  );
};

// React.memo로 최적화 - toast 객체의 깊은 비교를 위한 커스텀 비교 함수
export const ToastItem = memo(ToastItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.toast.id === nextProps.toast.id &&
    prevProps.toast.phase === nextProps.toast.phase &&
    prevProps.toast.type === nextProps.toast.type &&
    prevProps.toast.message === nextProps.toast.message &&
    prevProps.index === nextProps.index &&
    prevProps.totalCount === nextProps.totalCount
  );
});
