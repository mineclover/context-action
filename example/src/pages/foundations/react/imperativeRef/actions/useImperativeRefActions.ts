/**
 * Actions Layer for ImperativeRef Demo
 *
 * This layer provides action dispatch functions following the 6-Layer Architecture.
 * Actions coordinate between the UI layer and the handlers layer, providing
 * clean separation of concerns and type-safe interfaces.
 */

import { useCallback } from 'react';
import { ValidationState, FormData, ValidationResult, TimerState } from '../business/imperativeRefBusinessLogic';

// 🎯 Action Payload Types
export interface ImperativeRefActions {
  // Form actions
  validateField: {
    field: keyof ValidationState;
    isValid: boolean;
  };
  submitForm: void;
  resetForm: void;
  focusFirstField: void;

  // Counter actions
  incrementCounter: void;
  decrementCounter: void;
  resetCounter: void;
  setCounterValue: { value: number };

  // Timer actions
  startTimer: void;
  stopTimer: void;
  resetTimer: void;

  // Modal actions
  openModal: { modalType: 'confirm' | 'alert' };
  closeModal: { modalType: 'confirm' | 'alert' };
  toggleModal: { modalType: 'confirm' | 'alert' };

  // Batch actions
  resetAll: void;
  validateAll: void;
}

// 🎯 Action Handler Interface
export interface ImperativeRefActionHandlers {
  onFieldValidation?: (field: keyof ValidationState, isValid: boolean) => void;
  onFormSubmit?: (formData: FormData, isValid: boolean) => void;
  onCounterChange?: (value: number) => void;
  onTimerTick?: (time: number) => void;
  onModalToggle?: (modalType: 'confirm' | 'alert', isOpen: boolean) => void;
  onBatchReset?: () => void;
  onValidateAll?: (isValid: boolean) => void;
}

/**
 * Hook providing imperative ref action dispatch functions
 *
 * 🔑 Key Pattern: Action Dispatch Layer
 * - Provides type-safe action dispatch functions
 * - Coordinates with handlers layer via callback props
 * - Handles action result processing and callback execution
 * - Maintains clean separation from business logic
 */
