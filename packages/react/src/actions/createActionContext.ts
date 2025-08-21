/**
 * @fileoverview Simple Action Context for React Components
 * 
 * Provides a simple, clean action system similar to createRefContext style.
 * Offers core functionality without unnecessary complexity, following the
 * Action Only Pattern for pure action dispatching without state management.
 */

import React, { createContext, useContext, useEffect, useId, useMemo, useRef, ReactNode } from 'react';
import { ActionRegister, ActionHandler, HandlerConfig } from '@context-action/core';

/**
 * ActionContext 반환 타입 - 심플하고 명확한 API
 */
/**
 * Simple Action Context return type with clean, clear API
 * 
 * Provides a minimal interface for action dispatching and handler registration
 * following the Action Only Pattern. This is the return type from createActionContext.
 * 
 * @template T - Action payload mapping extending Record<string, any>
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 * 
 * @public
 */
export interface SimpleActionContextReturn<T extends Record<string, any>> {
  /** Provider component for action context */
  Provider: React.FC<{ children: ReactNode }>;
  
  /** Hook for dispatching actions */
  useAction: () => <K extends keyof T>(
    action: K,
    payload?: T[K]
  ) => Promise<void>;
  
  /** Hook for registering action handlers */
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  
  /** Context name identifier */
  contextName: string;
}

/**
 * Create a simple action context for React components
 * 
 * Creates a type-safe action context following the Action Only Pattern.
 * Provides action dispatching and handler registration without state management.
 * Perfect for event systems, command patterns, and UI interactions.
 * 
 * @template T - Action payload mapping interface
 * 
 * @param contextName - Unique name for this action context (used in error messages)
 * 
 * @returns SimpleActionContextReturn with Provider, hooks, and context name
 * 
 * @see https://mineclover.github.io/context-action/en/guide/patterns/action/basic-usage
 * 
 * @public
 */
export function createActionContext<T extends Record<string, any>>(
  contextName: string
): SimpleActionContextReturn<T> {
  
  // Context 타입 정의
  interface ActionContextValue {
    actionRegister: ActionRegister<T>;
  }
  
  // Context 생성
  const ActionContext = createContext<ActionContextValue | null>(null);
  
  // Provider 컴포넌트
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Create ActionRegister only once
    const actionRegister = useMemo(() => new ActionRegister<T>({ name: contextName }), []);
    
    const contextValue = useMemo<ActionContextValue>(() => ({
      actionRegister
    }), [actionRegister]);
    
    return React.createElement(
      ActionContext.Provider,
      { value: contextValue },
      children
    );
  };
  
  // Context hook
  const useActionContext = (): ActionContextValue => {
    const context = useContext(ActionContext);
    if (!context) {
      throw new Error(`useAction must be used within ${contextName}.Provider`);
    }
    return context;
  };
  
  // Action dispatch hook
  const useAction = () => {
    const { actionRegister } = useActionContext();
    
    return useMemo(() => {
      return <K extends keyof T>(action: K, payload?: T[K]) => {
        return actionRegister.dispatch(action, payload);
      };
    }, [actionRegister]);
  };
  
  // Action handler registration hook
  const useActionHandler = <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => {
    const { actionRegister } = useActionContext();
    const handlerRef = useRef(handler);
    const actionId = useId();
    
    // Update ref when handler changes
    handlerRef.current = handler;
    
    useEffect(() => {
      // Register handler
      const unregister = actionRegister.register(
        action,
        handlerRef.current,
        { ...config, id: actionId }
      );
      
      // Cleanup on unmount
      return unregister;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [action, actionId, actionRegister]);
  };
  
  return {
    Provider,
    useAction,
    useActionHandler,
    contextName
  };
}