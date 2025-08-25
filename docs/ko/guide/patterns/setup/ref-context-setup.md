# RefContext 설정

Context-Action 프레임워크에서 직접 DOM 조작 및 싱글톤 객체 관리를 위한 공유 RefContext 설정 패턴입니다.

## 임포트
```typescript
import { createRefContext } from '@context-action/react';
```

## 개요

RefContext는 다음을 위한 지연 평가 및 생명주기 관리를 제공합니다:
- **직접 DOM 작업**: 직접 조작이 필요한 캔버스, 비디오, 오디오 요소
- **싱글톤 객체**: 단일 인스턴스가 필요한 무거운 라이브러리, SDK, 서비스
- **성능 중요 작업**: React의 가상 DOM을 우회하는 작업
- **외부 리소스 관리**: 서드파티 라이브러리 및 네이티브 API

## 타입 정의

### DOM 요소 Refs
```typescript
// 캔버스 및 그래픽 Refs
interface CanvasRefs {
  mainCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  chartCanvas: HTMLCanvasElement;
  animationCanvas: HTMLCanvasElement;
}

// 미디어 요소 Refs
interface MediaRefs {
  videoPlayer: HTMLVideoElement;
  audioContext: AudioContext;
  mediaStream: MediaStream;
  recordingDevice: MediaRecorder;
}

// 폼 및 입력 Refs
interface FormRefs {
  searchInput: HTMLInputElement;
  fileUpload: HTMLInputElement;
  textEditor: HTMLTextAreaElement;
  submitButton: HTMLButtonElement;
}

// UI 컴포넌트 Refs
interface UIRefs {
  modal: HTMLDialogElement;
  dropdown: HTMLDivElement;
  tooltip: HTMLSpanElement;
  sidebar: HTMLElement;
}
```

### 서비스 및 라이브러리 Refs
```typescript
// 분석 및 추적
interface AnalyticsRefs {
  googleAnalytics: typeof gtag;
  mixpanelClient: any; // Mixpanel 인스턴스
  amplitudeClient: any; // Amplitude 인스턴스
  hotjarClient: any; // Hotjar 인스턴스
}

// 외부 서비스
interface ServiceRefs {
  mapService: any; // Google Maps 또는 Mapbox 인스턴스
  chartEngine: any; // Chart.js 또는 D3 인스턴스  
  codeEditor: any; // Monaco Editor 또는 CodeMirror
  paymentService: any; // Stripe 또는 PayPal 인스턴스
}

// 데이터베이스 및 저장소
interface DatabaseRefs {
  indexedDB: IDBDatabase;
  localStorageManager: Storage;
  cacheManager: Cache;
  offlineDB: any; // Dexie 또는 유사한 라이브러리
}

// 통신
interface CommunicationRefs {
  websocketClient: WebSocket;
  socketIOClient: any; // Socket.IO 인스턴스
  webRTCConnection: RTCPeerConnection;
  serviceWorker: ServiceWorker;
}
```

### 무거운 연산 Refs
```typescript
// Web Workers 및 백그라운드 처리
interface WorkerRefs {
  dataProcessingWorker: Worker;
  imageProcessingWorker: Worker;
  cryptoWorker: Worker;
  renderingWorker: Worker;
}

// WebAssembly 및 네이티브 처리
interface WASMRefs {
  imageProcessor: WebAssembly.Instance;
  cryptoModule: WebAssembly.Instance;
  audioProcessor: WebAssembly.Instance;
  dataCompressor: WebAssembly.Instance;
}
```

## 컨텍스트 생성 패턴

### 기본 RefContext 설정
```typescript
// 간단한 DOM 요소 refs
const {
  Provider: CanvasRefProvider,
  useRefHandler: useCanvasRef
} = createRefContext<CanvasRefs>('Canvas');

// 지연 로딩이 포함된 서비스 refs
const {
  Provider: ServiceRefProvider,
  useRefHandler: useServiceRef,
  useWaitForRefs: useWaitForServices,
  useGetAllRefs: getAllServices
} = createRefContext<ServiceRefs>('Services');
```

### 정의가 포함된 RefContext
```typescript
// 구성이 포함된 고급 RefContext
interface ChartRefDefinitions {
  mainChart: {
    name: '메인 대시보드 차트';
    type: any; // Chart.js 인스턴스
    required: true;
    timeout: 10000;
  };
  miniChart: {
    name: '미니 차트 위젯';
    type: any;
    required: false;
    timeout: 5000;
  };
}

const {
  Provider: ChartRefProvider,
  useRefHandler: useChartRef
} = createRefContext('Charts', {
  mainChart: {
    name: '메인 대시보드 차트',
    type: {} as any, // Chart.js 타입
    required: true,
    timeout: 10000
  },
  miniChart: {
    name: '미니 차트 위젯', 
    type: {} as any,
    required: false,
    timeout: 5000
  }
});
```

