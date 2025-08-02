import React, { useEffect, useState } from 'react';
import type { Toast } from './types';
import { toastActionRegister } from './actions';

interface ToastItemProps {
  toast: Toast;
  index: number;
  totalCount: number;
}

export function ToastItem({ toast, index, totalCount }: ToastItemProps) {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  // 진행률 애니메이션
  useEffect(() => {
    if (toast.phase !== 'visible' || isHovered) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [toast.phase, toast.duration, isHovered]);

  const handleClose = () => {
    toastActionRegister.dispatch('removeToast', { toastId: toast.id });
  };

  const getTypeIcon = () => {
    switch (toast.type) {
      case 'action': return '⚡';
      case 'system': return '⚙️';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getTypeColor = () => {
    const executionStep = toast.payload?.executionStep;
    if (toast.type === 'action' && executionStep) {
      switch (executionStep) {
        case 'start': return '#3b82f6';
        case 'processing': return '#f59e0b';
        case 'success': return '#10b981';
        case 'error': return '#ef4444';
        default: return '#6b7280';
      }
    }

    switch (toast.type) {
      case 'action': return '#3b82f6';
      case 'system': return '#6b7280';
      case 'error': return '#ef4444';
      case 'success': return '#10b981';
      case 'info': return '#0ea5e9';
      default: return '#6b7280';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // 스택 오프셋 계산 (뒤의 토스트들이 살짝 보이도록)
  const stackOffset = Math.min(index * 4, 12); // 최대 12px까지
  const scaleOffset = Math.max(0.95, 1 - index * 0.02); // 최소 0.95배까지
  const opacityOffset = Math.max(0.7, 1 - index * 0.1); // 최소 0.7 투명도까지

  return (
    <div
      className={`toast-item toast-${toast.type} toast-${toast.phase}`}
      style={{
        '--toast-color': getTypeColor(),
        '--stack-offset': `${stackOffset}px`,
        '--scale-offset': scaleOffset,
        '--opacity-offset': opacityOffset,
        zIndex: totalCount - index,
      } as React.CSSProperties}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 스택 카운터 */}
      {index > 0 && (
        <div className="toast-stack-indicator">
          +{index}
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="toast-content">
        {/* 헤더 */}
        <div className="toast-header">
          <div className="toast-icon">
            {getTypeIcon()}
          </div>
          <div className="toast-title-section">
            <div className="toast-title">{toast.title}</div>
            <div className="toast-timestamp">
              {formatTime(toast.timestamp)}
            </div>
          </div>
          <button 
            className="toast-close" 
            onClick={handleClose}
            title="토스트 닫기"
          >
            ✕
          </button>
        </div>

        {/* 메시지 */}
        <div className="toast-message">
          {toast.message}
        </div>

        {/* 액션 페이로드 정보 (개발/디버그용) */}
        {toast.type === 'action' && toast.payload && (
          <div className="toast-action-details">
            {toast.actionType && (
              <div className="action-type">
                <span className="label">Action:</span>
                <code>{toast.actionType}</code>
              </div>
            )}
            {toast.payload.executionTime && (
              <div className="execution-time">
                <span className="label">Time:</span>
                <code>{toast.payload.executionTime}ms</code>
              </div>
            )}
            {toast.payload.executionStep && (
              <div className="execution-step">
                <span className="label">Step:</span>
                <span className={`step-badge step-${toast.payload.executionStep}`}>
                  {toast.payload.executionStep}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 진행률 바 */}
        <div className="toast-progress-container">
          <div 
            className="toast-progress-bar"
            style={{ 
              width: `${progress}%`,
              opacity: isHovered ? 0.3 : 1 
            }}
          />
        </div>
      </div>
    </div>
  );
}