/**
 * Components with useImperativeHandle
 *
 * These components demonstrate advanced useImperativeHandle patterns:
 * - Custom ref interfaces with business logic
 * - Internal state management with external control
 * - Complex validation and interaction patterns
 * - Type-safe imperative APIs
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useState,
  useRef,
  useCallback,
  useEffect
} from 'react';
import {
  FormRefHandle,
  ModalRefHandle,
  CounterRefHandle,
  TimerRefHandle
} from '../contexts/RefContexts';

// 🎯 Enhanced Form Input with useImperativeHandle
interface ImperativeInputProps {
  label: string;
  placeholder?: string;
  type?: 'text' | 'email' | 'textarea';
  required?: boolean;
  minLength?: number;
  pattern?: string;
  className?: string;
  onValidationChange?: (isValid: boolean) => void;
}

export const ImperativeInput = forwardRef<FormRefHandle, ImperativeInputProps>(({
  label,
  placeholder,
  type = 'text',
  required = false,
  minLength = 0,
  pattern,
  className = '',
  onValidationChange,
}, ref) => {
  const [value, setValue] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Validation logic
  const validateValue = useCallback((val: string): boolean => {
    if (required && !val.trim()) {
      setErrorMessage(`${label} is required`);
      return false;
    }

    if (minLength > 0 && val.length < minLength) {
      setErrorMessage(`${label} must be at least ${minLength} characters`);
      return false;
    }

    if (type === 'email' && val) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        setErrorMessage('Please enter a valid email address');
        return false;
      }
    }

    if (pattern && val) {
      const regex = new RegExp(pattern);
      if (!regex.test(val)) {
        setErrorMessage(`${label} format is invalid`);
        return false;
      }
    }

    setErrorMessage('');
    return true;
  }, [label, required, minLength, type, pattern]);

  // Update validation when value changes
  useEffect(() => {
    const valid = validateValue(value);
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [value, validateValue, onValidationChange]);

  // 🔑 KEY: useImperativeHandle to expose custom API
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    validate: () => {
      setIsTouched(true);
      return validateValue(value);
    },
    reset: () => {
      setValue('');
      setIsTouched(false);
      setErrorMessage('');
      setIsValid(false);
    },
    getValue: () => value,
    setValue: (newValue: string) => {
      setValue(newValue);
      setIsTouched(true);
    },
  }), [value, validateValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValue(e.target.value);
    if (!isTouched) setIsTouched(true);
  };

  const showError = isTouched && !isValid && errorMessage;

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {type === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          rows={4}
          className={`
            w-full px-3 py-2 border rounded-md transition-colors
            ${showError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-50
          `}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`
            w-full px-3 py-2 border rounded-md transition-colors
            ${showError
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            focus:outline-none focus:ring-2 focus:ring-opacity-50
          `}
        />
      )}

      {showError && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}

      {isTouched && isValid && (
        <p className="text-sm text-green-600">✓ Valid</p>
      )}
    </div>
  );
});

ImperativeInput.displayName = 'ImperativeInput';

// 🎯 Modal Component with useImperativeHandle
interface ImperativeModalProps {
  title: string;
  children: React.ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}

export const ImperativeModal = forwardRef<ModalRefHandle, ImperativeModalProps>(({
  title,
  children,
  onOpen,
  onClose,
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);

  // 🔑 KEY: useImperativeHandle for modal control
  useImperativeHandle(ref, () => ({
    open: () => {
      setIsOpen(true);
      onOpen?.();
    },
    close: () => {
      setIsOpen(false);
      onClose?.();
    },
    toggle: () => {
      setIsOpen(prev => {
        const newState = !prev;
        if (newState) onOpen?.();
        else onClose?.();
        return newState;
      });
    },
    isOpen: () => isOpen,
  }), [isOpen, onOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => {
          setIsOpen(false);
          onClose?.();
        }}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 z-10">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              onClose?.();
            }}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          {children}
        </div>
      </div>
    </div>
  );
});

ImperativeModal.displayName = 'ImperativeModal';

// 🎯 Counter Component with useImperativeHandle
interface ImperativeCounterProps {
  initialValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  className?: string;
}

export const ImperativeCounter = forwardRef<CounterRefHandle, ImperativeCounterProps>(({
  initialValue = 0,
  min = -Infinity,
  max = Infinity,
  step = 1,
  onChange,
  className = '',
}, ref) => {
  const [count, setCount] = useState(initialValue);

  const updateCount = useCallback((newValue: number) => {
    const clampedValue = Math.max(min, Math.min(max, newValue));
    setCount(clampedValue);
    onChange?.(clampedValue);
  }, [min, max, onChange]);

  // 🔑 KEY: useImperativeHandle for counter control
  useImperativeHandle(ref, () => ({
    increment: () => updateCount(count + step),
    decrement: () => updateCount(count - step),
    reset: () => updateCount(initialValue),
    getValue: () => count,
    setValue: (value: number) => updateCount(value),
  }), [count, step, updateCount, initialValue]);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <button
        onClick={() => updateCount(count - step)}
        disabled={count <= min}
        className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        −
      </button>

      <div className="text-center">
        <div className="text-2xl font-bold text-gray-800">{count}</div>
        <div className="text-xs text-gray-500">
          Range: {min === -Infinity ? '−∞' : min} to {max === Infinity ? '∞' : max}
        </div>
      </div>

      <button
        onClick={() => updateCount(count + step)}
        disabled={count >= max}
        className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        +
      </button>
    </div>
  );
});

ImperativeCounter.displayName = 'ImperativeCounter';

// 🎯 Timer Component with useImperativeHandle
interface ImperativeTimerProps {
  onTick?: (time: number) => void;
  onStart?: () => void;
  onStop?: () => void;
  onReset?: () => void;
  className?: string;
}

export const ImperativeTimer = forwardRef<TimerRefHandle, ImperativeTimerProps>(({
  onTick,
  onStart,
  onStop,
  onReset,
  className = '',
}, ref) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      onStart?.();
      intervalRef.current = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1;
          onTick?.(newTime);
          return newTime;
        });
      }, 1000);
    }
  }, [isRunning, onStart, onTick]);

  const stopTimer = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      onStop?.();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isRunning, onStop]);

  const resetTimer = useCallback(() => {
    stopTimer();
    setTime(0);
    onReset?.();
  }, [stopTimer, onReset]);

  // 🔑 KEY: useImperativeHandle for timer control
  useImperativeHandle(ref, () => ({
    start: startTimer,
    stop: stopTimer,
    reset: resetTimer,
    getTime: () => time,
    isRunning: () => isRunning,
  }), [startTimer, stopTimer, resetTimer, time, isRunning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`text-center ${className}`}>
      <div className="text-4xl font-mono font-bold text-gray-800 mb-4">
        {formatTime(time)}
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={startTimer}
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Start
        </button>

        <button
          onClick={stopTimer}
          disabled={!isRunning}
          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Stop
        </button>

        <button
          onClick={resetTimer}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        Status: {isRunning ? '🔵 Running' : '⏸️ Stopped'}
      </div>
    </div>
  );
});

ImperativeTimer.displayName = 'ImperativeTimer';