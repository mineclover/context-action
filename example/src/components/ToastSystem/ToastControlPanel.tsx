import React, { useState } from 'react';
import { useStoreValue } from '@context-action/react';
import { useActionToast } from './useActionToast';
import { toastConfigStore } from './store';
import { toastActionRegister } from './actions';
import type { ToastPosition } from './types';

export function ToastControlPanel() {
  const config = useStoreValue(toastConfigStore);
  const { showToast, clearAllToasts } = useActionToast();
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePositionChange = (position: ToastPosition) => {
    toastActionRegister.dispatch('updateToastConfig', { position });
  };

  const handleMaxToastsChange = (maxToasts: number) => {
    toastActionRegister.dispatch('updateToastConfig', { maxToasts });
  };

  const handleDurationChange = (defaultDuration: number) => {
    toastActionRegister.dispatch('updateToastConfig', { defaultDuration });
  };

  const testToasts = [
    { type: 'success' as const, title: '✅ Success Toast', message: 'Operation completed successfully!' },
    { type: 'error' as const, title: '❌ Error Toast', message: 'Something went wrong. Please try again.' },
    { type: 'info' as const, title: 'ℹ️ Info Toast', message: 'Here is some useful information for you.' },
    { type: 'system' as const, title: '⚙️ System Toast', message: 'System notification message.' },
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
    <div className="fixed bottom-4 right-4 z-40 bg-white border border-gray-300 rounded-lg shadow-lg" style={{ zIndex: 9998 }}>
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
            console.log('🍞 Quick test button clicked');
            showToast('success', '✅ Quick Test', 'Quick test button was clicked!');
          }}
          className="w-full px-3 py-2 text-xs font-medium bg-green-100 text-green-800 rounded-md border border-green-300 hover:bg-green-200 transition-colors"
        >
          🧪 Quick Test Toast
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4 w-80">
          {/* 빠른 테스트 버튼들 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">🧪 Quick Tests</h4>
            <div className="grid grid-cols-2 gap-2">
              {testToasts.map((toast, index) => (
                <button
                  key={index}
                  onClick={() => showToast(toast.type, toast.title, toast.message)}
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
                  toastActionRegister.dispatch('addActionToast', {
                    actionType: 'updateProfile',
                    executionStep: 'success',
                    // executionTime은 ToastSystem actions에서 자동으로 처리
                  });
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
          <div className="toast-settings">
            <h4>⚙️ Settings</h4>
            
            {/* 위치 설정 */}
            <div className="toast-setting-group">
              <label className="toast-setting-label">Position:</label>
              <div className="toast-position-buttons">
                {positions.map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => handlePositionChange(value)}
                    className={`toast-position-btn ${config?.position === value ? 'active' : ''}`}
                    title={`Set position to ${label}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 최대 토스트 수 */}
            <div className="toast-setting-group">
              <label className="toast-setting-label">Max Toasts:</label>
              <div className="toast-number-controls">
                {[3, 5, 7, 10].map(num => (
                  <button
                    key={num}
                    onClick={() => handleMaxToastsChange(num)}
                    className={`toast-number-btn ${config?.maxToasts === num ? 'active' : ''}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* 기본 지속 시간 */}
            <div className="toast-setting-group">
              <label className="toast-setting-label">Duration (ms):</label>
              <div className="toast-number-controls">
                {[2000, 3000, 4000, 5000, 8000].map(duration => (
                  <button
                    key={duration}
                    onClick={() => handleDurationChange(duration)}
                    className={`toast-number-btn ${config?.defaultDuration === duration ? 'active' : ''}`}
                  >
                    {duration}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 스트레스 테스트 */}
          <div className="toast-stress-test">
            <h4>🚀 Stress Test</h4>
            <div className="toast-stress-buttons">
              <button
                onClick={() => {
                  for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                      showToast('info', `🔄 Bulk Test ${i + 1}`, `This is bulk message number ${i + 1}`);
                    }, i * 200);
                  }
                }}
                className="toast-stress-btn"
              >
                🔄 Bulk Test (5)
              </button>
              
              <button
                onClick={() => {
                  const actionTypes = ['updateProfile', 'addToCart', 'addTodo', 'sendMessage'];
                  actionTypes.forEach((actionType, i) => {
                    setTimeout(() => {
                      // executionTime 제거 - 자동 계산됨
                      toastActionRegister.dispatch('addActionToast', {
                        actionType,
                        executionStep: 'success',
                        // executionTime은 ToastSystem actions에서 자동으로 처리
                      });
                    }, i * 300);
                  });
                }}
                className="toast-stress-btn"
              >
                ⚡ Action Sequence
              </button>
            </div>
          </div>

          {/* 현재 설정 표시 */}
          <div className="toast-current-config">
            <h4>📊 Current Config</h4>
            <div className="config-display">
              <div className="config-item">
                <span className="config-key">Position:</span>
                <code>{config?.position}</code>
              </div>
              <div className="config-item">
                <span className="config-key">Max Toasts:</span>
                <code>{config?.maxToasts}</code>
              </div>
              <div className="config-item">
                <span className="config-key">Duration:</span>
                <code>{config?.defaultDuration}ms</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}