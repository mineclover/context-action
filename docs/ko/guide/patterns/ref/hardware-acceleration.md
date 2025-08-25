# RefContext를 사용한 하드웨어 가속

60fps+ 성능을 위한 GPU 가속 DOM 조작 패턴입니다.

## 선행 요건

하드웨어 가속 패턴을 사용하기 전에 GPU 및 성능 레퍼런스로 RefContext를 설정하세요:

**필수 설정**: [RefContext 설정](../setup/ref-context-setup.md) - GPURefs, WASMRefs, WorkerRefs 구성

```typescript
// 설정에서 하드웨어 가속 ref 타입 가져오기
import { GPURefs, WASMRefs, WorkerRefs } from '../setup/ref-context-setup';
import { createRefContext } from '@context-action/react';

// 하드웨어 가속 RefContext 설정
const {
  Provider: HardwareRefProvider,
  useRefHandler: useHardwareRef
} = createRefContext<GPURefs & WASMRefs & WorkerRefs>('Hardware');
```

## 하드웨어 가속 기본 사항

RefContext는 부드럽고 고성능 상호작용을 위해 GPU 가속을 활용할 수 있는 직접 DOM 조작을 가능하게 합니다.

### GPU 가속 속성

```tsx
// GPU 가속을 트리거하는 속성
const gpuAccelerated = {
  transform: 'translate3d(x, y, z)',  // ✅ GPU 가속
  opacity: '0.5',                     // ✅ GPU 가속
  filter: 'blur(5px)',               // ✅ GPU 가속
  willChange: 'transform, opacity'    // ✅ 최적화 힌트
};

// CPU 렌더링을 트리거하는 속성
const cpuRendered = {
  left: '100px',      // ❌ 레이아웃 스래싱
  top: '100px',       // ❌ 레이아웃 스래싱
  width: '200px',     // ❌ 레이아웃 스래싱
  height: '200px'     // ❌ 레이아웃 스래싱
};
```

## 하드웨어 가속 마우스 추적

```tsx
// 설정 기반 refs를 사용한 하드웨어 가속 마우스 추적
function HighPerformanceMouseTracker() {
  const cursor = useHardwareRef('cursor');
  const trail = useHardwareRef('trail');
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cursor.target || !trail.target) return;
    
    const x = e.clientX;
    const y = e.clientY;
    
    // translate3d로 하드웨어 가속
    cursor.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    trail.target.style.transform = `translate3d(${x-10}px, ${y-10}px, 0)`;
    
    // GPU 가속 opacity 변경
    trail.target.style.opacity = '0.7';
    
    // 최적화 힌트를 위한 will-change
    cursor.target.style.willChange = 'transform';
    trail.target.style.willChange = 'transform, opacity';
  }, [cursor, trail]);
  
  return (
    <div onMouseMove={handleMouseMove} className="w-full h-96 relative">
      <div
        ref={cursor.setRef}
        className="absolute w-4 h-4 bg-blue-500 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)' }}
      />
      <div
        ref={trail.setRef}
        className="absolute w-3 h-3 bg-blue-300 rounded-full pointer-events-none"
        style={{ transform: 'translate3d(0, 0, 0)', opacity: 0 }}
      />
    </div>
  );
}
```

## GPU 레이어 관리

### 컴포지트 레이어 생성

```tsx
// 설정 기반 GPU refs를 사용한 GPU 레이어 생성 강제
function useGPULayer() {
  const element = useHardwareRef('element');
  
  useEffect(() => {
    if (!element.target) return;
    
    // GPU 레이어 생성 강제
    element.target.style.willChange = 'transform, opacity';
    element.target.style.transform = 'translate3d(0, 0, 0)';
    element.target.style.backfaceVisibility = 'hidden';
    element.target.style.perspective = '1000px';
    
    // 언마운트 시 정리
    return () => {
      if (element.target) {
        element.target.style.willChange = 'auto';
      }
    };
  }, [element]);
  
  return element;
}
```

### 레이어 최적화

