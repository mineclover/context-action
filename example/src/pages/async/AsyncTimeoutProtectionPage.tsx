import { useCallback, useState, useEffect } from 'react';
import { createDeclarativeStorePattern, createActionContext, createRefContext, useStoreValue } from '@context-action/react';
import { PageWithLogMonitor, useActionLoggerWithToast } from '../../components/LogMonitor';

// Define action types for timeout protection demonstrations
interface TimeoutActions {
  basicTimeout: { elementKey: string; timeout: number };
  retryWithTimeout: { elementKey: string; maxRetries: number; timeout: number };
  progressiveTimeout: { elementKey: string };
  adaptiveTimeout: { elementKey: string; complexity: 'simple' | 'complex' | 'heavy' };
  circuitBreaker: { elementKey: string; operationId: string };
  performanceMonitored: { elementKey: string; timeout: number };
  fallbackStrategy: { primaryElement: string; secondaryElement: string; timeout: number };
}

// Ref types for timeout demonstrations
type TimeoutRefs = {
  quickElement: HTMLDivElement;
  slowElement: HTMLDivElement;
  unreliableElement: HTMLDivElement;
  primaryElement: HTMLDivElement;
  secondaryElement: HTMLDivElement;
  fallbackElement: HTMLDivElement;
  performanceElement: HTMLDivElement;
  circuitElement: HTMLDivElement;
};

// Store for tracking timeout operations
const {
  Provider: TimeoutStoreProvider,
  useStore: useTimeoutStore,
} = createDeclarativeStorePattern('Timeout', {
  timeoutStats: { 
    initialValue: {
      totalAttempts: 0,
      successCount: 0,
      timeoutCount: 0,
      retryCount: 0,
      averageResponseTime: 0,
      circuitBreakerState: 'closed' as 'closed' | 'open' | 'half-open',
      circuitBreakerFailures: 0,
      lastFailTime: 0
    }
  },
  operationMetrics: { 
    initialValue: [] as Array<{ 
      operation: string; 
      elementKey: string; 
      duration: number; 
      success: boolean; 
      timestamp: number;
      strategy: string;
    }> 
  },
  elementAvailability: {
    initialValue: {} as Record<string, { 
      available: boolean; 
      avgResponseTime: number; 
      successRate: number;
      lastChecked: number;
    }>
  }
});

// Action context
const {
  Provider: TimeoutActionProvider,
  useActionDispatch: useTimeoutAction,
  useActionHandler: useTimeoutActionHandler
} = createActionContext<TimeoutActions>('TimeoutActions');

// Ref context
const {
  Provider: TimeoutRefProvider,
  useRefHandler: useTimeoutRef,
  useWaitForRefs
} = createRefContext<TimeoutRefs>('TimeoutRefs');

// Timeout Services - Modular approach
class TimeoutService {
  private stores: any;
  private logger: any;
  
  constructor(stores: any, logger: any) {
    this.stores = stores;
    this.logger = logger;
  }
  
  // 기본 타임아웃 로직
  async executeBasicTimeout(elementKey: string, timeout: number, waitForRefs: any, elementRefs: any) {
    const startTime = performance.now();
    const timeoutStatsStore = this.stores.useTimeoutStore('timeoutStats');
    const operationMetricsStore = this.stores.useTimeoutStore('operationMetrics');
    
    try {
      this.logger.logSystem(`⏳ Basic timeout: ${elementKey} (${timeout}ms)`);
      
      // Update attempt count
      const stats = timeoutStatsStore.getValue();
      timeoutStatsStore.setValue({ ...stats, totalAttempts: stats.totalAttempts + 1 });
      
      // Execute with timeout
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
      ]);
      
      const duration = performance.now() - startTime;
      this.recordSuccess(elementKey, duration, 'basic', elementRefs);
      
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordFailure(elementKey, duration, 'basic', timeout, elementRefs);
      throw error;
    }
  }
  
  // 성공 기록
  private recordSuccess(elementKey: string, duration: number, strategy: string, elementRefs: any) {
    this.logger.logSystem(`✅ ${elementKey} succeeded in ${Math.round(duration)}ms`);
    
    const timeoutStatsStore = this.stores.useTimeoutStore('timeoutStats');
    const operationMetricsStore = this.stores.useTimeoutStore('operationMetrics');
    
    // Update stats
    const stats = timeoutStatsStore.getValue();
    timeoutStatsStore.setValue({
      ...stats,
      successCount: stats.successCount + 1,
      averageResponseTime: Math.round(
        (stats.averageResponseTime * stats.successCount + duration) / (stats.successCount + 1)
      )
    });
    
    // Update visual feedback
    this.updateElementVisual(elementKey, 'success', Math.round(duration), elementRefs);
    
    // Record metrics
    const metrics = operationMetricsStore.getValue();
    operationMetricsStore.setValue([
      ...metrics,
      {
        operation: 'timeout',
        elementKey,
        duration: Math.round(duration),
        success: true,
        timestamp: Date.now(),
        strategy
      }
    ]);
  }
  
  // 실패 기록
  private recordFailure(elementKey: string, duration: number, strategy: string, timeout: number, elementRefs: any) {
    this.logger.logSystem(`❌ ${elementKey} timeout after ${Math.round(duration)}ms`);
    
    const timeoutStatsStore = this.stores.useTimeoutStore('timeoutStats');
    const operationMetricsStore = this.stores.useTimeoutStore('operationMetrics');
    
    // Update stats
    const stats = timeoutStatsStore.getValue();
    timeoutStatsStore.setValue({
      ...stats,
      timeoutCount: stats.timeoutCount + 1
    });
    
    // Update visual feedback
    this.updateElementVisual(elementKey, 'failure', timeout, elementRefs);
    
    // Record metrics
    const metrics = operationMetricsStore.getValue();
    operationMetricsStore.setValue([
      ...metrics,
      {
        operation: 'timeout',
        elementKey,
        duration: Math.round(duration),
        success: false,
        timestamp: Date.now(),
        strategy
      }
    ]);
  }
  
  // 시각적 피드백 업데이트
  private updateElementVisual(elementKey: string, type: 'success' | 'failure', value: number, elementRefs: any) {
    const element = elementRefs[elementKey]?.target;
    if (!element) return;
    
    if (type === 'success') {
      element.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
      element.textContent = `✅ Success! (${value}ms)`;
    } else {
      element.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
      element.textContent = `❌ Timeout! (${value}ms exceeded)`;
    }
    element.style.color = 'white';
    
    setTimeout(() => {
      element.style.background = '';
      element.style.color = '';
      if (type === 'failure') {
        element.textContent = element.dataset.originalText || 'Element';
      }
    }, 2000);
  }
}

