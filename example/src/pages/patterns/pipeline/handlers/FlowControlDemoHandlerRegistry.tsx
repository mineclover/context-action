import type { ExecutionResult } from '@context-action/core';
import { useCallback, useEffect } from 'react';
import { useActionLogger } from '@/components/LogMonitor';
import {
  useApiActionWithResult,
  useCacheActionWithResult,
  useFlowControlDemoActionCommandHandler,
  useFlowControlStore,
  useOrderActionWithResult,
  useSecurityActionWithResult,
} from '../contexts/FlowControlContexts';
import type {
  ApiResult,
  CacheResult,
  OrderResult,
  SecurityResult,
} from '../scenarios/types';

export function FlowControlDemoHandlerRegistry() {
  const demoStateStore = useFlowControlStore('demoState');
  const cacheStore = useFlowControlStore('cache');

  const securityAction = useSecurityActionWithResult();
  const cacheAction = useCacheActionWithResult();
  const orderAction = useOrderActionWithResult();
  const apiAction = useApiActionWithResult();

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
      let nextBusinessHours = false;
      demoStateStore.update((currentState) => {
        nextBusinessHours = !currentState.isBusinessHours;
        return {
          ...currentState,
          isBusinessHours: nextBusinessHours,
        };
      });

      console.log(`🕐 Business hours: ${nextBusinessHours ? 'ON' : 'OFF'}`);
    }, [demoStateStore])
  );

  useFlowControlDemoActionCommandHandler(
    'adjustSystemLoad',
    useCallback(
      ({ load }) => {
        demoStateStore.update((currentState) => ({
          ...currentState,
          systemLoad: load,
        }));

        console.log(`⚡ System load adjusted to: ${(load * 100).toFixed(0)}%`);
      },
      [demoStateStore]
    )
  );

  useFlowControlDemoActionCommandHandler(
    'setSelectedScenario',
    useCallback(
      ({ scenario }) => {
        demoStateStore.update((currentState) => ({
          ...currentState,
          selectedScenario: scenario,
        }));
      },
      [demoStateStore]
    )
  );

  useFlowControlDemoActionCommandHandler(
    'recordExecutionStep',
    useCallback(
      ({ step }) => {
        let scenarioSnapshot = '';
        let stepNumber = 0;

        demoStateStore.update((currentState) => {
          scenarioSnapshot = currentState.selectedScenario;
          stepNumber = currentState.executionPath.length + 1;
          return {
            ...currentState,
            executionPath: [...currentState.executionPath, step],
          };
        });

        logger.info(`🔀 Pipeline Step: ${step}`, {
          scenario: scenarioSnapshot,
          step: stepNumber,
          timestamp: new Date().toISOString(),
        });
      },
      [demoStateStore, logger]
    )
  );

  useFlowControlDemoActionCommandHandler(
    'recordHandlerExecution',
    useCallback(() => {
      demoStateStore.update((currentState) => ({
        ...currentState,
        handlerExecutions: currentState.handlerExecutions + 1,
      }));
    }, [demoStateStore])
  );

  useFlowControlDemoActionCommandHandler(
    'executeScenario',
    useCallback(
      async ({ scenario, payload }) => {
        const initialState = demoStateStore.getValue();
        if (initialState.isExecuting) return;

        // Reset execution state atomically
        demoStateStore.update((currentState) => ({
          ...currentState,
          isExecuting: true,
          executionResults: [],
          executionPath: [],
          handlerExecutions: 0,
        }));

        console.log(`\n🧪 Executing scenario: ${scenario}`);

        // Log scenario start to monitor
        logger.info(`🧪 Scenario Started: ${scenario}`, {
          scenario,
          payload,
          timestamp: new Date().toISOString(),
        });

        try {
          let executionResult: ExecutionResult<unknown>;

          switch (scenario) {
            case 'securityEscalation':
            case 'securitySuccess':
            case 'securityNormal':
              executionResult = await securityAction.dispatchWithResult<
                'processRequest',
                SecurityResult
              >('processRequest', payload);
              break;
            case 'cacheOptimization':
            case 'cacheRedisHit':
            case 'cacheMissAll':
              executionResult = await cacheAction.dispatchWithResult<
                'fetchData',
                CacheResult
              >('fetchData', payload);
              break;
            case 'businessHourRouting':
              executionResult = await orderAction.dispatchWithResult<
                'processOrder',
                OrderResult
              >('processOrder', payload);
              break;
            case 'errorRecovery':
              executionResult = await apiAction.dispatchWithResult<
                'apiCall',
                ApiResult
              >('apiCall', payload);
              break;
            default:
              throw new Error(`Unknown scenario: ${scenario}`);
          }

          const displayResult =
            executionResult.result ??
            (executionResult.aborted
              ? {
                  aborted: true,
                  reason: executionResult.abortReason,
                  outcome: executionResult.outcome,
                }
              : {
                  success: executionResult.success,
                  outcome: executionResult.outcome,
                });

          let executionSteps = 0;
          let handlersExecuted = 0;
          demoStateStore.update((currentState) => {
            executionSteps = currentState.executionPath.length;
            handlersExecuted = currentState.handlerExecutions;
            return {
              ...currentState,
              executionResults: [displayResult as any],
              isExecuting: false,
            };
          });

          console.log('✅ Scenario completed:', displayResult);

          // Log scenario success to monitor
          logger.info(`✅ Scenario Completed: ${scenario}`, {
            scenario,
            result: displayResult,
            executionSteps,
            handlersExecuted,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('❌ Scenario failed:', error);

          // Log scenario failure to monitor
          logger.error(`❌ Scenario Failed: ${scenario}`, error as Error, {
            context: `Scenario: ${scenario}, Timestamp: ${new Date().toISOString()}`,
          });

          demoStateStore.update((currentState) => ({
            ...currentState,
            executionResults: [
              {
                success: false,
                message: (error as Error).message,
                endpoint: 'unknown',
                timestamp: Date.now(),
              } as ApiResult,
            ],
            isExecuting: false,
          }));
        }
      },
      [
        apiAction,
        cacheAction,
        demoStateStore,
        logger,
        orderAction,
        securityAction,
      ]
    )
  );

  return null;
}
