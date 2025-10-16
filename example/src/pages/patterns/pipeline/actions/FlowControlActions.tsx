import React, { useCallback } from 'react';
import { 
  useFlowControlStore,
  useSecurityAction,
  useCacheAction, 
  useOrderAction,
  useApiAction
} from '../contexts/FlowControlContexts';
// import { useStoreValue } from '@context-action/react';
import { useActionLogger } from '@/components/LogMonitor';
import type { ScenarioKey, ApiResult } from '../scenarios/types';

interface FlowControlActionsProps {
  children: React.ReactNode;
}

export function FlowControlActions({ children }: FlowControlActionsProps) {
  const demoStateStore = useFlowControlStore('demoState');
  const cacheStore = useFlowControlStore('cache');
  
  const securityDispatch = useSecurityAction();
  const cacheDispatch = useCacheAction();
  const orderDispatch = useOrderAction();
  const apiDispatch = useApiAction();
  
  // Log Monitor 연동
  const logger = useActionLogger();
  
  // Initialize demo cache data
  React.useEffect(() => {
    const newMemoryCache = new Map();
    const newRedisCache = new Map();
    
    // Pre-populate cache with demo data for cache hit scenario
    newMemoryCache.set('cached-user-profile', {
      id: 'cached-user-profile',
      name: 'John Doe',
      email: 'john@example.com',
      cachedAt: new Date().toISOString(),
      source: 'memory-cache'
    });
    
    newRedisCache.set('redis-cached-profile', {
      id: 'redis-cached-profile', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      cachedAt: new Date().toISOString(),
      source: 'redis-cache'
    });
    
    cacheStore.setValue({
      memoryCache: newMemoryCache,
      redisCache: newRedisCache
    });
    
    console.log('🗂️ Demo cache data initialized');
  }, [cacheStore]);

  // System control actions
  const clearCache = useCallback(() => {
    cacheStore.setValue({
      memoryCache: new Map(),
      redisCache: new Map()
    });
    
    console.log('🗑️ Cache cleared');
  }, [cacheStore]);

  const toggleBusinessHours = useCallback(() => {
    const currentState = demoStateStore.getValue();
    const newBusinessHours = !currentState.isBusinessHours;
    
    demoStateStore.setValue({
      ...currentState,
      isBusinessHours: newBusinessHours
    });
    
    console.log(`🕐 Business hours: ${newBusinessHours ? 'ON' : 'OFF'}`);
  }, [demoStateStore]);

  const adjustSystemLoad = useCallback((load: number) => {
    const currentState = demoStateStore.getValue();
    
    demoStateStore.setValue({
      ...currentState,
      systemLoad: load
    });
    
    console.log(`⚡ System load adjusted to: ${(load * 100).toFixed(0)}%`);
  }, [demoStateStore]);

  const setSelectedScenario = useCallback((scenario: ScenarioKey) => {
    const currentState = demoStateStore.getValue();
    
    demoStateStore.setValue({
      ...currentState,
      selectedScenario: scenario
    });
  }, [demoStateStore]);

  // Execution tracking actions
  const onExecutionStep = useCallback((step: string) => {
    const currentState = demoStateStore.getValue();
    
    // Update execution path
    demoStateStore.setValue({
      ...currentState,
      executionPath: [...currentState.executionPath, step]
    });
    
    // Send to log monitor
    logger.info(`🔀 Pipeline Step: ${step}`, {
      scenario: currentState.selectedScenario,
      step: currentState.executionPath.length + 1,
      timestamp: new Date().toISOString()
    });
  }, [demoStateStore, logger]);

  const onHandlerExecution = useCallback(() => {
    const currentState = demoStateStore.getValue();
    
    demoStateStore.setValue({
      ...currentState,
      handlerExecutions: currentState.handlerExecutions + 1
    });
  }, [demoStateStore]);

  // Main execution action
  const executeScenario = useCallback(async (scenario: ScenarioKey, payload: any) => {
    const currentState = demoStateStore.getValue();
    
    if (currentState.isExecuting) return;
    
    // Reset execution state
    demoStateStore.setValue({
      ...currentState,
      isExecuting: true,
      executionResults: [],
      executionPath: [],
      handlerExecutions: 0
    });

    console.log(`\n🧪 Executing scenario: ${scenario}`);
    
    // Log scenario start to monitor
    logger.info(`🧪 Scenario Started: ${scenario}`, {
      scenario,
      payload,
      timestamp: new Date().toISOString()
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
        isExecuting: false
      });
      
      console.log('✅ Scenario completed:', result);
      
      // Log scenario success to monitor
      logger.info(`✅ Scenario Completed: ${scenario}`, {
        scenario,
        result,
        executionSteps: finalState.executionPath.length,
        handlersExecuted: finalState.handlerExecutions,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Scenario failed:', error);
      
      // Log scenario failure to monitor
      logger.error(`❌ Scenario Failed: ${scenario}`, (error as Error), {
        context: `Scenario: ${scenario}, Timestamp: ${new Date().toISOString()}`
      });
      
      const finalState = demoStateStore.getValue();
      demoStateStore.setValue({
        ...finalState,
        executionResults: [{
          success: false,
          message: (error as Error).message,
          endpoint: 'unknown',
          timestamp: Date.now()
        } as ApiResult],
        isExecuting: false
      });
    }
  }, [demoStateStore, securityDispatch, cacheDispatch, orderDispatch, apiDispatch]);

  // Provide actions via context
  return (
    <FlowControlActionsContext.Provider value={{
      clearCache,
      toggleBusinessHours,
      adjustSystemLoad,
      setSelectedScenario,
      executeScenario,
      onExecutionStep,
      onHandlerExecution
    }}>
      {children}
    </FlowControlActionsContext.Provider>
  );
}

// Actions context for child components
interface FlowControlActionsContextType {
  clearCache: () => void;
  toggleBusinessHours: () => void;
  adjustSystemLoad: (load: number) => void;
  setSelectedScenario: (scenario: ScenarioKey) => void;
  executeScenario: (scenario: ScenarioKey, payload: any) => Promise<void>;
  onExecutionStep: (step: string) => void;
  onHandlerExecution: () => void;
}

const FlowControlActionsContext = React.createContext<FlowControlActionsContextType | null>(null);

export function useFlowControlActions() {
  const context = React.useContext(FlowControlActionsContext);
  if (!context) {
    throw new Error('useFlowControlActions must be used within FlowControlActions');
  }
  return context;
}