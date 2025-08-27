/**
 * 테스트용 Store Registry 유틸리티
 */

import { StoreRegistry } from '../stores/core/StoreRegistry';
import { Store } from '../stores/core/Store';
import { MockStore } from './mock-store';

/**
 * 테스트용 StoreRegistry 생성 헬퍼
 */
export function createTestRegistry(name: string = 'test-registry'): StoreRegistry {
  return new StoreRegistry(name);
}

/**
 * 테스트용 Registry와 Store들을 함께 생성하는 헬퍼
 */
export function createRegistryWithStores<T extends Record<string, any>>(
  storeConfigs: { [K in keyof T]: { initialValue: T[K]; isMock?: boolean } },
  registryName: string = 'test-registry'
): {
  registry: StoreRegistry;
  stores: { [K in keyof T]: Store<T[K]> | MockStore<T[K]> };
} {
  const registry = createTestRegistry(registryName);
  const stores = {} as { [K in keyof T]: Store<T[K]> | MockStore<T[K]> };

  for (const [storeName, config] of Object.entries(storeConfigs)) {
    const store = config.isMock 
      ? new MockStore({ 
          initialValue: config.initialValue, 
          name: storeName,
          enableLogging: process.env.NODE_ENV === 'test'
        })
      : new Store(storeName, config.initialValue);
    
    stores[storeName as keyof T] = store;
    registry.register(storeName, store, {
      tags: ['test'],
      description: `Test store: ${storeName}`
    });
  }

  return { registry, stores };
}