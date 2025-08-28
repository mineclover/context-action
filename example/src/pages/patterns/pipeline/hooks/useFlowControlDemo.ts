import { useState, useCallback, useEffect, useMemo } from 'react';
import { ActionRegister } from '@context-action/core';
import type { 
  SecurityActions, 
  CacheActions, 
  OrderActions, 
  ApiActions, 
  ScenarioKey 
} from '../scenarios/types';
// Removed imports for deleted handlers

// Dummy handler setup functions
const setupSecurityHandlers = (_register: any, _deps: any) => () => {};
const setupCacheHandlers = (_register: any, _deps: any) => () => {};
const setupOrderHandlers = (_register: any, _deps: any) => () => {};
const setupApiHandlers = (_register: any, _deps: any) => () => {};

// Simulated cache
const memoryCache = new Map<string, any>();
const redisCache = new Map<string, any>();

export function useFlowControlDemo() {
  // State management
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('securityEscalation');
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const [executionPath, setExecutionPath] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [handlerExecutions, setHandlerExecutions] = useState(0);
  const [systemLoad, setSystemLoad] = useState(0.3);
  const [isBusinessHours, setIsBusinessHours] = useState(true);

  // Action registers
  const [securityRegister] = useState(() => new ActionRegister<SecurityActions>());
  const [cacheRegister] = useState(() => new ActionRegister<CacheActions>());
  const [orderRegister] = useState(() => new ActionRegister<OrderActions>());
  const [apiRegister] = useState(() => new ActionRegister<ApiActions>());

  // Handler dependencies - memoized to prevent re-registration
  const handlerDeps = useMemo(() => ({
    setExecutionPath,
    setHandlerExecutions,
    memoryCache,
    redisCache,
    isBusinessHours
  }), [isBusinessHours]);

  // Setup handlers - only once per register
  useEffect(() => {
    console.log('🔧 Setting up security handlers');
    const cleanupSecurity = setupSecurityHandlers(securityRegister, handlerDeps);
    return () => {
      console.log('🧹 Cleaning up security handlers');
      cleanupSecurity();
    };
  }, [securityRegister, handlerDeps]);

  useEffect(() => {
    console.log('🔧 Setting up cache handlers');
    const cleanupCache = setupCacheHandlers(cacheRegister, handlerDeps);
    return () => {
      console.log('🧹 Cleaning up cache handlers');
      cleanupCache();
    };
  }, [cacheRegister, handlerDeps]);

  useEffect(() => {
    console.log('🔧 Setting up order handlers');
    const cleanupOrder = setupOrderHandlers(orderRegister, handlerDeps);
    return () => {
      console.log('🧹 Cleaning up order handlers');
      cleanupOrder();
    };
  }, [orderRegister, handlerDeps]);

  useEffect(() => {
    console.log('🔧 Setting up API handlers');
    const cleanupApi = setupApiHandlers(apiRegister, handlerDeps);
    return () => {
      console.log('🧹 Cleaning up API handlers');
      cleanupApi();
    };
  }, [apiRegister, handlerDeps]);

  // System control functions
  const clearCache = useCallback(() => {
    memoryCache.clear();
    redisCache.clear();
    console.log('🗑️ Cache cleared');
  }, []);

  const toggleBusinessHours = useCallback(() => {
    setIsBusinessHours(prev => {
      const newValue = !prev;
      console.log(`🕐 Business hours: ${newValue ? 'ON' : 'OFF'}`);
      return newValue;
    });
  }, []);

  const adjustSystemLoad = useCallback((load: number) => {
    setSystemLoad(load);
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
        case 'securitySuccess':
        case 'securityNormal':
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