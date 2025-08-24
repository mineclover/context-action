import { useCallback, useState, useEffect } from 'react';
import { createDeclarativeStorePattern, createActionContext, createRefContext } from '@context-action/react';
import { LogMonitorProvider, useLogMonitor } from '../../components/LogMonitor';

// Define async-related types
interface AsyncActions {
  realTimeStateAccess: { operation: string };
  waitThenExecute: { elementKey: string; content: string };
  timeoutProtected: { elementKey: string; timeout?: number };
  complexAsyncOperation: void;
}

type AsyncRefs = {
  dynamicElement: HTMLDivElement;
  animationTarget: HTMLDivElement;
  timeoutElement: HTMLDivElement;
  conditionalElement: HTMLDivElement;
};

// Store patterns for async operations
const {
  Provider: AsyncStoreProvider,
  useStore: useAsyncStore,
  useStoreManager: useAsyncStoreManager
} = createDeclarativeStorePattern('AsyncDemo', {
  isProcessing: { initialValue: false },
  isMounted: { initialValue: false },
  elementReady: { initialValue: false },
  retryCount: { initialValue: 0 },
  lastOperation: { initialValue: '' },
  operationResults: { 
    initialValue: [] as Array<{ 
      timestamp: number; 
      operation: string; 
      success: boolean; 
      duration: number; 
    }>
  }
});

// Action context for async operations
const {
  Provider: AsyncActionProvider,
  useActionDispatch: useAsyncAction,
  useActionHandler: useAsyncActionHandler
} = createActionContext<AsyncActions>('AsyncActions');

// Ref context for DOM manipulation
const {
  Provider: AsyncRefProvider,
  useRefHandler: useAsyncRef,
  useWaitForRefs
} = createRefContext<AsyncRefs>('AsyncRefs');

function AsyncBasicUsagePage() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Async Basic Usage</h1>
      <p className="text-lg text-gray-600 mb-8">
        Comprehensive examples of async patterns including real-time state access, 
        wait-then-execute, timeout protection, and conditional await strategies.
      </p>
      
      <LogMonitorProvider>
        <AsyncStoreProvider>
          <AsyncActionProvider>
            <AsyncRefProvider>
              <div className="space-y-8">
                <RealTimeStateAccessDemo />
                <WaitThenExecuteDemo />
                <TimeoutProtectionDemo />
                <ConditionalAwaitDemo />
                <CompleteAsyncDemo />
                <BestPracticesSection />
              </div>
            </AsyncRefProvider>
          </AsyncActionProvider>
        </AsyncStoreProvider>
      </LogMonitorProvider>
    </div>
  );
}

