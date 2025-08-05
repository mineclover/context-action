/**
 * @fileoverview Context-Action Jotai Integration Package Entry Point
 * @implements jotai-integration
 * @implements atom-context-pattern
 * @implements atomic-state-management
 * @memberof packages
 * @version 1.0.0
 * 
 * Jotai integration package for the Context-Action framework, providing
 * Context-based atom sharing and management with enhanced developer experience.
 * 
 * This package bridges Jotai's atomic state management with React Context API,
 * enabling scoped atom sharing within component trees while maintaining
 * the reactive and performant nature of Jotai atoms.
 * 
 * Key Features:
 * - Context-scoped atom sharing for component tree isolation
 * - Enhanced hooks for atom state management and derivation
 * - Selective subscription patterns for performance optimization
 * - Integrated logging and debugging capabilities
 * - TypeScript-first design with full type safety
 * 
 * Architecture Benefits:
 * - Atomic granularity: Fine-grained reactivity at the atom level
 * - Context isolation: Scoped state management within providers
 * - Selective subscriptions: Subscribe only to needed atom changes
 * - Performance optimization: Minimal re-renders through atomic updates
 * 
 * @example
 * ```typescript
 * import { createAtomContext } from '@context-action/jotai';
 * 
 * // Create atom context for user state
 * const UserAtomContext = createAtomContext({ 
 *   id: '', 
 *   name: '', 
 *   email: '' 
 * });
 * 
 * // Root component with provider
 * function App() {
 *   return (
 *     <UserAtomContext.Provider>
 *       <UserProfile />
 *       <UserSettings />
 *     </UserAtomContext.Provider>
 *   );
 * }
 * 
 * // Component using atom state
 * function UserProfile() {
 *   const [user, setUser] = UserAtomContext.useAtomState();
 *   const userName = UserAtomContext.useAtomSelect(user => user.name);
 *   
 *   return (
 *     <div>
 *       <h1>{userName}</h1>
 *       <button onClick={() => setUser(prev => ({ ...prev, name: 'John' }))}>
 *         Update Name
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

import { atom, PrimitiveAtom } from 'jotai'
import React, { createContext, ReactNode, useContext, useMemo, useRef } from 'react'

import { useAtom, useAtomValue, useSetAtom } from 'jotai/react'
import { Logger, LogLevel, ConsoleLogger, getLogLevelFromEnv } from '@context-action/logger'

/**
 * Type alias for Jotai primitive atom
 * @memberof api-terms
 * @since 1.0.0
 */
type AtomType<T> = PrimitiveAtom<T>

/**
 * Internal context type for atom sharing
 * @internal
 * @memberof api-terms
 * @since 1.0.0
 */
interface AtomContextType<T> {
  atomRef: React.MutableRefObject<AtomType<T>>
  logger: Logger
}

/**
 * Configuration options for createAtomContext
 * @implements atom-context-config
 * @memberof api-terms
 * @since 1.0.0
 * 
 * Defines configuration options for atom context creation with logging support.
 * 
 * @example
 * ```typescript
 * const config: AtomContextConfig = {
 *   logger: createLogger(LogLevel.DEBUG),
 *   logLevel: LogLevel.DEBUG
 * };
 * 
 * const AtomContext = createAtomContext(initialValue, config);
 * ```
 */
export interface AtomContextConfig {
  /** Custom logger implementation. Defaults to ConsoleLogger */
  logger?: Logger
  /** Log level for the logger. Defaults to ERROR if not provided */
  logLevel?: LogLevel
}

