import React from 'react';
import { useStoreValue } from '@context-action/react';
import { toastsStore, toastConfigStore } from './store';
import { ToastItem } from './ToastItem';
import { toastActionRegister } from './actions';

export function ToastContainer() {
  const toasts = useStoreValue(toastsStore);
  const config = useStoreValue(toastConfigStore);

  // 표시할 토스트들만 필터링 (hidden 상태 제외)
  const visibleToasts = toasts?.filter(toast => toast.phase !== 'hidden') || [];

  // 최신 토스트가 위로 오도록 정렬
  const sortedToasts = [...visibleToasts].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  const handleClearAll = () => {
    toastActionRegister.dispatch('clearAllToasts', {});
  };

  if (sortedToasts.length === 0) {
    return null;
  }

  return (
    <div className={`toast-container toast-position-${config?.position || 'top-right'}`}>
      {/* 컨트롤 헤더 (토스트가 많을 때만 표시) */}
      {sortedToasts.length > 2 && (
        <div className="toast-controls">
          <div className="toast-count">
            {sortedToasts.length}개의 알림
          </div>
          <button 
            className="toast-clear-all"
            onClick={handleClearAll}
            title="모든 토스트 지우기"
          >
            🗑️ 모두 지우기
          </button>
        </div>
      )}

      {/* 토스트 스택 */}
      <div className="toast-stack">
        {sortedToasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index}
            totalCount={sortedToasts.length}
          />
        ))}
      </div>

      {/* 스택 표시기 (4개 이상일 때) */}
      {sortedToasts.length > 3 && (
        <div className="toast-stack-summary">
          <div className="stack-layers">
            {Array.from({ length: Math.min(3, sortedToasts.length) }).map((_, i) => (
              <div 
                key={i}
                className="stack-layer"
                style={{
                  transform: `translateY(${i * 2}px) scale(${1 - i * 0.05})`,
                  opacity: 1 - i * 0.2,
                  zIndex: 3 - i,
                }}
              />
            ))}
          </div>
          {sortedToasts.length > 3 && (
            <div className="stack-overflow">
              +{sortedToasts.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}