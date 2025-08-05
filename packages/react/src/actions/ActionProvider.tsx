/**
 * @fileoverview ActionProvider - Simple React Context Provider for Action dispatch
 * Provides basic action dispatch functionality for simple applications and quick prototypes
 * 
 * **For enhanced type safety and complex applications, use createActionContext instead.**
 * 
 * @implements viewmodel-layer
 * @implements mvvm-pattern  
 * @memberof architecture-terms
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
export const ActionContext = createContext<ActionContextType<any> | null>(null);

/**
 * Props for ActionProvider component
 */
export interface ActionProviderProps {
  children: ReactNode;
  config?: ActionRegisterConfig;
}

/**
 * Simple React context provider for action system
 * 
 * **Recommended for**: Simple applications, quick prototypes, flexible typing needs
 * **For complex apps**: Use createActionContext for enhanced type safety and automatic inference
 * 
 * @implements actionprovider
 * @implements viewmodel-layer
 * @implements mvvm-pattern
 * @memberof api-terms
 * 
 * ## Key Characteristics:
 * - **Manual Type Annotations**: Requires `useActionDispatch<T>()` type parameters
 * - **Flexible Typing**: Easy to switch between different action types
 * - **Simple Setup**: Straightforward Provider/hook pattern
 * - **Quick Development**: Minimal boilerplate for basic usage
 * 
 * ## Usage Patterns:
 * ```typescript
 * // 1. Define action types
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   calculateTotal: void;
 * }
 * 
 * // 2. Setup providers
 * function App() {
 *   return (
 *     <StoreProvider>
 *       <ActionProvider config={{ logLevel: LogLevel.DEBUG }}>
 *         <UserProfile />
 *       </ActionProvider>
 *     </StoreProvider>
 *   );
 * }
 * 
 * // 3. Use in components (manual type annotation required)
 * function UserProfile() {
 *   const dispatch = useActionDispatch<AppActions>(); // ← Type annotation needed
 *   const userStore = AppStores.useStore('user', { name: '', email: '' });
 *   const user = useStoreValue(userStore);
 *   
 *   return (
 *     <div>
 *       <h1>{user.name}</h1>
 *       <button onClick={() => dispatch('updateUser', { id: '1', name: 'John' })}>
 *         Update User
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * ## When to use ActionProvider vs createActionContext:
 * - **ActionProvider**: Simple apps, flexible typing, quick prototypes
 * - **createActionContext**: Complex apps, strong typing needs, team development
 */
export function ActionProvider({ children, config }: ActionProviderProps) {
  // Create ActionRegister instance once per provider
  const actionRegisterRef = useRef<ActionRegister<any>>();
  
  if (!actionRegisterRef.current) {
    actionRegisterRef.current = new ActionRegister(config);
  }

  const contextValue: ActionContextType<any> = {
    actionRegister: actionRegisterRef.current,
    dispatch: actionRegisterRef.current.dispatch.bind(actionRegisterRef.current),
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
export function useActionContext<T extends ActionPayloadMap = ActionPayloadMap>(): ActionContextType<T> {
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
 * Hook to get action dispatch function with manual type annotation
 * 
 * **Note**: Requires manual type parameter `<T>` for each usage.
 * For automatic type inference, use createActionContext instead.
 * 
 * @implements action-dispatcher
 * @implements useactiondispatch
 * @implements view-layer
 * @implements mvvm-pattern
 * @memberof api-terms
 * 
 * @example
 * ```typescript
 * function UserProfile() {
 *   const dispatch = useActionDispatch<AppActions>(); // ← Manual type annotation required
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
 * @implements useactionregister
 * @memberof core-concepts
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
 * @template T The action payload map type
 */
export function createTypedActionProvider<T extends ActionPayloadMap>(): {
  Provider: (props: ActionProviderProps) => React.JSX.Element;
  useDispatch: () => ActionRegister<T>['dispatch'];
  useRegister: () => ActionRegister<T>;
} {
  return {
    Provider: ({ children, config }: ActionProviderProps) => (
      <ActionProvider config={config}>{children}</ActionProvider>
    ),
    useDispatch: () => useActionDispatch<T>(),
    useRegister: () => useActionRegister<T>(),
  };
}

/**
 * HOC pattern for ActionProvider
 * Higher-Order Component that wraps any component with ActionProvider
 * 
 * @example
 * ```typescript
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 *   calculateTotal: void;
 * }
 * 
 * // Create HOC with specific config
 * const withActions = withActionProvider<AppActions>({
 *   logLevel: LogLevel.DEBUG
 * });
 * 
 * // Use as decorator/wrapper
 * const App = withActions(() => (
 *   <div>
 *     <UserProfile />
 *     <Calculator />
 *   </div>
 * ));
 * 
 * // Or wrap existing component
 * const EnhancedUserProfile = withActions(UserProfile);
 * ```
 */
export function withActionProvider<T extends ActionPayloadMap = ActionPayloadMap>(
  config?: ActionRegisterConfig
) {
  const { Provider } = createTypedActionProvider<T>();
  
  return function <P extends {}>(
    WrappedComponent: React.ComponentType<P>
  ): React.FC<P> {
    const WithActionProvider = (props: P) => (
      <Provider config={config}>
        <WrappedComponent {...props} />
      </Provider>
    );
    
    WithActionProvider.displayName = `withActionProvider(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return WithActionProvider;
  };
}

/**
 * Combined setup with ActionProvider and Context Store Pattern
 * 
 * **Recommended**: Use createActionContext with Context Store Pattern for enhanced type safety:
 * 
 * @example
 * ```typescript
 * // Enhanced type safety approach (recommended)
 * interface AppActions extends ActionPayloadMap {
 *   updateUser: { id: string; name: string };
 * }
 * 
 * const { Provider: ActionProviderTyped } = createActionContext<AppActions>();
 * const AppStores = createContextStorePattern('App');
 * 
 * function App() {
 *   return (
 *     <AppStores.Provider>
 *       <ActionProviderTyped>
 *         <UserProfile />
 *         <ShoppingCart />
 *       </ActionProviderTyped>
 *     </AppStores.Provider>
 *   );
 * }
 * ```
 */