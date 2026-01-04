/**
 * @fileoverview Test Controls View Component
 *
 * Context-Driven Architecture의 View Layer
 * 순수 UI 컴포넌트로 테스트 제어 인터페이스를 렌더링합니다.
 */

import { memo } from 'react';
import { buttonVariants } from '@/components/ui/variants';
import type { HandlerConfig } from '../contexts/PriorityContexts';

interface TestControlsViewProps {
  isRunning: boolean;
  selectedDelay: number;
  configs: HandlerConfig[];
  onStart: () => void;
  onAbort: () => void;
  onReset: () => void;
  onDelayChange: (delay: 0 | 1 | 50) => void;
  onBulkAdd: () => void;
  onClear: () => void;
  canStartTest: boolean;
  isAnyInstanceRunning: boolean;
}

/**
 * 테스트 제어 UI 컴포넌트
 *
 * 성능 테스트 실행을 위한 제어 인터페이스를 제공합니다.
 */
export const TestControlsView = memo<TestControlsViewProps>(
  function TestControlsView({
    isRunning,
    selectedDelay,
    configs,
    onStart,
    onAbort,
    onReset,
    onDelayChange,
    onBulkAdd,
    onClear,
    canStartTest,
    isAnyInstanceRunning,
  }) {
    return (
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <button
            onClick={onStart}
            disabled={isRunning}
            className={`btn text-sm px-3 py-2 flex-1 transition-all duration-200 ${
              isRunning
                ? 'btn-secondary opacity-50 cursor-not-allowed'
                : 'btn-primary'
            }`}
            title={isRunning ? '현재 실행 중...' : '성능 테스트 시작'}
          >
            {isRunning ? '⏳ 실행 중...' : '🚀 성능 테스트'}
          </button>
          <button
            onClick={onAbort}
            disabled={!isRunning}
            className={buttonVariants({ variant: 'danger', size: 'sm' })}
            title="실행 중단"
          >
            🛑 중단
          </button>
          <button
            onClick={onReset}
            disabled={isRunning}
            className={`${buttonVariants({ variant: 'secondary', size: 'sm' })} ${
              isRunning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={isRunning ? '현재 실행 중...' : '전체 초기화'}
          >
            🔄 리셋
          </button>
        </div>

        {/* 일괄 추가 버튼 */}
        <div className="flex gap-2 mb-3">
          <button
            onClick={onBulkAdd}
            disabled={isRunning}
            className={`${buttonVariants({ variant: 'warning', size: 'xs' })} flex-1 whitespace-nowrap ${
              isRunning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={isRunning ? '현재 실행 중...' : '1-100번 핸들러 일괄 추가'}
          >
            📦 일괄 추가 (1-100)
          </button>
          <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
            현재: {configs.length}개 핸들러
          </div>
        </div>

        {/* 딜레이 설정 버튼 (0ms, 1ms, 50ms) */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-purple-50 rounded text-xs">
          <span className="text-gray-600 font-medium">딜레이:</span>
          <div className="flex gap-1">
            {[0, 1, 50].map((delay) => (
              <button
                key={delay}
                onClick={() => onDelayChange(delay as 0 | 1 | 50)}
                disabled={isRunning}
                className={`px-2 py-1 rounded text-xs font-medium transition-all duration-200 ${
                  selectedDelay === delay
                    ? 'bg-purple-600 text-white'
                    : isRunning
                      ? 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed opacity-50'
                      : 'bg-white text-purple-600 border border-purple-300 hover:bg-purple-100'
                }`}
                title={
                  isRunning ? '현재 실행 중...' : `딜레이를 ${delay}ms로 설정`
                }
              >
                {delay}ms
              </button>
            ))}
          </div>
          <span className="text-gray-500 ml-auto text-xs">
            ⚡ 자동: {selectedDelay}ms
          </span>
        </div>

        {/* 핸들러 상태 정보 */}
        <div className="flex gap-2 mb-3 p-2 bg-blue-50 rounded text-xs">
          <span className="text-gray-600">설정된 핸들러:</span>
          <span className="font-medium text-blue-800">{configs.length}개</span>
          <button
            onClick={onClear}
            disabled={isRunning}
            className={`ml-auto ${buttonVariants({ variant: 'warning', size: 'xs' })} ${
              isRunning ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title={isRunning ? '현재 실행 중...' : '데이터 클리어'}
          >
            🗑️ 클리어
          </button>
        </div>
      </div>
    );
  }
);