### 다중 도메인 RefContext 설정
```typescript
// 성능 도메인
const PerformanceRefContext = createRefContext<{
  canvas: HTMLCanvasElement;
  worker: Worker;
  wasmModule: WebAssembly.Instance;
}>('Performance');

// 미디어 도메인
const MediaRefContext = createRefContext<{
  video: HTMLVideoElement;
  audio: AudioContext;
  stream: MediaStream;
}>('Media');

// 외부 서비스 도메인
const ExternalRefContext = createRefContext<{
  analytics: typeof gtag;
  maps: any;
  payment: any;
}>('External');

// 프로바이더와 훅 추출
export const {
  Provider: PerformanceRefProvider,
  useRefHandler: usePerformanceRef
} = PerformanceRefContext;

export const {
  Provider: MediaRefProvider,
  useRefHandler: useMediaRef
} = MediaRefContext;

export const {
  Provider: ExternalRefProvider,
  useRefHandler: useExternalRef
} = ExternalRefContext;
```

## 프로바이더 설정 패턴

### 단일 RefContext 프로바이더
```typescript
// 기본 단일 ref 프로바이더
function App() {
  return (
    <CanvasRefProvider>
      <CanvasApplication />
    </CanvasRefProvider>
  );
}
```

### 다중 RefContext 프로바이더
```typescript
// 수동 중첩 방식
function App() {
  return (
    <PerformanceRefProvider>
      <MediaRefProvider>
        <ExternalRefProvider>
          <ApplicationComponents />
        </ExternalRefProvider>
      </MediaRefProvider>
    </PerformanceRefProvider>
  );
}

// composeProviders 유틸리티 사용 (권장)
import { composeProviders } from '@context-action/react';

const RefProviders = composeProviders([
  PerformanceRefProvider,
  MediaRefProvider,
  ExternalRefProvider
]);

function App() {
  return (
    <RefProviders>
      <ApplicationComponents />
    </RefProviders>
  );
}
```

### Store 및 Action 컨텍스트와 통합
```typescript
// RefContext가 포함된 완전한 MVVM 설정
const MVVMWithRefProviders = composeProviders([
  // 모델 레이어
  UserModelProvider,
  ProductModelProvider,
  
  // 뷰모델 레이어
  UserViewModelProvider,
  ProductViewModelProvider,
  
  // 성능 레이어 (RefContext)
  PerformanceRefProvider,
  MediaRefProvider,
  ExternalRefProvider
]);

function MVVMApp() {
  return (
    <MVVMWithRefProviders>
      <MVVMComponents />
    </MVVMWithRefProviders>
  );
}
```

### 조건부 RefContext 설정
```typescript
// 기능 및 디바이스 능력에 따른 조건부 ref 프로바이더
interface RefConfig {
  features: {
    canvas: boolean;
    webRTC: boolean;
    webWorkers: boolean;
    webAssembly: boolean;
  };
  device: {
    isMobile: boolean;
    supportsWorkers: boolean;
    supportsWASM: boolean;
  };
}

function createRefProviders(config: RefConfig) {
  const providers = [];
  
  // 항상 기본 UI refs 포함
  providers.push(UIRefProvider);
  
  if (config.features.canvas) {
    providers.push(CanvasRefProvider);
  }
  
  if (config.features.webRTC && !config.device.isMobile) {
    providers.push(MediaRefProvider);
  }
  
  if (config.features.webWorkers && config.device.supportsWorkers) {
    providers.push(WorkerRefProvider);
  }
  
  if (config.features.webAssembly && config.device.supportsWASM) {
    providers.push(WASMRefProvider);
  }
  
  return composeProviders(providers);
}

function FeatureApp({ config }: { config: RefConfig }) {
  const FeatureRefProviders = createRefProviders(config);
  
  return (
    <FeatureRefProviders>
      <FeatureComponents />
    </FeatureRefProviders>
  );
}
```

## 초기화 패턴

