// @ts-nocheck
import React, { useEffect, useState } from 'react';
import type { Toast, ActionToastPayload } from './types';
import { isActionToastPayload } from './types';
import { toastActionRegister } from './actions';
import { cn } from '../../lib/utils';
import { toastVariants, toastStepBadgeVariants, type ToastVariants } from '../ui/variants';

interface ToastItemProps {
  toast: Toast;
  index: number;
  totalCount: number;
}

export function ToastItem({ toast, index, totalCount }: ToastItemProps): React.JSX.Element {
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
      case 'action': return '⚡';
      case 'system': return '⚙️';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getTypeColor = () => {
    if (safeToast.type === 'action' && isActionToastPayload(safeToast.payload)) {
      const executionStep = safeToast.payload.executionStep;
      if (executionStep) {
        switch (executionStep) {
          case 'start': return '#3b82f6';
          case 'processing': return '#f59e0b';
          case 'success': return '#10b981';
          case 'error': return '#ef4444';
          default: return '#6b7280';
        }
      }
    }

    switch (safeToast.type) {
      case 'action': return '#3b82f6';
      case 'system': return '#6b7280';
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      case 'info': return '#0ea5e9';
      default: return '#6b7280';
    }
  };

  const formatTime = (date: Date | string | number) => {
    // Date 객체가 아닐 수 있으므로 안전하게 처리
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // 스택 오프셋 계산 (뒤의 토스트들이 살짝 보이도록)
  const stackOffset = Math.min(index * 4, 12); // 최대 12px까지
  const scaleOffset = Math.max(0.95, 1 - index * 0.02); // 최소 0.95배까지
  const opacityOffset = Math.max(0.7, 1 - index * 0.1); // 최소 0.7 투명도까지

  const actionPayload = isActionToastPayload(safeToast.payload) ? safeToast.payload : null;
  const executionStep = actionPayload?.executionStep as ToastVariants['executionStep'];

  return (
    <div
      className={cn(
        toastVariants({ 
          type: safeToast.type as ToastVariants['type'],
          phase: safeToast.phase as ToastVariants['phase'],
          executionStep: safeToast.type === 'action' ? executionStep : undefined
        }),
        "p-4 w-full max-w-md bg-white shadow-lg border rounded-lg relative transition-all duration-200"
      )}
      style={{
        ['--stack-offset' as any]: `${stackOffset}px`,
        ['--scale-offset' as any]: scaleOffset,
        ['--opacity-offset' as any]: opacityOffset,
        transform: `translateY(var(--stack-offset)) scale(var(--scale-offset))`,
        opacity: opacityOffset,
        zIndex: totalCount - index,
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 스택 카운터 */}
      {index > 0 && (
        <div className="absolute -top-2 -right-2 bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
          +{index}
        </div>
      )}

      {/* 헤더 */}
      <div className="flex items-start gap-3 mb-2">
        <div className="flex-shrink-0 text-lg">
          {getTypeIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">{safeToast.title as string}</div>
          <div className="text-xs text-gray-500">
            {formatTime(safeToast.timestamp)}
          </div>
        </div>
        <button 
          type="button"
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          onClick={handleClose}
          title="토스트 닫기"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 메시지 */}
      <div className="text-sm text-gray-700 mb-3 break-words">
        {safeToast.message as string}
      </div>

      {/* 액션 페이로드 정보 (개발/디버그용) */}
      {safeToast.type === 'action' && safeToast.payload && (
        <div className="bg-gray-50 rounded-md p-3 space-y-2 text-xs">
          {safeToast.actionType && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Action:</span>
              <code className="bg-gray-200 px-2 py-1 rounded text-gray-700 font-mono">
                {safeToast.actionType}
              </code>
            </div>
          )}
          {actionPayload?.executionTime && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Time:</span>
              <code className="bg-gray-200 px-2 py-1 rounded text-gray-700 font-mono">
                {actionPayload.executionTime}ms
              </code>
            </div>
          )}
          {actionPayload?.executionStep && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 font-medium">Step:</span>
              <span className={cn(toastStepBadgeVariants({ step: actionPayload.executionStep }))}>
                {actionPayload.executionStep}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 진행률 바 */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-100"
          style={{ 
            width: `${progress}%`,
            opacity: isHovered ? 0.3 : 1 
          }}
        />
      </div>
    </div>
  );
}