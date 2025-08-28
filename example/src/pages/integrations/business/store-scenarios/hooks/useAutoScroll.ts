import { useCallback, useRef, useState, useEffect } from 'react';

// RefHandler 타입 정의 (createRefContext에서 반환되는 타입)
interface RefHandler<T extends HTMLElement> {
  setRef: (target: T | null) => void;
  target: T | null;
  waitForMount: () => Promise<T>;
  withTarget: <Result>(
    operation: (target: T) => Result | Promise<Result>,
    options?: any
  ) => Promise<any>;
  isMounted: boolean;
}

interface AutoScrollDependency {
  length?: number;
  [key: string]: any;
}

/**
 * 자동 스크롤 관리 훅 - 최적화된 버전
 * 무한 리렌더링을 방지하면서 자동 스크롤 기능 제공
 */
export function useAutoScroll<T extends HTMLElement>(
  containerRef: RefHandler<T>,
  dependency: AutoScrollDependency | any[] // 스크롤을 트리거할 의존성
) {
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  // Ref를 사용하여 state를 추적 (리렌더링 방지)
  const stateRef = useRef({
    isUserScrolling: false,
    shouldAutoScroll: true,
    lastScrollTop: 0,
    lastDependencyLength: 0
  });
  
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // 컨테이너가 바닥에 있는지 확인 - 의존성 없음
  const isAtBottom = useCallback(async (): Promise<boolean> => {
    try {
      const container = await containerRef.waitForMount();
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 50; // 50px 이내면 바닥으로 간주
      return scrollTop + clientHeight >= scrollHeight - threshold;
    } catch {
      return false;
    }
  }, [containerRef]);

  // 스크롤 이벤트 핸들러 - 의존성 최소화
  const handleScroll = useCallback(async () => {
    try {
      const container = await containerRef.waitForMount();
      const currentScrollTop = container.scrollTop;
      
      // 사용자가 위로 스크롤했는지 감지
      if (currentScrollTop < stateRef.current.lastScrollTop) {
        stateRef.current.isUserScrolling = true;
        stateRef.current.shouldAutoScroll = false;
        setIsUserScrolling(true);
        setShouldAutoScroll(false);
      }
      
      // 바닥에 도달했으면 자동 스크롤 재활성화
      const atBottom = await isAtBottom();
      if (atBottom) {
        stateRef.current.shouldAutoScroll = true;
        stateRef.current.isUserScrolling = false;
        setShouldAutoScroll(true);
        setIsUserScrolling(false);
      }
      
      stateRef.current.lastScrollTop = currentScrollTop;
      
      // 스크롤 상태 초기화 타이머
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        stateRef.current.isUserScrolling = false;
        setIsUserScrolling(false);
      }, 1000);
      
    } catch (error) {
      console.warn('스크롤 핸들러 에러:', error);
    }
  }, [containerRef, isAtBottom]);

  // 자동 스크롤 실행 - ref 사용으로 의존성 제거
  const scrollToBottom = useCallback(async (force: boolean = false) => {
    if (!force && (stateRef.current.isUserScrolling || !stateRef.current.shouldAutoScroll)) {
      return;
    }

    try {
      const container = await containerRef.waitForMount();
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    } catch (error) {
      console.warn('자동 스크롤 실패:', error);
    }
  }, [containerRef]);

  // 의존성 변경 시 자동 스크롤 (새 메시지 등)
  useEffect(() => {
    const currentLength = Array.isArray(dependency) ? dependency.length : 1;
    
    // 의존성이 증가했을 때만 자동 스크롤 (새 항목 추가)
    if (currentLength > stateRef.current.lastDependencyLength && stateRef.current.lastDependencyLength > 0) {
      // 잠시 후 실행하여 DOM 업데이트 완료 대기
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 50);
      
      stateRef.current.lastDependencyLength = currentLength;
      return () => clearTimeout(timer);
    }
    
    stateRef.current.lastDependencyLength = currentLength;
    return; // 명시적으로 undefined 반환
  }, [dependency, scrollToBottom]);

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupScrollListener = async () => {
      try {
        const container = await containerRef.waitForMount();
        container.addEventListener('scroll', handleScroll, { passive: true });
        
        cleanup = () => {
          container.removeEventListener('scroll', handleScroll);
        };
      } catch (error) {
        console.warn('스크롤 리스너 설정 실패:', error);
      }
    };

    setupScrollListener();

    return () => {
      cleanup?.();
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [containerRef, handleScroll]);

  return {
    isUserScrolling,
    shouldAutoScroll,
    scrollToBottom,
    isAtBottom,
    // 수동 제어 함수들
    enableAutoScroll: () => {
      stateRef.current.shouldAutoScroll = true;
      setShouldAutoScroll(true);
    },
    disableAutoScroll: () => {
      stateRef.current.shouldAutoScroll = false;
      setShouldAutoScroll(false);
    },
    forceScrollToBottom: () => scrollToBottom(true)
  };
}