/**
 * Handler Registration Timing Examples
 *
 * This file demonstrates different handler registration patterns:
 * - Mount Logic: Handlers registered when components mount
 * - Implementation Logic: Handlers registered based on dependencies/conditions
 * - Conditional Registration: Handlers registered based on runtime conditions
 * - Lazy Registration: Handlers registered after async initialization
 */

import React, { useState, useCallback } from 'react';
import { useRefRegistry } from '../contexts/RefContexts';
import { validateFormData, validateFormDataLenient, FormData, calculateCounterValue } from '../business/imperativeRefBusinessLogic';

// 🎯 Example 1: Mount Logic Registration
// Handlers are registered immediately when component mounts
export function MountLogicExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Mount Logic: Handler registered immediately on component mount
  const handleFormValidation = useCallback(() => {
    addLog('🔍 Mount Logic: Form validation triggered');

    const formData: FormData = {
      name: refRegistry.nameInput.current?.getValue() || '',
      email: refRegistry.emailInput.current?.getValue() || '',
      message: refRegistry.messageInput.current?.getValue() || ''
    };

    const result = validateFormData(formData);
    addLog(`📋 Mount Logic: Validation ${result.isValid ? 'passed' : 'failed'}`);

    return result;
  }, [refRegistry, addLog]);

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-blue-800 mb-2">🏗️ Mount Logic Registration</h3>
      <p className="text-sm text-blue-600 mb-3">
        Handler registered immediately when component mounts
      </p>

      <button
        onClick={handleFormValidation}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
      >
        Validate Form (Mount Logic)
      </button>

      <div className="mt-3 text-xs bg-blue-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-blue-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-blue-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Example 2: Implementation Logic Registration
// Handlers re-register when dependencies change
export function ImplementationLogicExample({
  validationMode,
  children
}: {
  validationMode: 'strict' | 'lenient';
  children: React.ReactNode;
}) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Implementation Logic: Handler re-registers when validationMode changes
  const handleDynamicValidation = useCallback(() => {
    addLog(`🔄 Implementation Logic: Using ${validationMode} validation`);

    const formData: FormData = {
      name: refRegistry.nameInput.current?.getValue() || '',
      email: refRegistry.emailInput.current?.getValue() || '',
      message: refRegistry.messageInput.current?.getValue() || ''
    };

    // Different validation logic based on mode
    const result = validationMode === 'strict'
      ? validateFormData(formData)
      : validateFormDataLenient?.(formData) || validateFormData(formData);

    addLog(`📋 Implementation Logic: ${validationMode} validation ${result.isValid ? 'passed' : 'failed'}`);

    return result;
  }, [refRegistry, addLog, validationMode]); // 🔑 Dependencies include validationMode

  return (
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <h3 className="font-semibold text-green-800 mb-2">⚙️ Implementation Logic Registration</h3>
      <p className="text-sm text-green-600 mb-3">
        Handler re-registers when validationMode dependency changes
      </p>
      <p className="text-xs text-green-500 mb-2">Current mode: <strong>{validationMode}</strong></p>

      <button
        onClick={handleDynamicValidation}
        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
      >
        Validate Form (Implementation Logic)
      </button>

      <div className="mt-3 text-xs bg-green-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-green-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-green-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Example 3: Conditional Registration
// Handlers are registered only when certain conditions are met
export function ConditionalRegistrationExample({
  isEnabled,
  children
}: {
  isEnabled: boolean;
  children: React.ReactNode;
}) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Conditional Logic: Handler only exists when isEnabled is true
  const handleConditionalOperation = useCallback(() => {
    if (!isEnabled) {
      addLog('❌ Conditional Logic: Handler disabled');
      return;
    }

    addLog('✅ Conditional Logic: Handler enabled and executing');

    const counterValue = refRegistry.counter.current?.getValue() || 0;
    const newValue = calculateCounterValue(counterValue, 'increment', {
      step: 1,
      min: 0,
      max: 100
    });

    refRegistry.counter.current?.setValue(newValue);
    addLog(`🔢 Conditional Logic: Counter updated to ${newValue}`);

  }, [refRegistry, addLog, isEnabled]); // 🔑 Handler behavior depends on isEnabled

  return (
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h3 className="font-semibold text-yellow-800 mb-2">🎛️ Conditional Registration</h3>
      <p className="text-sm text-yellow-600 mb-3">
        Handler behavior changes based on isEnabled condition
      </p>
      <p className="text-xs text-yellow-500 mb-2">Status: <strong>{isEnabled ? 'Enabled' : 'Disabled'}</strong></p>

      <button
        onClick={handleConditionalOperation}
        className={`px-3 py-1 rounded text-sm ${
          isEnabled
            ? 'bg-yellow-600 text-white hover:bg-yellow-700'
            : 'bg-gray-400 text-white cursor-not-allowed'
        }`}
      >
        Increment Counter (Conditional)
      </button>

      <div className="mt-3 text-xs bg-yellow-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-yellow-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-yellow-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Example 4: Lazy Registration
// Handlers are registered after async initialization
export function LazyRegistrationExample({ children }: { children: React.ReactNode }) {
  const refRegistry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 4)]);
  }, []);

  // 🔑 Async initialization simulation
  const initializeSystem = useCallback(async () => {
    if (isInitializing) return;

    setIsInitializing(true);
    addLog('🚀 Lazy Logic: Starting async initialization...');

    // Simulate async initialization (API call, config loading, etc.)
    await new Promise(resolve => setTimeout(resolve, 1500));

    setIsInitialized(true);
    setIsInitializing(false);
    addLog('✅ Lazy Logic: Initialization complete - handlers ready');
  }, [addLog, isInitializing]);

  // 🔑 Lazy Logic: Handler only works after initialization
  const handleLazyOperation = useCallback(() => {
    if (!isInitialized) {
      addLog('⏳ Lazy Logic: System not initialized yet');
      return;
    }

    addLog('🎯 Lazy Logic: Executing timer operation');

    const isRunning = refRegistry.timer.current?.isRunning() || false;

    if (!isRunning) {
      refRegistry.timer.current?.start();
      addLog('▶️ Lazy Logic: Timer started');
    } else {
      refRegistry.timer.current?.stop();
      addLog('⏸️ Lazy Logic: Timer stopped');
    }
  }, [refRegistry, addLog, isInitialized]); // 🔑 Handler depends on initialization state

  return (
    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
      <h3 className="font-semibold text-purple-800 mb-2">⏳ Lazy Registration</h3>
      <p className="text-sm text-purple-600 mb-3">
        Handler is functional only after async initialization
      </p>
      <p className="text-xs text-purple-500 mb-2">
        Status: <strong>
          {isInitializing ? 'Initializing...' : isInitialized ? 'Ready' : 'Not Initialized'}
        </strong>
      </p>

      <div className="flex gap-2 mb-3">
        <button
          onClick={initializeSystem}
          disabled={isInitializing || isInitialized}
          className={`px-3 py-1 rounded text-sm ${
            isInitialized
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : isInitializing
                ? 'bg-purple-400 text-white cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {isInitializing ? 'Initializing...' : isInitialized ? 'Initialized' : 'Initialize System'}
        </button>

        <button
          onClick={handleLazyOperation}
          className={`px-3 py-1 rounded text-sm ${
            isInitialized
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          Toggle Timer (Lazy)
        </button>
      </div>

      <div className="mt-3 text-xs bg-purple-100 p-2 rounded max-h-20 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-purple-500">No activity yet</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="text-purple-700 font-mono">{log}</div>
          ))
        )}
      </div>

      {children}
    </div>
  );
}

