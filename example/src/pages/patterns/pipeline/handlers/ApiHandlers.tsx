import { useCallback } from 'react';
import { useApiActionHandler } from '../contexts/FlowControlContexts';

// import type { ApiResult } from '../scenarios/types';

interface ApiHandlerProps {
  onExecutionStep: (step: string) => void;
  onHandlerExecution: () => void;
}

export function ApiHandlers({
  onExecutionStep,
  onHandlerExecution,
}: ApiHandlerProps) {
  // Primary API Handler (P:1000) - First attempt
  const primaryApiHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🌐 Primary API Call (P:1000)');
      onHandlerExecution();

      console.log('🌐 Primary API attempt:', payload.endpoint);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Simulate failure based on payload
      if (payload.shouldFail) {
        console.log('❌ Primary API failed - Jump to retry handler');
        onExecutionStep('❌ Primary API Failed - Route to Retry');

        // Jump to retry handler with lower priority
        controller.jumpToPriority(500);
        return;
      }

      console.log('✅ Primary API successful');
      onExecutionStep('✅ Primary API Success');

      controller.return({
        success: true,
        attempt: 1,
        endpoint: payload.endpoint,
        timestamp: Date.now(),
      });
    },
    [onExecutionStep, onHandlerExecution]
  );

  // Retry Handler (P:500) - Second attempt with backoff
  const retryHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🔄 Retry Handler (P:500)');
      onHandlerExecution();

      const currentRetry = (payload.retryCount || 0) + 1;
      console.log(`🔄 API retry attempt ${currentRetry}:`, payload.endpoint);

      // Exponential backoff simulation
      const backoffDelay = 100; // Reduced for demo
      await new Promise((resolve) => setTimeout(resolve, backoffDelay));

      // Simulate retry failure (for demo purposes, always fail to show fallback)
      console.log(`❌ Retry ${currentRetry} failed - Service unavailable`);
      onExecutionStep(`❌ Retry ${currentRetry} Failed - Service Unavailable`);

      if (payload.fallbackEnabled) {
        console.log('📋 Fallback enabled - Jump to fallback handler');
        onExecutionStep('📋 Route to Fallback Handler (P:100)');
        controller.jumpToPriority(100);
        return;
      } else {
        // No fallback available - abort
        controller.abort('Retry failed and no fallback available');
        controller.return({
          success: false,
          attempt: currentRetry,
          message: 'Retry failed without fallback',
          endpoint: payload.endpoint,
          timestamp: Date.now(),
        });
      }
    },
    [onExecutionStep, onHandlerExecution]
  );

  // Circuit Breaker Handler (P:1100) - Prevent cascading failures
  const circuitBreakerHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('⚡ Circuit Breaker Check (P:1100)');
      onHandlerExecution();

      console.log('⚡ Circuit breaker evaluation for:', payload.endpoint);

      // Simulate circuit breaker state check
      await new Promise((resolve) => setTimeout(resolve, 50));

      // For demo: circuit breaker is always CLOSED to allow demo flow
      console.log('✅ Circuit breaker CLOSED - Allow request');
      onExecutionStep('✅ Circuit Breaker CLOSED - Continue to Primary API');
      return; // Continue to next handler
    },
    [onExecutionStep, onHandlerExecution]
  );

  // Fallback Handler (P:100) - Last resort
  const fallbackHandler = useCallback(
    async (payload: any, controller: any): Promise<void> => {
      onExecutionStep('🆘 Fallback Handler (P:100)');
      onHandlerExecution();

      console.log('🆘 Fallback processing for:', payload.endpoint);

      // Simulate fallback processing
      await new Promise((resolve) => setTimeout(resolve, 100));

      console.log('✅ Fallback successful');
      onExecutionStep('✅ Fallback Success - Degraded Mode');

      controller.return({
        success: true,
        fallbackUsed: true,
        message: 'Fallback service used',
        endpoint: `${payload.endpoint}/fallback`,
        timestamp: Date.now(),
      });
    },
    [onExecutionStep, onHandlerExecution]
  );

  // Register handlers with priorities
  // Use blocking: true to enable proper pipeline flow control
  // Priority order: Higher numbers execute first
  // Flow: Circuit Breaker (P:1100) → Primary API (P:1000) → Retry (P:500) → Fallback (P:100)
  useApiActionHandler('apiCall', circuitBreakerHandler, {
    priority: 1100,
    blocking: true,
  });
  useApiActionHandler('apiCall', primaryApiHandler, {
    priority: 1000,
    blocking: true,
  });
  useApiActionHandler('apiCall', retryHandler, {
    priority: 500,
    blocking: true,
  });
  useApiActionHandler('apiCall', fallbackHandler, {
    priority: 100,
    blocking: true,
  });

  return null;
}
