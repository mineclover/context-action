// @ts-nocheck
import type React from 'react';
import { useEffect, useState } from 'react';
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

export function ToastItem({
  toast,
  index,
  totalCount,
}: ToastItemProps): React.JSX.Element {
  // Ensure toast has proper types
  const safeToast = toast as Toast;
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  // 진행률 애니메이션
  useEffect(() => {
    if (safeToast.phase !== 'visible' || isHovered) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / safeToast.duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [safeToast.phase, safeToast.duration, isHovered]);

  const handleClose = () => {
    toastActionRegister.dispatch('removeToast', { toastId: safeToast.id });
  };

  const getTypeIcon = (): React.ReactNode => {
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
  };

  const _getTypeColor = () => {
    if (
      safeToast.type === 'action' &&
      isActionToastPayload(safeToast.payload)
    ) {
      const executionStep = safeToast.payload.executionStep;
      if (executionStep) {
        switch (executionStep) {
          case 'start':
            return '#3b82f6';
          case 'processing':
            return '#f59e0b';
          case 'success':
            return '#10b981';
          case 'error':
            return '#ef4444';
          default:
            return '#6b7280';
        }
      }
    }

    switch (safeToast.type) {
      case 'action':
        return '#3b82f6';
      case 'system':
        return '#6b7280';
      case 'error':
        return '#ef4444';
      case 'success':
        return '#10b981';
      case 'info':
        return '#0ea5e9';
      default:
        return '#6b7280';
    }
  };

  const _formatTime = (date: Date | string | number) => {
    // Date 객체가 아닐 수 있으므로 안전하게 처리
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 스택 오프셋 계산 (뒤의 토스트들이 살짝 보이도록)
  const stackOffset = Math.min(index * 4, 12); // 최대 12px까지
  const scaleOffset = Math.max(0.95, 1 - index * 0.02); // 최소 0.95배까지
  const _opacityOffset = Math.max(0.7, 1 - index * 0.1); // 최소 0.7 투명도까지

  const actionPayload = isActionToastPayload(safeToast.payload)
    ? safeToast.payload
    : null;
  const executionStep =
    actionPayload?.executionStep as ToastVariants['executionStep'];

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 컴팩트 헤더 */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 text-sm">{getTypeIcon()}</div>
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

      {/* 진행률 바 - 더 얇고 투명하게 */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 rounded-b-md overflow-hidden">
        <div
          className="h-full bg-white/30 transition-all duration-100"
          style={{
            width: `${progress}%`,
            opacity: isHovered ? 0.2 : 0.5,
          }}
        />
      </div>
    </div>
  );
}