// 🎯 Main Demo Component showing all patterns
export function HandlerRegistrationTimingDemo() {
  const [validationMode, setValidationMode] = useState<'strict' | 'lenient'>('strict');
  const [isConditionalEnabled, setIsConditionalEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h2 className="text-lg font-bold text-gray-800 mb-3">
          🔄 Handler Registration Timing Patterns
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          이 예제는 핸들러 등록 시점의 차이점을 보여줍니다: Mount Logic vs Implementation Logic
        </p>

        {/* Control Panel */}
        <div className="flex flex-wrap gap-4 mb-4 p-3 bg-white rounded border">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Validation Mode:</label>
            <select
              value={validationMode}
              onChange={(e) => setValidationMode(e.target.value as 'strict' | 'lenient')}
              className="text-sm border rounded px-2 py-1"
            >
              <option value="strict">Strict</option>
              <option value="lenient">Lenient</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Conditional Handler:</label>
            <button
              onClick={() => setIsConditionalEnabled(!isConditionalEnabled)}
              className={`text-sm px-3 py-1 rounded ${
                isConditionalEnabled
                  ? 'bg-green-600 text-white'
                  : 'bg-red-600 text-white'
              }`}
            >
              {isConditionalEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </div>

      {/* Example Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <MountLogicExample>
          <div></div>
        </MountLogicExample>

        <ImplementationLogicExample validationMode={validationMode}>
          <div></div>
        </ImplementationLogicExample>

        <ConditionalRegistrationExample isEnabled={isConditionalEnabled}>
          <div></div>
        </ConditionalRegistrationExample>

        <LazyRegistrationExample>
          <div></div>
        </LazyRegistrationExample>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 text-white p-4 rounded-lg">
        <h3 className="font-semibold mb-2">🎯 핵심 차이점</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong className="text-blue-300">Mount Logic:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• 컴포넌트 마운트 시 즉시 등록</li>
              <li>• 일정한 핸들러 동작</li>
              <li>• 의존성 변화 없음</li>
            </ul>
          </div>
          <div>
            <strong className="text-green-300">Implementation Logic:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• 의존성 변화 시 재등록</li>
              <li>• 동적 핸들러 동작</li>
              <li>• 비즈니스 요구사항 반영</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}