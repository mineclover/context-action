/**
 * @fileoverview Store HOC patterns for enhanced component composition
 * Higher-Order Components for connecting React components with stores
 */

import React, { useMemo } from 'react';
import { Store, createStore, ManagedStore, createManagedStore, StoreConfig } from './Store';
import { useStoreValue } from './hooks/useStoreValue';
import { useStoreRegistry } from '../StoreProvider';

/**
 * HOC that provides a specific store to a component
 * Creates a store instance and injects it as props
 * 
 * @template T - Store value type
 * @template P - Component props type
 * @param storeConfig - Store configuration
 * @returns HOC function
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * interface UserProfileProps {
 *   userStore: Store<User>;
 *   title: string;
 * }
 * 
 * // Create HOC with store
 * const withUserStore = withStore<User>({
 *   name: 'user',
 *   initialValue: { id: '', name: '', email: '' }
 * });
 * 
 * // Original component expects store as prop
 * const UserProfile = ({ userStore, title }: UserProfileProps) => {
 *   const user = useStoreValue(userStore);
 *   
 *   return (
 *     <div>
 *       <h1>{title}</h1>
 *       <p>{user.name}</p>
 *     </div>
 *   );
 * };
 * 
 * // Enhanced component with store injected
 * const EnhancedUserProfile = withUserStore(UserProfile);
 * 
 * // Usage - no need to pass store manually
 * <EnhancedUserProfile title="User Info" />
 * ```
 */
