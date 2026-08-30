// @ts-nocheck
import React from 'react';
import { cn } from '../../lib/utils';
import { type ToastVariants, toastVariants } from '../ui/variants';
import { useToastSystem } from './ToastContext';
import type { Toast } from './types';
import { isActionToastPayload } from './types';

interface ToastItemProps {
  toast: Toast;
}

const ToastItemComponent = ({ toast }: ToastItemProps): React.JSX.Element => {
  // Ensure toast has proper types
  const safeToast = toast as Toast;
  const toastSystem = useToastSystem();

  React.useEffect(() => {
    const updatePhase = (phase: Toast['phase']) => {
      toastSystem.updateToastPhase(safeToast.id, phase);
    };

    if (safeToast.phase === 'entering') {
      const markVisible = () => updatePhase('visible');

      if (
        typeof window !== 'undefined' &&
        typeof window.requestAnimationFrame === 'function'
      ) {
        const frame = window.requestAnimationFrame(markVisible);
        return () => window.cancelAnimationFrame(frame);
      }

      const timer = setTimeout(markVisible, 0);
      return () => clearTimeout(timer);
    }

    if (safeToast.phase === 'visible') {
      const timestamp =
        safeToast.timestamp instanceof Date
          ? safeToast.timestamp.getTime()
          : new Date(safeToast.timestamp).getTime();
      const expiresIn = Math.max(
        0,
        (Number.isFinite(timestamp) ? timestamp : Date.now()) +
          safeToast.duration -
          Date.now()
      );
      const timer = setTimeout(() => updatePhase('exiting'), expiresIn);
      return () => clearTimeout(timer);
    }

    if (safeToast.phase === 'exiting') {
      const timer = setTimeout(() => {
        toastSystem.removeToast(safeToast.id);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [
    safeToast.duration,
    safeToast.id,
    safeToast.phase,
    safeToast.timestamp,
    toastSystem,
  ]);

  const handleClose = () => {
    toastSystem.removeToast(safeToast.id);
  };

  const typeIcon = (): React.ReactNode => {
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

  const actionPayload = isActionToastPayload(safeToast.payload)
    ? safeToast.payload
    : null;
  const executionStep =
    actionPayload?.executionStep as ToastVariants['executionStep'];
  const phase = safeToast.phase === 'hidden' ? 'exited' : safeToast.phase;

  return (
    <div
      className={cn(
        toastVariants({
          type: safeToast.type as ToastVariants['type'],
          phase: phase as ToastVariants['phase'],
          executionStep:
            safeToast.type === 'action' ? executionStep : undefined,
        }),
        'p-2 w-full bg-black/70 backdrop-blur-sm text-white shadow-lg rounded-md relative transition-all duration-200 pointer-events-auto'
      )}
    >
      {/* 컴팩트 헤더 */}
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 text-sm">{typeIcon()}</div>
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

// React 컴파일러가 자동으로 최적화
export const ToastItem = ToastItemComponent;
