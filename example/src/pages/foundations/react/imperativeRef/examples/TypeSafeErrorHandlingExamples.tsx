/**
 * Type-Safe Error Handling Examples for Handler Registration
 *
 * This file demonstrates advanced error handling and type safety patterns:
 * - Robust error boundaries
 * - Type-safe error handling
 * - Graceful degradation
 * - Error recovery strategies
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRefRegistry } from '../contexts/RefContexts';
import { validateFormData, FormData } from '../business/imperativeRefBusinessLogic';

// 🎯 Advanced Error Types
interface HandlerError {
  code: string;
  message: string;
  timestamp: number;
  context?: Record<string, any>;
  recoverable: boolean;
}

interface ErrorState {
  hasError: boolean;
  error: HandlerError | null;
  errorCount: number;
  lastRecovery?: number;
}

// 🎯 Error Factory Functions
function createValidationError(message: string, context?: Record<string, any>): HandlerError {
  return {
    code: 'VALIDATION_ERROR',
    message,
    timestamp: Date.now(),
    context,
    recoverable: true
  };
}

function createRefError(message: string, refName: string): HandlerError {
  return {
    code: 'REF_ERROR',
    message,
    timestamp: Date.now(),
    context: { refName },
    recoverable: true
  };
}

function createSystemError(message: string): HandlerError {
  return {
    code: 'SYSTEM_ERROR',
    message,
    timestamp: Date.now(),
    recoverable: false
  };
}

// 🎯 Error Recovery Hook
function useErrorRecovery() {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorCount: 0
  });

  const reportError = useCallback((error: HandlerError) => {
    setErrorState(prev => ({
      hasError: true,
      error,
      errorCount: prev.errorCount + 1,
      lastRecovery: prev.lastRecovery
    }));
  }, []);

  const recoverFromError = useCallback(() => {
    setErrorState(prev => ({
      hasError: false,
      error: null,
      errorCount: prev.errorCount,
      lastRecovery: Date.now()
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorCount: 0
    });
  }, []);

  return {
    errorState,
    reportError,
    recoverFromError,
    clearErrors
  };
}

// 🎯 Type-Safe Error Handling Example
export function TypeSafeErrorHandlingExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const { errorState, reportError, recoverFromError, clearErrors } = useErrorRecovery();

  const addLog = useCallback((message: string, type: 'info' | 'error' | 'success' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    setLogs(prev => [`[${timestamp}] ${emoji} ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Type-Safe Handler with Error Handling
  const handleSafeValidation = useCallback(async () => {
    try {
      addLog('🔍 Starting type-safe validation');

      // Type-safe ref access with null checking
      const nameInput = refRegistry.nameInput.current;
      const emailInput = refRegistry.emailInput.current;
      const messageInput = refRegistry.messageInput.current;

      if (!nameInput || !emailInput || !messageInput) {
        const missingRefs = [
          !nameInput && 'nameInput',
          !emailInput && 'emailInput',
          !messageInput && 'messageInput'
        ].filter(Boolean).join(', ');

        throw createRefError(
          `Missing refs: ${missingRefs}`,
          missingRefs
        );
      }

      // Safe value extraction with error handling
      const formData: FormData = {
        name: nameInput.getValue?.() || '',
        email: emailInput.getValue?.() || '',
        message: messageInput.getValue?.() || ''
      };

      // Business logic validation with error context
      const result = validateFormData(formData);

      if (!result.isValid) {
        throw createValidationError(
          'Form validation failed',
          { errors: result.errors, formData }
        );
      }

      addLog('✅ Type-safe validation successful', 'success');
      if (errorState.hasError) {
        recoverFromError();
        addLog('🔄 Recovered from previous error', 'success');
      }

    } catch (error) {
      const handlerError = error instanceof Error
        ? createSystemError(error.message)
        : error as HandlerError;

      reportError(handlerError);
      addLog(`❌ Validation failed: ${handlerError.message}`, 'error');
    }
  }, [refRegistry, addLog, errorState.hasError, reportError, recoverFromError]);

  // 🔑 Graceful Degradation Handler
  const handleGracefulOperation = useCallback(() => {
    try {
      addLog('🛡️ Starting graceful operation');

      // Attempt operation with fallback
      const counterRef = refRegistry.counter.current;

      if (counterRef) {
        const currentValue = counterRef.getValue?.() || 0;
        const newValue = Math.min(currentValue + 1, 100);
        counterRef.setValue?.(newValue);
        addLog(`✅ Counter updated to ${newValue}`, 'success');
      } else {
        // Graceful degradation - log but don't fail
        addLog('⚠️ Counter ref not available, skipping operation');
      }

    } catch (error) {
      // Even if error occurs, provide meaningful feedback
      addLog('❌ Operation failed, but application continues', 'error');
    }
  }, [refRegistry, addLog]);

  return (
    <div className="bg-rose-50 p-4 rounded-lg border border-rose-200">
      <h3 className="font-semibold text-rose-800 mb-2">🛡️ Type-Safe Error Handling</h3>
      <p className="text-sm text-rose-600 mb-3">
        Robust error handling with type safety and graceful degradation
      </p>

      {/* Error State Display */}
      {errorState.hasError && (
        <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded">
          <div className="text-sm text-red-800">
            <strong>Error:</strong> {errorState.error?.message}
          </div>
          <div className="text-xs text-red-600 mt-1">
            Code: {errorState.error?.code} |
            Recoverable: {errorState.error?.recoverable ? 'Yes' : 'No'}
          </div>
        </div>
      )}

      {/* Error Statistics */}
      <div className="mb-3 text-xs text-rose-600">
        Total Errors: {errorState.errorCount} |
        Status: {errorState.hasError ? 'Error State' : 'Healthy'}
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleSafeValidation}
          className="px-3 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700"
        >
          Type-Safe Validation
        </button>

        <button
          onClick={handleGracefulOperation}
          className="px-3 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700"
        >
          Graceful Operation
        </button>

        {errorState.hasError && (
          <button
            onClick={recoverFromError}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
          >
            Recover
          </button>
        )}

        <button
          onClick={clearErrors}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Clear All
        </button>
      </div>

      <div className="text-xs bg-rose-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-rose-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-rose-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Circuit Breaker Pattern Example
