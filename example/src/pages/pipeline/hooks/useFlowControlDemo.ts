import { useState, useCallback, useEffect } from 'react';
import { ActionRegister } from '@context-action/core';
import type { 
  SecurityActions, 
  CacheActions, 
  OrderActions, 
  ApiActions, 
  ScenarioKey 
} from '../scenarios/types';
import { 
  setupSecurityHandlers,
  setupCacheHandlers,
  setupOrderHandlers,
  setupApiHandlers
} from '../handlers';

// Simulated cache
const memoryCache = new Map<string, any>();
const redisCache = new Map<string, any>();

// Simulated system state
let systemLoad = 0.3;
let isBusinessHours = true;

export function useFlowControlDemo() {
  // State management
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('securityEscalation');
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const [executionPath, setExecutionPath] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [handlerExecutions, setHandlerExecutions] = useState(0);

  // Action registers
  const [securityRegister] = useState(() => new ActionRegister<SecurityActions>());
  const [cacheRegister] = useState(() => new ActionRegister<CacheActions>());
  const [orderRegister] = useState(() => new ActionRegister<OrderActions>());
  const [apiRegister] = useState(() => new ActionRegister<ApiActions>());

  // Handler dependencies
  const handlerDeps = {
    setExecutionPath,
    setHandlerExecutions,
    memoryCache,
    redisCache,
    isBusinessHours
  };

  // Setup handlers
  useEffect(() => {
    const cleanupSecurity = setupSecurityHandlers(securityRegister, handlerDeps);
    return cleanupSecurity;
  }, [securityRegister]);

  useEffect(() => {
    const cleanupCache = setupCacheHandlers(cacheRegister, handlerDeps);
    return cleanupCache;
  }, [cacheRegister]);

  useEffect(() => {
    const cleanupOrder = setupOrderHandlers(orderRegister, handlerDeps);
    return cleanupOrder;
  }, [orderRegister]);

  useEffect(() => {
    const cleanupApi = setupApiHandlers(apiRegister, handlerDeps);
    return cleanupApi;
  }, [apiRegister]);

  // System control functions
  const clearCache = useCallback(() => {
    memoryCache.clear();
    redisCache.clear();
    console.log('🗑️ Cache cleared');
  }, []);

  const toggleBusinessHours = useCallback(() => {
    isBusinessHours = !isBusinessHours;
    console.log(`🕐 Business hours: ${isBusinessHours ? 'ON' : 'OFF'}`);
  }, []);

  const adjustSystemLoad = useCallback((load: number) => {
    systemLoad = load;
    console.log(`⚡ System load adjusted to: ${(load * 100).toFixed(0)}%`);
  }, []);

  // Execution function
  const executeScenario = useCallback(async (scenario: ScenarioKey, payload: any) => {
    if (isExecuting) return;
    
    setIsExecuting(true);
    setExecutionResults([]);
    setExecutionPath([]);
    setHandlerExecutions(0);

    console.log(`\n🧪 Executing scenario: ${scenario}`);
    
    try {
      let result;
      
      switch (scenario) {
        case 'securityEscalation':
          result = await securityRegister.dispatchWithResult('processRequest', payload);
          break;
        case 'cacheOptimization':
          result = await cacheRegister.dispatchWithResult('fetchData', payload);
          break;
        case 'businessHourRouting':
          result = await orderRegister.dispatchWithResult('processOrder', payload);
          break;
        case 'errorRecovery':
          result = await apiRegister.dispatchWithResult('apiCall', payload);
          break;
        default:
          throw new Error(`Unknown scenario: ${scenario}`);
      }
      
      setExecutionResults([result]);
      console.log('✅ Scenario completed:', result);
      
    } catch (error) {
      console.error('❌ Scenario failed:', error);
      setExecutionResults([{ error: (error as Error).message, timestamp: Date.now() }]);
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, securityRegister, cacheRegister, orderRegister, apiRegister]);

  return {
    // State
    selectedScenario,
    executionResults,
    executionPath,
    isExecuting,
    handlerExecutions,
    systemLoad,
    isBusinessHours,
    
    // Actions
    setSelectedScenario,
    executeScenario,
    clearCache,
    toggleBusinessHours,
    adjustSystemLoad
  };
}