```tsx
// GPU 레이어를 효율적으로 관리
function useLayerOptimization() {
  const activeElements = useRef(new Set<HTMLElement>());
  
  const promoteToGPU = useCallback((element: HTMLElement) => {
    if (activeElements.current.has(element)) return;
    
    // GPU 레이어로 승격
    element.style.willChange = 'transform, opacity';
    element.style.transform = element.style.transform || 'translate3d(0, 0, 0)';
    
    activeElements.current.add(element);
  }, []);
  
  const demoteFromGPU = useCallback((element: HTMLElement) => {
    if (!activeElements.current.has(element)) return;
    
    // 메모리 절약을 위해 GPU 레이어에서 제거
    element.style.willChange = 'auto';
    
    activeElements.current.delete(element);
  }, []);
  
  // 언마운트 시 모든 레이어 정리
  useEffect(() => {
    return () => {
      activeElements.current.forEach(element => {
        element.style.willChange = 'auto';
      });
      activeElements.current.clear();
    };
  }, []);
  
  return { promoteToGPU, demoteFromGPU };
}
```

## GPU를 사용한 부드러운 애니메이션

### 하드웨어 가속 전환

```tsx
// 설정 기반 하드웨어 refs를 사용한 부드러운 전환
function useSmoothTransition() {
  const animatedElement = useHardwareRef('animatedElement');
  const isAnimating = useRef(false);
  
  const animateToPosition = useCallback((targetX: number, targetY: number) => {
    if (!animatedElement.target || isAnimating.current) return;
    
    isAnimating.current = true;
    const startTime = performance.now();
    const duration = 300; // 300ms 애니메이션
    
    // 현재 위치 가져오기
    const computedStyle = getComputedStyle(animatedElement.target);
    const matrix = new DOMMatrix(computedStyle.transform);
    const currentX = matrix.m41;
    const currentY = matrix.m42;
    
    // 애니메이션을 위해 GPU 레이어로 승격
    animatedElement.target.style.willChange = 'transform';
    
    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 부드러운 애니메이션을 위한 이징 함수
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      
      const x = currentX + (targetX - currentX) * eased;
      const y = currentY + (targetY - currentY) * eased;
      
      if (animatedElement.target) {
        // 하드웨어 가속 변환
        animatedElement.target.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 애니메이션 후 GPU 레이어에서 강등
        if (animatedElement.target) {
          animatedElement.target.style.willChange = 'auto';
        }
        isAnimating.current = false;
      }
    }
    
    requestAnimationFrame(animate);
  }, [animatedElement]);
  
  return { animateToPosition };
}
```

### GPU 작업 배치

```tsx
// 설정 기반 refs를 사용한 효율적인 배치 GPU 업데이트
function useBatchGPUUpdates() {
  const elements = useHardwareRef('elements');
  const pendingUpdates = useRef(new Map<HTMLElement, HardwareUpdate>());
  const frameId = useRef<number>();
  
  const queueGPUUpdate = useCallback((element: HTMLElement, update: HardwareUpdate) => {
    pendingUpdates.current.set(element, update);
    
    // 대기 중인 경우 이전 프레임 취소
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
    }
    
    // 다음 프레임에 모든 업데이트 배치
    frameId.current = requestAnimationFrame(() => {
      pendingUpdates.current.forEach((update, element) => {
        // 설정 패턴을 따르는 하드웨어 가속 변환 적용
        const transform = `translate3d(${update.transform.x}px, ${update.transform.y}px, ${update.transform.z}px) 
                         scale(${update.transform.scale}) 
                         rotate(${update.transform.rotation}deg)`;
        
        element.style.transform = transform;
        element.style.opacity = update.appearance.opacity.toString();
        element.style.filter = update.appearance.filter;
        element.style.willChange = update.acceleration.willChange;
        element.style.backfaceVisibility = update.acceleration.backfaceVisibility;
      });
      
      pendingUpdates.current.clear();
    });
  }, []);
  
  return { queueGPUUpdate };
}

// HardwareUpdate 타입은 설정 사양 패턴을 사용  
// 참조: ref-context-setup.md의 완전한 하드웨어 업데이트 타입 정의
```

## WebAssembly 하드웨어 가속

