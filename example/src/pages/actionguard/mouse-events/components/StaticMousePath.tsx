/**
 * @fileoverview Static Mouse Path Component
 * 
 * 상태 기반으로 동작하는 마우스 경로 표시 (실시간 애니메이션 없음)
 */

import { memo, useMemo } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface StaticMousePathProps {
  movePath: MousePosition[];
  isVisible: boolean;
}

const StaticMousePathComponent = ({ movePath, isVisible }: StaticMousePathProps) => {
  // Path 데이터 메모화
  const pathData = useMemo(() => {
    if (movePath.length < 2) return '';
    const visiblePath = movePath.slice(0, 10); // 최근 10개 점만 표시
    return `M ${visiblePath.map(point => `${point.x} ${point.y}`).join(' L ')}`;
  }, [movePath]);

  // Points 데이터 메모화
  const points = useMemo(() => {
    return movePath.slice(0, 10).map((point, index) => ({
      ...point,
      id: `${point.x}-${point.y}-${index}`,
      radius: Math.max(2, 4 - index * 0.2),
      opacity: Math.max(0.3, 1 - index * 0.08)
    }));
  }, [movePath]);

  if (!isVisible || movePath.length < 2) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ 
        zIndex: 1,
        willChange: 'auto'
      }}
    >
      {/* Path */}
      <path
        d={pathData}
        stroke="url(#pathGradient)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
          opacity: 0.8
        }}
      />
      
      {/* Points */}
      <g>
        {points.map((point) => (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={point.radius}
            fill={`rgba(59, 130, 246, ${point.opacity})`}
            style={{
              filter: 'drop-shadow(0 1px 2px rgba(59, 130, 246, 0.4))'
            }}
          />
        ))}
      </g>
      
      {/* Gradient definition */}
      <defs>
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
          <stop offset="50%" stopColor="rgba(147, 51, 234, 0.6)" />
          <stop offset="100%" stopColor="rgba(236, 72, 153, 0.4)" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export const StaticMousePath = memo(StaticMousePathComponent, (prevProps, nextProps) => {
  return (
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.movePath.length === nextProps.movePath.length &&
    (prevProps.movePath.length === 0 || 
     prevProps.movePath[0]?.x === nextProps.movePath[0]?.x &&
     prevProps.movePath[0]?.y === nextProps.movePath[0]?.y)
  );
});