/**
 * Hooks Layer for Store Subscriptions - ImperativeRef Demo
 *
 * This layer provides reactive data subscriptions following the 6-Layer Architecture.
 * Hooks subscribe to ref state changes and provide computed/derived values
 * for the UI layer without directly accessing business logic.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FormData,
  formatTimerDisplay,
  isFormComplete,
  ValidationState,
  validateFormData,
} from '../business/imperativeRefBusinessLogic';
import { useRefRegistry } from '../contexts/RefContexts';

// 🎯 Reactive State Types
export interface ImperativeRefReactiveState {
  // Form state
  formValues: FormData;
  validationStates: ValidationState;
  isFormValid: boolean;
  isFormComplete: boolean;

  // Counter state
  counterValue: number;
  counterAtMin: boolean;
  counterAtMax: boolean;

  // Timer state
  timerTime: number;
  timerDisplay: string;
  isTimerRunning: boolean;

  // Modal state
  modalsOpen: {
    confirm: boolean;
    alert: boolean;
  };

  // Derived/computed state
  formProgress: number;
  allFieldsEmpty: boolean;
  hasValidationErrors: boolean;
}

/**
 * Main hook for ImperativeRef reactive data
 *
 * 🔑 Key Pattern: Store Subscriptions Layer
 * - Subscribes to ref state changes via polling/events
 * - Provides computed values using business logic functions
 * - Maintains reactive state for UI consumption
 * - No direct manipulation - read-only reactive data
 */
