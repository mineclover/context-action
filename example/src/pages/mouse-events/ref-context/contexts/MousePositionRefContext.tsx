/**
 * @fileoverview Mouse Position RefContext
 * 
 * createRefContext를 활용한 마우스 위치 관리
 * 관심사 분리: 위치 추적 및 커서 렌더링만 담당
 */

import { useCallback, useRef } from 'react';
import { createRefContext } from '@context-action/react';
import {
  MousePosition,
  MousePositionConfig,
} from '../types/MouseRefTypes';

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: MousePositionConfig = {
  cursorSize: 16,
  trailSize: 24,
  updateThrottle: 16, // ~60fps
  useHardwareAcceleration: true,
};

// ============================================================================
// RefContext Creation
// ============================================================================

type MousePositionRefs = {
  cursor: HTMLDivElement;
  trail: HTMLDivElement;
  positionDisplay: HTMLSpanElement;
};

const {
  Provider: MousePositionProvider,
  useRefHandler: useMousePositionRef,
} = createRefContext<MousePositionRefs>('MousePosition');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 두 위치 간의 거리 계산
 */
const calculateDistance = (pos1: MousePosition, pos2: MousePosition): number => {
  const dx = pos2.x - pos1.x;
  const dy = pos2.y - pos1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * 속도 계산 (px/ms)
 */
const calculateVelocity = (
  currentPos: MousePosition,
  prevPos: MousePosition,
  timeDelta: number
): number => {
  if (timeDelta <= 0) return 0;
  const distance = calculateDistance(prevPos, currentPos);
  return distance / timeDelta;
};

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * 마우스 위치 업데이터 훅
 */
export function useMousePositionUpdater() {
  const cursor = useMousePositionRef('cursor');
  const trail = useMousePositionRef('trail');
  const positionDisplay = useMousePositionRef('positionDisplay');
  
  const throttleRef = useRef<number>(0);
  const currentPositionRef = useRef<MousePosition>({ x: 0, y: 0 });
  const previousPositionRef = useRef<MousePosition>({ x: 0, y: 0 });
  const lastUpdateTimeRef = useRef<number>(0);
  const configRef = useRef<MousePositionConfig>(defaultConfig);

  const updatePosition = useCallback((position: MousePosition, timestamp: number) => {
    // 쓰로틀링 검사
    if (timestamp - throttleRef.current < configRef.current.updateThrottle) {
      return;
    }
    throttleRef.current = timestamp;

    // 속도 계산
    const timeDelta = timestamp - lastUpdateTimeRef.current;
    const velocity = calculateVelocity(position, currentPositionRef.current, timeDelta);

    // DOM 직접 업데이트 (React 리렌더링 우회)
    if (configRef.current.useHardwareAcceleration) {
      // 하드웨어 가속 사용
      if (cursor.target) {
        cursor.target.style.transform = `translate3d(${position.x - configRef.current.cursorSize / 2}px, ${position.y - configRef.current.cursorSize / 2}px, 0)`;
      }
      if (trail.target) {
        // 트레일은 약간의 지연으로 부드러운 효과
        trail.target.style.transform = `translate3d(${position.x - configRef.current.trailSize / 2}px, ${position.y - configRef.current.trailSize / 2}px, 0)`;
        trail.target.style.opacity = Math.min(velocity / 5, 1).toString(); // 속도에 따른 투명도
      }
    } else {
      // 일반 CSS 위치 설정
      if (cursor.target) {
        cursor.target.style.left = `${position.x - configRef.current.cursorSize / 2}px`;
        cursor.target.style.top = `${position.y - configRef.current.cursorSize / 2}px`;
      }
      if (trail.target) {
        trail.target.style.left = `${position.x - configRef.current.trailSize / 2}px`;
        trail.target.style.top = `${position.y - configRef.current.trailSize / 2}px`;
        trail.target.style.opacity = Math.min(velocity / 5, 1).toString();
      }
    }

    // 위치 표시 업데이트
    if (positionDisplay.target) {
      positionDisplay.target.textContent = `(${Math.round(position.x)}, ${Math.round(position.y)})`;
    }

    // 상태 업데이트 (다음 계산을 위해)
    previousPositionRef.current = currentPositionRef.current;
    currentPositionRef.current = position;
    lastUpdateTimeRef.current = timestamp;

  }, [cursor, trail, positionDisplay]);

  const resetPosition = useCallback(() => {
    // 커서와 트레일 숨김
    if (cursor.target) {
      cursor.target.style.transform = 'translate3d(-999px, -999px, 0)';
      cursor.target.style.opacity = '0';
    }
    if (trail.target) {
      trail.target.style.transform = 'translate3d(-999px, -999px, 0)';  
      trail.target.style.opacity = '0';
    }
    if (positionDisplay.target) {
      positionDisplay.target.textContent = '(--, --)';
    }

    // 상태 초기화
    currentPositionRef.current = { x: 0, y: 0 };
    previousPositionRef.current = { x: 0, y: 0 };
    lastUpdateTimeRef.current = 0;
  }, [cursor, trail, positionDisplay]);

  const showCursor = useCallback((show: boolean) => {
    const opacity = show ? '1' : '0';
    
    if (cursor.target) {
      cursor.target.style.opacity = opacity;
    }
    if (trail.target) {
      trail.target.style.opacity = show ? (trail.target.style.opacity || '1') : '0';
    }
  }, [cursor, trail]);

  const updateConfig = useCallback((newConfig: Partial<MousePositionConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
  }, []);

  return {
    updatePosition,
    resetPosition, 
    showCursor,
    updateConfig,
    getCurrentPosition: () => currentPositionRef.current,
    getVelocity: () => {
      const timeDelta = Date.now() - lastUpdateTimeRef.current;
      return calculateVelocity(currentPositionRef.current, previousPositionRef.current, timeDelta);
    },
  };
}

// ============================================================================
// Components
// ============================================================================

/**
 * 마우스 커서 컴포넌트
 */
export function MouseCursor() {
  const cursor = useMousePositionRef('cursor');

  return (
    <div
      ref={cursor.setRef}
      className="bg-red-500 rounded-full shadow-lg"
      style={{
        position: 'absolute',
        width: defaultConfig.cursorSize,
        height: defaultConfig.cursorSize,
        opacity: 0,
        transform: 'translate3d(-999px, -999px, 0)',
        pointerEvents: 'none',
        zIndex: 1000,
        transition: 'opacity 0.2s ease',
        willChange: 'transform',
      }}
    />
  );
}

/**
 * 마우스 트레일 컴포넌트
 */
export function MouseTrail() {
  const trail = useMousePositionRef('trail');

  return (
    <div
      ref={trail.setRef}
      className="bg-blue-400 rounded-full"
      style={{
        position: 'absolute',
        width: defaultConfig.trailSize,
        height: defaultConfig.trailSize,
        opacity: 0,
        transform: 'translate3d(-999px, -999px, 0)',
        filter: 'blur(1px)',
        pointerEvents: 'none',
        zIndex: 999,
        transition: 'opacity 0.3s ease',
        willChange: 'transform',
      }}
    />
  );
}

/**
 * 위치 표시 컴포넌트
 */
export function PositionDisplay() {
  const positionDisplay = useMousePositionRef('positionDisplay');

  return (
    <div className="font-mono text-sm text-gray-600">
      Position: <span ref={positionDisplay.setRef}>(--, --)</span>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { MousePositionProvider, useMousePositionRef };