### WASM 기반 이미지 처리
```tsx
// 설정 패턴을 따르는 WebAssembly를 통한 하드웨어 가속
function useWASMAcceleration() {
  const imageProcessor = useHardwareRef('imageProcessor');
  const cryptoModule = useHardwareRef('cryptoModule');
  
  useEffect(() => {
    // 하드웨어 가속을 위한 WASM 모듈 초기화
    if (!imageProcessor.target) {
      import('/wasm/image-processor.wasm').then(async (wasmModule) => {
        const instance = await WebAssembly.instantiate(wasmModule);
        imageProcessor.setRef(instance);
      });
    }
    
    if (!cryptoModule.target) {
      import('/wasm/crypto-module.wasm').then(async (wasmModule) => {
        const instance = await WebAssembly.instantiate(wasmModule);
        cryptoModule.setRef(instance);
      });
    }
  }, [imageProcessor, cryptoModule]);
  
  const processImageWithHardware = useCallback(async (imageData: ImageData) => {
    if (!imageProcessor.target) throw new Error('WASM 모듈이 로드되지 않았습니다');
    
    // 하드웨어 가속 처리를 위한 WebAssembly 사용
    const result = imageProcessor.target.exports.processImage(
      imageData.data.buffer,
      imageData.width,
      imageData.height
    );
    
    return new ImageData(new Uint8ClampedArray(result), imageData.width, imageData.height);
  }, [imageProcessor]);
  
  const encryptDataWithHardware = useCallback(async (data: ArrayBuffer) => {
    if (!cryptoModule.target) throw new Error('암호화 WASM 모듈이 로드되지 않았습니다');
    
    return cryptoModule.target.exports.encrypt(data);
  }, [cryptoModule]);
  
  return { processImageWithHardware, encryptDataWithHardware };
}
```

### 워커 기반 하드웨어 가속
```tsx
// 설정 패턴을 사용한 Worker와 GPU 가속 결합
function useWorkerGPUAcceleration() {
  const renderingWorker = useHardwareRef('renderingWorker');
  const dataProcessor = useHardwareRef('dataProcessingWorker');
  
  useEffect(() => {
    if (!renderingWorker.target) {
      const worker = new Worker('/workers/gpu-renderer.js');
      worker.postMessage({ type: 'INIT_GPU_CONTEXT' });
      renderingWorker.setRef(worker);
    }
    
    if (!dataProcessor.target) {
      const worker = new Worker('/workers/data-processor.js');
      worker.postMessage({ type: 'INIT_ACCELERATION' });
      dataProcessor.setRef(worker);
    }
    
    return () => {
      renderingWorker.target?.terminate();
      dataProcessor.target?.terminate();
    };
  }, [renderingWorker, dataProcessor]);
  
  const renderWithWorkerGPU = useCallback(async (renderData: any) => {
    if (!renderingWorker.target) throw new Error('렌더링 워커가 준비되지 않았습니다');
    
    return new Promise((resolve, reject) => {
      renderingWorker.target!.postMessage({
        type: 'RENDER_WITH_GPU',
        data: renderData
      });
      
      renderingWorker.target!.onmessage = (e) => {
        if (e.data.type === 'RENDER_COMPLETE') {
          resolve(e.data.result);
        } else if (e.data.type === 'RENDER_ERROR') {
          reject(new Error(e.data.error));
        }
      };
    });
  }, [renderingWorker]);
  
  return { renderWithWorkerGPU };
}
```

## GPU 성능 모니터링

### GPU 사용량 추적

