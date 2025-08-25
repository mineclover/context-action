/**
 * @fileoverview Provider composition utilities for managing multiple contexts
 * @implements provider-composition
 * @memberof store-utilities
 * 
 * Utilities for composing multiple Provider components to reduce nesting
 * and improve maintainability when dealing with many split contexts.
 */

import React from 'react';

/**
 * Type for Provider components that accept children
 */
export type ProviderComponent = React.ComponentType<{ children: React.ReactNode }>;

/**
 * Composes multiple Provider components into a single Provider component that accepts children.
 * Uses React.createElement for direct provider nesting without HOC overhead.
 * 
 * @example
 * ```tsx
 * // Without composition - nested Provider hell
 * function App() {
 *   return (
 *     <UserProvider>
 *       <ProductProvider>
 *         <OrderProvider>
 *           <UIProvider>
 *             <AppContent />
 *           </UIProvider>
 *         </OrderProvider>
 *       </ProductProvider>
 *     </UserProvider>
 *   );
 * }
 * 
 * // With composition - clean and maintainable
 * const AllProviders = composeProviders(
 *   UserProvider,
 *   ProductProvider,
 *   OrderProvider,
 *   UIProvider
 * );
 * 
 * function App() {
 *   return (
 *     <AllProviders>
 *       <AppContent />
 *     </AllProviders>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Conditional composition based on features
 * const providers = [
 *   CoreProvider,
 *   featureFlags.auth && AuthProvider,
 *   featureFlags.analytics && AnalyticsProvider
 * ].filter(Boolean) as ProviderComponent[];
 * 
 * const AppProviders = composeProviders(...providers);
 * 
 * function App() {
 *   return (
 *     <AppProviders>
 *       <Routes />
 *     </AppProviders>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Domain-grouped composition
 * const BusinessProviders = composeProviders(
 *   UserModelProvider,
 *   ProductModelProvider,
 *   OrderModelProvider
 * );
 * 
 * const InfrastructureProviders = composeProviders(
 *   DataModelProvider,
 *   CacheModelProvider,
 *   LoggerModelProvider
 * );
 * 
 * const AllProviders = composeProviders(
 *   InfrastructureProviders,
 *   BusinessProviders
 * );
 * 
 * function App() {
 *   return (
 *     <AllProviders>
 *       <AppContent />
 *     </AllProviders>
 *   );
 * }
 * ```
 * 
 * @example
 * ```tsx
 * // Environment-specific composition
 * function createEnvironmentProviders() {
 *   const isDevelopment = process.env.NODE_ENV === 'development';
 *   const isProduction = process.env.NODE_ENV === 'production';
 *   
 *   const providers = [
 *     UserModelProvider,
 *     ProductModelProvider,
 *     OrderModelProvider
 *   ];
 *   
 *   if (isDevelopment) {
 *     providers.push(DebugModelProvider, DevToolsModelProvider);
 *   }
 *   
 *   if (isProduction) {
 *     providers.push(AnalyticsModelProvider, ErrorTrackingModelProvider);
 *   }
 *   
 *   return composeProviders(...providers);
 * }
 * 
 * function App() {
 *   const EnvironmentProviders = createEnvironmentProviders();
 *   
 *   return (
 *     <EnvironmentProviders>
 *       <AppContent />
 *     </EnvironmentProviders>
 *   );
 * }
 * ```
 * 
 * @param providers - Array of Provider components to compose
 * @returns A single Provider component that wraps children with all providers
 */
export function composeProviders(
  ...providers: ProviderComponent[]
): ProviderComponent {
  return ({ children }: { children: React.ReactNode }) => {
    return providers.reduceRight(
      (children, Provider) => React.createElement(Provider, null, children),
      children
    );
  };
}