### 지연 초기화
```typescript
// 지연 ref 초기화가 포함된 컴포넌트
function ChartComponent() {
  const mainChart = useChartRef('mainChart');
  const miniChart = useChartRef('miniChart');
  
  useEffect(() => {
    // 필요시 메인 차트 지연 초기화
    if (!mainChart.target) {
      import('chart.js').then(ChartJS => {
        const canvas = document.getElementById('main-chart') as HTMLCanvasElement;
        const chart = new ChartJS.Chart(canvas, {
          type: 'line',
          data: chartData,
          options: chartOptions
        });
        mainChart.setRef(chart);
      });
    }
    
    // 조건부 미니 차트 초기화
    if (!miniChart.target && shouldShowMiniChart) {
      import('chart.js').then(ChartJS => {
        const canvas = document.getElementById('mini-chart') as HTMLCanvasElement;
        const chart = new ChartJS.Chart(canvas, {
          type: 'doughnut',
          data: miniChartData
        });
        miniChart.setRef(chart);
      });
    }
    
    // 언마운트 시 정리
    return () => {
      mainChart.target?.destroy();
      miniChart.target?.destroy();
    };
  }, [mainChart, miniChart, shouldShowMiniChart]);
  
  return (
    <div>
      <canvas id="main-chart" />
      {shouldShowMiniChart && <canvas id="mini-chart" />}
    </div>
  );
}
```

### 서비스 초기화
```typescript
// 오류 처리가 포함된 서비스 초기화
function useServiceInitialization() {
  const analytics = useExternalRef('analytics');
  const maps = useExternalRef('maps');
  const payment = useExternalRef('payment');
  
  useEffect(() => {
    // 분석 서비스
    if (!analytics.target && process.env.REACT_APP_GA_ID) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GA_ID}`;
      script.onload = () => {
        window.gtag('config', process.env.REACT_APP_GA_ID!);
        analytics.setRef(window.gtag);
      };
      document.head.appendChild(script);
    }
    
    // 지도 서비스
    if (!maps.target && process.env.REACT_APP_GOOGLE_MAPS_KEY) {
      import('google-maps').then(GoogleMaps => {
        GoogleMaps.KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY!;
        GoogleMaps.LANGUAGE = 'ko';
        GoogleMaps.load().then(google => {
          maps.setRef(google.maps);
        });
      });
    }
    
    // 결제 서비스
    if (!payment.target && process.env.REACT_APP_STRIPE_KEY) {
      import('@stripe/stripe-js').then(({ loadStripe }) => {
        loadStripe(process.env.REACT_APP_STRIPE_KEY!).then(stripe => {
          if (stripe) {
            payment.setRef(stripe);
          }
        });
      });
    }
  }, [analytics, maps, payment]);
  
  return {
    analytics: analytics.target,
    maps: maps.target,
    payment: payment.target
  };
}
```

### Worker 초기화
```typescript
// Web Worker 초기화 패턴
function useWorkerInitialization() {
  const dataWorker = useWorkerRef('dataProcessingWorker');
  const imageWorker = useWorkerRef('imageProcessingWorker');
  
  useEffect(() => {
    // 데이터 처리 워커
    if (!dataWorker.target) {
      const worker = new Worker('/workers/data-processor.js');
      worker.onmessage = handleDataWorkerMessage;
      worker.onerror = handleDataWorkerError;
      dataWorker.setRef(worker);
    }
    
    // 이미지 처리 워커
    if (!imageWorker.target) {
      const worker = new Worker('/workers/image-processor.js');
      worker.onmessage = handleImageWorkerMessage;
      worker.onerror = handleImageWorkerError;
      imageWorker.setRef(worker);
    }
    
    // 워커 정리
    return () => {
      dataWorker.target?.terminate();
      imageWorker.target?.terminate();
    };
  }, [dataWorker, imageWorker]);
  
  const processData = useCallback(async (data: any) => {
    if (dataWorker.target) {
      return new Promise((resolve, reject) => {
        dataWorker.target!.postMessage({ type: 'PROCESS_DATA', data });
        dataWorker.target!.onmessage = (e) => {
          if (e.data.type === 'DATA_PROCESSED') {
            resolve(e.data.result);
          } else if (e.data.type === 'ERROR') {
            reject(new Error(e.data.message));
          }
        };
      });
    }
    throw new Error('데이터 워커가 초기화되지 않았습니다');
  }, [dataWorker]);
  
  return { processData };
}
```

## 고급 사용 패턴

### 다중 Refs 대기
```typescript
// 다중 refs가 준비될 때까지 대기
function ComplexComponent() {
  const waitForRefs = useWaitForServices();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // 모든 필수 서비스 대기
    waitForRefs('analytics', 'maps', 'payment').then((services) => {
      console.log('모든 서비스 준비:', services);
      setIsReady(true);
    }).catch((error) => {
      console.error('서비스 초기화 실패:', error);
    });
  }, [waitForRefs]);
  
  if (!isReady) {
    return <div>서비스 로딩 중...</div>;
  }
  
  return <div>애플리케이션 준비!</div>;
}
```

### 타임아웃이 포함된 Ref 작업
```typescript
// 타임아웃 및 오류 처리가 포함된 안전한 ref 작업
function CanvasDrawingComponent() {
  const canvas = useCanvasRef('mainCanvas');
  
  const drawOnCanvas = useCallback(async (drawingData: any) => {
    try {
      const result = await canvas.withTarget(
        (canvasElement) => {
          const ctx = canvasElement.getContext('2d')!;
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          
          // 그리기 작업
          drawingData.shapes.forEach((shape: any) => {
            ctx.beginPath();
            // ... 그리기 로직
            ctx.stroke();
          });
          
          return { success: true, shapesDrawn: drawingData.shapes.length };
        },
        { timeout: 5000, retries: 3 }
      );
      
      if (result.success) {
        console.log('그리기 완료:', result.data);
      }
    } catch (error) {
      console.error('그리기 실패:', error);
    }
  }, [canvas]);
  
  return (
    <div>
      <canvas 
        ref={(element) => element && canvas.setRef(element)}
        width={800} 
        height={600} 
      />
      <button onClick={() => drawOnCanvas(complexDrawingData)}>
        캔버스에 그리기
      </button>
    </div>
  );
}
```

## 내보내기 패턴

### 명명된 내보내기 (권장)
```typescript
// refs/CanvasRefs.ts
export interface CanvasRefs {
  mainCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  chartCanvas: HTMLCanvasElement;
}

