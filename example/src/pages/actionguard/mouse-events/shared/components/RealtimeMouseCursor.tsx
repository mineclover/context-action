/**
 * @fileoverview Realtime Mouse Cursor Component
 * 
 * lerp 기반 실시간 마우스 커서 (GSAP 애니메이션 최소화)
 */

import { memo, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface MousePosition {
  x: number;
  y: number;
}

interface RealtimeMouseCursorProps {
  position: MousePosition;
  velocity: number;
  isVisible: boolean;
  isMoving: boolean;
}

const RealtimeMouseCursorComponent = ({ 
  position, 
  velocity, 
  isVisible, 
  isMoving 
}: RealtimeMouseCursorProps) => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const lastUpdateRef = useRef({ velocity: 0, isMoving: false });

  // 위치는 CSS transform으로 직접 업데이트 (GSAP 없음)
  useEffect(() => {
    if (!cursorRef.current || !trailRef.current || !isVisible) return;

    const cursor = cursorRef.current;
    const trail = trailRef.current;

    // 영역 밖이면 렌더링하지 않음
    if (!isVisible) return;

    // 유효하지 않은 위치 필터링 (초기값 -999 체크)
    if (position.x === -999 || position.y === -999) {
      return; // 초기값일 때는 렌더링하지 않음
    }

    // 0,0으로 가는 문제 디버깅 - 확장된 조건
    if (position.x === 0 && position.y === 0) {
      console.warn('🔴 Detected original 0,0 position in RealtimeMouseCursor:', position);
      console.trace('Original 0,0 Position update trace');
      return;
    }
    if (position.x === 8 && position.y === 8) {
      console.warn('🔴 Detected 0,0 position after offset (8,8) in RealtimeMouseCursor:', position);
      console.trace('Offset 0,0 Position update trace');
      return;
    }

    // 직접 CSS 변경으로 최고 성능
    requestAnimationFrame(() => {
      console.log('📱 RealtimeMouseCursor position update:', position, `→ translate3d(${position.x - 8}px, ${position.y - 8}px, 0)`);
      cursor.style.transform = `translate3d(${position.x - 8}px, ${position.y - 8}px, 0)`;
      trail.style.transform = `translate3d(${position.x - 12}px, ${position.y - 12}px, 0)`;
    });

  }, [position, isVisible, isMoving]);

  // 스케일과 상태 변경만 GSAP 사용
  useEffect(() => {
    if (!cursorRef.current || !isVisible) return;

    const cursor = cursorRef.current;
    const lastUpdate = lastUpdateRef.current;

    // 속도 변화가 있을 때만 애니메이션
    if (Math.abs(velocity - lastUpdate.velocity) > 0.5) {
      const scale = Math.min(1 + velocity / 20, 1.4);
      gsap.to(cursor, {
        scale: scale,
        duration: 0.1,
        ease: "none",
        force3D: true,
        overwrite: 'auto'
      });
      lastUpdate.velocity = velocity;
    }

    // 이동 상태 변화가 있을 때만 애니메이션
    if (isMoving !== lastUpdate.isMoving) {
      if (isMoving) {
        gsap.to(cursor, {
          boxShadow: '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)',
          duration: 0.2,
          ease: "power1.out",
          overwrite: 'auto'
        });
      } else {
        gsap.to(cursor, {
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
          scale: 1,
          duration: 0.3,
          ease: "power1.out",
          overwrite: 'auto'
        });
      }
      lastUpdate.isMoving = isMoving;
    }
  }, [velocity, isMoving, isVisible]);

  // 가시성 변경
  useEffect(() => {
    if (!cursorRef.current || !trailRef.current) return;

    const cursor = cursorRef.current;
    const trail = trailRef.current;

    if (isVisible) {
      gsap.fromTo([cursor, trail], 
        { opacity: 0, scale: 0 },
        { 
          opacity: 1, 
          scale: 1, 
          duration: 0.2, 
          ease: "power2.out",
          stagger: 0.05,
          force3D: true
        }
      );
    } else {
      gsap.to([cursor, trail], {
        opacity: 0,
        scale: 0,
        duration: 0.15,
        ease: "power2.inOut",
        force3D: true
      });
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* 트레일 */}
      <div
        ref={trailRef}
        className="absolute w-6 h-6 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 50%, transparent 100%)',
          zIndex: 1,
          willChange: 'transform',
          backfaceVisibility: 'hidden'
        }}
      />
      
      {/* 메인 커서 */}
      <div
        ref={cursorRef}
        className="absolute w-4 h-4 rounded-full pointer-events-none border-2 border-white"
        style={{
          background: 'radial-gradient(circle, #ef4444 0%, #dc2626 70%, #b91c1c 100%)',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)',
          zIndex: 2,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)' // 하드웨어 가속
        }}
      >
        {/* 중심점 */}
        <div className="absolute inset-1 bg-white rounded-full opacity-80" />
        
        {/* 펄스 링 (조건부 애니메이션) */}
        {isMoving && (
          <div 
            className="absolute inset-0 rounded-full border border-red-300"
            style={{
              animation: 'pulse 1s infinite',
              transform: 'scale(1.5)',
              opacity: 0.6
            }}
          />
        )}
      </div>
    </>
  );
};

export const RealtimeMouseCursor = memo(RealtimeMouseCursorComponent, (prevProps, nextProps) => {
  return (
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y &&
    Math.abs(prevProps.velocity - nextProps.velocity) < 0.5 &&
    prevProps.isVisible === nextProps.isVisible &&
    prevProps.isMoving === nextProps.isMoving
  );
});