/**
 * Create atom context for scoped atom sharing within component trees
 * @implements atom-context-pattern
 * @implements createatomcontext
 * @memberof core-concepts
 * @since 1.0.0
 * 
 * Factory function that creates a Context-based atom sharing system,
 * enabling scoped state management with Jotai atoms within React component trees.
 * 
 * @template T The type of the atom value
 * @param initialValue - Initial value for the atom
 * @param config - Optional configuration for logging and behavior
 * @returns Object containing Provider and atom manipulation hooks
 * 
 * @example
 * ```typescript
 * // Create typed atom context
 * interface UserState {
 *   id: string;
 *   name: string;
 *   email: string;
 *   preferences: {
 *     theme: 'light' | 'dark';
 *     notifications: boolean;
 *   };
 * }
 * 
 * const UserAtomContext = createAtomContext<UserState>({
 *   id: '',
 *   name: '',
 *   email: '',
 *   preferences: {
 *     theme: 'light',
 *     notifications: true
 *   }
 * });
 * 
 * // Use in component hierarchy
 * function App() {
 *   return (
 *     <UserAtomContext.Provider>
 *       <UserProfile />
 *       <UserSettings />
 *     </UserAtomContext.Provider>
 *   );
 * }
 * 
 * // Multiple usage patterns
 * function UserProfile() {
 *   // Full state access
 *   const [user, setUser] = UserAtomContext.useAtomState();
 *   
 *   // Read-only access
 *   const userName = UserAtomContext.useAtomReadOnly().name;
 *   
 *   // Selective subscription
 *   const theme = UserAtomContext.useAtomSelect(user => user.preferences.theme);
 *   
 *   // Write-only access
 *   const updateUser = UserAtomContext.useAtomSetter();
 *   
 *   return (
 *     <div>
 *       <h1>{userName}</h1>
 *       <p>Theme: {theme}</p>
 *       <button onClick={() => updateUser(prev => ({ 
 *         ...prev, 
 *         name: 'Updated Name' 
 *       }))}>
 *         Update
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function createAtomContext<T>(initialValue: T, config?: AtomContextConfig) {
  // Logger configuration with environment and config support
  const envLogLevel = config?.logLevel ?? getLogLevelFromEnv()
  const logger = config?.logger ?? new ConsoleLogger(envLogLevel)

  const AtomContext = createContext<AtomContextType<T> | null>(null)

  /**
   * Provider component for atom context sharing
   * @implements atom-provider
   * @memberof core-concepts
   * @since 1.0.0
   * 
   * Provides atom instance and logger to child components within the context tree.
   * Creates a new atom instance for each provider to ensure proper isolation.
   */
  const Provider = ({ children }: { children: ReactNode }) => {
    const atomRef = useRef(atom(initialValue)) as React.MutableRefObject<AtomType<T>>
    
    logger.debug('AtomContext Provider initialized', { 
      initialValue,
      logLevel: envLogLevel
    })
    
    return (
      <AtomContext.Provider value={{ atomRef, logger }}>
        {children}
      </AtomContext.Provider>
    )
  }

  /**
   * Hook to access atom context (internal use)
   * @internal
   * @throws Error when used outside Provider
   */
  const useAtomContext = () => {
    const context = useContext(AtomContext)
    if (!context) {
      throw new Error('useAtomContext must be used within Provider')
    }
    return context
  }

  /**
   * Hook that returns both atom value and setter
   * @implements useatomstate
   * @memberof api-terms
   * @since 1.0.0
   * 
   * Primary hook for full atom state management, returning both current value
   * and setter function for state updates.
   * 
   * @returns Tuple of [value, setValue] for complete atom state control
   * 
   * @example
   * ```typescript
   * function UserEditor() {
   *   const [user, setUser] = UserAtomContext.useAtomState();
   *   
   *   const handleUpdate = (field: string, value: any) => {
   *     setUser(prev => ({ ...prev, [field]: value }));
   *   };
   *   
   *   return (
   *     <form>
   *       <input 
   *         value={user.name} 
   *         onChange={e => handleUpdate('name', e.target.value)} 
   *       />
   *     </form>
   *   );
   * }
   * ```
   */
  const useAtomState = () => {
    const { atomRef, logger } = useAtomContext()
    const [value, setValue] = useAtom(atomRef.current)
    
    logger.debug('useAtomState called', { 
      atomValue: value,
      hasSetter: !!setValue 
    })
    
    return [value, setValue] as const
  }

  /**
   * Hook that returns read-only atom value
   * @implements useatomreadonly
   * @memberof api-terms
   * @since 1.0.0
   * 
   * Performance-optimized hook for read-only access to atom value,
   * ideal for display components that don't need to update state.
   * 
   * @returns Current atom value (read-only)
   * 
   * @example
   * ```typescript
   * function UserDisplay() {
   *   const user = UserAtomContext.useAtomReadOnly();
   *   
   *   return (
   *     <div>
   *       <h1>{user.name}</h1>
   *       <p>{user.email}</p>
   *     </div>
   *   );
   * }
   * ```
   */
  const useAtomReadOnly = () => {
    const { atomRef, logger } = useAtomContext()
    const value = useAtomValue(atomRef.current)
    
    logger.debug('useAtomReadOnly called', { atomValue: value })
    
    return value
  }

  /**
   * Hook for selective atom subscription with derived values
   * @implements useatomselect
   * @implements selective-subscription
   * @memberof api-terms
   * @since 1.0.0
   * 
   * Performance optimization hook that creates derived atoms for selective
   * subscriptions, minimizing re-renders by subscribing only to specific
   * parts of the atom state.
   * 
   * @template R The type of the derived value
   * @param callback - Selector function that derives value from atom state
   * @returns Derived value that updates only when selected portion changes
   * 
   * @example
   * ```typescript
   * function UserThemeDisplay() {
   *   // Only re-renders when theme changes, not other user properties
   *   const theme = UserAtomContext.useAtomSelect(user => user.preferences.theme);
   *   const notificationEnabled = UserAtomContext.useAtomSelect(
   *     user => user.preferences.notifications
   *   );
   *   
   *   return (
   *     <div className={`theme-${theme}`}>
   *       Notifications: {notificationEnabled ? 'On' : 'Off'}
   *     </div>
   *   );
   * }
   * ```
   */
  const useAtomSelect = <R,>(callback: (item: T) => R) => {
    const { atomRef, logger } = useAtomContext()
    const derivedAtom = useMemo(
      () => atom((get) => callback(get(atomRef.current))),
      [atomRef, callback]
    )
    const value = useAtomValue(derivedAtom)
    
    logger.debug('useAtomSelect called', { 
      originalValue: atomRef.current,
      derivedValue: value 
    })
    
    return value
  }

  /**
   * Hook that returns only the atom setter function
   * @implements useatomsetter
   * @memberof api-terms
   * @since 1.0.0
   * 
   * Write-only hook for components that need to update atom state
   * but don't need to subscribe to value changes, avoiding unnecessary re-renders.
   * 
   * @returns Setter function for atom state updates
   * 
   * @example
   * ```typescript
   * function UserActionButtons() {
   *   const setUser = UserAtomContext.useAtomSetter();
   *   
   *   const resetUser = () => {
   *     setUser({ id: '', name: '', email: '', preferences: defaultPrefs });
   *   };
   *   
   *   const toggleNotifications = () => {
   *     setUser(prev => ({
   *       ...prev,
   *       preferences: {
   *         ...prev.preferences,
   *         notifications: !prev.preferences.notifications
   *       }
   *     }));
   *   };
   *   
   *   return (
   *     <div>
   *       <button onClick={resetUser}>Reset</button>
   *       <button onClick={toggleNotifications}>Toggle Notifications</button>
   *     </div>
   *   );
   * }
   * ```
   */
  const useAtomSetter = () => {
    const { atomRef, logger } = useAtomContext()
    const setValue = useSetAtom(atomRef.current)
    
    logger.debug('useAtomSetter called', { 
      hasSetter: !!setValue 
    })
    
    return setValue
  }

  return {
    Provider,
    useAtomContext,
    useAtomState,
    useAtomReadOnly,
    useAtomSelect,
    useAtomSetter,
  }
}