// Circuit breaker instance
const circuitBreaker = {
  state: 'closed' as 'closed' | 'open' | 'half-open',
  failures: 0,
  lastFailTime: 0,
  threshold: 3,
  resetTimeout: 10000, // 10 seconds
  
  canExecute(): boolean {
    const now = Date.now();
    
    // Reset circuit breaker if enough time has passed
    if (this.state === 'open' && now - this.lastFailTime > this.resetTimeout) {
      this.state = 'half-open';
      this.failures = 0;
    }
    
    return this.state !== 'open';
  },
  
  recordSuccess() {
    this.failures = 0;
    this.state = 'closed';
  },
  
  recordFailure() {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  },
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      canExecute: this.canExecute()
    };
  }
};

function AsyncTimeoutProtectionPageContent() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Timeout Protection Pattern</h1>
      <p className="text-lg text-gray-600 mb-8">
        Pattern for protecting against infinite waits with timeout mechanisms, retries, and fallback strategies.
        Essential for production applications to handle slow or unresponsive elements gracefully.
      </p>
      
      <TimeoutStoreProvider>
        <TimeoutActionProvider>
          <TimeoutRefProvider>
            <div className="space-y-8">
              <BasicTimeoutDemo />
              <RetryWithTimeoutDemo />
              <ProgressiveTimeoutDemo />
              <AdaptiveTimeoutDemo />
              <CircuitBreakerDemo />
              <PerformanceMonitoringDemo />
              <FallbackStrategyDemo />
              <TimeoutMetricsDisplay />
              <BestPracticesSection />
            </div>
          </TimeoutRefProvider>
        </TimeoutActionProvider>
      </TimeoutStoreProvider>
    </div>
  );
}