function RealTimeStateAccessDemo() {
  const { log } = useLogMonitor();
  const isProcessingStore = useAsyncStore('isProcessing');
  const lastOperationStore = useAsyncStore('lastOperation');
  const operationResultsStore = useAsyncStore('operationResults');
  const dispatch = useAsyncAction();
  
  // Real-time state access handler
  useAsyncActionHandler('realTimeStateAccess', useCallback(async (payload, controller) => {
    const startTime = performance.now();
    
    // Real-time state access - avoid closure traps
    const isCurrentlyProcessing = isProcessingStore.getValue();
    
    if (isCurrentlyProcessing) {
      log('⚠️ Operation already in progress, skipping');
      return;
    }
    
    isProcessingStore.setValue(true);
    lastOperationStore.setValue(payload.operation);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // Access real-time state again
      const currentResults = operationResultsStore.getValue();
      const duration = performance.now() - startTime;
      
      operationResultsStore.setValue([
        ...currentResults,
        {
          timestamp: Date.now(),
          operation: payload.operation,
          success: true,
          duration: Math.round(duration)
        }
      ]);
      
      log(`✅ ${payload.operation} completed in ${Math.round(duration)}ms`);
      
    } catch (error) {
      log(`❌ ${payload.operation} failed: ${error}`);
    } finally {
      // Always use getValue() for current state
      const stillProcessing = isProcessingStore.getValue();
      if (stillProcessing) {
        isProcessingStore.setValue(false);
      }
    }
  }, [isProcessingStore, lastOperationStore, operationResultsStore, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-blue-600">Real-Time State Access Pattern</h2>
      <p className="text-gray-600 mb-4">
        Demonstrates avoiding closure traps by accessing current state in real-time using store.getValue().
      </p>
      
      <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={() => dispatch('realTimeStateAccess', { operation: 'Data Fetch' })}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Data Fetch
          </button>
          <button
            onClick={() => dispatch('realTimeStateAccess', { operation: 'File Upload' })}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Start File Upload
          </button>
          <button
            onClick={() => dispatch('realTimeStateAccess', { operation: 'API Sync' })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Start API Sync
          </button>
        </div>
        
        <AsyncStateDisplay />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Key Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// ✅ Correct - Real-time state access
const isCurrentlyProcessing = isProcessingStore.getValue();

// ❌ Wrong - Stale closure
const [isProcessing] = useState(false); // Might be stale`}
        </pre>
      </div>
    </section>
  );
}

function WaitThenExecuteDemo() {
  const { log } = useLogMonitor();
  const [showElement, setShowElement] = useState(false);
  const dispatch = useAsyncAction();
  const dynamicRef = useAsyncRef('dynamicElement');
  const animationRef = useAsyncRef('animationTarget');
  const waitForRefs = useWaitForRefs();
  
  // Wait-then-execute handler
  useAsyncActionHandler('waitThenExecute', useCallback(async (payload, controller) => {
    try {
      log(`⏳ Waiting for element: ${payload.elementKey}`);
      
      // Wait for the element to be available
      await waitForRefs(payload.elementKey);
      log(`✅ Element ${payload.elementKey} is now available`);
      
      // Safely access and manipulate the element
      if (payload.elementKey === 'dynamicElement' && dynamicRef.target) {
        dynamicRef.target.textContent = payload.content;
        dynamicRef.target.style.background = 'linear-gradient(45deg, #4CAF50, #45a049)';
        dynamicRef.target.style.transform = 'scale(1.05)';
        
        // Reset after a delay
        setTimeout(() => {
          if (dynamicRef.target) {
            dynamicRef.target.style.transform = 'scale(1)';
          }
        }, 500);
      }
      
      if (payload.elementKey === 'animationTarget' && animationRef.target) {
        // Animation sequence
        animationRef.target.style.transition = 'all 0.3s ease';
        animationRef.target.style.transform = 'rotate(360deg) scale(1.2)';
        animationRef.target.textContent = payload.content;
        
        setTimeout(() => {
          if (animationRef.target) {
            animationRef.target.style.transform = 'rotate(0deg) scale(1)';
          }
        }, 300);
      }
      
      log(`🎯 Successfully executed operation on ${payload.elementKey}`);
      
    } catch (error) {
      log(`❌ Wait-then-execute failed: ${error}`);
    }
  }, [waitForRefs, dynamicRef, animationRef, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-green-600">Wait-Then-Execute Pattern</h2>
      <p className="text-gray-600 mb-4">
        Safely executes DOM operations after ensuring element availability using waitForRefs.
      </p>
      
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowElement(!showElement)}
            className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            {showElement ? 'Hide' : 'Show'} Dynamic Element
          </button>
          
          {showElement && (
            <button
              onClick={() => dispatch('waitThenExecute', { 
                elementKey: 'dynamicElement', 
                content: 'Content updated via wait-then-execute!' 
              })}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Update Dynamic Element
            </button>
          )}
        </div>
        
        {showElement && (
          <div
            ref={dynamicRef.setRef}
            className="p-4 bg-blue-50 border border-blue-200 rounded transition-all duration-300"
          >
            Waiting for content update...
          </div>
        )}
        
        <div className="flex gap-4">
          <div
            ref={animationRef.setRef}
            className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg flex items-center justify-center text-white font-bold text-sm text-center"
          >
            Animation Target
          </div>
          
          <button
            onClick={() => dispatch('waitThenExecute', { 
              elementKey: 'animationTarget', 
              content: '🎉' 
            })}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Animate Target
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Key Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// Wait for element before manipulation
await waitForRefs('targetElement');

const element = elementRef.target;
if (element) {
  // Safe DOM manipulation
  element.style.transform = 'scale(1.1)';
}`}
        </pre>
      </div>
    </section>
  );
}

function TimeoutProtectionDemo() {
  const { log } = useLogMonitor();
  const [showTimeoutElement, setShowTimeoutElement] = useState(false);
  const dispatch = useAsyncAction();
  const timeoutRef = useAsyncRef('timeoutElement');
  const waitForRefs = useWaitForRefs();
  const retryCountStore = useAsyncStore('retryCount');
  
  // Timeout protection utilities
  const waitWithTimeout = useCallback(async (elementKey: keyof AsyncRefs, timeout = 5000) => {
    try {
      await Promise.race([
        waitForRefs(elementKey),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        )
      ]);
      return true;
    } catch (error) {
      log(`⚠️ Timeout waiting for ${elementKey}: ${error}`);
      return false;
    }
  }, [waitForRefs, log]);
  
  const waitWithRetry = useCallback(async (
    elementKey: keyof AsyncRefs, 
    maxRetries = 3, 
    timeout = 2000
  ) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await Promise.race([
          waitForRefs(elementKey),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout on attempt ${attempt}`)), timeout)
          )
        ]);
        log(`✅ Element ${elementKey} available on attempt ${attempt}`);
        return true;
      } catch (error) {
        log(`⚠️ Attempt ${attempt} failed: ${error}`);
        
        if (attempt === maxRetries) {
          log(`❌ All ${maxRetries} attempts failed for ${elementKey}`);
          return false;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    return false;
  }, [waitForRefs, log]);
  
  // Timeout protected handler
  useAsyncActionHandler('timeoutProtected', useCallback(async (payload, controller) => {
    const timeout = payload.timeout || 3000;
    const startTime = performance.now();
    
    try {
      log(`⏳ Starting timeout protected operation (${timeout}ms timeout)`);
      
      const success = await waitWithTimeout(payload.elementKey as keyof AsyncRefs, timeout);
      
      if (!success) {
        // Fallback strategy
        log('🔄 Timeout occurred, trying retry strategy...');
        
        const retrySuccess = await waitWithRetry(payload.elementKey as keyof AsyncRefs, 2, 1000);
        
        if (!retrySuccess) {
          const currentRetries = retryCountStore.getValue();
          retryCountStore.setValue(currentRetries + 1);
          
          log('❌ Fallback: Operation failed, but app continues gracefully');
          return { success: false, error: 'Element not available after retries' };
        }
      }
      
      // Success - perform operation
      if (timeoutRef.target) {
        timeoutRef.target.style.background = 'linear-gradient(45deg, #FF6B35, #F7931E)';
        timeoutRef.target.textContent = `✅ Success! (${Math.round(performance.now() - startTime)}ms)`;
      }
      
      log(`🎯 Timeout protected operation completed successfully`);
      return { success: true };
      
    } catch (error) {
      log(`❌ Timeout protected operation failed: ${error}`);
      return { success: false, error: String(error) };
    }
  }, [waitWithTimeout, waitWithRetry, timeoutRef, retryCountStore, log]));
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-orange-600">Timeout Protection Pattern</h2>
      <p className="text-gray-600 mb-4">
        Protects against infinite waits with timeout mechanisms, retries, and fallback strategies.
      </p>
      
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setShowTimeoutElement(!showTimeoutElement)}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            {showTimeoutElement ? 'Hide' : 'Show'} Timeout Element
          </button>
          
          <button
            onClick={() => dispatch('timeoutProtected', { elementKey: 'timeoutElement', timeout: 2000 })}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Test 2s Timeout
          </button>
          
          <button
            onClick={() => dispatch('timeoutProtected', { elementKey: 'timeoutElement', timeout: 100 })}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Test 100ms Timeout (Will Fail)
          </button>
        </div>
        
        {showTimeoutElement && (
          <div
            ref={timeoutRef.setRef}
            className="p-4 bg-yellow-50 border border-yellow-200 rounded"
          >
            Timeout Element - Ready for operations
          </div>
        )}
        
        <TimeoutRetryStats />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Key Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// Timeout protection with Promise.race
