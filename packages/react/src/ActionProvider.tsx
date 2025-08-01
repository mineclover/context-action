/**
 * @fileoverview ActionProvider - React Context Provider for Action dispatch
 * Provides centralized action dispatch functionality following ARCHITECTURE.md patterns
 */

import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { ActionRegister, ActionPayloadMap, ActionRegisterConfig } from '@context-action/core';

/**
 * Context type for Action dispatch system
 */
export interface ActionContextType<T extends ActionPayloadMap = ActionPayloadMap> {
  actionRegister: ActionRegister<T>;
  dispatch: ActionRegister<T>['dispatch'];
}

/**
 * Action Context - provides action dispatch functionality
 */
const ActionContext = createContext<ActionContextType<any> | null>(null);

/**
 * Props for ActionProvider component
 */
export interface ActionProviderProps {
  children: ReactNode;
  config?: ActionRegisterConfig;
}

/**
 * React context provider for action system
 * @implements actionprovider
 * @memberof api-terms
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   calculateTotal: void;
 * }
 * 
 * function App() {
 *   return (
 *     <StoreProvider>
 *       <ActionProvider config={{ logLevel: LogLevel.DEBUG }}>
 *         <UserProfile />
 *       </ActionProvider>
 *     </StoreProvider>
 *   );
 * }
 * ```
 */
export function ActionProvider({ children, config }: ActionProviderProps) {
  // Create ActionRegister instance once per provider
  const actionRegisterRef = useRef<ActionRegister<any>>();
  
  if (!actionRegisterRef.current) {
    actionRegisterRef.current = new ActionRegister(config);
  }

  const contextValue: ActionContextType<any> = {
    actionRegister: actionRegisterRef.current,
    dispatch: actionRegisterRef.current.dispatch,
  };

  return (
    <ActionContext.Provider value={contextValue}>
      {children}
    </ActionContext.Provider>
  );
}

/**
 * Hook to access ActionContext
 * @throws Error if used outside ActionProvider
 */
function useActionContext<T extends ActionPayloadMap = ActionPayloadMap>(): ActionContextType<T> {
  const context = useContext(ActionContext);
  
  if (!context) {
    throw new Error(
      'useActionContext must be used within an ActionProvider. ' +
      'Make sure your component is wrapped with <ActionProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to get action dispatch function
 * @implements action-dispatcher
 * @memberof api-terms
 * 
 * Following ARCHITECTURE.md pattern for component usage
 * 
 * @example
 * ```typescript
 * function UserProfile() {
 *   const dispatch = useActionDispatch<AppActions>();
 *   const user = useStoreValue(userStore);
 *   
 *   const updateName = (name: string) => {
 *     dispatch('updateUser', { id: user.id, name });
 *   };
 *   
 *   return (
 *     <div>
 *       <h1>{user.name}</h1>
 *       <button onClick={() => updateName('New Name')}>
 *         Update Name
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useActionDispatch<T extends ActionPayloadMap = ActionPayloadMap>(): ActionRegister<T>['dispatch'] {
  const { dispatch } = useActionContext<T>();
  return dispatch;
}

/**
 * Hook to get ActionRegister instance for handler registration
 * Following ARCHITECTURE.md pattern for action handler registration
 * 
 * @example
 * ```typescript
 * function useUserActions() {
 *   const actionRegister = useActionRegister<AppActions>();
 *   const registry = useStoreRegistry();
 *   
 *   useEffect(() => {
 *     const userStore = registry.getStore('user');
 *     const settingsStore = registry.getStore('settings');
 *     
 *     const unregister = actionRegister.register('updateUser', 
 *       async (payload, controller) => {
 *         const user = userStore.getValue();
 *         const settings = settingsStore.getValue();
 *         
 *         // Business logic
 *         if (settings.validateNames && !isValidName(payload.name)) {
 *           controller.abort('Invalid name');
 *           return;
 *         }
 *         
 *         userStore.setValue({
 *           ...user,
 *           ...payload,
 *           updatedAt: Date.now()
 *         });
 *       },
 *       { priority: 10, blocking: true }
 *     );
 *     
 *     return unregister;
 *   }, [registry]);
 * }
 * ```
 */
export function useActionRegister<T extends ActionPayloadMap = ActionPayloadMap>(): ActionRegister<T> {
  const { actionRegister } = useActionContext<T>();
  return actionRegister;
}

/**
 * Typed ActionProvider for specific action map
 * @template T - The action payload map type
 */
export function createTypedActionProvider<T extends ActionPayloadMap>() {
  return {
    Provider: ({ children, config }: ActionProviderProps) => (
      <ActionProvider config={config}>{children}</ActionProvider>
    ),
    useDispatch: () => useActionDispatch<T>(),
    useRegister: () => useActionRegister<T>(),
  };
}