```tsx
// 설정 기반 성능 refs를 사용한 GPU 성능 모니터링
function useGPUPerformanceMonitor() {
  const metricsDisplay = useHardwareRef('metricsDisplay');
  const layerCount = useRef(0);
  
  const trackGPULayers = useCallback(() => {
    // 활성 GPU 레이어 수 계산
    const allElements = document.querySelectorAll('*');
    let activeLayerCount = 0;
    
    allElements.forEach(element => {
      const computedStyle = getComputedStyle(element);
      const willChange = computedStyle.willChange;
      const transform = computedStyle.transform;
      
      // 요소가 GPU 레이어에 있는지 확인
      if (willChange !== 'auto' || transform !== 'none') {
        activeLayerCount++;
      }
    });
    
    layerCount.current = activeLayerCount;
    
    if (metricsDisplay.target) {
      metricsDisplay.target.textContent = `GPU 레이어: ${activeLayerCount}`;
      
      // 레이어가 너무 많으면 경고
      if (activeLayerCount > 50) {
        metricsDisplay.target.style.color = 'red';
        console.warn(`높은 GPU 레이어 수: ${activeLayerCount}`);
      } else {
        metricsDisplay.target.style.color = 'green';
      }
    }
  }, [metricsDisplay]);
  
  // 5초마다 모니터링
  useEffect(() => {
    const interval = setInterval(trackGPULayers, 5000);
    return () => clearInterval(interval);
  }, [trackGPULayers]);
  
  return { layerCount: layerCount.current };
}
```

### 프레임 속도 모니터링

```tsx
// 설정 기반 성능 모니터링을 사용한 프레임 속도 추적
function useFrameRateMonitor() {
  const fpsDisplay = useHardwareRef('fpsDisplay');
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const isMonitoring = useRef(false);
  
  const startMonitoring = useCallback(() => {
    if (isMonitoring.current) return;
    
    isMonitoring.current = true;
    
    function updateFPS() {
      if (!isMonitoring.current) return;
      
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;
      
      if (delta >= 1000) { // 1초마다 업데이트
        const fps = Math.round((frameCount.current * 1000) / delta);
        
        if (fpsDisplay.target) {
          fpsDisplay.target.textContent = `${fps} FPS`;
          
          // 성능에 따른 색상 코딩
          fpsDisplay.target.style.color = fps >= 58 ? 'green' : 
                                         fps >= 45 ? 'orange' : 'red';
        }
        
        frameCount.current = 0;
        lastTime.current = now;
      }
      
      requestAnimationFrame(updateFPS);
    }
    
    requestAnimationFrame(updateFPS);
  }, [fpsDisplay]);
  
  const stopMonitoring = useCallback(() => {
    isMonitoring.current = false;
  }, []);
  
  return { startMonitoring, stopMonitoring };
}
```

## 완전한 하드웨어 가속 설정

### 전체 설정 통합
```tsx
// 설정 사양을 따르는 완전한 하드웨어 가속 설정
import { 
  GPURefs, 
  WASMRefs, 
  WorkerRefs,
  CanvasRefs 
} from '../setup/ref-context-setup';

// 결합된 하드웨어 가속 refs
interface HardwareAccelerationRefs extends 
  GPURefs, 
  WASMRefs, 
  WorkerRefs, 
  CanvasRefs {}

const {
  Provider: HardwareAccelerationProvider,
  useRefHandler: useHardwareRef,
  useWaitForRefs: useWaitForHardware,
  useGetAllRefs: getAllHardwareRefs
} = createRefContext<HardwareAccelerationRefs>('HardwareAcceleration');

// 모든 하드웨어 가속 기능을 갖춘 애플리케이션 설정
function HardwareAcceleratedApp() {
  return (
    <HardwareAccelerationProvider>
      <GPUAcceleratedComponents />
      <WASMAcceleratedComponents />
      <WorkerAcceleratedComponents />
    </HardwareAccelerationProvider>
  );
}
```