const success = await Promise.race([
  waitForRefs(elementKey),
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Timeout')), timeout)
  )
]);`}
        </pre>
      </div>
    </section>
  );
}

function ConditionalAwaitDemo() {
  const { log } = useLogMonitor();
  const [condition, setCondition] = useState<'never' | 'immediate' | 'delayed'>('never');
  const dispatch = useAsyncAction();
  const conditionalRef = useAsyncRef('conditionalElement');
  const waitForRefs = useWaitForRefs();
  const elementReadyStore = useAsyncStore('elementReady');
  
  // Complex conditional async operation
  useAsyncActionHandler('complexAsyncOperation', useCallback(async (payload, controller) => {
    try {
      log('🚀 Starting complex async operation...');
      
      // Real-time state access for condition checking
      const isElementReady = elementReadyStore.getValue();
      
      if (!isElementReady) {
        log('⏳ Element not ready, waiting conditionally...');
        
        // Conditional await based on current state
        const waitSuccess = await Promise.race([
          waitForRefs('conditionalElement'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Conditional wait timeout')), 5000)
          )
        ]).then(() => true).catch(() => false);
        
        if (!waitSuccess) {
          log('❌ Conditional wait failed, using fallback logic');
          return { success: false, message: 'Fallback executed' };
        }
        
        elementReadyStore.setValue(true);
        log('✅ Element is now ready');
      } else {
        log('✅ Element already ready, proceeding immediately');
      }
      
      // Perform operation
      if (conditionalRef.target) {
        conditionalRef.target.style.background = 'linear-gradient(45deg, #667eea, #764ba2)';
        conditionalRef.target.textContent = '🎯 Complex operation completed!';
      }
      
      return { success: true, message: 'Complex operation successful' };
      
    } catch (error) {
      log(`❌ Complex async operation failed: ${error}`);
      return { success: false, message: String(error) };
    }
  }, [waitForRefs, conditionalRef, elementReadyStore, log]));
  
  // Effect to handle condition changes
  useEffect(() => {
    if (condition === 'immediate') {
      elementReadyStore.setValue(true);
    } else if (condition === 'delayed') {
      elementReadyStore.setValue(false);
      setTimeout(() => {
        elementReadyStore.setValue(true);
      }, 2000);
    } else {
      elementReadyStore.setValue(false);
    }
  }, [condition, elementReadyStore]);
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-purple-600">Conditional Await Pattern</h2>
      <p className="text-gray-600 mb-4">
        Smart waiting based on conditions, combining real-time state access with conditional logic.
      </p>
      
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <label className="font-medium text-gray-700">Condition:</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as typeof condition)}
            className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="never">Never Ready</option>
            <option value="immediate">Immediately Ready</option>
            <option value="delayed">Ready After 2s</option>
          </select>
        </div>
        
        <div
          ref={conditionalRef.setRef}
          className="p-4 bg-purple-50 border border-purple-200 rounded min-h-[60px] flex items-center"
        >
          Conditional Element - Status: {condition}
        </div>
        
        <button
          onClick={() => dispatch('complexAsyncOperation')}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Execute Complex Async Operation
        </button>
        
        <ConditionalStateDisplay />
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h4 className="font-semibold text-gray-700 mb-2">Key Pattern:</h4>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// Conditional await pattern
const isElementReady = elementReadyStore.getValue();

if (!isElementReady) {
  await waitForRefs('conditionalElement');
  elementReadyStore.setValue(true);
}`}
        </pre>
      </div>
    </section>
  );
}

