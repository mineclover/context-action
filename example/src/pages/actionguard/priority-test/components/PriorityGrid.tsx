/**
 * @fileoverview 우선순위 그리드 표시 컴포넌트
 *
 * 각 우선순위별 실행 횟수를 시각적으로 표시하는 그리드
 * 색상과 크기로 우선순위와 실행 횟수를 구분
 */

import { useStoreValue } from '@context-action/react';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import styles from '../../performance/PriorityTestInstance.module.css';
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
export const PriorityGrid = memo<PriorityGridProps>(
  ({ configs, className = '' }) => {
    const priorityCountsStore = usePriorityTestStore('priorityCounts');
    const priorityCounts = useStoreValue(priorityCountsStore);

    // 이전 카운트를 추적하기 위한 ref
    const prevCountsRef = useRef<Record<number, number>>({});
    const [animatingPriorities, setAnimatingPriorities] = useState<Set<number>>(
      new Set()
    );
    const animationTimeouts = useRef<Record<number, NodeJS.Timeout>>({});

    // 우선순위별로 정렬된 config (높은 우선순위부터)
    const sortedConfigs = useMemo(() => {
      return [...configs].sort((a, b) => b.priority - a.priority);
    }, [configs]);

    // 카운트 변화 감지 및 애니메이션 트리거
    useEffect(() => {
      const prevCounts = prevCountsRef.current;

      // 카운트가 증가한 우선순위 찾기
      Object.keys(priorityCounts).forEach((priorityStr) => {
        const priority = Number(priorityStr);
        const currentCount = priorityCounts[priority] || 0;
        const prevCount = prevCounts[priority] || 0;

        if (currentCount > prevCount) {
          // 기존 타이머가 있으면 취소
          if (animationTimeouts.current[priority]) {
            clearTimeout(animationTimeouts.current[priority]);
          }

          // 애니메이션 시작
          setAnimatingPriorities((prev) => new Set([...prev, priority]));

          // 개별 타이머로 애니메이션 종료 (400ms로 단축)
          animationTimeouts.current[priority] = setTimeout(() => {
            setAnimatingPriorities((prev) => {
              const newSet = new Set(prev);
              newSet.delete(priority);
              return newSet;
            });
            delete animationTimeouts.current[priority];
          }, 400);
        }
      });

      // 현재 카운트를 이전 카운트로 업데이트
      prevCountsRef.current = { ...priorityCounts };
    }, [priorityCounts]);

    // 컴포넌트 언마운트시 모든 타이머 정리
    useEffect(() => {
      return () => {
        Object.values(animationTimeouts.current).forEach((timeout) => {
          clearTimeout(timeout);
        });
      };
    }, []);

    // 색상 계산 함수 - 우선순위에 따라 일관된 색상 생성 (고대비 버전)
    const getPriorityColor = (priority: number) => {
      // 우선순위를 0-100 범위에서 0-1 사이로 정규화
      const normalized = priority / 100;

      if (normalized >= 0.9) return { bg: '#b91c1c', text: '#ffffff' }; // red-700 (더 진한 빨강)
      if (normalized >= 0.8) return { bg: '#c2410c', text: '#ffffff' }; // orange-700
      if (normalized >= 0.7) return { bg: '#a16207', text: '#ffffff' }; // amber-700
      if (normalized >= 0.6) return { bg: '#047857', text: '#ffffff' }; // emerald-700
      if (normalized >= 0.5) return { bg: '#0f766e', text: '#ffffff' }; // teal-700
      if (normalized >= 0.4) return { bg: '#0e7490', text: '#ffffff' }; // cyan-700
      if (normalized >= 0.3) return { bg: '#1d4ed8', text: '#ffffff' }; // blue-700
      if (normalized >= 0.2) return { bg: '#6d28d9', text: '#ffffff' }; // violet-700
      return { bg: '#7c3aed', text: '#ffffff' }; // purple-600
    };

    return (
      <div className={`priority-grid ${className}`}>
        <div
          className="gap-2 p-3 bg-gray-50 rounded-lg overflow-hidden max-w-full"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(36px, 1fr))',
            maxWidth: '100%',
          }}
        >
          {sortedConfigs.map((config) => {
            const count = priorityCounts[config.priority] || 0;
            const hasExecuted = count > 0;
            const colors = getPriorityColor(config.priority);
            const isAnimating = animatingPriorities.has(config.priority);

            return (
              <div
                key={config.id}
                className={`
                relative flex flex-col items-center justify-center
                rounded shadow-sm border text-center cursor-default
                transition-all duration-300 hover:scale-105
                ${hasExecuted ? 'border-indigo-400 shadow-md' : 'border-gray-300'}
                ${isAnimating ? styles['animate-priority-update'] : ''}
              `}
                style={{
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  minHeight: '36px',
                  backgroundColor: hasExecuted ? colors.bg : '#f3f4f6',
                  color: hasExecuted ? colors.text : '#6b7280',
                  transform: isAnimating ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: isAnimating
                    ? `0 0 15px ${colors.bg}80, 0 4px 10px rgba(0,0,0,0.2)`
                    : hasExecuted
                      ? '0 2px 4px rgba(0,0,0,0.1)'
                      : '0 1px 2px rgba(0,0,0,0.05)',
                  zIndex: isAnimating ? 10 : 1,
                }}
                title={`${config.label} - ${count}회 실행`}
              >
                {/* 우선순위 번호 */}
                <div
                  className="font-black leading-tight mb-0.5"
                  style={{
                    fontSize: '9px',
                    textShadow: hasExecuted
                      ? '0 1px 3px rgba(0,0,0,0.5)'
                      : 'none',
                    fontWeight: '900',
                  }}
                >
                  P{config.priority}
                </div>

                {/* 실행 횟수 - 더 강조 */}
                <div
                  className="leading-none font-mono"
                  style={{
                    fontSize: '12px',
                    fontWeight: '900',
                    textShadow: hasExecuted
                      ? '0 1px 3px rgba(0,0,0,0.5)'
                      : 'none',
                    letterSpacing: '-0.5px',
                  }}
                >
                  {count > 0 ? (count > 9 ? '9+' : count) : '-'}
                </div>

                {/* 점프 표시 */}
                {config.jumpToPriority && (
                  <div
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full border border-white shadow-sm"
                    title={`P${config.jumpToPriority}로 점프`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-between text-xs text-gray-600 mt-2 px-1">
          <span className="font-medium">우선순위 (높음 → 낮음)</span>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-amber-400 rounded-full border border-white shadow-sm" />
              <span>점프</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-indigo-400 rounded border border-indigo-400" />
              <span>실행됨</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

/**
 * 간단한 우선순위 리스트 (텍스트 버전)
 */
interface PriorityListProps {
  configs: HandlerConfig[];
  showCounts?: boolean;
  className?: string;
}

export const PriorityList = memo<PriorityListProps>(
  ({ configs, showCounts = true, className = '' }) => {
    const priorityCountsStore = usePriorityTestStore('priorityCounts');
    const priorityCounts = useStoreValue(priorityCountsStore);

    const sortedConfigs = useMemo(() => {
      return [...configs].sort((a, b) => b.priority - a.priority);
    }, [configs]);

    // 색상 계산 함수 (PriorityGrid와 동일한 고대비 버전)
    const getPriorityColor = (priority: number) => {
      const normalized = priority / 100;

      if (normalized >= 0.9) return '#b91c1c'; // red-700
      if (normalized >= 0.8) return '#c2410c'; // orange-700
      if (normalized >= 0.7) return '#a16207'; // amber-700
      if (normalized >= 0.6) return '#047857'; // emerald-700
      if (normalized >= 0.5) return '#0f766e'; // teal-700
      if (normalized >= 0.4) return '#0e7490'; // cyan-700
      if (normalized >= 0.3) return '#1d4ed8'; // blue-700
      if (normalized >= 0.2) return '#6d28d9'; // violet-700
      return '#7c3aed'; // purple-600
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
                    <span className="font-medium text-gray-900">
                      {config.label}
                    </span>
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
                    <div
                      className="text-xl font-mono font-black text-gray-900"
                      style={{ fontWeight: '900' }}
                    >
                      {count}
                    </div>
                    <div className="text-xs text-gray-500 font-medium">
                      실행
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
