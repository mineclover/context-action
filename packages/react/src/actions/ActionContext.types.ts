/**
 * @fileoverview ActionContext Type Definitions
 * 
 * Core type definitions for the ActionContext system.
 * Only includes types that are actually used in ActionContext.tsx implementation.
 */

import { ReactNode } from 'react';
import { 
  ActionRegister, 
  ActionHandler, 
  HandlerConfig, 
  ActionRegisterConfig, 
  DispatchOptions, 
  ExecutionResult 
} from '@context-action/core';

/**
 * Configuration options for createActionContext
 */
export interface ActionContextConfig extends ActionRegisterConfig {
  /** Name identifier for this ActionRegister instance */
  name?: string;
}

/**
 * Context type for ActionRegister with enhanced type safety and abort support
 */
export interface ActionContextType<T extends {}> {
  actionRegisterRef: React.RefObject<ActionRegister<T>>;
}

/**
 * Return type for createActionContext with abort support
 */
export interface ActionContextReturn<T extends {}> {
  Provider: React.FC<{ children: ReactNode }>;
  useActionContext: () => ActionContextType<T>;
  useActionDispatch: () => ActionRegister<T>['dispatch'];
  useActionHandler: <K extends keyof T>(
    action: K,
    handler: ActionHandler<T[K]>,
    config?: HandlerConfig
  ) => void;
  useActionRegister: () => ActionRegister<T> | null;
  useActionDispatchWithResult: () => {
    dispatch: <K extends keyof T>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<void>;
    dispatchWithResult: <K extends keyof T, R = void>(
      action: K,
      payload?: T[K],
      options?: DispatchOptions
    ) => Promise<ExecutionResult<R>>;
    abortAll: () => void;
    resetAbortScope: () => void;
  };
  context: React.Context<ActionContextType<T> | null>;
}