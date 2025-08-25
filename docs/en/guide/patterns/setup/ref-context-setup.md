# RefContext Setup

Shared RefContext setup patterns for direct DOM manipulation and singleton object management in the Context-Action framework.

## Import
```typescript
import { createRefContext } from '@context-action/react';
```

## Overview

RefContext provides lazy evaluation and lifecycle management for:
- **Direct DOM Operations**: Canvas, video, audio elements requiring direct manipulation
- **Singleton Objects**: Heavy libraries, SDKs, and services that need single instances
- **Performance Critical Operations**: Operations that bypass React's virtual DOM
- **External Resource Management**: Third-party libraries and native APIs

## Type Definitions

### DOM Element Refs
```typescript
// Canvas and Graphics Refs
interface CanvasRefs {
  mainCanvas: HTMLCanvasElement;
  overlayCanvas: HTMLCanvasElement;
  chartCanvas: HTMLCanvasElement;
  animationCanvas: HTMLCanvasElement;
}

// Media Element Refs
interface MediaRefs {
  videoPlayer: HTMLVideoElement;
  audioContext: AudioContext;
  mediaStream: MediaStream;
  recordingDevice: MediaRecorder;
}

// Form and Input Refs
interface FormRefs {
  searchInput: HTMLInputElement;
  fileUpload: HTMLInputElement;
  textEditor: HTMLTextAreaElement;
  submitButton: HTMLButtonElement;
}

// UI Component Refs
interface UIRefs {
  modal: HTMLDialogElement;
  dropdown: HTMLDivElement;
  tooltip: HTMLSpanElement;
  sidebar: HTMLElement;
}
```

### Service and Library Refs
```typescript
// Analytics and Tracking
interface AnalyticsRefs {
  googleAnalytics: typeof gtag;
  mixpanelClient: any; // Mixpanel instance
  amplitudeClient: any; // Amplitude instance
  hotjarClient: any; // Hotjar instance
}

// External Services
interface ServiceRefs {
  mapService: any; // Google Maps or Mapbox instance
  chartEngine: any; // Chart.js or D3 instance  
  codeEditor: any; // Monaco Editor or CodeMirror
  paymentService: any; // Stripe or PayPal instance
}

// Database and Storage
interface DatabaseRefs {
  indexedDB: IDBDatabase;
  localStorageManager: Storage;
  cacheManager: Cache;
  offlineDB: any; // Dexie or similar
}

// Communication
interface CommunicationRefs {
  websocketClient: WebSocket;
  socketIOClient: any; // Socket.IO instance
  webRTCConnection: RTCPeerConnection;
  serviceWorker: ServiceWorker;
}
```

### Heavy Computation Refs
```typescript
// Web Workers and Background Processing
interface WorkerRefs {
  dataProcessingWorker: Worker;
  imageProcessingWorker: Worker;
  cryptoWorker: Worker;
  renderingWorker: Worker;
}

// WebAssembly and Native Processing
interface WASMRefs {
  imageProcessor: WebAssembly.Instance;
  cryptoModule: WebAssembly.Instance;
  audioProcessor: WebAssembly.Instance;
  dataCompressor: WebAssembly.Instance;
}
```

## Context Creation Patterns

### Basic RefContext Setup
```typescript
// Simple DOM element refs
const {
  Provider: CanvasRefProvider,
  useRefHandler: useCanvasRef
} = createRefContext<CanvasRefs>('Canvas');

// Service refs with lazy loading
const {
  Provider: ServiceRefProvider,
  useRefHandler: useServiceRef,
  useWaitForRefs: useWaitForServices,
  useGetAllRefs: getAllServices
} = createRefContext<ServiceRefs>('Services');
```

