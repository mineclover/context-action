/**
 * @fileoverview Visual Effects RefContext
 * 
 * createRefContext를 활용한 시각 효과 관리
 * 관심사 분리: 클릭 이펙트 및 마우스 경로 렌더링만 담당
 */

import React, { useCallback, useRef } from 'react';
import { createRefContext } from '@context-action/react';
import {
  MousePosition,
  MouseClick,
  VisualEffectsConfig,
} from '../types/MouseRefTypes';

// ============================================================================
// Default Configuration
// ============================================================================

const defaultConfig: VisualEffectsConfig = {
  clickEffectDuration: 800,
  showPath: true,
  maxPathPoints: 50,
  pathColor: '#3b82f6',
  clickEffectColor: '#ef4444',
};

// ============================================================================
// RefContext Creation
// ============================================================================

type VisualEffectsRefs = {
  clickEffectsContainer: HTMLDivElement;
  pathSvg: SVGSVGElement;
  pathElement: SVGPathElement;
};

const {
  Provider: VisualEffectsProvider,
  useRefHandler: useVisualEffectsRef,
} = createRefContext<VisualEffectsRefs>('VisualEffects');

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * SVG 경로 문자열 생성
 */
const generatePathString = (points: MousePosition[]): string => {
  if (points.length < 2) return '';

  const [firstPoint, ...restPoints] = points;
  let pathString = `M ${firstPoint.x},${firstPoint.y}`;

  // 부드러운 곡선을 위해 quadratic curve 사용
  for (let i = 0; i < restPoints.length; i++) {
    const current = restPoints[i];
    if (i === restPoints.length - 1) {
      // 마지막 점은 직선으로
      pathString += ` L ${current.x},${current.y}`;
    } else {
      // 중간 점들은 부드러운 곡선으로
      const next = restPoints[i + 1];
      const cpx = (current.x + next.x) / 2;
      const cpy = (current.y + next.y) / 2;
      pathString += ` Q ${current.x},${current.y} ${cpx},${cpy}`;
    }
  }

  return pathString;
};

/**
 * 클릭 이펙트 요소 생성
 */
const createClickEffect = (click: MouseClick, config: VisualEffectsConfig): HTMLDivElement => {
  const effect = document.createElement('div');
  effect.className = 'absolute pointer-events-none';
  effect.style.cssText = `
    left: ${click.x - 15}px;
    top: ${click.y - 15}px;
    width: 30px;
    height: 30px;
    border: 2px solid ${config.clickEffectColor};
    border-radius: 50%;
    transform: scale(0);
    opacity: 1;
    z-index: 998;
    transition: all ${config.clickEffectDuration}ms cubic-bezier(0.23, 1, 0.32, 1);
  `;

  // 애니메이션 시작
  requestAnimationFrame(() => {
    effect.style.transform = 'scale(2)';
    effect.style.opacity = '0';
  });

  return effect;
};

// ============================================================================
// Custom Hooks
// ============================================================================

/**
 * 시각 효과 업데이터 훅
 */
