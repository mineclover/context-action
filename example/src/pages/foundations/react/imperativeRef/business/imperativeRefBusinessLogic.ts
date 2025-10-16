/**
 * Pure Business Logic for ImperativeRef Demo
 *
 * This module contains pure functions that handle all business logic for
 * the useImperativeHandle demonstration without any side effects.
 * Following 6-layer architecture principles.
 */

// 🎯 Form Validation Business Logic
export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface FormData {
  name: string;
  email: string;
  message: string;
}

export interface ValidationState {
  name: boolean;
  email: boolean;
  message: boolean;
}

/**
 * Validates a single field based on its type and constraints
 */
export function validateField(
  value: string,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    type?: 'text' | 'email' | 'textarea';
    pattern?: string;
  }
): ValidationResult {
  const { required = false, minLength = 0, type = 'text', pattern } = options;

  if (required && !value.trim()) {
    return {
      isValid: false,
      errorMessage: `${fieldName} is required`,
    };
  }

  if (minLength > 0 && value.length < minLength) {
    return {
      isValid: false,
      errorMessage: `${fieldName} must be at least ${minLength} characters`,
    };
  }

  if (type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return {
        isValid: false,
        errorMessage: 'Please enter a valid email address',
      };
    }
  }

  if (pattern && value) {
    const regex = new RegExp(pattern);
    if (!regex.test(value)) {
      return {
        isValid: false,
        errorMessage: `${fieldName} format is invalid`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Validates all form fields and returns overall validation state (Strict mode)
 */
export function validateFormData(formData: FormData): {
  isValid: boolean;
  fieldValidation: ValidationState;
  errors: Record<keyof FormData, string>;
} {
  const nameValidation = validateField(formData.name, 'Name', {
    required: true,
    minLength: 2,
  });

  const emailValidation = validateField(formData.email, 'Email', {
    required: true,
    type: 'email',
  });

  const messageValidation = validateField(formData.message, 'Message', {
    required: true,
    minLength: 10,
  });

  const fieldValidation: ValidationState = {
    name: nameValidation.isValid,
    email: emailValidation.isValid,
    message: messageValidation.isValid,
  };

  const errors: Record<keyof FormData, string> = {
    name: nameValidation.errorMessage || '',
    email: emailValidation.errorMessage || '',
    message: messageValidation.errorMessage || '',
  };

  return {
    isValid:
      nameValidation.isValid &&
      emailValidation.isValid &&
      messageValidation.isValid,
    fieldValidation,
    errors,
  };
}

/**
 * Lenient validation for demonstration of Implementation Logic pattern
 * Shows how business logic can vary based on different requirements
 */
export function validateFormDataLenient(formData: FormData): {
  isValid: boolean;
  fieldValidation: ValidationState;
  errors: Record<keyof FormData, string>;
} {
  const nameValidation = validateField(formData.name, 'Name', {
    required: true,
    minLength: 1, // Lenient: only 1 character required
  });

  // Lenient email validation - just check for @ symbol
  const emailValidation = formData.email.includes('@')
    ? { isValid: true }
    : { isValid: false, errorMessage: 'Email must contain @ symbol' };

  const messageValidation = validateField(formData.message, 'Message', {
    required: true,
    minLength: 3, // Lenient: only 3 characters required
  });

  const fieldValidation: ValidationState = {
    name: nameValidation.isValid,
    email: emailValidation.isValid,
    message: messageValidation.isValid,
  };

  const errors: Record<keyof FormData, string> = {
    name: nameValidation.errorMessage || '',
    email: emailValidation.errorMessage || '',
    message: messageValidation.errorMessage || '',
  };

  return {
    isValid:
      nameValidation.isValid &&
      emailValidation.isValid &&
      messageValidation.isValid,
    fieldValidation,
    errors,
  };
}

// 🎯 Counter Business Logic
export interface CounterState {
  value: number;
  min: number;
  max: number;
  step: number;
}

/**
 * Pure function to calculate next counter value with bounds checking
 */
export function calculateCounterValue(
  currentValue: number,
  operation: 'increment' | 'decrement' | 'set',
  options: {
    step: number;
    min: number;
    max: number;
    setValue?: number;
  }
): number {
  const { step, min, max, setValue } = options;

  let newValue: number;

  switch (operation) {
    case 'increment':
      newValue = currentValue + step;
      break;
    case 'decrement':
      newValue = currentValue - step;
      break;
    case 'set':
      newValue = setValue ?? currentValue;
      break;
    default:
      newValue = currentValue;
  }

  return Math.max(min, Math.min(max, newValue));
}

// 🎯 Timer Business Logic
export interface TimerState {
  time: number;
  isRunning: boolean;
}

/**
 * Pure function to calculate next timer state
 */
export function calculateTimerState(
  currentState: TimerState,
  action: 'start' | 'stop' | 'reset' | 'tick'
): TimerState {
  switch (action) {
    case 'start':
      return { ...currentState, isRunning: true };
    case 'stop':
      return { ...currentState, isRunning: false };
    case 'reset':
      return { time: 0, isRunning: false };
    case 'tick':
      return currentState.isRunning
        ? { ...currentState, time: currentState.time + 1 }
        : currentState;
    default:
      return currentState;
  }
}

/**
 * Format timer seconds into MM:SS format
 */
export function formatTimerDisplay(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 🎯 Demo State Management
export interface DemoState {
  validationStates: ValidationState;
  formData: FormData;
  counterValue: number;
  timerState: TimerState;
  modalStates: {
    confirm: boolean;
    alert: boolean;
  };
}

/**
 * Calculate initial demo state
 */
export function createInitialDemoState(): DemoState {
  return {
    validationStates: {
      name: false,
      email: false,
      message: false,
    },
    formData: {
      name: '',
      email: '',
      message: '',
    },
    counterValue: 0,
    timerState: {
      time: 0,
      isRunning: false,
    },
    modalStates: {
      confirm: false,
      alert: false,
    },
  };
}

/**
 * Pure function to update validation state
 */
export function updateValidationState(
  currentStates: ValidationState,
  field: keyof ValidationState,
  isValid: boolean
): ValidationState {
  return {
    ...currentStates,
    [field]: isValid,
  };
}

/**
 * Check if all form fields are valid
 */
export function isFormComplete(validationStates: ValidationState): boolean {
  return (
    validationStates.name && validationStates.email && validationStates.message
  );
}
