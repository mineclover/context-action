import { useStoreValue } from '@context-action/react';
import { cn } from '../../lib/utils';
import { toastContainerVariants } from '../ui/variants';
import { toastActionRegister } from './actions';
import { toastConfigStore, toastsStore } from './store';
import { ToastItem } from './ToastItem';

export function ToastContainer() {
  const toasts = useStoreValue(toastsStore);
  const config = useStoreValue(toastConfigStore);

  // 표시할 토스트들만 필터링 (hidden 상태 제외)
  const visibleToasts =
    toasts?.filter((toast) => toast.phase !== 'hidden') || [];

  // 최신 토스트가 위로 오도록 정렬 (timestamp가 Date 객체가 아닐 수 있으므로 안전하게 처리)
  const sortedToasts = [...visibleToasts].sort((a, b) => {
    const aTime =
      a.timestamp instanceof Date
        ? a.timestamp.getTime()
        : new Date(a.timestamp).getTime();
    const bTime =
      b.timestamp instanceof Date
        ? b.timestamp.getTime()
        : new Date(b.timestamp).getTime();
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
    <div
      className={cn(
        toastContainerVariants({
          position: config?.position || 'top-right',
          width: 'sm',
        })
      )}
    >
      {/* 컨트롤 헤더 - 최소화 (토스트가 많을 때만 표시) */}
      {sortedToasts.length > 3 && (
        <div className="flex items-center justify-end mb-2">
          <button
            type="button"
            className="text-xs text-white/50 hover:text-white/80 transition-colors p-1"
            onClick={handleClearAll}
            title="모든 토스트 지우기"
          >
            ×다 지우기
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
    </div>
  );
}
