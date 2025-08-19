/**
 * @fileoverview 테스트 제어 컴포넌트
 *
 * 테스트 시작, 중단, 리셋 등의 제어 기능을 제공
 * 딜레이 설정, 설정 변경 등의 옵션도 포함
 */

import { memo, useCallback } from 'react';
import type { HandlerConfig } from '../test-hooks/types';

interface TestControlsProps {
  /** 현재 실행 중 여부 */
  isRunning: boolean;

  /** 현재 선택된 딜레이 */
  selectedDelay: 0 | 1 | 50;

  /** 핸들러 설정 배열 */
  configs: HandlerConfig[];

  /** 테스트 시작 콜백 */
  onStart: () => void;

  /** 테스트 중단 콜백 */
  onAbort: () => void;

  /** 테스트 리셋 콜백 */
  onReset: () => void;

  /** 딜레이 변경 콜백 */
  onDelayChange: (delay: 0 | 1 | 50) => void;

  /** 설정 변경 콜백 */
  onConfigsChange?: (configs: HandlerConfig[]) => void;

  /** 추가 클래스명 */
  className?: string;
}

/**
 * 테스트 제어판 컴포넌트
 *
 * 테스트 실행과 관련된 모든 제어 기능을 제공합니다:
 * - 테스트 시작/중단/리셋
 * - 딜레이 설정 (0ms, 1ms, 50ms)
 * - 핸들러 개수 표시
 * - 실행 상태 표시
 */
export const TestControls = memo<TestControlsProps>(
  ({
    isRunning,
    selectedDelay,
    configs,
    onStart,
    onAbort,
    onReset,
    onDelayChange,
    onConfigsChange,
    className = '',
  }) => {
    const handleDelayChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        const delay = parseInt(e.target.value) as 0 | 1 | 50;
        onDelayChange(delay);
      },
      [onDelayChange]
    );

    const delayOptions = [
      { value: 0, label: '즉시 실행 (0ms)', description: '최대 성능 테스트' },
      { value: 1, label: '최소 딜레이 (1ms)', description: '거의 즉시 실행' },
      {
        value: 50,
        label: '표준 딜레이 (50ms)',
        description: '실제 상황 시뮬레이션',
      },
    ] as const;

    return (
      <div
        className={`test-controls bg-white rounded-lg shadow-sm border p-4 ${className}`}
      >
        {/* 제어 버튼들 */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onStart}
            disabled={isRunning}
            className={`
            px-4 py-2 rounded-md font-medium transition-all duration-200
            ${
              isRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
            }
          `}
          >
            {isRunning ? '실행 중...' : '🚀 테스트 시작'}
          </button>

          <button
            onClick={onAbort}
            disabled={!isRunning}
            className={`
            px-4 py-2 rounded-md font-medium transition-all duration-200
            ${
              !isRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-md'
            }
          `}
          >
            🛑 중단
          </button>

          <button
            onClick={onReset}
            disabled={isRunning}
            className={`
            px-3 py-2 rounded-md font-medium transition-all duration-200
            ${
              isRunning
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700 hover:shadow-md'
            }
          `}
          >
            🔄 리셋
          </button>
        </div>

        {/* 설정 옵션들 */}
        <div className="space-y-3">
          {/* 딜레이 설정 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 min-w-0 sm:min-w-[80px]">
              딜레이 설정:
            </label>

            <select
              value={selectedDelay}
              onChange={handleDelayChange}
              disabled={isRunning}
              className={`
              px-3 py-2 border rounded-md text-sm flex-1 sm:flex-initial sm:min-w-[200px]
              ${
                isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }
            `}
            >
              {delayOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 현재 설정 정보 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2 border-t">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>
                📊 핸들러:{' '}
                <span className="font-medium text-gray-800">
                  {configs.length}개
                </span>
              </span>

              <span>
                ⏱️ 딜레이:{' '}
                <span className="font-medium text-gray-800">
                  {selectedDelay}ms
                </span>
              </span>

              <span>
                🔄 점프 핸들러:{' '}
                <span className="font-medium text-gray-800">
                  {configs.filter((c) => c.jumpToPriority !== null).length}개
                </span>
              </span>
            </div>
          </div>

          {/* 현재 딜레이 설정에 대한 설명 */}
          <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-2">
            💡{' '}
            {
              delayOptions.find((opt) => opt.value === selectedDelay)
                ?.description
            }
          </div>
        </div>

        {/* 실행 상태 표시 */}
        {isRunning && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              <span className="text-sm text-blue-700 font-medium">
                우선순위 테스트 실행 중...
              </span>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              중단하려면 '중단' 버튼을 클릭하세요
            </p>
          </div>
        )}
      </div>
    );
  }
);
