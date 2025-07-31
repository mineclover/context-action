/**
 * @fileoverview StoreProvider - React Context Provider for Store Registry
 * Provides centralized store management following ARCHITECTURE.md patterns
 */

import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { StoreRegistry } from './store';

/**
 * Context type for Store registry system
 */
export interface StoreContextType {
  registry: StoreRegistry;
}

/**
 * Store Context - provides store registry functionality
 */
const StoreContext = createContext<StoreContextType | null>(null);

/**
 * Props for StoreProvider component
 */
export interface StoreProviderProps {
  children: ReactNode;
  registry?: StoreRegistry;
}

/**
 * StoreProvider - provides centralized store registry to child components
 * Following ARCHITECTURE.md pattern for Model layer access
 * 
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <StoreProvider>
 *       <ActionProvider>
 *         <UserProfile />
 *       </ActionProvider>
 *     </StoreProvider>
 *   );
 * }
 * 
 * function UserProfile() {
 *   const user = useStoreValue(userStore);
 *   const settings = useStoreValue(settingsStore);
 *   const dispatch = useActionDispatch();
 *   
 *   const updateUserName = (name: string) => {
 *     dispatch('updateUser', { id: user.id, name });
 *   };
 *   
 *   return (
 *     <div>
 *       <h1>{user.name}</h1>
 *       <input 
 *         value={user.name}
 *         onChange={(e) => updateUserName(e.target.value)}
 *       />
 *       <span>Theme: {settings.theme}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export function StoreProvider({ children, registry }: StoreProviderProps) {
  // Create StoreRegistry instance once per provider
  const registryRef = useRef<StoreRegistry>();
  
  if (!registryRef.current) {
    registryRef.current = registry || new StoreRegistry();
  }

  const contextValue: StoreContextType = {
    registry: registryRef.current,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Hook to access StoreContext
 * @throws Error if used outside StoreProvider
 */
function useStoreContext(): StoreContextType {
  const context = useContext(StoreContext);
  
  if (!context) {
    throw new Error(
      'useStoreContext must be used within a StoreProvider. ' +
      'Make sure your component is wrapped with <StoreProvider>.'
    );
  }
  
  return context;
}

/**
 * Hook to get store registry instance
 * Following ARCHITECTURE.md pattern for Model layer access
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
 *         // Read current state from Model layer
 *         const currentUser = userStore.getValue();
 *         const settings = settingsStore.getValue();
 *         
 *         // Business logic validation
 *         if (!permissions.canEditProfile) {
 *           controller.abort('Insufficient permissions');
 *           return;
 *         }
 *         
 *         if (settings.validateNames && !isValidName(payload.name)) {
 *           controller.abort('Invalid name format');
 *           return;
 *         }
 *         
 *         // Update Model layer
 *         const updatedUser = {
 *           ...currentUser,
 *           ...payload,
 *           lastModified: Date.now(),
 *           version: currentUser.version + 1
 *         };
 *         
 *         userStore.setValue(updatedUser);
 *       },
 *       { priority: 10, blocking: true }
 *     );
 *     
 *     return unregister;
 *   }, [registry]);
 * }
 * ```
 */
export function useStoreRegistry(): StoreRegistry {
  const { registry } = useStoreContext();
  return registry;
}

/**
 * Typed StoreProvider for specific registry setup
 */
export function createTypedStoreProvider() {
  return {
    Provider: ({ children, registry }: StoreProviderProps) => (
      <StoreProvider registry={registry}>{children}</StoreProvider>
    ),
    useRegistry: () => useStoreRegistry(),
  };
}