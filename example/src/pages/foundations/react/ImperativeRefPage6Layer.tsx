/**
 * useImperativeHandle + Ref Context Demo Page (6-Layer Architecture)
 *
 * This page demonstrates the complete 6-Layer Context Architecture:
 * 1. Contexts Layer: RefContextProvider for centralized ref management
 * 2. Business Layer: Pure functions for validation and calculations
 * 3. Handlers Layer: Handler Injection Pattern connecting refs to business logic
 * 4. Actions Layer: Action dispatch functions for UI interactions
 * 5. Hooks Layer: Reactive data subscriptions from ref state
 * 6. Views Layer: Pure UI components with event handling
 *
 * 🔑 Architecture Benefits:
 * - Clean separation of concerns
 * - Pure business logic testability
 * - Handler injection for dependency management
 * - Reactive data flow through hooks
 * - Type-safe imperative APIs
 */

import React, { useState, useCallback } from 'react';

// 🎯 Layer 1: Contexts
import { RefContextProvider } from './imperativeRef/contexts/RefContexts';

// 🎯 Layer 2: Business Logic (imported in handlers)

// 🎯 Layer 3: Handlers
import { ImperativeRefHandlers } from './imperativeRef/handlers/ImperativeRefHandlers';

// 🎯 Layer 4: Actions
import { useImperativeRefActions, ImperativeRefActionHandlers } from './imperativeRef/actions/useImperativeRefActions';

// 🎯 Layer 5: Hooks
import { useImperativeRefData } from './imperativeRef/hooks/useImperativeRefData';

// 🎯 Layer 6: Views
import {
  DemoStatusView,
  ControlPanelView,
  CodeExamplesView,
  ValidationDisplayView,
  // Import imperative components from the existing location
  ImperativeInput,
  ImperativeModal,
  ImperativeCounter,
  ImperativeTimer
} from './imperativeRef/views/ImperativeRefViews';

// External dependencies
import { useRegisterSourceFile } from '../../../hooks/useRegisterSourceFile';
import { useStoreValue } from '@context-action/react';
import { useSourceLinkRegistry } from '../../../stores/SourceLinkRegistry';
import * as BusinessLogic from './imperativeRef/business/imperativeRefBusinessLogic';

