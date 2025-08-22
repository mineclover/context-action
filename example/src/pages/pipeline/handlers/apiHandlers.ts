import type { ActionRegister } from '@context-action/core';
import type { ApiActions, ApiResult } from '../scenarios/types';

export interface ApiHandlerDependencies {
  setExecutionPath: React.Dispatch<React.SetStateAction<string[]>>;
  setHandlerExecutions: React.Dispatch<React.SetStateAction<number>>;
}

export function setupApiHandlers(
  register: ActionRegister<ApiActions>,
  deps: ApiHandlerDependencies
) {
  const { setExecutionPath, setHandlerExecutions } = deps;
  let retryCount = 0;

  // Primary API handler (priority 100)
  const unregisterPrimary = register.register<'apiCall', ApiResult>('apiCall', async (payload, controller) => {
    console.log(`🌐 Making API call to ${payload.endpoint}...`);
    setExecutionPath(prev => [...prev, 'primary-api-call']);
    setHandlerExecutions(prev => prev + 1);
    
    if (payload.shouldFail && retryCount < 2) {
      retryCount++;
      console.log(`❌ API call failed (attempt ${retryCount})`);
      setExecutionPath(prev => [...prev, `api-failure-attempt-${retryCount}`]);
      controller.jumpToPriority(500); // Jump to retry handler
      throw new Error(`API call failed (attempt ${retryCount})`);
    }
    
    retryCount = 0; // Reset on success
    return { 
      success: true, 
      attempt: retryCount + 1,
      endpoint: payload.endpoint,
      timestamp: Date.now()
    };
  }, { priority: 100, id: 'primary-api' });

  // Retry handler (priority 500)
  const unregisterRetry = register.register<'apiCall', void>('apiCall', async (payload, controller) => {
    console.log(`🔄 Retry attempt ${retryCount}`);
    setExecutionPath(prev => [...prev, `retry-attempt-${retryCount}`]);
    setHandlerExecutions(prev => prev + 1);
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Backoff delay
    
    if (retryCount >= 3) {
      console.log('🚨 Max retries exceeded, jumping to fallback');
      setExecutionPath(prev => [...prev, 'max-retries-exceeded']);
      controller.jumpToPriority(1000); // Jump to fallback
      return;
    }
    
    // Retry by jumping back to primary
    controller.jumpToPriority(100);
  }, { priority: 500, id: 'retry' });

  // Fallback handler (priority 1000)
  const unregisterFallback = register.register<'apiCall', ApiResult>('apiCall', async (payload, controller) => {
    console.log('🛟 Using fallback mechanism');
    setExecutionPath(prev => [...prev, 'fallback-mechanism']);
    setHandlerExecutions(prev => prev + 1);
    
    return { 
      success: false, 
      fallbackUsed: true, 
      message: 'Using cached data',
      endpoint: payload.endpoint,
      timestamp: Date.now()
    };
  }, { priority: 1000, id: 'fallback' });

  // Cleanup function
  return () => {
    unregisterPrimary();
    unregisterRetry();
    unregisterFallback();
    retryCount = 0; // Reset retry count
  };
}