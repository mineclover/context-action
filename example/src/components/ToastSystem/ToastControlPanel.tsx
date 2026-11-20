import { useStoreValue } from '@context-action/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToastSystem } from './ToastContext';
import type { ToastPosition } from './types';
import { useActionToast } from './useActionToast';

export function ToastControlPanel() {
  const toastSystem = useToastSystem();
  const config = useStoreValue(toastSystem.stores.config);
  const { showToast, clearAllToasts } = useActionToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const stressTimeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearStressTimeouts = useCallback(() => {
    for (const timeoutId of stressTimeoutsRef.current) {
      clearTimeout(timeoutId);
    }
    stressTimeoutsRef.current = [];
  }, []);

  useEffect(() => clearStressTimeouts, [clearStressTimeouts]);

  const handlePositionChange = (position: ToastPosition) => {
    toastSystem.updateConfig({ position });
  };

  const handleMaxToastsChange = (maxToasts: number) => {
    toastSystem.updateConfig({ maxToasts });
  };

  const handleDurationChange = (defaultDuration: number) => {
    toastSystem.updateConfig({ defaultDuration });
  };

  const testToasts = [
    {
      type: 'success' as const,
      title: '✅ Success Toast',
      message: 'Operation completed successfully!',
    },
    {
      type: 'error' as const,
      title: '❌ Error Toast',
      message: 'Something went wrong. Please try again.',
    },
    {
      type: 'info' as const,
      title: 'ℹ️ Info Toast',
      message: 'Here is some useful information for you.',
    },
    {
      type: 'system' as const,
      title: '⚙️ System Toast',
      message: 'System notification message.',
    },
  ];

  const positions: { value: ToastPosition; label: string }[] = [
    { value: 'top-right', label: '↗️ Top Right' },
    { value: 'top-left', label: '↖️ Top Left' },
    { value: 'bottom-right', label: '↘️ Bottom Right' },
    { value: 'bottom-left', label: '↙️ Bottom Left' },
    { value: 'top-center', label: '⬆️ Top Center' },
    { value: 'bottom-center', label: '⬇️ Bottom Center' },
  ];

  return (
    <div
      className="fixed bottom-4 right-4 z-40 bg-white border border-gray-300 rounded-lg shadow-lg"
      style={{ zIndex: 9998 }}
    >
      <button
        className="w-full p-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors rounded-lg"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? '토스트 패널 닫기' : '토스트 패널 열기'}
      >
        🍞 Toast Control {isExpanded ? '🔽' : '🔼'}
      </button>

      {/* 강제 테스트 버튼 추가 (항상 표시) */}
      <div className="p-2 border-t border-gray-200">
        <button
          onClick={() => {
            showToast(
              'success',
              '✅ Quick Test',
              'Quick test button was clicked!'
            );
          }}
          className="w-full px-3 py-2 text-xs font-medium bg-green-100 text-green-800 rounded-md border border-green-300 hover:bg-green-200 transition-colors"
        >
          🧪 Quick Test Toast
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 w-80 max-h-[75vh] overflow-y-auto">
          {/* 빠른 테스트 버튼들 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              🧪 Quick Tests
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {testToasts.map((toast, index) => (
                <button
                  key={index}
                  onClick={() =>
                    showToast(toast.type, toast.title, toast.message)
                  }
                  className="px-3 py-2 text-xs font-medium rounded-md border transition-colors hover:bg-gray-50"
                  title={`Show ${toast.type} toast`}
                >
                  {toast.title}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  // executionTime 제거 - 자동 계산됨
                  toastSystem.showActionToast('updateProfile', 'success');
                }}
                className="px-3 py-2 text-xs font-medium rounded-md border transition-colors hover:bg-gray-50"
                title="Show action toast"
              >
                ⚡ Action Toast
              </button>

              <button
                onClick={clearAllToasts}
                className="px-3 py-2 text-xs font-medium rounded-md border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                title="Clear all toasts"
              >
                🗑️ Clear All
              </button>
            </div>
          </div>

          {/* 설정 섹션 */}
          <div className="space-y-3 border-t border-gray-200 pt-3">
            <h4 className="text-sm font-semibold text-gray-700">⚙️ Settings</h4>

            {/* 위치 설정 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Position:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {positions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handlePositionChange(value)}
                    className={`px-2 py-1.5 text-xs font-medium rounded border transition-colors ${
                      config?.position === value
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                    title={`Set position to ${label}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 최대 토스트 수 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Max Toasts:
                <span className="text-xs text-gray-500 ml-1">
                  (화면에 표시될 최대 개수)
                </span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleMaxToastsChange(num)}
                    className={`px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
                      config?.maxToasts === num
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                초과 시 가장 오래된 토스트가 자동으로 제거됩니다
              </p>
            </div>

            {/* 기본 지속 시간 */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-gray-600">
                Duration (ms):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[2000, 3000, 4000, 5000, 8000].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => handleDurationChange(duration)}
                    className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                      config?.defaultDuration === duration
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 스트레스 테스트 */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <h4 className="text-sm font-semibold text-gray-700">
              🚀 Stress Test
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  clearStressTimeouts();
                  for (let i = 0; i < 8; i++) {
                    const timeoutId = setTimeout(() => {
                      const types: ('info' | 'success' | 'error' | 'system')[] =
                        ['info', 'success', 'error', 'system'];
                      const selectedType = types[i % types.length];
                      if (selectedType) {
                        showToast(
                          selectedType,
                          `🔄 Overflow Test ${i + 1}`,
                          `이 메시지로 최대 개수 제한을 테스트해보세요! (${i + 1}/8)`
                        );
                      }
                    }, i * 300);
                    stressTimeoutsRef.current.push(timeoutId);
                  }
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                🔄 Overflow Test (8개)
              </button>

              <button
                onClick={() => {
                  clearStressTimeouts();
                  const actionTypes = [
                    'updateProfile',
                    'addToCart',
                    'addTodo',
                    'sendMessage',
                  ];
                  actionTypes.forEach((actionType, i) => {
                    const timeoutId = setTimeout(() => {
                      toastSystem.showActionToast(actionType, 'success');
                    }, i * 300);
                    stressTimeoutsRef.current.push(timeoutId);
                  });
                }}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                ⚡ Action Sequence
              </button>
            </div>
          </div>

          {/* 현재 설정 표시 */}
          <div className="space-y-2 border-t border-gray-200 pt-3">
            <h4 className="text-sm font-semibold text-gray-700">
              📊 Current Config
            </h4>
            <div className="space-y-1 rounded-md bg-gray-50 p-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Position:</span>
                <code className="rounded bg-white px-1.5 py-0.5 border border-gray-200">
                  {config?.position}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Max Toasts:</span>
                <code className="rounded bg-white px-1.5 py-0.5 border border-gray-200">
                  {config?.maxToasts}
                </code>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-600">Duration:</span>
                <code className="rounded bg-white px-1.5 py-0.5 border border-gray-200">
                  {config?.defaultDuration}ms
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
