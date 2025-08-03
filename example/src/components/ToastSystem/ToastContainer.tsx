import React from 'react';
import { useStoreValue, createLogger } from '@context-action/react';
import { LogLevel } from '@context-action/logger';
import { toastsStore, toastConfigStore } from './store';
import { ToastItem } from './ToastItem';
import { toastActionRegister } from './actions';
import { cn } from '../../lib/utils';
import { toastContainerVariants, buttonVariants } from '../ui/variants';

const logger = createLogger(LogLevel.DEBUG);

export function ToastContainer() {
  const toasts = useStoreValue(toastsStore);
  const config = useStoreValue(toastConfigStore);

  // 표시할 토스트들만 필터링 (hidden 상태 제외)
  const visibleToasts = toasts?.filter(toast => toast.phase !== 'hidden') || [];

  // 디버깅 정보 출력
  logger.debug('🍞 ToastContainer render:', {
    toasts: toasts?.length || 0,
    config,
    toastsData: toasts
  });

  // 콘솔에도 출력 (문제 진단용)
  console.log('🍞 ToastContainer Debug:', {
    toastsLength: toasts?.length || 0,
    visibleToastsLength: visibleToasts.length,
    sortedToastsLength: visibleToasts.length,
    config,
    toastsData: toasts
  });

  // 최신 토스트가 위로 오도록 정렬
  const sortedToasts = [...visibleToasts].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  const handleClearAll = () => {
    toastActionRegister.dispatch('clearAllToasts', {});
  };

  // 강제 테스트 Toast 생성 (디버깅용)
  const testToast = {
    id: 'test-toast-1',
    type: 'success' as const,
    title: '🧪 Test Toast',
    message: 'This is a test toast to verify display',
    timestamp: new Date(),
    duration: 5000,
    stackIndex: 0,
    isVisible: true,
    phase: 'visible' as const,
  };

  // 항상 컨테이너를 표시하여 위치와 스타일 확인
  return (
    <div 
      className="fixed top-4 right-4 z-50 w-96 pointer-events-none"
      style={{ zIndex: 9999 }}
    >
      {/* 디버그용 항상 표시되는 요소 */}
      <div className="pointer-events-auto mb-2 bg-blue-100 border border-blue-300 p-2 rounded text-xs text-blue-800">
        🍞 Toast Container Active - Store Toasts: {sortedToasts.length}
      </div>
      
      {/* 강제 테스트 Toast 표시 */}
      <div className="space-y-2 pointer-events-auto">
        <div className="p-4 w-full max-w-md bg-white shadow-lg border rounded-lg relative transition-all duration-200">
          <div className="flex items-start gap-3 mb-2">
            <div className="flex-shrink-0 text-lg">🧪</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">Test Toast (Forced Display)</div>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleTimeString('ko-KR')}
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-700 mb-3 break-words">
            이 Toast는 강제로 표시되는 테스트 Toast입니다. 이것이 보인다면 CSS와 위치는 정상입니다.
          </div>
        </div>
        
        {/* Store에서 가져온 실제 Toast들 */}
        {sortedToasts.map((toast, index) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            index={index + 1}
            totalCount={sortedToasts.length + 1}
          />
        ))}
      </div>
    </div>
  );
}