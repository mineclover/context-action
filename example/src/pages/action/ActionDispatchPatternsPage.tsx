import {
  createActionContext,
  ActionPayloadMap,
} from '@context-action/react';
import type React from 'react';
import { useCallback, useState, useRef } from 'react';
import {
  PageWithLogMonitor,
  useActionLoggerWithToast,
} from '../../components/LogMonitor/';
import {
  Button,
  CodeExample,
  DemoCard,
  Section,
  Label,
} from '../../components/ui';

// Action interfaces for different dispatch patterns
interface DispatchActions extends ActionPayloadMap {
  processOrder: { orderId: string; items: Array<{ id: string; quantity: number }> };
  broadcastEvent: { type: string; data: any };
  fastestResponse: { query: string };
  validateData: { data: any; rules: string[] };
  logEvent: { event: string; timestamp: number; metadata?: any };
  sendNotification: { message: string; recipients: string[] };
  updateCache: { key: string; value: any; ttl?: number };
}

interface FilterActions extends ActionPayloadMap {
  userAction: { userId: string; action: string; premium: boolean };
  systemEvent: { level: 'info' | 'warning' | 'error'; message: string; service: string };
  dataSync: { source: string; destination: string; priority: number };
}

interface PerformanceActions extends ActionPayloadMap {
  heavyTask: { id: string; data: any[] };
  lightTask: { id: string; message: string };
  batchOperation: { items: any[]; batchSize: number };
}

// Create contexts
const {
  Provider: DispatchActionProvider,
  useActionDispatch: useDispatchAction,
  useActionHandler: useDispatchActionHandler
} = createActionContext<DispatchActions>('Dispatch');

const {
  Provider: FilterActionProvider,
  useActionDispatch: useFilterAction,
  useActionHandler: useFilterActionHandler
} = createActionContext<FilterActions>('Filter');

const {
  Provider: PerformanceActionProvider,
  useActionDispatch: usePerformanceAction,
  useActionHandler: usePerformanceActionHandler
} = createActionContext<PerformanceActions>('Performance');

