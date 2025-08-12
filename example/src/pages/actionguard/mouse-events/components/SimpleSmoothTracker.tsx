/**
 * @fileoverview Simple Smooth Mouse Tracker
 * 
 * React 합성 이벤트와 호환되는 단순하고 효과적인 마우스 추적
 */

import { useCallback, useRef, useState } from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface SimpleSmoothTrackerProps {
  onMouseMove: (position: MousePosition, velocity: number) => void;
  onMouseClick: (position: MousePosition, button: number) => void;
  onMouseEnter: (position: MousePosition) => void;
  onMouseLeave: (position: MousePosition) => void;
  children: React.ReactNode;
}

export const SimpleSmoothTracker = ({
  onMouseMove,
  onMouseClick,
  onMouseEnter,
  onMouseLeave,
  children
}: SimpleSmoothTrackerProps) => {
  const [isInside, setIsInside] = useState(false);
  const lastPositionRef = useRef<MousePosition | null>(null);
  const lastTimeRef = useRef<number>(0);

  // 마우스 위치 계산
  const getPosition = useCallback((e: React.MouseEvent<HTMLDivElement>): MousePosition => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top)
    };
  }, []);

  // 속도 계산
  const calculateVelocity = useCallback((current: MousePosition, previous: MousePosition | null, deltaTime: number): number => {
    if (deltaTime === 0 || !previous) return 0;
    const deltaX = current.x - previous.x;
    const deltaY = current.y - previous.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    return distance / deltaTime;
  }, []);

  // 마우스 이동 핸들러
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const position = getPosition(e);
    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    
    // 0,0 위치 필터링
    if (position.x === 0 && position.y === 0) return;
    
    const velocity = calculateVelocity(position, lastPositionRef.current, deltaTime);
    
    // 콜백 호출
    onMouseMove(position, velocity);
    
    // 이전 값 업데이트
    lastPositionRef.current = position;
    lastTimeRef.current = now;
  }, [getPosition, calculateVelocity, onMouseMove]);

  // 마우스 클릭 핸들러
  const handleMouseClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const position = getPosition(e);
    onMouseClick(position, e.button);
  }, [getPosition, onMouseClick]);

  // 마우스 진입 핸들러
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsInside(true);
    const position = getPosition(e);
    lastPositionRef.current = position;
    lastTimeRef.current = performance.now();
    onMouseEnter(position);
  }, [getPosition, onMouseEnter]);

  // 마우스 이탈 핸들러
  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setIsInside(false);
    const position = getPosition(e);
    onMouseLeave(position);
  }, [getPosition, onMouseLeave]);

  return (
    <div 
      className="relative w-full h-full"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        contain: 'layout style paint',
        willChange: 'auto'
      }}
    >
      {children}
    </div>
  );
};