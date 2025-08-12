/**
 * @fileoverview Animated Click Indicators Component with GSAP
 * 
 * GSAP을 사용한 부드러운 클릭 애니메이션 컴포넌트
 */

import { memo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface ClickHistory {
  x: number;
  y: number;
  timestamp: number;
}

interface AnimatedClickIndicatorsProps {
  clickHistory: ClickHistory[];
}

const AnimatedClickIndicatorsComponent = ({ clickHistory }: AnimatedClickIndicatorsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousClickCountRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentClickCount = clickHistory.length;

    // 새로운 클릭이 추가된 경우에만 애니메이션 실행
    if (currentClickCount > previousClickCountRef.current) {
      const newClickElements = container.children;
      const newClickElement = newClickElements[0] as HTMLElement; // 최신 클릭 (첫 번째 요소)

      if (newClickElement) {
        // 하드웨어 가속 최적화
        gsap.set(newClickElement, {
          scale: 0,
          opacity: 0,
          rotation: 0,
          force3D: true,
          willChange: 'transform, opacity',
          transformOrigin: 'center center'
        });

        // 블링크 방지를 위한 지연 실행
        requestAnimationFrame(() => {
          // 애니메이션 실행
          const tl = gsap.timeline();
          
          tl.to(newClickElement, {
            scale: 1.1,
            opacity: 1,
            duration: 0.15,
            ease: "back.out(1.5)",
            force3D: true
          })
          .to(newClickElement, {
            scale: 1,
            rotation: 180, // 회전 감소로 블링크 방지
            duration: 0.2,
            ease: "power1.out",
            force3D: true
          })
          .to(newClickElement, {
            scale: 0.9,
            opacity: 0.8,
            duration: 0.15,
            ease: "power1.inOut",
            force3D: true
          });
        });

        // 기존 클릭들 페이드 아웃
        if (newClickElements.length > 1) {
          gsap.to(Array.from(newClickElements).slice(1), {
            opacity: (index) => Math.max(0.3, 1 - (index + 1) * 0.12),
            scale: (index) => Math.max(0.6, 1 - (index + 1) * 0.08),
            duration: 0.2,
            ease: "power1.out",
            force3D: true
          });
        }
      }
    }

    previousClickCountRef.current = currentClickCount;
  }, [clickHistory]);

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      {clickHistory.slice(0, 5).map((click, index) => (
        <div
          key={click.timestamp}
          className="absolute"
          style={{
            left: click.x - 15,
            top: click.y - 15,
            width: 30,
            height: 30,
          }}
        >
          {/* 메인 클릭 인디케이터 */}
          <div className="relative w-full h-full">
            {/* 외부 링 */}
            <div 
              className="absolute inset-0 rounded-full border-2 border-yellow-400"
              style={{
                background: `radial-gradient(circle, rgba(250, 204, 21, ${Math.max(0.3, 1 - index * 0.15)}) 0%, transparent 70%)`,
                boxShadow: `0 0 10px rgba(250, 204, 21, ${Math.max(0.2, 0.8 - index * 0.15)})`,
                willChange: 'transform, opacity',
                backfaceVisibility: 'hidden'
              }}
            />
            
            {/* 내부 원 */}
            <div 
              className="absolute inset-2 bg-yellow-400 rounded-full flex items-center justify-center"
              style={{
                opacity: Math.max(0.4, 1 - index * 0.15),
                boxShadow: `0 2px 8px rgba(0, 0, 0, 0.2)`
              }}
            >
              <span className="text-xs font-bold text-yellow-900">
                {index + 1}
              </span>
            </div>

            {/* 파티클 효과 */}
            {index === 0 && (
              <>
                {[...Array(6)].map((_, particleIndex) => (
                  <div
                    key={particleIndex}
                    className="absolute w-1 h-1 bg-yellow-300 rounded-full"
                    style={{
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${particleIndex * 60}deg) translateY(-20px)`,
                      opacity: 0.8
                    }}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export const AnimatedClickIndicators = memo(AnimatedClickIndicatorsComponent, (prevProps, nextProps) => {
  return (
    prevProps.clickHistory.length === nextProps.clickHistory.length &&
    (prevProps.clickHistory.length === 0 || 
     prevProps.clickHistory[0]?.timestamp === nextProps.clickHistory[0]?.timestamp)
  );
});