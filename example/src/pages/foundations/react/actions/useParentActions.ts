import { useCallback } from 'react';
import { useParentActionDispatch } from '../contexts/ParentContext';
import { PARENT_HANDLERS } from '../handlers/handler-registry';

// ==============================================
// PARENT DOMAIN - Action Dispatch (Context-Layered)
// ==============================================

/**
 * Parent Counter Actions - Dispatch + Callback Creation Only
 */
export function useParentCounterActions() {
  const dispatch = useParentActionDispatch();

  // Pure action dispatch functions - no business logic
  const incrementParentCounter = useCallback(() => 
    dispatch(PARENT_HANDLERS.INCREMENT_COUNTER.dispatchName), [dispatch]);
  
  const resetParentCounter = useCallback(() => 
    dispatch(PARENT_HANDLERS.RESET_COUNTER.dispatchName), [dispatch]);

  return { incrementParentCounter, resetParentCounter };
}

/**
 * Parent Control Actions - Dispatch + Callback Creation Only
 */
export function useParentControlActions() {
  const dispatch = useParentActionDispatch();

  // Pure action dispatch functions - no business logic
  const requestChildControl = useCallback((childId: string, action: 'increment' | 'reset', amount?: number) => 
    dispatch(PARENT_HANDLERS.REQUEST_CHILD_CONTROL.dispatchName, { childId, action, amount }), [dispatch]);

  return { requestChildControl };
}

/**
 * Parent Data Actions - Dispatch + Callback Creation Only
 */
export function useParentDataActions() {
  const dispatch = useParentActionDispatch();

  // Pure action dispatch functions - no business logic
  const registerChild = useCallback((childId: string, childType: string) => 
    dispatch(PARENT_HANDLERS.ON_CHILD_REGISTERED.dispatchName, { childId, childType }), [dispatch]);

  return { registerChild };
}
