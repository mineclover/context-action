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

  // 색상 계산 함수 - 우선순위에 따라 일관된 색상 생성
  const getPriorityColor = (priority: number) => {
    // 우선순위를 0-100 범위에서 0-1 사이로 정규화
    const normalized = priority / 100;
    
    if (normalized >= 0.9) return { bg: '#dc2626', text: '#fff' }; // red-600
    if (normalized >= 0.8) return { bg: '#ea580c', text: '#fff' }; // orange-600
    if (normalized >= 0.7) return { bg: '#d97706', text: '#fff' }; // amber-600
    if (normalized >= 0.6) return { bg: '#059669', text: '#fff' }; // emerald-600
    if (normalized >= 0.5) return { bg: '#0d9488', text: '#fff' }; // teal-600
    if (normalized >= 0.4) return { bg: '#0891b2', text: '#fff' }; // cyan-600
    if (normalized >= 0.3) return { bg: '#2563eb', text: '#fff' }; // blue-600
    if (normalized >= 0.2) return { bg: '#7c3aed', text: '#fff' }; // violet-600
    return { bg: '#9333ea', text: '#fff' }; // purple-600
  };

  return (
    <div className={`priority-grid ${className}`}>
      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-2 p-4 bg-gray-50 rounded-lg">
        {sortedConfigs.map((config) => {
          const count = priorityCounts[config.priority] || 0;
          const hasExecuted = count > 0;
          const colors = getPriorityColor(config.priority);
          
          return (
            <div
              key={config.id}
              className={`
                relative flex flex-col items-center justify-center
                w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg shadow-sm border-2
                transition-all duration-200 hover:scale-105 cursor-default
                ${hasExecuted ? 'border-indigo-400 shadow-md' : 'border-gray-300'}
              `}
              style={{
                backgroundColor: hasExecuted ? colors.bg : '#f3f4f6',
                color: hasExecuted ? colors.text : '#6b7280',
              }}
              title={`${config.label} - ${count}회 실행`}
            >
              {/* 우선순위 번호 */}
              <div
                className="font-bold leading-tight mb-0.5"
                style={{
                  fontSize: '10px',
                  textShadow: hasExecuted ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                P{config.priority}
              </div>
              
              {/* 실행 횟수 */}
              <div
                className="leading-none font-mono font-extrabold"
                style={{ 
                  fontSize: '11px',
                  textShadow: hasExecuted ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {count > 0 ? (count > 99 ? '99+' : count) : '-'}
              </div>
              
              {/* 점프 표시 */}
              {config.jumpToPriority && (
                <div 
                  className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-sm"
                  title={`P${config.jumpToPriority}로 점프`}
                />
              )}
            </div>
          );
        })}
      </div>
      
      {/* 범례 */}
      <div className="flex items-center justify-between text-sm text-gray-700 mt-3 px-2">
        <span className="font-medium">우선순위 (높음 → 낮음)</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-400 rounded-full border border-white shadow-sm" />
            <span>점프</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-400 rounded border-2 border-indigo-400" />
            <span>실행됨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded border-2 border-gray-300" />
            <span>대기중</span>
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

  // 색상 계산 함수 (PriorityGrid와 동일)
  const getPriorityColor = (priority: number) => {
    const normalized = priority / 100;
    
    if (normalized >= 0.9) return '#dc2626'; // red-600
    if (normalized >= 0.8) return '#ea580c'; // orange-600
    if (normalized >= 0.7) return '#d97706'; // amber-600
    if (normalized >= 0.6) return '#059669'; // emerald-600
    if (normalized >= 0.5) return '#0d9488'; // teal-600
    if (normalized >= 0.4) return '#0891b2'; // cyan-600
    if (normalized >= 0.3) return '#2563eb'; // blue-600
    if (normalized >= 0.2) return '#7c3aed'; // violet-600
    return '#9333ea'; // purple-600
  };

  return (
    <div className={`priority-list ${className}`}>
      <div className="space-y-2">
        {sortedConfigs.map((config) => {
          const count = priorityCounts[config.priority] || 0;
          const color = getPriorityColor(config.priority);
          
          return (
            <div 
              key={config.id}
              className="flex items-center justify-between py-2 px-3 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color }}
                />
                <div className="flex flex-col">
                  <span className="font-medium text-gray-900">{config.label}</span>
                  <span className="text-xs text-gray-500">
                    우선순위 {config.priority}
                    {config.jumpToPriority && (
                      <span className="ml-1 text-amber-600">
                        → P{config.jumpToPriority} 점프
                      </span>
                    )}
                  </span>
                </div>
              </div>
              
              {showCounts && (
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-gray-900">
                    {count}
                  </div>
                  <div className="text-xs text-gray-500">실행</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});