export function useImperativeRefData(): ImperativeRefReactiveState {
  const refRegistry = useRefRegistry();

  // 🎯 Reactive State Management
  const [formValues, setFormValues] = useState<FormData>({
    name: '',
    email: '',
    message: '',
  });

  const [validationStates, setValidationStates] = useState<ValidationState>({
    name: false,
    email: false,
    message: false,
  });

  const [counterValue, setCounterValue] = useState(0);
  const [timerTime, setTimerTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [modalsOpen, setModalsOpen] = useState({
    confirm: false,
    alert: false,
  });

  // 🎯 Ref State Polling (since refs don't emit events naturally)
  useEffect(() => {
    const pollInterval = setInterval(() => {
      // Poll form values
      const currentFormValues: FormData = {
        name: refRegistry.nameInput.current?.getValue() || '',
        email: refRegistry.emailInput.current?.getValue() || '',
        message: refRegistry.messageInput.current?.getValue() || '',
      };

      // Check if form values changed
      setFormValues((prev) => {
        if (
          prev.name !== currentFormValues.name ||
          prev.email !== currentFormValues.email ||
          prev.message !== currentFormValues.message
        ) {
          return currentFormValues;
        }
        return prev;
      });

      // Poll counter value
      const currentCounter = refRegistry.counter.current?.getValue() || 0;
      setCounterValue((prev) =>
        prev !== currentCounter ? currentCounter : prev
      );

      // Poll timer state
      const currentTimerTime = refRegistry.timer.current?.getTime() || 0;
      const currentTimerRunning =
        refRegistry.timer.current?.isRunning() || false;

      setTimerTime((prev) =>
        prev !== currentTimerTime ? currentTimerTime : prev
      );
      setIsTimerRunning((prev) =>
        prev !== currentTimerRunning ? currentTimerRunning : prev
      );

      // Poll modal states
      const currentModalStates = {
        confirm: refRegistry.confirmModal.current?.isOpen() || false,
        alert: refRegistry.alertModal.current?.isOpen() || false,
      };

      setModalsOpen((prev) => {
        if (
          prev.confirm !== currentModalStates.confirm ||
          prev.alert !== currentModalStates.alert
        ) {
          return currentModalStates;
        }
        return prev;
      });
    }, 100); // Poll every 100ms for smooth reactive updates

    return () => clearInterval(pollInterval);
  }, [refRegistry]);

  // 🎯 Reactive Validation State Updates
  useEffect(() => {
    // Update validation states based on current form values
    const validationResult = validateFormData(formValues);

    setValidationStates((prev) => {
      if (
        prev.name !== validationResult.fieldValidation.name ||
        prev.email !== validationResult.fieldValidation.email ||
        prev.message !== validationResult.fieldValidation.message
      ) {
        return validationResult.fieldValidation;
      }
      return prev;
    });
  }, [formValues]);

  // 🎯 Computed Values using Business Logic
  const computedState = useMemo(() => {
    // Form completion status
    const isFormCompleteValue = isFormComplete(validationStates);

    // Form validation status
    const formValidationResult = validateFormData(formValues);
    const isFormValid = formValidationResult.isValid;

    // Form progress calculation (0-100%)
    let validFieldCount = 0;
    if (validationStates.name) validFieldCount++;
    if (validationStates.email) validFieldCount++;
    if (validationStates.message) validFieldCount++;
    const formProgress = (validFieldCount / 3) * 100;

    // Check if all fields are empty
    const allFieldsEmpty =
      !formValues.name.trim() &&
      !formValues.email.trim() &&
      !formValues.message.trim();

    // Check for validation errors
    const hasValidationErrors =
      !validationStates.name ||
      !validationStates.email ||
      !validationStates.message;

    // Counter bounds checking
    const counterAtMin = counterValue <= 0;
    const counterAtMax = counterValue >= 100;

    // Timer display formatting
    const timerDisplay = formatTimerDisplay(timerTime);

    return {
      isFormComplete: isFormCompleteValue,
      isFormValid,
      formProgress,
      allFieldsEmpty,
      hasValidationErrors,
      counterAtMin,
      counterAtMax,
      timerDisplay,
    };
  }, [formValues, validationStates, counterValue, timerTime]);

  // 🎯 Return Complete Reactive State
  return {
    // Raw state
    formValues,
    validationStates,
    counterValue,
    timerTime,
    isTimerRunning,
    modalsOpen,

    // Computed state
    ...computedState,
  };
}

/**
 * Specialized hook for form-only data
 */
export function useImperativeRefFormData() {
  const fullData = useImperativeRefData();

  return {
    formValues: fullData.formValues,
    validationStates: fullData.validationStates,
    isFormValid: fullData.isFormValid,
    isFormComplete: fullData.isFormComplete,
    formProgress: fullData.formProgress,
    allFieldsEmpty: fullData.allFieldsEmpty,
    hasValidationErrors: fullData.hasValidationErrors,
  };
}

/**
 * Specialized hook for counter-only data
 */
export function useImperativeRefCounterData() {
  const fullData = useImperativeRefData();

  return {
    counterValue: fullData.counterValue,
    counterAtMin: fullData.counterAtMin,
    counterAtMax: fullData.counterAtMax,
  };
}

/**
 * Specialized hook for timer-only data
 */
export function useImperativeRefTimerData() {
  const fullData = useImperativeRefData();

  return {
    timerTime: fullData.timerTime,
    timerDisplay: fullData.timerDisplay,
    isTimerRunning: fullData.isTimerRunning,
  };
}

/**
 * Hook for modal state data
 */
export function useImperativeRefModalData() {
  const fullData = useImperativeRefData();

  return {
    modalsOpen: fullData.modalsOpen,
  };
}

/**
 * Hook for computed/derived data only
 */
export function useImperativeRefComputedData() {
  const fullData = useImperativeRefData();

  return {
    formProgress: fullData.formProgress,
    allFieldsEmpty: fullData.allFieldsEmpty,
    hasValidationErrors: fullData.hasValidationErrors,
    counterAtMin: fullData.counterAtMin,
    counterAtMax: fullData.counterAtMax,
    timerDisplay: fullData.timerDisplay,
  };
}

/**
 * Hook that provides reactive callbacks for state changes
 * Useful for side effects that need to respond to ref state changes
 */
export function useImperativeRefStateCallbacks(callbacks: {
  onFormValueChange?: (formValues: FormData) => void;
  onValidationChange?: (validationStates: ValidationState) => void;
  onCounterChange?: (value: number) => void;
  onTimerChange?: (time: number, isRunning: boolean) => void;
  onModalChange?: (modalsOpen: { confirm: boolean; alert: boolean }) => void;
}) {
  const reactiveState = useImperativeRefData();

  // Execute callbacks when state changes
  useEffect(() => {
    callbacks.onFormValueChange?.(reactiveState.formValues);
  }, [reactiveState.formValues, callbacks.onFormValueChange]);

  useEffect(() => {
    callbacks.onValidationChange?.(reactiveState.validationStates);
  }, [reactiveState.validationStates, callbacks.onValidationChange]);

  useEffect(() => {
    callbacks.onCounterChange?.(reactiveState.counterValue);
  }, [reactiveState.counterValue, callbacks.onCounterChange]);

  useEffect(() => {
    callbacks.onTimerChange?.(
      reactiveState.timerTime,
      reactiveState.isTimerRunning
    );
  }, [
    reactiveState.timerTime,
    reactiveState.isTimerRunning,
    callbacks.onTimerChange,
  ]);

  useEffect(() => {
    callbacks.onModalChange?.(reactiveState.modalsOpen);
  }, [reactiveState.modalsOpen, callbacks.onModalChange]);

  return reactiveState;
}

// 🎯 Type Exports
export type ImperativeRefDataHook = ReturnType<typeof useImperativeRefData>;
