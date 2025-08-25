# RefContext를 사용한 메모리 최적화

최적의 RefContext 성능을 위한 메모리 효율적 패턴과 기술입니다.

## 선행 요건

메모리 최적화 패턴을 구현하기 전에 적절한 RefContext 설정이 있는지 확인하세요:

👉 **설정 가이드**: [RefContext 설정](../setup/ref-context-setup.md)

이 가이드는 설정 사양의 다음 사전 정의된 타입을 사용합니다:
- **WorkerRefs**: 백그라운드 처리를 위한 웹 워커 관리
- **ServiceRefs**: 외부 서비스 및 라이브러리 관리
- **CanvasRefs**: 그래픽을 위한 캔버스 요소 관리
- **MediaRefs**: 미디어 요소 및 스트림 관리

## 메모리 관리 기본 사항

RefContext는 자동 정리를 제공하지만, 메모리 패턴을 이해하면 대규모 애플리케이션에 최적화할 수 있습니다.

## 효율적인 이벤트 처리

### 메모리 효율적 이벤트 위임

```tsx
// 설정 CanvasRefs를 사용한 메모리 효율적 이벤트 위임
function useOptimizedEventHandler() {
  const mainCanvas = useCanvasRef('mainCanvas'); // 설정 CanvasRefs에서
  const lastFrameTime = useRef(0);
  const frameId = useRef<number>();
  
  const optimizedHandler = useCallback((e: Event) => {
    // 메모리 압력을 방지하기 위해 60fps로 쓰로틀링
    const now = performance.now();
    if (now - lastFrameTime.current < 16.67) return; // ~60fps
    
    lastFrameTime.current = now;
    
    // 여전히 대기 중인 경우 이전 프레임 취소
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
    }
    
    frameId.current = requestAnimationFrame(() => {
      // 여기서 DOM 업데이트 수행
      if (mainCanvas.target) {
        const ctx = mainCanvas.target.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, mainCanvas.target.width, mainCanvas.target.height);
          ctx.fillRect(e.clientX, e.clientY, 10, 10);
        }
      }
    });
  }, [mainCanvas]);
  
  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, []);
  
  return { optimizedHandler };
}
```

### 이벤트 리스너 정리

```tsx
// 설정 UIRefs를 사용한 자동 이벤트 리스너 정리
function useEventListenerCleanup() {
  const modal = useUIRef('modal'); // 설정 UIRefs에서
  const listeners = useRef(new Map<string, EventListener>());
  
  const addEventListener = useCallback((event: string, handler: EventListener) => {
    if (!modal.target) return;
    
    // 기존 리스너가 있으면 제거
    const existingHandler = listeners.current.get(event);
    if (existingHandler) {
      modal.target.removeEventListener(event, existingHandler);
    }
    
    // 새 리스너 추가
    modal.target.addEventListener(event, handler);
    listeners.current.set(event, handler);
  }, [modal]);
  
  const removeEventListener = useCallback((event: string) => {
    if (!modal.target) return;
    
    const handler = listeners.current.get(event);
    if (handler) {
      modal.target.removeEventListener(event, handler);
      listeners.current.delete(event);
    }
  }, [modal]);
  
  // 언마운트 시 모든 리스너 정리
  useEffect(() => {
    return () => {
      if (modal.target) {
        listeners.current.forEach((handler, event) => {
          modal.target!.removeEventListener(event, handler);
        });
      }
      listeners.current.clear();
    };
  }, [modal]);
  
  return { addEventListener, removeEventListener };
}
```

## 객체 풀링 패턴

### Ref 풀 패턴

```tsx
// 빈번한 ref 작업을 위한 객체 풀링
function useRefPool<T extends HTMLElement>(size: number = 100) {
  const pool = useRef<T[]>([]);
  const activeRefs = useRef(new Set<T>());
  
  const borrowRef = useCallback((): T | null => {
    // 풀에서 ref를 반환하거나 새로 생성
    const ref = pool.current.pop();
    if (ref) {
      activeRefs.current.add(ref);
      return ref;
    }
    return null;
  }, []);
  
  const returnRef = useCallback((ref: T) => {
    // 정리하고 풀로 반환
    activeRefs.current.delete(ref);
    
    // 재사용을 위해 스타일 재설정
    ref.style.transform = '';
    ref.style.opacity = '';
    ref.style.visibility = 'hidden';
    ref.style.willChange = 'auto';
    
    // 이벤트 리스너 정리
    ref.replaceWith(ref.cloneNode(true));
    
    pool.current.push(ref);
  }, []);
  
  // 언마운트 시 풀 정리
  useEffect(() => {
    return () => {
      pool.current.length = 0;
      activeRefs.current.clear();
    };
  }, []);
  
  return { borrowRef, returnRef };
}
```