### RefContext with Definitions
```typescript
// Advanced RefContext with configuration
interface ChartRefDefinitions {
  mainChart: {
    name: 'Main Dashboard Chart';
    type: any; // Chart.js instance
    required: true;
    timeout: 10000;
  };
  miniChart: {
    name: 'Mini Chart Widget';
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
    name: 'Main Dashboard Chart',
    type: {} as any, // Chart.js type
    required: true,
    timeout: 10000
  },
  miniChart: {
    name: 'Mini Chart Widget', 
    type: {} as any,
    required: false,
    timeout: 5000
  }
});
```

### Multi-Domain RefContext Setup
```typescript
// Performance Domain
const PerformanceRefContext = createRefContext<{
  canvas: HTMLCanvasElement;
  worker: Worker;
  wasmModule: WebAssembly.Instance;
}>('Performance');

// Media Domain
const MediaRefContext = createRefContext<{
  video: HTMLVideoElement;
  audio: AudioContext;
  stream: MediaStream;
}>('Media');

// External Services Domain
const ExternalRefContext = createRefContext<{
  analytics: typeof gtag;
  maps: any;
  payment: any;
}>('External');

// Extract providers and hooks
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

## Provider Setup Patterns

### Single RefContext Provider
```typescript
// Basic single ref provider
function App() {
  return (
    <CanvasRefProvider>
      <CanvasApplication />
    </CanvasRefProvider>
  );
}
```

### Multiple RefContext Providers
```typescript
// Manual nesting approach
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

// Using composeProviders utility (recommended)
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

### Integrated with Store and Action Contexts
```typescript
// Full MVVM setup with RefContext
const MVVMWithRefProviders = composeProviders([
  // Model Layer
  UserModelProvider,
  ProductModelProvider,
  
  // ViewModel Layer
  UserViewModelProvider,
  ProductViewModelProvider,
  
  // Performance Layer (RefContext)
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

### Conditional RefContext Setup
```typescript
// Conditional ref providers based on features and device capabilities
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
  
  // Always include basic UI refs
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

## Initialization Patterns