// Basic Dispatch Patterns Demo
function BasicDispatchDemo() {
  const logger = useActionLoggerWithToast();
  const dispatch = useDispatchAction();
  const [results, setResults] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Sequential processing handlers
  const processOrderHandler1 = useCallback(async (payload, controller) => {
    logger.info('📦 Order handler 1 - Validation', { orderId: payload.orderId });
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Modify payload for next handler
    controller.modifyPayload(p => ({
      ...p,
      validated: true,
      validatedAt: Date.now()
    }));
    
    setResults(prev => [...prev, `✅ Order ${payload.orderId} validated`]);
    return { step: 'validation', success: true };
  }, [logger]);

  const processOrderHandler2 = useCallback(async (payload, controller) => {
    logger.info('💳 Order handler 2 - Payment', { orderId: payload.orderId });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const currentPayload = controller.getPayload();
    logger.info('📋 Received modified payload', currentPayload);
    
    setResults(prev => [...prev, `💳 Order ${payload.orderId} payment processed`]);
    return { step: 'payment', success: true };
  }, [logger]);

  const processOrderHandler3 = useCallback(async (payload, controller) => {
    logger.info('🚚 Order handler 3 - Shipping', { orderId: payload.orderId });
    await new Promise(resolve => setTimeout(resolve, 150));
    
    setResults(prev => [...prev, `🚚 Order ${payload.orderId} shipped`]);
    return { step: 'shipping', success: true };
  }, [logger]);

  // Parallel processing handlers
  const broadcastEventHandler1 = useCallback(async (payload) => {
    logger.info('📊 Analytics handler', { eventType: payload.type });
    await new Promise(resolve => setTimeout(resolve, 100));
    setResults(prev => [...prev, `📊 Analytics logged: ${payload.type}`]);
    return { handler: 'analytics', processed: true };
  }, [logger]);

  const broadcastEventHandler2 = useCallback(async (payload) => {
    logger.info('🔔 Notification handler', { eventType: payload.type });
    await new Promise(resolve => setTimeout(resolve, 150));
    setResults(prev => [...prev, `🔔 Notification sent: ${payload.type}`]);
    return { handler: 'notification', processed: true };
  }, [logger]);

  const broadcastEventHandler3 = useCallback(async (payload) => {
    logger.info('📝 Logging handler', { eventType: payload.type });
    await new Promise(resolve => setTimeout(resolve, 80));
    setResults(prev => [...prev, `📝 Event logged: ${payload.type}`]);
    return { handler: 'logging', processed: true };
  }, [logger]);

  // Race condition handlers
  const fastestResponseHandler1 = useCallback(async (payload) => {
    logger.info('🏃 Handler 1 (slow)', { query: payload.query });
    await new Promise(resolve => setTimeout(resolve, 300));
    setResults(prev => [...prev, `🐌 Slow handler completed: ${payload.query}`]);
    return { handler: 'slow', response: 'slow result', time: 300 };
  }, [logger]);

  const fastestResponseHandler2 = useCallback(async (payload) => {
    logger.info('🏃 Handler 2 (fast)', { query: payload.query });
    await new Promise(resolve => setTimeout(resolve, 100));
    setResults(prev => [...prev, `⚡ Fast handler completed: ${payload.query}`]);
    return { handler: 'fast', response: 'fast result', time: 100 };
  }, [logger]);
  
  // Register handlers with different priorities for sequential execution
  useDispatchActionHandler('processOrder', processOrderHandler1, { priority: 100 });
  useDispatchActionHandler('processOrder', processOrderHandler2, { priority: 200 });
  useDispatchActionHandler('processOrder', processOrderHandler3, { priority: 300 });
  
  // Register parallel handlers
  useDispatchActionHandler('broadcastEvent', broadcastEventHandler1);
  useDispatchActionHandler('broadcastEvent', broadcastEventHandler2);
  useDispatchActionHandler('broadcastEvent', broadcastEventHandler3);
  
  // Register race handlers
  useDispatchActionHandler('fastestResponse', fastestResponseHandler1);
  useDispatchActionHandler('fastestResponse', fastestResponseHandler2);
  
  const handleSequentialDispatch = async () => {
    setIsProcessing(true);
    setResults([]);
    logger.info('🔄 Starting sequential dispatch...');
    
    try {
      const result = await dispatch('processOrder', {
        orderId: `ORDER-${Date.now()}`,
        items: [{ id: 'item1', quantity: 2 }, { id: 'item2', quantity: 1 }]
      });
      
      logger.info('✅ Sequential dispatch completed', result);
      setResults(prev => [...prev, '✅ All sequential handlers completed']);
    } catch (error) {
      logger.error('❌ Sequential dispatch failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParallelDispatch = async () => {
    setIsProcessing(true);
    setResults([]);
    logger.info('⚡ Starting parallel dispatch...');
    
    try {
      const result = await dispatch('broadcastEvent', {
        type: 'USER_SIGNUP',
        data: { userId: 'user123', timestamp: Date.now() }
      });
      
      logger.info('✅ Parallel dispatch completed', result);
      setResults(prev => [...prev, '✅ All parallel handlers completed']);
    } catch (error) {
      logger.error('❌ Parallel dispatch failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRaceDispatch = async () => {
    setIsProcessing(true);
    setResults([]);
    logger.info('🏁 Starting race dispatch...');
    
    try {
      const result = await dispatch('fastestResponse', {
        query: 'SELECT * FROM users LIMIT 10'
      });
      
      logger.info('🏆 Race dispatch completed', result);
      setResults(prev => [...prev, '🏆 Fastest handler won the race']);
    } catch (error) {
      logger.error('❌ Race dispatch failed', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };
  
  return (
    <DemoCard title="Basic Dispatch Patterns">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="font-semibold">Execution Results</Label>
          <div className="min-h-32 max-h-48 overflow-y-auto p-3 bg-gray-50 rounded border text-sm">
            {results.length === 0 ? (
              <span className="text-gray-500">No results yet...</span>
            ) : (
              results.map((result, index) => (
                <div key={index} className="py-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={handleSequentialDispatch} 
            variant="primary" 
            size="sm"
            disabled={isProcessing}
          >
            Sequential Execution
          </Button>
          <Button 
            onClick={handleParallelDispatch} 
            variant="secondary" 
            size="sm"
            disabled={isProcessing}
          >
            Parallel Execution
          </Button>
          <Button 
            onClick={handleRaceDispatch} 
            variant="outline" 
            size="sm"
            disabled={isProcessing}
          >
            Race Execution
          </Button>
          <Button onClick={clearResults} variant="ghost" size="sm">
            Clear Results
          </Button>
        </div>

        <CodeExample>
{`// Sequential execution (default) - handlers run in priority order
await register.dispatch('processOrder', orderData, {
  executionMode: 'sequential'  // Default
});

// Parallel execution - all handlers run simultaneously
await register.dispatch('broadcastEvent', eventData, {
  executionMode: 'parallel'
});

// Race execution - first completed handler wins
await register.dispatch('fastestResponse', queryData, {
  executionMode: 'race'
});

// Register handlers with priority for sequential execution
register.register('processOrder', validationHandler, { priority: 100 });
register.register('processOrder', paymentHandler, { priority: 200 });
register.register('processOrder', shippingHandler, { priority: 300 });`}
        </CodeExample>
      </div>
    </DemoCard>
  );
}

// Handler Filtering Demo
function HandlerFilteringDemo() {
  const logger = useActionLoggerWithToast();
  
  return (
    <FilterActionProvider>
      <FilterContent />
    </FilterActionProvider>
  );
  
  function FilterContent() {
    const dispatch = useFilterAction();
    const [results, setResults] = useState<string[]>([]);
    
    // Handlers with different filter conditions
    const premiumUserHandler = useCallback(async (payload, controller) => {
      if (!payload.premium) {
        logger.info('⏭️ Skipping premium handler - user not premium');
        return { skipped: true, reason: 'not premium' };
      }
      
      logger.info('💎 Premium user handler triggered', payload);
      await new Promise(resolve => setTimeout(resolve, 100));
      setResults(prev => [...prev, `💎 Premium feature accessed by ${payload.userId}`]);
      return { premium: true, processed: true };
    }, [logger]);

    const generalUserHandler = useCallback(async (payload) => {
      logger.info('👤 General user handler triggered', payload);
      await new Promise(resolve => setTimeout(resolve, 50));
      setResults(prev => [...prev, `👤 General action logged: ${payload.action}`]);
      return { general: true, processed: true };
    }, [logger]);

    // System event handlers with different filter levels
    const errorLevelHandler = useCallback(async (payload, controller) => {
      if (payload.level !== 'error') {
        return { skipped: true, reason: 'not error level' };
      }
      
      logger.info('🚨 Error handler triggered', payload);
      setResults(prev => [...prev, `🚨 ERROR: ${payload.message} (${payload.service})`]);
      return { level: 'error', processed: true };
    }, [logger]);

    const warningLevelHandler = useCallback(async (payload) => {
      if (payload.level === 'info') {
        return { skipped: true, reason: 'info level ignored' };
      }
      
      logger.info('⚠️ Warning handler triggered', payload);
      setResults(prev => [...prev, `⚠️ ${payload.level.toUpperCase()}: ${payload.message}`]);
      return { level: payload.level, processed: true };
    }, [logger]);

    const allLevelHandler = useCallback(async (payload) => {
      logger.info('📋 All level handler triggered', payload);
      setResults(prev => [...prev, `📋 Logged: ${payload.message} (${payload.level})`]);
      return { level: 'all', processed: true };
    }, [logger]);

    // Priority-based handlers
    const highPriorityHandler = useCallback(async (payload, controller) => {
      if (payload.priority < 8) {
        return { skipped: true, reason: 'priority too low' };
      }
      
      logger.info('🔥 High priority handler', payload);
      setResults(prev => [...prev, `🔥 High priority sync: ${payload.source} → ${payload.destination}`]);
      return { priority: 'high', processed: true };
    }, [logger]);

    const normalPriorityHandler = useCallback(async (payload) => {
      logger.info('📄 Normal priority handler', payload);
      setResults(prev => [...prev, `📄 Normal sync: ${payload.source} → ${payload.destination}`]);
      return { priority: 'normal', processed: true };
    }, [logger]);
    
    useFilterActionHandler('userAction', premiumUserHandler);
    useFilterActionHandler('userAction', generalUserHandler);
    
    useFilterActionHandler('systemEvent', errorLevelHandler);
    useFilterActionHandler('systemEvent', warningLevelHandler);
    useFilterActionHandler('systemEvent', allLevelHandler);
    
    useFilterActionHandler('dataSync', highPriorityHandler);
    useFilterActionHandler('dataSync', normalPriorityHandler);
    
    const handlePremiumUser = () => {
      dispatch('userAction', {
        userId: 'premium-user-123',
        action: 'access_premium_feature',
        premium: true
      });
    };

    const handleRegularUser = () => {
      dispatch('userAction', {
        userId: 'regular-user-456',
        action: 'view_content',
        premium: false
      });
    };

    const handleErrorEvent = () => {
      dispatch('systemEvent', {
        level: 'error',
        message: 'Database connection failed',
        service: 'user-service'
      });
    };

    const handleWarningEvent = () => {
      dispatch('systemEvent', {
        level: 'warning',
        message: 'High memory usage detected',
        service: 'api-gateway'
      });
    };

    const handleInfoEvent = () => {
      dispatch('systemEvent', {
        level: 'info',
        message: 'User logged in successfully',
        service: 'auth-service'
      });
    };

    const handleHighPrioritySync = () => {
      dispatch('dataSync', {
        source: 'primary-db',
        destination: 'backup-db',
        priority: 10
      });
    };

    const handleNormalPrioritySync = () => {
      dispatch('dataSync', {
        source: 'cache',
        destination: 'analytics-db',
        priority: 5
      });
    };

    const clearResults = () => {
      setResults([]);
    };
    
    return (
      <DemoCard title="Handler Filtering Patterns">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="font-semibold">Filter Results</Label>
            <div className="min-h-24 max-h-32 overflow-y-auto p-3 bg-gray-50 rounded border text-sm">
              {results.length === 0 ? (
                <span className="text-gray-500">No results yet...</span>
              ) : (
                results.map((result, index) => (
                  <div key={index} className="py-1">
                    {result}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">User Actions</Label>
              <div className="flex gap-2 mt-1">
                <Button onClick={handlePremiumUser} variant="primary" size="xs">
                  Premium User Action
                </Button>
                <Button onClick={handleRegularUser} variant="secondary" size="xs">
                  Regular User Action
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">System Events</Label>
              <div className="flex gap-2 mt-1">
                <Button onClick={handleErrorEvent} variant="primary" size="xs">
                  Error Event
                </Button>
                <Button onClick={handleWarningEvent} variant="secondary" size="xs">
                  Warning Event
                </Button>
                <Button onClick={handleInfoEvent} variant="outline" size="xs">
                  Info Event
                </Button>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Data Sync</Label>
              <div className="flex gap-2 mt-1">
                <Button onClick={handleHighPrioritySync} variant="primary" size="xs">
                  High Priority Sync
                </Button>
                <Button onClick={handleNormalPrioritySync} variant="secondary" size="xs">
                  Normal Priority Sync
                </Button>
              </div>
            </div>
          </div>
          
          <Button onClick={clearResults} variant="ghost" size="sm">
            Clear Results
          </Button>

          <CodeExample>
{`// Conditional handler execution based on payload
const premiumHandler = useCallback(async (payload, controller) => {
  if (!payload.premium) {
    return { skipped: true, reason: 'not premium' };
  }
  
  // Only execute for premium users
  return await processPremiumFeature(payload);
}, []);

// Level-based filtering for system events
const errorHandler = useCallback(async (payload) => {
  if (payload.level !== 'error') {
    return { skipped: true };
  }
  
  // Only process error-level events
  return await handleSystemError(payload);
}, []);

// Priority-based filtering
const highPriorityHandler = useCallback(async (payload) => {
  if (payload.priority < 8) {
    return { skipped: true, reason: 'priority too low' };
  }
  
  return await processHighPriority(payload);
}, []);`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Performance Optimization Demo
function PerformanceOptimizationDemo() {
  const logger = useActionLoggerWithToast();
  
  return (
    <PerformanceActionProvider>
      <PerformanceContent />
    </PerformanceActionProvider>
  );
  
  function PerformanceContent() {
    const dispatch = usePerformanceAction();
    const [metrics, setMetrics] = useState<any[]>([]);
    const executionTimesRef = useRef<number[]>([]);
    
    // Performance-optimized handlers
    const heavyTaskHandler = useCallback(async (payload, controller) => {
      const startTime = performance.now();
      logger.info('⚡ Heavy task started', { id: payload.id, dataLength: payload.data.length });
      
      // Simulate heavy computation
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Process data in chunks for better performance
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < payload.data.length; i += chunkSize) {
        chunks.push(payload.data.slice(i, i + chunkSize));
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      executionTimesRef.current.push(duration);
      
      setMetrics(prev => [...prev, {
        id: payload.id,
        type: 'heavy',
        duration: duration.toFixed(2),
        dataSize: payload.data.length,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      return { processed: chunks.length, duration };
    }, [logger]);

    const lightTaskHandler = useCallback(async (payload) => {
      const startTime = performance.now();
      logger.info('🪶 Light task started', { id: payload.id });
      
      // Minimal processing
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      executionTimesRef.current.push(duration);
      
      setMetrics(prev => [...prev, {
        id: payload.id,
        type: 'light',
        duration: duration.toFixed(2),
        message: payload.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      return { processed: true, duration };
    }, [logger]);

    // Batched operation handler
    const batchOperationHandler = useCallback(async (payload, controller) => {
      const startTime = performance.now();
      logger.info('📦 Batch operation started', { itemCount: payload.items.length, batchSize: payload.batchSize });
      
      const batches = [];
      for (let i = 0; i < payload.items.length; i += payload.batchSize) {
        const batch = payload.items.slice(i, i + payload.batchSize);
        batches.push(batch);
      }
      
      // Process batches in parallel for better performance
      const results = await Promise.all(
        batches.map(async (batch, index) => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return { batchIndex: index, itemCount: batch.length };
        })
      );
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      executionTimesRef.current.push(duration);
      
      setMetrics(prev => [...prev, {
        id: `batch-${Date.now()}`,
        type: 'batch',
        duration: duration.toFixed(2),
        batches: results.length,
        totalItems: payload.items.length,
        timestamp: new Date().toLocaleTimeString()
      }]);
      
      return { batches: results.length, totalProcessed: payload.items.length };
    }, [logger]);
    
    usePerformanceActionHandler('heavyTask', heavyTaskHandler);
    usePerformanceActionHandler('lightTask', lightTaskHandler);
    usePerformanceActionHandler('batchOperation', batchOperationHandler);
    
    const handleHeavyTask = () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: Math.random() }));
      dispatch('heavyTask', {
        id: `heavy-${Date.now()}`,
        data: largeData
      });
    };

    const handleLightTask = () => {
      dispatch('lightTask', {
        id: `light-${Date.now()}`,
        message: 'Quick processing task'
      });
    };

    const handleBatchOperation = () => {
      const items = Array.from({ length: 500 }, (_, i) => ({ id: i, data: `item-${i}` }));
      dispatch('batchOperation', {
        items,
        batchSize: 50
      });
    };

    const clearMetrics = () => {
      setMetrics([]);
      executionTimesRef.current = [];
    };

    const averageTime = executionTimesRef.current.length > 0 
      ? (executionTimesRef.current.reduce((a, b) => a + b, 0) / executionTimesRef.current.length).toFixed(2)
      : '0';
    
    return (
      <DemoCard title="Performance Optimization">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-red-50 rounded-lg">
              <Label className="font-semibold">Heavy Tasks</Label>
              <div className="text-sm space-y-1">
                <div>Count: {metrics.filter(m => m.type === 'heavy').length}</div>
                <div>Avg Duration: {averageTime}ms</div>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Label className="font-semibold">Light Tasks</Label>
              <div className="text-sm space-y-1">
                <div>Count: {metrics.filter(m => m.type === 'light').length}</div>
                <div>Fast Processing</div>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="font-semibold">Batch Operations</Label>
              <div className="text-sm space-y-1">
                <div>Count: {metrics.filter(m => m.type === 'batch').length}</div>
                <div>Parallel Processing</div>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="font-semibold">Performance Metrics</Label>
            <div className="max-h-32 overflow-y-auto p-3 bg-gray-50 rounded border text-xs">
              {metrics.length === 0 ? (
                <span className="text-gray-500">No metrics yet...</span>
              ) : (
                metrics.slice(-10).map((metric, index) => (
                  <div key={index} className="py-1">
                    {metric.timestamp} - {metric.type}: {metric.duration}ms
                    {metric.dataSize && ` (${metric.dataSize} items)`}
                    {metric.batches && ` (${metric.batches} batches)`}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleHeavyTask} variant="primary" size="sm">
              Heavy Task (1000 items)
            </Button>
            <Button onClick={handleLightTask} variant="secondary" size="sm">
              Light Task
            </Button>
            <Button onClick={handleBatchOperation} variant="outline" size="sm">
              Batch Operation (500 items)
            </Button>
            <Button onClick={clearMetrics} variant="ghost" size="sm">
              Clear Metrics
            </Button>
          </div>

          <CodeExample>
{`// Performance-optimized handler with chunking
const heavyTaskHandler = useCallback(async (payload, controller) => {
  const startTime = performance.now();
  
  // Process data in chunks for better performance
  const chunkSize = 100;
  const chunks = [];
  for (let i = 0; i < payload.data.length; i += chunkSize) {
    chunks.push(payload.data.slice(i, i + chunkSize));
  }
  
  // Process chunks efficiently
  const results = await Promise.all(
    chunks.map(chunk => processChunk(chunk))
  );
  
  const duration = performance.now() - startTime;
  return { processed: chunks.length, duration };
}, []);

// Batched operations for optimal throughput
const batchHandler = useCallback(async (payload) => {
  const batches = createBatches(payload.items, payload.batchSize);
  
  // Process batches in parallel
  return await Promise.all(
    batches.map(batch => processBatch(batch))
  );
}, []);`}
          </CodeExample>
        </div>
      </DemoCard>
    );
  }
}

// Main Component
function ActionDispatchPatternsPage() {
  return (
    <PageWithLogMonitor pageId="action-dispatch-patterns">
      <DispatchActionProvider>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Action Dispatch Patterns
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Core action dispatching patterns for the Context-Action framework, including execution modes, 
              filtering, and performance optimization techniques.
            </p>
          </div>

          <div className="space-y-8">
            <Section title="Execution Modes">
              <BasicDispatchDemo />
            </Section>

            <Section title="Handler Filtering">
              <HandlerFilteringDemo />
            </Section>

            <Section title="Performance Optimization">
              <PerformanceOptimizationDemo />
            </Section>

            <Section title="Dispatch Pattern Guidelines">
              <DemoCard title="Best Practices">
                <div className="space-y-4">
                  <div className="prose">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-green-700">✅ Execution Modes</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>Sequential:</strong> Use for dependent operations and payload modification</li>
                          <li><strong>Parallel:</strong> Use for independent operations like analytics and logging</li>
                          <li><strong>Race:</strong> Use when you need the fastest response from multiple sources</li>
                          <li><strong>Priority-based:</strong> Use handler registration priority for execution order</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-blue-700">🎯 Performance Tips</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li><strong>Handler Filtering:</strong> Return early from handlers when conditions aren't met</li>
                          <li><strong>Batch Processing:</strong> Group related operations for better throughput</li>
                          <li><strong>Chunk Large Data:</strong> Process large datasets in manageable chunks</li>
                          <li><strong>Monitor Performance:</strong> Track execution times and optimize bottlenecks</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </DemoCard>
            </Section>
          </div>
        </div>
      </DispatchActionProvider>
    </PageWithLogMonitor>
  );
}

export default ActionDispatchPatternsPage;