// 🎯 Integration Layer Component
function ImperativeRefIntegration({ children }: { children: React.ReactNode }) {
  // State for logging and activity tracking
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]);
  }, []);

  // 🎯 Layer 5: Reactive Data (Hooks Layer)
  const reactiveData = useImperativeRefData();

  // 🎯 Action Handlers for Layer 4 (Actions Layer)
  const actionHandlers: ImperativeRefActionHandlers = {
    onFieldValidation: useCallback((field, isValid) => {
      addLog(`📝 Field "${field}" validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    }, [addLog]),

    onFormSubmit: useCallback((formData, isValid) => {
      if (isValid) {
        addLog(`✅ Form submitted successfully: ${formData.name}, ${formData.email}`);
      } else {
        addLog(`❌ Form submission failed - validation errors`);
      }
    }, [addLog]),

    onCounterChange: useCallback((value) => {
      addLog(`🔢 Counter value changed: ${value}`);
    }, [addLog]),

    onTimerTick: useCallback((time) => {
      if (time % 5 === 0 && time > 0) { // Log every 5 seconds
        addLog(`⏱️ Timer: ${BusinessLogic.formatTimerDisplay(time)}`);
      }
    }, [addLog]),

    onModalToggle: useCallback((modalType, isOpen) => {
      addLog(`🪟 ${modalType} modal ${isOpen ? 'opened' : 'closed'}`);
    }, [addLog]),

    onBatchReset: useCallback(() => {
      addLog(`🔄 All components reset`);
    }, [addLog]),

    onValidateAll: useCallback((isValid) => {
      addLog(`🔍 Validation check: ${isValid ? 'All fields valid' : 'Some fields invalid'}`);
    }, [addLog])
  };

  // Pass integration context to children
  return React.cloneElement(children as React.ReactElement, {
    reactiveData,
    actionHandlers,
    logs
  });
}

// 🎯 Main Demo Components
function ImperativeRefDemo({
  reactiveData,
  actionHandlers,
  logs,
  handlerContext
}: {
  reactiveData: ReturnType<typeof useImperativeRefData>;
  actionHandlers: ImperativeRefActionHandlers;
  logs: string[];
  handlerContext: any;
}) {
  // 🎯 Layer 4: Actions Layer
  const actions = useImperativeRefActions(actionHandlers, handlerContext);

  // 🎯 Validation Change Handlers (memoized to prevent infinite loops)
  const handleNameValidationChange = useCallback((isValid: boolean) => {
    actions.validateField({ field: 'name', isValid });
  }, [actions]);

  const handleEmailValidationChange = useCallback((isValid: boolean) => {
    actions.validateField({ field: 'email', isValid });
  }, [actions]);

  const handleMessageValidationChange = useCallback((isValid: boolean) => {
    actions.validateField({ field: 'message', isValid });
  }, [actions]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            useImperativeHandle + 6-Layer Architecture
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Complete demonstration of imperative React patterns with advanced ref management,
            following the 6-Layer Context Architecture for maximum separation of concerns.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column: Forms and Components */}
          <div className="xl:col-span-2 space-y-6">
            {/* Demo Status Display */}
            <DemoStatusView
              formProgress={reactiveData.formProgress}
              isFormValid={reactiveData.isFormValid}
              counterValue={reactiveData.counterValue}
              counterAtMin={reactiveData.counterAtMin}
              counterAtMax={reactiveData.counterAtMax}
              timerDisplay={reactiveData.timerDisplay}
              isTimerRunning={reactiveData.isTimerRunning}
              modalsOpen={reactiveData.modalsOpen}
            />

            {/* Imperative Form Components */}
            <div className="bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">📝 Imperative Form</h3>
              <div className="space-y-4">
                <ImperativeInput
                  ref={handlerContext?.refRegistry?.nameInput}
                  label="Name"
                  placeholder="Enter your name"
                  required
                  minLength={2}
                  onValidationChange={handleNameValidationChange}
                />

                <ImperativeInput
                  ref={handlerContext?.refRegistry?.emailInput}
                  label="Email"
                  placeholder="Enter your email"
                  type="email"
                  required
                  onValidationChange={handleEmailValidationChange}
                />

                <ImperativeInput
                  ref={handlerContext?.refRegistry?.messageInput}
                  label="Message"
                  placeholder="Enter your message (min 10 characters)"
                  type="textarea"
                  required
                  minLength={10}
                  onValidationChange={handleMessageValidationChange}
                />
              </div>
            </div>

            {/* Interactive Components */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">🔢 Counter</h3>
                <ImperativeCounter
                  ref={handlerContext?.refRegistry?.counter}
                  initialValue={0}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(value) => actions.validateField({ field: 'name', isValid: value > 0 })}
                />
              </div>

              <div className="bg-white p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">⏱️ Timer</h3>
                <ImperativeTimer
                  ref={handlerContext?.refRegistry?.timer}
                  onTick={(time) => actionHandlers.onTimerTick?.(time)}
                />
              </div>
            </div>

            {/* Code Examples */}
            <CodeExamplesView />
          </div>

          {/* Right Column: Controls and Status */}
          <div className="space-y-6">
            {/* Control Panel */}
            <ControlPanelView
              onFormSubmit={() => actions.submitForm()}
              onFormReset={() => actions.resetForm()}
              onFocusFirst={() => actions.focusFirstField()}
              onValidateAll={() => actions.validateAll()}
              onCounterIncrement={() => actions.incrementCounter()}
              onCounterDecrement={() => actions.decrementCounter()}
              onCounterReset={() => actions.resetCounter()}
              onTimerStart={() => actions.startTimer()}
              onTimerStop={() => actions.stopTimer()}
              onTimerReset={() => actions.resetTimer()}
              onModalOpen={(modalType) => actions.openModal({ modalType })}
              onModalClose={(modalType) => actions.closeModal({ modalType })}
              onResetAll={() => actions.resetAll()}
              isFormValid={reactiveData.isFormValid}
              counterAtMin={reactiveData.counterAtMin}
              counterAtMax={reactiveData.counterAtMax}
              isTimerRunning={reactiveData.isTimerRunning}
            />

            {/* Validation Display */}
            <ValidationDisplayView
              validationStates={reactiveData.validationStates}
              hasValidationErrors={reactiveData.hasValidationErrors}
              formProgress={reactiveData.formProgress}
            />

            {/* Activity Log */}
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-medium text-gray-700 mb-3">📋 Activity Log</h4>
              <div className="max-h-64 overflow-y-auto bg-gray-50 rounded-md p-3">
                {logs.length === 0 ? (
                  <div className="text-gray-500 text-sm text-center py-4">
                    No activity yet. Try interacting with the components above!
                  </div>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, index) => (
                      <div key={index} className="text-xs text-gray-700 font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Real-time activity log showing 6-layer architecture interactions
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <ImperativeModal
          ref={handlerContext?.refRegistry?.confirmModal}
          title="Confirm Action"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              This is a confirm modal controlled via imperative ref API.
              The modal state is managed through the 6-layer architecture.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => actions.closeModal({ modalType: 'confirm' })}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  actions.closeModal({ modalType: 'confirm' });
                  actions.submitForm();
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </ImperativeModal>

        <ImperativeModal
          ref={handlerContext?.refRegistry?.alertModal}
          title="Alert"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Alert modal demonstrating imperative control patterns.
              Form validation failed - please check your inputs.
            </p>
            <button
              onClick={() => actions.closeModal({ modalType: 'alert' })}
              className="w-full px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
            >
              Close
            </button>
          </div>
        </ImperativeModal>
      </div>
    </div>
  );
}

// 🎯 Main Page Component - Integration Point
export default function ImperativeRefPage() {
  // Source file registration
  const imperativeRefPageOptions = React.useMemo(() => ({
    name: 'ImperativeRefPage (6-Layer Architecture)',
    description: '6-Layer Context Architecture with useImperativeHandle patterns',
    tags: ['6-layer-architecture', 'useImperativeHandle', 'ref-context', 'handler-injection'],
    priority: 60
  }), []);

  const refContextsOptions = React.useMemo(() => ({
    name: 'RefContexts',
    description: 'Centralized ref management with Context pattern and TypeScript interfaces',
    tags: ['ref-context', 'typescript', 'centralized-management'],
    priority: 55
  }), []);

  const imperativeComponentsOptions = React.useMemo(() => ({
    name: 'ImperativeComponents',
    description: 'Components implementing useImperativeHandle with custom ref interfaces',
    tags: ['useImperativeHandle', 'forwardRef', 'custom-ref-interface'],
    priority: 50
  }), []);

  useRegisterSourceFile(
    '/Users/junwoobang/project/context-action/example/src/pages/foundations/react/ImperativeRefPage6Layer.tsx',
    imperativeRefPageOptions
  );

  useRegisterSourceFile(
    '/Users/junwoobang/project/context-action/example/src/pages/foundations/react/imperativeRef/contexts/RefContexts.tsx',
    refContextsOptions
  );

  useRegisterSourceFile(
    '/Users/junwoobang/project/context-action/example/src/pages/foundations/react/imperativeRef/components/ImperativeComponents.tsx',
    imperativeComponentsOptions
  );

  // 🎯 6-Layer Architecture Integration
  return (
    <RefContextProvider>        {/* Layer 1: Contexts */}
      <ImperativeRefIntegration>
        <ImperativeRefHandlers    {/* Layer 3: Handlers */}
          onValidationChange={(field, isValid) => {
            console.log(`Handler: Field ${field} validation changed to ${isValid}`);
          }}
          onFormSubmit={(formData, isValid) => {
            console.log(`Handler: Form submission ${isValid ? 'successful' : 'failed'}`);
          }}
        >
          <ImperativeRefDemo />    {/* Layers 4, 5, 6: Actions, Hooks, Views */}
        </ImperativeRefHandlers>
      </ImperativeRefIntegration>
    </RefContextProvider>
  );
}