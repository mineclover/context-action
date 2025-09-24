/**
 * Views Layer - Pure UI Components for ImperativeRef Demo
 *
 * This layer contains pure UI components following the 6-Layer Architecture.
 * Views are responsible only for rendering and event handling, with no
 * business logic or direct ref manipulation.
 */

import React from 'react';
import { validateFormData, ValidationState } from '../business/imperativeRefBusinessLogic';

// 🎯 Demo Status Display Component
interface DemoStatusViewProps {
  formProgress: number;
  isFormValid: boolean;
  counterValue: number;
  counterAtMin: boolean;
  counterAtMax: boolean;
  timerDisplay: string;
  isTimerRunning: boolean;
  modalsOpen: {
    confirm: boolean;
    alert: boolean;
  };
}

export function DemoStatusView({
  formProgress,
  isFormValid,
  counterValue,
  counterAtMin,
  counterAtMax,
  timerDisplay,
  isTimerRunning,
  modalsOpen
}: DemoStatusViewProps) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">📊 Demo Status</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Form Status */}
        <div className="bg-white p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-600 mb-2">Form Status</h4>
          <div className="space-y-1">
            <div className={`text-sm ${isFormValid ? 'text-green-600' : 'text-red-600'}`}>
              {isFormValid ? '✅ Valid' : '❌ Invalid'}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${formProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-500">{Math.round(formProgress)}% Complete</div>
          </div>
        </div>

        {/* Counter Status */}
        <div className="bg-white p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-600 mb-2">Counter Status</h4>
          <div className="space-y-1">
            <div className="text-xl font-bold text-blue-600">{counterValue}</div>
            <div className="flex gap-1">
              {counterAtMin && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">MIN</span>}
              {counterAtMax && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">MAX</span>}
              {!counterAtMin && !counterAtMax && <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">OK</span>}
            </div>
          </div>
        </div>

        {/* Timer Status */}
        <div className="bg-white p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-600 mb-2">Timer Status</h4>
          <div className="space-y-1">
            <div className="text-xl font-mono font-bold text-blue-600">{timerDisplay}</div>
            <div className={`text-sm ${isTimerRunning ? 'text-green-600' : 'text-gray-500'}`}>
              {isTimerRunning ? '🔵 Running' : '⏸️ Stopped'}
            </div>
          </div>
        </div>

        {/* Modal Status */}
        <div className="bg-white p-3 rounded-lg">
          <h4 className="font-medium text-sm text-gray-600 mb-2">Modal Status</h4>
          <div className="space-y-1">
            <div className="flex gap-2">
              <span className={`text-xs px-2 py-1 rounded ${
                modalsOpen.confirm
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                Confirm {modalsOpen.confirm ? '👁️' : '👁️‍🗨️'}
              </span>
              <span className={`text-xs px-2 py-1 rounded ${
                modalsOpen.alert
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                Alert {modalsOpen.alert ? '⚠️' : '💤'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 Control Panel Component
interface ControlPanelViewProps {
  onFormSubmit: () => void;
  onFormReset: () => void;
  onFocusFirst: () => void;
  onValidateAll: () => void;
  onCounterIncrement: () => void;
  onCounterDecrement: () => void;
  onCounterReset: () => void;
  onTimerStart: () => void;
  onTimerStop: () => void;
  onTimerReset: () => void;
  onModalOpen: (modalType: 'confirm' | 'alert') => void;
  onModalClose: (modalType: 'confirm' | 'alert') => void;
  onResetAll: () => void;
  isFormValid: boolean;
  counterAtMin: boolean;
  counterAtMax: boolean;
  isTimerRunning: boolean;
}

export function ControlPanelView({
  onFormSubmit,
  onFormReset,
  onFocusFirst,
  onValidateAll,
  onCounterIncrement,
  onCounterDecrement,
  onCounterReset,
  onTimerStart,
  onTimerStop,
  onTimerReset,
  onModalOpen,
  onModalClose,
  onResetAll,
  isFormValid,
  counterAtMin,
  counterAtMax,
  isTimerRunning
}: ControlPanelViewProps) {
  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">🎮 Control Panel</h3>

      <div className="space-y-4">
        {/* Form Controls */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Form Controls</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onFormSubmit}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isFormValid
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-green-300 text-white cursor-not-allowed'
              }`}
              disabled={!isFormValid}
            >
              Submit Form
            </button>
            <button
              onClick={onFormReset}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              Reset Form
            </button>
            <button
              onClick={onFocusFirst}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium transition-colors"
            >
              Focus First
            </button>
            <button
              onClick={onValidateAll}
              className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm font-medium transition-colors"
            >
              Validate All
            </button>
          </div>
        </div>

        {/* Counter Controls */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Counter Controls</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onCounterIncrement}
              disabled={counterAtMax}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Increment (+)
            </button>
            <button
              onClick={onCounterDecrement}
              disabled={counterAtMin}
              className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Decrement (-)
            </button>
            <button
              onClick={onCounterReset}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              Reset Counter
            </button>
          </div>
        </div>

        {/* Timer Controls */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Timer Controls</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onTimerStart}
              disabled={isTimerRunning}
              className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Start Timer
            </button>
            <button
              onClick={onTimerStop}
              disabled={!isTimerRunning}
              className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Stop Timer
            </button>
            <button
              onClick={onTimerReset}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              Reset Timer
            </button>
          </div>
        </div>

        {/* Modal Controls */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Modal Controls</h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onModalOpen('confirm')}
              className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm font-medium transition-colors"
            >
              Open Confirm
            </button>
            <button
              onClick={() => onModalOpen('alert')}
              className="px-3 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-sm font-medium transition-colors"
            >
              Open Alert
            </button>
            <button
              onClick={() => onModalClose('confirm')}
              className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm font-medium transition-colors"
            >
              Close Confirm
            </button>
            <button
              onClick={() => onModalClose('alert')}
              className="px-3 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 text-sm font-medium transition-colors"
            >
              Close Alert
            </button>
          </div>
        </div>

        {/* Global Controls */}
        <div>
          <h4 className="font-medium text-sm text-gray-600 mb-2">Global Controls</h4>
          <button
            onClick={onResetAll}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
          >
            🔄 Reset Everything
          </button>
        </div>
      </div>
    </div>
  );
}

// 🎯 Code Examples Display Component
interface CodeExamplesViewProps {
  className?: string;
}

export function CodeExamplesView({ className = '' }: CodeExamplesViewProps) {
  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-800">💻 Code Examples</h3>
        <p className="text-sm text-gray-600 mt-1">
          useImperativeHandle pattern with 6-Layer Architecture
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic useImperativeHandle Example */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">🔧 Basic useImperativeHandle Pattern</h4>
          <div className="bg-gray-50 p-3 rounded-md">
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`// 🎯 Layer 6: Views - Imperative Component
const ImperativeInput = forwardRef<FormRefHandle, Props>((props, ref) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  // 🔑 useImperativeHandle: Custom ref interface
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    validate: () => validateValue(value),
    reset: () => setValue(''),
    getValue: () => value,
    setValue: (newValue) => setValue(newValue)
  }), [value]);

  return (
    <input
      ref={inputRef}
      value={value}
      onChange={e => setValue(e.target.value)}
      className={isValid ? 'border-green-500' : 'border-red-500'}
    />
  );
});`}
            </pre>
          </div>
        </div>

        {/* Handler Injection Pattern Example */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">💉 Layer 3: Handler Injection Pattern</h4>
          <div className="bg-gray-50 p-3 rounded-md">
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`// 🎯 Layer 3: Handlers - Handler with Dependency Injection
const handleFormSubmit = useCallback(() => {
  // 1️⃣ Handler Injection: Get current values from ref registry
  const currentFormData = {
    name: refRegistry.nameInput.current?.getValue() || '',
    email: refRegistry.emailInput.current?.getValue() || '',
    message: refRegistry.messageInput.current?.getValue() || ''
  };

  // 2️⃣ Layer 2: Pure Business Logic execution
  const validationResult = validateFormData(currentFormData);

  // 3️⃣ Side Effects: Handle validation results
  if (validationResult.isValid) {
    onFormSubmit?.(currentFormData, true);
  } else {
    // Focus first invalid field using ref registry
    refRegistry.focusFirstInput();
    refRegistry.alertModal.current?.open();
  }

  return validationResult;
}, [refRegistry, onFormSubmit]);`}
            </pre>
          </div>
        </div>

        {/* 6-Layer Architecture Example */}
        <div>
          <h4 className="font-medium text-sm text-gray-700 mb-2">🏗️ Complete 6-Layer Architecture Flow</h4>
          <div className="bg-gray-50 p-3 rounded-md">
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`// 🎯 Complete 6-Layer Data Flow with useImperativeHandle

// 📱 Layer 6: Views - User Interaction
<button onClick={() => actions.submitForm()}>Submit Form</button>

// 🚀 Layer 4: Actions - Dispatch with Type Safety
const actions = useImperativeRefActions(handlers, handlerMethods);
const submitForm = () => handlerMethods?.handleFormSubmit?.();

// ⚙️ Layer 3: Handlers - Injection Pattern
const handleFormSubmit = useCallback(() => {
  // Inject current ref values
  const formData = {
    name: refRegistry.nameInput.current?.getValue() || '',
    email: refRegistry.emailInput.current?.getValue() || ''
  };

  // Execute pure business logic
  const result = validateFormData(formData);

  // Handle side effects
  if (result.isValid) {
    onFormSubmit?.(formData, true);
  } else {
    refRegistry.focusFirstInput();
  }
}, [refRegistry, onFormSubmit]);

// 🧠 Layer 2: Business - Pure Functions
export function validateFormData(data) {
  return {
    isValid: data.name.length > 0 && data.email.includes('@'),
    errors: []
  };
}

// 🔗 Layer 5: Hooks - Reactive Data
const { formProgress, isFormValid } = useImperativeRefData();

// 🗄️ Layer 1: Contexts - Centralized Ref Management
<RefContextProvider>
  <ImperativeRefHandlers>
    <YourComponents />
  </ImperativeRefHandlers>
</RefContextProvider>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 Validation Display Component
interface ValidationDisplayViewProps {
  validationStates: ValidationState;
  hasValidationErrors: boolean;
  formProgress: number;
  className?: string;
}

export function ValidationDisplayView({
  validationStates,
  hasValidationErrors,
  formProgress,
  className = ''
}: ValidationDisplayViewProps) {
  return (
    <div className={`bg-white p-4 rounded-lg border ${className}`}>
      <h4 className="font-medium text-gray-700 mb-3">✅ Validation Status</h4>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Name Field:</span>
          <span className={`text-sm font-medium ${
            validationStates.name ? 'text-green-600' : 'text-red-600'
          }`}>
            {validationStates.name ? '✅ Valid' : '❌ Invalid'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Email Field:</span>
          <span className={`text-sm font-medium ${
            validationStates.email ? 'text-green-600' : 'text-red-600'
          }`}>
            {validationStates.email ? '✅ Valid' : '❌ Invalid'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Message Field:</span>
          <span className={`text-sm font-medium ${
            validationStates.message ? 'text-green-600' : 'text-red-600'
          }`}>
            {validationStates.message ? '✅ Valid' : '❌ Invalid'}
          </span>
        </div>

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-600">Overall:</span>
            <span className={`text-sm font-medium ${
              !hasValidationErrors ? 'text-green-600' : 'text-orange-600'
            }`}>
              {Math.round(formProgress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                !hasValidationErrors ? 'bg-green-500' : 'bg-orange-500'
              }`}
              style={{ width: `${formProgress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 🎯 Export all view components
export * from '../components/ImperativeComponents';