export function withStore<T>(
  storeConfig: { name: string; initialValue: T }
) {
  return function <P extends { [K in keyof P]: P[K] }>(
    WrappedComponent: React.ComponentType<P & { [storeName: string]: Store<T> }>
  ): React.FC<Omit<P, keyof { [storeName: string]: Store<T> }>> {
    const WithStore = (props: Omit<P, keyof { [storeName: string]: Store<T> }>) => {
      const store = useMemo(
        () => createStore(storeConfig.name, storeConfig.initialValue),
        [storeConfig.name]
      );

      const storeProps = {
        [`${storeConfig.name}Store`]: store,
      } as { [storeName: string]: Store<T> };

      return <WrappedComponent {...(props as P)} {...storeProps} />;
    };

    WithStore.displayName = `withStore(${storeConfig.name})(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithStore;
  };
}

/**
 * HOC that provides a managed store (auto-registered) to a component
 * Uses StoreRegistry for automatic registration and cleanup
 * 
 * @template T - Store value type
 * @template P - Component props type
 * @param storeConfig - Managed store configuration
 * @returns HOC function
 * 
 * @example
 * ```typescript
 * // Create HOC with managed store
 * const withManagedUserStore = withManagedStore<User>({
 *   name: 'user',
 *   initialValue: { id: '', name: '', email: '' },
 *   autoRegister: true
 * });
 * 
 * const UserProfile = ({ userStore }: { userStore: ManagedStore<User> }) => {
 *   const user = useStoreValue(userStore);
 *   return <div>{user.name}</div>;
 * };
 * 
 * const EnhancedUserProfile = withManagedUserStore(UserProfile);
 * 
 * // Usage within StoreProvider context
 * <StoreProvider>
 *   <EnhancedUserProfile />
 * </StoreProvider>
 * ```
 */
export function withManagedStore<T>(
  storeConfig: Omit<StoreConfig<T>, 'registry'>
) {
  return function <P extends { [K in keyof P]: P[K] }>(
    WrappedComponent: React.ComponentType<P & { [storeName: string]: ManagedStore<T> }>
  ): React.FC<Omit<P, keyof { [storeName: string]: ManagedStore<T> }>> {
    const WithManagedStore = (props: Omit<P, keyof { [storeName: string]: ManagedStore<T> }>) => {
      const registry = useStoreRegistry();
      
      const store = useMemo(() => {
        return createManagedStore({
          ...storeConfig,
          registry,
        });
      }, [registry, storeConfig.name]);

      const storeProps = {
        [`${storeConfig.name}Store`]: store,
      } as { [storeName: string]: ManagedStore<T> };

      return <WrappedComponent {...(props as P)} {...storeProps} />;
    };

    WithManagedStore.displayName = `withManagedStore(${storeConfig.name})(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithManagedStore;
  };
}

/**
 * HOC that connects a component to specific stores by name from registry
 * Retrieves stores from the registry and injects them as props
 * 
 * @param storeNames - Array of store names to connect
 * @returns HOC function
 * 
 * @example
 * ```typescript
 * interface ComponentProps {
 *   userStore: Store<User>;
 *   settingsStore: Store<Settings>;
 *   title: string;
 * }
 * 
 * // Create HOC that connects to multiple stores
 * const withStores = withRegistryStores(['user', 'settings']);
 * 
 * const Dashboard = ({ userStore, settingsStore, title }: ComponentProps) => {
 *   const user = useStoreValue(userStore);
 *   const settings = useStoreValue(settingsStore);
 *   
 *   return (
 *     <div>
 *       <h1>{title}</h1>
 *       <p>Hello {user.name}</p>
 *       <p>Theme: {settings.theme}</p>
 *     </div>
 *   );
 * };
 * 
 * const ConnectedDashboard = withStores(Dashboard);
 * 
 * // Usage - stores automatically injected
 * <StoreProvider registry={myRegistry}>
 *   <ConnectedDashboard title="My Dashboard" />
 * </StoreProvider>
 * ```
 */
export function withRegistryStores(storeNames: string[]) {
  return function <P extends { [K in keyof P]: P[K] }>(
    WrappedComponent: React.ComponentType<P>
  ): React.FC<P> {
    const WithRegistryStores = (props: P) => {
      const registry = useStoreRegistry();
      
      const storeProps = useMemo(() => {
        const stores: any = {};
        storeNames.forEach(name => {
          const store = registry.getStore(name);
          if (store) {
            stores[`${name}Store`] = store;
          }
        });
        return stores;
      }, [registry, storeNames]);

      return <WrappedComponent {...props} {...storeProps} />;
    };

    WithRegistryStores.displayName = `withRegistryStores([${storeNames.join(', ')}])(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithRegistryStores;
  };
}

/**
 * HOC that provides store values directly as props (not store instances)
 * Automatically subscribes to stores and passes values as props
 * 
 * @template T - Store value type mapping
 * @param storeConfig - Configuration mapping store names to selectors
 * @returns HOC function
 * 
 * @example
 * ```typescript
 * interface User {
 *   id: string;
 *   name: string;
 *   email: string;
 * }
 * 
 * interface Settings {
 *   theme: string;
 *   notifications: boolean;
 * }
 * 
 * interface ComponentProps {
 *   userName: string;
 *   userEmail: string;
 *   theme: string;
 *   title: string;
 * }
 * 
 * // Create HOC that maps store values to props
 * const withStoreValues = withStoreData<{
 *   userName: string;
 *   userEmail: string;
 *   theme: string;
 * }>({
 *   userName: (stores) => stores.user?.name || '',
 *   userEmail: (stores) => stores.user?.email || '',
 *   theme: (stores) => stores.settings?.theme || 'light',
 * });
 * 
 * const UserInfo = ({ userName, userEmail, theme, title }: ComponentProps) => (
 *   <div className={`theme-${theme}`}>
 *     <h1>{title}</h1>
 *     <p>Name: {userName}</p>
 *     <p>Email: {userEmail}</p>
 *   </div>
 * );
 * 
 * const ConnectedUserInfo = withStoreValues(UserInfo);
 * 
 * // Usage - values automatically derived from stores
 * <ConnectedUserInfo title="User Information" />
 * ```
 */
export function withStoreData<T extends Record<string, any>>(
  storeConfig: {
    [K in keyof T]: (stores: Record<string, any>) => T[K];
  }
) {
  return function <P extends { [K in keyof P]: P[K] }>(
    WrappedComponent: React.ComponentType<P & T>
  ): React.FC<Omit<P, keyof T>> {
    const WithStoreData = (props: Omit<P, keyof T>) => {
      const registry = useStoreRegistry();
      
      // Get all store values
      const storeValues = useMemo(() => {
        const stores: Record<string, any> = {};
        const storeNames = Object.keys(registry['stores'] || {});
        
        storeNames.forEach(name => {
          const store = registry.getStore(name);
          stores[name] = store?.getValue();
        });
        
        return stores;
      }, [registry]);

      // Apply selectors to get final props
      const derivedProps = useMemo(() => {
        const result: any = {};
        Object.entries(storeConfig).forEach(([key, selector]) => {
          result[key] = selector(storeValues);
        });
        return result as T;
      }, [storeValues]);

      return <WrappedComponent {...(props as P)} {...derivedProps} />;
    };

    WithStoreData.displayName = `withStoreData(${WrappedComponent.displayName || WrappedComponent.name})`;

    return WithStoreData;
  };
}