export function useVisualEffectsUpdater() {
  const clickEffectsContainer = useVisualEffectsRef('clickEffectsContainer');
  const pathElement = useVisualEffectsRef('pathElement');
  
  const pathHistoryRef = useRef<MousePosition[]>([]);
  const activeClickEffectsRef = useRef<Set<HTMLDivElement>>(new Set());
  const configRef = useRef<VisualEffectsConfig>(defaultConfig);

  const addPathPoint = useCallback((position: MousePosition) => {
    if (!configRef.current.showPath) return;

    // 경로 히스토리 업데이트
    pathHistoryRef.current = [position, ...pathHistoryRef.current.slice(0, configRef.current.maxPathPoints - 1)];

    // SVG 경로 업데이트
    if (pathElement.target && pathHistoryRef.current.length > 1) {
      const pathString = generatePathString(pathHistoryRef.current);
      pathElement.target.setAttribute('d', pathString);
    }
  }, [pathElement]);

  const addClickEffect = useCallback((click: MouseClick) => {
    if (!clickEffectsContainer.target) return;

    // 클릭 이펙트 생성
    const effect = createClickEffect(click, configRef.current);
    clickEffectsContainer.target.appendChild(effect);
    activeClickEffectsRef.current.add(effect);

    // 애니메이션 완료 후 제거
    setTimeout(() => {
      if (clickEffectsContainer.target && effect.parentNode) {
        clickEffectsContainer.target.removeChild(effect);
        activeClickEffectsRef.current.delete(effect);
      }
    }, configRef.current.clickEffectDuration);

    // 추가 리플 효과 (더 큰 원)
    const ripple = createClickEffect(click, { ...configRef.current, clickEffectColor: `${configRef.current.clickEffectColor}40` });
    ripple.style.width = '60px';
    ripple.style.height = '60px';
    ripple.style.left = `${click.x - 30}px`;
    ripple.style.top = `${click.y - 30}px`;
    ripple.style.borderWidth = '1px';
    
    clickEffectsContainer.target.appendChild(ripple);

    setTimeout(() => {
      if (clickEffectsContainer.target && ripple.parentNode) {
        clickEffectsContainer.target.removeChild(ripple);
      }
    }, configRef.current.clickEffectDuration * 1.2);

  }, [clickEffectsContainer]);

  const clearPath = useCallback(() => {
    pathHistoryRef.current = [];
    if (pathElement.target) {
      pathElement.target.setAttribute('d', '');
    }
  }, [pathElement]);

  const clearClickEffects = useCallback(() => {
    if (!clickEffectsContainer.target) return;

    // 모든 활성 이펙트 제거
    activeClickEffectsRef.current.forEach(effect => {
      if (effect.parentNode) {
        clickEffectsContainer.target!.removeChild(effect);
      }
    });
    activeClickEffectsRef.current.clear();
  }, [clickEffectsContainer]);

  const resetEffects = useCallback(() => {
    clearPath();
    clearClickEffects();
  }, [clearPath, clearClickEffects]);

  const updateConfig = useCallback((newConfig: Partial<VisualEffectsConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig };
  }, []);

  return {
    addPathPoint,
    addClickEffect,
    clearPath,
    clearClickEffects,
    resetEffects,
    updateConfig,
    getPathLength: () => pathHistoryRef.current.length,
    getActiveEffectsCount: () => activeClickEffectsRef.current.size,
  };
}

// ============================================================================
// Components
// ============================================================================

/**
 * 클릭 이펙트 컨테이너 컴포넌트
 */
export function ClickEffectsContainer() {
  const clickEffectsContainer = useVisualEffectsRef('clickEffectsContainer');

  return (
    <div
      ref={clickEffectsContainer.setRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 998 }}
    />
  );
}

/**
 * 마우스 경로 SVG 컴포넌트
 */
export function MousePathSvg({ width = 800, height = 400 }: { width?: number; height?: number }) {
  const pathSvg = useVisualEffectsRef('pathSvg');
  const pathElement = useVisualEffectsRef('pathElement');

  return (
    <svg
      ref={pathSvg.setRef}
      width={width}
      height={height}
      className="absolute inset-0"
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        pointerEvents: 'none',
        zIndex: 997,
      }}
    >
      <defs>
        <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={defaultConfig.pathColor} stopOpacity="0.8" />
          <stop offset="50%" stopColor={defaultConfig.pathColor} stopOpacity="0.5" />
          <stop offset="100%" stopColor={defaultConfig.pathColor} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      
      <path
        ref={pathElement.setRef}
        stroke="url(#pathGradient)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 시각 효과 컨트롤 패널 컴포넌트
 */
export function VisualEffectsControls() {
  const { clearPath, resetEffects, getPathLength, getActiveEffectsCount, updateConfig } = useVisualEffectsUpdater();

  const [showPath, setShowPath] = React.useState(defaultConfig.showPath);
  const pathLength = getPathLength();
  const activeEffects = getActiveEffectsCount();

  const togglePath = useCallback(() => {
    const newShowPath = !showPath;
    setShowPath(newShowPath);
    updateConfig({ showPath: newShowPath });
    if (!newShowPath) {
      clearPath();
    }
  }, [showPath, updateConfig, clearPath]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">🎨 Visual Effects Controls</h3>
      
      <div className="space-y-3">
        {/* 토글 버튼들 */}
        <div className="flex gap-2">
          <button
            onClick={togglePath}
            className={`px-3 py-1 rounded text-sm font-medium ${
              showPath 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {showPath ? '🎨 Path ON' : '🎨 Path OFF'}
          </button>
          
          <button
            onClick={clearPath}
            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm font-medium"
          >
            Clear Path
          </button>
          
          <button
            onClick={resetEffects}
            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium"
          >
            Reset All
          </button>
        </div>

        {/* 상태 정보 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-blue-50 p-2 rounded">
            <span className="text-blue-600 font-medium">Path Points:</span>
            <span className="ml-1 font-mono">{pathLength}</span>
          </div>
          <div className="bg-red-50 p-2 rounded">
            <span className="text-red-600 font-medium">Active Effects:</span>
            <span className="ml-1 font-mono">{activeEffects}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export { VisualEffectsProvider, useVisualEffectsRef };