/**
 * useImperativeHandle + Ref Context Demo Page
 *
 * This page demonstrates advanced React patterns:
 * - useImperativeHandle for custom ref interfaces
 * - Ref Context for centralized ref management
 * - Cross-component imperative APIs
 * - Complex validation and interaction patterns
 * - Type-safe ref handling
 */

import React, { useState, useCallback } from 'react';
import { RefContextProvider, useRefRegistry, useFormRefs, useModalRefs, useInteractiveRefs } from './imperativeRef/contexts/RefContexts';
import {
  ImperativeInput,
  ImperativeModal,
  ImperativeCounter,
  ImperativeTimer,
} from './imperativeRef/components/ImperativeComponents';
import {
  FormRefHandle,
  ModalRefHandle,
  CounterRefHandle,
  TimerRefHandle
} from './imperativeRef/contexts/RefContexts';
import { HandlerRegistrationTimingDemo } from './imperativeRef/examples/HandlerRegistrationTimingExamples';
import { PerformanceOptimizedDemo } from './imperativeRef/examples/PerformanceOptimizedExamples';
import { TypeSafeErrorHandlingDemo } from './imperativeRef/examples/TypeSafeErrorHandlingExamples';
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';
import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../../../stores/SourceLinkRegistry';

// 🎯 Control Panel Component
function ControlPanel() {
  const registry = useRefRegistry();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  }, []);

  const handleFormOperations = () => {
    addLog('🔍 Validating all form inputs...');
    const isValid = registry.validateAllInputs();
    addLog(`Form validation result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);

    if (isValid) {
      const nameValue = registry.nameInput.current?.getValue() || '';
      const emailValue = registry.emailInput.current?.getValue() || '';
      const messageValue = registry.messageInput.current?.getValue() || '';

      addLog(`📋 Form data: Name="${nameValue}", Email="${emailValue}", Message="${messageValue}"`);
    }
  };

  const handleModalOperations = () => {
    const confirmOpen = registry.confirmModal.current?.isOpen();
    const alertOpen = registry.alertModal.current?.isOpen();

    addLog(`📱 Modal states: Confirm=${confirmOpen}, Alert=${alertOpen}`);

    if (!confirmOpen && !alertOpen) {
      registry.confirmModal.current?.open();
      addLog('🚀 Opened confirmation modal');
    } else {
      registry.closeAllModals();
      addLog('🔒 Closed all modals');
    }
  };

  const handleCounterOperations = () => {
    const currentValue = registry.counter.current?.getValue() || 0;
    addLog(`🔢 Current counter value: ${currentValue}`);

    if (currentValue === 0) {
      registry.counter.current?.setValue(42);
      addLog('🎯 Set counter to 42');
    } else if (currentValue < 50) {
      registry.counter.current?.increment();
      addLog('⬆️ Incremented counter');
    } else {
      registry.counter.current?.reset();
      addLog('🔄 Reset counter to 0');
    }
  };

  const handleTimerOperations = () => {
    const isRunning = registry.timer.current?.isRunning() || false;
    const currentTime = registry.timer.current?.getTime() || 0;

    addLog(`⏱️ Timer status: ${isRunning ? 'Running' : 'Stopped'}, Time: ${currentTime}s`);

    if (!isRunning) {
      registry.timer.current?.start();
      addLog('▶️ Started timer');
    } else {
      registry.timer.current?.stop();
      addLog('⏸️ Stopped timer');
    }
  };

  const handleResetAll = () => {
    registry.resetAllComponents();
    setLogs([]);
    addLog('🧹 Reset all components and cleared logs');
  };

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-purple-50 to-blue-100 p-4 border-b">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>🎮</span>
          Imperative Control Panel
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Control all components using their imperative APIs through ref context
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={handleFormOperations}
            className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            📝 Validate Form
          </button>

          <button
            onClick={handleModalOperations}
            className="px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            📱 Toggle Modals
          </button>

          <button
            onClick={handleCounterOperations}
            className="px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
          >
            🔢 Control Counter
          </button>

          <button
            onClick={handleTimerOperations}
            className="px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
          >
            ⏱️ Control Timer
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => registry.focusFirstInput()}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors text-sm"
          >
            🎯 Focus First Input
          </button>

          <button
            onClick={handleResetAll}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm"
          >
            🧹 Reset All
          </button>
        </div>

        {/* Activity Log */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <span>📊</span>
            Activity Log
          </h4>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-400 text-sm">No activity yet. Try using the control buttons above!</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 font-mono text-sm">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 Form Demo Section
function FormDemo() {
  const { nameInput, emailInput, messageInput } = useFormRefs();
  const [validationStates, setValidationStates] = useState({
    name: false,
    email: false,
    message: false,
  });

  // Memoize validation change handlers to prevent infinite loops
  const handleNameValidationChange = useCallback((isValid: boolean) => {
    setValidationStates(prev => ({ ...prev, name: isValid }));
  }, []);

  const handleEmailValidationChange = useCallback((isValid: boolean) => {
    setValidationStates(prev => ({ ...prev, email: isValid }));
  }, []);

  const handleMessageValidationChange = useCallback((isValid: boolean) => {
    setValidationStates(prev => ({ ...prev, message: isValid }));
  }, []);

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-4 border-b">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>📝</span>
          Form with useImperativeHandle
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Each input exposes custom validation and control methods
        </p>
      </div>

      <div className="p-6 space-y-6">
        <ImperativeInput
          ref={nameInput as React.RefObject<FormRefHandle>}
          label="Full Name"
          placeholder="Enter your full name"
          required
          minLength={2}
          onValidationChange={handleNameValidationChange}
        />

        <ImperativeInput
          ref={emailInput as React.RefObject<FormRefHandle>}
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          required
          onValidationChange={handleEmailValidationChange}
        />

        <ImperativeInput
          ref={messageInput as React.RefObject<FormRefHandle>}
          label="Message"
          type="textarea"
          placeholder="Enter your message"
          required
          minLength={10}
          onValidationChange={handleMessageValidationChange}
        />

        {/* Validation Status */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">Validation Status:</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className={`flex items-center gap-2 ${validationStates.name ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{validationStates.name ? '✅' : '⭕'}</span>
              Name
            </div>
            <div className={`flex items-center gap-2 ${validationStates.email ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{validationStates.email ? '✅' : '⭕'}</span>
              Email
            </div>
            <div className={`flex items-center gap-2 ${validationStates.message ? 'text-green-600' : 'text-gray-400'}`}>
              <span>{validationStates.message ? '✅' : '⭕'}</span>
              Message
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 Interactive Components Demo
function InteractiveDemo() {
  const { counter, timer } = useInteractiveRefs();
  const [counterEvents, setCounterEvents] = useState<string[]>([]);
  const [timerEvents, setTimerEvents] = useState<string[]>([]);

  const addCounterEvent = useCallback((event: string) => {
    setCounterEvents(prev => [event, ...prev.slice(0, 4)]);
  }, []);

  const addTimerEvent = useCallback((event: string) => {
    setTimerEvents(prev => [event, ...prev.slice(0, 4)]);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Counter */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-yellow-50 to-orange-100 p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>🔢</span>
            Imperative Counter
          </h3>
        </div>
        <div className="p-6">
          <ImperativeCounter
            ref={counter as React.RefObject<CounterRefHandle>}
            initialValue={0}
            min={-10}
            max={100}
            step={5}
            onChange={(value) => addCounterEvent(`Counter changed to: ${value}`)}
            className="mb-4"
          />

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Recent Events:</h4>
            <div className="space-y-1 text-xs">
              {counterEvents.length === 0 ? (
                <p className="text-gray-500">No events yet</p>
              ) : (
                counterEvents.map((event, index) => (
                  <div key={index} className="text-gray-700">{event}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Timer */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 border-b">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span>⏱️</span>
            Imperative Timer
          </h3>
        </div>
        <div className="p-6">
          <ImperativeTimer
            ref={timer as React.RefObject<TimerRefHandle>}
            onStart={() => addTimerEvent('Timer started')}
            onStop={() => addTimerEvent('Timer stopped')}
            onReset={() => addTimerEvent('Timer reset')}
            onTick={(time) => {
              if (time % 10 === 0) addTimerEvent(`Timer reached ${time}s`);
            }}
            className="mb-4"
          />

          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Recent Events:</h4>
            <div className="space-y-1 text-xs">
              {timerEvents.length === 0 ? (
                <p className="text-gray-500">No events yet</p>
              ) : (
                timerEvents.map((event, index) => (
                  <div key={index} className="text-gray-700">{event}</div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 Modal Demo
function ModalDemo() {
  const { confirmModal, alertModal } = useModalRefs();

  return (
    <>
      <ImperativeModal
        ref={confirmModal as React.RefObject<ModalRefHandle>}
        title="Confirmation Modal"
        onOpen={() => console.log('Confirm modal opened')}
        onClose={() => console.log('Confirm modal closed')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This is a confirmation modal controlled through useImperativeHandle.
            It can be opened and closed programmatically using ref methods.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => confirmModal.current?.close()}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alertModal.current?.open();
                confirmModal.current?.close();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Confirm & Show Alert
            </button>
          </div>
        </div>
      </ImperativeModal>

      <ImperativeModal
        ref={alertModal as React.RefObject<ModalRefHandle>}
        title="Alert Modal"
        onOpen={() => console.log('Alert modal opened')}
        onClose={() => console.log('Alert modal closed')}
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            ✅ Action confirmed! This alert modal was triggered from the confirmation modal,
            demonstrating cross-modal communication through the ref context.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => alertModal.current?.close()}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
            >
              OK
            </button>
          </div>
        </div>
      </ImperativeModal>
    </>
  );
}

// 🎯 Code Examples Section
function CodeExamplesSection() {
  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>💻</span>
          Code Examples
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Basic useImperativeHandle patterns and usage examples
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic useImperativeHandle Example */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">1. 기본 useImperativeHandle 사용법</h4>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`// 📝 Custom ref interface 정의
interface InputRefHandle {
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  reset: () => void;
}

// 🎯 forwardRef + useImperativeHandle 패턴
const CustomInput = forwardRef<InputRefHandle, InputProps>((props, ref) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔑 KEY: useImperativeHandle로 커스텀 API 노출
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    getValue: () => value,
    setValue: (newValue: string) => setValue(newValue),
    reset: () => setValue(''),
  }), [value]);

  return <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)} />;
});`}
            </pre>
          </div>
        </div>

        {/* Ref Context Pattern */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">2. Ref Context로 중앙화된 ref 관리</h4>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`// 🏗️ Ref Registry 인터페이스 정의
