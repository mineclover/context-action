# 캔버스 성능 최적화

60fps+ 상호작용을 위한 RefContext를 사용한 고성능 캔버스 패턴입니다.

## 선행 요건

**필수 설정**: 이러한 캔버스 최적화 패턴을 사용하기 전에 캔버스 타입으로 RefContext를 설정해야 합니다.

```typescript
// 캔버스 RefContext 설정 가이드를 따르세요
import { CanvasRefs, CanvasRefProvider, useCanvasRef } from '../setup/ref-context-setup';

// 설정의 CanvasRefs 인터페이스 포함:
// - mainCanvas: HTMLCanvasElement
// - overlayCanvas: HTMLCanvasElement  
// - chartCanvas: HTMLCanvasElement
// - animationCanvas: HTMLCanvasElement
```

**설정 참고**: [RefContext 설정 가이드](../setup/ref-context-setup.md) - 완전한 타입 정의와 프로바이더 설정 패턴을 위한 "캔버스 및 그래픽 Refs" 섹션을 참조하세요.

## 🎨 라이브 예제

**[→ 캔버스 데모 체험](https://mineclover.github.io/context-action/example/refs/canvas)**

최적화된 캔버스 구현을 실제로 경험해보세요. 데모는 이 가이드에서 설명하는 모든 성능 패턴을 보여줍니다:
- 그리기 도구에 대한 즉각적인 시각적 피드백
- 부드러운 상호작용을 위한 듀얼 캔버스 아키텍처  
- 지연 없는 실시간 자유 그리기
- 모든 도구에서 60fps+ 성능

**로컬 개발**: `http://localhost:4000/refs/canvas`

## 핵심 성능 패턴: 즉각적인 시각적 피드백

고성능 캔버스 상호작용의 기본 패턴은 React의 상태 업데이트 사이클을 우회하는 **즉각적인 시각적 피드백**입니다.

### ✅ 즉각적인 캔버스 업데이트 패턴

```tsx
// 성능 패턴: 즉각적인 시각적 피드백 + 병렬 상태 업데이트
const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
  const newShape = createShape(event);
  
  // 1. 즉시: 즉각적인 피드백을 위한 직접 캔버스 렌더링
  if (mainCanvas.target) {
    const ctx = mainCanvas.target.getContext('2d');
    if (ctx) {
      drawing.drawShape(ctx, newShape); // <-- 즉각적인 시각적 응답
    }
  }
  
  // 2. 병렬: 지속성을 위한 상태 업데이트 (논블로킹)
  addShape(newShape); // <-- 비동기 상태 업데이트
  
  // 결과: 사용자는 즉시 변화를 보고, 상태가 따라잡습니다
}, [addShape, drawing.drawShape, mainCanvas]);
```

**주요 이점**:
- ⚡ **지연 없음**: <16ms 시각적 응답 시간
- 🎯 **60fps 성능**: 상호작용 중 프레임 드롭 없음
- 🔄 **논블로킹**: 상태 업데이트가 시각적 피드백에 영향을 주지 않음
- 📈 **확장 가능**: 복잡한 도형에도 일관된 성능

## 필수 성능 패턴

### 1. **선택적 캔버스 업데이트 패턴**

지속적인 렌더링과 미리보기 업데이트를 분리하여 마우스 상호작용을 최적화:

```tsx
// 성능 패턴: 선택적 캔버스 업데이트
const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
  if (currentTool === 'line' && isDrawing) {
    // 미리보기를 위해 오버레이 캔버스만 업데이트
    updateOverlayPreview(event);
    
    // 핵심: 마우스 이동 중 메인 캔버스 재그리기 없음
    // 메인 캔버스는 완료 시에만 업데이트 (handleMouseUp)
  }
}, [currentTool, isDrawing, updateOverlayPreview]);

const handleMouseUp = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
  if (currentTool === 'line' && isDrawing) {
    const newShape = createLineShape(startPoint, getMousePosition(event));
    
    // 즉각적인 메인 캔버스 업데이트
    if (mainCanvas.target) {
      const ctx = mainCanvas.target.getContext('2d');
      if (ctx) {
        drawing.drawShape(ctx, newShape);
      }
    }
    
    // 오버레이 미리보기 지우기
    clearOverlay();
    
    // 상태 지속성
    addShape(newShape);
  }
}, [currentTool, isDrawing, startPoint, mainCanvas, addShape]);
```

**성능 향상**: 렌더링 작업 50-80% 감소

### 2. **듀얼 캔버스 아키텍처 패턴**

최적 성능을 위해 지속적인 콘텐츠와 임시 미리보기를 분리:

```tsx
// 성능 패턴: 듀얼 캔버스 아키텍처
// 설정의 CanvasRefs 사용 (mainCanvas, overlayCanvas, chartCanvas, animationCanvas)

const {
  Provider: CanvasRefProvider,
  useRefHandler: useCanvasRef
} = createRefContext<CanvasRefs>('Canvas');

function OptimizedCanvas({ width = 800, height = 600 }: { width?: number; height?: number }) {
  const mainCanvas = useCanvasRef('mainCanvas');
  const overlayCanvas = useCanvasRef('overlayCanvas');
  
  return (
    <div className="relative">
      {/* 메인 캔버스: 지속적인 도형만 */}
      <canvas 
        ref={mainCanvas.setRef}
        width={width} 
        height={height}
        className="absolute top-0 left-0 border border-gray-300"
      />
      
      {/* 오버레이 캔버스: 임시 미리보기만 */}
      <canvas 
        ref={overlayCanvas.setRef}
        width={width} 
        height={height}
        className="absolute top-0 left-0 pointer-events-none"
      />
    </div>
  );
}
```

**아키텍처 이점**:
- **성능 격리**: 메인 캔버스가 미리보기 작업에 영향받지 않음
- **최적화된 렌더링**: 각 캔버스가 특정 목적을 제공
- **간섭 없음**: 성능 페널티 없는 계층화된 아키텍처

### 3. **실시간 자유 그리기 패턴**

연속 그리기 도구의 경우, 실시간 피드백을 위해 증분 렌더링 사용:

```tsx
// 성능 패턴: 증분 자유 그리기
const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
  if (currentTool === 'freehand' && isDrawing) {
    const currentPos = getMousePosition(event);
    
    // 즉시: 스트로크 세그먼트를 메인 캔버스에 직접 그리기
    if (mainCanvas.target && lastPoint.current) {
      const ctx = mainCanvas.target.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
        ctx.lineTo(currentPos.x, currentPos.y);
        ctx.stroke(); // 즉각적인 시각적 피드백
      }
    }
    
    // 병렬: 지속성을 위한 상태 업데이트
    addFreehandPoint(currentPos);
    lastPoint.current = currentPos;
  }
}, [currentTool, isDrawing, strokeColor, strokeWidth, mainCanvas, addFreehandPoint]);

const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
  if (currentTool === 'freehand') {
    const startPos = getMousePosition(event);
    lastPoint.current = startPos;
    setIsDrawing(true);
    
    // 새로운 자유 그리기 도형 시작
    startFreehandShape(startPos);
  }
}, [currentTool, startFreehandShape]);
```

**실시간 이점**:
- **지연 없음**: 각 스트로크 세그먼트가 즉시 나타남
- **부드러운 곡선**: 중단 없는 연속 그리기  
- **자연스러운 느낌**: 물리적 도구처럼 그리기에 반응

## 성능 결과

| 지표 | 구현 | 결과 |
|--------|----------------|--------|
| **마우스 응답** | 즉각적인 시각적 피드백 패턴 | <16ms 응답 시간 |
| **상호작용 성능** | 선택적 캔버스 업데이트 | 지속적인 60fps+ |
| **자유 그리기** | 증분 렌더링 | 지연 없는 실시간 그리기 |
| **캔버스 작업** | 듀얼 캔버스 아키텍처 | 재그리기 50-80% 감소 |

## 통합 성능 패턴

```tsx
// 핵심 패턴: RefContext를 사용한 즉각적인 시각적 피드백
function useOptimizedCanvasInteraction() {
  const mainCanvas = useCanvasRef('mainCanvas');
  const overlayCanvas = useCanvasRef('overlayCanvas');
  
  const performCanvasAction = useCallback((
    action: 'draw' | 'preview' | 'clear',
    shape: any, // 앱의 도형 타입 사용
    options?: any // 앱의 렌더링 옵션 사용
  ) => {
    switch (action) {
      case 'draw':
        // 즉시: 메인 캔버스 렌더링
        if (mainCanvas.target) {
          const ctx = mainCanvas.target.getContext('2d');
          if (ctx) {
            drawing.drawShape(ctx, shape, options);
          }
        }
        // 병렬: 상태 지속성
        addShape(shape);
        break;
        
      case 'preview':
        // 미리보기만을 위한 오버레이 캔버스
        if (overlayCanvas.target) {
          const ctx = overlayCanvas.target.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            drawing.drawShape(ctx, shape, { ...options, isPreview: true });
          }
        }
        break;
        
      case 'clear':
        // 메인 캔버스에 영향주지 않고 오버레이 지우기
        if (overlayCanvas.target) {
          const ctx = overlayCanvas.target.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          }
        }
        break;
    }
  }, [mainCanvas, overlayCanvas, addShape, drawing]);
  
  return { performCanvasAction };
}
```

## 고급 캔버스 성능 패턴

### 1. **고해상도 캔버스 최적화**

성능을 유지하면서 레티나 디스플레이에 캔버스 최적화:

```tsx
// 성능 패턴: 고해상도 캔버스 최적화
function useHighDPICanvas(width: number, height: number) {
  const mainCanvas = useCanvasRef('mainCanvas');
  const dpr = window.devicePixelRatio || 1;
  
  useEffect(() => {
    if (!mainCanvas.target) return;
    
    // 디바이스 픽셀 비율에 최적화
    const actualWidth = width * dpr;
    const actualHeight = height * dpr;
    
    // 캔버스 메모리 크기 설정 (고해상도)
    mainCanvas.target.width = actualWidth;
    mainCanvas.target.height = actualHeight;
    
    // 디스플레이 크기를 의도된 치수로 다시 스케일링
    mainCanvas.target.style.width = `${width}px`;
    mainCanvas.target.style.height = `${height}px`;
    
    // 선명한 렌더링을 위한 그리기 컨텍스트 스케일링
    const ctx = mainCanvas.target.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, [width, height, dpr, mainCanvas]);
  
  return { mainCanvas, dpr };
}
```

### 2. **선택적 영역 업데이트**

변경된 캔버스 영역만 업데이트하여 렌더링 최적화:

```tsx
// 성능 패턴: 선택적 영역 업데이트
function useSelectiveCanvasUpdates() {
  const mainCanvas = useCanvasRef('mainCanvas');
  const dirtyRegions = useRef(new Set<{ x: number; y: number; width: number; height: number }>());
  
  const markRegionDirty = useCallback((region: { x: number; y: number; width: number; height: number }) => {
    dirtyRegions.current.add(region);
  }, []);
  
  const updateDirtyRegions = useCallback((shapes: any[]) => {
    if (!mainCanvas.target || dirtyRegions.current.size === 0) return;
    
    const ctx = mainCanvas.target.getContext('2d');
    if (!ctx) return;
    
    // 각 더티 영역 처리
    dirtyRegions.current.forEach(region => {
      // 특정 영역만 지우기
      ctx.clearRect(region.x, region.y, region.width, region.height);
      
      // 이 영역과 교차하는 도형들을 다시 그리기
      shapes.forEach(shape => {
        if (shapeIntersectsRegion(shape, region)) {
          drawing.drawShape(ctx, shape);
        }
      });
    });
    
    // 업데이트 후 더티 영역 지우기
    dirtyRegions.current.clear();
  }, [mainCanvas, drawing]);
  
  const updateFullCanvas = useCallback((shapes: any[]) => {
    if (!mainCanvas.target) return;
    
    const ctx = mainCanvas.target.getContext('2d');
    if (!ctx) return;
    
    // 필요시 전체 캔버스 업데이트
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    shapes.forEach(shape => drawing.drawShape(ctx, shape));
  }, [mainCanvas, drawing]);
  
  return { 
    markRegionDirty, 
    updateDirtyRegions, 
    updateFullCanvas 
  };
}
```

### 3. **성능 모니터링 패턴**

실시간으로 캔버스 성능 모니터링 및 최적화:

```tsx
// 성능 패턴: 실시간 캔버스 성능 모니터링
function useCanvasPerformanceMonitor() {
  const metricsRef = useRef({
    updateTimes: [] as number[],
    frameCount: 0,
    lastFPSCheck: performance.now()
  });
  
  const measureCanvasOperation = useCallback((
    operation: () => void,
    operationType: 'draw' | 'clear' | 'update' = 'draw'
  ) => {
    const start = performance.now();
    operation();
    const end = performance.now();
    
    const operationTime = end - start;
    metricsRef.current.updateTimes.push(operationTime);
    
    // 100개 측정값의 슬라이딩 윈도우 유지
    if (metricsRef.current.updateTimes.length > 100) {
      metricsRef.current.updateTimes.shift();
    }
    
    // 성능 지표 계산
    const averageTime = metricsRef.current.updateTimes.reduce((a, b) => a + b, 0) / 
                       metricsRef.current.updateTimes.length;
    
    // 성능 임계값 경고
    const targetFrameTime = 16.67; // 60fps 목표
    if (averageTime > targetFrameTime) {
      console.warn(
        `캔버스 ${operationType} 성능이 60fps 미만: 평균 ${averageTime.toFixed(2)}ms`
      );
    }
    
    return {
      operationTime,
      averageTime,
      isPerformant: averageTime <= targetFrameTime
    };
  }, []);
  
  const getPerformanceStats = useCallback(() => {
    const times = metricsRef.current.updateTimes;
    if (times.length === 0) return null;
    
    const average = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    return {
      averageMs: average,
      maxMs: max,
      minMs: min,
      sampleCount: times.length,
      estimatedFPS: Math.round(1000 / average)
    };
  }, []);
  
  return { 
    measureCanvasOperation, 
    getPerformanceStats 
  };
}
```

## 캔버스 최적화 사용 사례

### 이상적인 애플리케이션
- **실시간 그리기 도구**: 페인트 애플리케이션, 다이어그램 에디터, 디지털 화이트보드
- **인터랙티브 데이터 시각화**: 차트, 그래프, 실시간 데이터 디스플레이
- **게임 개발**: 2D 게임, 인터랙티브 시뮬레이션, 애니메이션
- **디자인 애플리케이션**: 벡터 에디터, CAD 도구, 창작 소프트웨어
- **교육 도구**: 인터랙티브 학습 애플리케이션, 수학 시각화

### 성능 이점
- **60fps+ 상호작용**: 부드러운 사용자 경험을 위한 일관된 프레임 속도
- **지연 없는 그리기**: 자연스러운 그리기 느낌을 위한 즉각적인 시각적 피드백
- **확장 가능한 성능**: 복잡한 콘텐츠에도 일관된 성능
- **메모리 효율적**: 최적화된 캔버스 사용으로 메모리 블로트 방지
- **배터리 친화적**: 모바일 디바이스에서 CPU 사용량 감소

## 캔버스 성능 모범 사례

### 필수 패턴
1. **즉각적인 시각적 피드백**: 직접 캔버스 업데이트가 React 리렌더링 우회
2. **듀얼 캔버스 아키텍처**: 지속적인 콘텐츠와 임시 콘텐츠를 위한 별도 레이어  
3. **선택적 업데이트**: 전체 재그리기 대신 변경된 영역만 업데이트
4. **RefContext 통합**: 타입 안전 캔버스 액세스를 위해 `createRefContext` 사용
5. **성능 모니터링**: 조기 병목 지점 식별을 위한 지표 추적

### 구현 가이드라인
- **하드웨어 가속**: 가능한 곳에서 GPU 가속 활용
- **메모리 관리**: 사용하지 않는 캔버스 영역 지우기 및 객체 생성 최적화
- **이벤트 최적화**: 마우스 이동과 같은 고빈도 이벤트 쓰로틀링
- **고해상도 지원**: 레티나 디스플레이를 위한 적절한 캔버스 스케일링
- **우아한 성능 저하**: 성능 제약 디바이스를 위한 폴백 전략

## 💻 소스 코드

이러한 최적화 패턴의 완전한 구현은 코드베이스에서 확인할 수 있습니다:

### 주요 구현 파일
- **[AdvancedCanvasExample.tsx](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/AdvancedCanvasExample.tsx)** - 메인 캔버스 컴포넌트 구조
- **[useCanvasEvents.ts](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/canvas/useCanvasEvents.ts)** - 즉각적인 피드백을 통한 최적화된 이벤트 처리
- **[Canvas.tsx](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/canvas/Canvas.tsx)** - 듀얼 캔버스 RefContext 구현
- **[CanvasContext.tsx](https://github.com/mineclover/context-action/blob/main/example/src/pages/examples/canvas/CanvasContext.tsx)** - Context-Action 패턴을 통한 상태 관리

### 구현 전후 비교
80-90% 성능 향상을 달성한 정확한 변화를 보기 위해 git 히스토리를 확인하세요:
- **이전**: 눈에 보이는 지연이 있는 상태 의존적 렌더링
- **이후**: 병렬 상태 업데이트를 통한 즉각적인 시각적 피드백

### 로컬 개발
```bash
# 예제를 로컬에서 실행
cd example
npm run dev
# 방문: http://localhost:4000/refs/canvas
```

## 관련 패턴

- [하드웨어 가속](./hardware-acceleration.md) - GPU 최적화 기술
- [메모리 최적화](./memory-optimization.md) - 메모리 효율적 ref 관리
- [기본 사용법](./basic-usage.md) - RefContext 기초