### 동적 요소를 위한 컴포넌트 풀

```tsx
// 설정 CanvasRefs를 사용한 동적 콘텐츠 풀 컴포넌트
function useDynamicElementPool() {
  const elementPool = useRef<HTMLElement[]>([]);
  const activeElements = useRef(new Set<HTMLElement>());
  const overlayCanvas = useCanvasRef('overlayCanvas'); // 설정 CanvasRefs에서
  
  const createElement = useCallback((type: string): HTMLElement | null => {
    // 먼저 풀에서 재사용 시도
    const pooled = elementPool.current.find(el => 
      el.tagName.toLowerCase() === type.toLowerCase()
    );
    
    if (pooled) {
      elementPool.current = elementPool.current.filter(el => el !== pooled);
      activeElements.current.add(pooled);
      return pooled;
    }
    
    // 풀이 비어있으면 새 요소 생성
    if (overlayCanvas.target) {
      const element = document.createElement(type);
      activeElements.current.add(element);
      return element;
    }
    
    return null;
  }, [overlayCanvas]);
  
  const releaseElement = useCallback((element: HTMLElement) => {
    if (!activeElements.current.has(element)) return;
    
    // DOM에서 제거
    element.remove();
    
    // 재사용을 위해 재설정
    element.className = '';
    element.style.cssText = '';
    element.innerHTML = '';
    
    // 풀로 반환
    activeElements.current.delete(element);
    elementPool.current.push(element);
  }, []);
  
  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      activeElements.current.forEach(el => el.remove());
      elementPool.current.length = 0;
      activeElements.current.clear();
    };
  }, []);
  
  return { createElement, releaseElement };
}
```

## 메모리 모니터링

### 메모리 사용량 추적

```tsx
// 설정 ServiceRefs를 사용한 ref 메모리 사용량 모니터링
function useMemoryMonitor() {
  const chartEngine = useServiceRef('chartEngine'); // 지표 디스플레이를 위한 설정 ServiceRefs에서
  const memoryHistory = useRef<number[]>([]);
  
  const updateMemoryStats = useCallback(() => {
    if (!chartEngine.target) return;
    
    // 메모리 정보 가져오기 (가능한 경우)
    const memory = (performance as any).memory;
    if (memory) {
      const used = Math.round(memory.usedJSHeapSize / 1048576); // MB
      const total = Math.round(memory.totalJSHeapSize / 1048576); // MB
      
      // 메모리 히스토리 추적
      memoryHistory.current.push(used);
      if (memoryHistory.current.length > 100) {
        memoryHistory.current.shift();
      }
      
      // 메모리 누수 감지
      const trend = calculateMemoryTrend(memoryHistory.current);
      const leakWarning = trend > 0.1 ? ' ⚠️ 누수 가능성' : '';
      
      // 메모리 지표로 차트 업데이트
      const usage = used / total;
      if (chartEngine.target && chartEngine.target.data) {
        chartEngine.target.data.datasets[0].data.push(used);
        chartEngine.target.update();
      }
      
      // 메모리 통계 로그
      console.log(`메모리: ${used}MB / ${total}MB (${Math.round(usage * 100)}%)${leakWarning}`);
    }
  }, [chartEngine]);
  
  // 5초마다 업데이트
  useEffect(() => {
    const interval = setInterval(updateMemoryStats, 5000);
    return () => clearInterval(interval);
  }, [updateMemoryStats]);
  
  return { updateMemoryStats };
}

function calculateMemoryTrend(history: number[]): number {
  if (history.length < 2) return 0;
  
  const recent = history.slice(-10);
  const older = history.slice(-20, -10);
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  return (recentAvg - olderAvg) / olderAvg;
}
```

### Ref 누수 감지

```tsx
// ref 메모리 누수 감지
function useRefLeakDetection() {
  const refRegistry = useRef(new WeakMap<HTMLElement, RefInfo>());
  const activeRefCount = useRef(0);
  
  const registerRef = useCallback((element: HTMLElement, info: RefInfo) => {
    refRegistry.current.set(element, info);
    activeRefCount.current++;
  }, []);
  
  const unregisterRef = useCallback((element: HTMLElement) => {
    if (refRegistry.current.has(element)) {
      refRegistry.current.delete(element);
      activeRefCount.current--;
    }
  }, []);
  
  const checkForLeaks = useCallback(() => {
    // DOM에 여전히 있는 요소 수 계산
    let elementsInDOM = 0;
    document.querySelectorAll('*').forEach(el => {
      if (refRegistry.current.has(el as HTMLElement)) {
        elementsInDOM++;
      }
    });
    
    const leakedRefs = activeRefCount.current - elementsInDOM;
    
    if (leakedRefs > 0) {
      console.warn(`잠재적 ref 누수 감지: ${leakedRefs}개의 refs가 정리되지 않았습니다`);
    }
    
    return { activeRefs: activeRefCount.current, elementsInDOM, leakedRefs };
  }, []);
  
  return { registerRef, unregisterRef, checkForLeaks };
}

// RefInfo 타입은 설정 사양 패턴을 따름
// 참조: ref-context-setup.md의 완전한 타입 정의
```