function CompleteAsyncDemo() {
  const { log } = useLogMonitor();
  const dispatch = useAsyncAction();
  
  return (
    <section className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-600">Complete Async Pattern Integration</h2>
      <p className="text-gray-600 mb-4">
        Combines all async patterns: real-time state access, wait-then-execute, timeout protection, and conditional await.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => dispatch('realTimeStateAccess', { operation: 'Complete Demo' })}
          className="p-4 bg-indigo-500 text-white rounded hover:bg-indigo-600 text-left"
        >
          <div className="font-semibold">Real-Time State Access</div>
          <div className="text-sm opacity-90">Avoid closure traps</div>
        </button>
        
        <button
          onClick={() => dispatch('waitThenExecute', { elementKey: 'animationTarget', content: '🔄' })}
          className="p-4 bg-green-500 text-white rounded hover:bg-green-600 text-left"
        >
          <div className="font-semibold">Wait-Then-Execute</div>
          <div className="text-sm opacity-90">Safe DOM operations</div>
        </button>
        
        <button
          onClick={() => dispatch('timeoutProtected', { elementKey: 'timeoutElement', timeout: 3000 })}
          className="p-4 bg-orange-500 text-white rounded hover:bg-orange-600 text-left"
        >
          <div className="font-semibold">Timeout Protection</div>
          <div className="text-sm opacity-90">Prevent infinite waits</div>
        </button>
        
        <button
          onClick={() => dispatch('complexAsyncOperation')}
          className="p-4 bg-purple-500 text-white rounded hover:bg-purple-600 text-left"
        >
          <div className="font-semibold">Conditional Await</div>
          <div className="text-sm opacity-90">Smart condition-based waiting</div>
        </button>
      </div>
    </section>
  );
}