### Lazy Initialization
```typescript
// Component with lazy ref initialization
function ChartComponent() {
  const mainChart = useChartRef('mainChart');
  const miniChart = useChartRef('miniChart');
  
  useEffect(() => {
    // Lazy initialize main chart when needed
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
    
    // Conditional mini chart initialization
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
    
    // Cleanup on unmount
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

### Service Initialization
```typescript
// Service initialization with error handling
function useServiceInitialization() {
  const analytics = useExternalRef('analytics');
  const maps = useExternalRef('maps');
  const payment = useExternalRef('payment');
  
  useEffect(() => {
    // Analytics service
    if (!analytics.target && process.env.REACT_APP_GA_ID) {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.REACT_APP_GA_ID}`;
      script.onload = () => {
        window.gtag('config', process.env.REACT_APP_GA_ID!);
        analytics.setRef(window.gtag);
      };
      document.head.appendChild(script);
    }
    
    // Maps service
    if (!maps.target && process.env.REACT_APP_GOOGLE_MAPS_KEY) {
      import('google-maps').then(GoogleMaps => {
        GoogleMaps.KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY!;
        GoogleMaps.LANGUAGE = 'en';
        GoogleMaps.load().then(google => {
          maps.setRef(google.maps);
        });
      });
    }
    
    // Payment service
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

### Worker Initialization
```typescript
// Web Worker initialization pattern
function useWorkerInitialization() {
  const dataWorker = useWorkerRef('dataProcessingWorker');
  const imageWorker = useWorkerRef('imageProcessingWorker');
  
  useEffect(() => {
    // Data processing worker
    if (!dataWorker.target) {
      const worker = new Worker('/workers/data-processor.js');
      worker.onmessage = handleDataWorkerMessage;
      worker.onerror = handleDataWorkerError;
      dataWorker.setRef(worker);
    }
    
    // Image processing worker
    if (!imageWorker.target) {
      const worker = new Worker('/workers/image-processor.js');
      worker.onmessage = handleImageWorkerMessage;
      worker.onerror = handleImageWorkerError;
      imageWorker.setRef(worker);
    }
    
    // Cleanup workers
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
    throw new Error('Data worker not initialized');
  }, [dataWorker]);
  
  return { processData };
}
```

## Advanced Usage Patterns

### Waiting for Multiple Refs
```typescript
// Wait for multiple refs to be ready
function ComplexComponent() {
  const waitForRefs = useWaitForServices();
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // Wait for all required services
    waitForRefs('analytics', 'maps', 'payment').then((services) => {
      console.log('All services ready:', services);
      setIsReady(true);
    }).catch((error) => {
      console.error('Failed to initialize services:', error);
    });
  }, [waitForRefs]);
  
  if (!isReady) {
    return <div>Loading services...</div>;
  }
  
  return <div>Application ready!</div>;
}
```

### Ref Operations with Timeout
```typescript
// Safe ref operations with timeout and error handling
function CanvasDrawingComponent() {
  const canvas = useCanvasRef('mainCanvas');
  
  const drawOnCanvas = useCallback(async (drawingData: any) => {
    try {
      const result = await canvas.withTarget(
        (canvasElement) => {
          const ctx = canvasElement.getContext('2d')!;
          ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
          
          // Drawing operations
          drawingData.shapes.forEach((shape: any) => {
            ctx.beginPath();
            // ... drawing logic
            ctx.stroke();
          });
          
          return { success: true, shapesDrawn: drawingData.shapes.length };
        },
        { timeout: 5000, retries: 3 }
      );
      
      if (result.success) {
        console.log('Drawing completed:', result.data);
      }
    } catch (error) {
      console.error('Drawing failed:', error);
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
        Draw on Canvas
      </button>
    </div>
  );
}
```

## Export Patterns

### Named Exports (Recommended)
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

// Re-export for easy import
export {
  CanvasRefProvider,
  useCanvasRef,
  useWaitForCanvas,
  getAllCanvasRefs
};
```

### Barrel Exports
```typescript
// refs/index.ts - Barrel export file
export * from './CanvasRefs';
export * from './MediaRefs';
export * from './ServiceRefs';
export * from './WorkerRefs';

// Usage in components
import {
  useCanvasRef,
  useMediaRef,
  useServiceRef
} from '../refs';
```

### Domain Bundle Exports
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

## Best Practices

### Ref Management
1. **Lazy Initialization**: Only initialize refs when actually needed
2. **Cleanup**: Always clean up refs in useEffect cleanup functions
3. **Error Handling**: Implement proper error handling for ref operations
4. **Timeout Management**: Use appropriate timeouts for ref operations

### Performance Optimization
1. **Conditional Loading**: Load heavy refs only when features are enabled
2. **Device Adaptation**: Adapt ref initialization based on device capabilities
3. **Memory Management**: Properly dispose of heavy objects and services
4. **Worker Usage**: Use Web Workers for CPU-intensive operations

### Integration Patterns
1. **MVVM Architecture**: Use RefContext as Performance layer
2. **Provider Composition**: Combine with Store and Action contexts
3. **Feature Flags**: Conditionally load ref providers
4. **Environment Configuration**: Adapt refs based on environment

## Common Patterns Reference

This setup file provides reusable patterns for:

- **[Ref Basic Usage](../ref/basic-usage.md)** - Uses CanvasRefs pattern
- **[Canvas Optimization](../ref/canvas-optimization.md)** - Uses CanvasRefs and WorkerRefs
- **[Memory Optimization](../ref/memory-optimization.md)** - Uses service cleanup patterns
- **[MVVM Architecture](../architecture/mvvm.md)** - Uses RefContext as Performance layer
- **[Performance Patterns](../performance/optimization-techniques.md)** - Uses all ref patterns

## Related Setup Guides

- **[Basic Action Setup](./basic-action-setup.md)** - Action context setup patterns
- **[Basic Store Setup](./basic-store-setup.md)** - Store context setup patterns
- **[Multi-Context Setup](./multi-context-setup.md)** - Complex architecture integration
- **[Provider Composition Setup](./provider-composition-setup.md)** - Advanced composition techniques