interface RefRegistry {
  inputRef: RefObject<InputRefHandle>;
  modalRef: RefObject<ModalRefHandle>;
  validateAllInputs: () => boolean;
  resetAll: () => void;
}

// 🎯 Ref Context Provider
export function RefContextProvider({ children }: { children: ReactNode }) {
  const inputRef = useRef<InputRefHandle>(null);
  const modalRef = useRef<ModalRefHandle>(null);

  const validateAllInputs = useCallback(() => {
    return inputRef.current?.validate() ?? false;
  }, []);

  const resetAll = useCallback(() => {
    inputRef.current?.reset();
    modalRef.current?.close();
  }, []);

  const registry: RefRegistry = {
    inputRef, modalRef, validateAllInputs, resetAll
  };

  return <RefContext.Provider value={registry}>{children}</RefContext.Provider>;
}`}
            </pre>
          </div>
        </div>

        {/* Usage Example */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">3. 실제 사용 예시</h4>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">
{`// 🎮 Control Panel에서 모든 컴포넌트 제어
function ControlPanel() {
  const { inputRef, modalRef, validateAllInputs, resetAll } = useRefRegistry();

  const handleSubmit = () => {
    if (validateAllInputs()) {
      const value = inputRef.current?.getValue();
      console.log('Form value:', value);
      modalRef.current?.open();
    }
  };

  return (
    <div>
      <button onClick={handleSubmit}>Submit Form</button>
      <button onClick={resetAll}>Reset All</button>
      <button onClick={() => inputRef.current?.focus()}>Focus Input</button>
    </div>
  );
}`}
            </pre>
          </div>
        </div>

        {/* Handler Registration Timing Patterns */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">4. Handler Registration Timing 패턴</h4>
          <div className="space-y-4">
            {/* Mount Logic */}
            <div>
              <h5 className="font-medium text-blue-600 mb-2">🏗️ Mount Logic (마운트 시점 등록)</h5>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Integration Point에서 마운트 시 즉시 등록
function ImperativeRefPage() {
  return (
    <RefContextProvider>        {/* Layer 1: Contexts */}
      <ImperativeRefHandlers    {/* Layer 3: Handlers - Mount Logic */}
        onValidationChange={(field, isValid) => {
          console.log(\`Handler: Field \${field} validation changed\`);
        }}
      >
        <ImperativeRefDemo />
      </ImperativeRefHandlers>
    </RefContextProvider>
  );
}`}
                </pre>
              </div>
            </div>

            {/* Implementation Logic */}
            <div>
              <h5 className="font-medium text-green-600 mb-2">⚙️ Implementation Logic (구현 시점 등록)</h5>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// Handler Layer에서 의존성 변화에 따른 동적 등록