export function useImperativeRefActions(
  handlers?: ImperativeRefActionHandlers,
  handlerMethods?: {
    handleFieldValidation?: (field: keyof ValidationState, isValid: boolean) => ValidationResult | undefined;
    handleFormSubmit?: () => ValidationResult | undefined;
    handleCounterOperation?: (operation: 'increment' | 'decrement' | 'reset' | 'set', setValue?: number) => number;
    handleTimerControl?: (action: 'start' | 'stop' | 'reset') => TimerState;
    handleModalControl?: (modalType: 'confirm' | 'alert', action: 'open' | 'close' | 'toggle') => boolean;
    batchOperations?: {
      validateAllFields: () => boolean;
      resetAllFields: () => void;
      focusFirstField: () => void;
      closeAllModals: () => void;
      resetAllComponents: () => void;
    };
  }
) {
  // 🎯 Form Actions
  const validateField = useCallback((payload: ImperativeRefActions['validateField']) => {
    const result = handlerMethods?.handleFieldValidation?.(payload.field, payload.isValid);
    handlers?.onFieldValidation?.(payload.field, payload.isValid);
    return result;
  }, [handlers?.onFieldValidation, handlerMethods?.handleFieldValidation]);

  const submitForm = useCallback(() => {
    const result = handlerMethods?.handleFormSubmit?.();
    if (result) {
      const currentFormData: FormData = {
        name: '',
        email: '',
        message: ''
      };
      handlers?.onFormSubmit?.(currentFormData, result.isValid);
    }
    return result;
  }, [handlers?.onFormSubmit, handlerMethods?.handleFormSubmit]);

  const resetForm = useCallback(() => {
    handlerMethods?.batchOperations?.resetAllFields();
  }, [handlerMethods?.batchOperations]);

  const focusFirstField = useCallback(() => {
    handlerMethods?.batchOperations?.focusFirstField();
  }, [handlerMethods?.batchOperations]);

  // 🎯 Counter Actions
  const incrementCounter = useCallback(() => {
    const newValue = handlerMethods?.handleCounterOperation?.('increment');
    if (newValue !== undefined) {
      handlers?.onCounterChange?.(newValue);
    }
    return newValue;
  }, [handlers?.onCounterChange, handlerMethods?.handleCounterOperation]);

  const decrementCounter = useCallback(() => {
    const newValue = handlerMethods?.handleCounterOperation?.('decrement');
    if (newValue !== undefined) {
      handlers?.onCounterChange?.(newValue);
    }
    return newValue;
  }, [handlers?.onCounterChange, handlerMethods?.handleCounterOperation]);

  const resetCounter = useCallback(() => {
    const newValue = handlerMethods?.handleCounterOperation?.('reset');
    if (newValue !== undefined) {
      handlers?.onCounterChange?.(newValue);
    }
    return newValue;
  }, [handlers?.onCounterChange, handlerMethods?.handleCounterOperation]);

  const setCounterValue = useCallback((payload: ImperativeRefActions['setCounterValue']) => {
    const newValue = handlerMethods?.handleCounterOperation?.('set', payload.value);
    if (newValue !== undefined) {
      handlers?.onCounterChange?.(newValue);
    }
    return newValue;
  }, [handlers?.onCounterChange, handlerMethods?.handleCounterOperation]);

  // 🎯 Timer Actions
  const startTimer = useCallback(() => {
    const newState = handlerMethods?.handleTimerControl?.('start');
    if (newState) {
      handlers?.onTimerTick?.(newState.time);
    }
    return newState;
  }, [handlers?.onTimerTick, handlerMethods?.handleTimerControl]);

  const stopTimer = useCallback(() => {
    const newState = handlerMethods?.handleTimerControl?.('stop');
    if (newState) {
      handlers?.onTimerTick?.(newState.time);
    }
    return newState;
  }, [handlers?.onTimerTick, handlerMethods?.handleTimerControl]);

  const resetTimer = useCallback(() => {
    const newState = handlerMethods?.handleTimerControl?.('reset');
    if (newState) {
      handlers?.onTimerTick?.(newState.time);
    }
    return newState;
  }, [handlers?.onTimerTick, handlerMethods?.handleTimerControl]);

  // 🎯 Modal Actions
  const openModal = useCallback((payload: ImperativeRefActions['openModal']) => {
    const newState = handlerMethods?.handleModalControl?.(payload.modalType, 'open');
    if (newState !== undefined) {
      handlers?.onModalToggle?.(payload.modalType, newState);
    }
    return newState;
  }, [handlers?.onModalToggle, handlerMethods?.handleModalControl]);

  const closeModal = useCallback((payload: ImperativeRefActions['closeModal']) => {
    const newState = handlerMethods?.handleModalControl?.(payload.modalType, 'close');
    if (newState !== undefined) {
      handlers?.onModalToggle?.(payload.modalType, newState);
    }
    return newState;
  }, [handlers?.onModalToggle, handlerMethods?.handleModalControl]);

  const toggleModal = useCallback((payload: ImperativeRefActions['toggleModal']) => {
    const newState = handlerMethods?.handleModalControl?.(payload.modalType, 'toggle');
    if (newState !== undefined) {
      handlers?.onModalToggle?.(payload.modalType, newState);
    }
    return newState;
  }, [handlers?.onModalToggle, handlerMethods?.handleModalControl]);

  // 🎯 Batch Actions
  const resetAll = useCallback(() => {
    handlerMethods?.batchOperations?.resetAllComponents();
    handlers?.onBatchReset?.();
  }, [handlers?.onBatchReset, handlerMethods?.batchOperations]);

  const validateAll = useCallback(() => {
    const isValid = handlerMethods?.batchOperations?.validateAllFields() || false;
    handlers?.onValidateAll?.(isValid);
    return isValid;
  }, [handlers?.onValidateAll, handlerMethods?.batchOperations]);

  // 🎯 Return Action Dispatch Functions
  return {
    // Form actions
    validateField,
    submitForm,
    resetForm,
    focusFirstField,

    // Counter actions
    incrementCounter,
    decrementCounter,
    resetCounter,
    setCounterValue,

    // Timer actions
    startTimer,
    stopTimer,
    resetTimer,

    // Modal actions
    openModal,
    closeModal,
    toggleModal,

    // Batch actions
    resetAll,
    validateAll,

    // Convenience methods for common patterns
    resetAndFocus: useCallback(() => {
      resetForm();
      focusFirstField();
    }, [resetForm, focusFirstField]),

    submitAndReset: useCallback(() => {
      const result = submitForm();
      if (result?.isValid) {
        resetForm();
      }
      return result;
    }, [submitForm, resetForm]),

    quickDemo: useCallback(() => {
      // Demo sequence for showcasing functionality
      return {
        runFormDemo: () => {
          focusFirstField();
          setTimeout(() => validateAll(), 1000);
        },
        runCounterDemo: () => {
          incrementCounter();
          setTimeout(() => decrementCounter(), 500);
          setTimeout(() => resetCounter(), 1000);
        },
        runTimerDemo: () => {
          startTimer();
          setTimeout(() => stopTimer(), 3000);
          setTimeout(() => resetTimer(), 4000);
        }
      };
    }, [focusFirstField, validateAll, incrementCounter, decrementCounter, resetCounter, startTimer, stopTimer, resetTimer])
  };
}

// 🎯 Type Exports for Consumer Components
export type ImperativeRefActionDispatch = ReturnType<typeof useImperativeRefActions>;