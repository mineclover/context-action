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
          ref={nameInput}
          label="Full Name"
          placeholder="Enter your full name"
          required
          minLength={2}
          onValidationChange={(isValid) =>
            setValidationStates(prev => ({ ...prev, name: isValid }))
          }
        />

        <ImperativeInput
          ref={emailInput}
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          required
          onValidationChange={(isValid) =>
            setValidationStates(prev => ({ ...prev, email: isValid }))
          }
        />

        <ImperativeInput
          ref={messageInput}
          label="Message"
          type="textarea"
          placeholder="Enter your message"
          required
          minLength={10}
          onValidationChange={(isValid) =>
            setValidationStates(prev => ({ ...prev, message: isValid }))
          }
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
            ref={counter}
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
            ref={timer}
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
        ref={confirmModal}
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
        ref={alertModal}
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

// 🎯 Main Page Component
export default function ImperativeRefPage() {
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
      </div>
    </RefContextProvider>
  );
}