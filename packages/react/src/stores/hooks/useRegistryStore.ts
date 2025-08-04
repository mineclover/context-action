import { useRegistry } from './useRegistry';
import type { IStore, IStoreRegistry } from '../core/types';

export function useRegistryStore(registry: IStoreRegistry, name: string): IStore | undefined {
  const stores = useRegistry(registry);
  const store = stores.find(([storeName]) => storeName === name)?.[1];
  
  
  return store;
}