/**
 * Ref Context System with useImperativeHandle Integration
 *
 * This demonstrates advanced ref management patterns:
 * - createRefContext for centralized ref management
 * - useImperativeHandle for custom ref interfaces
 * - Cross-component ref communication
 * - Type-safe ref handling
 */

import { createContext, useContext, useRef, ReactNode, RefObject } from 'react';

// 🎯 Ref Interface Definitions
export interface FormRefHandle {
  focus: () => void;
  validate: () => boolean;
  reset: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

export interface ModalRefHandle {
  open: () => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;
}

export interface CounterRefHandle {
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  getValue: () => number;
  setValue: (value: number) => void;
}

export interface TimerRefHandle {
  start: () => void;
  stop: () => void;
  reset: () => void;
  getTime: () => number;
  isRunning: () => boolean;
}

// 🎯 Ref Registry Interface
export interface RefRegistry {
  // Form refs
  nameInput: RefObject<FormRefHandle | null>;
  emailInput: RefObject<FormRefHandle | null>;
  messageInput: RefObject<FormRefHandle | null>;

  // Modal refs
  confirmModal: RefObject<ModalRefHandle | null>;
  alertModal: RefObject<ModalRefHandle | null>;

  // Interactive component refs
  counter: RefObject<CounterRefHandle | null>;
  timer: RefObject<TimerRefHandle | null>;

  // Helper methods
  focusFirstInput: () => void;
  validateAllInputs: () => boolean;
  resetAllInputs: () => void;
  closeAllModals: () => void;
  resetAllComponents: () => void;
}

// 🎯 Create Ref Context
const RefContext = createContext<RefRegistry | null>(null);

// 🎯 Custom Hook for accessing ref registry
export function useRefRegistry(): RefRegistry {
  const context = useContext(RefContext);
  if (!context) {
    throw new Error('useRefRegistry must be used within RefContextProvider');
  }
  return context;
}

// 🎯 Ref Context Provider
interface RefContextProviderProps {
  children: ReactNode;
}

export function RefContextProvider({ children }: RefContextProviderProps) {
  // Create refs for all components
  const nameInputRef = useRef<FormRefHandle>(null);
  const emailInputRef = useRef<FormRefHandle>(null);
  const messageInputRef = useRef<FormRefHandle>(null);

  const confirmModalRef = useRef<ModalRefHandle>(null);
  const alertModalRef = useRef<ModalRefHandle>(null);

  const counterRef = useRef<CounterRefHandle>(null);
  const timerRef = useRef<TimerRefHandle>(null);

  // 🎯 Helper Methods using refs (React 컴파일러가 자동으로 메모이제이션)
  const focusFirstInput = () => {
    nameInputRef.current?.focus();
  };

  const validateAllInputs = (): boolean => {
    const nameValid = nameInputRef.current?.validate() ?? false;
    const emailValid = emailInputRef.current?.validate() ?? false;
    const messageValid = messageInputRef.current?.validate() ?? false;

    return nameValid && emailValid && messageValid;
  };

  const resetAllInputs = () => {
    nameInputRef.current?.reset();
    emailInputRef.current?.reset();
    messageInputRef.current?.reset();
  };

  const closeAllModals = () => {
    confirmModalRef.current?.close();
    alertModalRef.current?.close();
  };

  const resetAllComponents = () => {
    resetAllInputs();
    closeAllModals();
    counterRef.current?.reset();
    timerRef.current?.reset();
  };

  const registry: RefRegistry = {
    // Refs
    nameInput: nameInputRef,
    emailInput: emailInputRef,
    messageInput: messageInputRef,
    confirmModal: confirmModalRef,
    alertModal: alertModalRef,
    counter: counterRef,
    timer: timerRef,

    // Helper methods
    focusFirstInput,
    validateAllInputs,
    resetAllInputs,
    closeAllModals,
    resetAllComponents,
  };

  return (
    <RefContext.Provider value={registry}>
      {children}
    </RefContext.Provider>
  );
}

// 🎯 Specific ref hooks for convenience
export function useFormRefs() {
  const registry = useRefRegistry();
  return {
    nameInput: registry.nameInput,
    emailInput: registry.emailInput,
    messageInput: registry.messageInput,
    focusFirstInput: registry.focusFirstInput,
    validateAllInputs: registry.validateAllInputs,
    resetAllInputs: registry.resetAllInputs,
  };
}

export function useModalRefs() {
  const registry = useRefRegistry();
  return {
    confirmModal: registry.confirmModal,
    alertModal: registry.alertModal,
    closeAllModals: registry.closeAllModals,
  };
}

export function useInteractiveRefs() {
  const registry = useRefRegistry();
  return {
    counter: registry.counter,
    timer: registry.timer,
    resetAllComponents: registry.resetAllComponents,
  };
}