export function CircuitBreakerExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const [failureCount, setFailureCount] = useState(0);
  const [circuitState, setCircuitState] = useState<'closed' | 'open' | 'half-open'>('closed');
  const [lastFailure, setLastFailure] = useState<number>(0);

  const FAILURE_THRESHOLD = 3;
  const RECOVERY_TIMEOUT = 5000; // 5 seconds

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Circuit Breaker Logic
  const executeWithCircuitBreaker = useCallback(async (operation: () => Promise<void> | void) => {
    // Check if circuit should be half-open (recovery attempt)
    if (circuitState === 'open' && Date.now() - lastFailure > RECOVERY_TIMEOUT) {
      setCircuitState('half-open');
      addLog('🔄 Circuit breaker: attempting recovery');
    }

    // Reject if circuit is open
    if (circuitState === 'open') {
      addLog('⛔ Circuit breaker: operation rejected (circuit open)');
      return;
    }

    try {
      await operation();

      // Success: reset failure count and close circuit
      if (circuitState === 'half-open') {
        setCircuitState('closed');
        setFailureCount(0);
        addLog('✅ Circuit breaker: recovery successful');
      }

    } catch (error) {
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);
      setLastFailure(Date.now());

      if (newFailureCount >= FAILURE_THRESHOLD) {
        setCircuitState('open');
        addLog(`🚨 Circuit breaker: opened after ${newFailureCount} failures`);
      } else {
        addLog(`❌ Operation failed (${newFailureCount}/${FAILURE_THRESHOLD})`);
      }
    }
  }, [circuitState, failureCount, lastFailure, addLog]);

  // 🔑 Potentially Failing Operation
  const handleRiskyOperation = useCallback(() => {
    executeWithCircuitBreaker(async () => {
      addLog('🎲 Executing risky operation');

      // Simulate random failure (30% chance)
      if (Math.random() < 0.3) {
        throw new Error('Simulated failure');
      }

      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 500));

      const formData: FormData = {
        name: refRegistry.nameInput.current?.getValue() || '',
        email: refRegistry.emailInput.current?.getValue() || '',
        message: refRegistry.messageInput.current?.getValue() || ''
      };

      const result = validateFormData(formData);
      addLog(`✅ Risky operation succeeded: ${result.isValid ? 'Valid' : 'Invalid'}`);
    });
  }, [executeWithCircuitBreaker, refRegistry, addLog]);

  // Reset circuit breaker
  const resetCircuitBreaker = useCallback(() => {
    setCircuitState('closed');
    setFailureCount(0);
    setLastFailure(0);
    addLog('🔄 Circuit breaker reset');
  }, [addLog]);

  return (
    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
      <h3 className="font-semibold text-orange-800 mb-2">⚡ Circuit Breaker Pattern</h3>
      <p className="text-sm text-orange-600 mb-3">
        Automatic failure detection and recovery with circuit breaker pattern
      </p>

      {/* Circuit State Display */}
      <div className="mb-3 text-sm">
        <span className="font-medium">Circuit State: </span>
        <span className={`px-2 py-1 rounded text-xs font-bold ${
          circuitState === 'closed' ? 'bg-green-200 text-green-800' :
          circuitState === 'open' ? 'bg-red-200 text-red-800' :
          'bg-yellow-200 text-yellow-800'
        }`}>
          {circuitState.toUpperCase()}
        </span>
        <span className="ml-2 text-xs text-orange-600">
          Failures: {failureCount}/{FAILURE_THRESHOLD}
        </span>
      </div>

      <div className="flex gap-2 mb-3">
        <button
          onClick={handleRiskyOperation}
          disabled={circuitState === 'open'}
          className={`px-3 py-1 rounded text-sm ${
            circuitState === 'open'
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          Risky Operation
        </button>

        <button
          onClick={resetCircuitBreaker}
          className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
        >
          Reset Circuit
        </button>
      </div>

      <div className="text-xs bg-orange-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-orange-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-orange-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Main Type Safety Demo
export function TypeSafeErrorHandlingDemo() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          🛡️ Type-Safe Error Handling Patterns
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          고급 에러 처리 및 타입 안전성 패턴: 강건한 에러 핸들링, 회복 전략, 회로 차단기 패턴
        </p>
      </div>

      {/* Examples Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <TypeSafeErrorHandlingExample>
          <div></div>
        </TypeSafeErrorHandlingExample>

        <CircuitBreakerExample>
          <div></div>
        </CircuitBreakerExample>
      </div>

      {/* Error Handling Patterns Summary */}
      <div className="bg-slate-50 p-4 rounded-lg border">
        <h3 className="font-semibold text-slate-800 mb-3">🔍 Error Handling Strategies</h3>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-600 mb-1">Type Safety</h4>
            <ul className="space-y-1 text-slate-600">
              <li>• Null/undefined checking</li>
              <li>• Method existence validation</li>
              <li>• Type-safe error objects</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-600 mb-1">Recovery Patterns</h4>
            <ul className="space-y-1 text-slate-600">
              <li>• Graceful degradation</li>
              <li>• Automatic error recovery</li>
              <li>• Fallback mechanisms</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-600 mb-1">Circuit Protection</h4>
            <ul className="space-y-1 text-slate-600">
              <li>• Failure threshold monitoring</li>
              <li>• Automatic circuit opening</li>
              <li>• Recovery timeout handling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}