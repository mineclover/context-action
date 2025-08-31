import { useCallback, useEffect } from 'react';
import { useParentActionHandler, useParentStoreManager } from '../contexts/ParentContext';
import { PARENT_HANDLERS } from './handler-registry';
import { useLogMonitor } from '@/components/LogMonitor/context';
import { LogLevel } from '@/utils/logger';

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
  const { addLog } = useLogMonitor();

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
      
      // LogMonitor에 로그 추가
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: `Parent Counter 증가: ${currentValue} → ${newValue}`,
        details: { action: 'incrementParentCounter', previousValue: currentValue, newValue, moduleId }
      });
    }
  }, [storeManager, moduleId, enableLogging, onCounterChange, addLog]);

  // Reset Counter Handler
  const resetCounterHandler = useCallback(async (payload: void, controller: any) => {
    const parentCounterStore = storeManager.getStore('parent-counter');
    const previousValue = parentCounterStore.getValue();
    
    parentCounterStore.setValue(0);
    
    // Props-based callbacks
    onCounterChange?.(0);
    
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] Parent Counter 리셋:`, { previousValue });
      
      // LogMonitor에 로그 추가
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: `Parent Counter 리셋: ${previousValue} → 0`,
        details: { action: 'resetParentCounter', previousValue, newValue: 0, moduleId }
      });
    }
  }, [storeManager, moduleId, enableLogging, onCounterChange, addLog]);

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
  const { addLog } = useLogMonitor();

  // Request Child Control Handler
  const requestChildControlHandler = useCallback(async (
    payload: { childId: string; action: 'increment' | 'reset'; amount?: number }, 
    controller: any
  ) => {
    const { childId, action, amount } = payload;
    
    if (enableLogging) {
      console.log(`🔄 [${moduleId}] 하위 컴포넌트 제어 요청:`, { childId, action, amount });
      
      // LogMonitor에 로그 추가
      addLog({
        level: LogLevel.INFO,
        type: 'action',
        message: `하위 컴포넌트 제어: ${childId} ${action}${amount ? ` +${amount}` : ''}`,
        details: { action: 'requestChildControl', childId, actionType: action, amount, moduleId }
      });
    }
    
    // This handler coordinates with child components
    // Child components should register their own control handlers
  }, [moduleId, enableLogging, addLog]);

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
  const { addLog } = useLogMonitor();

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
      
      // LogMonitor에 로그 추가
      addLog({
        level: LogLevel.DEBUG,
        type: 'system',
        message: `하위 컴포넌트 등록: ${childId} (${childType})`,
        details: { action: 'onChildRegistered', childId, childType, moduleId }
      });
    }
  }, [moduleId, enableLogging, onChildRegistered, addLog]);


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