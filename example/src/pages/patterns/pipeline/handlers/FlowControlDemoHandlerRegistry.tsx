import { useCallback, useEffect } from 'react';
import { useActionLogger } from '@/components/LogMonitor';
import {
  useApiAction,
  useCacheAction,
  useFlowControlDemoActionCommandHandler,
  useFlowControlStore,
  useOrderAction,
  useSecurityAction,
} from '../contexts/FlowControlContexts';
import type { ApiResult } from '../scenarios/types';

export function FlowControlDemoHandlerRegistry() {
  const demoStateStore = useFlowControlStore('demoState');
  const cacheStore = useFlowControlStore('cache');

  const securityDispatch = useSecurityAction();
  const cacheDispatch = useCacheAction();
  const orderDispatch = useOrderAction();
  const apiDispatch = useApiAction();

  // Log Monitor 연동
  const logger = useActionLogger();

  // Initialize demo cache data
  useEffect(() => {
    const newMemoryCache = new Map();
    const newRedisCache = new Map();

    // Pre-populate cache with demo data for cache hit scenario
    newMemoryCache.set('cached-user-profile', {
      id: 'cached-user-profile',
      name: 'John Doe',
      email: 'john@example.com',
      cachedAt: new Date().toISOString(),
      source: 'memory-cache',
    });

    newRedisCache.set('redis-cached-profile', {
      id: 'redis-cached-profile',
      name: 'Jane Smith',
      email: 'jane@example.com',
      cachedAt: new Date().toISOString(),
      source: 'redis-cache',
    });

    cacheStore.setValue({
      memoryCache: newMemoryCache,
      redisCache: newRedisCache,
    });

    console.log('🗂️ Demo cache data initialized');
  }, [cacheStore]);

  useFlowControlDemoActionCommandHandler(
    'clearCache',
    useCallback(() => {
      cacheStore.setValue({
        memoryCache: new Map(),
        redisCache: new Map(),
      });

      console.log('🗑️ Cache cleared');
    }, [cacheStore])
  );

  useFlowControlDemoActionCommandHandler(
    'toggleBusinessHours',
    useCallback(() => {
      const currentState = demoStateStore.getValue();
      const newBusinessHours = !currentState.isBusinessHours;

      demoStateStore.setValue({
        ...currentState,
        isBusinessHours: newBusinessHours,
      });

      console.log(`🕐 Business hours: ${newBusinessHours ? 'ON' : 'OFF'}`);
    }, [demoStateStore])
  );

  useFlowControlDemoActionCommandHandler(
    'adjustSystemLoad',
    useCallback(
      ({ load }) => {
        const currentState = demoStateStore.getValue();

        demoStateStore.setValue({
          ...currentState,
          systemLoad: load,
        });

        console.log(`⚡ System load adjusted to: ${(load * 100).toFixed(0)}%`);
      },
      [demoStateStore]
    )
  );

  useFlowControlDemoActionCommandHandler(
    'setSelectedScenario',
    useCallback(
      ({ scenario }) => {
        const currentState = demoStateStore.getValue();

        demoStateStore.setValue({
          ...currentState,
          selectedScenario: scenario,
        });
      },
      [demoStateStore]
    )
  );

  useFlowControlDemoActionCommandHandler(
    'recordExecutionStep',
    useCallback(
      ({ step }) => {
        const currentState = demoStateStore.getValue();

        demoStateStore.setValue({
          ...currentState,
          executionPath: [...currentState.executionPath, step],
        });

        logger.info(`🔀 Pipeline Step: ${step}`, {
          scenario: currentState.selectedScenario,
          step: currentState.executionPath.length + 1,
          timestamp: new Date().toISOString(),
        });
      },
      [demoStateStore, logger]
    )
  );

  useFlowControlDemoActionCommandHandler(
    'recordHandlerExecution',
    useCallback(() => {
      const currentState = demoStateStore.getValue();

      demoStateStore.setValue({
        ...currentState,
        handlerExecutions: currentState.handlerExecutions + 1,
      });
    }, [demoStateStore])
  );

  useFlowControlDemoActionCommandHandler(
    'executeScenario',
    useCallback(
      async ({ scenario, payload }) => {
        const currentState = demoStateStore.getValue();

        if (currentState.isExecuting) return;

        // Reset execution state
        demoStateStore.setValue({
          ...currentState,
          isExecuting: true,
          executionResults: [],
          executionPath: [],
          handlerExecutions: 0,
        });

        console.log(`\n🧪 Executing scenario: ${scenario}`);

        // Log scenario start to monitor
        logger.info(`🧪 Scenario Started: ${scenario}`, {
          scenario,
          payload,
          timestamp: new Date().toISOString(),
        });

        try {
          let result: any;

          switch (scenario) {
            case 'securityEscalation':
            case 'securitySuccess':
            case 'securityNormal':
              result = await securityDispatch('processRequest', payload);
              break;
            case 'cacheOptimization':
            case 'cacheRedisHit':
            case 'cacheMissAll':
              result = await cacheDispatch('fetchData', payload);
              break;
            case 'businessHourRouting':
              result = await orderDispatch('processOrder', payload);
              break;
            case 'errorRecovery':
              result = await apiDispatch('apiCall', payload);
              break;
            default:
              throw new Error(`Unknown scenario: ${scenario}`);
          }

          const finalState = demoStateStore.getValue();
          demoStateStore.setValue({
            ...finalState,
            executionResults: [result],
            isExecuting: false,
          });

          console.log('✅ Scenario completed:', result);

          // Log scenario success to monitor
          logger.info(`✅ Scenario Completed: ${scenario}`, {
            scenario,
            result,
            executionSteps: finalState.executionPath.length,
            handlersExecuted: finalState.handlerExecutions,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('❌ Scenario failed:', error);

          // Log scenario failure to monitor
          logger.error(`❌ Scenario Failed: ${scenario}`, error as Error, {
            context: `Scenario: ${scenario}, Timestamp: ${new Date().toISOString()}`,
          });

          const finalState = demoStateStore.getValue();
          demoStateStore.setValue({
            ...finalState,
            executionResults: [
              {
                success: false,
                message: (error as Error).message,
                endpoint: 'unknown',
                timestamp: Date.now(),
              } as ApiResult,
            ],
            isExecuting: false,
          });
        }
      },
      [
        apiDispatch,
        cacheDispatch,
        demoStateStore,
        logger,
        orderDispatch,
        securityDispatch,
      ]
    )
  );

  return null;
}
