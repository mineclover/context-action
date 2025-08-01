/**
 * @fileoverview Deprecated Store HOCs - Use hooks instead
 * 
 * Store-related HOCs have been removed in favor of more flexible hook-based patterns.
 * This migration improves type safety, reduces bundle size, and aligns with modern React patterns.
 * 
 * @implements deprecated-hoc-patterns
 * @memberof architecture-terms
 * @since 1.0.0
 * 
 * @migration
 * Store-related HOCs have been replaced with hook-based patterns:
 * 
 * // Instead of withStore:
 * // const MyComponent = withStore({ name: 'user', initialValue: {} })(Component);
 * 
 * // Use hooks:
 * const MyComponent = () => {
 *   const userStore = useLocalStore('user', {});
 *   const user = useStoreValue(userStore);
 *   return <div>{user.name}</div>;
 * };
 * 
 * // Instead of withManagedStore:
 * // const MyComponent = withManagedStore({ name: 'user', initialValue: {} })(Component);
 * 
 * // Use hooks:
 * const MyComponent = () => {
 *   const registry = useStoreRegistry();
 *   const userStore = useRegistryStore('user') || registry.register('user', createStore('user', {}));
 *   const user = useStoreValue(userStore);
 *   return <div>{user.name}</div>;
 * };
 * 
 * // Instead of withStoreData:
 * // const MyComponent = withStoreData({ name: (stores) => stores.user?.name })(Component);
 * 
 * // Use hooks:
 * const MyComponent = () => {
 *   const userStore = useRegistryStore('user');
 *   const user = useStoreValue(userStore);
 *   return <div>{user?.name}</div>;
 * };
 */


// withRegistryStores has been removed as it had complex type issues and limited usefulness.
// Use useRegistryStore hook instead for better type safety and simpler code:
//
// // Instead of:
// // const MyComponent = withRegistryStores(['user', 'settings'])(({ userStore, settingsStore }) => {
// //   const user = userStore?.getValue();
// //   const settings = settingsStore?.getValue();
// //   return <div>{user?.name} - {settings?.theme}</div>;
// // });
//
// // Use this pattern:
// const MyComponent = () => {
//   const userStore = useRegistryStore('user');
//   const settingsStore = useRegistryStore('settings');
//   const user = useStoreValue(userStore);
//   const settings = useStoreValue(settingsStore);
//   return <div>{user?.name} - {settings?.theme}</div>;
// };

