/**
 * Handlers Layer with Injection Pattern for ImperativeRef Demo
 *
 * This layer implements the Handler Injection Pattern from 6-Layer Architecture:
 * 1. Handlers receive latest values via injection
 * 2. Execute pure business logic functions
 * 3. Handle side effects (ref manipulation, state updates)
 * 4. Coordinate between different ref components
 *
 * 🔑 Handler Registration Timing:
 *
 * Mount Logic vs Implementation Logic:
 * - **Mount Logic**: This component is instantiated when its parent mounts (Integration Point)
 * - **Implementation Logic**: Handler functions are registered/re-registered when dependencies change
 *
 * Registration happens in multiple places:
 * 1. Component Mount: When ImperativeRefHandlers component mounts
 * 2. Dependency Change: When props or internal state changes (useCallback dependencies)
 * 3. Conditional Logic: Based on runtime conditions or feature flags
 * 4. Lazy Registration: When async initialization completes
 *
 * The distinction allows for:
 * - Flexible handler lifecycle management
 * - Dynamic handler registration based on business requirements
 * - Separation of component lifecycle from business logic lifecycle
 */

import React, { useRef, ReactNode } from 'react';
import { useRefRegistry } from '../contexts/RefContexts';
import { validateFormData, FormData, ValidationState, ValidationResult, calculateCounterValue, calculateTimerState, TimerState } from '../business/imperativeRefBusinessLogic';

// 🎯 Handler Configuration Interface
export interface ImperativeRefHandlerConfig {
  onValidationChange?: (field: keyof ValidationState, isValid: boolean) => void;
  onFormSubmit?: (formData: FormData, isValid: boolean) => void;
  onCounterChange?: (value: number) => void;
  onTimerTick?: (time: number) => void;
  onModalToggle?: (modalType: 'confirm' | 'alert', isOpen: boolean) => void;
  children: ReactNode;
}

/**
 * Handlers Component implementing Handler Injection Pattern
 *
 * 🔑 Key Pattern: Handler Injection
 * - Handlers inject current ref values into pure business logic
 * - Side effects (ref manipulation) handled after business logic execution
 * - Cross-component coordination through centralized ref registry
 */