function ImperativeRefHandlers({ validationMode, children }) {
  const refRegistry = useRefRegistry();

  // 🔑 validationMode 변화 시 핸들러 재등록
  const handleValidation = useCallback(() => {
    const formData = {
      name: refRegistry.nameInput.current?.getValue() || '',
      email: refRegistry.emailInput.current?.getValue() || ''
    };

    // 모드에 따른 다른 검증 로직
    const result = validationMode === 'strict'
      ? BusinessLogic.validateFormData(formData)
      : BusinessLogic.validateFormDataLenient(formData);

    return result;
  }, [refRegistry, validationMode]); // 🔑 의존성에 validationMode 포함

  return children;
}`}
                </pre>
              </div>
            </div>

            {/* Conditional Registration */}
            <div>
              <h5 className="font-medium text-yellow-600 mb-2">🎛️ Conditional Logic (조건부 등록)</h5>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// 런타임 조건에 따른 핸들러 등록/해제
function ConditionalHandlers({ isEnabled, children }) {
  const refRegistry = useRefRegistry();

  const handleOperation = useCallback(() => {
    if (!isEnabled) {
      console.log('Handler disabled');
      return;
    }

    // 활성화된 경우에만 실행
    const counterValue = refRegistry.counter.current?.getValue() || 0;
    refRegistry.counter.current?.setValue(counterValue + 1);
  }, [refRegistry, isEnabled]); // 🔑 isEnabled 조건 포함

  return children;
}`}
                </pre>
              </div>
            </div>

            {/* Lazy Registration */}
            <div>
              <h5 className="font-medium text-purple-600 mb-2">⏳ Lazy Logic (지연 등록)</h5>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`// 비동기 초기화 후 핸들러 등록
function LazyHandlers({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const refRegistry = useRefRegistry();

  // 비동기 초기화
  useEffect(() => {
    initializeSystem().then(() => setIsInitialized(true));
  }, []);

  const handleOperation = useCallback(() => {
    if (!isInitialized) {
      console.log('System not initialized yet');
      return;
    }

    // 초기화 완료 후에만 실행
    const isRunning = refRegistry.timer.current?.isRunning();
    if (!isRunning) {
      refRegistry.timer.current?.start();
    }
  }, [refRegistry, isInitialized]); // 🔑 초기화 상태 의존성

  return children;
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">💡 주요 장점</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Imperative Escape Hatch</strong>: 선언적 패러다임의 한계를 극복</li>
            <li>• <strong>Complex Interactions</strong>: 복잡한 UI 상호작용을 체계적으로 관리</li>
            <li>• <strong>Centralized Control</strong>: 여러 컴포넌트를 중앙에서 제어</li>
            <li>• <strong>Type Safety</strong>: 완전한 TypeScript 타입 안전성</li>
            <li>• <strong>Flexible Registration</strong>: Mount, Implementation, Conditional, Lazy 등록 패턴</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// 🎯 Source Directory Section
function SourceDirectorySection() {
  const sourceLinkRegistryStore = useSourceLinkRegistry('entries');
  const registeredFiles = useStoreValue(sourceLinkRegistryStore);

  // Filter files related to this demo - with proper typing
  const demoFiles = Object.entries(registeredFiles as Record<string, any>).filter(([path]) =>
    path.includes('ImperativeRef') || path.includes('imperativeRef')
  );

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-orange-50 to-red-100 p-4 border-b">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>📁</span>
          Source File Directory
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Live source file registry for this demo - powered by useRegisterSourceFile hook
        </p>
      </div>

      <div className="p-6">
        {demoFiles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📄</div>
            <p>Source files are being registered...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demoFiles.map(([path, info]: [string, any]) => (
              <div key={path} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{info.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{info.description}</p>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      Priority: {info.priority}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Instances: {info.instances?.size || 0}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-2 font-mono bg-gray-100 px-2 py-1 rounded">
                  {path}
                </div>

                {info.tags && info.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {info.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Live Registry Stats */}
        <div className="mt-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span>📊</span>
            Live Registry Statistics
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(registeredFiles as Record<string, any>).length}</div>
              <div className="text-gray-600">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{demoFiles.length}</div>
              <div className="text-gray-600">Demo Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {demoFiles.reduce((sum, [, info]: [string, any]) => sum + (info.instances?.size || 0), 0)}
              </div>
              <div className="text-gray-600">Active Instances</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(demoFiles.reduce((sum, [, info]: [string, any]) => sum + (info.priority || 0), 0) / demoFiles.length) || 0}
              </div>
              <div className="text-gray-600">Avg Priority</div>
            </div>
          </div>
        </div>

        {/* Link to Source Directory */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            💡 <strong>Tip:</strong> Visit{' '}
            <a
              href="/utilities/source-directory"
              className="underline hover:text-blue-900 font-medium"
              target="_blank"
              rel="noopener noreferrer"
            >
              /utilities/source-directory
            </a>
            {' '}to see all registered source files across the entire application
          </p>
        </div>
      </div>
    </div>
  );
}

// 🎯 Main Page Component
export default function ImperativeRefPage() {
  // Memoize source file registration options to prevent infinite loops
  const imperativeRefPageOptions = React.useMemo(() => ({
    name: 'ImperativeRefPage',
    description: 'Main demo page showcasing useImperativeHandle + Ref Context patterns',
    tags: ['useImperativeHandle', 'ref-context', 'imperative-api', 'demo'],
    priority: 50
  }), []);

  const refContextsOptions = React.useMemo(() => ({
    name: 'RefContexts',
    description: 'Centralized ref management with context pattern and helper methods',
    tags: ['ref-context', 'context-provider', 'centralized-management'],
    priority: 40
  }), []);

  const imperativeComponentsOptions = React.useMemo(() => ({
    name: 'ImperativeComponents',
    description: 'Components with useImperativeHandle: Input, Modal, Counter, Timer',
    tags: ['useImperativeHandle', 'forwardRef', 'custom-api', 'components'],
    priority: 45
  }), []);

  // Register source files for this demo - options are memoized to prevent re-renders
  useRegisterSourceFile('pages/foundations/react/ImperativeRefPage.tsx', imperativeRefPageOptions);
  useRegisterSourceFile('pages/foundations/react/imperativeRef/contexts/RefContexts.tsx', refContextsOptions);
  useRegisterSourceFile('pages/foundations/react/imperativeRef/components/ImperativeComponents.tsx', imperativeComponentsOptions);

  return (
    <RefContextProvider>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 p-6 rounded-xl border border-purple-100">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            useImperativeHandle + Ref Context Demo
          </h1>
          <p className="text-gray-600">
            Advanced React patterns: Custom ref interfaces, centralized ref management, and cross-component imperative APIs
          </p>
        </div>

        {/* Control Panel */}
        <ControlPanel />

        {/* Form Demo */}
        <FormDemo />

        {/* Interactive Components */}
        <InteractiveDemo />

        {/* Modal Demo (invisible until triggered) */}
        <ModalDemo />

        {/* Code Examples */}
        <CodeExamplesSection />

        {/* Source Directory */}
        <SourceDirectorySection />

        {/* Feature Explanation */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200 p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>✨</span>
            Key Features Demonstrated
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-indigo-800 mb-2">🎯 useImperativeHandle</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Custom ref interfaces with business logic</li>
                <li>• Type-safe imperative APIs</li>
                <li>• Complex validation and control methods</li>
                <li>• Internal state management with external control</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-800 mb-2">🏗️ Ref Context System</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Centralized ref management</li>
                <li>• Cross-component communication</li>
                <li>• Batch operations on multiple components</li>
                <li>• Helper methods for common actions</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-800 mb-2">🔄 Advanced Patterns</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Form validation with imperative control</li>
                <li>• Modal state management via refs</li>
                <li>• Timer and counter with external control</li>
                <li>• Event logging and state tracking</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-indigo-800 mb-2">⚡ Benefits</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Escape hatch for imperative operations</li>
                <li>• Clean separation of concerns</li>
                <li>• Reusable component APIs</li>
                <li>• Framework for complex UI interactions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 🎯 New Section: Handler Registration Timing Examples */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🔄 Handler Registration Timing Patterns
            </h2>
            <p className="text-gray-600">
              이 섹션은 핸들러 등록 시점의 차이점을 보여줍니다. Mount Logic과 Implementation Logic의 구분을 통해
              더 유연하고 강력한 핸들러 관리 패턴을 학습할 수 있습니다.
            </p>
          </div>

          <HandlerRegistrationTimingDemo />

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">📚 학습 포인트</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div>
                <h4 className="font-medium text-blue-600 mb-1">Mount Logic</h4>
                <ul className="space-y-1">
                  <li>• 컴포넌트 마운트 시 즉시 핸들러 등록</li>
                  <li>• 일정한 동작 패턴 보장</li>
                  <li>• Integration Point에서 주로 사용</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-600 mb-1">Implementation Logic</h4>
                <ul className="space-y-1">
                  <li>• 의존성 변화에 따른 동적 등록</li>
                  <li>• 비즈니스 요구사항 반영</li>
                  <li>• Handler Layer에서 구현</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 🎯 Performance Optimization Section */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              ⚡ Performance Optimization Patterns
            </h2>
            <p className="text-gray-600">
              고급 성능 최적화 기법들: 메모리 누수 방지, 리소스 관리, 최적화된 재등록 전략을 통한
              고성능 imperative ref 시스템 구축 방법을 학습할 수 있습니다.
            </p>
          </div>

          <PerformanceOptimizedDemo />
        </div>

        {/* 🎯 Type Safety & Error Handling Section */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              🛡️ Type Safety & Error Handling
            </h2>
            <p className="text-gray-600">
              타입 안전성과 에러 핸들링: 견고한 에러 복구 전략, 회로 차단기 패턴,
              graceful degradation을 통한 안정적인 시스템 구축 패턴을 제공합니다.
            </p>
          </div>

          <TypeSafeErrorHandlingDemo />
        </div>

        {/* 🎯 Architecture Summary */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
          <h2 className="text-xl font-bold text-indigo-900 mb-4">
            🏗️ Complete Architecture Overview
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-4 rounded-lg border border-indigo-100">
              <h3 className="font-semibold text-indigo-800 mb-2">🔄 Handler Registration</h3>
              <ul className="text-sm text-indigo-700 space-y-1">
                <li>• Mount Logic vs Implementation Logic</li>
                <li>• Conditional & Lazy Registration</li>
                <li>• Dynamic Re-registration</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border border-purple-100">
              <h3 className="font-semibold text-purple-800 mb-2">⚡ Performance</h3>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Memory Leak Prevention</li>
                <li>• Optimized Re-registration</li>
                <li>• WeakMap Cleanup Patterns</li>
              </ul>
            </div>

            <div className="bg-white p-4 rounded-lg border border-pink-100">
              <h3 className="font-semibold text-pink-800 mb-2">🛡️ Reliability</h3>
              <ul className="text-sm text-pink-700 space-y-1">
                <li>• Type-Safe Error Handling</li>
                <li>• Circuit Breaker Pattern</li>
                <li>• Graceful Degradation</li>
              </ul>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-indigo-100">
            <h3 className="font-semibold text-indigo-800 mb-2">🎯 Key Learning Outcomes</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-indigo-700">
              <ul className="space-y-1">
                <li>• <strong>Advanced React Patterns</strong>: useImperativeHandle, forwardRef, Context patterns</li>
                <li>• <strong>Performance Engineering</strong>: Memory management, cleanup strategies</li>
                <li>• <strong>Error Resilience</strong>: Robust error handling and recovery mechanisms</li>
              </ul>
              <ul className="space-y-1">
                <li>• <strong>Type Safety</strong>: Complete TypeScript integration with runtime safety</li>
                <li>• <strong>Architectural Patterns</strong>: Handler registration timing variations</li>
                <li>• <strong>Production Ready</strong>: Real-world applicable patterns and best practices</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </RefContextProvider>
  );
}