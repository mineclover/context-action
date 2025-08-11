/**
 * @fileoverview 우선순위 그리드 표시 컴포넌트
 * 
 * 각 우선순위별 실행 횟수를 시각적으로 표시하는 그리드
 * 색상과 크기로 우선순위와 실행 횟수를 구분
 */

import { useStoreValue } from '@context-action/react';
import { memo, useMemo } from 'react';
import { usePriorityTestStore } from '../context/ActionTestContext';
import type { HandlerConfig } from '../hooks/types';

interface PriorityGridProps {
  configs: HandlerConfig[];
  className?: string;
}

/**
 * 우선순위 그리드 컴포넌트
 * 
 * 각 핸들러의 우선순위와 실행 횟수를 시각적으로 표시합니다.
 * - 우선순위는 색상으로 구분 (높을수록 빨간색)
 * - 실행 횟수는 숫자로 표시 (9 초과시 9+)
 * - 실행되지 않은 핸들러는 회색으로 표시
 */
export const PriorityGrid = memo<PriorityGridProps>(({ 
  configs, 
  className = '' 
}) => {
  const priorityCountsStore = usePriorityTestStore('priorityCounts');
  const priorityCounts = useStoreValue(priorityCountsStore);

  // 우선순위별로 정렬된 config (높은 우선순위부터)
  const sortedConfigs = useMemo(() => {
    return [...configs].sort((a, b) => b.priority - a.priority);
  }, [configs]);

  return (
    <div className={`priority-grid ${className}`}>
      <div className="grid grid-cols-5 md:grid-cols-9 gap-1 p-3 bg-gray-100 rounded-lg">
        {sortedConfigs.map((config) => {
          const count = priorityCounts[config.priority] || 0;
          const hasExecuted = count > 0;
          
          return (
            <div
              key={config.id}
              className={`
                relative flex flex-col items-center justify-center
                w-8 h-8 md:w-10 md:h-10 rounded-md shadow-sm
                transition-all duration-200 hover:scale-105
                ${hasExecuted ? 'ring-2 ring-blue-300' : ''}
              `}
              style={{
                backgroundColor: hasExecuted ? config.color : '#e5e7eb',
                opacity: hasExecuted ? 1 : 0.6,
              }}
              title={`${config.label} - ${count}회 실행`}
            >
              {/* 우선순위 번호 */}
              <div
                className="text-white font-bold leading-none"
                style={{
                  fontSize: '7px',
                  textShadow: '0 0 2px rgba(0,0,0,0.5)',
                }}
              >
                {config.priority}
              </div>
              
              {/* 실행 횟수 */}
              <div
                className="leading-none font-mono font-bold text-white"
                style={{ 
                  fontSize: '8px',
                  textShadow: '0 0 2px rgba(0,0,0,0.5)',
                }}
              >
                {count > 0 ? (count > 9 ? '9+' : count) : ''}
              </div>
              
              {/* 점프 표시 */}
              {config.jumpToPriority && (
                <div 
                  className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white"
                  title={`P${config.jumpToPriority}로 점프`}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* 범례 */}
      <div className="flex items-center justify-between text-xs text-gray-600 mt-2 px-1">
        <span>우선순위 (높음 → 낮음)</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            <span>점프</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-300 rounded border" />
            <span>실행됨</span>
          </div>
        </div>
      </div>
    </div>
  );
});

/**
 * 간단한 우선순위 리스트 (텍스트 버전)
 */
interface PriorityListProps {
  configs: HandlerConfig[];
  showCounts?: boolean;
  className?: string;
}

export const PriorityList = memo<PriorityListProps>(({ 
  configs, 
  showCounts = true,
  className = '' 
}) => {
  const priorityCountsStore = usePriorityTestStore('priorityCounts');
  const priorityCounts = useStoreValue(priorityCountsStore);

  const sortedConfigs = useMemo(() => {
    return [...configs].sort((a, b) => b.priority - a.priority);
  }, [configs]);

  return (
    <div className={`priority-list ${className}`}>
      <div className="space-y-1">
        {sortedConfigs.map((config) => {
          const count = priorityCounts[config.priority] || 0;
          
          return (
            <div 
              key={config.id}
              className="flex items-center justify-between py-1 px-2 rounded text-sm"
              style={{ backgroundColor: `${config.color}20` }}
            >
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: config.color }}
                />
                <span className="font-medium">{config.label}</span>
                <span className="text-xs text-gray-500">
                  (P{config.priority})
                </span>
              </div>
              
              {showCounts && (
                <span className="text-sm font-mono font-bold">
                  {count}회
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});