// Helper components
function AsyncStateDisplay() {
  const isProcessing = useAsyncStore('isProcessing').getValue();
  const lastOperation = useAsyncStore('lastOperation').getValue();
  const operationResults = useAsyncStore('operationResults').getValue();
  
  return (
    <div className="p-4 bg-blue-50 rounded border">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="font-medium">Processing:</span> 
          <span className={isProcessing ? 'text-orange-600' : 'text-green-600'}>
            {isProcessing ? '🔄 Active' : '✅ Idle'}
          </span>
        </div>
        <div>
          <span className="font-medium">Last Operation:</span> {lastOperation || 'None'}
        </div>
        <div>
          <span className="font-medium">Total Operations:</span> {operationResults.length}
        </div>
      </div>
      
      {operationResults.length > 0 && (
        <div className="mt-3 space-y-1">
          <h4 className="font-medium text-gray-700">Recent Operations:</h4>
          {operationResults.slice(-3).map((result, index) => (
            <div key={result.timestamp} className="text-xs flex justify-between items-center bg-white px-2 py-1 rounded">
              <span>{result.operation}</span>
              <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? '✅' : '❌'} {result.duration}ms
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimeoutRetryStats() {
  const retryCount = useAsyncStore('retryCount').getValue();
  
  return (
    <div className="p-3 bg-orange-50 rounded border text-sm">
      <div className="font-medium text-gray-700 mb-1">Timeout Stats:</div>
      <div>Total Retry Attempts: <span className="font-mono">{retryCount}</span></div>
    </div>
  );
}

function ConditionalStateDisplay() {
  const elementReady = useAsyncStore('elementReady').getValue();
  
  return (
    <div className="p-3 bg-purple-50 rounded border text-sm">
      <div>
        <span className="font-medium">Element Ready:</span> 
        <span className={elementReady ? 'text-green-600' : 'text-orange-600'}>
          {elementReady ? '✅ Ready' : '⏳ Not Ready'}
        </span>
      </div>
    </div>
  );
}

function BestPracticesSection() {
  return (
    <section className="bg-gray-50 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Best Practices</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-green-600 mb-3">✅ Do</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Use <code className="bg-white px-1 rounded">store.getValue()</code> for real-time state access</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Always implement timeout protection for async operations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Check element existence after <code className="bg-white px-1 rounded">waitForRefs()</code></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Implement fallback strategies for failed operations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-1">•</span>
              <span>Use hardware-accelerated CSS properties for animations</span>
            </li>
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-red-600 mb-3">❌ Don't</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Rely on useState values in async operations (closure traps)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Forget timeout protection for element waiting</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Manipulate DOM without checking element existence</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Block UI with synchronous operations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">•</span>
              <span>Ignore error handling and recovery strategies</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default AsyncBasicUsagePage;