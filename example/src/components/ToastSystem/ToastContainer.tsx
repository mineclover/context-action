import { useStoreValue } from '@context-action/react';
import { toastsStore, toastConfigStore } from './store';
import { ToastItem } from './ToastItem';
import { toastActionRegister } from './actions';
import { cn } from '../../lib/utils';
import { toastContainerVariants, buttonVariants } from '../ui/variants';


export function ToastContainer() {
  const toasts = useStoreValue(toastsStore);
  const config = useStoreValue(toastConfigStore);

  // 표시할 토스트들만 필터링 (hidden 상태 제외)
  const visibleToasts = toasts?.filter(toast => toast.phase !== 'hidden') || [];

  // 최신 토스트가 위로 오도록 정렬 (timestamp가 Date 객체가 아닐 수 있으므로 안전하게 처리)
  const sortedToasts = [...visibleToasts].sort((a, b) => {
    const aTime = a.timestamp instanceof Date ? a.timestamp.getTime() : new Date(a.timestamp).getTime();
    const bTime = b.timestamp instanceof Date ? b.timestamp.getTime() : new Date(b.timestamp).getTime();
    return bTime - aTime;
  });

  const handleClearAll = () => {
    toastActionRegister.dispatch('clearAllToasts', {});
  };

  // 토스트가 없으면 컨테이너를 숨김
  if (sortedToasts.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      toastContainerVariants({ 
        position: (config?.position as any) || 'top-right',
        width: 'md'
      })
    )}>
      {/* 컨트롤 헤더 (토스트가 많을 때만 표시) */}
      {sortedToasts.length > 2 && (
        <div className="flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg p-3 mb-3 border border-gray-200">
          <div className="text-sm font-medium text-gray-700">
            {sortedToasts.length}개의 알림
          </div>
          <button 
            type="button"
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              "text-gray-500 hover:text-gray-700"
            )}
            onClick={handleClearAll}
            title="모든 토스트 지우기"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>모든 토스트 지우기</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            모두 지우기
          </button>
        </div>
      )}

      {/* 토스트 스택 */}
      <div className="space-y-2">
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
        <div className="relative mt-4">
          <div className="flex justify-center">
            <div className="relative">
              {Array.from({ length: Math.min(3, sortedToasts.length) }).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-16 h-2 bg-gray-300 rounded-full left-1/2 -ml-8"
                  style={{
                    transform: `translateY(${i * 2}px) scale(${1 - i * 0.1})`,
                    opacity: 1 - i * 0.3,
                    zIndex: 3 - i,
                  }}
                />
              ))}
            </div>
          </div>
          {sortedToasts.length > 3 && (
            <div className="text-center text-xs text-gray-500 mt-6">
              +{sortedToasts.length - 3} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}