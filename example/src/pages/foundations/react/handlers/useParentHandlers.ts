import { useCallback, useEffect } from 'react';
import { useParentActionHandler, useParentStoreManager } from '../contexts/ParentContext';
import { PARENT_HANDLERS } from './handler-registry';

// ==============================================
// PARENT HANDLERS - Context-Layered Architecture
// ==============================================

/**
 * Props-based dependencies for Parent handlers
 */
export interface ParentHandlerProps {
  moduleId: string;
  enableLogging?: boolean;
  onCounterChange?: (newValue: number) => void;
  onChildRegistered?: (childId: string, childType: string) => void;
}

/**
 * Parent Counter Handlers with Props-based DI
 */
export function useParentCounterHandlers(props: ParentHandlerProps) {
  const { moduleId, enableLogging = true, onCounterChange } = props;
  const storeManager = useParentStoreManager();

  // Increment Counter Handler
  const incrementCounterHandler = useCallback(async (payload: void, controller: any) => {
    const parentCounterStore = storeManager.getStore('parent-counter');
    const currentValue = parentCounterStore.getValue();
    const newValue = currentValue + 1;
    
    parentCounterStore.setValue(newValue);
    
    // Props-based callbacks
    onCounterChange?.(newValue);
    
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] Parent Counter 증가:`, { previousValue: currentValue, newValue });
    }
  }, [storeManager, moduleId, enableLogging, onCounterChange]);

  // Reset Counter Handler
  const resetCounterHandler = useCallback(async (payload: void, controller: any) => {
    const parentCounterStore = storeManager.getStore('parent-counter');
    const previousValue = parentCounterStore.getValue();
    
    parentCounterStore.setValue(0);
    
    // Props-based callbacks
    onCounterChange?.(0);
    
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] Parent Counter 리셋:`, { previousValue });
    }
  }, [storeManager, moduleId, enableLogging, onCounterChange]);

  // Register handlers with centralized IDs and priorities
  useParentActionHandler(
    PARENT_HANDLERS.INCREMENT_COUNTER.dispatchName as 'incrementParentCounter',
    incrementCounterHandler,
    { 
      id: `${moduleId}.${PARENT_HANDLERS.INCREMENT_COUNTER.id}`,
      priority: PARENT_HANDLERS.INCREMENT_COUNTER.priority
    }
  );

  useParentActionHandler(
    PARENT_HANDLERS.RESET_COUNTER.dispatchName as 'resetParentCounter',
    resetCounterHandler,
    { 
      id: `${moduleId}.${PARENT_HANDLERS.RESET_COUNTER.id}`,
      priority: PARENT_HANDLERS.RESET_COUNTER.priority
    }
  );

  // Debug logging
  useEffect(() => {
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] Parent Counter Handlers registered`);
    }
  }, [moduleId, enableLogging]);
}

/**
 * Parent Control Handlers with Props-based DI
 */
export function useParentControlHandlers(props: ParentHandlerProps) {
  const { moduleId, enableLogging = true } = props;

  // Request Child Control Handler
  const requestChildControlHandler = useCallback(async (
    payload: { childId: string; action: 'increment' | 'reset'; amount?: number }, 
    controller: any
  ) => {
    const { childId, action, amount } = payload;
    
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] 하위 컴포넌트 제어 요청:`, { childId, action, amount });
    }
    
    // This handler coordinates with child components
    // Child components should register their own control handlers
  }, [moduleId, enableLogging]);

  // Register handler
  useParentActionHandler(
    PARENT_HANDLERS.REQUEST_CHILD_CONTROL.dispatchName as 'requestChildControl',
    requestChildControlHandler,
    { 
      id: `${moduleId}.${PARENT_HANDLERS.REQUEST_CHILD_CONTROL.id}`,
      priority: PARENT_HANDLERS.REQUEST_CHILD_CONTROL.priority
    }
  );

  useEffect(() => {
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] Parent Control Handlers registered`);
    }
  }, [moduleId, enableLogging]);
}

/**
 * Parent Data Handlers with Props-based DI
 */
export function useParentDataHandlers(props: ParentHandlerProps) {
  const { moduleId, enableLogging = true, onChildRegistered } = props;
  const storeManager = useParentStoreManager();

  // Child Registration Handler
  const childRegisteredHandler = useCallback(async (
    payload: { childId: string; childType: string }, 
    controller: any
  ) => {
    const { childId, childType } = payload;
    
    // Props-based callback
    onChildRegistered?.(childId, childType);
    
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] 하위 컴포넌트 등록:`, { childId, childType });
    }
  }, [moduleId, enableLogging, onChildRegistered]);


  // Register handlers
  useParentActionHandler(
    PARENT_HANDLERS.ON_CHILD_REGISTERED.dispatchName as 'onChildRegistered',
    childRegisteredHandler,
    { 
      id: `${moduleId}.${PARENT_HANDLERS.ON_CHILD_REGISTERED.id}`,
      priority: PARENT_HANDLERS.ON_CHILD_REGISTERED.priority
    }
  );


  useEffect(() => {
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] Parent Data Handlers registered - storeManager:`, !!storeManager);
    }
  }, [moduleId, enableLogging, storeManager]);
}