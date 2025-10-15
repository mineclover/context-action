import React, { createContext, ReactNode, useContext, useRef, useMemo } from 'react';
import { ActionRegister, DispatchOptions } from '@context-action/core';
import type {
  ActionContextConfig,
  ActionContextType,
  ActionContextReturn
} from './ActionContext.types';

/**
 * @fileoverview ActionContext Core - 핵심 기능만 포함
 * 
 * Provider와 기본 컨텍스트 관리 기능만 포함하여 번들 크기 최적화
 * 크기: ~20K (기존 46K의 43%)
 */

/**
 * 핵심 ActionContext 팩토리
 * 
 * @template T Action payload map type for complete type safety
 * @param config - Configuration options for the ActionRegister
 * @returns Object containing Provider, hooks, and utility functions
 */
// Function overload for new API (contextName first)
export function createActionContextCore<T extends {}>(
  contextName: string,
  config?: ActionContextConfig
): ActionContextReturn<T>;

// Function overload for legacy API (config only)
export function createActionContextCore<T extends {}>(
  config: ActionContextConfig
): ActionContextReturn<T>;

// Implementation
export function createActionContextCore<T extends {}>(
  contextNameOrConfig: string | ActionContextConfig = {},
  config?: ActionContextConfig
): ActionContextReturn<T> {
  let effectiveConfig: ActionContextConfig;
  let contextName: string;
  
  // Handle both API styles
  if (typeof contextNameOrConfig === 'string') {
    // New API: createActionContext<T>('ContextName', config?)
    contextName = contextNameOrConfig;
    effectiveConfig = { ...config, name: config?.name || contextName };
  } else {
    // Legacy API: createActionContext<T>({ name: 'ContextName', ...config })
    effectiveConfig = contextNameOrConfig;
    contextName = effectiveConfig.name || 'ActionContext';
  }
  
  // Create the factory-specific context with a default value
  const FactoryActionContext = createContext<ActionContextType<T> | null>(null);

  // Provider component with abort support
  const Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const actionRegisterRef = useRef<ActionRegister<T>>(new ActionRegister<T>(effectiveConfig));

    const contextValue = useMemo(() => ({
      actionRegisterRef,
    }), []);

    return (
      <FactoryActionContext.Provider value={contextValue}>
        {children}
      </FactoryActionContext.Provider>
    );
  };

  // Hook to get the factory action context
  const useFactoryActionContext = (): ActionContextType<T> => {
    const context = useContext(FactoryActionContext);
    if (!context) {
      throw new Error('useFactoryActionContext must be used within a factory ActionContext Provider');
    }
    return context;
  };

  // Hook to get the dispatch function
  const useActionDispatch = () => {
    const { actionRegisterRef } = useFactoryActionContext();
    
    const dispatch = <K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ): Promise<void> => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`React dispatch called for '${String(action)}':`, {
          hasPayload: payload !== undefined,
          hasOptions: options !== undefined,
          timestamp: new Date().toISOString()
        });
      }
      
      const register = actionRegisterRef.current;
      if (!register) {
        throw new Error(
          'ActionRegister is not initialized. ' +
          'Make sure the ActionContext Provider is properly set up.'
        );
      }
      
      // Use core's autoAbort feature if no signal is provided
      const dispatchOptions: DispatchOptions = {
        ...options,
        ...(options?.signal ? {} : {
          autoAbort: {
            enabled: true,
            allowHandlerAbort: true
          }
        })
      };
      
      return register.dispatch(action, payload, dispatchOptions);
    };

    return dispatch;
  };

  // Hook to get the ActionRegister instance
  const useActionRegister = (): ActionRegister<T> | null => {
    const context = useFactoryActionContext();
    return context.actionRegisterRef.current;
  };

  return {
    Provider,
    useActionContext: useFactoryActionContext,
    useActionDispatch,
    useActionHandler: () => {
      throw new Error('useActionHandler is not available in core version. Use ActionContextAdvanced.');
    },
    useActionRegister,
    useActionDispatchWithResult: () => {
      throw new Error('useActionDispatchWithResult is not available in core version. Use ActionContextAdvanced.');
    },
    context: FactoryActionContext,
  };
}