export const {
  Provider: CanvasRefProvider,
  useRefHandler: useCanvasRef,
  useWaitForRefs: useWaitForCanvas,
  useGetAllRefs: getAllCanvasRefs
} = createRefContext<CanvasRefs>('Canvas');

// 쉬운 임포트를 위한 재내보내기
export {
  CanvasRefProvider,
  useCanvasRef,
  useWaitForCanvas,
  getAllCanvasRefs
};
```

### 배럴 내보내기
```typescript
// refs/index.ts - 배럴 내보내기 파일
export * from './CanvasRefs';
export * from './MediaRefs';
export * from './ServiceRefs';
export * from './WorkerRefs';

// 컴포넌트에서 사용
import {
  useCanvasRef,
  useMediaRef,
  useServiceRef
} from '../refs';
```

### 도메인 번들 내보내기
```typescript
// refs/PerformanceDomain.ts
export * from './CanvasRefs';
export * from './WorkerRefs';
export * from './WASMRefs';

// refs/MediaDomain.ts
export * from './MediaRefs';
export * from './StreamRefs';
export * from './AudioRefs';

// refs/ServiceDomain.ts
export * from './ServiceRefs';
export * from './AnalyticsRefs';
export * from './PaymentRefs';
```

## 모범 사례

### Ref 관리
1. **지연 초기화**: 실제로 필요할 때만 refs 초기화
2. **정리**: useEffect 정리 함수에서 항상 refs 정리
3. **오류 처리**: ref 작업에 적절한 오류 처리 구현
4. **타임아웃 관리**: ref 작업에 적절한 타임아웃 사용

### 성능 최적화
1. **조건부 로딩**: 기능이 활성화된 경우에만 무거운 refs 로딩
2. **디바이스 적응**: 디바이스 능력에 따른 ref 초기화 적응
3. **메모리 관리**: 무거운 객체와 서비스를 적절히 해제
4. **Worker 사용**: CPU 집약적 작업에 Web Workers 사용

### 통합 패턴
1. **MVVM 아키텍처**: RefContext를 성능 레이어로 사용
2. **프로바이더 구성**: Store 및 Action 컨텍스트와 결합
3. **기능 플래그**: 조건부로 ref 프로바이더 로딩
4. **환경 구성**: 환경에 따른 refs 적응

## 일반적인 패턴 참조

이 설정 파일은 다음을 위한 재사용 가능한 패턴을 제공합니다:

- **[Ref 기본 사용법](../ref/basic-usage.md)** - CanvasRefs 패턴 사용
- **[캔버스 최적화](../ref/canvas-optimization.md)** - CanvasRefs 및 WorkerRefs 사용
- **[메모리 최적화](../ref/memory-optimization.md)** - 서비스 정리 패턴 사용
- **[MVVM 아키텍처](../architecture/mvvm.md)** - RefContext를 성능 레이어로 사용
- **[성능 패턴](../performance/optimization-techniques.md)** - 모든 ref 패턴 사용

## 관련 설정 가이드

- **[기본 액션 설정](./basic-action-setup.md)** - 액션 컨텍스트 설정 패턴
- **[기본 스토어 설정](./basic-store-setup.md)** - 스토어 컨텍스트 설정 패턴
- **[다중 컨텍스트 설정](./multi-context-setup.md)** - 복잡한 아키텍처 통합
- **[프로바이더 구성 설정](./provider-composition-setup.md)** - 고급 구성 기법