### 하드웨어 가속 초기화
```tsx
// 모든 하드웨어 가속 기능 초기화
function useHardwareAccelerationInit() {
  const imageProcessor = useHardwareRef('imageProcessor');
  const cryptoModule = useHardwareRef('cryptoModule');
  const renderingWorker = useHardwareRef('renderingWorker');
  const dataWorker = useHardwareRef('dataProcessingWorker');
  
  useEffect(() => {
    const initHardwareAcceleration = async () => {
      try {
        // WebAssembly 모듈 초기화
        await Promise.all([
          initWASMModule(imageProcessor, '/wasm/image-processor.wasm'),
          initWASMModule(cryptoModule, '/wasm/crypto-module.wasm')
        ]);
        
        // GPU 컨텍스트를 가진 Worker 초기화
        await Promise.all([
          initWorkerWithGPU(renderingWorker, '/workers/gpu-renderer.js'),
          initWorkerWithGPU(dataWorker, '/workers/data-processor.js')
        ]);
        
        console.log('하드웨어 가속이 완전히 초기화되었습니다');
      } catch (error) {
        console.error('하드웨어 가속 초기화 실패:', error);
      }
    };
    
    initHardwareAcceleration();
  }, [imageProcessor, cryptoModule, renderingWorker, dataWorker]);
  
  return {
    imageProcessor: imageProcessor.target,
    cryptoModule: cryptoModule.target,
    renderingWorker: renderingWorker.target,
    dataWorker: dataWorker.target
  };
}

// 초기화용 헬퍼 함수
async function initWASMModule(ref: any, path: string) {
  const wasmModule = await import(path);
  const instance = await WebAssembly.instantiate(wasmModule);
  ref.setRef(instance);
}

async function initWorkerWithGPU(ref: any, path: string) {
  const worker = new Worker(path);
  worker.postMessage({ type: 'INIT_GPU_CONTEXT' });
  ref.setRef(worker);
}
```

## 하드웨어 가속 모범 사례

### 설정 기반 모범 사례
1. **설정 정의 타입 사용**: 항상 설정 사양의 ref 타입 사용
2. **지연 하드웨어 초기화**: 필요할 때만 하드웨어 리소스 초기화
3. **결합된 하드웨어 전략**: 최적 성능을 위해 GPU + WASM + Workers 사용
4. **설정 기반 프로바이더**: 설정 패턴의 프로바이더 구성 사용
5. **리소스 정리**: 설정 가이드라인을 따라 하드웨어 리소스 적절히 폐기

### GPU 최적화
1. **GPU 가속 속성 사용**: 레이아웃 속성보다 `transform`과 `opacity` 선호
2. **레이어 생성 최소화**: 가속이 필요한 요소만 승격
3. **Will-Change 정리**: 애니메이션 완료 후 `will-change` 제거
4. **업데이트 배치**: 여러 GPU 작업을 단일 프레임에 그룹화
5. **레이어 수 모니터링**: 최적 성능을 위해 GPU 레이어를 50개 미만으로 유지
6. **RequestAnimationFrame 사용**: 부드러운 애니메이션을 위해 새로고침 속도와 동기화
7. **Translate3D 선호**: 3D 변환으로 GPU 가속 강제

### WASM 통합
1. **모듈 풀링**: 작업 전반에서 WASM 인스턴스 재사용
2. **메모리 관리**: WASM 메모리 할당 적절히 관리
3. **타입 안전성**: WASM 익스포트를 위한 TypeScript 정의 사용
4. **에러 처리**: WASM 실패에 대한 강력한 에러 복구 구현

### Worker 협조  
1. **GPU 컨텍스트 공유**: 메인 스레드와 워커 간 GPU 컨텍스트 공유
2. **메시지 최적화**: 스레드 간 데이터 전송 최소화
3. **Worker 라이프사이클**: 워커 생성 및 종료 적절히 관리
4. **폴백 전략**: 워커가 실패했을 때 폴백 구현

## 성능 비교

| 기술 | CPU 사용량 | GPU 사용량 | 부드러움 | 메모리 |
|-----------|-----------|-----------|------------|---------|
| **레이아웃 속성** | 높음 | 없음 | 나쁨 | 낮음 |
| **CSS 전환** | 보통 | 보통 | 좋음 | 보통 |
| **GPU 변환** | 낮음 | 높음 | 우수함 | 높음 |
| **RefContext + GPU** | 낮음 | 최적화됨 | 우수함 | 최적화됨 |

## 관련 패턴

- **[RefContext 설정](../setup/ref-context-setup.md)** - GPURefs, WASMRefs, WorkerRefs를 위한 필수 설정
- [캔버스 최적화](./canvas-optimization.md) - CanvasRefs를 사용한 캔버스 특화 성능
- [메모리 최적화](./memory-optimization.md) - 설정 정리를 통한 메모리 효율적 패턴
- [기본 사용법](./basic-usage.md) - RefContext 기초 및 설정 통합