## 가비지 컬렉션 최적화

### 약한 참조 패턴

```tsx
// 설정 타입을 사용한 자동 정리를 위한 WeakMap/WeakSet 사용
function useWeakReferenceCache() {
  const elementCache = useRef(new WeakMap<HTMLElement, CachedData>());
  const elementSets = useRef(new WeakSet<HTMLElement>());
  const cacheManager = useServiceRef('cacheManager'); // 설정 DatabaseRefs에서
  
  const cacheData = useCallback((element: HTMLElement, data: CachedData) => {
    elementCache.current.set(element, data);
    elementSets.current.add(element);
    
    // 가능한 경우 브라우저 캐시에도 저장
    if (cacheManager.target) {
      cacheManager.target.put(`element-${element.id}`, new Response(JSON.stringify(data)));
    }
  }, [cacheManager]);
  
  const getCachedData = useCallback((element: HTMLElement): CachedData | undefined => {
    return elementCache.current.get(element);
  }, []);
  
  const hasElement = useCallback((element: HTMLElement): boolean => {
    return elementSets.current.has(element);
  }, []);
  
  // 정리 불필요 - WeakMap/WeakSet이 GC를 자동 처리
  // 브라우저 캐시 정리는 설정 패턴에서 처리
  return { cacheData, getCachedData, hasElement };
}

// CachedData 타입은 설정 사양 패턴 사용
// 참조: ref-context-setup.md의 완전한 캐시 타입 정의
```

### 수동 GC 트리거

```tsx
// 개발 환경에서 가비지 컬렉션 강제
function useGarbageCollectionTrigger() {
  const triggerGC = useCallback(() => {
    // 개발 환경이고 사용 가능한 경우에만
    if (process.env.NODE_ENV === 'development' && (window as any).gc) {
      console.log('수동 가비지 컬렉션 트리거 중...');
      (window as any).gc();
    }
  }, []);
  
  // 무거운 작업 후 GC 트리거
  const performHeavyOperation = useCallback((operation: () => void) => {
    operation();
    
    // 블로킹을 방지하기 위해 GC 지연
    setTimeout(triggerGC, 1000);
  }, [triggerGC]);
  
  return { triggerGC, performHeavyOperation };
}
```

## 성능 인식 Ref 관리

### 지연 Ref 초기화

```tsx
// 설정 WorkerRefs를 사용한 더 나은 메모리 사용을 위한 지연 초기화
function useLazyWorkerRef(workerName: keyof WorkerRefs) {
  const [isInitialized, setIsInitialized] = useState(false);
  const workerRef = useWorkerRef(workerName); // 설정 WorkerRefs에서
  
  const initializeWorker = useCallback(() => {
    if (!isInitialized && !workerRef.target) {
      const worker = new Worker(`/workers/${workerName}.js`);
      workerRef.setRef(worker);
      setIsInitialized(true);
    }
  }, [isInitialized, workerRef, workerName]);
  
  const destroyWorker = useCallback(() => {
    if (isInitialized && workerRef.target) {
      workerRef.target.terminate();
      setIsInitialized(false);
    }
  }, [isInitialized, workerRef]);
  
  return {
    worker: workerRef.target,
    isInitialized,
    initializeWorker,
    destroyWorker
  };
}
```

### 조건부 Ref 로딩

