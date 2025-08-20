/**
 * @fileoverview Isolated Mouse Renderer
 *
 * Canvas 스타일의 완전 격리된 렌더링 시스템
 * React 리렌더링을 완전히 피하고 ref를 통한 직접 DOM 조작
 */

import { gsap } from 'gsap';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

interface MousePosition {
  x: number;
  y: number;
}

interface ClickHistory {
  x: number;
  y: number;
  timestamp: number;
}

interface MouseRendererState {
  position: MousePosition;
  velocity: number;
  isVisible: boolean;
  isMoving: boolean;
  movePath: MousePosition[];
  clickHistory: ClickHistory[];
}

export interface MouseRendererHandle {
  updatePosition: (position: MousePosition, velocity: number) => void;
  updateVisibility: (isVisible: boolean) => void;
  updateMoving: (isMoving: boolean) => void;
  addToPath: (position: MousePosition) => void;
  addClick: (click: ClickHistory) => void;
  reset: () => void;
}

interface IsolatedMouseRendererProps {
  containerWidth: number;
  containerHeight: number;
  children?: React.ReactNode;
}

const IsolatedMouseRendererComponent = forwardRef<
  MouseRendererHandle,
  IsolatedMouseRendererProps
>(({ containerWidth, containerHeight }, ref) => {
  // DOM 참조들
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const clickContainerRef = useRef<HTMLDivElement>(null);

  // 상태 참조 (React 상태가 아님)
  const stateRef = useRef<MouseRendererState>({
    position: { x: -999, y: -999 }, // 초기값을 -999로 설정
    velocity: 0,
    isVisible: false,
    isMoving: false,
    movePath: [],
    clickHistory: [],
  });

  // 클릭 애니메이션 카운터
  const clickCounterRef = useRef(0);

  // 커서 위치 업데이트 (직접 DOM 조작)
  const updateCursorPosition = useCallback((position: MousePosition) => {
    if (!cursorRef.current || !trailRef.current) return;

    // 유효하지 않은 위치 필터링 (초기값 -999 체크)
    if (position.x === -999 || position.y === -999) {
      return;
    }

    // 0,0으로 가는 문제 디버깅 - 확장된 조건
    if (position.x === 0 && position.y === 0) {
      console.warn(
        '🔴 Detected original 0,0 position in IsolatedMouseRenderer:',
        position
      );
      console.trace('Original 0,0 Position update trace');
      return;
    }
    if (position.x === 8 && position.y === 8) {
      console.warn(
        '🔴 Detected 0,0 position after offset (8,8) in IsolatedMouseRenderer:',
        position
      );
      console.trace('Offset 0,0 Position update trace');
      return;
    }

    const cursor = cursorRef.current;
    const trail = trailRef.current;

    // 직접 CSS transform으로 최고 성능
    requestAnimationFrame(() => {
      console.log(
        '🎯 IsolatedMouseRenderer position update:',
        position,
        `→ translate3d(${position.x - 8}px, ${position.y - 8}px, 0)`
      );
      cursor.style.transform = `translate3d(${position.x - 8}px, ${position.y - 8}px, 0)`;
      trail.style.transform = `translate3d(${position.x - 12}px, ${position.y - 12}px, 0)`;
    });
  }, []);

  // 커서 스케일 업데이트 (GSAP으로 부드러운 스케일링만)
  const updateCursorScale = useCallback(
    (velocity: number, isMoving: boolean) => {
      if (!cursorRef.current) return;

      const cursor = cursorRef.current;
      const scale = Math.min(1 + velocity / 20, 1.4);

      gsap.to(cursor, {
        scale: scale,
        duration: 0.1,
        ease: 'none',
        force3D: true,
        overwrite: 'auto',
      });

      // 이동 상태에 따른 그림자 효과
      if (isMoving) {
        gsap.to(cursor, {
          boxShadow:
            '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)',
          duration: 0.2,
          ease: 'power1.out',
        });
      } else {
        gsap.to(cursor, {
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
          scale: 1,
          duration: 0.3,
          ease: 'power1.out',
        });
      }
    },
    []
  );

  // 경로 업데이트 (직접 SVG path 조작)
  const updatePath = useCallback((movePath: MousePosition[]) => {
    if (!pathRef.current) return;

    // 유효하지 않은 위치 필터링 (초기값과 0,0 모두 제외)
    const validPath = movePath.filter(
      (point) =>
        (point.x !== 0 || point.y !== 0) && point.x !== -999 && point.y !== -999
    );

    if (validPath.length < 2) {
      pathRef.current.setAttribute('d', '');
      return;
    }

    const visiblePath = validPath.slice(0, 10);
    const pathData = `M ${visiblePath.map((point) => `${point.x} ${point.y}`).join(' L ')}`;
    pathRef.current.setAttribute('d', pathData);
  }, []);

  // 클릭 애니메이션 추가 (직접 DOM 생성 및 애니메이션)
  const addClickAnimation = useCallback((click: ClickHistory) => {
    if (!clickContainerRef.current) return;
    // 유효하지 않은 위치 필터링 (초기값과 0,0 모두 제외)
    if (
      (click.x === 0 && click.y === 0) ||
      click.x === -999 ||
      click.y === -999
    )
      return;

    const clickId = `click-${clickCounterRef.current++}`;

    // 클릭 요소 생성
    const clickElement = document.createElement('div');
    clickElement.id = clickId;
    clickElement.className = 'absolute pointer-events-none';
    clickElement.style.cssText = `
        left: ${click.x - 15}px;
        top: ${click.y - 15}px;
        width: 30px;
        height: 30px;
      `;

    // 내부 HTML 구조
    clickElement.innerHTML = `
        <div class="relative w-full h-full">
          <div class="absolute inset-0 rounded-full border-2 border-yellow-400"
               style="background: radial-gradient(circle, rgba(250, 204, 21, 0.8) 0%, transparent 70%);
                      box-shadow: 0 0 10px rgba(250, 204, 21, 0.8);
                      will-change: transform, opacity;
                      backface-visibility: hidden;"></div>
          <div class="absolute inset-2 bg-yellow-400 rounded-full flex items-center justify-center"
               style="opacity: 1;
                      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);">
            <span class="text-xs font-bold text-yellow-900">1</span>
          </div>
        </div>
      `;

    clickContainerRef.current.appendChild(clickElement);

    // GSAP 애니메이션
    gsap.set(clickElement, {
      scale: 0,
      opacity: 0,
      force3D: true,
    });

    const tl = gsap.timeline({
      onComplete: () => {
        // 애니메이션 완료 후 제거
        if (clickElement.parentNode) {
          clickElement.parentNode.removeChild(clickElement);
        }
      },
    });

    tl.to(clickElement, {
      scale: 1.1,
      opacity: 1,
      duration: 0.15,
      ease: 'back.out(1.5)',
      force3D: true,
    })
      .to(clickElement, {
        scale: 1,
        rotation: 180,
        duration: 0.2,
        ease: 'power1.out',
      })
      .to(clickElement, {
        scale: 0.9,
        opacity: 0.8,
        duration: 0.15,
        ease: 'power1.inOut',
      })
      .to(clickElement, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      });
  }, []);

  // 가시성 토글
  const toggleVisibility = useCallback((isVisible: boolean) => {
    if (!cursorRef.current || !trailRef.current) return;

    const cursor = cursorRef.current;
    const trail = trailRef.current;

    if (isVisible) {
      gsap.fromTo(
        [cursor, trail],
        { opacity: 0, scale: 0 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.2,
          ease: 'power2.out',
          stagger: 0.05,
          force3D: true,
        }
      );
    } else {
      gsap.to([cursor, trail], {
        opacity: 0,
        scale: 0,
        duration: 0.15,
        ease: 'power2.inOut',
        force3D: true,
      });
    }
  }, []);

  // 외부 API (Handle을 통해 노출)
  useImperativeHandle(ref, () => ({
    updatePosition: (position: MousePosition, velocity: number) => {
      stateRef.current.position = position;
      stateRef.current.velocity = velocity;
      updateCursorPosition(position);
    },

    updateVisibility: (isVisible: boolean) => {
      if (stateRef.current.isVisible !== isVisible) {
        stateRef.current.isVisible = isVisible;
        toggleVisibility(isVisible);
      }
    },

    updateMoving: (isMoving: boolean) => {
      if (stateRef.current.isMoving !== isMoving) {
        stateRef.current.isMoving = isMoving;
        updateCursorScale(stateRef.current.velocity, isMoving);
      }
    },

    addToPath: (position: MousePosition) => {
      stateRef.current.movePath = [
        position,
        ...stateRef.current.movePath.slice(0, 19),
      ];
      updatePath(stateRef.current.movePath);
    },

    addClick: (click: ClickHistory) => {
      stateRef.current.clickHistory = [
        click,
        ...stateRef.current.clickHistory.slice(0, 9),
      ];
      addClickAnimation(click);
    },

    reset: () => {
      stateRef.current = {
        position: { x: -999, y: -999 }, // 초기값으로 리셋
        velocity: 0,
        isVisible: false,
        isMoving: false,
        movePath: [],
        clickHistory: [],
      };

      // DOM 직접 초기화
      if (pathRef.current) {
        pathRef.current.setAttribute('d', '');
      }

      if (clickContainerRef.current) {
        clickContainerRef.current.innerHTML = '';
      }

      toggleVisibility(false);
    },
  }));

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {/* 커서 트레일 */}
      <div
        ref={trailRef}
        className="absolute w-6 h-6 rounded-full pointer-events-none"
        style={{
          background:
            'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 50%, transparent 100%)',
          zIndex: 1,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          opacity: 0,
          transform: 'translateZ(0)',
        }}
      />

      {/* 메인 커서 */}
      <div
        ref={cursorRef}
        className="absolute w-4 h-4 rounded-full pointer-events-none border-2 border-white"
        style={{
          background:
            'radial-gradient(circle, #ef4444 0%, #dc2626 70%, #b91c1c 100%)',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
          zIndex: 2,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          opacity: 0,
        }}
      >
        <div className="absolute inset-1 bg-white rounded-full opacity-80" />
      </div>

      {/* SVG 패스 */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 1,
          willChange: 'auto',
        }}
      >
        <path
          ref={pathRef}
          stroke="url(#pathGradient)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
            opacity: 0.8,
          }}
        />

        <defs>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.8)" />
            <stop offset="50%" stopColor="rgba(147, 51, 234, 0.6)" />
            <stop offset="100%" stopColor="rgba(236, 72, 153, 0.4)" />
          </linearGradient>
        </defs>
      </svg>

      {/* 클릭 애니메이션 컨테이너 */}
      <div
        ref={clickContainerRef}
        className="absolute inset-0 pointer-events-none"
      />
    </div>
  );
});

IsolatedMouseRendererComponent.displayName = 'IsolatedMouseRenderer';

export const IsolatedMouseRenderer = IsolatedMouseRendererComponent;