export function ImperativeRefHandlers({
  onValidationChange,
  onFormSubmit,
  onCounterChange,
  onTimerTick,
  onModalToggle,
  children
}: ImperativeRefHandlerConfig) {
  const refRegistry = useRefRegistry();

  // 🔑 Form Validation Handler with Injection
  const handleFieldValidation = (
    field: keyof ValidationState,
    isValid: boolean
  ) => {
    // 1️⃣ Handler Injection: Get current form state from refs
    const currentFormData: FormData = {
      name: refRegistry.nameInput.current?.getValue() || '',
      email: refRegistry.emailInput.current?.getValue() || '',
      message: refRegistry.messageInput.current?.getValue() || ''
    };

    // 2️⃣ Pure Business Logic: Validate form with current data
    const validationResult = validateFormData(currentFormData);

    // 3️⃣ Side Effects: Callback execution
    onValidationChange?.(field, isValid);

    // Return validation result for potential use
    return validationResult;
  };

  // 🔑 Form Submission Handler with Full Validation
  const handleFormSubmit = () => {
    // 1️⃣ Handler Injection: Get current values from all form refs
    const currentFormData: FormData = {
      name: refRegistry.nameInput.current?.getValue() || '',
      email: refRegistry.emailInput.current?.getValue() || '',
      message: refRegistry.messageInput.current?.getValue() || ''
    };

    // 2️⃣ Pure Business Logic: Full form validation
    const validationResult = validateFormData(currentFormData);

    // 3️⃣ Side Effects: Handle validation failures
    if (!validationResult.isValid) {
      // Focus first invalid field
      if (!validationResult.fieldValidation.name) {
        refRegistry.nameInput.current?.focus();
      } else if (!validationResult.fieldValidation.email) {
        refRegistry.emailInput.current?.focus();
      } else if (!validationResult.fieldValidation.message) {
        refRegistry.messageInput.current?.focus();
      }

      // Show alert modal with error
      refRegistry.alertModal.current?.open();
    }

    // 4️⃣ Side Effects: Callback with results
    onFormSubmit?.(currentFormData, validationResult.isValid);

    return validationResult;
  };

  // 🔑 Counter Operation Handler with Bounds Checking
  const handleCounterOperation = (
    operation: 'increment' | 'decrement' | 'reset' | 'set',
    setValue?: number
  ) => {
    // 1️⃣ Handler Injection: Get current counter value
    const currentValue = refRegistry.counter.current?.getValue() || 0;

    // 2️⃣ Pure Business Logic: Calculate new counter value
    // Convert 'reset' to 'set' with value 0 for business logic compatibility
    const businessOperation = operation === 'reset' ? 'set' : operation;
    const businessSetValue = operation === 'reset' ? 0 : setValue;

    const newValue = calculateCounterValue(currentValue, businessOperation, {
      step: 1,
      min: 0,
      max: 100,
      setValue: businessSetValue
    });

    // 3️⃣ Side Effects: Update counter ref
    refRegistry.counter.current?.setValue(newValue);

    // 4️⃣ Side Effects: Callback with new value
    onCounterChange?.(newValue);

    return newValue;
  };

  // 🔑 Timer Control Handler with State Management
  const handleTimerControl = (action: 'start' | 'stop' | 'reset') => {
    // 1️⃣ Handler Injection: Get current timer state
    const currentTime = refRegistry.timer.current?.getTime() || 0;
    const isCurrentlyRunning = refRegistry.timer.current?.isRunning() || false;

    // 2️⃣ Pure Business Logic: Calculate new timer state
    const newState = calculateTimerState(
      { time: currentTime, isRunning: isCurrentlyRunning },
      action
    );

    // 3️⃣ Side Effects: Execute timer ref methods
    switch (action) {
      case 'start':
        refRegistry.timer.current?.start();
        break;
      case 'stop':
        refRegistry.timer.current?.stop();
        break;
      case 'reset':
        refRegistry.timer.current?.reset();
        break;
    }

    // 4️⃣ Side Effects: Callback with new time
    onTimerTick?.(newState.time);

    return newState;
  };

  // 🔑 Modal Control Handler with State Coordination
  const handleModalControl = (
    modalType: 'confirm' | 'alert',
    action: 'open' | 'close' | 'toggle'
  ) => {
    // 1️⃣ Handler Injection: Get current modal state
    const modalRef = modalType === 'confirm'
      ? refRegistry.confirmModal.current
      : refRegistry.alertModal.current;

    const isCurrentlyOpen = modalRef?.isOpen() || false;

    // 2️⃣ Pure Business Logic: Determine new state
    let newState = isCurrentlyOpen;
    switch (action) {
      case 'open':
        newState = true;
        break;
      case 'close':
        newState = false;
        break;
      case 'toggle':
        newState = !isCurrentlyOpen;
        break;
    }

    // 3️⃣ Side Effects: Execute modal ref methods
    if (newState && !isCurrentlyOpen) {
      modalRef?.open();
    } else if (!newState && isCurrentlyOpen) {
      modalRef?.close();
    }

    // 4️⃣ Side Effects: Callback with new state
    onModalToggle?.(modalType, newState);

    return newState;
  };

  // 🔑 Batch Operations Handler - Cross-Component Coordination
  const handleBatchOperations = () => {
    // Complex handler that coordinates multiple refs
    return {
      // Form operations
      validateAllFields: () => refRegistry.validateAllInputs(),
      resetAllFields: () => refRegistry.resetAllInputs(),
      focusFirstField: () => refRegistry.focusFirstInput(),

      // Modal operations
      closeAllModals: () => refRegistry.closeAllModals(),

      // Component resets
      resetAllComponents: () => refRegistry.resetAllComponents(),

      // Combined operations
      submitForm: handleFormSubmit,
      resetAndFocus: () => {
        refRegistry.resetAllInputs();
        refRegistry.focusFirstInput();
      }
    };
  };

  // 🎯 Provider Context Value with Handler Injection Methods
  const handlerContext = {
    // Field validation with injection
    handleFieldValidation,

    // Form operations with full validation
    handleFormSubmit,

    // Counter operations with bounds checking
    handleCounterOperation,

    // Timer operations with state management
    handleTimerControl,

    // Modal operations with state coordination
    handleModalControl,

    // Batch operations for complex workflows
    batchOperations: handleBatchOperations(),

    // Direct ref registry access for advanced use cases
    refRegistry
  };

  // Create context for handlers (if needed)
  return (
    <>
      {/* Store handler context in ref for access from child components */}
      {React.cloneElement(children as React.ReactElement, {
        handlerContext
      } as any)}
    </>
  );
}

// 🎯 Handler Hook for accessing handler functions
export function useImperativeRefHandlers() {
  // This could be extended to use React Context if needed
  // For now, handlers are passed via props injection
  return {
    // Hook would provide handler functions if using Context pattern
    // Currently handlers are injected via props in the Handler component
  };
}

// 🎯 Handler Types Export for TypeScript
export type ImperativeRefHandlerMethods = {
  handleFieldValidation: (field: keyof ValidationState, isValid: boolean) => ValidationResult | undefined;
  handleFormSubmit: () => ValidationResult | undefined;
  handleCounterOperation: (operation: 'increment' | 'decrement' | 'reset' | 'set', setValue?: number) => number;
  handleTimerControl: (action: 'start' | 'stop' | 'reset') => TimerState;
  handleModalControl: (modalType: 'confirm' | 'alert', action: 'open' | 'close' | 'toggle') => boolean;
  batchOperations: {
    validateAllFields: () => boolean;
    resetAllFields: () => void;
    focusFirstField: () => void;
    closeAllModals: () => void;
    resetAllComponents: () => void;
    submitForm: () => ValidationResult | undefined;
    resetAndFocus: () => void;
  };
  refRegistry: ReturnType<typeof useRefRegistry>;
};