```tsx
// 설정 ServiceRefs를 사용하여 필요할 때만 서비스 refs 로드
function useConditionalServiceLoading() {
  const [loadedServices, setLoadedServices] = useState(new Set<keyof ServiceRefs>());
  const mapService = useServiceRef('mapService');
  const chartEngine = useServiceRef('chartEngine');
  const paymentService = useServiceRef('paymentService');
  
  const loadService = useCallback(async (serviceName: keyof ServiceRefs) => {
    if (loadedServices.has(serviceName)) return;
    
    switch (serviceName) {
      case 'mapService':
        if (!mapService.target) {
          const maps = await import('google-maps');
          mapService.setRef(maps.default);
        }
        break;
      case 'chartEngine':
        if (!chartEngine.target) {
          const Chart = await import('chart.js');
          chartEngine.setRef(Chart.default);
        }
        break;
      case 'paymentService':
        if (!paymentService.target) {
          const { loadStripe } = await import('@stripe/stripe-js');
          const stripe = await loadStripe(process.env.REACT_APP_STRIPE_KEY!);
          paymentService.setRef(stripe);
        }
        break;
    }
    
    setLoadedServices(prev => new Set([...prev, serviceName]));
  }, [loadedServices, mapService, chartEngine, paymentService]);
  
  const unloadService = useCallback((serviceName: keyof ServiceRefs) => {
    switch (serviceName) {
      case 'mapService':
        mapService.setRef(null);
        break;
      case 'chartEngine':
        if (chartEngine.target && chartEngine.target.destroy) {
          chartEngine.target.destroy();
        }
        chartEngine.setRef(null);
        break;
      case 'paymentService':
        paymentService.setRef(null);
        break;
    }
    
    setLoadedServices(prev => {
      const newSet = new Set(prev);
      newSet.delete(serviceName);
      return newSet;
    });
  }, [mapService, chartEngine, paymentService]);
  
  return { loadService, unloadService, loadedServices };
}
```

## 메모리 최적화 모범 사례

### 설정 기반 최적화
1. **설정 타입 재사용**: 사전 정의된 WorkerRefs, ServiceRefs, CanvasRefs, MediaRefs 사용
2. **설정 패턴 따르기**: 설정 가이드의 지연 초기화 구현
3. **설정 정리 사용**: 설정 사양에서 정의된 정리 패턴 따르기

### 메모리 관리
4. **WeakMap/WeakSet 사용**: 요소 제거 시 자동 정리
5. **고빈도 이벤트 쓰로틀링**: 빠른 업데이트로 인한 메모리 압력 방지
6. **자주 생성되는 객체 풀링**: 새로 생성하는 대신 요소 재사용
7. **메모리 사용량 모니터링**: 조기 누수 감지를 위한 추세 추적
8. **이벤트 리스너 정리**: 언마운트 시 리스너 항상 제거
9. **큰 객체와의 클로저 방지**: 우발적 보유 방지
10. **지연 로딩 사용**: 실제로 필요할 때만 refs 생성

## 메모리 성능 패턴

### 효율적인 배치 처리

```tsx
// 설정 WorkerRefs를 사용한 대용량 데이터셋 효율적 처리
function useBatchProcessor<T>(
  items: T[],
  batchSize: number = 100,
  processingDelay: number = 16
) {
  const [processedItems, setProcessedItems] = useState<T[]>([]);
  const processingRef = useRef<number>();
  const dataWorker = useWorkerRef('dataProcessingWorker'); // 설정 WorkerRefs에서
  
  const processBatch = useCallback(() => {
    const startIndex = processedItems.length;
    const endIndex = Math.min(startIndex + batchSize, items.length);
    const batch = items.slice(startIndex, endIndex);
    
    // 가능한 경우 무거운 처리를 위해 워커 사용
    if (dataWorker.target) {
      dataWorker.target.postMessage({ type: 'PROCESS_BATCH', batch });
      dataWorker.target.onmessage = (e) => {
        if (e.data.type === 'BATCH_PROCESSED') {
          setProcessedItems(prev => [...prev, ...e.data.result]);
        }
      };
    } else {
      // 메인 스레드 처리로 폴백
      setProcessedItems(prev => [...prev, ...batch]);
    }
    
    // 더 많은 아이템이 남아있으면 처리 계속
    if (endIndex < items.length) {
      processingRef.current = setTimeout(processBatch, processingDelay);
    }
  }, [items, processedItems, batchSize, processingDelay, dataWorker]);
  
  useEffect(() => {
    // 재설정 및 처리 시작
    setProcessedItems([]);
    processingRef.current = setTimeout(processBatch, processingDelay);
    
    return () => {
      if (processingRef.current) {
        clearTimeout(processingRef.current);
      }
    };
  }, [items, processBatch, processingDelay]);
  
  return processedItems;
}
```

## 관련 패턴

### 설정 통합
- **[RefContext 설정](../setup/ref-context-setup.md)** - 완전한 설정 패턴 및 타입 정의
- **[멀티 컨텍스트 설정](../setup/multi-context-setup.md)** - 복잡한 아키텍처 통합
- **[프로바이더 구성 설정](../setup/provider-composition-setup.md)** - 고급 구성

### 성능 최적화
- **[하드웨어 가속](./hardware-acceleration.md)** - GPU 최적화 기술
- **[캔버스 최적화](./canvas-optimization.md)** - 캔버스 특화 성능
- **[기본 사용법](./basic-usage.md)** - RefContext 기초