function BasicTimeoutDemo() {
  const logger = useActionLoggerWithToast();
  const [showQuick] = useState(true);
  const [showSlow, setShowSlow] = useState(false);
  const dispatch = useTimeoutAction();
  const quickElementRef = useTimeoutRef('quickElement');
  const slowElementRef = useTimeoutRef('slowElement');
  const waitForRefs = useWaitForRefs();
  const stores = { useTimeoutStore }; // Store manager for lazy access
  
  // Basic timeout handler - 극도로 양준화된 의존성!
  const basicTimeoutHandler = useCallback(async (payload) => {
    // 서비스 인스턴스 생성 (지연 평가)
    const timeoutService = new TimeoutService(stores, logger);
    
    // 요소 참조 맵 (지연 접근)
    const elementRefs = {
      quickElement: quickElementRef,
      slowElement: slowElementRef
    };
    
    // 모든 복잡한 로직은 서비스로 위임
    await timeoutService.executeBasicTimeout(
      payload.elementKey, 
      payload.timeout, 
      waitForRefs, 
      elementRefs
    );
  }, []);
  
  useTimeoutActionHandler('basicTimeout', basicTimeoutHandler);
  
  // Simulate slow element mounting
  useEffect(() => {
    if (showSlow) {
      const timer = setTimeout(() => {
        const element = slowElementRef.target;
        if (element) {
          element.dataset.originalText = 'Slow Element (Delayed Mount)';
        }
      }, 3000); // Mount after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showSlow, slowElementRef]);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-orange-600">Basic Timeout Pattern</h2>
      <p className="text-gray-600 mb-4">
        Fundamental timeout protection using Promise.race to prevent infinite waits.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Quick Element (Always Available)</h4>
            {showQuick && (
              <div
                ref={quickElementRef.setRef}
                className="p-4 bg-green-50 border border-green-200 rounded transition-all duration-300"
                data-original-text="Quick Element (Instant)"
              >
                Quick Element (Instant)
              </div>
            )}
            
            <div className="mt-3 space-x-2">
              <button
                onClick={() => dispatch('basicTimeout', { elementKey: 'quickElement', timeout: 1000 })}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Test 1s Timeout
              </button>
              
              <button
                onClick={() => dispatch('basicTimeout', { elementKey: 'quickElement', timeout: 100 })}
                className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
              >
                Test 100ms Timeout
              </button>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Slow Element (3s Delay)</h4>
            <button
              onClick={() => setShowSlow(!showSlow)}
              className="mb-2 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
            >
              {showSlow ? 'Hide' : 'Show'} Slow Element
            </button>
            
            {showSlow && (
              <div
                ref={slowElementRef.setRef}
                className="p-4 bg-orange-50 border border-orange-200 rounded transition-all duration-300"
                data-original-text="Slow Element (3s Delay)"
              >
                Slow Element (Mounting in 3s...)
              </div>
            )}
            
            <div className="mt-3 space-x-2">
              <button
                onClick={() => dispatch('basicTimeout', { elementKey: 'slowElement', timeout: 5000 })}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Test 5s Timeout (Will Succeed)
              </button>
              
              <button
                onClick={() => dispatch('basicTimeout', { elementKey: 'slowElement', timeout: 1000 })}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Test 1s Timeout (Will Fail)
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Basic Timeout Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const waitWithTimeout = useCallback(async (elementKey: string, timeout = 5000) => {
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
    return true;
  } catch (error) {
    console.warn('Element not available, using fallback');
    return false;
  }
}, [waitForRefs]);`}
        </pre>
      </div>
    </section>
  );
}

function RetryWithTimeoutDemo() {
  const logger = useActionLoggerWithToast();
  const [showUnreliable, setShowUnreliable] = useState(false);
  const dispatch = useTimeoutAction();
  const unreliableElementRef = useTimeoutRef('unreliableElement');
  const waitForRefs = useWaitForRefs();
  const stores = { useTimeoutStore };
  
  // Retry with timeout handler - minimal dependencies
  const retryTimeoutHandler = useCallback(async (payload) => {
    const startTime = performance.now();
    
    // Lazy store evaluation
    const timeoutStatsStore = stores.useTimeoutStore('timeoutStats');
    
    logger.logSystem(`🔄 Starting retry strategy: ${payload.maxRetries} retries, ${payload.timeout}ms timeout each`);
    
    for (let attempt = 1; attempt <= payload.maxRetries; attempt++) {
      try {
        logger.logSystem(`📍 Attempt ${attempt}/${payload.maxRetries}`);
        
        await Promise.race([
          waitForRefs(payload.elementKey as keyof TimeoutRefs),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout on attempt ${attempt}`)), payload.timeout)
          )
        ]);
        
        const duration = performance.now() - startTime;
        logger.logSystem(`✅ Success on attempt ${attempt} after ${Math.round(duration)}ms`);
        
        // Update element on success - lazy ref access
        const element = unreliableElementRef.target;
        if (element) {
          element.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
          element.textContent = `✅ Success on attempt ${attempt}!`;
          element.style.color = 'white';
        }
        
        // Update stats - fresh evaluation
        const stats = timeoutStatsStore.getValue();
        timeoutStatsStore.setValue({
          ...stats,
          successCount: stats.successCount + 1,
          retryCount: stats.retryCount + (attempt - 1)
        });
        
        break; // Exit loop on success
        
      } catch (error) {
        logger.logSystem(`⚠️ Attempt ${attempt} failed: ${error}`);
        
        if (attempt === payload.maxRetries) {
          const duration = performance.now() - startTime;
          logger.logSystem(`❌ All ${payload.maxRetries} attempts failed after ${Math.round(duration)}ms`);
          
          // Update stats for failure - fresh evaluation
          const stats = timeoutStatsStore.getValue();
          timeoutStatsStore.setValue({
            ...stats,
            timeoutCount: stats.timeoutCount + 1,
            retryCount: stats.retryCount + payload.maxRetries
          });
          
          // Visual feedback for failure - lazy ref access
          const element = unreliableElementRef.target;
          if (element) {
            element.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
            element.textContent = `❌ Failed after ${payload.maxRetries} attempts`;
            element.style.color = 'white';
          }
        } else {
          // Wait before retry
          logger.logSystem(`⏳ Waiting 500ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }
  }, []); // 더 간단한 의존성!
  
  useTimeoutActionHandler('retryWithTimeout', retryTimeoutHandler);
  
  // Simulate unreliable element
  useEffect(() => {
    if (showUnreliable) {
      // Randomly delay element mounting
      const delay = Math.random() * 4000 + 500; // 0.5s to 4.5s random delay
      const timer = setTimeout(() => {
        const element = unreliableElementRef.target;
        if (element) {
          element.textContent = 'Unreliable Element (Finally Ready!)';
        }
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [showUnreliable, unreliableElementRef]);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-yellow-600">Retry with Timeout</h2>
      <p className="text-gray-600 mb-4">
        Advanced pattern with multiple retry attempts and configurable timeouts per attempt.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowUnreliable(!showUnreliable)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {showUnreliable ? 'Hide' : 'Show'} Unreliable Element
          </button>
          
          <span className="text-sm text-gray-600">
            (Mounts randomly between 0.5s - 4.5s)
          </span>
        </div>
        
        {showUnreliable && (
          <div
            ref={unreliableElementRef.setRef}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded transition-all duration-300"
          >
            Unreliable Element (Loading...)
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => dispatch('retryWithTimeout', { 
              elementKey: 'unreliableElement', 
              maxRetries: 3, 
              timeout: 2000 
            })}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Try 3 Times (2s each)
          </button>
          
          <button
            onClick={() => dispatch('retryWithTimeout', { 
              elementKey: 'unreliableElement', 
              maxRetries: 5, 
              timeout: 1000 
            })}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Try 5 Times (1s each)
          </button>
          
          <button
            onClick={() => dispatch('retryWithTimeout', { 
              elementKey: 'unreliableElement', 
              maxRetries: 2, 
              timeout: 500 
            })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Try 2 Times (500ms each)
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Retry Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const waitWithRetry = useCallback(async (
  elementKey: string, 
  maxRetries = 3, 
  timeout = 2000
) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(\`Timeout on attempt \${attempt}\`)), timeout)
        )
      ]);
      return true;
    } catch (error) {
      console.warn(\`Attempt \${attempt} failed:\`, error.message);
      
      if (attempt === maxRetries) {
        console.error('All attempts failed, using fallback');
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return false;
}, [waitForRefs]);`}
        </pre>
      </div>
    </section>
  );
}

function ProgressiveTimeoutDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useTimeoutAction();
  const performanceElementRef = useTimeoutRef('performanceElement');
  const waitForRefs = useWaitForRefs();
  const [showPerformance, setShowPerformance] = useState(false);
  const [mountDelay, setMountDelay] = useState(2000);
  const stores = { useTimeoutStore };
  
  // Progressive timeout handler - 완전히 모듈화된 패턴!
  const progressiveTimeoutHandler = useCallback(async (payload) => {
    const timeouts = [500, 1500, 3000, 5000];
    
    logger.logSystem(`📈 Progressive timeout: ${payload.elementKey}`);
    logger.logSystem(`⏱️ Phases: ${timeouts.join('ms → ')}ms`);
    
    for (let i = 0; i < timeouts.length; i++) {
      try {
        logger.logSystem(`📍 Phase ${i + 1}: ${timeouts[i]}ms timeout`);
        
        await Promise.race([
          waitForRefs(payload.elementKey as keyof TimeoutRefs),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Phase ${i + 1} timeout`)), timeouts[i])
          )
        ]);
        
        // 성공 - 시각적 피드백
        logger.logSystem(`✅ Success in phase ${i + 1}`);
        const element = performanceElementRef.target;
        if (element) {
          element.style.background = `linear-gradient(45deg, hsl(${120 - i * 30}, 70%, 50%), hsl(${120 - i * 30}, 70%, 40%))`;
          element.textContent = `✅ Phase ${i + 1} success!`;
          element.style.color = 'white';
        }
        return; // 성공 시 종료
        
      } catch (error) {
        logger.logSystem(`⚠️ Phase ${i + 1} failed`);
        
        if (i === timeouts.length - 1) {
          // 마지막 시도 실패
          logger.logSystem(`❌ All phases exhausted`);
          const element = performanceElementRef.target;
          if (element) {
            element.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
            element.textContent = `❌ All phases failed`;
            element.style.color = 'white';
          }
        } else {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    }
  }, []); // 의존성 완전 없음!
  
  useTimeoutActionHandler('progressiveTimeout', progressiveTimeoutHandler);
  
  // Simulate element with configurable delay
  useEffect(() => {
    if (showPerformance) {
      const timer = setTimeout(() => {
        const element = performanceElementRef.target;
        if (element) {
          element.textContent = `Performance Element (Mounted after ${mountDelay}ms)`;
        }
      }, mountDelay);
      
      return () => clearTimeout(timer);
    }
  }, [showPerformance, mountDelay, performanceElementRef]);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-green-600">Progressive Timeout Strategy</h2>
      <p className="text-gray-600 mb-4">
        Progressively increases timeout duration to balance between quick response and reliability.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowPerformance(!showPerformance)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {showPerformance ? 'Hide' : 'Show'} Performance Element
          </button>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Mount Delay:</label>
            <select
              value={mountDelay}
              onChange={(e) => setMountDelay(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value={300}>300ms (Phase 1)</option>
              <option value={1000}>1000ms (Phase 2)</option>
              <option value={2000}>2000ms (Phase 3)</option>
              <option value={4000}>4000ms (Phase 4)</option>
              <option value={6000}>6000ms (Will Fail)</option>
            </select>
          </div>
        </div>
        
        {showPerformance && (
          <div
            ref={performanceElementRef.setRef}
            className="p-4 bg-green-50 border border-green-200 rounded transition-all duration-300"
          >
            Performance Element (Mounting in {mountDelay}ms...)
          </div>
        )}
        
        <button
          onClick={() => dispatch('progressiveTimeout', { elementKey: 'performanceElement' })}
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Progressive Timeout (500ms → 1.5s → 3s → 5s)
        </button>
        
        <div className="p-4 bg-green-50 rounded border border-green-200">
          <h4 className="font-semibold text-green-700 mb-2">Progressive Phases:</h4>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="text-center p-2 bg-white rounded">
              <div className="font-medium">Phase 1</div>
              <div className="text-green-600">500ms</div>
              <div className="text-xs text-gray-500">Quick check</div>
            </div>
            <div className="text-center p-2 bg-white rounded">
              <div className="font-medium">Phase 2</div>
              <div className="text-yellow-600">1500ms</div>
              <div className="text-xs text-gray-500">Standard wait</div>
            </div>
            <div className="text-center p-2 bg-white rounded">
              <div className="font-medium">Phase 3</div>
              <div className="text-orange-600">3000ms</div>
              <div className="text-xs text-gray-500">Extended wait</div>
            </div>
            <div className="text-center p-2 bg-white rounded">
              <div className="font-medium">Phase 4</div>
              <div className="text-red-600">5000ms</div>
              <div className="text-xs text-gray-500">Final attempt</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AdaptiveTimeoutDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useTimeoutAction();
  const [complexity, setComplexity] = useState<'simple' | 'complex' | 'heavy'>('simple');
  
  // Adaptive timeout - 완전히 상태리스 패턴!
  const adaptiveTimeoutHandler = useCallback(async (payload) => {
    const timeouts = { simple: 1000, complex: 3000, heavy: 6000 };
    const delays = { simple: 500, complex: 2000, heavy: 4500 };
    
    const timeout = timeouts[payload.complexity];
    const delay = delays[payload.complexity];
    
    logger.logSystem(`🎯 ${payload.complexity} timeout: ${timeout}ms`);
    
    try {
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, delay)),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Adaptive timeout')), timeout))
      ]);
      
      logger.logSystem(`✅ ${payload.complexity} operation completed`);
    } catch (error) {
      logger.logSystem(`❌ ${payload.complexity} operation timeout`);
    }
  }, []); // 상태리스함수로 의존성 제거!
  
  useTimeoutActionHandler('adaptiveTimeout', adaptiveTimeoutHandler);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-blue-600">Adaptive Timeout Strategy</h2>
      <p className="text-gray-600 mb-4">
        Adjusts timeout duration based on operation complexity for optimal performance.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="font-medium">Operation Complexity:</label>
          <select
            value={complexity}
            onChange={(e) => setComplexity(e.target.value as typeof complexity)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="simple">Simple (500ms operation)</option>
            <option value="complex">Complex (2s operation)</option>
            <option value="heavy">Heavy (4.5s operation)</option>
          </select>
        </div>
        
        <button
          onClick={() => dispatch('adaptiveTimeout', { elementKey: 'adaptiveElement', complexity })}
          className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Execute {complexity.charAt(0).toUpperCase() + complexity.slice(1)} Operation
        </button>
        
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded border-2 transition-all ${
            complexity === 'simple' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}>
            <h4 className="font-semibold text-green-700">Simple</h4>
            <div className="text-sm text-gray-600 mt-2">
              <div>Operation: ~500ms</div>
              <div>Timeout: 1000ms</div>
              <div className="text-green-600 font-medium">✅ Will Succeed</div>
            </div>
          </div>
          
          <div className={`p-4 rounded border-2 transition-all ${
            complexity === 'complex' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
          }`}>
            <h4 className="font-semibold text-yellow-700">Complex</h4>
            <div className="text-sm text-gray-600 mt-2">
              <div>Operation: ~2000ms</div>
              <div>Timeout: 3000ms</div>
              <div className="text-yellow-600 font-medium">✅ Will Succeed</div>
            </div>
          </div>
          
          <div className={`p-4 rounded border-2 transition-all ${
            complexity === 'heavy' ? 'border-red-500 bg-red-50' : 'border-gray-200'
          }`}>
            <h4 className="font-semibold text-red-700">Heavy</h4>
            <div className="text-sm text-gray-600 mt-2">
              <div>Operation: ~4500ms</div>
              <div>Timeout: 6000ms</div>
              <div className="text-green-600 font-medium">✅ Will Succeed</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Adaptive Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const adaptiveTimeout = useCallback(async (elementKey: string, complexity: 'simple' | 'complex' | 'heavy') => {
  const timeoutMap = {
    simple: 2000,
    complex: 5000,
    heavy: 10000
  };
  
  const timeout = timeoutMap[complexity];
  
  try {
    await Promise.race([
      waitForRefs(elementKey),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(\`Adaptive timeout for \${complexity} operation\`)), timeout)
      )
    ]);
    return true;
  } catch (error) {
    console.warn(\`Adaptive timeout failed for \${complexity} operation:\`, error.message);
    return false;
  }
}, [waitForRefs]);`}
        </pre>
      </div>
    </section>
  );
}

function CircuitBreakerDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useTimeoutAction();
  const circuitElementRef = useTimeoutRef('circuitElement');
  const [failureRate, setFailureRate] = useState(0.5);
  const stores = { useTimeoutStore };
  
  // Circuit breaker handler - 완전히 상태리스한 회로 차단기!
  const circuitBreakerHandler = useCallback(async (payload) => {
    const timeoutStatsStore = stores.useTimeoutStore('timeoutStats');
    const stats = timeoutStatsStore.getValue();
    
    // Check circuit breaker state
    if (!circuitBreaker.canExecute()) {
      logger.logSystem(`🚫 Circuit breaker is OPEN - Fast failing operation ${payload.operationId}`);
      
      timeoutStatsStore.setValue({
        ...stats,
        circuitBreakerState: 'open'
      });
      
      throw new Error('Circuit breaker is open');
    }
    
    logger.logSystem(`⚡ Circuit breaker state: ${circuitBreaker.getState().state.toUpperCase()}`);
    logger.logSystem(`🔄 Executing operation ${payload.operationId}`);
    
    try {
      // Simulate operation with configurable failure rate
      const willFail = Math.random() < failureRate;
      
      if (willFail) {
        throw new Error(`Operation ${payload.operationId} failed`);
      }
      
      // Simulate successful operation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      logger.logSystem(`✅ Operation ${payload.operationId} succeeded`);
      circuitBreaker.recordSuccess();
      
      // Update visual feedback
      const element = circuitElementRef.target;
      if (element) {
        element.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        element.textContent = `✅ Success - Circuit: ${circuitBreaker.getState().state}`;
        element.style.color = 'white';
      }
      
      timeoutStatsStore.setValue({
        ...stats,
        circuitBreakerState: circuitBreaker.getState().state,
        circuitBreakerFailures: circuitBreaker.failures
      });
      
      // Don't return anything from ActionHandler
      
    } catch (error) {
      logger.logSystem(`❌ Operation ${payload.operationId} failed: ${error}`);
      circuitBreaker.recordFailure();
      
      const state = circuitBreaker.getState();
      logger.logSystem(`📊 Circuit breaker: ${state.failures}/${circuitBreaker.threshold} failures`);
      
      // Update visual feedback
      const element = circuitElementRef.target;
      if (element) {
        if (state.state === 'open') {
          element.style.background = 'linear-gradient(45deg, #f44336, #d32f2f)';
          element.textContent = `🚫 Circuit OPEN - ${state.failures} failures`;
        } else {
          element.style.background = 'linear-gradient(45deg, #FF9800, #F57C00)';
          element.textContent = `⚠️ Failure ${state.failures}/${circuitBreaker.threshold}`;
        }
        element.style.color = 'white';
      }
      
      timeoutStatsStore.setValue({
        ...stats,
        circuitBreakerState: state.state,
        circuitBreakerFailures: state.failures,
        lastFailTime: Date.now()
      });
      
      throw error;
    }
  }, []); // 상태리스 액세스로 의존성 없음!
  
  useTimeoutActionHandler('circuitBreaker', circuitBreakerHandler);
  
  const resetCircuitBreaker = useCallback(() => {
    circuitBreaker.state = 'closed';
    circuitBreaker.failures = 0;
    circuitBreaker.lastFailTime = 0;
    
    // 지연 스토어 업데이트
    const timeoutStatsStore = stores.useTimeoutStore('timeoutStats');
    const stats = timeoutStatsStore.getValue();
    timeoutStatsStore.setValue({
      ...stats,
      circuitBreakerState: 'closed',
      circuitBreakerFailures: 0
    });
    
    logger.logSystem('🔄 Circuit breaker reset');
  }, []); // 완전히 상태리스!
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-red-600">Circuit Breaker Pattern</h2>
      <p className="text-gray-600 mb-4">
        Prevents cascading failures by fast-failing when error threshold is reached.
      </p>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <label className="font-medium">Failure Rate:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={failureRate}
            onChange={(e) => setFailureRate(Number(e.target.value))}
            className="w-32"
          />
          <span className="font-mono">{(failureRate * 100).toFixed(0)}%</span>
        </div>
        
        <div
          ref={circuitElementRef.setRef}
          className="p-4 bg-gray-50 border border-gray-200 rounded transition-all duration-300"
        >
          Circuit Breaker Status - Ready
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => dispatch('circuitBreaker', { 
              elementKey: 'circuitElement', 
              operationId: `op_${Date.now()}` 
            })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Execute Operation
          </button>
          
          <button
            onClick={resetCircuitBreaker}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset Circuit Breaker
          </button>
        </div>
        
        <CircuitBreakerStatus />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Circuit Breaker Concept:</h4>
        <div className="text-sm space-y-2">
          <p>• <strong>Closed:</strong> Normal operation, requests pass through</p>
          <p>• <strong>Open:</strong> Fast fail after threshold failures (3 in this demo)</p>
          <p>• <strong>Half-Open:</strong> Test if service recovered (after 10s timeout)</p>
        </div>
      </div>
    </section>
  );
}

function PerformanceMonitoringDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useTimeoutAction();
  const stores = { useTimeoutStore };
  
  // Performance timeout - 최소화된 의존성으로 모니터링!
  const performanceMonitoredHandler = useCallback(async (payload) => {
    const startTime = performance.now();
    const memoryBefore = (performance as any).memory?.usedJSHeapSize || 0;
    
    logger.logSystem(`📊 Performance monitoring: ${payload.timeout}ms timeout`);
    
    try {
      // Simulate operation with random delay
      const operationDelay = Math.random() * payload.timeout * 0.9;
      
      await Promise.race([
        new Promise(resolve => setTimeout(resolve, operationDelay)),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Performance timeout')), payload.timeout)
        )
      ]);
      
      const duration = performance.now() - startTime;
      const memoryAfter = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryDelta = memoryAfter - memoryBefore;
      
      logger.logSystem(`✅ Operation completed in ${duration.toFixed(2)}ms`);
      
      // Log performance metrics
      if (duration > payload.timeout * 0.8) {
        logger.logSystem(`⚠️ SLOW: Operation took ${(duration / payload.timeout * 100).toFixed(0)}% of timeout`);
      }
      
      if (memoryDelta > 1000000) { // 1MB
        logger.logSystem(`⚠️ HIGH MEMORY: ${(memoryDelta / 1000000).toFixed(2)}MB allocated`);
      }
      
      // Record metrics - lazy store access
      const operationMetricsStore = stores.useTimeoutStore('operationMetrics');
      const metrics = operationMetricsStore.getValue();
      operationMetricsStore.setValue([
        ...metrics.slice(-19), // Keep last 20 metrics
        {
          operation: 'performanceMonitored',
          elementKey: payload.elementKey,
          duration: Math.round(duration),
          success: true,
          timestamp: Date.now(),
          strategy: 'monitored'
        }
      ]);
      
      // Don't return anything from ActionHandler
      
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.logSystem(`❌ Performance timeout after ${duration.toFixed(2)}ms`);
      
      // Record failure metric - lazy store access
      const operationMetricsStore = stores.useTimeoutStore('operationMetrics');
      const metrics = operationMetricsStore.getValue();
      operationMetricsStore.setValue([
        ...metrics.slice(-19),
        {
          operation: 'performanceMonitored',
          elementKey: payload.elementKey,
          duration: Math.round(duration),
          success: false,
          timestamp: Date.now(),
          strategy: 'monitored'
        }
      ]);
      
      throw error;
    }
  }, []); // 완전히 상태리스 모니터링!
  
  useTimeoutActionHandler('performanceMonitored', performanceMonitoredHandler);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-purple-600">Performance Monitoring</h2>
      <p className="text-gray-600 mb-4">
        Timeout with detailed performance metrics and slow operation detection.
      </p>
      
      <div className="space-y-4">
        <div className="flex gap-3">
          <button
            onClick={() => dispatch('performanceMonitored', { elementKey: 'performanceElement', timeout: 1000 })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Fast Operation (1s timeout)
          </button>
          
          <button
            onClick={() => dispatch('performanceMonitored', { elementKey: 'performanceElement', timeout: 3000 })}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            Normal Operation (3s timeout)
          </button>
          
          <button
            onClick={() => dispatch('performanceMonitored', { elementKey: 'performanceElement', timeout: 5000 })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Slow Operation (5s timeout)
          </button>
        </div>
        
        <PerformanceMetricsChart />
      </div>
    </section>
  );
}

function FallbackStrategyDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useTimeoutAction();
  const primaryElementRef = useTimeoutRef('primaryElement');
  const secondaryElementRef = useTimeoutRef('secondaryElement');
  const fallbackElementRef = useTimeoutRef('fallbackElement');
  const waitForRefs = useWaitForRefs();
  const [showPrimary, setShowPrimary] = useState(false);
  const [showSecondary, setShowSecondary] = useState(true);
  
  // Fallback strategy handler
  const fallbackStrategyHandler = useCallback(async (payload) => {
    logger.logSystem('🔄 Starting fallback strategy workflow');
    
    const waitWithTimeout = async (elementKey: keyof TimeoutRefs, timeout: number) => {
      try {
        await Promise.race([
          waitForRefs(elementKey),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout for ${elementKey}`)), timeout)
          )
        ]);
        return true;
      } catch {
        return false;
      }
    };
    
    // Try primary element
    logger.logSystem(`1️⃣ Attempting primary element with ${payload.timeout}ms timeout`);
    const primarySuccess = await waitWithTimeout(payload.primaryElement as keyof TimeoutRefs, payload.timeout);
    
    if (primarySuccess) {
      logger.logSystem('✅ Primary element available - using primary strategy');
      const element = primaryElementRef.target;
      if (element) {
        element.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        element.textContent = '✅ Primary Strategy Succeeded!';
        element.style.color = 'white';
      }
      // Don't return anything from ActionHandler
      return;
    }
    
    // Fallback to secondary element
    logger.logSystem(`2️⃣ Primary failed, attempting secondary element with ${payload.timeout}ms timeout`);
    const secondarySuccess = await waitWithTimeout(payload.secondaryElement as keyof TimeoutRefs, payload.timeout);
    
    if (secondarySuccess) {
      logger.logSystem('✅ Secondary element available - using fallback strategy');
      const element = secondaryElementRef.target;
      if (element) {
        element.style.background = 'linear-gradient(45deg, #FF9800, #F57C00)';
        element.textContent = '⚠️ Using Secondary Fallback';
        element.style.color = 'white';
      }
      // Don't return anything from ActionHandler
      return;
    }
    
    // Final fallback
    logger.logSystem('3️⃣ Both primary and secondary failed - using final fallback');
    const element = fallbackElementRef.target;
    if (element) {
      element.style.background = 'linear-gradient(45deg, #9E9E9E, #757575)';
      element.textContent = '🔄 Using Final Fallback (Always Available)';
      element.style.color = 'white';
    }
    
    // Don't return anything from ActionHandler
  }, []); // 완전히 상태리스 폴백 전략!
  
  useTimeoutActionHandler('fallbackStrategy', fallbackStrategyHandler);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-600">Fallback Strategy</h2>
      <p className="text-gray-600 mb-4">
        Multi-tier fallback system with primary, secondary, and final fallback options.
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">Primary (Preferred)</h4>
              <button
                onClick={() => setShowPrimary(!showPrimary)}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              >
                {showPrimary ? 'Hide' : 'Show'}
              </button>
            </div>
            {showPrimary && (
              <div
                ref={primaryElementRef.setRef}
                className="p-3 bg-green-50 border border-green-200 rounded transition-all duration-300 text-sm"
              >
                Primary Element
              </div>
            )}
            {!showPrimary && (
              <div className="p-3 bg-gray-100 border border-gray-300 rounded text-gray-500 text-sm">
                Not Available
              </div>
            )}
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">Secondary (Fallback)</h4>
              <button
                onClick={() => setShowSecondary(!showSecondary)}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
              >
                {showSecondary ? 'Hide' : 'Show'}
              </button>
            </div>
            {showSecondary && (
              <div
                ref={secondaryElementRef.setRef}
                className="p-3 bg-orange-50 border border-orange-200 rounded transition-all duration-300 text-sm"
              >
                Secondary Element
              </div>
            )}
            {!showSecondary && (
              <div className="p-3 bg-gray-100 border border-gray-300 rounded text-gray-500 text-sm">
                Not Available
              </div>
            )}
          </div>
          
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Final (Always Available)</h4>
            <div
              ref={fallbackElementRef.setRef}
              className="p-3 bg-gray-50 border border-gray-200 rounded transition-all duration-300 text-sm"
            >
              Fallback Element
            </div>
          </div>
        </div>
        
        <button
          onClick={() => dispatch('fallbackStrategy', { 
            primaryElement: 'primaryElement',
            secondaryElement: 'secondaryElement',
            timeout: 1500
          })}
          className="px-6 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
        >
          Execute with Fallback Strategy (1.5s timeout each)
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Fallback Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`const robustOperation = useCallback(async () => {
  try {
    // Try primary element
    const primarySuccess = await waitWithTimeout('primaryElement', 2000);
    
    if (primarySuccess) {
      return performPrimaryOperation();
    }
    
    // Fallback to secondary element
    const secondarySuccess = await waitWithTimeout('secondaryElement', 2000);
    
    if (secondarySuccess) {
      return performSecondaryOperation();
    }
    
    // Final fallback
    return performFallbackOperation();
    
  } catch (error) {
    console.error('All operations failed:', error);
    return null;
  }
}, [waitWithTimeout]);`}
        </pre>
      </div>
    </section>
  );
}

// Helper components
function TimeoutMetricsDisplay() {
  const timeoutStatsStore = useTimeoutStore('timeoutStats');
  const operationMetricsStore = useTimeoutStore('operationMetrics');
  const stats = useStoreValue(timeoutStatsStore);
  const metrics = useStoreValue(operationMetricsStore);
  
  const successRate = stats.totalAttempts > 0 
    ? ((stats.successCount / stats.totalAttempts) * 100).toFixed(1)
    : '0.0';
  
  // Removed unused avgRetries variable
  
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Timeout Metrics Dashboard</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-gray-600">Total Attempts</div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalAttempts}</div>
        </div>
        
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-gray-600">Success Rate</div>
          <div className="text-2xl font-bold text-green-600">{successRate}%</div>
        </div>
        
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-gray-600">Timeouts</div>
          <div className="text-2xl font-bold text-red-600">{stats.timeoutCount}</div>
        </div>
        
        <div className="bg-white p-4 rounded border">
          <div className="text-sm text-gray-600">Avg Response</div>
          <div className="text-2xl font-bold text-blue-600">{stats.averageResponseTime}ms</div>
        </div>
      </div>
      
      {metrics.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Recent Operations</h3>
          <div className="space-y-2">
            {metrics.slice(-5).reverse().map((metric) => (
              <div key={metric.timestamp} className="bg-white p-3 rounded border flex justify-between items-center text-sm">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${metric.success ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-medium">{metric.operation}</span>
                  <span className="text-gray-500">({metric.strategy})</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono">{metric.duration}ms</span>
                  <span className="text-xs text-gray-500">
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CircuitBreakerStatus() {
  const timeoutStatsStore = useTimeoutStore('timeoutStats');
  const stats = useStoreValue(timeoutStatsStore);
  
  const stateColor = {
    closed: 'text-green-600 bg-green-50',
    open: 'text-red-600 bg-red-50',
    'half-open': 'text-yellow-600 bg-yellow-50'
  }[stats.circuitBreakerState] || 'text-gray-600 bg-gray-50';
  
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h4 className="font-semibold text-red-700 mb-2">Circuit Breaker Status</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">State:</span>
          <span className={`ml-2 px-2 py-1 rounded ${stateColor}`}>
            {stats.circuitBreakerState.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="font-medium">Failures:</span>
          <span className="ml-2 font-mono">{stats.circuitBreakerFailures}/3</span>
        </div>
      </div>
    </div>
  );
}

function PerformanceMetricsChart() {
  const operationMetricsStore = useTimeoutStore('operationMetrics');
  const metrics = useStoreValue(operationMetricsStore);
  const performanceMetrics = metrics.filter(m => m.operation === 'performanceMonitored').slice(-10);
  
  if (performanceMetrics.length === 0) {
    return (
      <div className="p-4 bg-purple-50 border border-purple-200 rounded text-center text-gray-600">
        No performance metrics yet. Execute some operations to see the chart.
      </div>
    );
  }
  
  const maxDuration = Math.max(...performanceMetrics.map(m => m.duration));
  
  return (
    <div className="p-4 bg-purple-50 border border-purple-200 rounded">
      <h4 className="font-semibold text-purple-700 mb-3">Performance Timeline</h4>
      <div className="space-y-2">
        {performanceMetrics.map((metric) => (
          <div key={metric.timestamp} className="flex items-center gap-2 text-sm">
            <span className="w-20 text-xs text-gray-600">
              {new Date(metric.timestamp).toLocaleTimeString()}
            </span>
            <div className="flex-1 bg-white rounded p-1">
              <div
                className={`h-4 rounded ${metric.success ? 'bg-purple-500' : 'bg-red-500'}`}
                style={{ width: `${(metric.duration / maxDuration) * 100}%` }}
              />
            </div>
            <span className="w-16 text-right font-mono text-xs">
              {metric.duration}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BestPracticesSection() {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Timeout Protection Best Practices</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-green-600 mb-3">✅ Best Practices</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Set Reasonable Timeouts:</strong> Based on expected loading times</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Implement Fallbacks:</strong> Always have a backup strategy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Log Timeout Events:</strong> For debugging and monitoring</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Use Progressive Strategies:</strong> Start with short timeouts, increase gradually</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Monitor Performance:</strong> Track timeout frequency and duration</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span><strong>Handle Gracefully:</strong> Don't let timeouts crash the application</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-blue-600 mb-3">🎯 Common Use Cases</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Network-dependent Elements:</strong> Elements loaded via API</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Complex Animations:</strong> Heavy rendering operations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Third-party Widgets:</strong> External components with variable load times</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Dynamic Content:</strong> User-generated or CMS content</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span><strong>Progressive Web Apps:</strong> Service worker dependent features</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-white rounded border">
        <h3 className="font-semibold text-gray-700 mb-2">Strategy Selection Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Basic Timeout:</strong> Simple operations with predictable timing
          </div>
          <div>
            <strong>Retry with Timeout:</strong> Unreliable or intermittent elements
          </div>
          <div>
            <strong>Progressive Timeout:</strong> Unknown response times
          </div>
          <div>
            <strong>Adaptive Timeout:</strong> Operations with varying complexity
          </div>
          <div>
            <strong>Circuit Breaker:</strong> Protecting against cascading failures
          </div>
          <div>
            <strong>Fallback Strategy:</strong> Critical operations needing guarantees
          </div>
        </div>
      </div>
    </section>
  );
}

function AsyncTimeoutProtectionPage() {
  return (
    <PageWithLogMonitor pageId="async-timeout-protection">
      <AsyncTimeoutProtectionPageContent />
    </PageWithLogMonitor>
  );
}

export default AsyncTimeoutProtectionPage;