import { renderHook } from '@testing-library/react';
import { createRegistrySync, RegistryUtils } from '../../../src/stores/utils/registry-sync';
import { Store } from '../../../src/stores/core/Store';
import { StoreRegistry } from '../../../src/stores/core/StoreRegistry';

describe('registry-sync', () => {
  let registry: StoreRegistry;
  let userStore: Store<{ name: string; age: number }>;
  let settingsStore: Store<{ theme: string; notifications: boolean }>;

  beforeEach(() => {
    registry = new StoreRegistry('test-registry');
    userStore = new Store('user', { name: 'John', age: 25 });
    settingsStore = new Store('settings', { theme: 'dark', notifications: true });

    registry.register('user', userStore);
    registry.register('settings', settingsStore);
  });

  afterEach(() => {
    registry.dispose();
  });

  describe('createRegistrySync', () => {
    describe('useDynamicStore', () => {
      it('should get store value dynamically by name', () => {
        const { useDynamicStore } = createRegistrySync<{ name: string; age: number }>();

        const { result } = renderHook(() =>
          useDynamicStore(registry, 'user')
        );

        expect(result.current).toEqual({ name: 'John', age: 25 });
      });

      it('should return undefined for non-existent store', () => {
        const { useDynamicStore } = createRegistrySync();

        const { result } = renderHook(() =>
          useDynamicStore(registry, 'nonexistent')
        );

        expect(result.current).toBeUndefined();
      });

      it('should return undefined for null registry', () => {
        const { useDynamicStore } = createRegistrySync();

        const { result } = renderHook(() =>
          useDynamicStore(null, 'user')
        );

        expect(result.current).toBeUndefined();
      });

      it('should return undefined for undefined registry', () => {
        const { useDynamicStore } = createRegistrySync();

        const { result } = renderHook(() =>
          useDynamicStore(undefined, 'user')
        );

        expect(result.current).toBeUndefined();
      });

      it('should update when store value changes', () => {
        const { useDynamicStore } = createRegistrySync<{ name: string; age: number }>();

        const { result, rerender } = renderHook(() =>
          useDynamicStore(registry, 'user')
        );

        expect(result.current).toEqual({ name: 'John', age: 25 });

        // Update store value
        userStore.setValue({ name: 'Jane', age: 30 });
        rerender();

        expect(result.current).toEqual({ name: 'Jane', age: 30 });
      });

      it('should handle different store types', () => {
        const { useDynamicStore: useUserStore } = createRegistrySync<{ name: string; age: number }>();
        const { useDynamicStore: useSettingsStore } = createRegistrySync<{ theme: string; notifications: boolean }>();

        const { result: userResult } = renderHook(() =>
          useUserStore(registry, 'user')
        );

        const { result: settingsResult } = renderHook(() =>
          useSettingsStore(registry, 'settings')
        );

        expect(userResult.current).toEqual({ name: 'John', age: 25 });
        expect(settingsResult.current).toEqual({ theme: 'dark', notifications: true });
      });
    });
  });

  describe('RegistryUtils', () => {
    describe('getTypedStore', () => {
      it('should get typed store from registry', () => {
        const store = RegistryUtils.getTypedStore<{ name: string; age: number }>(
          registry,
          'user'
        );

        expect(store).toBe(userStore);
        expect(store?.getValue()).toEqual({ name: 'John', age: 25 });
      });

      it('should return undefined for non-existent store', () => {
        const store = RegistryUtils.getTypedStore(registry, 'nonexistent');
        expect(store).toBeUndefined();
      });

      it('should handle null registry', () => {
        const store = RegistryUtils.getTypedStore(null, 'user');
        expect(store).toBeUndefined();
      });

      it('should handle undefined registry', () => {
        const store = RegistryUtils.getTypedStore(undefined, 'user');
        expect(store).toBeUndefined();
      });

      it('should maintain type safety', () => {
        const store = RegistryUtils.getTypedStore<{ theme: string; notifications: boolean }>(
          registry,
          'settings'
        );

        expect(store).toBe(settingsStore);
        expect(store?.getValue()).toEqual({ theme: 'dark', notifications: true });
      });
    });

    describe('hasStore', () => {
      it('should return true for existing store', () => {
        expect(RegistryUtils.hasStore(registry, 'user')).toBe(true);
        expect(RegistryUtils.hasStore(registry, 'settings')).toBe(true);
      });

      it('should return false for non-existent store', () => {
        expect(RegistryUtils.hasStore(registry, 'nonexistent')).toBe(false);
      });

      it('should return false for null registry', () => {
        expect(RegistryUtils.hasStore(null, 'user')).toBe(false);
      });

      it('should return false for undefined registry', () => {
        expect(RegistryUtils.hasStore(undefined, 'user')).toBe(false);
      });

      it('should reflect changes when stores are added/removed', () => {
        const newStore = new Store('new', { value: 'test' });

        expect(RegistryUtils.hasStore(registry, 'new')).toBe(false);

        registry.register('new', newStore);
        expect(RegistryUtils.hasStore(registry, 'new')).toBe(true);

        registry.unregister('new');
        expect(RegistryUtils.hasStore(registry, 'new')).toBe(false);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should work with dynamic store switching', () => {
      const { useDynamicStore } = createRegistrySync();

      const { result, rerender } = renderHook(
        ({ storeName }) => useDynamicStore(registry, storeName),
        { initialProps: { storeName: 'user' } }
      );

      expect(result.current).toEqual({ name: 'John', age: 25 });

      // Switch to different store
      rerender({ storeName: 'settings' });
      expect(result.current).toEqual({ theme: 'dark', notifications: true });

      // Switch to non-existent store
      rerender({ storeName: 'nonexistent' });
      expect(result.current).toBeUndefined();
    });

    it('should handle registry replacement', () => {
      const newRegistry = new StoreRegistry('new-registry');
      const newStore = new Store('user', { name: 'Alice', age: 35 });
      newRegistry.register('user', newStore);

      const { useDynamicStore } = createRegistrySync<{ name: string; age: number }>();

      const { result, rerender } = renderHook(
        ({ reg }) => useDynamicStore(reg, 'user'),
        { initialProps: { reg: registry } }
      );

      expect(result.current).toEqual({ name: 'John', age: 25 });

      // Switch to new registry
      rerender({ reg: newRegistry });
      expect(result.current).toEqual({ name: 'Alice', age: 35 });

      newRegistry.dispose();
    });
  });
});